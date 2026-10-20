// VC5-06: /talk when the token route refuses (429 busy visitor|site, 503): one token POST per Connect over 15 s, no
// getUserMedia, no mic toggle, focus stays on Connect with the accent outline, 0 errors but the POST's own line.
//   node .harness/talk-busy-check.mjs [screenshot dir]     report → $HARNESS_SCRATCH/vc506/report.txt, exit 1 on a FAIL
// /talk only fetches when the server has LiveKit env (D46), so run it against a dev server started with dummy values
// (LIVEKIT_URL=wss://livekit.invalid plus any key and secret) and restart the plain one after: every POST is
// fulfilled by page.route, so neither the route nor LiveKit is reached.
import { createRequire } from 'node:module';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = `http://localhost:${process.env.HARNESS_PORT ?? 7834}`;
const shots = process.argv[2] ?? 'docs/screenshots/v2';
const scratch = process.env.HARNESS_SCRATCH ?? '/tmp/harness/portfolio_site/manual';
const browser = await chromium.launch();
const report = [];
let failed = 0;
const check = (ok, what) => { report.push(`${ok ? 'OK  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

async function scenario({ name, status, body, width, height, shot, clicks = 1, waitMs = 15000 }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const tokenRequests = [];
  const errors = [];
  page.on('request', r => { if (r.url().endsWith('/api/concierge/token')) tokenRequests.push(r.method()); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/api/concierge/token', route =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }));
  await page.goto(`${base}/talk`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.__gum = 0;
    const md = navigator.mediaDevices;
    if (md) md.getUserMedia = async () => { window.__gum++; throw new DOMException('blocked by check', 'NotAllowedError'); };
  });
  const connect = page.getByRole('button', { name: 'Connect' });
  const before = await connect.boundingBox();
  const out = { name, status, width, height, connectBottomAtTop: before && Math.round(before.y + before.height) };
  for (let i = 1; i <= clicks; i++) {
    await connect.focus();              // keyboard path, so :focus-visible applies
    await page.keyboard.press('Enter');
    await page.waitForTimeout(waitMs);
    check(tokenRequests.length === i, `${name}: ${tokenRequests.length} token request(s) after click ${i} + ${waitMs / 1000} s (want ${i})`);
  }
  check(tokenRequests.every(m => m === 'POST'), `${name}: every token request is a POST (${tokenRequests.join(',')})`);
  out.statusText = await page.getByRole('status').first().textContent();
  out.focus = await page.evaluate(() => {
    const el = document.activeElement;
    return { text: el?.textContent, tag: el?.tagName, focusVisible: el?.matches(':focus-visible'), outlineColor: getComputedStyle(el).outlineColor, outlineStyle: getComputedStyle(el).outlineStyle };
  });
  out.gum = await page.evaluate(() => window.__gum);
  out.micButton = await page.getByRole('button', { name: /microphone/i }).count();
  out.connectVisible = await connect.isVisible();
  out.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const allowed = new RegExp(`Failed to load resource: the server responded with a status of ${status}`);
  out.errors = errors;
  check(errors.every(e => allowed.test(e)), `${name}: no console/page errors except the ${status} line (${errors.length}: ${JSON.stringify(errors)})`);
  check(out.gum === 0, `${name}: getUserMedia calls ${out.gum}`);
  check(out.micButton === 0, `${name}: mic toggle count ${out.micButton}`);
  check(out.focus.text === 'Connect' && out.focus.focusVisible && out.focus.outlineColor === 'rgb(0, 212, 255)',
    `${name}: focus ${JSON.stringify(out.focus)}`);
  if (shot) {
    await page.evaluate(() => window.scrollTo(0, 0));   // Connect sits above the fold at both widths
    await page.waitForTimeout(800);
    const path = `${shots}/${shot}`;
    await page.screenshot({ path });
    out.shot = path; out.shotKB = Math.round(statSync(path).size / 1024);
    check(out.shotKB < 400, `${name}: ${shot} ${out.shotKB} KB`);
  }
  report.push(JSON.stringify(out));
  await context.close();
}

const busy = reason => ({ error: 'busy', reason });
await scenario({ name: 'busy-visitor-390', status: 429, body: busy('visitor'), width: 390, height: 844, shot: 'VC5-talk-busy-visitor-390.png', clicks: 2 });
await scenario({ name: 'busy-site-390', status: 429, body: busy('site'), width: 390, height: 844, shot: 'VC5-talk-busy-site-390.png' });
await scenario({ name: 'busy-visitor-1280', status: 429, body: busy('visitor'), width: 1280, height: 800, shot: 'VC5-talk-busy-visitor-1280.png', waitMs: 2000 });
await scenario({ name: 'offline-503-390', status: 503, body: { offline: true }, width: 390, height: 844, shot: 'VC5-talk-offline-503-390.png', clicks: 2 });
await browser.close();
const text = report.join('\n');
mkdirSync(`${scratch}/vc506`, { recursive: true });
writeFileSync(`${scratch}/vc506/report.txt`, text + '\n');
console.log(text);
process.exit(failed ? 1 : 0);
