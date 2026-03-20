import presentCoreVerbs from '@/content/languages/fr/present-core-verbs.json';
import conjugationManifest from '@/content/languages/fr/conjugation/manifest.json';
import conjugationSchema from '@/content/languages/fr/conjugation/schema.fr.v1.json';
import aimerVerb from '@/content/languages/fr/conjugation/verbs/aimer.json';
import allerVerb from '@/content/languages/fr/conjugation/verbs/aller.json';
import avoirVerb from '@/content/languages/fr/conjugation/verbs/avoir.json';
import chanterVerb from '@/content/languages/fr/conjugation/verbs/chanter.json';
import etreVerb from '@/content/languages/fr/conjugation/verbs/etre.json';
import faireVerb from '@/content/languages/fr/conjugation/verbs/faire.json';
import finirVerb from '@/content/languages/fr/conjugation/verbs/finir.json';
import manabuerVerb from '@/content/languages/fr/conjugation/verbs/manabuer.json';
import prendreVerb from '@/content/languages/fr/conjugation/verbs/prendre.json';
import venirVerb from '@/content/languages/fr/conjugation/verbs/venir.json';
import {
  buildInflectionRows,
  getInflectionLanguage,
  getInflectionTense,
  getInflectionVerb,
} from './inflectionSchema';

const DEFAULT_LANGUAGE_KEY = 'fr';
const DEFAULT_MOOD_KEY = 'indicatif';
const GROUP_LABELS = Object.freeze({
  '1': '1er groupe',
  '2': '2e groupe',
  '3': '3e groupe',
});
const ELIDABLE_INITIAL_RE = /^[aeiouyàâäæéèêëîïôöœùûüÿh]/i;
const inflectionVerbRecords = [
  aimerVerb,
  allerVerb,
  avoirVerb,
  chanterVerb,
  etreVerb,
  faireVerb,
  finirVerb,
  manabuerVerb,
  prendreVerb,
  venirVerb,
];

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

function normalizeFrenchText(value) {
  return sanitizeString(value).replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
}

function stripFrenchPronounPrefix(value) {
  return normalizeFrenchText(value).replace(
    /^(?:que\s+|qu['’])?(?:j['’]|j\s+|je\s+|tu\s+|il\s+|elle\s+|on\s+|nous\s+|vous\s+|ils\s+|elles\s+)/i,
    ''
  );
}

function capitalizeLabel(label) {
  const normalized = sanitizeString(label);
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
}

function shouldElideFrenchJe(answer, verbMeta = {}) {
  const normalizedAnswer = normalizeFrenchText(answer);
  if (!normalizedAnswer) {
    return false;
  }
  if (sanitizeString(verbMeta?.hType) === 'aspire') {
    return false;
  }
  return ELIDABLE_INITIAL_RE.test(normalizedAnswer);
}

