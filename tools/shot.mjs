// Screenshot a URL region at 1:1. Usage: node tools/shot.mjs <url> <out.png> [width] [height] [scrollY]
import { chromium } from 'playwright';
const [url, out, w = 1440, h = 900, y = 0] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate((y) => window.scrollTo(0, y), +y); await p.waitForTimeout(900);
await p.screenshot({ path: out }); await b.close();
