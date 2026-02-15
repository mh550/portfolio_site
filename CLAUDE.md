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

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (TypeScript check + static export)
npm run lint         # ESLint
npm test             # Jest unit/integration tests (66 tests, 11 suites)
npm run test:watch   # watch mode
```

To run a single test file:
```bash
npm test -- src/__tests__/components/Navbar.test.tsx
```

## E2E Testing with playwright-cli

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
