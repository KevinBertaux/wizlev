import presentCoreVerbs from '@/content/languages/fr/present-core-verbs.json';
import conjugationPocManabuer from '@/content/languages/fr/conjugation-poc-manabuer.json';
import {
  buildInflectionRows,
  getInflectionLanguage,
  getInflectionTense,
  getInflectionVerb,
} from './inflectionSchema';

const DEFAULT_LANGUAGE_KEY = 'fr';
const DEFAULT_MOOD_KEY = 'indicatif';

const legacyModuleData = sanitizeLegacyModule(presentCoreVerbs);
const legacyPronounsByKey = new Map(legacyModuleData.pronouns.map((pronoun) => [pronoun.key, pronoun]));
const legacyVerbsByKey = new Map(legacyModuleData.verbs.map((verb) => [verb.key, verb]));
const legacyTenseFamilies = Object.freeze([
  {
    key: 'present-family',
    familyKey: 'present',
    label: 'Présent',
    defaultTenseKey: 'present',
    options: [{ key: 'present', label: 'Indicatif présent', available: true }],
  },
  {
    key: 'past-family',
    familyKey: 'past',
    label: 'Passé',
    defaultTenseKey: 'passe-compose',
    options: [
      { key: 'passe-compose', label: 'Indicatif passé composé', available: false },
      { key: 'imparfait', label: 'Indicatif imparfait', available: false },
      { key: 'plus-que-parfait', label: 'Indicatif plus-que-parfait', available: false },
      { key: 'passe-simple', label: 'Indicatif passé simple', available: false },
      { key: 'passe-anterieur', label: 'Indicatif passé antérieur', available: false },
    ],
  },
  {
    key: 'future-family',
    familyKey: 'future',
    label: 'Futur',
    defaultTenseKey: 'futur-simple',
    options: [
      { key: 'futur-simple', label: 'Indicatif futur simple', available: false },
      { key: 'futur-anterieur', label: 'Indicatif futur antérieur', available: false },
    ],
  },
]);
const legacyTenseMap = new Map(
  legacyTenseFamilies.flatMap((family) =>
    family.options.map((option) => [
      option.key,
      {
        ...option,
        familyKey: family.familyKey,
        familyLabel: family.label,
      },
    ])
  )
);

function sanitizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function sanitizeForms(forms, pronouns) {
  const source = forms && typeof forms === 'object' ? forms : {};
  return Object.fromEntries(
    pronouns.map((pronoun) => [pronoun.key, sanitizeString(source[pronoun.key])])
  );
}

function sanitizeLegacyModule(payload) {
  const pronouns = Array.isArray(payload?.pronouns)
    ? payload.pronouns
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          key: sanitizeString(item.key),
          label: sanitizeString(item.label),
        }))
        .filter((item) => item.key && item.label)
    : [];

  const rows = Array.isArray(payload?.rows)
    ? payload.rows
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          key: sanitizeString(item.key),
          label: sanitizeString(item.label),
          pronouns: Array.isArray(item.pronouns)
            ? item.pronouns.map((value) => sanitizeString(value)).filter(Boolean)
            : [],
        }))
        .filter((item) => item.key && item.label && item.pronouns.length > 0)
    : [];

  const verbs = Array.isArray(payload?.verbs)
    ? payload.verbs
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          key: sanitizeString(item.key),
          infinitive: sanitizeString(item.infinitive),
          label: sanitizeString(item.label || item.infinitive),
          forms: sanitizeForms(item.forms, pronouns),
        }))
        .filter(
          (item) =>
            item.key &&
            item.infinitive &&
            pronouns.every((pronoun) => typeof item.forms[pronoun.key] === 'string' && item.forms[pronoun.key])
        )
    : [];

  return {
    name: sanitizeString(payload?.name, 'Conjugaison française'),
    label: sanitizeString(payload?.label, 'Français'),
    description: sanitizeString(payload?.description),
    pronouns,
    rows,
    verbs,
  };
}

function isInflectionModule(payload) {
  return Boolean(payload && typeof payload === 'object' && Array.isArray(payload.languages));
}

function getFrenchSource(source = legacyModuleData) {
  return source || legacyModuleData;
}

function getFamilyLabel(familyKey) {
  if (familyKey === 'present') {
    return 'Présent';
  }
  if (familyKey === 'past') {
    return 'Passé';
  }
  if (familyKey === 'future') {
    return 'Futur';
  }
  return familyKey;
}

function getLegacyVerb(verbKey) {
  return legacyVerbsByKey.get(verbKey) || null;
}

