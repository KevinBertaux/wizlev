import { describe, expect, it } from 'vitest';
import { buildNextSymmetryUpdatedAt, buildSymmetryExportPayload } from '@/features/math/symmetryReviewExport';

describe('symmetryReviewExport', () => {
  it('bumps the updatedAt suffix for the same day', () => {
    const value = buildNextSymmetryUpdatedAt('2026-03-14.2', new Date('2026-03-14T09:00:00.000Z'));
    expect(value).toBe('2026-03-14.3');
  });

  it('starts a new day sequence when needed', () => {
    const value = buildNextSymmetryUpdatedAt('2026-03-13.9', new Date('2026-03-14T09:00:00.000Z'));
    expect(value).toBe('2026-03-14.1');
  });

  it('builds an export payload with deleted entries removed and reviewStatus preserved', () => {
    const payload = buildSymmetryExportPayload({
      entries: [
        {
          id: 'shape-3-01',
          points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }],
          reviewStatus: 'accepted',
          deleted: false,
        },
        {
          id: 'shape-4-01',
          points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
          reviewStatus: 'rejected',
          deleted: false,
        },
        {
          id: 'shape-5-01',
          points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
          reviewStatus: 'accepted',
          deleted: true,
        },
      ],
      gridSize: 5,
      axes: ['vertical', 'horizontal'],
      currentUpdatedAt: '2026-03-13.2',
      currentValidatedAt: '',
      currentValidatorVersion: '1',
      now: new Date('2026-03-14T10:15:00.000Z'),
    });

    expect(payload.manifest).toMatchObject({
      updatedAt: '2026-03-14.1',
      validatorVersion: '1',
      gridSize: 5,
      axes: ['vertical', 'horizontal'],
    });
    expect(payload.manifest.groups).toEqual([
      { key: 'threePoints', file: 'shapes-3-points.json', points: 3, updatedAt: '2026-03-14.1' },
      { key: 'fourPoints', file: 'shapes-4-points.json', points: 4, updatedAt: '2026-03-14.1' },
      { key: 'fivePoints', file: 'shapes-5-points.json', points: 5, updatedAt: '2026-03-14.1' },
    ]);
    expect(payload.files[0].shapes).toEqual([
      {
        id: 'shape-3-01',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }],
        reviewStatus: 'accepted',
      },
    ]);
    expect(payload.files[1].shapes).toEqual([
      {
        id: 'shape-4-01',
        points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
        reviewStatus: 'rejected',
      },
    ]);
    expect(payload.files[2].shapes).toEqual([]);
  });
});
