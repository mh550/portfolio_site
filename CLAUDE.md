# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Michael Herron's personal portfolio site — a bold, expressive multi-page site built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion. Deployed on Vercel.

**Spec:** `docs/specs/2026-10-18-portfolio-v2.md` — read this before implementing any new section or feature.
**Plans:** `docs/plans/` — one file per milestone (`<date>-<milestone>-<topic>.md`). Hand-off: `docs/review-guide.md`, `docs/asset-checklist.md`.

## Routes

| Route | Section |
|---|---|
| `/` | Hero / Landing |
| `/about` | About |
| `/skills` | Skills & Tech Stack |
| `/projects` | Projects index (filterable) |
| `/projects/[slug]` | Individual project deep-dive (static, from `lib/data/projects.ts`) |
| `/projects/[slug]/opengraph-image` | 1200×630 PNG via `next/og`: title + first metric (D38); bundled font only, so →/↔ are SVG arrows |
| `/experience` | Work history & education |
| `/contact` | Contact |
| `/approach` | How I work: `MethodStrip showLines` + six `principles` whose examples link via `resolvedExamples` (`approach.ts`) |
| `/evidence` | Noindex, off the Navbar: six `competencies` × 2–4 linked items via `resolvedItems` (`competencies.ts`, D7; rubric stub `docs/notes/maxx-level-4.md`) |
| `/card` | Conference contact card (no Navbar/Footer, via `SiteChrome`) |
| `/card/qr` | Black-on-white QR to `/card?src=qr` (`npm run qr` regenerates `public/card/qr.*`) |
| `/michael-herron.vcf` | vCard 3.0 from `buildVCard(profile)` (`src/lib/vcard.ts`), static route handler |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts` (static routes + every project, from `profile.siteUrl`) and `robots.ts`; both leave out `/evidence` and `/card/qr` |
| `/api/concierge/token` | POST `{visitor_id}` (UUID v4): 503 `{offline:true}` without the three `LIVEKIT_*` env vars; else a 10-minute LiveKit token that dispatches agent `concierge` (`route.ts`, plan `docs/plans/2026-10-20-VC1-token-route.md`) |

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (TypeScript check, prerenders every page; not a static export)
npm run lint         # ESLint
npm test             # Jest unit/integration tests (680 tests, 60 suites after VC1-03)
npm run test:watch   # watch mode
```

To run a single test file:
```bash
npm test -- src/__tests__/components/Navbar.test.tsx
```

## E2E Testing with playwright-cli

In harness runs `playwright-cli` is not installed: use `node .harness/smoke.mjs` (see How to verify).

Use the `playwright-cli` skill for all E2E tests. **Always use `-s=portfolio`** so multiple Claude Code instances don't collide:

```bash
playwright-cli -s=portfolio --config=.playwright/cli.config.json open http://localhost:3000
playwright-cli -s=portfolio --config=.playwright/cli.config.json snapshot
playwright-cli -s=portfolio --config=.playwright/cli.config.json screenshot --filename=.playwright-cli/name.png
```

Or set the session env var: `PLAYWRIGHT_CLI_SESSION=portfolio claude .`

The dev server must be running first (`npm run dev`). The `.playwright/cli.config.json` configures Chromium.

## Architecture

### Data Layer (`src/lib/data/`)
Single source of truth for all page content — no content is hardcoded in components:
- `projects.ts` — `Project[]` with slug, title, categories, techStack, detail sections; `getProjectBySlug()`, `getProjectsByCategory()`
- `skills.ts` — `SkillCategory[]`; four capability groups (process, systems, build, operate); `process` (Process & delivery) is `featured: true` (D20)
- `experience.ts` — `Role[]` + `Education` object
- `profile.ts` — `profile`: name, positioning, contact and `siteUrl`; the single source for the vCard, `/card`, metadata and sitemap
- `approach.ts` — `methodSteps` (five steps) and the six `principles`; `competencies.ts` — the six `/evidence` competencies
- `index.ts` — barrel export

### Components
- `components/Navbar.tsx` — fixed top nav (Home, About, Skills, Projects, Approach, Experience, Contact) with active link highlighting, mobile hamburger (`"use client"`)
- `components/Footer.tsx` — social links
- `components/ScrollReveal.tsx` — reusable `whileInView` wrapper (`data-scroll-reveal`, forced visible in print); skips animation when `prefers-reduced-motion` is set
- `components/hero/HeroSection.tsx` — full-viewport hero with Framer Motion fade-up variants (`"use client"`)
- `components/hero/NodeGraph.tsx` — animated canvas node/connection graph (`"use client"`); hero, FloatingLogos (hidden below `xl`, D33) and NodeGraph honour reduced motion
- `components/SiteChrome.tsx` — Navbar + skip link + `#content` wrapper + Footer, none of them on `/card*` (`"use client"`)
- `components/card/ConferenceNote.tsx` — `/card`'s optional line above Selected work from `profile.conferenceNote` (`''` renders nothing, D39)
- `components/focusRing.ts` — the shared `focus-visible` accent outline class string (card, approach, evidence)
- `components/LoopingVideo.tsx` — muted looping clip with a pause/play button, paused under reduced motion (`"use client"`)
- `components/MethodStrip.tsx` — the five `methodSteps` as an `ol` (D23; lines `sr-only` below md, D31); hero (labels only below md) and `/approach` (`showLines`: lines at every width)
- `components/projects/ProjectCard.tsx` — project card (Server Component); `headingAs="h3"` under a section heading (home)
- `components/projects/ProjectsGrid.tsx` — client filter + grid (sorted by `order`) using `ProjectCard` + `ScrollReveal` (`"use client"`)
- `components/projects/ProjectDetail.tsx` — the `/projects/[slug]` body (Server Component); `page.tsx` only resolves
  the slug. Without `project.caseStudy` it renders the classic Problem/Approach/Challenges/Outcome page (pinned by
  `src/__tests__/app/project-page-unchanged.test.tsx`); with it, the case-study order (D16, D17)
