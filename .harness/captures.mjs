// "What Michael will see" captures: full-page PNGs of each path at 1280 and 390 px, plus the facts a plan row needs.
//   node .harness/captures.mjs <outDir> <prefix> <path> [path ...]     → <outDir>/<prefix>-<page>-<width>.png
// Scrolls each page top to bottom first so every ScrollReveal section is in view (a bare full-page capture leaves
// below-the-fold sections at opacity 0), then back to the top. Prints one JSON line per capture: size, eyebrow,
// loop strip (labels and the number of rows its <li>s sit on), /about's intro and How I work links, and whether
// the page shows "Glad we met". Shrink a PNG over 400 KB with PIL `quantize` afterwards.
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = process.env.HARNESS_BASE ?? `http://localhost:${process.env.HARNESS_PORT ?? 7831}`;
const [outDir, prefix, ...paths] = process.argv.slice(2);
if (!outDir || !prefix || !paths.length) {
  console.error('usage: node .harness/captures.mjs <outDir> <prefix> <path> [path ...]');
  process.exit(2);
}

const browser = await chromium.launch();
let failed = 0;
for (const path of paths) {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const res = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.waitForTimeout(1500); // the hero's fade-up
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '_');
    const file = `${outDir}/${prefix}-${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const facts = await page.evaluate(() => {
      const strip = document.querySelector('ol[aria-label]');
      const items = strip ? [...strip.querySelectorAll(':scope > li')] : [];
      const tops = new Set(items.map(li => Math.round(li.getBoundingClientRect().top)));
      const label = el => el.querySelector('span')?.textContent.trim();
      const eyebrow = document.querySelector('main p, #content p');
      const howIWork = document.getElementById('how-i-work');
      return {
        eyebrow: eyebrow ? eyebrow.innerText.trim() : null,
        strip: strip && {
          aria: strip.getAttribute('aria-label'),
          labels: items.map(label).join(' → '),
          rows: tops.size,
          box: (({ left, top, width, height }) => ({ left, top, width, height }))(strip.getBoundingClientRect()),
        },
        intro: howIWork ? document.querySelector('main h1 ~ p, #content h1 ~ p')?.innerText.trim() : undefined,
        howIWork: howIWork
          ? [...howIWork.querySelectorAll('ol a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
          : undefined,
        gladWeMet: document.body.innerText.includes('Glad we met'),
        scroll: document.documentElement.scrollWidth - window.innerWidth,
        height: document.documentElement.scrollHeight,
      };
    });
    const status = res?.status() ?? 0;
    const ok = status < 400 && !errors.length && (width !== 390 || facts.scroll === 0);
    if (!ok) failed++;
    const kb = Math.round(statSync(file).size / 1024);
    console.log(JSON.stringify({ file, status, kb, ...facts, errors }));
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
