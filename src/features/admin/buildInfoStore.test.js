import { describe, expect, it, vi } from 'vitest';
import { fetchBuildInfo, normalizeBuildInfo } from './buildInfoStore';

describe('buildInfoStore', () => {
  it('normalizes a build payload', () => {
    const result = normalizeBuildInfo({
      appName: 'wizlev',
      appVersion: '0.5.0',
      gitSha: 'ad85f98abcdef',
      gitBranch: 'main',
      buildDate: '2026-03-13T18:00:00.000Z',
      deployContext: 'production',
    });

    expect(result.appVersion).toBe('0.5.0');
    expect(result.gitSha).toBe('ad85f98abcdef');
    expect(result.gitShortSha).toBe('ad85f98');
    expect(result.gitBranch).toBe('main');
    expect(result.publicPath).toBe('/build-info.json');
  });

  it('returns null when fetch is unavailable or fails', async () => {
    await expect(fetchBuildInfo(undefined)).resolves.toBeNull();
    await expect(fetchBuildInfo(vi.fn().mockRejectedValue(new Error('network')))).resolves.toBeNull();
  });

  it('loads and normalizes build info from the public endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        appVersion: '0.5.0',
        gitSha: 'ad85f98abcdef',
        gitBranch: 'main',
      }),
    });

    const result = await fetchBuildInfo(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.appVersion).toBe('0.5.0');
    expect(result.gitShortSha).toBe('ad85f98');
    expect(result.gitBranch).toBe('main');
  });
});
