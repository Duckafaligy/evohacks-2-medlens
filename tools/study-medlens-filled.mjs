// Load an example on live MedLens, then capture filled views.
import { chromium } from 'playwright';
const OUT = 'C:/Promo Business/Other projects/evohacks-2-medlens-design/refs/';
const B = 'https://evohacks-2-medlens.vercel.app/#';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })).newPage();
await page.goto(B + '/app/today'); await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Diabetes + Blood Thinner' }).click(); await page.waitForTimeout(4000);
for (const r of ['today', 'safety', 'cabinet', 'calendar']) {
  await page.goto(B + '/app/' + r); await page.waitForTimeout(3500);
  await page.screenshot({ path: OUT + 'medlens-filled-' + r + '.png', fullPage: true });
  console.log('ok', r, page.url());
}
await browser.close();
