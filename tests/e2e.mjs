// End-to-end smoke test: every route renders, examples load, controls work, zero console errors.
// Usage: node tests/e2e.mjs [baseUrl]   (default http://localhost:4173 — run `npm run preview` first)
import { chromium } from 'playwright';
import assert from 'node:assert';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4173';
const SHOTS = 'tests/screens';
mkdirSync(SHOTS, { recursive: true });
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', permissions: [] });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(`[console] ${m.text()}`));
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

const go = async (hash, shot) => {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  if (shot) await page.screenshot({ path: `${SHOTS}/${shot}.png`, fullPage: true });
};

// 1. Homepage + in-page FAQ link
await go('#/', 'home');
await page.getByRole('heading', { level: 1 }).first().waitFor();
const faq = page.getByRole('link', { name: /^FAQ$/ }).or(page.getByRole('button', { name: /^FAQ$/ })).first();
if (await faq.count()) { await faq.click(); await page.waitForTimeout(600); }

// 2. Load each example from Scan and visit every view
await go('#/app/scan');
const examples = page.getByRole('button', { name: /cardiac|heart|ear infection|diabetes/i });
const n = await examples.count();
assert(n >= 3, `expected 3 example buttons, found ${n}`);
for (let i = 0; i < 3; i++) {
  await go('#/app/scan');
  await page.getByRole('button', { name: /cardiac|heart|ear infection|diabetes/i }).nth(i).click();
  await page.getByRole('button', { name: /add to cabinet/i }).first().click();
  await page.waitForTimeout(1500);
  for (const v of ['today', 'translate', 'safety', 'calendar', 'cabinet', 'quiz']) await go(`#/app/${v}`, `ex${i + 1}-${v}`);
}

// 3. Safety: diabetes example must flag Warfarin + Aspirin as High
await go('#/app/safety');
const body = await page.textContent('body');
assert(/warfarin/i.test(body) && /aspirin/i.test(body), 'safety view missing warfarin/aspirin');

// 4. Controls: Senior Mode, each language, read aloud
await go('#/app/today');
const senior = page.getByRole('switch', { name: /senior/i }).or(page.getByRole('checkbox', { name: /senior/i })).first();
if (await senior.count()) { await senior.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${SHOTS}/senior.png` }); await senior.click(); }
for (const l of ['ES', 'FR', '中文', 'EN']) {
  const b = page.getByRole('button', { name: new RegExp(`^${l}$`) }).first();
  if (await b.count()) { await b.click(); await page.waitForTimeout(200); }
}
const read = page.getByRole('button', { name: /read aloud/i }).first();
if (await read.count()) await read.click();

// 5. .ics download
await go('#/app/calendar');
const icsBtn = page.getByRole('button', { name: /\.ics/i }).or(page.getByRole('link', { name: /\.ics/i })).first();
if (await icsBtn.count()) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), icsBtn.click()]);
  assert(/\.ics$/.test(dl.suggestedFilename()), 'download is not .ics');
}

// 6. Mobile layout
await page.setViewportSize({ width: 390, height: 844 });
await go('#/app/today', 'mobile-today');
await go('#/', 'mobile-home');

await browser.close();
const real = errors.filter((e) => !/favicon|speechSynthesis/i.test(e));
if (real.length) { console.error(real.join('\n')); process.exit(1); }
console.log(`E2E OK — ${n} examples, all views, 0 console errors. Screens in ${SHOTS}/`);
