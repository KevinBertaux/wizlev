import { describe, expect, it } from 'vitest';
import { buildListPayload, normalizeWords } from './listPayload';

describe('normalizeWords', () => {
  it('trims values and keeps keys', () => {
    const result = normalizeWords([
      { english: '  Apple ', french: ' Pomme ' },
      { english: '', french: '' },
    ]);

    expect(result).toEqual([
      { english: 'Apple', french: 'Pomme' },
      { english: '', french: '' },
    ]);
  });
});

describe('buildListPayload', () => {
  it('fails when name is missing', () => {
    const result = buildListPayload({
      name: '   ',
      description: 'desc',
      words: [{ english: 'Apple', french: 'Pomme' }],
    });

    expect(result.ok).toBe(false);
  });

  it('fails on partial words', () => {
    const result = buildListPayload({
      name: 'Fruits',
      description: '',
      words: [{ english: 'Apple', french: '' }],
    });

    expect(result.ok).toBe(false);
  });

  it('returns valid payload with complete words only', () => {
    const result = buildListPayload({
      name: 'Fruits',
      description: 'Liste',
      words: [
        { english: 'Apple', french: 'Pomme' },
        { english: '  ', french: '  ' },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.payload).toEqual({
      name: 'Fruits',
      description: 'Liste',
      words: [{ english: 'Apple', french: 'Pomme' }],
    });
  });
});