- `components/projects/case-study/` — `CaseStudySection` (shared section + h2) and `MethodSteps`, `DecisionLog`,
  `IterationTimeline`, `LessonList`, `ProjectLinks` (Server Components, `null` when empty). Data authors: the props
  and copy rules are in `docs/plans/2026-10-18-M3-case-study-template.md` § Components

### Pages
All pages are Server Components (no `"use client"`) except where noted. They import from `lib/data` and render `ScrollReveal` + page-specific markup.

### Print
`globals.css` ends with one `@media print` block (D40): black on white, `nav`/`footer` hidden, `pre` wrapped. Hide
anything else decorative with Tailwind's `print:hidden`; `src/__tests__/lib/print-styles.test.ts` pins the block.

### Content guard
`src/__tests__/lib/content-guard.test.ts` walks `src/` and `public/` and fails on tailnet hostnames, CGNAT IPs, ntfy URLs, US phone numbers, private repo links, TODO/placeholder text and secret-looking assignments. Fix the content, never the patterns.

### Testing
- `src/__tests__/` — Jest + React Testing Library
- `src/__mocks__/framer-motion.tsx` — global mock wired via `moduleNameMapper` in `jest.config.ts`; strips motion props, exports `useReducedMotion` (returns `false`)
- Canvas mocked inline in `HeroSection.test.tsx` with `HTMLCanvasElement.prototype.getContext = jest.fn(() => null)`
- `next/navigation` mocked in `Navbar.test.tsx` with `jest.mock('next/navigation', () => ({ usePathname: () => '/' }))`

## Design System

CSS custom properties defined in `src/app/globals.css` via `@theme inline`:
- `--color-background`: `#0a0a0f` (near-black)
- `--color-surface` / `--color-surface-alt`: card backgrounds
- `--color-accent`: `#00d4ff` (electric cyan)
- `--color-muted`: `#8888a0`
- Use `var(--color-accent)` etc. in Tailwind classes: `text-[var(--color-accent)]`

## Skills Available

- `vercel-react-best-practices` — when writing React/Next.js components
- `vercel-composition-patterns` — when designing component APIs
- `web-design-guidelines` — when reviewing UI for accessibility
- `playwright-cli` — for all browser-based E2E testing

## Code rules
- Next.js App Router + TypeScript + Tailwind 4 + framer-motion. No new runtime dependencies without a recorded
  decision (the spec's ground rule 9); `qrcode` is pre-approved as a devDependency. `livekit-client`,
  `@livekit/components-react` and `livekit-server-sdk` are approved at exact pins (D41); keep `LIVEKIT_*` server-only.
- Content lives in `src/lib/data/*.ts` (projects, experience, skills, profile, approach, competencies); components
  render it. Reuse `ScrollReveal`, `ProjectCard`, `MetricStrip`, `MediaGallery`, `CodeBlock` and the diagrams in
  `src/components/projects/diagrams/` rather than re-implementing them.
- Server Components by default; `"use client"` only where interaction needs it.
- Copy follows `docs/notes/brand.md` (voice, never-publish list, metrics bank). Every number traces to `docs/notes/`.

## How to verify
- Suite: `.harness/check.sh` = `eslint` + `jest --silent` + `next build` (into `.next-check`, so it never clobbers
  the dev server). About 1 min. A subset: `npx jest src/__tests__/pages/about.test.tsx`.
- Harness init: `.harness/init.sh` installs deps and starts `next dev` on `$HARNESS_PORT`.
- Smoke: `node .harness/smoke.mjs` loads every route (static routes, `.harness/smoke-routes.txt`, every
  `/projects/<slug>`) at 1280 and 390 px; fails on HTTP ≥ 400, page/console errors, or horizontal scroll at 390.
  Screenshots go to `$HARNESS_SCRATCH`. A page added by a milestone goes into `.harness/smoke-routes.txt`.
- `case-study-agent-harness.test.ts` compares the page's code excerpt with `lib/driver.sh` in the agent-harness checkout
  (`AGENT_HARNESS_DIR`, default `/home/mh550/projects/agent-harness`; skipped when absent): editing those lines there
  turns this suite red until the excerpt is re-copied.
- Print: `node .harness/print-check.mjs [base] [path] [out.png]` emulates print media (white body, no visible
  nav/footer/canvas, `pre` wrapped, links underlined) and saves a full-page capture; exit 1 on a failure.
- Look at the 390 px screenshots of every page you changed ("What Michael will see" in the spec).

## Decisions and plans
- Spec: `docs/specs/2026-10-18-portfolio-v2.md` (settled: D1–D14; new defaults appended there as `D<n> *default*`).
- Context: `docs/notes/brand.md`, `docs/notes/evidence-*.md`; older groundwork in `docs/notes/SITE_UPDATE_PLAN.md`.
- Plans: `docs/plans/<date>-<milestone>-<topic>.md`.

## Off-limits
- Never deploy: no `vercel` CLI, never push or merge to `main` (pushing `main` deploys production). Michael merges.
- Other repos (`~/projects/agent-harness`, `hit_list`, `dj-crate-streaming`) are read-only sources, only at the
  paths the evidence briefs name. Never read `.env` files, `/srv`, `/etc/restic`, or `agent-harness/journal/raw/`.
- Never weaken `src/__tests__/lib/content-guard.test.ts` (once M0 adds it) to make content pass.

