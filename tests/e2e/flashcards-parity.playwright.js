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

const outputRoot = path.resolve(process.cwd(), 'tmp/qa/flashcards');

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

async function prepareEnglishFlashcards(page) {
  await page.goto('/languages/english');
  await expect(page.locator('#englishListSelect')).toBeVisible();
  await page.locator('#englishListSelect').selectOption('fruits');
  await expect(page.locator('.flashcard')).toBeVisible();
  await expect(page.locator('.flashcard-count')).toContainText('/');
}

async function prepareFrenchFlashcards(page) {
  await page.goto('/languages/french');
  await expect(page.getByLabel('Choisir un verbe :')).toBeVisible();
  await page.getByLabel('Choisir un verbe :').selectOption('aimer');
  await page.getByLabel('Choisir un temps :').selectOption('present');
  await page.getByRole('button', { name: /🃏 Flashcards/i }).click();
  await expect(page.locator('.flashcard')).toBeVisible();
  await expect(page.locator('.flashcard-count')).toContainText('/');
}

async function collectMetrics(page, moduleName) {
  return page.evaluate((name) => {
    const flashcard = document.querySelector('.flashcard');
    const carousel = document.querySelector('.flashcard-carousel');
    const count = document.querySelector('.flashcard-count');
    const hint = document.querySelector('.flashcard-hint');
    const word = document.querySelector('.flashcard-word');
    const translation = document.querySelector('.flashcard-translation');
    const tts = document.querySelector('.tts-inline-btn');
    const rails = Array.from(document.querySelectorAll('.carousel-rail')).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
      };
    });

    const getRect = (node) => {
      if (!node) {
        return null;
      }
      const rect = node.getBoundingClientRect();
      return {
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
        top: Number(rect.top.toFixed(2)),
        left: Number(rect.left.toFixed(2)),
      };
    };

    return {
      moduleName: name,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      flashcard: getRect(flashcard),
      carousel: getRect(carousel),
      count: getRect(count),
      hint: getRect(hint),
      word: getRect(word),
      translation: getRect(translation),
      hasTts: Boolean(tts),
      rails,
      bodyWidth: Number(document.body.getBoundingClientRect().width.toFixed(2)),
    };
  }, moduleName);
}

async function saveArtifacts(page, testInfo, moduleName) {
  const projectDir = path.join(outputRoot, sanitizeProjectName(testInfo.project.name));
  fs.mkdirSync(projectDir, { recursive: true });

  await page.screenshot({
    path: path.join(projectDir, `${moduleName}-full.png`),
    fullPage: true,
  });

  const flashcard = page.locator('.flashcard');
  await flashcard.screenshot({
    path: path.join(projectDir, `${moduleName}-flashcard.png`),
  });

  const metrics = await collectMetrics(page, moduleName);
  fs.writeFileSync(
    path.join(projectDir, `${moduleName}-metrics.json`),
    `${JSON.stringify(metrics, null, 2)}\n`,
    'utf8'
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('manabuplay_consent', JSON.stringify(payload));
  }, consentPayload);
});

test.describe('flashcards english/french parity', () => {
  test('english flashcards common behavior', async ({ page }) => {
    await prepareEnglishFlashcards(page);

    const flashcard = page.locator('.flashcard');
    const count = page.locator('.flashcard-count');

    const before = await count.textContent();
    await flashcard.click();
    await expect(page.locator('.flashcard-translation')).toBeVisible();

    await page.getByRole('button', { name: 'Carte suivante' }).click();
    await expect(count).not.toHaveText(before || '');

    await page.getByRole('button', { name: 'Carte précédente' }).click();
    await expect(count).toHaveText(before || '');
  });

  test('french flashcards common behavior', async ({ page }) => {
    await prepareFrenchFlashcards(page);

    const flashcard = page.locator('.flashcard');
    const count = page.locator('.flashcard-count');

    const before = await count.textContent();
    await flashcard.click();
    await expect(page.locator('.flashcard-translation')).toBeVisible();

    await page.getByRole('button', { name: 'Carte suivante' }).click();
    await expect(count).not.toHaveText(before || '');

    await page.getByRole('button', { name: 'Carte précédente' }).click();
    await expect(count).toHaveText(before || '');
  });

  test('capture english flashcards artifacts', async ({ page }, testInfo) => {
    await prepareEnglishFlashcards(page);
    await disableMotion(page);
    await saveArtifacts(page, testInfo, 'english');
  });

  test('capture french flashcards artifacts', async ({ page }, testInfo) => {
    await prepareFrenchFlashcards(page);
    await disableMotion(page);
    await saveArtifacts(page, testInfo, 'french');
  });
});
