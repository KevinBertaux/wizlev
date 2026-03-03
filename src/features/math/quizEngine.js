import { createRefillBag, randomIndex, shuffleList } from '../common/questionBag';

const FACTOR_VALUES = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const DEFAULT_MODE = 'mixed';
const DEFAULT_DIFFICULTY = 'standard';

export const MULTIPLICATION_DIFFICULTY_PRESETS = Object.freeze({
  discovery: Object.freeze({
    id: 'discovery',
    label: 'Découverte',
    roundsPerCycle: 1,
    finiteSession: true,
    reviewOrder: 'fifo',
    cycleQuestionLimit: 0,
  }),
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard',
    roundsPerCycle: 2,
    finiteSession: true,
    reviewOrder: 'fifo',
    cycleQuestionLimit: 0,
  }),
  reinforced: Object.freeze({
    id: 'reinforced',
    label: 'Renforcé',
    roundsPerCycle: 3,
    finiteSession: true,
    reviewOrder: 'shuffle',
    cycleQuestionLimit: 0,
  }),
  infinite: Object.freeze({
    id: 'infinite',
    label: 'Infini',
    roundsPerCycle: 1,
    finiteSession: false,
    reviewOrder: 'shuffle',
    cycleQuestionLimit: 12,
  }),
});

function toQuestion(num1, num2) {
  return {
    num1,
    num2,
    answer: num1 * num2,
  };
}

function questionKey(question) {
  return `${question.num1}x${question.num2}`;
}

function normalizeTableValue(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 11) {
    return null;
  }
  return parsed;
}

export function normalizeTablesInput(input = 'all') {
  if (input === 'all') {
    return [...FACTOR_VALUES];
  }

  const values = Array.isArray(input) ? input : [input];
  const seen = new Set();
  const normalized = [];

  for (const value of values) {
    const table = normalizeTableValue(value);
    if (table === null || seen.has(table)) {
      continue;
    }
    seen.add(table);
    normalized.push(table);
  }

  return normalized.sort((a, b) => a - b);
}

export function resolveMultiplicationDifficulty(difficulty = DEFAULT_DIFFICULTY) {
  const key = String(difficulty || DEFAULT_DIFFICULTY);
  return MULTIPLICATION_DIFFICULTY_PRESETS[key] || MULTIPLICATION_DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY];
}

function createQuestionsForTables(tables) {
  const questions = [];
  for (const num1 of tables) {
    for (const num2 of FACTOR_VALUES) {
      questions.push(toQuestion(num1, num2));
    }
  }
  return questions;
}

function buildOrderedQuestions(tables, randomFn) {
  const questions = [];
  for (const table of tables) {
    const factors = shuffleList(FACTOR_VALUES, randomFn);
    for (const num2 of factors) {
      questions.push(toQuestion(table, num2));
    }
  }
  return questions;
}

function buildRoundQuestions(tables, mode, randomFn) {
  if (mode === 'ordered') {
    return buildOrderedQuestions(tables, randomFn);
  }
  return shuffleList(createQuestionsForTables(tables), randomFn);
}

function avoidImmediateRepeat(questions, lastKey) {
  if (!lastKey || questions.length <= 1) {
    return questions;
  }
  const nextIndex = questions.findIndex((question) => questionKey(question) !== lastKey);
  if (nextIndex > 0) {
    const [nextQuestion] = questions.splice(nextIndex, 1);
    questions.unshift(nextQuestion);
  }
  return questions;
}

function randomQuestionFromTables(tables, randomFn = Math.random) {
  const safeTables = tables.length > 0 ? tables : [...FACTOR_VALUES];
  const num1 = safeTables[randomIndex(safeTables.length, randomFn)];
  const num2 = FACTOR_VALUES[randomIndex(FACTOR_VALUES.length, randomFn)];
  return toQuestion(num1, num2);
}

