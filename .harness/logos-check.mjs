// P1-03: the hero's twelve floating logos (xl and up, D33/D78) stay clear of the hero text at 1280 wide.
//   node .harness/logos-check.mjs [baseUrl]     prints each logo's box per viewport and `overlaps: <n>`; exit 1 unless 0
// Loads / at 1280×720, 1280×800 and 1280×900 with reduced motion (so the marks hold still) and intersects every
// logo box with the eyebrow, h1, tagline, subline, strip and buttons row, plus the navbar and the VoiceWidget.
import { createRequire } from 'node:module';
const require = createRequire(`${process.env.HARNESS_PW ?? '/tmp/harness/pw'}/`);
const { chromium } = require('playwright');
const base = process.argv[2] ?? `http://localhost:${process.env.HARNESS_PORT ?? 7831}`;

const browser = await chromium.launch();
let overlaps = 0;
let logoCount = 0;
for (const height of [720, 800, 900]) {
  const context = await browser.newContext({ viewport: { width: 1280, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(1500); // the hero's fade-up
  const { logos, targets } = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    };
    const content = document.querySelector('section div.relative.z-10');
    const [eyebrow, h1, tagline, subline, strip, buttons] = content.children;
    const targets = {
      eyebrow: box(eyebrow), h1: box(h1), tagline: box(tagline), subline: box(subline),
      strip: box(strip.querySelector('ol') ?? strip), buttons: box(buttons),
    };
    const nav = document.querySelector('nav');
    if (nav) targets.navbar = box(nav);
    const widget = document.querySelector('a[href="/talk"].fixed');
    if (widget) targets.widget = box(widget);
    const logos = [...document.querySelectorAll('[data-logo]')].map((el) => ({ id: el.dataset.logo, ...box(el) }));
    return { logos, targets };
  });
  logoCount = Math.max(logoCount, logos.length);
  console.log(`1280×${height}`);
  for (const [name, t] of Object.entries(targets)) console.log(`  ${name.padEnd(10)} ${t.left},${t.top},${t.right},${t.bottom}`);
  for (const l of logos) {
    const hits = Object.entries(targets)
      .filter(([, t]) => l.left < t.right && l.right > t.left && l.top < t.bottom && l.bottom > t.top)
      .map(([name]) => name);
    overlaps += hits.length;
    console.log(`  logo ${l.id.padEnd(10)} ${l.left},${l.top},${l.right},${l.bottom}${hits.length ? `  OVERLAPS ${hits.join(', ')}` : ''}`);
  }
  await context.close();
}
await browser.close();
console.log(`logos: ${logoCount}`);
console.log(`overlaps: ${overlaps}`);
process.exit(overlaps === 0 && logoCount === 12 ? 0 : 1);
