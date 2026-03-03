import { describe, expect, it } from 'vitest';
import { createRefillBag, pullNextItem, randomIndex, shuffleList } from './questionBag';

function sequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

describe('questionBag utils', () => {
  it('returns 0 random index for invalid lengths', () => {
    expect(randomIndex(0)).toBe(0);
    expect(randomIndex(-1)).toBe(0);
  });

  it('shuffles list while preserving all items', () => {
    const source = ['a', 'b', 'c', 'd'];
    const shuffled = shuffleList(source, sequenceRandom([0.8, 0.2, 0.6, 0.4]));

    expect(shuffled).toHaveLength(source.length);
    expect(shuffled.sort()).toEqual(source.sort());
  });

  it('pulls first allowed item from list', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const picked = pullNextItem(items, (item) => item.id === 'b', false);

    expect(picked).toEqual({ id: 'b' });
    expect(items).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('falls back to first item when no candidate matches and fallback is enabled', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const picked = pullNextItem(items, () => false, true);

    expect(picked).toEqual({ id: 'a' });
    expect(items).toEqual([{ id: 'b' }]);
  });

  it('returns null when no candidate matches and fallback is disabled', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const picked = pullNextItem(items, () => false, false);

    expect(picked).toBeNull();
    expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('returns null when pulling from an empty list', () => {
    expect(pullNextItem([], () => true, true)).toBeNull();
    expect(pullNextItem(null, () => true, true)).toBeNull();
  });
});

describe('createRefillBag', () => {
  it('consumes bag items then refills', () => {
    let cycle = 0;
    const bag = createRefillBag({
      refill: () => {
        cycle += 1;
        return cycle === 1 ? ['a', 'b'] : ['c'];
      },
    });

    expect(bag.next()).toBe('a');
    expect(bag.next()).toBe('b');
    expect(bag.next()).toBe('c');
  });

  it('uses fallback when refill returns empty', () => {
    const bag = createRefillBag({
      refill: () => [],
      fallback: () => 'fallback',
    });

    expect(bag.next()).toBe('fallback');
  });

  it('can be cleared to force immediate refill on next call', () => {
    const refill = sequenceRandom([0, 0]);
    const bag = createRefillBag({
      refill: () => (refill() === 0 ? ['a', 'b'] : ['c']),
    });

    expect(bag.next()).toBe('a');
    expect(bag.size).toBe(1);

    bag.clear();
    expect(bag.size).toBe(0);
    expect(bag.next()).toBe('a');
  });

  it('returns null when both refill and fallback are empty', () => {
    const bag = createRefillBag({
      refill: () => [],
    });

    expect(bag.next()).toBeNull();
  });
});
