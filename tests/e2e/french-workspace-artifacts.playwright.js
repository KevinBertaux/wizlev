import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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

const outputRoot = path.resolve(process.cwd(), 'tmp/qa/french-workspace');

function sanitizeProjectName(name) {
  return String(name).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
}

async function disableMotion(page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function prepareSelectedWorkspace(page) {
  await page.goto('/fr/languages/french');
  await page.getByLabel('Choisir un verbe :').selectOption('aimer');
  await page.getByLabel('Choisir un temps :').selectOption('present');
  await expect(page.locator('.conjugation-row').first()).toContainText('Je');
}

async function saveArtifact(page, testInfo, name) {
  const projectDir = path.join(outputRoot, sanitizeProjectName(testInfo.project.name));
  fs.mkdirSync(projectDir, { recursive: true });
  await page.screenshot({
    path: path.join(projectDir, `${name}.png`),
    fullPage: true,
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('wizlev_consent', JSON.stringify(payload));
  }, consentPayload);
});

test.describe('french workspace screenshots', () => {
  test('capture key french workspace states', async ({ page }, testInfo) => {
    await page.goto('/fr/languages/french');
    await disableMotion(page);
    await expect(page.getByText('Choisis un verbe et un temps pour commencer.')).toBeVisible();
    await saveArtifact(page, testInfo, 'french-empty');

    await prepareSelectedWorkspace(page);
    await saveArtifact(page, testInfo, 'french-table');

    await page.getByRole('button', { name: /🃏 Flashcards/i }).click();
    await expect(page.locator('.flashcard')).toBeVisible();
    await saveArtifact(page, testInfo, 'french-flashcards');

    await page.getByRole('button', { name: /✅ QCM/i }).click();
    await expect(page.locator('.french-qcm-panel__options button')).toHaveCount(4);
    await saveArtifact(page, testInfo, 'french-qcm');

    await page.getByRole('button', { name: /✍️ Réponse libre/i }).click();
    await expect(page.locator('.answer-input')).toBeVisible();
    await saveArtifact(page, testInfo, 'french-input');
  });
});