function randomQuestionAvoidingKey(tables, avoidKey, randomFn = Math.random) {
  const safeTables = tables.length > 0 ? tables : [...FACTOR_VALUES];
  const uniqueCount = safeTables.length * FACTOR_VALUES.length;
  if (!avoidKey || uniqueCount <= 1) {
    return randomQuestionFromTables(safeTables, randomFn);
  }

  for (let attempts = 0; attempts < 40; attempts += 1) {
    const candidate = randomQuestionFromTables(safeTables, randomFn);
    if (questionKey(candidate) !== avoidKey) {
      return candidate;
    }
  }

  const fallback = createQuestionsForTables(safeTables).find((question) => questionKey(question) !== avoidKey);
  return fallback || randomQuestionFromTables(safeTables, randomFn);
}

export function generateQuestion(tableSelect = 'all', randomFn = Math.random) {
  const tables = normalizeTablesInput(tableSelect);
  return randomQuestionFromTables(tables, randomFn);
}

function buildCycleQuestions({ tables, mode, roundsPerCycle, randomFn, lastServedKey }) {
  const safeRoundsPerCycle = Math.max(1, Number.parseInt(roundsPerCycle, 10) || 1);
  const cycle = [];

  for (let round = 0; round < safeRoundsPerCycle; round += 1) {
    const chunk = buildRoundQuestions(tables, mode, randomFn);
    const anchor = cycle.length > 0 ? questionKey(cycle[cycle.length - 1]) : lastServedKey;
    cycle.push(...avoidImmediateRepeat(chunk, anchor));
  }

  return avoidImmediateRepeat(cycle, lastServedKey);
}

export function createMultiplicationQuestionBag(tableSelect = 'all', randomFn = Math.random) {
  const tables = normalizeTablesInput(tableSelect);
  const safeTables = tables.length > 0 ? tables : [...FACTOR_VALUES];
  const baseQuestions = createQuestionsForTables(safeTables);
  let lastKey = '';

  const bag = createRefillBag({
    refill: () => {
      const shuffled = shuffleList(baseQuestions, randomFn);
      return avoidImmediateRepeat(shuffled, lastKey);
    },
    fallback: () => randomQuestionFromTables(safeTables, randomFn),
  });

  return {
    next() {
      const question = bag.next();
      if (!question) {
        return generateQuestion(tableSelect, randomFn);
      }
      lastKey = questionKey(question);
      return question;
    },
  };
}

