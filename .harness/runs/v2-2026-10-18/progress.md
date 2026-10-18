# Progress log — run v2-2026-10-18 (branch `harness/v2-2026-10-18`)

What this file is: the shared memory of this harness run. Every session reads it at startup and adds a short
entry **at the top** (newest first): feature id, what landed, what the next session must know. The feature list is
`feature_list.json` in this directory: array order is priority, `after` lists are the real dependencies, a session
may flip only its own feature's `passes`. Michael steers through `INBOX.md` on this branch (first line
`status: run|pause|stop`; answers under `## Answers`). Plans go in `docs/plans/2026-10-18-<milestone>-<topic>.md`;
new defaults go in the spec's Decisions list as `D<n> *default*` (D15–D27 already appended by the initializer).

---

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
