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

const SESSION_KEY = 'wizlev_admin_session_v1';

let originalWindow;
let originalLocalStorage;
let sessionStorage;

async function loadRouterWithMemoryHistory() {
  vi.resetModules();

  vi.doMock('vue-router', async () => {
    const actual = await vi.importActual('vue-router');
    return {
      ...actual,
      createWebHistory: actual.createMemoryHistory,
    };
  });

  const module = await import('./index.js');
  return module.default;
}

function setSessionExpiration(expiresAtMs) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      expiresAtMs,
    })
  );
}

beforeEach(() => {
  originalWindow = globalThis.window;
  originalLocalStorage = globalThis.localStorage;

  const localStorage = new MemoryStorage();
  sessionStorage = new MemoryStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
    },
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorage,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: originalLocalStorage,
  });
});

describe('studio-ops flow integration', () => {
  it(
    'redirects public legacy routes to the /fr canonical space',
    async () => {
      const router = await loadRouterWithMemoryHistory();

      await router.push('/');
      expect(router.currentRoute.value.fullPath).toBe('/fr');
      expect(router.currentRoute.value.name).toBe('home');

      await router.push('/languages/english');
      expect(router.currentRoute.value.fullPath).toBe('/fr/languages/english');
      expect(router.currentRoute.value.name).toBe('languages-english');

      await router.push('/legal/privacy-policy');
      expect(router.currentRoute.value.fullPath).toBe('/fr/legal/privacy-policy');
      expect(router.currentRoute.value.name).toBe('legal-privacy');
    },
    20000
  );

  it(
    'redirects unauthenticated access from panel to login',
    async () => {
      const router = await loadRouterWithMemoryHistory();

      await router.push('/-/studio-ops/panel');

      expect(router.currentRoute.value.name).toBe('studio-ops-login');
    },
    20000
  );

  it(
    'supports login route then panel access, and redirects again after session expiration',
    async () => {
      const router = await loadRouterWithMemoryHistory();

      await router.push('/-/studio-ops');
      expect(router.currentRoute.value.name).toBe('studio-ops-login');

      setSessionExpiration(Date.now() + 60_000);
      await router.push('/-/studio-ops/panel');
      expect(router.currentRoute.value.name).toBe('studio-ops-panel');

      setSessionExpiration(Date.now() - 1);
      await router.push('/languages/english');
      await router.push('/-/studio-ops/panel');
      expect(router.currentRoute.value.name).toBe('studio-ops-login');
    },
    20000
  );
});
