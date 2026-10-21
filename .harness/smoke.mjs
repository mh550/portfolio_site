// Start-of-session end-to-end check: every page loads in headless Chromium at 1280 and 390 px with no page errors,
// no console errors, and no horizontal scroll at 390. Run after .harness/init.sh.
//   node .harness/smoke.mjs [baseUrl] [path ...]     screenshots → $HARNESS_SCRATCH/smoke-<page>-<width>.png
// With no paths it checks the static routes plus every /projects/<slug> it finds linked from /projects,
// and any route listed in .harness/smoke-routes.txt (one path per line; milestones add their new pages there).
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";

const require = createRequire(`${process.env.HARNESS_PW ?? "/tmp/harness/pw"}/`);
const { chromium } = require("playwright");
const [argBase, ...argPaths] = process.argv.slice(2);
const base = argBase ?? `http://localhost:${process.env.HARNESS_PORT ?? 7831}`;
const out = process.env.HARNESS_SCRATCH ?? "/tmp/harness/portfolio_site/manual";

const browser = await chromium.launch();
let paths = argPaths;
if (!paths.length) {
  paths = ["/", "/about", "/skills", "/projects", "/experience", "/contact"];
  const extra = ".harness/smoke-routes.txt";
  if (existsSync(extra)) paths.push(...readFileSync(extra, "utf8").split("\n").map(s => s.trim()).filter(s => s.startsWith("/")));
  const page = await browser.newPage();
  await page.goto(base + "/projects", { waitUntil: "load", timeout: 120_000 });
  const slugs = await page.$$eval('a[href^="/projects/"]', as => [...new Set(as.map(a => a.getAttribute("href")))]);
  paths.push(...slugs);
  await page.close();
}

let failed = 0;
for (const path of [...new Set(paths)]) {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    const res = await page.goto(base + path, { waitUntil: "load", timeout: 120_000 });   // first dev compile is slow
    await page.waitForTimeout(800);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = path === "/" ? "home" : path.slice(1).replaceAll("/", "_");
    await page.screenshot({ path: `${out}/smoke-${name}-${width}.png`, fullPage: true });
    const status = res?.status() ?? 0;
    const ok = status < 400 && !errors.length && (width > 400 || scroll <= 0);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${path} @${width}${status >= 400 ? ` HTTP ${status}` : ""}`
      + `${errors.length ? ` errors: ${errors.join(" | ").slice(0, 400)}` : ""}${width <= 400 && scroll > 0 ? ` horizontal scroll ${scroll}px` : ""}`);
    await page.close();
  }
}
await browser.close();

// Redirects (no-argument runs only): status 308 and the exact Location (D79: /approach → /about#how-i-work).
if (!argPaths.length) {
  for (const [from, to] of [["/approach", "/about#how-i-work"]]) {
    const res = await fetch(base + from, { redirect: "manual" });
    const ok = res.status === 308 && res.headers.get("location") === to;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${from} → ${to}${ok ? "" : ` got ${res.status} ${res.headers.get("location")}`}`);
  }
}
process.exit(failed ? 1 : 0);
