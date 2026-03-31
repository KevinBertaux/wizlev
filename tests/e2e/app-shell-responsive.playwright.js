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

async function usesDesktopHoverNav(page) {
  return page.evaluate(() => {
    return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
  });
}

async function openLanguagesFrench(page) {
  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  const nav = page.locator('#main-nav');
  const frenchLink = nav.getByRole('link', { name: 'Français', exact: true });

  if (await burger.isVisible()) {
    await burger.click();
    await nav.getByRole('button', { name: 'Langues' }).click();
    await frenchLink.click();
    return;
  }

  if (await usesDesktopHoverNav(page)) {
    await nav.getByRole('button', { name: 'Langues' }).hover();
  } else {
    await nav.getByRole('button', { name: 'Langues' }).click();
  }

  await expect(frenchLink).toBeVisible({ timeout: 3000 });
  await frenchLink.click();
}

async function openMathSymmetry(page) {
  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  const nav = page.locator('#main-nav');
  const symmetryLink = nav.getByRole('link', { name: 'Symétrie', exact: true });

  if (await burger.isVisible()) {
    await burger.click();
    await nav.getByRole('button', { name: 'Maths' }).click();
    await symmetryLink.click();
    return;
  }

  if (await usesDesktopHoverNav(page)) {
    await nav.getByRole('button', { name: 'Maths' }).hover();
  } else {
    await nav.getByRole('button', { name: 'Maths' }).click();
  }

  await expect(symmetryLink).toBeVisible({ timeout: 3000 });
  await symmetryLink.click();
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
  await expect(page).toHaveURL(/\/fr\/languages\/french$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Conjugaison française' })).toBeVisible();

  await page.goto('/');
  await openMathSymmetry(page);
  await expect(page).toHaveURL(/\/fr\/math\/symmetry$/);
  await expect(page.locator('.prompt-box')).toBeVisible();
});
