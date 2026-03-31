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

test('math symmetry: prompt and answer controls stay usable across responsive profiles', async ({ page }) => {
  await page.goto('/fr/math/symmetry');

  const heading = page.getByRole('heading', { level: 1, name: 'Math - Symétrie' });
  const promptBox = page.locator('.prompt-box');
  const optionButtons = page.locator('.option-btn');
  const actions = page.locator('.mp-actions');
  const checkButton = page.getByRole('button', { name: 'Vérifier ✓' });

  await expect(heading).toBeVisible();
  await expect(promptBox).toBeVisible();
  await expect(optionButtons).toHaveCount(4);
  await expect(actions).toBeVisible();

  await optionButtons.first().click();
  await checkButton.scrollIntoViewIfNeeded();
  await expect(checkButton).toBeInViewport();
  await checkButton.click();

  await expect(page.locator('.mp-feedback')).toBeVisible();
  await expect(promptBox).toBeVisible();
});
