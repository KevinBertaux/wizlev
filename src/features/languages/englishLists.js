import localManifest from '@/content/languages/en/manifest.json';
import identiteEcole from '@/content/languages/en/identite-ecole.json';
import salutationsPolitesse from '@/content/languages/en/salutations-politesse.json';
import etatsRessentis from '@/content/languages/en/etats-ressentis.json';
import tempsSemaine from '@/content/languages/en/temps-semaine.json';
import consignesClasse from '@/content/languages/en/consignes-classe.json';
import reglesClasse from '@/content/languages/en/regles-classe.json';
import materielScolaire from '@/content/languages/en/materiel-scolaire.json';
import activitesCapacites from '@/content/languages/en/activites-capacites.json';
import actionsVerbs1 from '@/content/languages/en/actions-verbs-1.json';
import actionsVerbs2 from '@/content/languages/en/actions-verbs-2.json';
import fetesSymboles from '@/content/languages/en/fetes-symboles.json';
import thanksgiving from '@/content/languages/en/thanksgiving.json';
import paysNationalites from '@/content/languages/en/pays-nationalites.json';
import prepositionsLieu from '@/content/languages/en/prepositions-lieu.json';
import villePersonnes from '@/content/languages/en/ville-personnes.json';
import maisonVetements from '@/content/languages/en/maison-vetements.json';
import animauxObjets from '@/content/languages/en/animaux-objets.json';
import alimentsBoissons from '@/content/languages/en/aliments-boissons.json';
import fruits from '@/content/languages/en/fruits.json';
import legumes from '@/content/languages/en/legumes.json';
import fruits2 from '@/content/languages/en/fruits-2.json';
import legumes2 from '@/content/languages/en/legumes-2.json';
import meteo from '@/content/languages/en/meteo.json';
import {
  compareManifestVersionTokens,
  getLatestManifestVersionToken,
  getManifestVersionToken,
  hasManifestEntryChanged,
  indexManifestEntriesByKey,
  normalizeManifestEntries,
  readRemotePayloadCache,
  writeRemotePayloadCache,
} from '@/features/remote/manifestSync';

const STORAGE_PREFIX = 'manabuplay_english_list_';
const LEGACY_STORAGE_PREFIX = 'manabuplay_vocab_list_';
const REMOTE_CACHE_STORAGE_KEY = 'manabuplay_english_remote_cache_v1';
const REMOTE_TIMEOUT_MS = 3500;
const DEFAULT_REMOTE_LANG = 'en';
const DEFAULT_REMOTE_FOLDER = 'languages/en/vocabulary';
const LOCAL_MANIFEST_VERSION = getManifestVersionToken(localManifest);
const LOCAL_MANIFEST_ENTRY_INDEX = indexManifestEntriesByKey(localManifest, LOCAL_MANIFEST_VERSION);

