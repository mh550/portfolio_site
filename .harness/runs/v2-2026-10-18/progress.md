# Progress log — run v2-2026-10-18 (branch `harness/v2-2026-10-18`)

What this file is: the shared memory of this harness run. Every session reads it at startup and adds a short
entry **at the top** (newest first): feature id, what landed, what the next session must know. The feature list is
`feature_list.json` in this directory: array order is priority, `after` lists are the real dependencies, a session
may flip only its own feature's `passes`. Michael steers through `INBOX.md` on this branch (first line
`status: run|pause|stop`; answers under `## Answers`). Plans go in `docs/plans/2026-10-18-<milestone>-<topic>.md`;
new defaults go in the spec's Decisions list as `D<n> *default*` (D15–D27 already appended by the initializer).

---

### 2026-10-18 verify M1

check.sh green (154 tests); smoke all routes PASS at 1280 and 390.

| Feature | Step | What you ran or read | What you saw | Holds |
|---|---|---|---|---|
| M1-01 | 1 | `grep '^## '` on docs/plans/2026-10-18-M1-card.md; read Layout at 390 | Sections Layout at 390, Chrome, vCard, QR, Tests, What Michael will see, Review all present; 112 px, 44 px, 844 mentioned | yes |
| M1-01 | 2 | grep the plan for the slugs and "change automatically" | Selected-work section names the three slugs; line 36 says they change automatically as case studies merge | yes |
| M1-01 | 3 | `git diff --stat 18a6003~1 18a6003` | docs/plans/ file plus .harness/runs files only, no code | yes |
| M1-01 | 4 | check.sh | green (cached, 154 tests) | yes |
| M1-02 | 1 | read src/lib/vcard.ts; ran vcard.test.ts | exports buildVCard; "builds the exact vCard for the real profile" and the CRLF test pass; curl output shows the exact lines in order | yes |
| M1-02 | 2 | vcard.test.ts escaping cases | "escapes comma, semicolon and newline in N and FN" and "doubles a backslash in the location" pass | yes |
| M1-02 | 3 | vcard.test.ts "has no phone line (D5)" | passes; curl body has no TEL | yes |
| M1-02 | 4 | read route.ts; ran vcf-route.test.ts | force-static and GET present; 5 tests assert 200, both headers, body equals buildVCard | yes |
| M1-02 | 5 | `curl -si localhost:7800/michael-herron.vcf` | 200, content-type text/vcard; charset=utf-8, content-disposition inline; filename="michael-herron.vcf", body starts BEGIN:VCARD | yes |
| M1-02 | 6 | check.sh | green | yes |
| M1-03 | 1 | read package.json and lock | qrcode and @types/qrcode only in devDependencies (dependencies has none); "qr" script present; lock mentions qrcode | yes |
| M1-03 | 2 | read scripts/make-qr.mjs; `npm run qr` twice, `git status --short`, xxd of PNG | imports profile.ts, margin 2, M, colours, width 1024; exit 0 both times; status clean; IHDR 0x400 x 0x400 | yes |
| M1-03 | 3 | qr.test.ts | "committed qr.svg encodes ${profile.siteUrl}/card?src=qr" and "qr.png is 1024 × 1024" pass | yes |
| M1-03 | 4 | `git ls-files public/card` | qr.png, qr.svg | yes |
| M1-03 | 5 | check.sh | green | yes |
| M1-04 | 1 | read SiteChrome.tsx; SiteChrome.test.tsx | client component; hides chrome on /card and /card/*, no footer on /; no ConditionalFooter file; tests cover /card, /card/qr, /, /about (plus /cardigan) | yes |
| M1-04 | 2 | read src/app/card/page.tsx | 112 px next/image, h1, positioning, subline, Save contact, LinkedIn/Email/GitHub, h2 Selected work from getTopProjects(3), Full portfolio, Show QR, min-h-[44px] | yes |
| M1-04 | 3 | read metadata; card.test.tsx "metadata title and description" | title, description, openGraph.images and twitter.images with headshot, card 'summary' | yes |
| M1-04 | 4 | card.test.tsx (13 tests pass) | assert name, positioning, hrefs, 3 project links equal getTopProjects(3) in order, no nav | yes |
| M1-04 | 5 | smoke-routes.txt; smoke on /card; `curl /card | grep -c '<nav'` | file lists /card and /card/qr; PASS at 1280 and 390; grep count 0 | yes |
| M1-04 | 6 | check.sh | green | yes |
| M1-05 | 1 | read src/app/card/qr/page.tsx | bg-white text-black min-h-screen, img /card/qr.svg, alt names michael-herron.vercel.app/card, width min(80vw,420px), name, positioning, Back to /card, robots index false | yes |
| M1-05 | 2 | card-qr.test.tsx (7 tests pass) | img src/alt, back href, text, robots, no nav asserted | yes |
| M1-05 | 3 | smoke on /card /card/qr | PASS both at both widths; routes file has both | yes |
| M1-05 | 4 | read docs/conference-kit.md; grep for phone-like numbers | 40 lines, three sections, content as required, no phone number; content-guard test in suite passes | yes |
| M1-05 | 5 | check.sh | green | yes |
| M1-06 | 1 | `ls -l docs/screenshots/v2` | M1-card-390 75 KB, M1-card-1280 99 KB, M1-card-qr-390 10 KB, all under 400 KB | yes |
| M1-06 | 2 | Playwright at 390x844 against :7800 | h1 bottom 200, Save contact bottom 384, both ≤ 844; same numbers in the plan | yes |
| M1-06 | 3 | Playwright heights at 390 | Save 48, LinkedIn 44, Email 44, GitHub 44, Full portfolio 44, Show QR 44; listed in the plan | yes |
| M1-06 | 4 | read plan table | three rows (page, on screen, anything wrong) | yes |
| M1-06 | 5 | Playwright at 1280 | main x 380, width 520, centered | yes |
| M1-06 | 6 | check.sh | green | yes |
| M1-07 | 1 | read plan ## Review | review of the diff with Critical/Important/Minor items one line each | yes |
| M1-07 | 2 | read Review; ran card/card-qr/vcard tests | no Critical/Important; Minor fixes name their tests and those pass | yes |
| M1-07 | 3 | read Review; Playwright heading list, nav count | h1 then h2 only; focus outline test passes; Review records the checks and fixes | yes |
| M1-07 | 4 | `grep -rn 'mherron734\|Systems & Process Engineer' src --include=*.tsx` excluding tests | no hits | yes |
| M1-07 | 5 | grep CLAUDE.md and plan | routes table has /card, /card/qr, /michael-herron.vcf; plan line 353 "Ready to merge: yes" | yes |
| M1-07 | 6 | smoke all routes; check.sh | all PASS; green | yes |

### 2026-10-18 21:55 · M1-07 · passes

- Opus review of `$HARNESS_SCRATCH/M1.diff` (2473db6..HEAD, 1395 lines): 0 Critical, 0 Important, 13 Minor. Fixed 8
  test-first: arrow aria-hidden on "Full portfolio", sr-only "(opens in new tab)" on LinkedIn/GitHub, all 9 /card links
  pinned to `focus-visible:outline-2`, "Back to card" sr-only on /card/qr, QR img width/height 420, `escape` →
  `escapeText`, a 75-octet vCard line test, Footer.tsx + contact/page.tsx now read `profile` (grep clean). 150 → 154.
- The rest are listed with reasons in the plan's Review section, along with the web-design-guidelines results.
  Contrast is AA everywhere (lowest is muted text on the card surface, 5.4:1). A Chromium keyboard pass at 390
  reached all 9 /card links, each with a 2px cyan outline. The plan ends "Ready to merge: yes"; CLAUDE.md routes now list /card,
  /card/qr, /michael-herron.vcf.
- Verified: smoke 28/28 PASS; check.sh green (154); 390 screenshots of /card, /card/qr, /contact unchanged visually.
- Note: the footer/contact LinkedIn href is now the canonical `https://www.linkedin.com/in/mherron734/`. A PNG
  byte-compare test was tried and dropped (≈ 8 s under Jest). M1 is complete; next is M3 per the brief's order.
- Questions: none. Proposed changes: none.

### 2026-10-18 21:25 · M1-06 · passes

- New `docs/screenshots/v2/M1-card-390.png` (75 KB, 390 × 844 viewport), `M1-card-1280.png` (99 KB, full page),
  `M1-card-qr-390.png` (10 KB); the plan's "What Michael will see" table and Measurements line are filled. No code
  changed; 150 → 150 tests.
- Measured with Playwright (`$HARNESS_SCRATCH/m1-measure.mjs`) against :7800: h1 bottom 200, Save contact bottom 384
  (fold 844); heights Save contact 48, LinkedIn/Email/GitHub/Full portfolio/Show QR 44 each, /card/qr Back 44; main at
  1280 = 520 px wide, 380 px each side; QR 312 px at 390; scroll overflow at 390 = 0. Smoke 28/28 PASS; check.sh green.
- Nothing looked wrong. The `next dev` "N" badge was hidden with injected CSS before the shots (production has none).
- Next: M1-07 (review) is unblocked; its Minor list from M1-04 (aria-hidden arrow on "Full portfolio →", sr-only
  "opens in new tab") is still open. Questions: none. Proposed changes: none.

### 2026-10-18 21:05 · M1-05 · passes

- New `src/app/card/qr/page.tsx` (static server component: white `min-h-screen` main, plain `<img src="/card/qr.svg">`
  at `min(80vw, 420px)`, alt built from `profile.siteUrl`'s host, h1 name + positioning below, `← Back` to `/card` with
  the arrow aria-hidden, `robots: { index: false }`, title `QR — Michael Herron`). New `card-qr.test.tsx` (6).
  `/card/qr` appended to `.harness/smoke-routes.txt`. New `docs/conference-kit.md` (40 lines, 3 sections). 144 → 150.
- Verified: the test failed first (module missing); a 420 → 400 px mutation fails the width assertion; `curl :7800/card/qr`
  → 200, `<nav` 0, `<meta name="robots" content="noindex"/>`; `/card/qr.svg` 200 image/svg+xml; smoke `/card` and
  `/card/qr` PASS at 1280 and 390, full smoke 28/28; all 11 content-guard regexes run over the kit: 0 hits; check.sh
  green (150). 390 screenshot: QR ≈ 280 px square centered, name, positioning and Back below, no overflow.
- Opus review: 0 Critical/Important. Took 5 Minors: name is now an h1 (test checks h1 and DOM order img → name →
  positioning, failed first); kit says "featured, lowest order", that the PNG test checks only size, and that Android
  needs one more tap. Left: none.
- Next: M1-06 (screenshots + measurements) is unblocked. Questions: none. Proposed changes: none.

### 2026-10-18 20:40 · M1-04 · passes

- New `src/components/SiteChrome.tsx` (plan code verbatim; hides Navbar, `pt-16` and Footer on `/card` and `/card/*`,
  no Footer on `/`), `ConditionalFooter.tsx` deleted, `layout.tsx` renders `<SiteChrome>` and adds `metadataBase`
  (D24). New static `src/app/card/page.tsx` (headshot 112 px, h1, positioning, subline, Save contact, LinkedIn/Email/
  GitHub, getTopProjects(3), Full portfolio →, Show QR; metadata per plan). `.harness/smoke-routes.txt` = `/card`.
  D28 *default* appended to the spec. Tests: SiteChrome.test.tsx (5) + card.test.tsx (11). 128 → 144.
- Verified: both suites failed first (modules missing), then passed; `curl :7800/card` → 200, `<nav` count 0, `<footer`
  0, title "Michael Herron — Systems & Process Engineer", og:image absolute; `/about` still has its nav; the build
  prerenders `.next-check/server/app/card.html`; smoke `/card` PASS at 1280 and 390, full smoke 26/26 PASS; check.sh
  green (144). 390 screenshot: Save contact ends ≈ 384 px, all three projects visible, nothing wraps or overflows.
- Opus review: 0 Critical/Important. Minor, left for M1-07: "Full portfolio →" reads the arrow aloud (wrap it in
  aria-hidden and update the test's name); LinkedIn/GitHub `target=_blank` without an sr-only "opens in new tab";
  the no-`<nav>` page test is trivially true (SiteChrome test + curl are the real guard); the button test pins only
  `min-h-[44px]`.
- Next: M1-05 (/card/qr + conference kit) is unblocked; append `/card/qr` to `.harness/smoke-routes.txt`.
- Questions: none. Proposed changes: none.

### 2026-10-18 20:05 · M1-03 · passes

- New `scripts/make-qr.mjs` (imports profile.ts per D21, writes `public/card/qr.svg` as returned and a 1024 px
  `qr.png`; margin 2, ECC M, #0a0a0f on #ffffff; paths from `import.meta.url`), `npm run qr`, devDeps qrcode 1.5.4 +
  @types/qrcode 1.5.6 (lock `dev: true`, `dependencies` untouched), new `src/__tests__/lib/qr.test.ts` (2). 126 → 128.
- Verified: test failed first (ENOENT), then passed; changing siteUrl makes the SVG test fail (mutation checked);
  `npm run qr` twice, and once from /tmp, leaves `git status` unchanged; the PNG decodes with jsQR (scratch install) to
  `https://michael-herron.vercel.app/card?src=qr` at 1024×1024; check.sh green (128); smoke 24/24 PASS.
- An Opus review found 0 Critical/Important; took the Minor "Node ≥ 22.18" note (script header). Left the
  MODULE_TYPELESS warning (plan says don't add `"type": "module"`).
- Next: M1-04 (/card) is independent; M1-05 needs M1-03 + M1-04 and can use `/card/qr.svg` now.
- Questions: none. Proposed changes: none.

### 2026-10-18 19:45 · M1-02 · passes

- New `src/lib/vcard.ts` (`buildVCard(profile)`: vCard 3.0, CRLF everywhere, RFC 6350 escaping of N/FN/TITLE/ADR, no
  TEL, no PHOTO) and `src/app/michael-herron.vcf/route.ts` (force-static GET, `text/vcard; charset=utf-8`,
  `inline; filename="michael-herron.vcf"`). Tests: new vcard.test.ts (9) + app/vcf-route.test.ts (5, node env). 112 → 126.
- Verified: check.sh green (126); the build prerenders `.next-check/server/app/michael-herron.vcf.{body,meta}` with both
  headers and CRLF bytes (od -c); `curl -si :7800/michael-herron.vcf` shows both headers, body starts BEGIN:VCARD; smoke 24/24 PASS.
- An Opus review caught a real bug: `';'` was replaced by `'\;'` written with one backslash (a no-op in TS), and the test
  literal had the same slip, so it passed. Fixed test-first; added a `;`-in-ADR case and a backslash-before-comma
  ordering case. Reverting the fix makes 2 tests fail (mutation checked).
- Next: M1-03 and M1-04 are independent. M1-04 still appends D28 *default* (no PHOTO, inline disposition, no ScrollReveal).
- Questions: none. Proposed changes: none.

### 2026-10-18 19:05 · M1-01 · passes

- New `docs/plans/2026-10-18-M1-card.md` (plan only, no code): Files, Selected work (linear-ai-workflow,
  ghl-jobtread-integration, paint-estimator today; they change by themselves as case studies merge), Layout at 390
  (element table with estimated bottoms, fold 844), Choices, Chrome (SiteChrome code per D15), vCard (exact CRLF output,
  escaping rules, the test fixture as both file text and TS literals), QR, Tests (6 files, ~30 named cases), an empty
  What Michael will see table, and an empty Review section. Tests 112 → 112.
- Verified: I installed qrcode 1.5.4 in scratch and checked the facts the plan relies on: the code is 33 modules, the
  PNG is exactly 1024², two runs give byte-identical PNGs, and the SVG trips no content-guard pattern. Node 24 imports
  profile.ts from .mjs, printing only a MODULE_TYPELESS warning. check.sh is green (112), smoke is all PASS.
- An Opus review found 0 Critical and 2 Important issues (TS-literal backslashes in the escape test, next/image
  rewriting `src` in Jest), both now fixed in the plan, plus 6 Minor, all applied.
- Next session (M1-02/03/04 are independent): follow the plan. M1-04 appends **D28 *default*** to the spec (no
  ScrollReveal on /card, no vCard PHOTO, inline disposition) and adds `metadataBase` (D24).
- Proposed change: none.

### 2026-10-18 verify M0 · verify M0

check.sh green (112 tests, cached); smoke all PASS at 1280 and 390.

| Feature | Step | What you ran or read | What you saw | Holds |
|---|---|---|---|---|
| M0-01 | 1 | Read src/lib/data/profile.ts, index.ts (`export * from './profile'`), profile.test.ts | All 10 values match exactly; test asserts toEqual on the full object plus each key | yes |
| M0-01 | 2 | Read content-guard.test.ts PATTERNS, listFiles, tree test; compared with the spec regexes | Walks src/ and public/ with the listed extensions, skips itself, reports file:line pattern. Covers all 11 patterns the step enumerates (the step says "12" but lists 11, as does the spec) | yes |
| M0-01 | 3 | `npx jest src/__tests__/lib/content-guard.test.ts` | 20/20 pass: a sample per pattern (15 samples) asserted with the right pattern name, clean-sample test passes | yes |
| M0-01 | 4 | Tree test in content-guard.test.ts; `git log -- content-guard.test.ts` | Tree test green; file has a single commit (6e45680), so nothing was loosened afterwards | yes |
| M0-01 | 5 | `/home/mh550/projects/agent-harness/lib/check.sh` | green (112 tests) | yes |
| M0-02 | 1 | grep order/featured in projects.ts; `npx tsc --noEmit` | orders linear 2, ghl 5, paint 6, ringcentral 7, mirrored 8, cherished 9; both mirrored and cherished featured:false; `order: number` required; tsc exit 0 | yes |
| M0-02 | 2 | Read projects.ts getTopProjects, index.ts barrel (`export *`), data.test.ts lines 51-97 | Test asserts getTopProjects(3) slugs, (10) excludes cherished, order values unique; lib suites 55/55 pass | yes |
| M0-02 | 3 | Read approach.ts, approach.test.ts | 5 steps in order with the right labels, lines 38-67 chars, first person; barrel re-exports; test asserts ids, labels, 20-90 length | yes |
| M0-02 | 4 | `git diff f86ad9f..HEAD --stat` | Changes only in src/lib/data, src/__tests__ (incl. ScrollReveal.test.tsx, a test), .harness/runs, docs; no component edits; content-guard.test.ts has one commit | yes |
| M0-02 | 5 | `/home/mh550/projects/agent-harness/lib/check.sh` | green | yes |

### 2026-10-18 18:40 · M0-02 · passes

- `Project.order` (required) set per D12 on the 6 projects; `cherished` is now `featured: false` (mirrored stays
  false, D25). `getTopProjects(n)` in `projects.ts` (featured, by order, first n, n ≤ 0 → []). New
  `src/lib/data/approach.ts` (`methodSteps`, 5 first-person lines of 38–67 chars), both from the barrel. Tests: data.test.ts +6,
  new approach.test.ts (5). Jest 101 → 112, 14 → 15 suites.
- `npx tsc --noEmit` failed before this session on every test file (the repo has no `@types/jest`). Fixed without new
  deps: `src/__tests__/jest-globals.d.ts` declares the globals from `@jest/globals` + jest-dom matchers, and
  ScrollReveal.test uses `requireActual<object>`. tsc now exits 0.
- Verified: check.sh green (112 tests), smoke 24/24 PASS, tsc 0, content guard unchanged since M0-01 (`git diff 6e45680`).
  Opus review of the whole M0 diff: no bugs. I took 4 of its 6 suggestions (exact-slug assertion for getTopProjects(10), clamp negative n,
  two comments in the .d.ts).
- Next sessions: the `projects` array is **not** in `order` order and `ProjectsGrid` renders it as-is. M8 must
  sort the index by `order` and keep non-featured projects (don't use `getTopProjects` there). M1/M2 use
  `getTopProjects(3)`, which today gives linear-ai-workflow, ghl-jobtread-integration and paint-estimator.

### 2026-10-18 18:24 · M0-01 · passes

- Added `src/lib/data/profile.ts` (typed `Profile`, values from brand.md "Contact facts"), re-exported from
  `src/lib/data/index.ts`; `src/__tests__/lib/profile.test.ts` (11 tests); `src/__tests__/lib/content-guard.test.ts`
  (20 tests: 15 in-memory samples, a clean near-miss sample, a file:line test, a sample-coverage test, a walk test,
  and the tree scan). Jest 70 → 101 tests, 12 → 14 suites. No content files changed: the tree was already clean.
- Verified: `check.sh` green (101 tests); smoke PASS on all 18 route×width; I planted `TODO` in `src/zz-plant.ts`,
  a Spotify playlist URL in `public/zz-plant.svg` and a symlinked `public/zz-link.MD`, and the guard failed
  naming `src/zz-plant.ts:2 TODO`, `public/zz-plant.svg:1 Spotify playlist` and `public/zz-link.MD:1 TODO`
  (all planted files removed). An Opus review checked the regexes against the spec character by character and
  found no problems. I took two of its minor suggestions: the walk follows symlinks, and extensions are compared
  in lower case.
- Next session: the guard's patterns and samples live only in the test file, which skips itself. Keep
  `TODO`, `[X]` and `lorem ipsum` out of every other file in `src/` and `public/`, including test strings.
- Proposed change: the M0-01 steps say "12 spec M0 patterns" and "12 samples", but the spec (and the step's own
  list) has **11** patterns. The guard has the spec's 11 patterns exactly, plus 15 samples that cover all 11.

## 2026-10-18 · Initializer (Fable)

### Feature counts

| Milestone | Features | Ids | Needs |
|---|---|---|---|
| M0 guardrails + profile | 2 | M0-01…02 | — |
| M1 `/card` + QR (Monday) | 7 | M1-01…07 | M0 |
| M3 case-study template | 5 | M3-01…05 | M0 only |
| M4 agent-harness | 5 | M4-01…05 | M3 only |
| M5 home-media-server | 5 | M5-01…05 | M3 only |
| M6 hit-list | 5 | M6-01…05 | M3 only |
| M2 positioning | 6 | M2-01…06 | M1 |
| M7 `/approach` + `/evidence` | 5 | M7-01…05 | M3 only |
| M8 nav, index, polish | 2 | M8-01…02 | M2 + M7 |
| M9 docs hand-off | 1 | M9-01 | M1 only (runs when nothing earlier is runnable) |
| S1 OG images · S2 card note · S3 print CSS | 3 | S1-01, S2-01, S3-01 | M3 / M1 / M3 |

46 features. M0 has no plan or review feature (lean, per the brief); M3's screenshot check is folded into its
review (M3-05); M8's a11y pass and review are one feature (M8-02).

### Where things live (read before coding)

- Data: `src/lib/data/{projects,skills,experience}.ts` + barrel `index.ts`. M0 adds `profile.ts`, `approach.ts`;
  M7 adds `competencies.ts`. **Everything new is re-exported from the barrel** (`@/lib/data`).
- `Project` type is in `projects.ts` (slug, title, company, shortDescription, categories, techStack, githubUrl?,
  demoUrl?, featured, thumbnail?, metrics?, detail{problem, approach, challenges, outcome, architectureDiagram?,
  media?, codeSnippets?}). Six projects today; `cherished` and `mirrored-google-calendars` are already
  `featured: false`. `ProjectCategory` = integration | full-stack | ai | education.
- Page `src/app/projects/[slug]/page.tsx` renders four fixed sections (The Problem, The Approach, Challenges,
  Outcome) + diagram after Approach + "In the Code" + "A Closer Look". `generateMetadata` already returns
  `"<title> — Michael Herron"` / shortDescription. M3 extracts the body into `ProjectDetail` (D16).
- Diagrams: `src/components/projects/diagrams/index.tsx`, one file, HTML/Tailwind primitives (`Node`, `Arrow`,
  `Panel`), a `DIAGRAMS` map and a `CAPTIONS` map; the `figure` has a figcaption but **no `role="img"` /
  `aria-label` yet** (D17 adds a `LABELS` map). New diagrams: new files in that folder, registered in the maps.
- Reusables: `ScrollReveal`, `MetricStrip` (dl, renders null when empty), `MediaGallery` (next/image, 4:3,
  captions), `CodeBlock` (`{title, language, code}`), `ProjectCard` (shows `metrics[0]` in the preview band when
  there is no thumbnail), `TimelineLine`.
- Layout: `src/app/layout.tsx` = `<Navbar/>` + `<div className="pt-16">{children}</div>` + `ConditionalFooter`
  (client, hides the footer on `/`). The hero uses `-mt-16 h-screen` to cancel that padding. D15: replace with
  `SiteChrome`.
- Navbar links are a `links` array at the top of `src/components/Navbar.tsx`; `usePathname` for the active state.
- Design tokens in `src/app/globals.css` (`--color-background #0a0a0f`, `--color-accent #00d4ff`, `--color-muted`,
  `--color-surface`, `--color-surface-alt`); use `text-[var(--color-accent)]` etc. Geist via next/font.

### Testing gotchas

- Jest 30 + ts-jest via `next/jest`, jsdom, `@/` alias, framer-motion mapped to `src/__mocks__/framer-motion.tsx`.
  The mock only defines `motion.{div,span,p,h1,h2,section,nav,ul,li,button,a}`: **add any new `motion.<tag>` you
  use (ol, article, figure, …) to the mock** or the test crashes.
- Async server pages: call the component (`await Page({ params: Promise.resolve({ slug }) })`) and `render()` the
  returned element, or test the extracted body component with a prop (D16).
- Route handlers and anything using `Response`/`Headers`: put `/** @jest-environment node */` at the top of the
  test file (jsdom has no `Response`).
- `next/navigation` is mocked per test file: `jest.mock('next/navigation', () => ({ usePathname: () => '/' }))`.
- Canvas: `HTMLCanvasElement.prototype.getContext = jest.fn(() => null)` before rendering the hero.
- `src/__tests__/lib/data.test.ts` pins the project count (6 today): bump it in every milestone that adds a project.
- The content guard (M0-01) walks `src/` **and `public/`**: SVG/JSON/MD there are scanned too. The `[X]` and `TODO`
  patterns are literal; keep them out of comments and test sample strings outside the guard's own file.
- Suite: `.harness/check.sh` (eslint + jest + `next build` into `.next-check`), ~1 min. Subset: `npx jest <path>`.

### Dev server, smoke and screenshots

- `.harness/init.sh` leaves `next dev` on `$HARNESS_PORT` (7800 in this run; `${HARNESS_PORT:-7831}` otherwise).
  First load of a route compiles it: slow, and the smoke script allows 120 s.
- `node .harness/smoke.mjs [base] [path …]` → PASS/FAIL per route and width, full-page PNGs in `$HARNESS_SCRATCH`
  as `smoke-<name>-<width>.png`. With no paths it reads `.harness/smoke-routes.txt` (**does not exist yet; M1-04
  creates it**, one path per line) plus every `/projects/<slug>` linked from `/projects`.
- "What Michael will see" screenshots: copy from `$HARNESS_SCRATCH` into `docs/screenshots/v2/<M>-<page>-<width>.png`
  (create the folder) or capture directly. Full pages of the home hero can exceed 400 KB: then capture a
  `clip` of the top 3000 px or `fullPage: false`, and say so in the plan's table.
- Ad-hoc Playwright (bounding boxes, viewport-only shots, `emulateMedia`): Playwright is installed outside the
  repo at `$HARNESS_PW` (`/tmp/harness/pw`). In a `.mjs` script:
  `const { chromium } = createRequire('/tmp/harness/pw/')('playwright')`. Keep such scripts in `$HARNESS_SCRATCH`,
  not in the repo.

### Sources outside the repo (read-only, only these paths)

- agent-harness: `/home/mh550/projects/agent-harness/` — `README.md`, `docs/architecture.md`, `journal/README.md`
  (has a case-study outline), `journal/decisions.md`, `journal/evidence/timeline.md`, `journal/iterations/`,
  `journal/runs/`, `ledger/runs.jsonl`, `lib/driver.sh` (verified-tree merge check in `merge_milestone`, ~l.170–195),
  `lib/metrics.mjs` (limit detection, the `LIMIT` regex ~l.50). **Never `journal/raw/`.**
- dj-crate-streaming: `/home/mh550/projects/dj-crate-streaming/` — local `main` is behind; read docs with
  `git -C /home/mh550/projects/dj-crate-streaming show origin/main:<path>`. `docs/download-validation.md` exists
  locally (verify block under "Reading the result"; it contains `/srv/incoming/…`, see D18). Screenshots
  `docs/screenshots/01-playlists.png` (59 KB), `02-crate-toggled.png` (90 KB), `03-wanted.png` (108 KB). Never `m6-*`.
- hit_list: `/home/mh550/projects/hit_list/` — `README.md`, `APP_SPECIFICATIONS.md`, `OVERNIGHT.md`,
  `docs/specs/2026-10-13-overnight-design.md`, `docs/specs/2026-10-16-simplification-design.md`. No screenshots.
- Pathways and `mh550/projects` are private: never link or name their URLs.

### Other facts

- Node 24.21, Next 16.1.6, React 19.2, Tailwind 4, framer-motion 12. `qrcode` 1.5.4 and `@types/qrcode` 1.5.6 are
  on the registry; `npm i -D` them in M1-03 (the only approved new package). Lockfile changes make init reinstall.
- Policy is build-only: nothing is deployed, no live service is touched. The only "live" step in this run is
  Michael scanning the QR after he merges M1: it is written in `docs/conference-kit.md` (M1-05), not performed.
- Existing content already passes the 12 guard patterns (grep checked by the initializer).
- The pre-M2 skills list (39 strings) is in `src/lib/data/skills.ts` on this commit; M2-04's test hard-codes it.

### Questions for Michael (defaults chosen; nothing waits)

1. Skills page h1: stays "Tech Stack" after the regroup unless the M2 plan finds a better plain title (D20 names
   only the featured group). Reversible in one data/page edit.
2. Agent-harness iterations: 6 or 7 rows (row 1b folded or kept), D27. Reversible in the data file.
3. The home page footer returns once Recent work exists (D19). If you preferred the footer-less hero, flip one
   line in `SiteChrome`.
4. `conferenceNote` (S2) ships empty; type a line in `profile.ts` when you want it shown.
