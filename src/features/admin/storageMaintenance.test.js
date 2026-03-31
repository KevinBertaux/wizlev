import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executeResetAction,
  getHistoryLimit,
  getMaintenanceHistory,
  getStorageSnapshot,
  previewResetAction,
  rollbackResetAction,
  setHistoryLimit,
} from './storageMaintenance';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  get length() {
    return this.map.size;
  }

  key(index) {
    return Array.from(this.map.keys())[index] ?? null;
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
let localStorage;
let sessionStorage;

beforeEach(() => {
  originalWindow = globalThis.window;
  localStorage = new MemoryStorage();
  sessionStorage = new MemoryStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
});

describe('storageMaintenance', () => {
  it('normalizes history limit within bounds and step', () => {
    expect(setHistoryLimit(22)).toBe(20);
    expect(getHistoryLimit()).toBe(20);

    expect(setHistoryLimit(3)).toBe(10);
    expect(getHistoryLimit()).toBe(10);

    expect(setHistoryLimit(999)).toBe(50);
    expect(getHistoryLimit()).toBe(50);
  });

  it('resets streak keys with preset and keeps unrelated keys', () => {
    localStorage.setItem('wizlev_math_best_streak_v1', '12');
    localStorage.setItem('wizlev_symmetry_best_streak_v1', '8');
    localStorage.setItem('wizlev_tts_rate', '1');

    const result = executeResetAction({
      actionLabel: 'Reset streaks',
      presetId: 'streaks',
      includeSession: false,
    });

    expect(result.targetCount).toBe(2);
    expect(result.removedCount).toBe(2);
    expect(localStorage.getItem('wizlev_math_best_streak_v1')).toBeNull();
    expect(localStorage.getItem('wizlev_symmetry_best_streak_v1')).toBeNull();
    expect(localStorage.getItem('wizlev_tts_rate')).toBe('1');

    const history = getMaintenanceHistory();
    expect(history).toHaveLength(1);
    expect(history[0].affected).toHaveLength(2);
  });

  it('rolls back a maintenance action from history', () => {
    localStorage.setItem('wizlev_math_best_streak_v1', '10');
    localStorage.setItem('wizlev_symmetry_best_streak_v1', '6');

    const resetResult = executeResetAction({
      actionLabel: 'Reset streaks',
      presetId: 'streaks',
      includeSession: false,
    });
    const rollback = rollbackResetAction(resetResult.historyId);

    expect(rollback.found).toBe(true);
    expect(rollback.restoredCount).toBe(2);
    expect(localStorage.getItem('wizlev_math_best_streak_v1')).toBe('10');
    expect(localStorage.getItem('wizlev_symmetry_best_streak_v1')).toBe('6');
  });

  it('excludes session targets from admin preview when includeSession=false', () => {
    const previewWithoutSession = previewResetAction({
      presetId: 'admin',
      includeSession: false,
    });
    const previewWithSession = previewResetAction({
      presetId: 'admin',
      includeSession: true,
    });

    expect(previewWithoutSession.targets.some((entry) => entry.storage === 'session')).toBe(false);
    expect(previewWithSession.targets.some((entry) => entry.storage === 'session')).toBe(true);
  });

  it('returns found=false when rollback id does not exist', () => {
    const rollback = rollbackResetAction('history-does-not-exist');
    expect(rollback).toEqual({
      restoredCount: 0,
      found: false,
    });
  });

  it('detects unknown wizlev keys in snapshot', () => {
    localStorage.setItem('wizlev_custom_experiment_v1', 'enabled');

    const snapshot = getStorageSnapshot();
    const unknown = snapshot.find((entry) => entry.key === 'wizlev_custom_experiment_v1');

    expect(unknown).toBeDefined();
    expect(unknown?.label).toContain('Clé non référencée');
    expect(unknown?.exists).toBe(true);
  });

  it('supports targeted custom preview using selected key refs', () => {
    localStorage.setItem('wizlev_tts_rate', '1');
    sessionStorage.setItem('wizlev_admin_session_v1', '{"expiresAtMs":123}');

    const preview = previewResetAction({
      selectedKeys: [
        'local:wizlev_tts_rate',
        'session:wizlev_admin_session_v1',
      ],
      includeSession: false,
    });

    expect(preview.targets).toHaveLength(1);
    expect(preview.targets[0].key).toBe('wizlev_tts_rate');
    expect(preview.targets[0].storage).toBe('local');
  });
});
