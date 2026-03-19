import { createRefillBag, shuffleList } from '@/features/common/questionBag';
import {
  getFrenchVerb,
  isFrenchVerbTenseAvailable,
  listFrenchPronouns,
  normalizeFrenchAnswer,
} from './frenchConjugations';

const DEFAULT_MOOD_KEY = 'indicatif';
const DEFAULT_TENSE_KEY = 'present';

function getExerciseVerb(verbKey, moodKey = DEFAULT_MOOD_KEY, tenseKey = DEFAULT_TENSE_KEY, source) {
  if (!isFrenchVerbTenseAvailable(verbKey, tenseKey, source, moodKey)) {
    return null;
  }
  return getFrenchVerb(verbKey, source, moodKey, tenseKey);
}

function getExercisePronouns(source, moodKey = DEFAULT_MOOD_KEY, tenseKey = DEFAULT_TENSE_KEY) {
  return listFrenchPronouns(source, moodKey, tenseKey);
}

function uniqueFormsForVerb(verb, excludedAnswer = '') {
  if (!verb) {
    return [];
  }

  const excluded = normalizeFrenchAnswer(excludedAnswer);
  const seen = new Set();
  const values = [];

  for (const value of Object.values(verb.forms || {})) {
    const normalized = normalizeFrenchAnswer(value);
    if (!normalized || normalized === excluded || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    values.push(value);
  }

  return values;
}

function reorderPronounsForBag(pronouns, lastPronounKey, lastRowKey) {
  if (pronouns.length <= 1) {
    return pronouns;
  }

  const pending = [...pronouns];
  const ordered = [];
  let previousKey = lastPronounKey;
  let previousRowKey = lastRowKey;

  while (pending.length > 0) {
    let nextIndex = pending.findIndex(
      (pronoun) => pronoun.rowKey !== previousRowKey && pronoun.key !== previousKey
    );

    if (nextIndex === -1) {
      nextIndex = pending.findIndex((pronoun) => pronoun.key !== previousKey);
    }

    if (nextIndex === -1) {
      nextIndex = 0;
    }

    const [nextPronoun] = pending.splice(nextIndex, 1);
    ordered.push(nextPronoun);
    previousKey = nextPronoun.key;
    previousRowKey = nextPronoun.rowKey || '';
  }

  return ordered;
}

function reorderRowsForBag(rows, lastRowKey) {
  if (!lastRowKey || rows.length <= 1) {
    return rows;
  }

  const ordered = [...rows];
  const nextIndex = ordered.findIndex((row) => row.rowKey !== lastRowKey);
  if (nextIndex > 0) {
    const [nextRow] = ordered.splice(nextIndex, 1);
    ordered.unshift(nextRow);
  }

  return ordered;
}

export function buildFrenchQcmChoices(
  verbKey,
  pronounKey,
  randomFn = Math.random,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const verb = getExerciseVerb(verbKey, moodKey, tenseKey, source);
  if (!verb) {
    return [];
  }

  const correctAnswer = verb.forms[pronounKey];
  const distractors = shuffleList(uniqueFormsForVerb(verb, correctAnswer), randomFn).slice(0, 3);
  const answers = shuffleList([correctAnswer, ...distractors], randomFn);

  return answers.map((answer, index) => ({
    id: `option-${index + 1}`,
    answer,
    isCorrect: normalizeFrenchAnswer(answer) === normalizeFrenchAnswer(correctAnswer),
  }));
}

export function createFrenchQcmQuestion(
  verbKey,
  pronounKey,
  randomFn = Math.random,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const verb = getExerciseVerb(verbKey, moodKey, tenseKey, source);
  const pronoun = getExercisePronouns(source, moodKey, tenseKey).find((item) => item.key === pronounKey);

  if (!verb || !pronoun) {
    return null;
  }

  const options = buildFrenchQcmChoices(verbKey, pronounKey, randomFn, source, moodKey, tenseKey);
  const correctOption = options.find((option) => option.isCorrect);

  if (!correctOption || options.length < 4) {
    return null;
  }

  return {
    id: `${verb.key}-${pronoun.key}`,
    verbKey: verb.key,
    verbLabel: verb.label,
    infinitive: verb.infinitive,
    pronounKey: pronoun.key,
    pronounLabel: pronoun.label,
    prompt: `${pronoun.label} + ${verb.infinitive}`,
    expectedAnswer: verb.forms[pronoun.key],
    correctOptionId: correctOption.id,
    options,
  };
}

export function createFrenchInputQuestion(
  verbKey,
  pronounKey,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const verb = getExerciseVerb(verbKey, moodKey, tenseKey, source);
  const pronoun = getExercisePronouns(source, moodKey, tenseKey).find((item) => item.key === pronounKey);

  if (!verb || !pronoun) {
    return null;
  }

  return {
    id: `${verb.key}-${pronoun.key}`,
    verbKey: verb.key,
    verbLabel: verb.label,
    infinitive: verb.infinitive,
    pronounKey: pronoun.key,
    pronounLabel: pronoun.label,
    prompt: `${pronoun.label} + ${verb.infinitive}`,
    expectedAnswer: verb.forms[pronoun.key],
  };
}

export function createFrenchPronounBag(
  verbKey,
  randomFn = Math.random,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const verb = getExerciseVerb(verbKey, moodKey, tenseKey, source);
  const pronouns = getExercisePronouns(source, moodKey, tenseKey);
  let lastRowKey = '';
  const lastPronounKeysByRow = new Map();

  if (!verb || !pronouns.length) {
    return {
      next() {
        return null;
      },
      clear() {},
    };
  }

  const rowEntries = Array.from(
    pronouns.reduce((groups, pronoun) => {
      const rowKey = pronoun.rowKey || pronoun.key;
      if (!groups.has(rowKey)) {
        groups.set(rowKey, []);
      }
      groups.get(rowKey).push(pronoun);
      return groups;
    }, new Map()),
    ([rowKey, rowPronouns]) => ({ rowKey, pronouns: rowPronouns })
  );

  const rowBag = createRefillBag({
    refill: () => reorderRowsForBag(shuffleList(rowEntries, randomFn), lastRowKey),
  });

  return {
    next() {
      const row = rowBag.next();
      if (!row) {
        return null;
      }
      const previousPronounKey = lastPronounKeysByRow.get(row.rowKey) || '';
      const orderedPronouns = reorderPronounsForBag(
        shuffleList(row.pronouns, randomFn),
        previousPronounKey,
        ''
      );
      const pronoun = orderedPronouns[0] || row.pronouns[0];
      lastPronounKeysByRow.set(row.rowKey, pronoun.key);
      lastRowKey = pronoun.rowKey || '';
      return pronoun;
    },
    clear() {
      lastRowKey = '';
      lastPronounKeysByRow.clear();
      rowBag.clear();
    },
  };
}

export function createFrenchQcmBag(
  verbKey,
  randomFn = Math.random,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const pronounBag = createFrenchPronounBag(verbKey, randomFn, source, moodKey, tenseKey);

  return {
    next() {
      const pronoun = pronounBag.next();
      if (!pronoun) {
        return null;
      }
      return createFrenchQcmQuestion(verbKey, pronoun.key, randomFn, source, moodKey, tenseKey);
    },
    clear() {
      pronounBag.clear();
    },
  };
}

export function createFrenchInputBag(
  verbKey,
  randomFn = Math.random,
  source,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = DEFAULT_TENSE_KEY
) {
  const pronounBag = createFrenchPronounBag(verbKey, randomFn, source, moodKey, tenseKey);

  return {
    next() {
      const pronoun = pronounBag.next();
      if (!pronoun) {
        return null;
      }
      return createFrenchInputQuestion(verbKey, pronoun.key, source, moodKey, tenseKey);
    },
    clear() {
      pronounBag.clear();
    },
  };
}

export function evaluateFrenchQcmAnswer(question, selectedOptionId) {
  if (!question || !Array.isArray(question.options)) {
    return {
      isValid: false,
      isCorrect: false,
      correctAnswer: '',
    };
  }

  const selectedOption = question.options.find((option) => option.id === selectedOptionId);
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  if (!selectedOption || !correctOption) {
    return {
      isValid: false,
      isCorrect: false,
      correctAnswer: correctOption?.answer || question.expectedAnswer || '',
    };
  }

  return {
    isValid: true,
    isCorrect: selectedOption.id === question.correctOptionId,
    correctAnswer: correctOption.answer,
  };
}

export function evaluateFrenchInputAnswer(question, answer) {
  if (!question || typeof question.expectedAnswer !== 'string') {
    return {
      isValid: false,
      isCorrect: false,
      correctAnswer: '',
    };
  }

  const normalized = normalizeFrenchAnswer(answer);
  if (!normalized) {
    return {
      isValid: false,
      isCorrect: false,
      correctAnswer: question.expectedAnswer,
    };
  }

  return {
    isValid: true,
    isCorrect: normalized === normalizeFrenchAnswer(question.expectedAnswer),
    correctAnswer: question.expectedAnswer,
  };
}