function getLegacyPronouns() {
  return legacyModuleData.pronouns.map((pronoun) => ({ ...pronoun }));
}

function buildLegacyVerbRows(verbKey) {
  const verb = getLegacyVerb(verbKey);
  if (!verb) {
    return [];
  }

  return legacyModuleData.rows.map((row) => {
    const forms = row.pronouns.map((pronounKey) => verb.forms[pronounKey]).filter(Boolean);

    return {
      key: row.key,
      label: row.label,
      pronounValues: row.pronouns
        .map((pronounKey) => {
          const pronoun = legacyPronounsByKey.get(pronounKey);
          return pronoun ? `${pronoun.label} ${verb.forms[pronounKey]}` : '';
        })
        .filter(Boolean),
      forms: [...new Set(forms)],
    };
  });
}

function getInflectionContext(source, moodKey = DEFAULT_MOOD_KEY, tenseKey = 'present') {
  const language = getInflectionLanguage(source, DEFAULT_LANGUAGE_KEY);
  const mood = language?.moods?.find((item) => item?.key === moodKey) || null;
  const tense = getInflectionTense(source, DEFAULT_LANGUAGE_KEY, moodKey, tenseKey);
  const slotSet = language?.slotSets?.find((item) => item?.key === tense?.slotSetKey) || null;

  return { language, mood, tense, slotSet };
}

function normalizeInflectionVerb(verb, source, moodKey = DEFAULT_MOOD_KEY, tenseKey = 'present') {
  if (!verb) {
    return null;
  }
  const { tense } = getInflectionContext(source, moodKey, tenseKey);
  if (!tense) {
    return {
      key: verb.key,
      infinitive: verb.lemma,
      label: verb.label || verb.lemma,
      forms: {},
      meta: { ...(verb.meta || {}) },
    };
  }

  const forms = verb.forms?.[`${moodKey}.${tenseKey}`] || {};
  return {
    key: verb.key,
    infinitive: verb.lemma,
    label: verb.label || verb.lemma,
    forms,
    meta: { ...(verb.meta || {}) },
  };
}

function listInflectionPronouns(source, moodKey = DEFAULT_MOOD_KEY, tenseKey = 'present') {
  const { slotSet } = getInflectionContext(source, moodKey, tenseKey);
  if (!slotSet) {
    return [];
  }

  return slotSet.slots.map((slot) => ({
    key: slot.key,
    label: slot.label,
  }));
}

function listInflectionTenseFamilies(source, moodKey = DEFAULT_MOOD_KEY) {
  const { mood } = getInflectionContext(source, moodKey, 'present');
  if (!mood) {
    return [];
  }

  const familyMap = new Map();
  for (const tense of mood.tenses || []) {
    const familyKey = tense.familyKey || 'other';
    if (!familyMap.has(familyKey)) {
      familyMap.set(familyKey, {
        key: `${familyKey}-family`,
        familyKey,
        label: getFamilyLabel(familyKey),
        defaultTenseKey: tense.key,
        options: [],
      });
    }
    familyMap.get(familyKey).options.push({
      key: tense.key,
      label: tense.label,
      available: true,
      familyKey,
      familyLabel: getFamilyLabel(familyKey),
      compound: Boolean(tense.compound),
    });
  }

  return Array.from(familyMap.values());
}

export function getFrenchConjugationModule(source = legacyModuleData) {
  return getFrenchSource(source);
}

export function getFrenchConjugationPocModule() {
  return conjugationPocManabuer;
}

export function listFrenchTenseFamilies(source = legacyModuleData, moodKey = DEFAULT_MOOD_KEY) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    return listInflectionTenseFamilies(resolvedSource, moodKey);
  }

  return legacyTenseFamilies.map((family) => ({
    key: family.key,
    familyKey: family.familyKey,
    label: family.label,
    defaultTenseKey: family.defaultTenseKey,
    options: family.options.map((option) => ({ ...option })),
  }));
}

export function getFrenchTense(tenseKey, source = legacyModuleData, moodKey = DEFAULT_MOOD_KEY) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    const tense = getInflectionTense(resolvedSource, DEFAULT_LANGUAGE_KEY, moodKey, tenseKey);
    if (!tense) {
      return null;
    }
    return {
      ...tense,
      available: true,
      familyLabel: getFamilyLabel(tense.familyKey || 'other'),
    };
  }

  return legacyTenseMap.get(tenseKey) || null;
}

