import { expect, test } from '@playwright/test';

const consentPayload = {
  version: '2026-03-10',
  status: 'granted',
  selections: {
    necessary: true,
    analytics: true,
    ads: true,
  },
  updatedAt: '2026-03-12T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('manabuplay_consent', JSON.stringify(payload));
  }, consentPayload);
});

test('french workspace: empty state, mode flows, and reset after leaving', async ({ page }) => {
  await page.goto('/languages/french');

  const verbSelect = page.getByLabel('Choisir un verbe :');
  const tenseSelect = page.getByLabel('Choisir un temps :');
  const flashcardsMode = page.getByRole('button', { name: /🃏 Flashcards/i });
  const qcmMode = page.getByRole('button', { name: /✅ QCM/i });
  const inputMode = page.getByRole('button', { name: /✍️ Réponse libre/i });

  await expect(verbSelect).toHaveValue('');
  await expect(tenseSelect).toHaveValue('');
  await expect(page.getByText('Choisis un verbe et un temps pour commencer.')).toBeVisible();
  await expect(flashcardsMode).toBeDisabled();
  await expect(qcmMode).toBeDisabled();
  await expect(inputMode).toBeDisabled();

  await verbSelect.selectOption('aimer');
  await tenseSelect.selectOption('present');

  const firstConjugationRow = page.locator('.conjugation-row').first();
  await expect(firstConjugationRow).toContainText('Je');
  await expect(firstConjugationRow).toContainText('aime');
  await expect(flashcardsMode).toBeEnabled();
  await expect(qcmMode).toBeEnabled();
  await expect(inputMode).toBeEnabled();

  await flashcardsMode.click();
  await expect(page.locator('.flashcard')).toBeVisible();
  await expect(page.getByText("Le tableau est masqué pendant l'exercice.")).toBeVisible();
  await expect(flashcardsMode).toBeInViewport();
  await expect(qcmMode).toBeInViewport();
  await expect(inputMode).toBeInViewport();

  await page.getByRole('button', { name: 'Afficher la conjugaison' }).click();
  await expect(page.locator('.flashcard')).toHaveCount(0);
  await expect(page.getByText('Choisir un mode d\'entraînement.')).toBeVisible();
  await expect(page.locator('.conjugation-row').first()).toContainText('Je');

  await qcmMode.click();
  await expect(page.locator('.french-qcm-panel__options button')).toHaveCount(4);
  await expect(page.locator('.mp-panel-info')).toContainText(/Temps : .*présent/i);
  await expect(flashcardsMode).toBeInViewport();

  await page.getByRole('button', { name: /✍️ Réponse libre/i }).click();
  await expect(page.locator('.answer-input')).toBeVisible();
  await expect(page.locator('.mp-panel-info')).toContainText(/Temps : .*présent/i);
  await expect(qcmMode).toBeInViewport();

  await page.goto('/');
  await page.goto('/languages/french');

  await expect(verbSelect).toHaveValue('');
  await expect(tenseSelect).toHaveValue('');
  await expect(page.getByText('Choisis un verbe et un temps pour commencer.')).toBeVisible();
});

test('french workspace: grandir is selectable and works across table and flashcards', async ({ page }) => {
  await page.goto('/languages/french');

  const verbSelect = page.getByLabel('Choisir un verbe :');
  const tenseSelect = page.getByLabel('Choisir un temps :');
  const flashcardsMode = page.getByRole('button', { name: /🃏 Flashcards/i });

  await expect(verbSelect.locator('option[value="grandir"]')).toHaveText('Grandir');

  await verbSelect.selectOption('grandir');
  await tenseSelect.selectOption('present');

  const firstConjugationRow = page.locator('.conjugation-row').first();
  await expect(firstConjugationRow).toContainText('Je');
  await expect(firstConjugationRow).toContainText('grandis');

  await flashcardsMode.click();
  await expect(page.locator('.flashcard')).toBeVisible();
  await expect(page.locator('.flashcard-word')).toContainText('Je + grandir');

  await page.locator('.flashcard').click();
  await expect(page.locator('.flashcard-translation')).toContainText('Je grandis');
});
