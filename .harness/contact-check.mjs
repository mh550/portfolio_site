// P4-02: what Michael will see for P4 (/contact in one screen, D97). Loads /contact at 390×844 and 1280×800 as a
// first visitor (fresh context, nothing in localStorage), asserts no vertical scroll, the concierge panel closed and
// the pill (and the callout, if it shows) clear of all three tiles, then saves a viewport capture of each.
//   node .harness/contact-check.mjs [screenshot dir]   default docs/screenshots/v3; exit 1 on a FAIL
// `scrollHeight <= innerHeight` is the step's assertion, but scrollHeight never reports less than the viewport, so
// the Footer's bottom edge is printed too: that is how much of the screen the page really uses.
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = `http://localhost:${process.env.HARNESS_PORT ?? 7835}`;
const root = fileURLToPath(new URL('..', import.meta.url));
const shots = resolve(root, process.argv[2] ?? 'docs/screenshots/v3');

const SIZES = [{ width: 390, height: 844 }, { width: 1280, height: 800 }];

const browser = await chromium.launch();
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const fmt = b => (b ? `${b.left},${b.top},${b.right},${b.bottom}` : 'none');
const hits = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

try {
for (const viewport of SIZES) {
  const size = `${viewport.width}×${viewport.height}`;
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/contact`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1200); // ScrollReveal's fade-up and the after-mount reads (callout seen)
  // next dev's own badge (bottom left) is not the site: production has none
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

  const m = await page.evaluate(() => {
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    };
    return {
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      footer: box(document.querySelector('footer')),
      // a tile's label (Email, LinkedIn, GitHub): the first text in it, since its name comes from its content
      tiles: [...document.querySelectorAll('main a')].map(a => ({ name: a.querySelector('span span')?.textContent?.trim() ?? '?', ...box(a) })),
      pill: box(document.getElementById('concierge-pill')),
      callout: box(document.querySelector('[role="note"]')),
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      expanded: document.getElementById('concierge-pill')?.getAttribute('aria-expanded') ?? null,
    };
  });

  console.log(`${size}`);
  console.log(`scrollHeight <= innerHeight: ${m.scrollHeight <= m.innerHeight}  (${m.scrollHeight} <= ${m.innerHeight})`);
  check(m.scrollHeight <= m.innerHeight, `${size}: no vertical scroll`);
  check(m.footer && m.footer.bottom <= m.innerHeight, `${size}: footer bottom ${m.footer?.bottom} <= ${m.innerHeight} (${m.innerHeight - (m.footer?.bottom ?? 0)} px spare)`);
  check(m.scrollWidth <= viewport.width, `${size}: no horizontal scroll (scrollWidth ${m.scrollWidth})`);
  check(m.dialogs === 0 && m.expanded === 'false', `${size}: panel closed (dialogs ${m.dialogs}, pill aria-expanded ${m.expanded})`);
  check(m.tiles.length === 3, `${size}: three tiles (${m.tiles.length})`);
  check(m.pill !== null, `${size}: pill shown`);
  console.log(`  pill     ${fmt(m.pill)}`);
  console.log(`  callout  ${fmt(m.callout)}`);
  for (const t of m.tiles) {
    const over = [['pill', m.pill], ['callout', m.callout]].filter(([, b]) => b && hits(t, b)).map(([n]) => n);
    console.log(`  tile     ${fmt(t)}  ${t.name}${over.length ? `  COVERED BY ${over.join(', ')}` : ''}`);
    check(over.length === 0, `${size}: ${t.name} tile clear of the pill${m.callout ? ' and the callout' : ''}`);
  }

  const file = `P4-contact-${viewport.width}.png`;
  await page.screenshot({ path: `${shots}/${file}` }); // the viewport, not the full page: one screen is the point
  const kb = Math.round(statSync(`${shots}/${file}`).size / 1024);
  check(kb < 400, `${size}: ${file} ${kb} KB`);
  check(errors.length === 0, `${size}: no console/page errors (${JSON.stringify(errors)})`);
  await context.close();
}
} catch (e) {
  check(false, `threw: ${e.message}`);
} finally {
  await browser.close();
}
console.log(failed === 0 ? 'contact-check: ok' : `contact-check: ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
