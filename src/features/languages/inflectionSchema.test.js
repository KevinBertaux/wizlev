import { describe, expect, it } from 'vitest';
import manabuerModule from '@/content/languages/fr/conjugation-poc-manabuer.json';
import {
  buildInflectionRows,
  getInflectionLanguage,
  getInflectionMood,
  getInflectionTense,
  getInflectionVerb,
  validateInflectionModule,
} from './inflectionSchema';

describe('inflectionSchema POC', () => {
  it('valide le module multi-temps/multi-modes sans erreur', () => {
    expect(validateInflectionModule(manabuerModule)).toEqual([]);
  });

  it('résout la langue, le verbe, le mode et le temps', () => {
    expect(getInflectionLanguage(manabuerModule, 'fr')?.label).toBe('Français');
    expect(getInflectionVerb(manabuerModule, 'fr', 'manabuer')?.lemma).toBe('manabuer');
    expect(getInflectionMood(manabuerModule, 'fr', 'indicatif')?.label).toBe('Indicatif');
    expect(getInflectionTense(manabuerModule, 'fr', 'indicatif', 'futur-simple')?.label).toBe('Indicatif futur simple');
  });

  it('construit un tableau groupé pour un temps personnel', () => {
    const rows = buildInflectionRows(manabuerModule, 'fr', 'manabuer', 'indicatif', 'present');
    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({ label: 'Je', forms: ['manabue'] });
    expect(rows[2]).toMatchObject({ label: 'Il / Elle / On', forms: ['manabue'] });
    expect(rows[5]).toMatchObject({ label: 'Ils / Elles', forms: ['manabuent'] });
  });

  it('construit un tableau réduit pour un mode non personnel', () => {
    const rows = buildInflectionRows(manabuerModule, 'fr', 'manabuer', 'infinitif', 'present');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ label: 'Forme', forms: ['manabuer'] });
  });
});
