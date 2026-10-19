# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Michael Herron's personal portfolio site — a bold, expressive multi-page site built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion. Deployed on Vercel.

**Spec:** `portfolio_site_spec.md` — read this before implementing any new section or feature.
**Plan:** `IMPLEMENTATION_PLAN.md` — milestone-based implementation plan.

## Routes

| Route | Section |
|---|---|
| `/` | Hero / Landing |
| `/about` | About |
| `/skills` | Skills & Tech Stack |
| `/projects` | Projects index (filterable) |
| `/projects/[slug]` | Individual project deep-dive (static, from `lib/data/projects.ts`) |
| `/experience` | Work history & education |
| `/contact` | Contact |
| `/card` | Conference contact card (no Navbar/Footer, via `SiteChrome`) |
| `/card/qr` | Black-on-white QR to `/card?src=qr` (`npm run qr` regenerates `public/card/qr.*`) |
| `/michael-herron.vcf` | vCard 3.0 from `buildVCard(profile)` (`src/lib/vcard.ts`), static route handler |

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (TypeScript check, prerenders every page; not a static export)
npm run lint         # ESLint
npm test             # Jest unit/integration tests (376 tests, 40 suites after M6-03)
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
- `skills.ts` — `SkillCategory[]`; one category has `featured: true` (Integration & Automation)
- `experience.ts` — `Role[]` + `Education` object
- `index.ts` — barrel export

### Components
- `components/Navbar.tsx` — fixed top nav with active link highlighting, mobile hamburger (`"use client"`)
- `components/Footer.tsx` — social links
- `components/ScrollReveal.tsx` — reusable `whileInView` wrapper; skips animation when `prefers-reduced-motion` is set
- `components/hero/HeroSection.tsx` — full-viewport hero with Framer Motion fade-up variants (`"use client"`)
- `components/hero/NodeGraph.tsx` — animated canvas node/connection graph (`"use client"`)
- `components/projects/ProjectCard.tsx` — project card (Server Component)
- `components/projects/ProjectsGrid.tsx` — client filter + grid using `ProjectCard` + `ScrollReveal` (`"use client"`)
- `components/projects/ProjectDetail.tsx` — the `/projects/[slug]` body (Server Component); `page.tsx` only resolves
  the slug. Without `project.caseStudy` it renders the classic Problem/Approach/Challenges/Outcome page (pinned by
  `src/__tests__/app/project-page-unchanged.test.tsx`); with it, the case-study order (D16, D17)
- `components/projects/case-study/` — `CaseStudySection` (shared section + h2) and `MethodSteps`, `DecisionLog`,
  `IterationTimeline`, `LessonList`, `ProjectLinks` (Server Components, `null` when empty). Data authors: the props
  and copy rules are in `docs/plans/2026-10-18-M3-case-study-template.md` § Components

### Pages
All pages are Server Components (no `"use client"`) except where noted. They import from `lib/data` and render `ScrollReveal` + page-specific markup.

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
  decision (the spec's ground rule 9); `qrcode` is pre-approved as a devDependency.
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

