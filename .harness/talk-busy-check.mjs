// VC5-06: /talk when the token route refuses (429 busy site, 503): one token POST per Connect over 15 s, no
// getUserMedia, no mic toggle, focus stays on Connect with the accent outline, 0 errors but the POST's own line.
// P3-07 (D92): a 429 busy/visitor is the closing state instead: "Closing your earlier conversation…" and Leave, one
// POST every 5 s (± 500 ms after the last answer) with never two open, and after 60 s the busy line and no more POSTs;
// Leave during closing stops them.
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

const CLOSING = 'Closing your earlier conversation…';
const BUSY_VISITOR = 'You already have a conversation open in another tab.';

// Every token POST answered 429 busy/visitor after `delayMs`; `leaveAfterMs` clicks Leave that long after Connect.
async function closingScenario({ name, width, height, shot, leaveAfterMs = null, delayMs = 200 }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  const posts = []; // { at, answeredAt }
  let open = 0;
  let maxOpen = 0;
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/api/concierge/token', async route => {
    const post = { method: route.request().method(), at: Date.now(), answeredAt: null };
    posts.push(post);
    maxOpen = Math.max(maxOpen, ++open);
    await new Promise(r => setTimeout(r, delayMs));
    post.answeredAt = Date.now();
    open--;
    await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'busy', reason: 'visitor' }) });
  });
  await page.goto(`${base}/talk`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1000);
  const status = page.getByRole('status').first();
  const connect = page.getByRole('button', { name: 'Connect' });
  await connect.focus();
  await page.keyboard.press('Enter');
  const t0 = Date.now();
  await page.waitForTimeout(1500);
  const out = { name, width, height };
  out.closingText = await status.textContent();
  out.leaveButtons = await page.getByRole('button', { name: 'Leave' }).count();
  check(out.closingText === CLOSING, `${name}: status after 1.5 s is the closing line (${JSON.stringify(out.closingText)})`);
  check(out.leaveButtons === 1, `${name}: Leave shown while closing (${out.leaveButtons})`);
  out.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  check(out.scrollWidth <= width, `${name}: no horizontal scroll (${out.scrollWidth})`);
  if (shot) {
    const path = `${shots}/${shot}`;
    await page.screenshot({ path });
    out.shot = path; out.shotKB = Math.round(statSync(path).size / 1024);
  }
  if (leaveAfterMs !== null) {
    await page.waitForTimeout(Math.max(0, leaveAfterMs - (Date.now() - t0)));
    await page.getByRole('button', { name: 'Leave' }).click();
    const n = posts.length;
    await page.waitForTimeout(12000);
    out.postsAtLeave = n; out.postsAfter = posts.length;
    check(posts.length === n, `${name}: no POST in the 12 s after Leave (${n} → ${posts.length})`);
    out.afterLeave = await status.textContent();
    check(out.afterLeave === '', `${name}: status empty after Leave (${JSON.stringify(out.afterLeave)})`);
  } else {
    await page.waitForTimeout(Math.max(0, 63000 - (Date.now() - t0)));
    out.busyText = await status.textContent();
    check(out.busyText === BUSY_VISITOR, `${name}: after 60 s the busy line (${JSON.stringify(out.busyText)})`);
    const n = posts.length;
    await page.waitForTimeout(8000);
    check(posts.length === n, `${name}: no POST after the busy line (${n} → ${posts.length})`);
    // each POST 5 s after the previous answer, ± 500 ms
    out.gapsMs = posts.slice(1).map((p, i) => p.at - posts[i].answeredAt);
    check(out.gapsMs.length > 0 && out.gapsMs.every(g => Math.abs(g - 5000) <= 500), `${name}: POST gaps after each answer ${JSON.stringify(out.gapsMs)}`);
    check(posts.length >= 11 && posts.length <= 12, `${name}: ${posts.length} POSTs in the minute (want 12, 11 if answers ran slow)`);
    out.focus = await page.evaluate(() => {
      const el = document.activeElement;
      return { text: el?.textContent, focusVisible: el?.matches(':focus-visible') };
    });
    check(out.focus.text === 'Connect', `${name}: focus back on Connect ${JSON.stringify(out.focus)}`);
  }
  out.posts = posts.length;
  out.maxOpen = maxOpen;
  check(maxOpen === 1, `${name}: never two POSTs open (max ${maxOpen})`);
  check(posts.every(p => p.method === 'POST'), `${name}: every token request is a POST`);
  const allowed = /Failed to load resource: the server responded with a status of 429/;
  out.errors = errors;
  check(errors.every(e => allowed.test(e)), `${name}: no console/page errors except the 429 line (${errors.length}: ${JSON.stringify(errors)})`);
  report.push(JSON.stringify(out));
  await context.close();
}

const busy = reason => ({ error: 'busy', reason });
await closingScenario({ name: 'closing-visitor-1280', width: 1280, height: 800, shot: 'P3-07-talk-closing-1280.png' });
await closingScenario({ name: 'closing-leave-390', width: 390, height: 844, shot: 'P3-07-talk-closing-390.png', leaveAfterMs: 7000 });
await scenario({ name: 'busy-site-390', status: 429, body: busy('site'), width: 390, height: 844, shot: 'VC5-talk-busy-site-390.png' });
await scenario({ name: 'offline-503-390', status: 503, body: { offline: true }, width: 390, height: 844, shot: 'VC5-talk-offline-503-390.png', clicks: 2 });
await browser.close();
const text = report.join('\n');
mkdirSync(`${scratch}/vc506`, { recursive: true });
writeFileSync(`${scratch}/vc506/report.txt`, text + '\n');
console.log(text);
process.exit(failed ? 1 : 0);
