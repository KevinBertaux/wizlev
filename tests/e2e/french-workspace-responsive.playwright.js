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
    window.localStorage.setItem('wizlev_consent', JSON.stringify(payload));
  }, consentPayload);
});

test('french workspace: critical controls stay visible across responsive states', async ({ page }) => {
  await page.goto('/languages/french');

  const heading = page.getByRole('heading', { level: 1, name: 'Conjugaison française' });
  const verbSelect = page.getByLabel('Choisir un verbe :');
  const tenseSelect = page.getByLabel('Choisir un temps :');
  const tableOverlay = page.locator('.french-hub__table-overlay-card');
  const flashcardsMode = page.getByRole('button', { name: /🃏 Flashcards/i });
  const qcmMode = page.getByRole('button', { name: /✅ QCM/i });
  const inputMode = page.getByRole('button', { name: /✍️ Réponse libre/i });

  await expect(heading).toBeVisible();
  await expect(verbSelect).toBeVisible();
  await expect(tenseSelect).toBeVisible();
  await expect(tableOverlay).toBeVisible();

  await verbSelect.selectOption('finir');
  await tenseSelect.selectOption('imparfait');

  const firstConjugationRow = page.locator('.conjugation-row').first();
  await expect(firstConjugationRow).toContainText('Je');
  await expect(firstConjugationRow).toContainText('finissais');
  await expect(flashcardsMode).toBeVisible();
  await expect(qcmMode).toBeVisible();
  await expect(inputMode).toBeVisible();

  await qcmMode.click();

  await expect(page.locator('.french-qcm-panel__options')).toBeVisible();
  await expect(qcmMode).toBeInViewport();
  await expect(page.locator('.mp-panel-info')).toBeInViewport();

  await page.getByRole('button', { name: /✍️ Réponse libre/i }).click();

  await expect(page.locator('.answer-input')).toBeVisible();
  await expect(inputMode).toBeInViewport();
  await expect(page.locator('.prompt-box')).toBeInViewport();

  await page.getByRole('button', { name: 'Afficher la conjugaison' }).click();
  await expect(firstConjugationRow).toBeVisible();
  await expect(flashcardsMode).toBeVisible();
});