export function createMultiplicationQuizSession({
  tables = [],
  mode = DEFAULT_MODE,
  difficulty = DEFAULT_DIFFICULTY,
  reviewErrorsEnabled = true,
  randomFn = Math.random,
} = {}) {
  const normalizedTables = normalizeTablesInput(tables);
  const safeMode = mode === 'ordered' ? 'ordered' : 'mixed';
  const difficultyPreset = resolveMultiplicationDifficulty(difficulty);
  const roundsPerCycle = difficultyPreset.roundsPerCycle;
  const finiteSession = difficultyPreset.finiteSession;
  const reviewOrder = difficultyPreset.reviewOrder === 'shuffle' ? 'shuffle' : 'fifo';
  const cycleQuestionLimit = Math.max(0, Number.parseInt(difficultyPreset.cycleQuestionLimit, 10) || 0);

  let mainQueue = [];
  let infiniteBacklog = [];
  let reviewQueue = [];
  let reviewPool = new Map();
  let phase = 'main';
  let completed = false;
  let cycleCount = 0;
  let lastServedKey = '';

  function withMainMetadata(question) {
    return {
      ...question,
      source: 'main',
      reviewRemaining: 0,
    };
  }

  function canStartNewCycle() {
    return !finiteSession || cycleCount === 0;
  }

  function refillMainQueue() {
    if (normalizedTables.length === 0 || !canStartNewCycle()) {
      return false;
    }

    if (!finiteSession && cycleQuestionLimit > 0) {
      mainQueue = [];
      while (mainQueue.length < cycleQuestionLimit) {
        if (infiniteBacklog.length === 0) {
          const anchor = mainQueue.length > 0 ? questionKey(mainQueue[mainQueue.length - 1]) : lastServedKey;
          infiniteBacklog = buildCycleQuestions({
            tables: normalizedTables,
            mode: safeMode,
            roundsPerCycle,
            randomFn,
            lastServedKey: anchor,
          });
        }

        if (infiniteBacklog.length === 0) {
          break;
        }

        const needed = cycleQuestionLimit - mainQueue.length;
        mainQueue.push(...infiniteBacklog.splice(0, needed));
      }
      mainQueue = avoidImmediateRepeat(mainQueue, lastServedKey);
    } else {
      mainQueue = buildCycleQuestions({
        tables: normalizedTables,
        mode: safeMode,
        roundsPerCycle,
        randomFn,
        lastServedKey,
      });
    }

    cycleCount += 1;
    return mainQueue.length > 0;
  }

  function nextMainQuestion() {
    if (mainQueue.length === 0 && !refillMainQueue()) {
      return null;
    }

    const question = mainQueue.shift() || null;
    if (!question) {
      const fallback = randomQuestionFromTables(normalizedTables, randomFn);
      lastServedKey = questionKey(fallback);
      return withMainMetadata(fallback);
    }
    lastServedKey = questionKey(question);
    return withMainMetadata(question);
  }

  function startReviewPhaseIfNeeded() {
    if (!reviewErrorsEnabled || reviewPool.size === 0) {
      return false;
    }
    reviewQueue =
      reviewOrder === 'shuffle' ? shuffleList([...reviewPool.values()], randomFn) : [...reviewPool.values()];
    reviewPool = new Map();
    phase = 'review';
    return reviewQueue.length > 0;
  }

  function next() {
    if (normalizedTables.length === 0 || completed) {
      return null;
    }

    if (phase === 'review' && reviewQueue.length === 0) {
      phase = 'main';
    }

    if (phase === 'main' && mainQueue.length === 0) {
      if (!startReviewPhaseIfNeeded() && !canStartNewCycle()) {
        completed = true;
        return null;
      }
    }

    if (phase === 'review') {
      const firstReview = reviewQueue[0] || null;
      if (firstReview && questionKey(firstReview) === lastServedKey && canStartNewCycle()) {
        // If review would immediately repeat the just-served question, inject one main question first.
        return nextMainQuestion();
      }
      if (firstReview && questionKey(firstReview) === lastServedKey) {
        // If no main cycle is available (finite mode), inject a one-off spacer question.
        const spacer = randomQuestionAvoidingKey(normalizedTables, lastServedKey, randomFn);
        lastServedKey = questionKey(spacer);
        return withMainMetadata(spacer);
      }

      const question = reviewQueue.shift() || null;
      if (!question) {
        phase = 'main';
      } else {
        lastServedKey = questionKey(question);
        return {
          ...question,
          source: 'review',
          reviewRemaining: reviewQueue.length,
        };
      }
    }

    const question = nextMainQuestion();
    if (!question) {
      completed = true;
      return null;
    }
    return question;
  }

  function markAnswer({ question, isCorrect }) {
    if (!reviewErrorsEnabled || !question || isCorrect) {
      return;
    }
    const key = questionKey(question);
    if (!reviewPool.has(key)) {
      reviewPool.set(key, toQuestion(question.num1, question.num2));
    }
  }

  return {
    next,
    markAnswer,
    getState() {
      return {
        phase,
        difficultyId: difficultyPreset.id,
        roundsPerCycle,
        finiteSession,
        reviewOrder,
        cycleQuestionLimit,
        cycleCount,
        pendingReviewCount: reviewPool.size,
        reviewRemaining: phase === 'review' ? reviewQueue.length : 0,
        isCompleted: completed,
      };
    },
  };
}

export function evaluateAnswer({ answerInput, question, score, total, streak }) {
  const parsed = Number.parseInt(answerInput, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      isValid: false,
      feedbackType: 'incorrect',
      feedbackMain: '⚠️ Entrer un nombre positif.',
      feedbackExtra: '',
      nextScore: score,
      nextTotal: total,
      nextStreak: streak,
    };
  }

  const nextTotal = total + 1;
  if (parsed === question.answer) {
    const nextScore = score + 1;
    const nextStreak = streak + 1;
    return {
      isValid: true,
      feedbackType: 'correct',
      feedbackMain: 'Bonne réponse.',
      feedbackExtra: '',
      nextScore,
      nextTotal,
      nextStreak,
    };
  }

  return {
    isValid: true,
    feedbackType: 'incorrect',
    feedbackMain: '❌ Mauvaise réponse.',
    feedbackExtra: `Bonne réponse : ${question.answer}.`,
    nextScore: score,
    nextTotal,
    nextStreak: 0,
  };
}
