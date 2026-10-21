// P5-06: what Michael will see for P5 (the /skills graph). In Chromium on the harness dev server:
//   1280×800  every node label inside its cluster rect and no two labels overlapping (bounding boxes); Tab from the
//             h1 through the controls to the first node link (each name printed); ArrowRight on the focused graph
//             moves the viewBox; the Agent Harness chip marks N ≥ 3 nodes active
//   390×844   no horizontal page scroll; the first view is one cluster with the Jump to a group row; the List view
//   captures  docs/screenshots/v3/P5-skills-{1280,selected-1280,390,list-390}.png, each under 400 KB
//   node .harness/skills-check.mjs [screenshot dir]   default docs/screenshots/v3; exit 1 on a FAIL
// It also prints how much of the graph the first-visit callout and the pill cover, then closes the callout.
// A capture over 400 KB is reduced to 64 colours with PIL (`python3`, as captures.mjs's note says) before the check.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = `http://localhost:${process.env.HARNESS_PORT ?? 7835}`;
const root = fileURLToPath(new URL('..', import.meta.url));
const shots = resolve(root, process.argv[2] ?? 'docs/screenshots/v3');
const MAX_KB = 400;

const browser = await chromium.launch();
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

async function open(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/skills`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1200); // ScrollReveal's fade-up and the matchMedia snapshot after hydration
  // next dev's own badge (bottom left) is not the site: production has none
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  // A first visit shows the concierge callout (D88) over the graph's lower right: report it, then close it, so the
  // captures show the graph (the pill stays, as on every chrome page)
  const cover = await page.evaluate(() => {
    const r = e => e?.getBoundingClientRect();
    const g = r(document.querySelector('[role="group"][tabindex="0"]'));
    const hit = b => (b && g && b.width > 0 && b.left < g.right && b.right > g.left && b.top < g.bottom && b.bottom > g.top
      ? `${Math.round(Math.min(b.right, g.right) - Math.max(b.left, g.left))}×${Math.round(Math.min(b.bottom, g.bottom) - Math.max(b.top, g.top))} px`
      : 'no');
    return { callout: hit(r(document.querySelector('[role="note"]'))), pill: hit(r(document.getElementById('concierge-pill'))) };
  });
  console.log(`${viewport.width}×${viewport.height}: first visit, over the graph: callout ${cover.callout}, pill ${cover.pill}`);
  const close = page.locator('[role="note"]').getByRole('button', { name: 'Close' });
  if (await close.count()) { await close.click(); await page.waitForTimeout(300); }
  return { context, page, errors };
}

async function capture(page, file, fullPage = true) {
  const path = `${shots}/${file}`;
  await page.mouse.move(1, 1); // no hover left on a node
  await page.screenshot({ path, fullPage });
  let kb = Math.round(statSync(path).size / 1024);
  if (kb >= MAX_KB) {
    execFileSync('python3', ['-I', '-c',
      'import sys; from PIL import Image; p=sys.argv[1]; Image.open(p).convert("RGB").quantize(64).save(p, optimize=True)', path]);
    kb = Math.round(statSync(path).size / 1024);
  }
  check(kb < MAX_KB, `${file} ${kb} KB`);
}

const viewBox = page => page.locator('svg[viewBox]').first().getAttribute('viewBox');
const chipGroup = page => page.locator('[aria-label="Highlight a project\'s stack"]');

try {
  // ---- 1280 ----
  {
    const { context, page, errors } = await open({ width: 1280, height: 800 });
    const size = '1280×800';
    const vb0 = await viewBox(page);
    console.log(`${size}: first viewBox ${vb0}`);

    // every node label inside its cluster's rect, and no two labels overlapping
    const labels = await page.evaluate(() => {
      const rect = r => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
      const boxes = Object.fromEntries([...document.querySelectorAll('[data-cluster-box]')]
        .map(g => [g.getAttribute('data-cluster-box'), rect(g.querySelector('rect').getBoundingClientRect())]));
      return [...document.querySelectorAll('g[data-cluster] a[data-node]')].map(a => ({
        id: a.getAttribute('data-node'),
        cluster: a.closest('g[data-cluster]').getAttribute('data-cluster'),
        label: rect(a.querySelector('text').getBoundingClientRect()),
        box: boxes[a.closest('g[data-cluster]').getAttribute('data-cluster')],
      }));
    });
    const outside = labels.filter(({ label: a, box: b }) => !(a.l >= b.l && a.r <= b.r && a.t >= b.t && a.b <= b.b));
    const overlaps = [];
    for (let i = 0; i < labels.length; i++)
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i].label, b = labels[j].label;
        if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) overlaps.push(`${labels[i].id}×${labels[j].id}`);
      }
    check(labels.length === 51, `${size}: ${labels.length} node labels drawn`);
    check(outside.length === 0, `${size}: every label inside its cluster rect (outside: ${outside.map(o => o.id).join(', ') || 'none'})`);
    check(overlaps.length === 0, `${size}: no two labels overlap (${overlaps.join(', ') || 'none'})`);

    await capture(page, 'P5-skills-1280.png');

    // Tab from the h1: the controls, then the graph, then the first node link
    await page.evaluate(() => { const h = document.querySelector('h1'); h.tabIndex = -1; h.focus(); });
    const order = [];
    let firstNode = null;
    for (let i = 0; i < 30 && !firstNode; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const e = document.activeElement;
        const name = e.getAttribute('aria-label') ?? e.textContent.trim();
        return { tag: e.tagName.toLowerCase(), name, node: e.matches('a[data-node]'), graph: e.matches('[role="group"][tabindex="0"]'),
          ring: getComputedStyle(e).outlineStyle !== 'none' || e.matches(':focus-visible') };
      });
      order.push(f.graph ? '[graph]' : f.name);
      if (f.node) firstNode = f;
    }
    console.log(`${size}: Tab order from the h1: ${order.join(' → ')}`);
    const controls = ['Zoom in', 'Zoom out', 'Reset view', 'List view'];
    const before = order.slice(0, order.indexOf('[graph]'));
    check(controls.every(c => before.includes(c)), `${size}: Tab reaches ${controls.join(', ')} before the graph`);
    check(firstNode !== null, `${size}: Tab reaches the first node link: "${firstNode?.name}"`);
    check(firstNode?.ring === true, `${size}: the first node link shows a focus ring`);

    // ArrowRight on the focused graph pans
    await page.locator('[role="group"][tabindex="0"]').focus();
    const vbA = await viewBox(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const vbB = await viewBox(page);
    check(vbA !== vbB, `${size}: ArrowRight moves the viewBox (${vbA} → ${vbB})`);
    await page.keyboard.press('0'); // back to the whole drawing for the next capture
    await page.waitForTimeout(200);
    check((await viewBox(page)) === vb0, `${size}: 0 resets the view (${await viewBox(page)})`);

    // the Agent Harness chip
    const chip = chipGroup(page).locator('button', { hasText: 'Agent Harness' }).first();
    await chip.click();
    await page.waitForTimeout(600); // the motion-safe fades
    const active = await page.locator('a[data-node][data-active="true"]').count();
    const dimmed = await page.locator('a[data-node][data-dim="true"]').count();
    const cross = await page.locator('path[data-cross][data-active="true"]').count();
    const href = await page.getByRole('link', { name: 'Open case study' }).first().getAttribute('href');
    const activeNames = await page.locator('a[data-node][data-active="true"]').evaluateAll(as => as.map(a => a.getAttribute('aria-label')));
    console.log(`${size}: Agent Harness active nodes: ${activeNames.join(', ')}`);
    check((await chip.getAttribute('aria-pressed')) === 'true', `${size}: Agent Harness chip pressed`);
    check(active >= 3, `${size}: Agent Harness marks N = ${active} nodes active (${dimmed} dimmed, ${cross} cross paths)`);
    check(href === '/projects/agent-harness', `${size}: Open case study → ${href}`);
    await capture(page, 'P5-skills-selected-1280.png');

    check(errors.length === 0, `${size}: no console/page errors (${JSON.stringify(errors)})`);
    await context.close();
  }

  // ---- 390 ----
  {
    const { context, page, errors } = await open({ width: 390, height: 844 });
    const size = '390×844';
    const m = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      jump: (() => { const g = document.querySelector('[aria-label="Jump to a group"]'); return g ? getComputedStyle(g).display : null; })(),
      pressed: [...document.querySelectorAll('[aria-label="Jump to a group"] button[aria-pressed="true"]')].map(b => b.textContent.trim()),
    }));
    const vb = await viewBox(page);
    check(m.scrollWidth <= m.innerWidth, `${size}: no horizontal page scroll (scrollWidth ${m.scrollWidth}, innerWidth ${m.innerWidth})`);
    check(m.jump === 'flex', `${size}: Jump to a group row shown (display ${m.jump})`);
    check(vb === '4 4 348 308', `${size}: first view is the first cluster (viewBox ${vb}, pressed ${m.pressed.join(', ') || 'none'})`);
    await capture(page, 'P5-skills-390.png');

    await page.getByRole('button', { name: 'List view' }).click();
    await page.waitForTimeout(400);
    const list = await page.evaluate(() => ({
      dts: document.querySelectorAll('#skill-list dt').length,
      listShown: getComputedStyle(document.getElementById('skill-list')).display !== 'none',
      graphShown: getComputedStyle(document.querySelector('[role="group"][tabindex="0"]')).display !== 'none',
      scrollWidth: document.documentElement.scrollWidth,
    }));
    check(list.listShown && !list.graphShown && list.dts === 51, `${size}: List view shows ${list.dts} skills, graph hidden`);
    check(list.scrollWidth <= 390, `${size}: List view has no horizontal scroll (scrollWidth ${list.scrollWidth})`);
    await capture(page, 'P5-skills-list-390.png');

    check(errors.length === 0, `${size}: no console/page errors (${JSON.stringify(errors)})`);
    await context.close();
  }
} catch (e) {
  check(false, `threw: ${e.message}`);
} finally {
  await browser.close();
}
console.log(failed === 0 ? 'skills-check: ok' : `skills-check: ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
