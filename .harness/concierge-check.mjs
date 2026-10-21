// P3-09: what Michael will see for P3 (the concierge in the site). Captures the closed pill with its first-visit
// callout, the open drawer over /projects, the minimized state, the cached Memory tab, the closing state and /talk,
// at 390 and 1280, and asserts on the way: no horizontal scroll at 390 with the panel open, focus on the panel title
// after opening and on the pill after Esc, the callout gone on a second load, no console errors but the 429 line.
//   node .harness/concierge-check.mjs [screenshot dir]   report → $HARNESS_SCRATCH/p3/report.txt, exit 1 on a FAIL
// Connect only fetches when the server has LiveKit env (D46), so run it against a dev server started with dummy
// values and restart the plain one after (talk-busy-check.mjs does the same); every token POST is fulfilled by
// page.route, so neither the route nor LiveKit is reached:
//   kill $(ss -ltnp | grep ":$HARNESS_PORT " | grep -o 'pid=[0-9]*' | cut -d= -f2)
//   LIVEKIT_URL=wss://livekit.invalid LIVEKIT_API_KEY=dummy LIVEKIT_API_SECRET=dummy \
//     nohup npx next dev -p $HARNESS_PORT > $HARNESS_SCRATCH/server-dummy.log 2>&1 &
//   node .harness/concierge-check.mjs && .harness/init.sh && node .harness/smoke.mjs
// The live state (the agent speaking, chips pulsing on a new body, the usher following a page) needs an agent: the
// Jest tests named in docs/plans/2026-10-21-P3-concierge-in-site.md § What Michael will see cover it.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = `http://localhost:${process.env.HARNESS_PORT ?? 7835}`;
const shots = process.argv[2] ?? 'docs/screenshots/v3';
const scratch = process.env.HARNESS_SCRATCH ?? '/tmp/harness/portfolio_site/manual';
// The memoryV2 fixture as JSON (src/__tests__/harness/concierge-check-fixture.test.ts keeps the two equal).
const memoryV2 = readFileSync(new URL('./fixtures/memory-v2.json', import.meta.url), 'utf8');
const VISITOR_ID = '3b241101-e2bb-4255-8caf-4136c566a962';

const SIZES = { 390: { width: 390, height: 844 }, 1280: { width: 1280, height: 800 } };
const CLOSING = 'Closing your earlier conversation…';
const ERROR_429 = /Failed to load resource: the server responded with a status of 429/;

