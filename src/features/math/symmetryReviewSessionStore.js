export const SYMMETRY_REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVIEW: 'review',
  REJECTED: 'rejected',
});

export const SYMMETRY_REVIEW_SESSION_STORAGE_KEY = 'wizlev_admin_symmetry_review_session_v1';

const VALID_REVIEW_STATUS = new Set(Object.values(SYMMETRY_REVIEW_STATUS));
const AUTO_DRIVEN_REVIEW_STATUS = new Set([
  SYMMETRY_REVIEW_STATUS.ACCEPTED,
  SYMMETRY_REVIEW_STATUS.REVIEW,
  SYMMETRY_REVIEW_STATUS.REJECTED,
]);

function resolveStorage(storageOverride) {
  if (storageOverride) {
    return storageOverride;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function normalizeReviewEntry(entry) {
  const reviewStatus = VALID_REVIEW_STATUS.has(entry?.reviewStatus)
    ? entry.reviewStatus
    : SYMMETRY_REVIEW_STATUS.PENDING;
  const deleted = entry?.deleted === true;

  return {
    reviewStatus,
    deleted,
  };
}

function shouldPersistReviewEntry(entry) {
  return entry.deleted || entry.reviewStatus !== SYMMETRY_REVIEW_STATUS.PENDING;
}

function resolveDefaultReviewStatus(autoStatus) {
  return AUTO_DRIVEN_REVIEW_STATUS.has(autoStatus) ? autoStatus : SYMMETRY_REVIEW_STATUS.PENDING;
}

function resolveInitialReviewStatus(autoStatus, sourceReviewStatus) {
  if (VALID_REVIEW_STATUS.has(sourceReviewStatus)) {
    return sourceReviewStatus;
  }
  return resolveDefaultReviewStatus(autoStatus);
}

export function createEmptySymmetryReviewSession() {
  return {
    entries: {},
  };
}

export function readSymmetryReviewSession(storageOverride) {
  const storage = resolveStorage(storageOverride);
  if (!storage) {
    return createEmptySymmetryReviewSession();
  }

  try {
    const raw = storage.getItem(SYMMETRY_REVIEW_SESSION_STORAGE_KEY);
    if (!raw) {
      return createEmptySymmetryReviewSession();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object' || !parsed.entries) {
      return createEmptySymmetryReviewSession();
    }

    const entries = Object.fromEntries(
      Object.entries(parsed.entries)
        .filter(([id]) => typeof id === 'string' && id.length > 0)
        .map(([id, entry]) => [id, normalizeReviewEntry(entry)])
        .filter(([, entry]) => shouldPersistReviewEntry(entry))
    );

    return { entries };
  } catch {
    return createEmptySymmetryReviewSession();
  }
}

export function writeSymmetryReviewSession(session, storageOverride) {
  const storage = resolveStorage(storageOverride);
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(SYMMETRY_REVIEW_SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function createSymmetryReviewSession(results, storageOverride) {
  const persisted = readSymmetryReviewSession(storageOverride);
  const validIds = new Set(
    (Array.isArray(results) ? results : [])
      .map((entry) => entry?.id)
      .filter((id) => typeof id === 'string' && id.length > 0)
  );

  const entries = Object.fromEntries(
    Object.entries(persisted.entries)
      .filter(([id]) => validIds.has(id))
      .map(([id, entry]) => [id, normalizeReviewEntry(entry)])
      .filter(([, entry]) => shouldPersistReviewEntry(entry))
  );

  const session = { entries };
  writeSymmetryReviewSession(session, storageOverride);
  return session;
}

export function getSymmetryReviewEntryState(session, id, autoStatus, sourceReviewStatus = '') {
  const entry = session?.entries?.[id];
  const initialReviewStatus = resolveInitialReviewStatus(autoStatus, sourceReviewStatus);
  if (!entry) {
    return {
      reviewStatus: initialReviewStatus,
      deleted: false,
      manualOverrideActive: initialReviewStatus !== resolveDefaultReviewStatus(autoStatus),
    };
  }

  const normalized = normalizeReviewEntry(entry);
  const defaultReviewStatus = initialReviewStatus;

  return {
    ...normalized,
    manualOverrideActive: normalized.reviewStatus !== defaultReviewStatus,
  };
}

export function setSymmetryReviewStatus(session, id, reviewStatus, autoStatus, sourceReviewStatus = '') {
  if (typeof id !== 'string' || !id || !VALID_REVIEW_STATUS.has(reviewStatus)) {
    return session;
  }

  const currentState = getSymmetryReviewEntryState(session, id, autoStatus, sourceReviewStatus);
  const defaultReviewStatus = resolveInitialReviewStatus(autoStatus, sourceReviewStatus);
  const nextState = {
    ...currentState,
    reviewStatus,
  };
  const nextEntries = {
    ...(session?.entries || {}),
  };

  if (nextState.deleted || nextState.reviewStatus !== defaultReviewStatus) {
    nextEntries[id] = {
      reviewStatus: nextState.reviewStatus,
      deleted: nextState.deleted,
    };
  } else {
    delete nextEntries[id];
  }

  return {
    entries: nextEntries,
  };
}

export function toggleSymmetryReviewDeleted(session, id, autoStatus, sourceReviewStatus = '') {
  if (typeof id !== 'string' || !id) {
    return session;
  }

  const currentState = getSymmetryReviewEntryState(session, id, autoStatus, sourceReviewStatus);
  const defaultReviewStatus = resolveInitialReviewStatus(autoStatus, sourceReviewStatus);
  const nextState = {
    ...currentState,
    deleted: !currentState.deleted,
  };
  const nextEntries = {
    ...(session?.entries || {}),
  };

  if (nextState.deleted || nextState.reviewStatus !== defaultReviewStatus) {
    nextEntries[id] = {
      reviewStatus: nextState.reviewStatus,
      deleted: nextState.deleted,
    };
  } else {
    delete nextEntries[id];
  }

  return {
    entries: nextEntries,
  };
}

export function hasSymmetryReviewSessionChanges(session) {
  return Object.values(session?.entries || {}).some(shouldPersistReviewEntry);
}

export function applySymmetryReviewSession(results, session) {
  const items = Array.isArray(results) ? results : [];

  return items.map((entry) => {
    const state = getSymmetryReviewEntryState(session, entry.id, entry.status, entry.sourceReviewStatus);
    return {
      ...entry,
      autoStatus: entry.status,
      reviewStatus: state.reviewStatus,
      deleted: state.deleted,
      manualOverrideActive: state.manualOverrideActive,
    };
  });
}

export function summarizeSymmetryReviewEntries(entries) {
  const items = Array.isArray(entries) ? entries : [];
  return {
    total: items.length,
    pending: items.filter((entry) => entry.reviewStatus === SYMMETRY_REVIEW_STATUS.PENDING).length,
    accepted: items.filter((entry) => entry.reviewStatus === SYMMETRY_REVIEW_STATUS.ACCEPTED).length,
    review: items.filter((entry) => entry.reviewStatus === SYMMETRY_REVIEW_STATUS.REVIEW).length,
    rejected: items.filter((entry) => entry.reviewStatus === SYMMETRY_REVIEW_STATUS.REJECTED).length,
    deleted: items.filter((entry) => entry.deleted).length,
  };
}
