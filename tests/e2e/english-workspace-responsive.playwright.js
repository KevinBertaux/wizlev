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

test('english workspace: critical controls stay usable across responsive profiles', async ({ page }) => {
  await page.goto('/fr/languages/english');

  const listSelect = page.getByLabel('Choisir une liste :');
  const directionSelect = page.getByLabel('Sens :');

  await expect(listSelect).toBeVisible();
  await expect(directionSelect).toBeVisible();

  await listSelect.selectOption('fruits');

  const flashcard = page.locator('.flashcard');
  await expect(flashcard).toBeVisible();
  await expect(page.locator('.flashcard-count')).toHaveText(/\d+\/\d+/);
  await expect(directionSelect).toBeInViewport();

  await flashcard.click();
  await expect(page.locator('.flashcard-translation')).toBeVisible();
  const actions = page.locator('.study-flashcards__actions');
  await actions.scrollIntoViewIfNeeded();
  await expect(actions).toBeInViewport();
});
