import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import aimerVerb from '@/content/languages/fr/conjugation/verbs/aimer.json';
import grandirVerb from '@/content/languages/fr/conjugation/verbs/grandir.json';
import venirVerb from '@/content/languages/fr/conjugation/verbs/venir.json';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

let originalWindow;
let originalLocalStorage;
let originalFetch;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function okJson(payload) {
  return {
    ok: true,
    json: async () => clone(payload),
  };
}

function renameVerbPayload(payload, { key, lemma, label }) {
  const renamed = clone(payload);
  renamed.key = key;
  renamed.lemma = lemma;
  renamed.label = label;
  renamed.forms['indicatif.present'].je = 'bondis';
  renamed.forms['indicatif.present'].tu = 'bondis';
  renamed.forms['indicatif.present'].il = 'bondit';
  renamed.forms['indicatif.present'].elle = 'bondit';
  renamed.forms['indicatif.present'].on = 'bondit';
  renamed.forms['indicatif.present'].nous = 'bondissons';
  renamed.forms['indicatif.present'].vous = 'bondissez';
  renamed.forms['indicatif.present'].ils = 'bondissent';
  renamed.forms['indicatif.present'].elles = 'bondissent';
  return renamed;
}

async function loadFrenchModule() {
  return import('./frenchConjugations');
}

beforeEach(() => {
  originalWindow = globalThis.window;
  originalLocalStorage = globalThis.localStorage;
  originalFetch = globalThis.fetch;

  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: originalLocalStorage,
  });
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: originalFetch,
  });
});