const baseEnglishLists = {
  identiteEcole: {
    key: 'identiteEcole',
    label: identiteEcole.label || identiteEcole.name,
    name: identiteEcole.name,
    description: identiteEcole.description,
    words: identiteEcole.words,
  },
  salutationsPolitesse: {
    key: 'salutationsPolitesse',
    label: salutationsPolitesse.label || salutationsPolitesse.name,
    name: salutationsPolitesse.name,
    description: salutationsPolitesse.description,
    words: salutationsPolitesse.words,
  },
  etatsRessentis: {
    key: 'etatsRessentis',
    label: etatsRessentis.label || etatsRessentis.name,
    name: etatsRessentis.name,
    description: etatsRessentis.description,
    words: etatsRessentis.words,
  },
  tempsSemaine: {
    key: 'tempsSemaine',
    label: tempsSemaine.label || tempsSemaine.name,
    name: tempsSemaine.name,
    description: tempsSemaine.description,
    words: tempsSemaine.words,
  },
  consignesClasse: {
    key: 'consignesClasse',
    label: consignesClasse.label || consignesClasse.name,
    name: consignesClasse.name,
    description: consignesClasse.description,
    words: consignesClasse.words,
  },
  reglesClasse: {
    key: 'reglesClasse',
    label: reglesClasse.label || reglesClasse.name,
    name: reglesClasse.name,
    description: reglesClasse.description,
    words: reglesClasse.words,
  },
  materielScolaire: {
    key: 'materielScolaire',
    label: materielScolaire.label || materielScolaire.name,
    name: materielScolaire.name,
    description: materielScolaire.description,
    words: materielScolaire.words,
  },
  activitesCapacites: {
    key: 'activitesCapacites',
    label: activitesCapacites.label || activitesCapacites.name,
    name: activitesCapacites.name,
    description: activitesCapacites.description,
    words: activitesCapacites.words,
  },
  actionsVerbs1: {
    key: 'actionsVerbs1',
    label: actionsVerbs1.label || actionsVerbs1.name,
    name: actionsVerbs1.name,
    description: actionsVerbs1.description,
    words: actionsVerbs1.words,
  },
  actionsVerbs2: {
    key: 'actionsVerbs2',
    label: actionsVerbs2.label || actionsVerbs2.name,
    name: actionsVerbs2.name,
    description: actionsVerbs2.description,
    words: actionsVerbs2.words,
  },
  fetesSymboles: {
    key: 'fetesSymboles',
    label: fetesSymboles.label || fetesSymboles.name,
    name: fetesSymboles.name,
    description: fetesSymboles.description,
    words: fetesSymboles.words,
  },
  thanksgiving: {
    key: 'thanksgiving',
    label: thanksgiving.label || thanksgiving.name,
    name: thanksgiving.name,
    description: thanksgiving.description,
    words: thanksgiving.words,
  },
  paysNationalites: {
    key: 'paysNationalites',
    label: paysNationalites.label || paysNationalites.name,
    name: paysNationalites.name,
    description: paysNationalites.description,
    words: paysNationalites.words,
  },
  prepositionsLieu: {
    key: 'prepositionsLieu',
    label: prepositionsLieu.label || prepositionsLieu.name,
    name: prepositionsLieu.name,
    description: prepositionsLieu.description,
    words: prepositionsLieu.words,
  },
  villePersonnes: {
    key: 'villePersonnes',
    label: villePersonnes.label || villePersonnes.name,
    name: villePersonnes.name,
    description: villePersonnes.description,
    words: villePersonnes.words,
  },
  maisonVetements: {
    key: 'maisonVetements',
    label: maisonVetements.label || maisonVetements.name,
    name: maisonVetements.name,
    description: maisonVetements.description,
    words: maisonVetements.words,
  },
  animauxObjets: {
    key: 'animauxObjets',
    label: animauxObjets.label || animauxObjets.name,
    name: animauxObjets.name,
    description: animauxObjets.description,
    words: animauxObjets.words,
  },
  alimentsBoissons: {
    key: 'alimentsBoissons',
    label: alimentsBoissons.label || alimentsBoissons.name,
    name: alimentsBoissons.name,
    description: alimentsBoissons.description,
    words: alimentsBoissons.words,
  },
  fruits: {
    key: 'fruits',
    label: fruits.label || fruits.name,
    name: fruits.name,
    description: fruits.description,
    words: fruits.words,
  },
  legumes: {
    key: 'legumes',
    label: legumes.label || legumes.name,
    name: legumes.name,
    description: legumes.description,
    words: legumes.words,
  },
  fruits2: {
    key: 'fruits2',
    label: fruits2.label || fruits2.name,
    name: fruits2.name,
    description: fruits2.description,
    words: fruits2.words,
  },
  legumes2: {
    key: 'legumes2',
    label: legumes2.label || legumes2.name,
    name: legumes2.name,
    description: legumes2.description,
    words: legumes2.words,
  },
  meteo: {
    key: 'meteo',
    label: meteo.label || meteo.name,
    name: meteo.name,
    description: meteo.description,
    words: meteo.words,
  },
};

