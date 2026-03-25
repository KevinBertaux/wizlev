import { describe, expect, it } from 'vitest';
import {
  applySymmetryReviewSession,
  createSymmetryReviewSession,
  hasSymmetryReviewSessionChanges,
  readSymmetryReviewSession,
  setSymmetryReviewStatus,
  summarizeSymmetryReviewEntries,
  SYMMETRY_REVIEW_STATUS,
  SYMMETRY_REVIEW_SESSION_STORAGE_KEY,
  toggleSymmetryReviewDeleted,
  writeSymmetryReviewSession,
} from '@/features/math/symmetryReviewSessionStore';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('symmetryReviewSessionStore', () => {
  it('prunes stale persisted entries when creating a session', () => {
    const storage = createMemoryStorage({
      [SYMMETRY_REVIEW_SESSION_STORAGE_KEY]: JSON.stringify({
        entries: {
          'shape-3-01': { reviewStatus: 'accepted', deleted: false },
          'shape-old': { reviewStatus: 'rejected', deleted: true },
        },
      }),
    });

    const session = createSymmetryReviewSession([{ id: 'shape-3-01' }, { id: 'shape-4-01' }], storage);

    expect(session.entries).toEqual({
      'shape-3-01': { reviewStatus: 'accepted', deleted: false },
    });
    expect(readSymmetryReviewSession(storage).entries).toEqual(session.entries);
  });

  it('marks dirty when a review status or delete flag is set', () => {
    let session = createSymmetryReviewSession([{ id: 'shape-3-01' }], createMemoryStorage());

    expect(hasSymmetryReviewSessionChanges(session)).toBe(false);

    session = setSymmetryReviewStatus(session, 'shape-3-01', SYMMETRY_REVIEW_STATUS.ACCEPTED, 'review');
    expect(hasSymmetryReviewSessionChanges(session)).toBe(true);

    session = setSymmetryReviewStatus(session, 'shape-3-01', 'review', 'review');
    expect(hasSymmetryReviewSessionChanges(session)).toBe(false);

    session = toggleSymmetryReviewDeleted(session, 'shape-3-01', 'review');
    expect(hasSymmetryReviewSessionChanges(session)).toBe(true);
  });

  it('applies manual review state on top of auto review results', () => {
    const results = [
      { id: 'shape-3-01', status: 'review', pointCount: 3 },
      { id: 'shape-4-01', status: 'accepted', pointCount: 4 },
    ];
    let session = createSymmetryReviewSession(results, createMemoryStorage());
    session = setSymmetryReviewStatus(session, 'shape-3-01', SYMMETRY_REVIEW_STATUS.REJECTED, 'review');
    session = toggleSymmetryReviewDeleted(session, 'shape-4-01', 'accepted');

    const applied = applySymmetryReviewSession(results, session);

    expect(applied).toEqual([
      {
        id: 'shape-3-01',
        status: 'review',
        pointCount: 3,
        autoStatus: 'review',
        reviewStatus: 'rejected',
        deleted: false,
        manualOverrideActive: true,
      },
      {
        id: 'shape-4-01',
        status: 'accepted',
        pointCount: 4,
        autoStatus: 'accepted',
        reviewStatus: 'accepted',
        deleted: true,
        manualOverrideActive: false,
      },
    ]);
  });

  it('uses source review status when no local session override exists', () => {
    const applied = applySymmetryReviewSession(
      [{ id: 'shape-5-01', status: 'review', sourceReviewStatus: 'accepted', pointCount: 5 }],
      createSymmetryReviewSession([], createMemoryStorage())
    );

    expect(applied[0]).toMatchObject({
      reviewStatus: 'accepted',
      autoStatus: 'review',
      manualOverrideActive: true,
    });
  });

  it('summarizes counts by final review status and deletion', () => {
    const summary = summarizeSymmetryReviewEntries([
      { reviewStatus: 'pending', deleted: false },
      { reviewStatus: 'accepted', deleted: false },
      { reviewStatus: 'review', deleted: false },
      { reviewStatus: 'rejected', deleted: true },
    ]);

    expect(summary).toEqual({
      total: 4,
      pending: 1,
      accepted: 1,
      review: 1,
      rejected: 1,
      deleted: 1,
    });
  });

  it('writes and reads the persisted session payload', () => {
    const storage = createMemoryStorage();
    const session = {
      entries: {
        'shape-5-01': { reviewStatus: 'accepted', deleted: false },
      },
    };

    expect(writeSymmetryReviewSession(session, storage)).toBe(true);
    expect(readSymmetryReviewSession(storage)).toEqual(session);
  });
});
