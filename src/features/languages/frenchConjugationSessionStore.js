const STORAGE_PREFIX = 'wizlev_french_';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function sanitizeToken(value, fallback = 'default') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function buildFrenchSessionKey(mode, verbKey, metric) {
  return `${STORAGE_PREFIX}${sanitizeToken(mode)}_${sanitizeToken(verbKey)}_${sanitizeToken(metric)}`;
}

export function createFrenchModeSessionStore(
  mode,
  verbKey,
  moodKey = 'indicatif',
  tenseKey = 'present'
) {
  const scopeKey = `${sanitizeToken(verbKey)}_${sanitizeToken(moodKey)}_${sanitizeToken(tenseKey)}`;
  const bestScoreKey = buildFrenchSessionKey(mode, scopeKey, 'best_score');
  const bestStreakKey = buildFrenchSessionKey(mode, scopeKey, 'best_streak');

  function readNumber(key) {
    const storage = getStorage();
    if (!storage) {
      return 0;
    }

    try {
      const raw = storage.getItem(key);
      const parsed = Number.parseInt(raw ?? '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function writeNumber(key, value) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(key, String(Math.max(0, Number.parseInt(value, 10) || 0)));
    } catch {
      // Ignore localStorage failures.
    }
  }

  return {
    bestScoreKey,
    bestStreakKey,
    readBestScore() {
      return readNumber(bestScoreKey);
    },
    writeBestScore(value) {
      writeNumber(bestScoreKey, value);
    },
    readBestStreak() {
      return readNumber(bestStreakKey);
    },
  };
}