export function formatFrenchPronounAnswer(
  pronounKey,
  pronounLabel,
  answer,
  verbMeta = {},
  { lowercasePronoun = false } = {}
) {
  const normalizedAnswer = normalizeFrenchText(answer);
  const normalizedLabel = sanitizeString(pronounLabel);
  if (!normalizedAnswer || !normalizedLabel) {
    return '';
  }

  if (sanitizeString(pronounKey) === 'je' && shouldElideFrenchJe(normalizedAnswer, verbMeta)) {
    const prefix = lowercasePronoun ? 'j' : 'J';
    return `${prefix}'${normalizedAnswer}`;
  }

  const label = lowercasePronoun ? normalizedLabel.toLowerCase() : capitalizeLabel(normalizedLabel);
  return `${label} ${normalizedAnswer}`;
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

function buildInflectionModuleFromManifest(manifestPayload, schemaPayload, verbPayloads = []) {
  const manifest = manifestPayload && typeof manifestPayload === 'object' ? manifestPayload : {};
  const language = manifest.language && typeof manifest.language === 'object' ? manifest.language : {};
  const schema = schemaPayload && typeof schemaPayload === 'object' ? schemaPayload : {};
  return {
    schemaVersion: manifest.schemaVersion || 1,
    kind: 'inflection-module',
    languages: [
      {
        key: sanitizeString(language.key, DEFAULT_LANGUAGE_KEY),
        locale: sanitizeString(language.locale, 'fr-FR'),
        label: sanitizeString(language.label, 'Français'),
        rows: Array.isArray(schema.rows) ? schema.rows : [],
        slotSets: Array.isArray(schema.slotSets) ? schema.slotSets : [],
        moods: Array.isArray(schema.moods) ? schema.moods : [],
        verbs: Array.isArray(verbPayloads) ? verbPayloads : [],
      },
    ],
  };
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
  return legacyModuleData.pronouns.map((pronoun) => {
    const row = legacyModuleData.rows.find((item) => item.pronouns.includes(pronoun.key));
    return {
      ...pronoun,
      rowKey: row?.key || pronoun.key,
    };
  });
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
          return pronoun
            ? formatFrenchPronounAnswer(pronoun.key, pronoun.label, verb.forms[pronounKey], verb.meta)
            : '';
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
    rowKey: slot.rowKey || slot.key,
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
  return buildInflectionModuleFromManifest(
    conjugationManifest,
    conjugationSchema,
    inflectionVerbRecords
  );
}

export function getFrenchInflectionModule() {
  return getFrenchConjugationPocModule();
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
      group: sanitizeString(verb.meta?.group),
      irregular: Boolean(verb.meta?.irregular),
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

export function listFrenchVerbOptionGroups(source = legacyModuleData) {
  const options = listFrenchVerbOptions(source);
  const groupedOptions = new Map([
    ['1', { key: '1', label: GROUP_LABELS['1'], options: [] }],
    ['2', { key: '2', label: GROUP_LABELS['2'], options: [] }],
    ['3', { key: '3', label: GROUP_LABELS['3'], options: [] }],
  ]);

  for (const option of options) {
    const groupKey = sanitizeString(option.group);
    if (!groupedOptions.has(groupKey)) {
      continue;
    }
    groupedOptions.get(groupKey).options.push({
      value: option.value,
      label: option.label,
      disabled: Boolean(option.disabled),
    });
  }

  return Array.from(groupedOptions.values())
    .map((group) => ({
      ...group,
      options: [...group.options].sort((left, right) =>
        left.label.localeCompare(right.label, 'fr', { sensitivity: 'base' })
      ),
    }))
    .filter((group) => group.options.length > 0);
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

export function isFrenchVerbTenseAvailable(
  verbKey,
  tenseKey = 'present',
  source = legacyModuleData,
  moodKey = DEFAULT_MOOD_KEY
) {
  if (!sanitizeString(verbKey) || !sanitizeString(tenseKey)) {
    return false;
  }

  const resolvedSource = getFrenchSource(source);
  if (!isInflectionModule(resolvedSource)) {
    return Boolean(getLegacyVerb(verbKey) && tenseKey === 'present' && isFrenchTenseAvailable(tenseKey, resolvedSource, moodKey));
  }

  const verb = getFrenchVerb(verbKey, source, moodKey, tenseKey);
  if (!verb) {
    return false;
  }

  return Object.values(verb.forms || {}).some((value) => sanitizeString(value));
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
    if (!isFrenchVerbTenseAvailable(verbKey, tenseKey, resolvedSource, moodKey)) {
      return [];
    }
    const verb = getFrenchVerb(verbKey, resolvedSource, moodKey, tenseKey);
    return buildInflectionRows(resolvedSource, DEFAULT_LANGUAGE_KEY, verbKey, moodKey, tenseKey).map((row) => ({
      ...row,
      pronounValues: (row.slotLabels || [])
        .map((slotLabel, index) =>
          formatFrenchPronounAnswer(slotLabel.toLowerCase(), slotLabel, row.forms[index] || row.forms[0] || '', verb?.meta)
        )
        .filter(Boolean),
    }));
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
  if (!verb || !isFrenchVerbTenseAvailable(verbKey, tenseKey, source, moodKey)) {
    return [];
  }
  const rows = buildFrenchVerbRows(verbKey, tenseKey, source, moodKey);

  return rows.map((row) => ({
    id: `${verb.key}-${row.key}`,
    pronounKey: row.key,
    pronounLabel: row.label,
    prompt: `${row.label} + ${verb.infinitive}`,
    answer: row.forms[0] || '',
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
  if (!verb || !pronouns.length || !isFrenchVerbTenseAvailable(verbKey, tenseKey, source, moodKey)) {
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
    expectedAnswerLabel: formatFrenchPronounAnswer(pronoun.key, pronoun.label, verb.forms[pronoun.key], verb.meta, {
      lowercasePronoun: true,
    }),
  };
}

export function normalizeFrenchAnswer(value) {
  return stripFrenchPronounPrefix(value).replace(/\s*['’]\s*/g, "'").toLowerCase();
}

export function isFrenchExerciseAnswerCorrect(exercise, answer) {
  if (!exercise || typeof exercise.expectedAnswer !== 'string') {
    return false;
  }

  return normalizeFrenchAnswer(answer) === normalizeFrenchAnswer(exercise.expectedAnswer);
}