const listFileByKey = {
  identiteEcole: 'identite-ecole.json',
  salutationsPolitesse: 'salutations-politesse.json',
  etatsRessentis: 'etats-ressentis.json',
  tempsSemaine: 'temps-semaine.json',
  consignesClasse: 'consignes-classe.json',
  reglesClasse: 'regles-classe.json',
  materielScolaire: 'materiel-scolaire.json',
  activitesCapacites: 'activites-capacites.json',
  actionsVerbs1: 'actions-verbs-1.json',
  actionsVerbs2: 'actions-verbs-2.json',
  fetesSymboles: 'fetes-symboles.json',
  thanksgiving: 'thanksgiving.json',
  paysNationalites: 'pays-nationalites.json',
  prepositionsLieu: 'prepositions-lieu.json',
  villePersonnes: 'ville-personnes.json',
  maisonVetements: 'maison-vetements.json',
  animauxObjets: 'animaux-objets.json',
  alimentsBoissons: 'aliments-boissons.json',
  fruits: 'fruits.json',
  legumes: 'legumes.json',
  fruits2: 'fruits-2.json',
  legumes2: 'legumes-2.json',
  meteo: 'meteo.json',
};

const runtimeEnglishLists = {};

export const englishLists = runtimeEnglishLists;
export const englishListOptions = [];

let remoteHydrated = false;
let remoteHydrationPromise = null;
let cachedRemoteVersion = '';

function cloneWords(words) {
  if (!Array.isArray(words)) {
    return [];
  }

  return words.map((word) => ({
    english: typeof word.english === 'string' ? word.english : '',
    french: typeof word.french === 'string' ? word.french : '',
  }));
}

function getBaseListEntries() {
  return Object.entries(baseEnglishLists).map(([key, list]) => [
    key,
    {
      ...list,
      words: cloneWords(list.words),
    },
  ]);
}

function resetRuntimeEnglishListsToBase() {
  for (const key of Object.keys(runtimeEnglishLists)) {
    delete runtimeEnglishLists[key];
  }

  for (const [key, list] of getBaseListEntries()) {
    runtimeEnglishLists[key] = list;
  }
}

function sanitizeRuntimeList(payload, fallbackList) {
  const fallback = fallbackList || { key: '', name: '', label: '', description: '', words: [] };
  const name =
    payload && typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim()
      : fallback.name;
  const label =
    payload && typeof payload.label === 'string' && payload.label.trim()
      ? payload.label.trim()
      : fallback.label || fallback.name;
  const description =
    payload && typeof payload.description === 'string'
      ? payload.description.trim()
      : fallback.description;
  const words = cloneWords(payload?.words);

  return {
    key: fallback.key,
    name,
    label,
    description,
    words,
  };
}

function sanitizeListPayload(payload, fallbackList) {
  const fallback = fallbackList || { name: '', description: '', words: [] };
  const runtimeSafe = sanitizeRuntimeList(payload, {
    key: '',
    name: fallback.name,
    label: fallback.name,
    description: fallback.description,
    words: fallback.words,
  });

  return {
    name: runtimeSafe.name,
    description: runtimeSafe.description,
    words: runtimeSafe.words,
  };
}

function rebuildEnglishListOptions() {
  const options = Object.values(runtimeEnglishLists).map((list) => ({
    key: list.key,
    label: list.label,
    wordCount: Array.isArray(list.words) ? list.words.length : 0,
  }));

  englishListOptions.splice(0, englishListOptions.length, ...options);
}

function getStorageKey(listKey) {
  return `${STORAGE_PREFIX}${listKey}`;
}

function getLegacyStorageKey(listKey) {
  return `${LEGACY_STORAGE_PREFIX}${listKey}`;
}

async function fetchJsonWithTimeout(url, timeoutMs = REMOTE_TIMEOUT_MS) {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timeoutId = setTimeout(() => controller?.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeRemoteIndexEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const key = typeof entry.key === 'string' ? entry.key.trim() : '';
  const file = typeof entry.file === 'string' ? entry.file.trim() : '';

  if (!key || !file) {
    return null;
  }

  return { key, file };
}

function extractRemoteEntries(payload) {
  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.lists)
      ? payload.lists
      : [];

  return list.map(normalizeRemoteIndexEntry).filter(Boolean);
}

async function resolveRemoteManifest(baseUrl) {
  const remoteFolder = getRemoteFolder();
  const payload = await fetchJsonWithTimeout(`${baseUrl}/${remoteFolder}/manifest.json`);
  const version = getManifestVersionToken(payload);
  const normalizedEntries = normalizeManifestEntries(payload, version);

  return {
    payload,
    version,
    entries:
      normalizedEntries.length > 0
        ? normalizedEntries
        : extractRemoteEntries(payload).map((entry) => ({ ...entry, token: version, hasExplicitToken: false })),
  };
}

