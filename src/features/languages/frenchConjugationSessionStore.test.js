import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildFrenchSessionKey, createFrenchModeSessionStore } from './frenchConjugationSessionStore';

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
}

let originalWindow;

beforeEach(() => {
  originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: new MemoryStorage() },
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
});

describe('frenchConjugationSessionStore', () => {
  it('builds stable keys per mode and verb', () => {
    expect(buildFrenchSessionKey('qcm', 'etre', 'best_score')).toBe(
      'manabuplay_french_qcm_etre_best_score'
    );
  });

  it('reads and writes best score with isolated keys', () => {
    const store = createFrenchModeSessionStore('qcm', 'aller');

    expect(store.readBestScore()).toBe(0);
    store.writeBestScore(7);
    expect(store.readBestScore()).toBe(7);
    expect(store.readBestStreak()).toBe(0);
  });
});