export function isFrenchTenseAvailable(tenseKey, source = legacyModuleData, moodKey = DEFAULT_MOOD_KEY) {
  return Boolean(getFrenchTense(tenseKey, source, moodKey)?.available);
}

export function listFrenchVerbOptions(source = legacyModuleData) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    const language = getInflectionLanguage(resolvedSource, DEFAULT_LANGUAGE_KEY);
    return (language?.verbs || []).map((verb) => ({
      value: verb.key,
      label: verb.label || verb.lemma,
    }));
  }

  return legacyModuleData.verbs.map((verb) => ({
    value: verb.key,
    label: verb.label,
  }));
}

export function listFrenchVerbSummaries(source = legacyModuleData) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    const language = getInflectionLanguage(resolvedSource, DEFAULT_LANGUAGE_KEY);
    return (language?.verbs || []).map((verb) => ({
      key: verb.key,
      infinitive: verb.lemma,
      label: verb.label || verb.lemma,
    }));
  }

  return legacyModuleData.verbs.map((verb) => ({
    key: verb.key,
    infinitive: verb.infinitive,
    label: verb.label,
  }));
}

export function getFrenchVerb(
  verbKey,
  source = legacyModuleData,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = 'present'
) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    return normalizeInflectionVerb(
      getInflectionVerb(resolvedSource, DEFAULT_LANGUAGE_KEY, verbKey),
      resolvedSource,
      moodKey,
      tenseKey
    );
  }

  return getLegacyVerb(verbKey);
}

export function listFrenchPronouns(source = legacyModuleData, moodKey = DEFAULT_MOOD_KEY, tenseKey = 'present') {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    return listInflectionPronouns(resolvedSource, moodKey, tenseKey);
  }

  return getLegacyPronouns();
}

export function buildFrenchVerbRows(
  verbKey,
  tenseKey = 'present',
  source = legacyModuleData,
  moodKey = DEFAULT_MOOD_KEY
) {
  const resolvedSource = getFrenchSource(source);
  if (isInflectionModule(resolvedSource)) {
    return buildInflectionRows(resolvedSource, DEFAULT_LANGUAGE_KEY, verbKey, moodKey, tenseKey);
  }

  const verb = getLegacyVerb(verbKey);
  if (!verb || tenseKey !== 'present' || !isFrenchTenseAvailable(tenseKey, resolvedSource, moodKey)) {
    return [];
  }

  return buildLegacyVerbRows(verbKey);
}

export function buildFrenchVerbCards(
  verbKey,
  tenseKey = 'present',
  source = legacyModuleData,
  moodKey = DEFAULT_MOOD_KEY
) {
  const verb = getFrenchVerb(verbKey, source, moodKey, tenseKey);
  const pronouns = listFrenchPronouns(source, moodKey, tenseKey);
  if (!verb) {
    return [];
  }

  return pronouns.map((pronoun) => ({
    id: `${verb.key}-${pronoun.key}`,
    pronounKey: pronoun.key,
    pronounLabel: pronoun.label,
    prompt: `${pronoun.label} + ${verb.infinitive}`,
    answer: verb.forms[pronoun.key],
    infinitive: verb.infinitive,
    label: verb.label,
  }));
}

export function createFrenchExercise(
  verbKey,
  randomFn = Math.random,
  previousPronounKey = '',
  source = legacyModuleData,
  moodKey = DEFAULT_MOOD_KEY,
  tenseKey = 'present'
) {
  const verb = getFrenchVerb(verbKey, source, moodKey, tenseKey);
  const pronouns = listFrenchPronouns(source, moodKey, tenseKey);
  if (!verb || !pronouns.length) {
    return null;
  }

  const choices = pronouns.filter((pronoun) => pronoun.key !== previousPronounKey);
  const pool = choices.length ? choices : pronouns;
  const index = Math.floor(randomFn() * pool.length);
  const pronoun = pool[index] || pool[0];

  return {
    id: `${verb.key}-${pronoun.key}`,
    verbKey: verb.key,
    verbLabel: verb.label,
    infinitive: verb.infinitive,
    pronounKey: pronoun.key,
    pronounLabel: pronoun.label,
    expectedAnswer: verb.forms[pronoun.key],
  };
}

export function normalizeFrenchAnswer(value) {
  return sanitizeString(value).toLowerCase();
}

export function isFrenchExerciseAnswerCorrect(exercise, answer) {
  if (!exercise || typeof exercise.expectedAnswer !== 'string') {
    return false;
  }

  return normalizeFrenchAnswer(answer) === normalizeFrenchAnswer(exercise.expectedAnswer);
}
