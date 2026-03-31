import { describe, expect, it } from 'vitest';
import { buildPublicSeoModel, normalizePublicSeoPath } from './publicSeo';

describe('normalizePublicSeoPath', () => {
  it('normalizes root and legacy public routes to /fr space', () => {
    expect(normalizePublicSeoPath('/')).toBe('/fr');
    expect(normalizePublicSeoPath('/math')).toBe('/fr/math');
    expect(normalizePublicSeoPath('/languages/english')).toBe('/fr/languages/english');
  });

  it('keeps canonical public routes unchanged', () => {
    expect(normalizePublicSeoPath('/fr/languages/french')).toBe('/fr/languages/french');
  });
});

describe('buildPublicSeoModel', () => {
  it('builds canonical urls on wizlev.com', () => {
    const seo = buildPublicSeoModel({ pathname: '/languages/english', hostname: 'wizlev.com' });
    expect(seo.canonicalUrl).toBe('https://wizlev.com/fr/languages/english');
    expect(seo.robots).toBe('index, follow');
    expect(seo.title).toContain('Anglais');
  });

  it('marks manabuplay hosts as noindex while keeping wizlev canonical', () => {
    const seo = buildPublicSeoModel({ pathname: '/fr/math', hostname: 'manabuplay.fr' });
    expect(seo.canonicalUrl).toBe('https://wizlev.com/fr/math');
    expect(seo.robots).toBe('noindex, nofollow');
  });

  it('marks studio ops as noindex', () => {
    const seo = buildPublicSeoModel({ pathname: '/-/studio-ops', hostname: 'wizlev.com' });
    expect(seo.robots).toBe('noindex, nofollow');
  });
});
