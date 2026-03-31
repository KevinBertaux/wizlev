import { describe, expect, it } from 'vitest';
import {
  getRoadmapEntries,
  getRoadmapEntryById,
  ROADMAP_PRIORITY_ORDER,
  resolveRoadmapDependencies,
} from './roadmapStore';

describe('roadmapStore', () => {
  it('returns normalized roadmap entries with valid priorities', () => {
    const entries = getRoadmapEntries();

    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(Array.isArray(entry.items)).toBe(true);
      for (const item of entry.items) {
        expect(ROADMAP_PRIORITY_ORDER.includes(item.priority)).toBe(true);
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns scope by id and null for unknown ids', () => {
    const scope050 = getRoadmapEntryById('0.5.0');
    expect(scope050).not.toBeNull();
    expect(scope050?.id).toBe('0.5.0');
    expect(scope050?.items.length).toBeGreaterThan(0);

    const adsFoundation = getRoadmapEntryById('ads-foundation');
    expect(adsFoundation).not.toBeNull();
    expect(adsFoundation?.id).toBe('ads-foundation');
    expect(adsFoundation?.items.length).toBeGreaterThan(0);

    const platform = getRoadmapEntryById('platform');
    expect(platform).not.toBeNull();
    expect(platform?.id).toBe('platform');
    expect(platform?.items.length).toBeGreaterThan(0);

    expect(getRoadmapEntryById('unknown-scope-id')).toBeNull();
  });

  it('resolves declared dependencies and blocks unfinished predecessors', () => {
    const backlog = getRoadmapEntryById('backlog');
    const sym45 = backlog?.items.find((item) => item.id === 'backlog-sym-45');

    expect(sym45?.dependsOn).toEqual(['backlog-sym-v3']);
    expect(sym45?.blockedBy).toEqual(['backlog-sym-v3']);
    expect(sym45?.dependencyStatus).toBe('blocked');
  });

  it('detects missing, invalid and cyclic dependencies in synthetic data', () => {
    const entries = resolveRoadmapDependencies([
      {
        id: 'test',
        title: 'Test',
        type: 'scope',
        version: 'test',
        startDate: '',
        endDate: '',
        items: [
          { id: 'a', priority: 'High', domain: 'ui', feature: 'x', label: 'A', done: false, dependsOn: ['b'] },
          { id: 'b', priority: 'High', domain: 'ui', feature: 'x', label: 'B', done: false, dependsOn: ['a'] },
          { id: 'c', priority: 'High', domain: 'ui', feature: 'x', label: 'C', done: false, dependsOn: ['missing'] },
          { id: 'd', priority: 'High', domain: 'ui', feature: 'x', label: 'D', done: false, dependsOn: ['d'] },
        ],
      },
    ]);

    const items = entries[0].items;
    expect(items.find((item) => item.id === 'a')?.dependencyStatus).toBe('cyclic');
    expect(items.find((item) => item.id === 'b')?.dependencyStatus).toBe('cyclic');
    expect(items.find((item) => item.id === 'c')?.dependencyStatus).toBe('missing');
    expect(items.find((item) => item.id === 'd')?.dependencyStatus).toBe('invalid');
  });
});
