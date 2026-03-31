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

test('math multiplications: critical controls stay usable across responsive profiles', async ({ page }) => {
  await page.goto('/fr/math/multiplications');

  const heading = page.getByRole('heading', { level: 1, name: 'Math - Tables de multiplication' });
  const tablePicker = page.getByRole('group', { name: 'Choix des tables' });
  const emptyState = page.getByText('Choisir les tables pour commencer.');

  await expect(heading).toBeVisible();
  await expect(tablePicker).toBeVisible();
  await expect(emptyState).toBeVisible();

  await page.getByRole('button', { name: '2' }).click();

  const scorePanel = page.locator('.mp-panel-info');
  const questionBox = page.locator('.question-box');
  const answerInput = page.locator('.answer-input');
  const actions = page.locator('.mp-actions');
  const checkButton = page.getByRole('button', { name: 'Vérifier ✓' });

  await expect(scorePanel).toBeVisible();
  await expect(questionBox).toBeVisible();
  await expect(answerInput).toBeVisible();
  await expect(actions).toBeVisible();
  await expect(tablePicker).toBeVisible();
  await checkButton.scrollIntoViewIfNeeded();
  await expect(checkButton).toBeInViewport();

  await answerInput.fill('999');
  await checkButton.click();

  await expect(page.locator('.mp-feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuer →' })).toBeVisible();
});
