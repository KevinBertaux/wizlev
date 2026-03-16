import { createRefillBag, shuffleList } from '@/features/common/questionBag';
import { getFrenchVerb, listFrenchPronouns, normalizeFrenchAnswer } from './frenchConjugations';

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

function avoidImmediatePronounRepeat(pronouns, lastPronounKey) {
  if (!lastPronounKey || pronouns.length <= 1) {
    return pronouns;
  }

  const nextIndex = pronouns.findIndex((pronoun) => pronoun.key !== lastPronounKey);
  if (nextIndex > 0) {
    const [nextPronoun] = pronouns.splice(nextIndex, 1);
    pronouns.unshift(nextPronoun);
  }

  return pronouns;
}

export function buildFrenchQcmChoices(verbKey, pronounKey, randomFn = Math.random) {
  const verb = getFrenchVerb(verbKey);
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

export function createFrenchQcmQuestion(verbKey, pronounKey, randomFn = Math.random) {
  const verb = getFrenchVerb(verbKey);
  const pronoun = listFrenchPronouns().find((item) => item.key === pronounKey);

  if (!verb || !pronoun) {
    return null;
  }

  const options = buildFrenchQcmChoices(verbKey, pronounKey, randomFn);
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

export function createFrenchInputQuestion(verbKey, pronounKey) {
  const verb = getFrenchVerb(verbKey);
  const pronoun = listFrenchPronouns().find((item) => item.key === pronounKey);

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

export function createFrenchPronounBag(verbKey, randomFn = Math.random) {
  const verb = getFrenchVerb(verbKey);
  const pronouns = listFrenchPronouns();
  let lastPronounKey = '';

  if (!verb || !pronouns.length) {
    return {
      next() {
        return null;
      },
      clear() {},
    };
  }

  const bag = createRefillBag({
    refill: () => avoidImmediatePronounRepeat(shuffleList(pronouns, randomFn), lastPronounKey),
  });

  return {
    next() {
      const pronoun = bag.next();
      if (!pronoun) {
        return null;
      }
      lastPronounKey = pronoun.key;
      return pronoun;
    },
    clear() {
      lastPronounKey = '';
      bag.clear();
    },
  };
}

export function createFrenchQcmBag(verbKey, randomFn = Math.random) {
  const pronounBag = createFrenchPronounBag(verbKey, randomFn);

  return {
    next() {
      const pronoun = pronounBag.next();
      if (!pronoun) {
        return null;
      }
      return createFrenchQcmQuestion(verbKey, pronoun.key, randomFn);
    },
    clear() {
      pronounBag.clear();
    },
  };
}

export function createFrenchInputBag(verbKey, randomFn = Math.random) {
  const pronounBag = createFrenchPronounBag(verbKey, randomFn);

  return {
    next() {
      const pronoun = pronounBag.next();
      if (!pronoun) {
        return null;
      }
      return createFrenchInputQuestion(verbKey, pronoun.key);
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
