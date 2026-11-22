// Screenshot the hero demo at fixed times. Usage: node tools/shot-demo.mjs <outDir> [width=1440] [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [out = 'shots', width = '1440', url = 'http://localhost:4174/#/'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 1000 }, serviceWorkers: 'block' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.__medlensDemoSeek === 'function');
await page.waitForTimeout(900); // hero rise-in
const win = page.locator('section[aria-labelledby="hero-h"] .rise').last().locator('div').first();
for (const t of [1.2, 2.2, 3.6, 5, 6.6]) {
  await page.evaluate((v) => window.__medlensDemoSeek(v), t);
  await page.waitForTimeout(120);
  await win.screenshot({ path: `${out}/demo-${width}-t${t}.png` });
}
console.log(width, 'console errors:', errors.length ? errors : 0);
await browser.close();
