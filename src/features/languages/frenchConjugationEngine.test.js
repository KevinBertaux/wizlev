import { describe, expect, it } from 'vitest';
import {
  buildFrenchQcmChoices,
  createFrenchInputBag,
  createFrenchInputQuestion,
  createFrenchPronounBag,
  createFrenchQcmBag,
  createFrenchQcmQuestion,
  evaluateFrenchInputAnswer,
  evaluateFrenchQcmAnswer,
} from './frenchConjugationEngine';
import { getFrenchInflectionModule } from './frenchConjugations';

describe('frenchConjugationEngine', () => {
  it('builds four QCM choices with one correct answer from the same verb', () => {
    const choices = buildFrenchQcmChoices('etre', 'nous', () => 0);

    expect(choices).toHaveLength(4);
    expect(choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
    expect(choices.some((choice) => choice.answer === 'sommes')).toBe(true);
    expect(new Set(choices.map((choice) => choice.answer)).size).toBe(4);
  });

  it('cycles through the 9 pronouns before refill', () => {
    const bag = createFrenchPronounBag('aller', () => 0.999);
    const seen = new Set();

    for (let index = 0; index < 9; index += 1) {
      seen.add(bag.next()?.key);
    }

    expect(seen.size).toBe(9);
  });

  it('avoids immediate repeat across bag refill boundary when possible', () => {
    const bag = createFrenchPronounBag('venir', () => 0.999);
    let previousKey = '';

    for (let index = 0; index < 18; index += 1) {
      const current = bag.next();
      expect(current).not.toBeNull();
      if (previousKey) {
        expect(current.key).not.toBe(previousKey);
      }
      previousKey = current.key;
    }
  });

  it('creates a full question and evaluates selected answer', () => {
    const question = createFrenchQcmQuestion('avoir', 'vous', () => 0);
    expect(question?.prompt).toBe('Vous + avoir');
    expect(question?.options).toHaveLength(4);

    const result = evaluateFrenchQcmAnswer(question, question.correctOptionId);
    expect(result).toEqual({
      isValid: true,
      isCorrect: true,
      correctAnswer: 'avez',
    });
  });

  it('creates a question bag that yields QCM questions', () => {
    const bag = createFrenchQcmBag('prendre', () => 0);
    const question = bag.next();

    expect(question?.verbKey).toBe('prendre');
    expect(question?.options).toHaveLength(4);
  });

  it('creates an input question and validates answer case-insensitively', () => {
    const question = createFrenchInputQuestion('aller', 'nous');

    expect(question?.prompt).toBe('Nous + aller');
    expect(evaluateFrenchInputAnswer(question, 'ALLONS')).toEqual({
      isValid: true,
      isCorrect: true,
      correctAnswer: 'allons',
    });
  });

  it('creates an input bag that yields prompt-only questions', () => {
    const bag = createFrenchInputBag('etre', () => 0);
    const question = bag.next();

    expect(question?.verbKey).toBe('etre');
    expect(question?.expectedAnswer).toBeTruthy();
  });

  it('supports a non-present tense when the caller passes mood and tense', () => {
    const question = createFrenchQcmQuestion(
      'venir',
      'elles',
      () => 0,
      getFrenchInflectionModule(),
      'indicatif',
      'passe-compose'
    );
    expect(question?.expectedAnswer).toBe('sont venues');
    expect(question?.prompt).toBe('Elles + venir');
  });
});
