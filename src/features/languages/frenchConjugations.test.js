import { describe, expect, it } from 'vitest';
import {
  buildFrenchVerbCards,
  buildFrenchVerbRows,
  createFrenchExercise,
  getFrenchConjugationPocModule,
  getFrenchTense,
  getFrenchVerb,
  isFrenchExerciseAnswerCorrect,
  isFrenchTenseAvailable,
  isFrenchVerbTenseAvailable,
  listFrenchTenseFamilies,
  listFrenchVerbOptionGroups,
  listFrenchVerbOptions,
} from './frenchConjugations';

describe('frenchConjugations', () => {
  it('expose les cinq verbes ciblés', () => {
    expect(listFrenchVerbOptions()).toHaveLength(5);
    expect(getFrenchVerb('etre')?.forms.nous).toBe('sommes');
    expect(getFrenchVerb('venir')?.forms.ils).toBe('viennent');
  });

  it('construit 6 lignes de tableau pour un verbe', () => {
    const rows = buildFrenchVerbRows('avoir');
    expect(rows).toHaveLength(6);
    expect(rows[2].pronounValues).toEqual(['Il a', 'Elle a', 'On a']);
    expect(rows[2].forms).toEqual(['a']);
    expect(rows[5].pronounValues).toEqual(['Ils ont', 'Elles ont']);
    expect(rows[5].forms).toEqual(['ont']);
  });

  it('expose les familles de temps avec disponibilite', () => {
    const families = listFrenchTenseFamilies();
    expect(families).toHaveLength(3);
    expect(families[0].options[0].key).toBe('present');
    expect(families[0].options[0].label).toBe('Indicatif présent');
    expect(families[1].options.at(-1)?.key).toBe('passe-anterieur');
    expect(getFrenchTense('present')?.familyKey).toBe('present');
    expect(isFrenchTenseAvailable('present')).toBe(true);
    expect(isFrenchTenseAvailable('imparfait')).toBe(false);
    expect(isFrenchVerbTenseAvailable('avoir', 'present')).toBe(true);
    expect(isFrenchVerbTenseAvailable('avoir', 'imparfait')).toBe(false);
  });

  it('construit 9 flashcards par verbe', () => {
    const cards = buildFrenchVerbCards('aller');
    expect(cards).toHaveLength(9);
    expect(cards[0].prompt).toBe('Je + aller');
    expect(cards[0].answer).toBe('vais');
  });

  it('crée un exercice en évitant le même pronom immédiat si possible', () => {
    const exercise = createFrenchExercise('etre', () => 0, 'je');
    expect(exercise?.pronounKey).toBe('tu');
    expect(exercise?.expectedAnswer).toBe('es');
  });

  it('valide une réponse sans sensibilité à la casse', () => {
    const exercise = createFrenchExercise('prendre', () => 0);
    expect(isFrenchExerciseAnswerCorrect(exercise, exercise.expectedAnswer.toUpperCase())).toBe(true);
    expect(isFrenchExerciseAnswerCorrect(exercise, 'xxx')).toBe(false);
  });

  it('lit aussi le POC multi-langue sans casser le format legacy', () => {
    const poc = getFrenchConjugationPocModule();
    expect(listFrenchVerbOptions(poc)).toEqual([
      { value: 'aimer', label: 'Aimer', group: '1', irregular: false },
      { value: 'aller', label: 'Aller', group: '3', irregular: true },
      { value: 'avoir', label: 'Avoir', group: '3', irregular: true },
      { value: 'chanter', label: 'Chanter', group: '1', irregular: false },
      { value: 'etre', label: 'Être', group: '3', irregular: true },
      { value: 'faire', label: 'Faire', group: '3', irregular: true },
      { value: 'finir', label: 'Finir', group: '2', irregular: false },
      { value: 'manabuer', label: 'Manabuer', group: '1', irregular: false },
      { value: 'prendre', label: 'Prendre', group: '3', irregular: true },
      { value: 'venir', label: 'Venir', group: '3', irregular: true },
    ]);
    expect(listFrenchVerbOptionGroups(poc)).toEqual([
      {
        key: '1',
        label: '1er groupe',
        options: [
          { value: 'aimer', label: 'Aimer', disabled: false },
          { value: 'chanter', label: 'Chanter', disabled: false },
          { value: 'manabuer', label: 'Manabuer', disabled: false },
        ],
      },
      {
        key: '2',
        label: '2e groupe',
        options: [{ value: 'finir', label: 'Finir', disabled: false }],
      },
      {
        key: '3',
        label: '3e groupe',
        options: [
          { value: 'aller', label: 'Aller', disabled: false },
          { value: 'avoir', label: 'Avoir', disabled: false },
          { value: 'etre', label: 'Être', disabled: false },
          { value: 'faire', label: 'Faire', disabled: false },
          { value: 'prendre', label: 'Prendre', disabled: false },
          { value: 'venir', label: 'Venir', disabled: false },
        ],
      },
    ]);
    expect(getFrenchVerb('etre', poc, 'indicatif', 'futur-simple')?.forms.nous).toBe('serons');
    expect(getFrenchVerb('aller', poc, 'indicatif', 'passe-compose')?.forms.nous).toBe('sommes allés');
    expect(getFrenchVerb('aller', poc, 'indicatif', 'passe-compose')?.forms.elle).toBe('est allée');
    expect(getFrenchVerb('venir', poc, 'subjonctif', 'present')?.forms.je).toBe('vienne');
    expect(getFrenchVerb('venir', poc, 'conditionnel', 'passe')?.forms.elles).toBe('seraient venues');
    expect(getFrenchTense('passe-anterieur', poc)?.label).toBe('Indicatif passé antérieur');
    expect(isFrenchVerbTenseAvailable('etre', 'imparfait', poc)).toBe(true);

    const rows = buildFrenchVerbRows('prendre', 'present', poc);
    expect(rows).toHaveLength(6);
    expect(rows[2].forms).toEqual(['prend']);

    const infinitifRows = buildFrenchVerbRows('venir', 'present', poc, 'infinitif');
    expect(infinitifRows).toHaveLength(1);
    expect(infinitifRows[0].forms).toEqual(['venir']);

    const cards = buildFrenchVerbCards('avoir', 'futur-simple', poc);
    expect(cards[0].answer).toBe('aurai');
  });
});