function upsertRuntimeList(listKey, payload) {
  const fallback = runtimeEnglishLists[listKey] || {
    key: listKey,
    name: listKey,
    label: listKey,
    description: '',
    words: [],
  };

  const sanitized = sanitizeRuntimeList(payload, { ...fallback, key: listKey });

  if (!Array.isArray(sanitized.words) || sanitized.words.length === 0) {
    return false;
  }

  runtimeEnglishLists[listKey] = sanitized;
  return true;
}

function applyRemotePayloads(payloads) {
  const entries = payloads && typeof payloads === 'object' ? Object.entries(payloads) : [];
  let updated = 0;

  for (const [key, payload] of entries) {
    if (upsertRuntimeList(key, payload)) {
      updated += 1;
    }
  }

  if (updated > 0) {
    rebuildEnglishListOptions();
  }

  return updated;
}

function applyCachedRemoteLists() {
  const cache = readRemotePayloadCache(REMOTE_CACHE_STORAGE_KEY);
  if (!cache.version || compareManifestVersionTokens(cache.version, LOCAL_MANIFEST_VERSION) <= 0) {
    cachedRemoteVersion = '';
    return 0;
  }

  const updated = applyRemotePayloads(cache.payloads);
  cachedRemoteVersion = updated > 0 ? cache.version : '';
  return updated;
}

function getEnvValue(keys) {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return '';
  }

  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function trimRemoteFolder(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .trim();
}

function getRemoteBaseUrl() {
  const env = getEnvValue([
    'VITE_ENGLISH_VOCAB_REMOTE_BASE_URL',
    'VITE_REMOTE_CONTENT_BASE_URL',
    'VITE_LANGUAGES_REMOTE_BASE_URL',
    'VITE_VOCAB_REMOTE_BASE_URL',
  ]);

  if (!env) {
    return '';
  }

  return env.replace(/\/$/, '');
}

function getLegacyRemoteLanguage() {
  const env = getEnvValue(['VITE_LANGUAGES_REMOTE_LANG', 'VITE_VOCAB_REMOTE_LANG']);

  const lang = typeof env === 'string' ? env.toLowerCase() : '';
  return lang || DEFAULT_REMOTE_LANG;
}

function getRemoteFolder() {
  const explicitFolder = trimRemoteFolder(
    getEnvValue(['VITE_ENGLISH_VOCAB_REMOTE_FOLDER', 'VITE_LANGUAGES_REMOTE_FOLDER'])
  );

  if (explicitFolder) {
    return explicitFolder;
  }

  if (getEnvValue(['VITE_LANGUAGES_REMOTE_BASE_URL', 'VITE_VOCAB_REMOTE_BASE_URL'])) {
    return getLegacyRemoteLanguage();
  }

  return DEFAULT_REMOTE_FOLDER;
}

resetRuntimeEnglishListsToBase();
applyCachedRemoteLists();
rebuildEnglishListOptions();

export function listEnglishOptions() {
  return Object.values(runtimeEnglishLists).map((list) => ({
    key: list.key,
    label: list.label,
    wordCount: Array.isArray(list.words) ? list.words.length : 0,
  }));
}

