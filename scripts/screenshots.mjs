// Opens every built demo in a headless browser and saves a desktop + mobile
// screenshot to site/shots/, so cards always show the current state of each project.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4399;
const only = process.argv.slice(2);
const demos = JSON.parse(await readFile('site/data/demos.json', 'utf8'));
await mkdir('site/shots', { recursive: true });

const server = await startServer(PORT);
const browser = await chromium.launch();
const views = [
  { suffix: '', width: 1440, height: 900, mobile: false },
  { suffix: '-m', width: 390, height: 844, mobile: true },
];

for (const [name, d] of Object.entries(demos)) {
  if (d.status !== 'ok' || (only.length && !only.includes(name))) continue;
  for (const v of views) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.mobile ? 2 : 1,
      isMobile: v.mobile, hasTouch: v.mobile,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await page.goto(`http://localhost:${PORT}/${d.path}`, { waitUntil: 'networkidle', timeout: 45_000 });
    } catch { /* long-polling apps never go idle; screenshot anyway */ }
    await page.waitForTimeout(3500); // let intro animations settle
    await page.screenshot({ path: `site/shots/${name}${v.suffix}.jpg`, type: 'jpeg', quality: 78 });
    if (!v.mobile) {
      const text = (await page.evaluate(() => document.body?.innerText || '').catch(() => '')).trim();
      d.blank = text.length < 20;
      d.errors = errors.slice(0, 3);
    }
    await ctx.close();
  }
  d.shot = `shots/${name}.jpg`;
  d.shotMobile = `shots/${name}-m.jpg`;
  console.log(`📸 ${name}${d.blank ? '  (looks blank!)' : ''}${d.errors?.length ? `  errors: ${d.errors[0].slice(0, 120)}` : ''}`);
}
await browser.close();
server.close();
// re-read before writing: a build may have added entries while we were shooting
const latest = JSON.parse(await readFile('site/data/demos.json', 'utf8'));
for (const [name, d] of Object.entries(demos)) {
  if (d.shot && latest[name]?.status === 'ok') {
    Object.assign(latest[name], { shot: d.shot, shotMobile: d.shotMobile, blank: d.blank, errors: d.errors });
  }
}
await writeFile('site/data/demos.json', JSON.stringify(latest, null, 2));
