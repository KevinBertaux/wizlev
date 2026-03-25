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

async function openLanguagesFrench(page) {
  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  const nav = page.locator('#main-nav');

  if (await burger.isVisible()) {
    await burger.click();
    await nav.getByRole('button', { name: 'Langues' }).click();
    await nav.getByRole('link', { name: 'Français', exact: true }).click();
    return;
  }

  await nav.getByRole('button', { name: 'Langues' }).hover();
  await page.waitForTimeout(340);
  await nav.getByRole('link', { name: 'Français', exact: true }).click();
}

async function openMathSymmetry(page) {
  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  const nav = page.locator('#main-nav');

  if (await burger.isVisible()) {
    await burger.click();
    await nav.getByRole('button', { name: 'Maths' }).click();
    await nav.getByRole('link', { name: 'Symétrie', exact: true }).click();
    return;
  }

  await nav.getByRole('button', { name: 'Maths' }).hover();
  await page.waitForTimeout(340);
  await nav.getByRole('link', { name: 'Symétrie', exact: true }).click();
}

test('app shell responsive: navigation stays usable on all viewport profiles', async ({ page }) => {
  await page.goto('/');

  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  const width = page.viewportSize()?.width || 0;

  if (width < 1024) {
    await expect(burger).toBeVisible();
  } else {
    await expect(burger).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Maths' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Langues' })).toBeVisible();
  }

  await openLanguagesFrench(page);
  await expect(page).toHaveURL(/\/languages\/french$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Conjugaison française' })).toBeVisible();

  await page.goto('/');
  await openMathSymmetry(page);
  await expect(page).toHaveURL(/\/math\/symmetry$/);
  await expect(page.locator('.prompt-box')).toBeVisible();
});