describe('frenchConjugations remote hydration', () => {
  it('returns disabled when remote base URL is empty', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', '');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', '');

    const { hydrateRemoteFrenchConjugationModule } = await loadFrenchModule();
    const result = await hydrateRemoteFrenchConjugationModule();

    expect(result).toEqual({
      enabled: false,
      loaded: 0,
      updated: 0,
      skipped: 0,
    });
  });

  it('keeps the local module when remote manifest version is not newer', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', 'languages/fr/conjugation');

    const fetchMock = vi.fn(async (url) => {
      if (String(url).endsWith('/languages/fr/conjugation/manifest.json')) {
        return okJson({
          version: '2026-03-25.2',
          schemaFile: 'schema.fr.v1.json',
          verbs: [{ key: 'aimer', file: 'verbs/aimer.json' }],
        });
      }

      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const {
      getFrenchInflectionModule,
      getFrenchInflectionRuntimeMeta,
      hydrateRemoteFrenchConjugationModule,
    } = await loadFrenchModule();
    const baseline = getFrenchInflectionModule();
    const result = await hydrateRemoteFrenchConjugationModule();

    expect(result).toEqual({
      enabled: true,
      loaded: 0,
      updated: 0,
      skipped: 1,
    });
    expect(getFrenchInflectionModule()).toEqual(baseline);
    expect(getFrenchInflectionRuntimeMeta()).toEqual({
      source: 'local',
      version: '2026-03-25.2',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/languages/fr/conjugation/manifest.json',
      expect.objectContaining({ cache: 'no-store', method: 'GET' })
    );
  });

  it('hydrates the french runtime with a newer remote manifest and fetches only changed entries', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', 'languages/fr/conjugation');

    const remoteVenir = clone(venirVerb);
    remoteVenir.label = 'Venir R2';
    remoteVenir.forms['indicatif.present'].je = 'viens remote';

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/languages/fr/conjugation/manifest.json')) {
        return okJson({
          schemaVersion: 1,
          kind: 'inflection-manifest',
          language: {
            key: 'fr',
            locale: 'fr-FR',
            label: 'Français',
          },
          version: '2026-03-25.3',
          generatedAt: '2026-03-25',
          schemaFile: 'schema.fr.v1.json',
          schemaUpdatedAt: '2026-03-17.1',
          verbs: [
            {
              key: 'aimer',
              label: 'Aimer',
              file: 'verbs/aimer.json',
              version: '2026-03-17.1',
            },
            {
              key: 'venir',
              label: 'Venir',
              file: 'verbs/venir.json',
              version: '2026-03-25.3',
            },
          ],
        });
      }
      if (asText.includes('/languages/fr/conjugation/verbs/venir.json?v=2026-03-25.3')) {
        return okJson(remoteVenir);
      }

      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const {
      getFrenchInflectionModule,
      getFrenchInflectionRuntimeMeta,
      getFrenchVerb,
      hydrateRemoteFrenchConjugationModule,
    } = await loadFrenchModule();
    const result = await hydrateRemoteFrenchConjugationModule();
    const source = getFrenchInflectionModule();

    expect(result).toEqual({
      enabled: true,
      loaded: 1,
      updated: 1,
      skipped: 2,
    });
    expect(getFrenchInflectionRuntimeMeta()).toEqual({
      source: 'remote',
      version: '2026-03-25.3',
    });
    expect(getFrenchVerb('aimer', source, 'indicatif', 'present')?.forms?.je).toBe('aime');
    expect(getFrenchVerb('venir', source, 'indicatif', 'present')?.forms?.je).toBe('viens remote');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.test/languages/fr/conjugation/manifest.json',
      expect.objectContaining({ cache: 'no-store', method: 'GET' })
    );
  });

  it('hydrates a new remote-only verb entry when the manifest adds it', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', 'languages/fr/conjugation');

    const remoteBondir = renameVerbPayload(clone(grandirVerb), {
      key: 'bondir',
      lemma: 'bondir',
      label: 'Bondir',
    });

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/languages/fr/conjugation/manifest.json')) {
        return okJson({
          schemaVersion: 1,
          kind: 'inflection-manifest',
          language: {
            key: 'fr',
            locale: 'fr-FR',
            label: 'Français',
          },
          version: '2026-03-25.3',
          generatedAt: '2026-03-25',
          schemaFile: 'schema.fr.v1.json',
          schemaUpdatedAt: '2026-03-17.1',
          verbs: [
            {
              key: 'aimer',
              label: 'Aimer',
              file: 'verbs/aimer.json',
              version: '2026-03-17.1',
            },
            {
              key: 'bondir',
              label: 'Bondir',
              file: 'verbs/bondir.json',
              version: '2026-03-25.3',
            },
          ],
        });
      }
      if (asText.includes('/languages/fr/conjugation/verbs/bondir.json?v=2026-03-25.3')) {
        return okJson(remoteBondir);
      }

      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const {
      getFrenchInflectionModule,
      getFrenchInflectionRuntimeMeta,
      getFrenchVerb,
      hydrateRemoteFrenchConjugationModule,
      listFrenchVerbOptions,
    } = await loadFrenchModule();
    const result = await hydrateRemoteFrenchConjugationModule();
    const source = getFrenchInflectionModule();

    expect(result).toEqual({
      enabled: true,
      loaded: 1,
      updated: 1,
      skipped: 2,
    });
    expect(getFrenchInflectionRuntimeMeta()).toEqual({
      source: 'remote',
      version: '2026-03-25.3',
    });
    expect(listFrenchVerbOptions(source).some((option) => option.value === 'bondir')).toBe(true);
    expect(getFrenchVerb('bondir', source, 'indicatif', 'present')?.forms?.je).toBe('bondis');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.test/languages/fr/conjugation/verbs/bondir.json?v=2026-03-25.3',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('reuses the cached remote module on the next import when cache version is newer than local', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', 'languages/fr/conjugation');

    const remoteAimer = clone(aimerVerb);
    remoteAimer.label = 'Aimer cache';
    remoteAimer.forms['indicatif.present'].je = 'aime cache';

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/languages/fr/conjugation/manifest.json')) {
        return okJson({
          schemaVersion: 1,
          kind: 'inflection-manifest',
          language: {
            key: 'fr',
            locale: 'fr-FR',
            label: 'Français',
          },
          version: '2026-03-25.4',
          generatedAt: '2026-03-25',
          schemaFile: 'schema.fr.v1.json',
          schemaUpdatedAt: '2026-03-17.1',
          verbs: [
            {
              key: 'aimer',
              label: 'Aimer',
              file: 'verbs/aimer.json',
              version: '2026-03-25.4',
            },
          ],
        });
      }
      if (asText.includes('/languages/fr/conjugation/verbs/aimer.json?v=2026-03-25.4')) {
        return okJson(remoteAimer);
      }

      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    let frenchModule = await loadFrenchModule();
    await frenchModule.hydrateRemoteFrenchConjugationModule();

    expect(
      frenchModule.getFrenchVerb(
        'aimer',
        frenchModule.getFrenchInflectionModule(),
        'indicatif',
        'present'
      )?.forms?.je
    ).toBe('aime cache');

    vi.resetModules();
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', '');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', '');
    frenchModule = await loadFrenchModule();

    expect(frenchModule.getFrenchInflectionRuntimeMeta()).toEqual({
      source: 'remote-cache',
      version: '2026-03-25.4',
    });
    expect(
      frenchModule.getFrenchVerb(
        'aimer',
        frenchModule.getFrenchInflectionModule(),
        'indicatif',
        'present'
      )?.forms?.je
    ).toBe('aime cache');
  });

  it('rejects a partial remote hydration and keeps the local module active', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_FRENCH_CONJUGATION_REMOTE_FOLDER', 'languages/fr/conjugation');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/languages/fr/conjugation/manifest.json')) {
        return okJson({
          schemaVersion: 1,
          kind: 'inflection-manifest',
          language: {
            key: 'fr',
            locale: 'fr-FR',
            label: 'Français',
          },
          version: '2026-03-25.3',
          generatedAt: '2026-03-25',
          schemaFile: 'schema.fr.v1.json',
          schemaUpdatedAt: '2026-03-17.1',
          verbs: [
            {
              key: 'aimer',
              label: 'Aimer',
              file: 'verbs/aimer.json',
              version: '2026-03-25.3',
            },
          ],
        });
      }

      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const {
      getFrenchInflectionModule,
      getFrenchInflectionRuntimeMeta,
      getFrenchVerb,
      hydrateRemoteFrenchConjugationModule,
    } = await loadFrenchModule();
    const baseline = clone(getFrenchInflectionModule());
    const result = await hydrateRemoteFrenchConjugationModule();

    expect(result).toEqual({
      enabled: true,
      loaded: 0,
      updated: 0,
      skipped: 1,
    });
    expect(getFrenchInflectionRuntimeMeta()).toEqual({
      source: 'local',
      version: '2026-03-25.2',
    });
    expect(getFrenchInflectionModule()).toEqual(baseline);
    expect(
      getFrenchVerb('aimer', getFrenchInflectionModule(), 'indicatif', 'present')?.forms?.je
    ).toBe('aime');
  });
});
