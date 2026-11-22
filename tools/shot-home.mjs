// Screenshot each homepage section for side-by-side checks against Paper.
// Usage: node tools/shot-home.mjs <outDir> [width=1440] [url=http://localhost:4174/#/]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [out = 'shots', width = '1440', url = 'http://localhost:4174/#/'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(async () => { // trigger lazy images
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  window.scrollTo(0, 0);
});
await page.waitForLoadState('networkidle');
const names = ['hero', 'problem', 'how', 'note', 'features', 'warning', 'numbers', 'who', 'senior', 'privacy', 'tools', 'faq', 'cta'];
const els = await page.$$('main > section');
for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: `${out}/${width}-${String(i + 1).padStart(2, '0')}-${names[i] || i}.png` });
await (await page.$('footer')).screenshot({ path: `${out}/${width}-11-footer.png` });
await page.screenshot({ path: `${out}/${width}-full.png`, fullPage: true });
const heights = await page.$$eval('main > section, footer', (n) => n.map((e) => Math.round(e.getBoundingClientRect().height)));
console.log(width, 'heights', heights.join(' '));
await browser.close();
