import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import aimerVerb from '@/content/languages/fr/conjugation/verbs/aimer.json';
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
          version: '2026-03-25.1',
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
      version: '2026-03-25.1',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
          version: '2026-03-25.2',
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
              version: '2026-03-25.2',
            },
          ],
        });
      }
      if (asText.endsWith('/languages/fr/conjugation/verbs/venir.json')) {
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
      version: '2026-03-25.2',
    });
    expect(getFrenchVerb('aimer', source, 'indicatif', 'present')?.forms?.je).toBe('aime');
    expect(getFrenchVerb('venir', source, 'indicatif', 'present')?.forms?.je).toBe('viens remote');
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
          version: '2026-03-25.2',
          generatedAt: '2026-03-25',
          schemaFile: 'schema.fr.v1.json',
          schemaUpdatedAt: '2026-03-17.1',
          verbs: [
            {
              key: 'aimer',
              label: 'Aimer',
              file: 'verbs/aimer.json',
              version: '2026-03-25.2',
            },
          ],
        });
      }
      if (asText.endsWith('/languages/fr/conjugation/verbs/aimer.json')) {
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
      version: '2026-03-25.2',
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
      version: '2026-03-25.1',
    });
    expect(getFrenchInflectionModule()).toEqual(baseline);
    expect(
      getFrenchVerb('aimer', getFrenchInflectionModule(), 'indicatif', 'present')?.forms?.je
    ).toBe('aime');
  });
});
