import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath = path.resolve('public/og-wizlev.png');
const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <style>
      :root {
        color-scheme: light;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        font-family: 'Segoe UI', Arial, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(112, 200, 255, 0.38), transparent 28%),
          radial-gradient(circle at bottom right, rgba(139, 211, 122, 0.34), transparent 30%),
          linear-gradient(135deg, #f8fbff 0%, #eef6ff 52%, #f7fbf4 100%);
        color: #16324f;
      }
      .frame {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 54px;
        overflow: hidden;
      }
      .panel {
        width: 100%;
        height: 100%;
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.84);
        border: 2px solid rgba(181, 205, 235, 0.8);
        box-shadow: 0 24px 80px rgba(44, 94, 138, 0.12);
        padding: 54px 64px;
        position: relative;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(219, 242, 255, 0.95);
        color: #1f4b70;
        font-weight: 700;
        font-size: 22px;
        letter-spacing: 0.02em;
      }
      .brand {
        margin-top: 32px;
        font-size: 106px;
        line-height: 0.9;
        font-weight: 900;
        letter-spacing: -0.05em;
      }
      .brand .wiz {
        color: #1780d8;
      }
      .brand .lev {
        color: #65bb55;
      }
      .subtitle {
        margin-top: 26px;
        max-width: 760px;
        font-size: 38px;
        line-height: 1.24;
        color: #284868;
        font-weight: 700;
      }
      .chips {
        display: flex;
        gap: 16px;
        margin-top: 36px;
        flex-wrap: wrap;
      }
      .chip {
        padding: 14px 22px;
        border-radius: 999px;
        background: rgba(243, 249, 255, 0.98);
        border: 2px solid rgba(185, 209, 236, 0.9);
        color: #25486a;
        font-size: 25px;
        font-weight: 800;
      }
      .badge {
        position: absolute;
        right: 52px;
        bottom: 46px;
        padding: 16px 24px;
        border-radius: 22px;
        background: rgba(230, 247, 238, 0.98);
        border: 2px solid rgba(155, 214, 176, 0.88);
        color: #2d6f4d;
        font-size: 24px;
        font-weight: 800;
      }
      .ring {
        position: absolute;
        width: 320px;
        height: 320px;
        right: -72px;
        top: -72px;
        border-radius: 50%;
        border: 20px solid rgba(131, 194, 240, 0.22);
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="panel">
        <div class="ring"></div>
        <div class="eyebrow">Plateforme de revision</div>
        <div class="brand"><span class="wiz">Wiz</span><span class="lev">Lev</span></div>
        <div class="subtitle">Maths, anglais et francais pour enfants, en ligne et sans friction.</div>
        <div class="chips">
          <div class="chip">Maths</div>
          <div class="chip">Anglais</div>
          <div class="chip">Francais</div>
        </div>
        <div class="badge">wizlev.com</div>
      </div>
    </div>
  </body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: outputPath, type: 'png' });
await browser.close();
await fs.access(outputPath);
console.log(outputPath);
