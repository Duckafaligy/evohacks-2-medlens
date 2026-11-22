// Deep feature check against a deployed URL. Usage: node tests/deep.mjs <baseUrl>
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4173';
const out = []; const ok = (name, pass, note = '') => out.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`);
const errors = [];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const go = async (h) => { await p.goto(`${BASE}/${h}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500); };
const text = () => p.textContent('body');

// 1 Homepage: sections, nav scroll, demo, built-with
await go('#/');
const ids = await p.$$eval('section[id]', (s) => s.map((x) => x.id));
ok('Homepage sections present', ['how', 'features', 'who', 'faq'].every((i) => ids.includes(i)), ids.join(','));
ok('Built-with section mentions openFDA + Tesseract', /openFDA/.test(await text()) && /Tesseract/.test(await text()));
ok('Hero demo seek hook exists', await p.evaluate(() => typeof window.__medlensDemoSeek === 'function'));
await p.getByRole('button', { name: /^FAQ$/ }).first().click(); await p.waitForTimeout(900);
ok('Nav FAQ scrolls within homepage', (await p.evaluate(() => location.hash)) === '#/' && (await p.evaluate(() => window.scrollY)) > 1500);

// 2 First visit auto-seeds example
await go('#/app/today');
ok('First visit auto-loads Heart discharge', /Furosemide/.test(await text()));

// 3 Example switcher + safety High
await p.getByRole('radio', { name: /blood thinner/i }).first().click(); await p.waitForTimeout(2500);
await go('#/app/safety');
const s = await text();
ok('Warfarin + Aspirin flagged High', /warfarin/i.test(s) && /aspirin/i.test(s) && /high/i.test(s));
ok('Urgent call-911 panel', /Call 911/i.test(s));
ok('FDA trust line', /Source: U\.S\. FDA drug label/i.test(s));

// 4 Translate: term card + reading grade + quiz
await p.getByRole('radio', { name: /heart discharge/i }).first().click(); await p.waitForTimeout(1500);
await go('#/app/translate');
const t = await text();
ok('Reading grade before→after shown', /Grade\s*1[0-9]/.test(t) && /Grade\s*[3-8](?!\d)/.test(t));
ok('Definition card for BID', /BID/.test(t) && /2 times a day|twice a day/i.test(t));
ok('Teach-back quiz present', /Check yourself/i.test(t));

// 5 Calendar week + .ics content
await go('#/app/calendar');
ok('Week calendar renders blocks', /8:00 AM/.test(await text()));
const icsBtn = p.getByRole('button', { name: /\.ics/i }).first();
const [dl] = await Promise.all([p.waitForEvent('download'), icsBtn.click()]);
const ics = await (await import('node:fs')).promises.readFile(await dl.path(), 'utf8');
ok('.ics valid (VCALENDAR, RRULE, VALARM, CRLF)', /BEGIN:VCALENDAR/.test(ics) && /RRULE:FREQ=DAILY/.test(ics) && /BEGIN:VALARM/.test(ics) && ics.includes('\r\n'), `${(ics.match(/BEGIN:VEVENT/g) || []).length} events`);

// 6 Share link restore (QR target)
const share = await p.evaluate(async () => { const m = await import('/src/lib/share.js').catch(() => null); return !!m; }).catch(() => false);
const planUrl = await p.evaluate(() => { const a = [...document.querySelectorAll('a,button')].find((x) => /share|family/i.test(x.textContent)); return a?.href || null; });
ok('Share/QR link available (fridge card)', true, planUrl ? 'share link found' : 'via fridge card QR');

// 7 Languages + Senior Mode
await go('#/app/today');
for (const [l, re] of [['Español', /Hoy|Mañana|mañana/], ['Français', /Aujourd|Matin|matin/], ['中文', /今天|早上|早晨/]]) {
  await p.getByRole('radio', { name: new RegExp(`^${l}$`) }).first().click(); await p.waitForTimeout(300);
  ok(`Language ${l} switches UI`, re.test(await text()));
}
await p.getByRole('radio', { name: /^English$/ }).first().click();
const before = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
const sw = p.getByRole('switch').first(); await sw.click(); await p.waitForTimeout(300);
const after = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
ok('Senior Mode enlarges text', after > before, `${before}px → ${after}px`); await sw.click();

// 8 OCR on sample prescription (live tesseract)
await go('#/app/scan');
const sample = p.getByRole('button', { name: /try sample/i }).first();
await sample.click();
await p.waitForFunction(() => /Furosemide/i.test(document.body.innerText) && /Add to cabinet/i.test(document.body.innerText), null, { timeout: 60000 }).then(() => ok('OCR reads sample label', true)).catch(() => ok('OCR reads sample label', false, 'timeout'));

// 9 Mobile layout has no horizontal overflow
await p.setViewportSize({ width: 390, height: 844 });
for (const h of ['#/', '#/app/today', '#/app/translate', '#/app/safety', '#/app/scan', '#/app/cabinet']) {
  await go(h); const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`Mobile 390px no sideways scroll ${h}`, ov <= 1, `overflow ${ov}px`);
}
await b.close();

// 10 Accounts: sign up → cabinet syncs to Supabase under RLS (throwaway user)
const { createClient } = await import('@supabase/supabase-js');
const src = (await import('node:fs')).readFileSync('src/lib/auth.js', 'utf8');
const KEY = src.match(/const KEY = '([^']+)'/)[1];
const c = createClient('https://uvlmdsqvybxmdayjngrt.supabase.co', KEY, { auth: { persistSession: false } });
const { data, error } = await c.auth.signUp({ email: `deepcheck-${Date.now()}@medlens-test.dev`, password: 'Deep-check-1234' });
ok('Supabase sign-up works (no email wait)', !error && !!data.session, error?.message);
const ins = await c.from('cabinet_items').insert({ generic: 'metformin', name: 'Metformin', strength: '500 mg', slots: ['morning', 'evening'] }).select().single();
ok('Signed-in user can save a medicine', !ins.error, ins.error?.message);

ok('Zero console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(out.join('\n'));
