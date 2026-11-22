// Capture reference screenshots of medical sites + live MedLens for design study.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'C:/Promo Business/Other projects/evohacks-2-medlens-design/refs/';
mkdirSync(OUT, { recursive: true });

const SITES = [
  ['nhs-metformin', 'https://www.nhs.uk/medicines/metformin/'],
  ['nhs-metformin-side', 'https://www.nhs.uk/medicines/metformin/side-effects-of-metformin/'],
  ['medlineplus-metformin', 'https://medlineplus.gov/druginfo/meds/a696005.html'],
  ['mayo-drug', 'https://www.mayoclinic.org/drugs-supplements/metformin-oral-route/description/drg-20067074'],
  ['cleveland', 'https://my.clevelandclinic.org/health/drugs/11285-metformin-tablets'],
  ['goodrx', 'https://www.goodrx.com/metformin'],
  ['onemedical', 'https://www.onemedical.com/'],
  ['zocdoc', 'https://www.zocdoc.com/'],
  ['medlens-home', 'https://evohacks-2-medlens.vercel.app/#/'],
  ['medlens-today', 'https://evohacks-2-medlens.vercel.app/#/app/today'],
  ['medlens-safety', 'https://evohacks-2-medlens.vercel.app/#/app/safety'],
  ['medlens-calendar', 'https://evohacks-2-medlens.vercel.app/#/app/calendar'],
  ['medlens-scan', 'https://evohacks-2-medlens.vercel.app/#/app/scan'],
];

const only = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  serviceWorkers: 'block',
});
await Promise.all(SITES.filter(([n]) => !only.length || only.includes(n)).map(async ([name, url]) => {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3500);
    // dismiss cookie banners where obvious
    for (const t of ['Accept', 'Accept all', 'I agree', 'Accept All Cookies', "I'm OK with analytics cookies"]) {
      await page.getByRole('button', { name: t, exact: true }).first().click({ timeout: 800 }).catch(() => {});
    }
    const h = Math.min(5000, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.setViewportSize({ width: 1440, height: Math.max(900, h) });
    await page.waitForTimeout(800);
    await page.screenshot({ path: OUT + name + '.png', clip: { x: 0, y: 0, width: 1440, height: Math.max(900, h) } });
    console.log('ok', name, h, await page.title());
  } catch (e) {
    console.log('FAIL', name, e.message.split('\n')[0]);
  } finally { await page.close(); }
}));
await browser.close();
