/* @vitest-environment jsdom */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  buildRemoteAssetUrl,
  clearRemotePayloadCache,
  compareManifestVersionTokens,
  extractManifestEntries,
  getLatestManifestVersionToken,
  getManifestVersionToken,
  hasManifestEntryChanged,
  indexManifestEntriesByKey,
  normalizeManifestEntries,
  readRemotePayloadCache,
  writeRemotePayloadCache,
} from './manifestSync';

describe('manifestSync helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('extracts and normalizes manifest entries with fallback tokens', () => {
    const payload = {
      version: '2026-04-09.1',
      verbs: [
        { key: 'pouvoir', file: 'verbs/pouvoir.json', version: '2026-04-09.1' },
        { key: 'voir', file: 'verbs/voir.json' },
        { key: ' ', file: 'verbs/invalid.json' },
      ],
    };

    expect(normalizeManifestEntries(payload, payload.version)).toEqual([
      {
        key: 'pouvoir',
        file: 'verbs/pouvoir.json',
        version: '2026-04-09.1',
        token: '2026-04-09.1',
        hasExplicitToken: true,
      },
      {
        key: 'voir',
        file: 'verbs/voir.json',
        token: '2026-04-09.1',
        hasExplicitToken: false,
      },
    ]);
  });

  it('indexes manifest entries by key across list payloads', () => {
    const payload = {
      updatedAt: '2026-04-09.2',
      lists: [
        { key: 'meteo', file: 'meteo.json', updatedAt: '2026-03-17.1' },
        { key: 'fruits', file: 'fruits.json' },
      ],
    };

    expect(indexManifestEntriesByKey(payload, payload.updatedAt)).toEqual({
      meteo: {
        key: 'meteo',
        file: 'meteo.json',
        updatedAt: '2026-03-17.1',
        token: '2026-03-17.1',
        hasExplicitToken: true,
      },
      fruits: {
        key: 'fruits',
        file: 'fruits.json',
        token: '2026-04-09.2',
        hasExplicitToken: false,
      },
    });
  });

  it('builds versioned remote asset URLs with normalized paths', () => {
    expect(buildRemoteAssetUrl('https://cdn.example.com/', '/languages/fr/conjugation/', '/verbs/pouvoir.json', '2026-04-09.1'))
      .toBe('https://cdn.example.com/languages/fr/conjugation/verbs/pouvoir.json?v=2026-04-09.1');

    expect(buildRemoteAssetUrl('https://cdn.example.com', 'languages/en/vocabulary', 'fruits.json?lang=fr', '2026 04 09/1'))
      .toBe('https://cdn.example.com/languages/en/vocabulary/fruits.json?lang=fr&v=2026%2004%2009%2F1');

    expect(buildRemoteAssetUrl('https://cdn.example.com', 'math/symmetry', 'shapes-3-points.json'))
      .toBe('https://cdn.example.com/math/symmetry/shapes-3-points.json');
  });

  it('reads, writes and clears remote payload cache safely', () => {
    vi.setSystemTime(new Date('2026-04-09T10:00:00.000Z'));

    expect(
      writeRemotePayloadCache('wizlev-fr-cache', {
        version: '2026-04-09.1',
        entries: { pouvoir: { token: '2026-04-09.1' } },
        payloads: { pouvoir: { infinitive: 'pouvoir' } },
      })
    ).toBe(true);

    expect(readRemotePayloadCache('wizlev-fr-cache')).toEqual({
      version: '2026-04-09.1',
      entries: { pouvoir: { token: '2026-04-09.1' } },
      payloads: { pouvoir: { infinitive: 'pouvoir' } },
      cachedAt: '2026-04-09T10:00:00.000Z',
    });

    clearRemotePayloadCache('wizlev-fr-cache');

    expect(readRemotePayloadCache('wizlev-fr-cache')).toEqual({
      version: '',
      entries: {},
      payloads: {},
      cachedAt: '',
    });
  });

  it('detects manifest entry changes only when a remote token is present and differs', () => {
    expect(hasManifestEntryChanged({ token: '2026-04-09.1' }, { token: '2026-03-25.2' })).toBe(true);
    expect(hasManifestEntryChanged({ token: '2026-04-09.1' }, { token: '2026-04-09.1' })).toBe(false);
    expect(hasManifestEntryChanged({ token: '' }, { token: '2026-03-25.2' })).toBe(false);
  });

  it('exposes consistent manifest version helpers', () => {
    expect(getManifestVersionToken({ version: '2026-04-09.1' })).toBe('2026-04-09.1');
    expect(getManifestVersionToken({ updatedAt: '2026-04-09.2' })).toBe('2026-04-09.2');
    expect(getManifestVersionToken(null)).toBe('');

    expect(extractManifestEntries({ groups: [{ key: '3', file: 'shapes-3-points.json' }] })).toEqual([
      { key: '3', file: 'shapes-3-points.json' },
    ]);
    expect(extractManifestEntries({ verbs: [{ key: 'voir', file: 'verbs/voir.json' }] })).toEqual([
      { key: 'voir', file: 'verbs/voir.json' },
    ]);

    expect(compareManifestVersionTokens('2026-04-09.1', '2026-03-25.2')).toBeGreaterThan(0);
    expect(getLatestManifestVersionToken('', '2026-03-25.2', '2026-04-09.1')).toBe('2026-04-09.1');
  });
});
