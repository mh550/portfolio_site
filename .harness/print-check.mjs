// S3-01 print check: loads a page with print media emulated and reports what the print stylesheet should give.
//   node .harness/print-check.mjs [baseUrl] [path] [out.png]
// Defaults: http://localhost:$HARNESS_PORT, /projects/agent-harness, $HARNESS_SCRATCH/print-<slug>.png (700 px wide).
// Exit 1 when a check fails. The committed docs/screenshots/v2/S3-print-agent-harness.png is this capture reduced
// to 16 grays (PIL `quantize(16)`) to stay under 400 KB.
import { createRequire } from "node:module";
import { statSync } from "node:fs";

const require = createRequire(`${process.env.HARNESS_PW ?? "/tmp/harness/pw"}/`);
const { chromium } = require("playwright");
const base = process.argv[2] ?? `http://localhost:${process.env.HARNESS_PORT ?? 7831}`;
const path = process.argv[3] ?? "/projects/agent-harness";
const out = process.argv[4] ?? `${process.env.HARNESS_SCRATCH ?? "/tmp"}/print-${path.split("/").pop()}.png`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 1100 } });
await page.emulateMedia({ media: "print" });
await page.goto(base + path, { waitUntil: "load", timeout: 120_000 });
await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const visible = sel => [...document.querySelectorAll(sel)].filter(e => e.checkVisibility()).length;
  const css = e => getComputedStyle(e);
  return {
    bodyBg: css(document.body).backgroundColor,
    bodyColor: css(document.body).color,
    visibleNav: visible("nav"),
    visibleFooter: visible("footer"),
    visibleCanvas: visible("canvas"),
    hiddenReveals: [...document.querySelectorAll("[data-scroll-reveal]")].filter(e => css(e).opacity !== "1").length,
    pre: [...document.querySelectorAll("pre")].map(p => ({
      whiteSpace: css(p).whiteSpace, maxHeight: css(p).maxHeight, clipped: p.scrollWidth > p.clientWidth,
    })),
    linksNotUnderlined: [...document.querySelectorAll("main a")].filter(a => !css(a).textDecorationLine.includes("underline")).length,
    // "" = no computed style: a <source> inside <video> (/about) is never rendered, so it has no colour to check
    nonBlackText: new Set([...document.querySelectorAll("main *")].map(e => css(e).color).filter(c => c && c !== "rgb(0, 0, 0)")).size,
  };
});
await page.screenshot({ path: out, fullPage: true });
await browser.close();

const ok =
  r.bodyBg === "rgb(255, 255, 255)" && r.bodyColor === "rgb(0, 0, 0)" &&
  r.visibleNav + r.visibleFooter + r.visibleCanvas + r.hiddenReveals + r.linksNotUnderlined + r.nonBlackText === 0 &&
  r.pre.every(p => p.whiteSpace === "pre-wrap" && p.maxHeight === "none" && !p.clipped);
console.log(JSON.stringify({ ...r, screenshot: out, kb: Math.round(statSync(out).size / 1024) }));
console.log(ok ? "PASS print" : "FAIL print");
process.exit(ok ? 0 : 1);