export async function hydrateRemoteEnglishLists() {
  if (remoteHydrated) {
    return { enabled: !!getRemoteBaseUrl(), loaded: 0, updated: 0, skipped: 0 };
  }

  if (remoteHydrationPromise) {
    return remoteHydrationPromise;
  }

  remoteHydrationPromise = (async () => {
    const baseUrl = getRemoteBaseUrl();
    if (!baseUrl || typeof window === 'undefined' || typeof fetch !== 'function') {
      remoteHydrated = true;
      return { enabled: false, loaded: 0, updated: 0, skipped: 0 };
    }

    const { version: remoteManifestVersion, entries } = await resolveRemoteManifest(baseUrl);
    const baselineVersion = getLatestManifestVersionToken(LOCAL_MANIFEST_VERSION, cachedRemoteVersion);
    const currentCache = readRemotePayloadCache(REMOTE_CACHE_STORAGE_KEY);
    const cachedEntryIndex = currentCache.entries || {};

    if (!remoteManifestVersion || compareManifestVersionTokens(remoteManifestVersion, baselineVersion) <= 0) {
      remoteHydrated = true;
      return {
        enabled: true,
        loaded: 0,
        updated: 0,
        skipped: entries.length > 0 || remoteManifestVersion ? 1 : 0,
      };
    }

    if (entries.length === 0) {
      remoteHydrated = true;
      return { enabled: true, loaded: 0, updated: 0, skipped: 1 };
    }

    const remoteFolder = getRemoteFolder();
    const payloads = {};
    const persistedPayloads = { ...(currentCache.payloads || {}) };
    const persistedEntries = { ...(currentCache.entries || {}) };
    let loaded = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const manifestProvidesEntryTokens = entries.some((entry) => entry.hasExplicitToken);

    for (const entry of entries) {
      const { key, file } = entry;
      const baselineEntry = cachedEntryIndex[key] || LOCAL_MANIFEST_ENTRY_INDEX[key] || { token: baselineVersion };
      if (manifestProvidesEntryTokens && !hasManifestEntryChanged(entry, baselineEntry)) {
        persistedEntries[key] = baselineEntry;
        skipped += 1;
        continue;
      }

      const payload = await fetchJsonWithTimeout(`${baseUrl}/${remoteFolder}/${file}`);
      if (!payload) {
        skipped += 1;
        failed += 1;
        continue;
      }

      loaded += 1;
      payloads[key] = payload;
      persistedPayloads[key] = payload;
      persistedEntries[key] = {
        key,
        file,
        token: entry.token || remoteManifestVersion,
      };
      if (upsertRuntimeList(key, payload)) {
        updated += 1;
      }
    }

    rebuildEnglishListOptions();

    if (failed === 0) {
      if (
        writeRemotePayloadCache(REMOTE_CACHE_STORAGE_KEY, {
          version: remoteManifestVersion,
          entries: persistedEntries,
          payloads: persistedPayloads,
        })
      ) {
        cachedRemoteVersion = remoteManifestVersion;
      }
    }

    remoteHydrated = true;

    return {
      enabled: true,
      loaded,
      updated,
      skipped,
    };
  })();

  try {
    return await remoteHydrationPromise;
  } finally {
    remoteHydrationPromise = null;
  }
}

export function getEnglishList(listKey) {
  const baseList = runtimeEnglishLists[listKey];
  if (!baseList) {
    return null;
  }

  if (typeof window === 'undefined') {
    return sanitizeListPayload(baseList, baseList);
  }

  const key = getStorageKey(listKey);
  const legacyKey = getLegacyStorageKey(listKey);
  let raw = localStorage.getItem(key);

  if (!raw) {
    raw = localStorage.getItem(legacyKey);
  }

  if (!raw) {
    return sanitizeListPayload(baseList, baseList);
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeListPayload(parsed, baseList);

    if (!localStorage.getItem(key)) {
      try {
        localStorage.setItem(key, JSON.stringify(sanitized));
        localStorage.removeItem(legacyKey);
      } catch {
        // Ignore migration write errors.
      }
    }

    return sanitized;
  } catch {
    return sanitizeListPayload(baseList, baseList);
  }
}

export function saveEnglishList(listKey, payload) {
  const baseList = runtimeEnglishLists[listKey];
  if (!baseList || typeof window === 'undefined') {
    return false;
  }

  const sanitized = sanitizeListPayload(payload, baseList);
  try {
    localStorage.setItem(getStorageKey(listKey), JSON.stringify(sanitized));
    localStorage.removeItem(getLegacyStorageKey(listKey));
    return true;
  } catch {
    return false;
  }
}

export function resetEnglishList(listKey) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(getStorageKey(listKey));
  localStorage.removeItem(getLegacyStorageKey(listKey));
}

export function resetEnglishListsRuntimeForTests() {
  resetRuntimeEnglishListsToBase();
  remoteHydrated = false;
  remoteHydrationPromise = null;
  cachedRemoteVersion = '';
  applyCachedRemoteLists();
  rebuildEnglishListOptions();
}
