import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

async function loadEnglishModule() {
  return import('./englishLists');
}

function okJson(payload) {
  return {
    ok: true,
    json: async () => payload,
  };
}

describe('englishLists remote hydration', () => {
  it('returns disabled when remote base URL is empty', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', '');
    vi.stubEnv('VITE_VOCAB_REMOTE_BASE_URL', '');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', '');
    vi.stubEnv('VITE_VOCAB_REMOTE_LANG', '');

    const { hydrateRemoteEnglishLists } = await loadEnglishModule();
    const result = await hydrateRemoteEnglishLists();

    expect(result).toEqual({
      enabled: false,
      loaded: 0,
      updated: 0,
      skipped: 0,
    });
  });

  it('keeps local fallback when remote manifest version is not newer', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.1',
          lists: [{ key: 'fruits', file: 'fruits.json' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const { getEnglishList, hydrateRemoteEnglishLists } = await loadEnglishModule();
    const baseline = getEnglishList('fruits');
    const result = await hydrateRemoteEnglishLists();

    expect(result).toEqual({
      enabled: true,
      loaded: 0,
      updated: 0,
      skipped: 1,
    });
    expect(getEnglishList('fruits')).toEqual(baseline);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hydrates only manifest-declared lists when remote manifest is newer', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.3',
          lists: [
            { key: 'fruits', file: 'fruits.json' },
            { key: 'bonusList', file: 'bonus.json' },
          ],
        });
      }
      if (asText.endsWith('/en/fruits.json')) {
        return okJson({
          name: '🍉 Fruits distants',
          label: '🍉 Fruits distants',
          description: 'Liste chargee depuis R2',
          words: [{ english: 'Watermelon', french: 'Pasteque' }],
        });
      }
      if (asText.endsWith('/en/bonus.json')) {
        return okJson({
          name: '🧪 Bonus',
          label: '🧪 Bonus',
          description: 'Liste injectee via manifest distant',
          words: [{ english: 'Test', french: 'Essai' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const { getEnglishList, hydrateRemoteEnglishLists, listEnglishOptions } = await loadEnglishModule();
    const result = await hydrateRemoteEnglishLists();

    expect(result).toEqual({
      enabled: true,
      loaded: 2,
      updated: 2,
      skipped: 0,
    });
    expect(getEnglishList('fruits')?.name).toBe('🍉 Fruits distants');
    expect(getEnglishList('bonusList')?.name).toBe('🧪 Bonus');
    expect(listEnglishOptions().some((item) => item.key === 'bonusList')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('downloads only entries marked as changed when the remote manifest exposes per-entry versions', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.3',
          lists: [
            { key: 'fruits', file: 'fruits.json', version: '2026-03-25.2' },
            { key: 'bonusList', file: 'bonus.json', version: '2026-03-25.3' },
          ],
        });
      }
      if (asText.endsWith('/en/bonus.json')) {
        return okJson({
          name: '🧪 Bonus delta',
          label: '🧪 Bonus delta',
          description: 'Liste distante delta',
          words: [{ english: 'Delta', french: 'Delta' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const { getEnglishList, hydrateRemoteEnglishLists } = await loadEnglishModule();
    const baselineFruits = getEnglishList('fruits');
    const result = await hydrateRemoteEnglishLists();

    expect(result).toEqual({
      enabled: true,
      loaded: 1,
      updated: 1,
      skipped: 1,
    });
    expect(getEnglishList('fruits')).toEqual(baselineFruits);
    expect(getEnglishList('bonusList')?.name).toBe('🧪 Bonus delta');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reuses cached remote payloads on next import when cache version is newer than local', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.3',
          lists: [{ key: 'fruits', file: 'fruits.json' }],
        });
      }
      if (asText.endsWith('/en/fruits.json')) {
        return okJson({
          name: '🍓 Fruits en cache',
          label: '🍓 Fruits en cache',
          description: 'Version remote a remettre sans reseau',
          words: [{ english: 'Strawberry', french: 'Fraise' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    let englishModule = await loadEnglishModule();
    await englishModule.hydrateRemoteEnglishLists();
    expect(englishModule.getEnglishList('fruits')?.name).toBe('🍓 Fruits en cache');

    vi.resetModules();
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', '');
    vi.stubEnv('VITE_VOCAB_REMOTE_BASE_URL', '');
    englishModule = await loadEnglishModule();

    expect(englishModule.getEnglishList('fruits')?.name).toBe('🍓 Fruits en cache');
  });

  it('does not cache a partial remote hydration', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.3',
          lists: [
            { key: 'fruits', file: 'fruits.json' },
            { key: 'bonusList', file: 'bonus.json' },
          ],
        });
      }
      if (asText.endsWith('/en/fruits.json')) {
        return okJson({
          name: '🍏 Fruits partiels',
          label: '🍏 Fruits partiels',
          description: 'Hydratation incomplete',
          words: [{ english: 'Green apple', french: 'Pomme verte' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    let englishModule = await loadEnglishModule();
    const baseline = englishModule.getEnglishList('fruits');
    const result = await englishModule.hydrateRemoteEnglishLists();

    expect(result).toEqual({
      enabled: true,
      loaded: 1,
      updated: 1,
      skipped: 1,
    });
    expect(englishModule.getEnglishList('fruits')?.name).toBe('🍏 Fruits partiels');

    vi.resetModules();
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', '');
    vi.stubEnv('VITE_VOCAB_REMOTE_BASE_URL', '');
    englishModule = await loadEnglishModule();

    expect(englishModule.getEnglishList('fruits')).toEqual(baseline);
    expect(englishModule.getEnglishList('bonusList')).toBeNull();
  });

  it('hydrates only once and returns cached state on subsequent call', async () => {
    vi.stubEnv('VITE_LANGUAGES_REMOTE_BASE_URL', 'https://example.test');
    vi.stubEnv('VITE_LANGUAGES_REMOTE_LANG', 'en');

    const fetchMock = vi.fn(async (url) => {
      const asText = String(url);
      if (asText.endsWith('/en/manifest.json')) {
        return okJson({
          version: '2026-03-25.3',
          lists: [{ key: 'fruits', file: 'fruits.json' }],
        });
      }
      if (asText.endsWith('/en/fruits.json')) {
        return okJson({
          name: '🍍 Fruits distants',
          label: '🍍 Fruits distants',
          description: 'First load',
          words: [{ english: 'Pineapple', french: 'Ananas' }],
        });
      }
      return { ok: false, json: async () => ({}) };
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const { hydrateRemoteEnglishLists } = await loadEnglishModule();

    await hydrateRemoteEnglishLists();
    const firstCallCount = fetchMock.mock.calls.length;

    const secondResult = await hydrateRemoteEnglishLists();
    const secondCallCount = fetchMock.mock.calls.length;

    expect(secondResult).toEqual({
      enabled: true,
      loaded: 0,
      updated: 0,
      skipped: 0,
    });
    expect(secondCallCount).toBe(firstCallCount);
  });
});