const browser = await chromium.launch();
const report = [];
let failed = 0;
const check = (ok, what) => { report.push(`${ok ? 'OK  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

// One browser context per scenario, so localStorage (callout seen, visitor id, cache) starts as the scenario says.
// `token` answers every POST to the token route; `init` runs before any page script.
async function open(name, width, { token = { status: 503, body: { offline: true } }, init = null } = {}) {
  const context = await browser.newContext({ viewport: SIZES[width] });
  if (init) await context.addInitScript(init.fn, init.arg);
  const page = await context.newPage();
  const errors = [];
  const posts = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/api/concierge/token', route => {
    posts.push(route.request().method());
    return route.fulfill({ status: token.status, contentType: 'application/json', body: JSON.stringify(token.body) });
  });
  const done = async ({ allow = null } = {}) => {
    const bad = errors.filter(e => !(allow && allow.test(e)));
    check(bad.length === 0, `${name}: no console/page errors${allow ? ' except the 429 line' : ''} (${errors.length}: ${JSON.stringify(errors)})`);
    report.push(`     ${name}: token POSTs ${posts.length}`);
    await context.close();
  };
  return { page, posts, done };
}

async function go(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1200); // after-mount reads (callout seen, guide me, cache) and the hero's fade-up
  // next dev's own badge (bottom left) is not the site: production has none
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}

async function shoot(page, name, file, opts = {}) {
  const path = `${shots}/${file}`;
  await page.screenshot({ path, ...opts });
  const kb = Math.round(statSync(path).size / 1024);
  check(kb < 400, `${name}: ${file} ${kb} KB`);
}

const pill = page => page.locator('#concierge-pill');
const callout = page => page.getByRole('note');
const panel = page => page.getByRole('dialog', { name: 'Ask my site' });
const activeId = page => page.evaluate(() => document.activeElement?.id ?? null);
const scrollWidth = page => page.evaluate(() => document.documentElement.scrollWidth);

async function openPanel(name, page) {
  await pill(page).focus();
  await page.keyboard.press('Enter');
  await panel(page).waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  check(await activeId(page) === 'concierge-panel-title', `${name}: focus on the panel title after opening (${await activeId(page)})`);
  const memoryTab = panel(page).getByRole('tab', { name: 'Memory' });
  check(await memoryTab.getAttribute('aria-selected') === 'true', `${name}: Memory tab selected`);
}

// 1. A first visit to /: the pill and the callout above it.
for (const width of [390, 1280]) {
  const name = `home-callout-${width}`;
  const { page, done } = await open(name, width);
  await go(page, '/');
  check(await pill(page).isVisible(), `${name}: pill shown`);
  check(await callout(page).isVisible(), `${name}: callout shown on a first visit`);
  check(await scrollWidth(page) <= width, `${name}: no horizontal scroll (${await scrollWidth(page)})`);
  await shoot(page, name, `P3-home-callout-${width}.png`);
  await done();
}

// 2. /projects: the panel open (idle, Memory tab), then Esc, then a second load.
for (const width of [1280, 390]) {
  const name = `projects-${width}`;
  const { page, posts, done } = await open(name, width);
  await go(page, '/projects');
  await openPanel(name, page);
  check(await callout(page).count() === 0, `${name}: opening the panel dismisses the callout`);
  const sw = await scrollWidth(page);
  check(sw <= width, `${name}: no horizontal page scroll with the panel open (${sw})`);
  await shoot(page, name, `P3-projects-open-${width}.png`);
  await page.keyboard.press('Escape');
  await panel(page).waitFor({ state: 'detached' });
  await page.waitForTimeout(400);
  check(await activeId(page) === 'concierge-pill', `${name}: focus on the pill after Esc (${await activeId(page)})`);
  check(await callout(page).count() === 0, `${name}: no callout after Esc`);
  if (width === 1280) await shoot(page, name, 'P3-projects-minimized-1280.png');
  await go(page, '/projects');
  check(await pill(page).isVisible() && await callout(page).count() === 0, `${name}: callout absent on a second load`);
  check(posts.length === 0, `${name}: no token POST without Connect (${posts.length})`);
  await done();
}

// 3. A returning visitor before a call: the cached v2 body, greyed, with "as of".
{
  const name = 'memory-cached-390';
  const savedAt = new Date(Date.now() - 3600_000).toISOString();
  const { page, done } = await open(name, 390, {
    init: {
      fn: ({ id, body, savedAt }) => {
        localStorage.setItem('concierge.visitor_id', id);
        localStorage.setItem(`concierge.memory.${id}`, JSON.stringify({ v: 1, savedAt, body }));
        localStorage.setItem('concierge.callout_seen', '1');
      },
      arg: { id: VISITOR_ID, body: memoryV2, savedAt },
    },
  });
  await go(page, '/projects');
  await openPanel(name, page);
  const tabPanel = panel(page).getByRole('tabpanel');
  const text = (await tabPanel.textContent()) ?? '';
  check(/as of/.test(text), `${name}: the Memory tab says "as of"`);
  check(await panel(page).locator('[data-stale]').count() > 0, `${name}: the cached view is marked stale`);
  check(/Lisbon/.test(text), `${name}: the cached profile shows (Lisbon)`);
  const sw = await scrollWidth(page);
  check(sw <= 390, `${name}: no horizontal page scroll with the panel open (${sw})`);
  // The strip and the tabs sit at the foot of the sheet: bring them into view.
  await tabPanel.evaluate(el => el.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(300);
  await shoot(page, name, 'P3-memory-cached-390.png');
  await done();
}

// 4. Connect from the panel while this address has a room open: the closing state (D92).
{
  const name = 'closing-1280';
  const { page, posts, done } = await open(name, 1280, {
    token: { status: 429, body: { error: 'busy', reason: 'visitor' } },
    init: { fn: () => localStorage.setItem('concierge.callout_seen', '1'), arg: null },
  });
  await go(page, '/projects');
  await openPanel(name, page);
  await panel(page).getByRole('button', { name: 'Connect' }).click();
  await page.waitForTimeout(1500);
  const status = (await panel(page).getByRole('status').first().textContent()) ?? '';
  check(status === CLOSING, `${name}: status is the closing line (${JSON.stringify(status)})`);
  check(await panel(page).getByRole('button', { name: 'Leave' }).count() === 1, `${name}: Leave shown while closing`);
  check(posts.length >= 1 && posts.every(m => m === 'POST'), `${name}: token POSTs ${posts.join(',')}`);
  await shoot(page, name, 'P3-closing-1280.png');
  await panel(page).getByRole('button', { name: 'Leave' }).click(); // stops the retries before the context closes
  await page.waitForTimeout(500);
  await done({ allow: ERROR_429 });
}

// 5. /talk: the page, no pill, no panel.
for (const width of [1280, 390]) {
  const name = `talk-${width}`;
  const { page, done } = await open(name, width);
  await go(page, '/talk');
  check(await pill(page).count() === 0 && await panel(page).count() === 0, `${name}: no pill and no panel on /talk`);
  check(await scrollWidth(page) <= width, `${name}: no horizontal scroll (${await scrollWidth(page)})`);
  await shoot(page, name, `P3-talk-${width}.png`, { fullPage: true });
  await done();
}

await browser.close();
const text = report.join('\n');
mkdirSync(`${scratch}/p3`, { recursive: true });
writeFileSync(`${scratch}/p3/report.txt`, text + `\n${failed ? `${failed} FAIL` : 'all OK'}\n`);
console.log(text);
console.log(failed ? `${failed} FAIL` : 'all OK');
process.exit(failed ? 1 : 0);
