import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getEnglishList, listEnglishOptions, resetEnglishList, saveEnglishList } from './englishLists';

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
let storage;

beforeEach(() => {
  originalWindow = globalThis.window;
  originalLocalStorage = globalThis.localStorage;

  storage = new MemoryStorage();

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
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: originalLocalStorage,
  });
});

describe('englishLists storage behavior', () => {
  it('returns base list when no override exists', () => {
    const list = getEnglishList('fruits');

    expect(list).not.toBeNull();
    expect(list.name.length).toBeGreaterThan(0);
    expect(Array.isArray(list.words)).toBe(true);
    expect(list.words.length).toBeGreaterThan(0);
  });

  it('exposes actionsVerbs1 and actionsVerbs2 in local fallback', () => {
    const list1 = getEnglishList('actionsVerbs1');
    const list2 = getEnglishList('actionsVerbs2');
    const options = listEnglishOptions();

    expect(list1).not.toBeNull();
    expect(list1.name).toBe('Actions et verbes 1');
    expect(list1.words.length).toBe(25);

    expect(list2).not.toBeNull();
    expect(list2.name).toBe('Actions et verbes 2');
    expect(list2.words.length).toBe(25);

    expect(options.some((item) => item.key === 'actionsVerbs1')).toBe(true);
    expect(options.some((item) => item.key === 'actionsVerbs2')).toBe(true);
  });

  it('saves and returns sanitized payload', () => {
    const saved = saveEnglishList('fruits', {
      name: '  Fruits perso ',
      description: '  ma liste  ',
      words: [
        { english: ' Apple ', french: ' Pomme ' },
        { english: 123, french: null },
      ],
    });

    expect(saved).toBe(true);

    const list = getEnglishList('fruits');
    expect(list).toEqual({
      name: 'Fruits perso',
      description: 'ma liste',
      words: [
        { english: ' Apple ', french: ' Pomme ' },
        { english: '', french: '' },
      ],
    });
  });


  it('falls back to base list when stored JSON is invalid', () => {
    const baseline = getEnglishList('fruits');
    storage.setItem('wizlev_english_list_fruits', '{broken-json');

    const list = getEnglishList('fruits');
    expect(list).toEqual(baseline);
  });

  it('resets current override', () => {
    storage.setItem('wizlev_english_list_fruits', JSON.stringify({ name: 'Current', words: [] }));

    resetEnglishList('fruits');

    expect(storage.getItem('wizlev_english_list_fruits')).toBeNull();
  });


  it('returns false when localStorage.setItem throws on save', () => {
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const saved = saveEnglishList('fruits', {
      name: 'Fruits',
      description: '',
      words: [{ english: 'Apple', french: 'Pomme' }],
    });

    expect(saved).toBe(false);
  });

  it('returns null / false for unknown list keys', () => {
    expect(getEnglishList('unknown-key')).toBeNull();
    expect(saveEnglishList('unknown-key', { name: 'x', words: [] })).toBe(false);
  });
});


