# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Michael Herron's personal portfolio site — a bold, expressive multi-page site built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion. Deployed on Vercel.

**Spec:** `docs/specs/2026-10-21-portfolio-v3.md` is the current spec (v3: agentic-systems positioning, the loop, the
concierge in the site); read it before implementing any new section or feature. `docs/specs/2026-10-18-portfolio-v2.md`
stays the record of decisions: v3 defaults are appended to its `## v3 decisions` section (from D75).
**Plans:** `docs/plans/` — one file per milestone (`<date>-<milestone>-<topic>.md`). Hand-off: `docs/review-guide.md`, `docs/asset-checklist.md`.

## Routes

| Route | Section |
|---|---|
| `/` | Hero: eyebrow `profile.positioning` ("Agentic Systems Engineer", D76), tagline, subline, the loop strip (`MethodStrip`, `loopSteps` Spec → Learn, D77), twelve FloatingLogos at `xl` (D78); then Recent work (`getTopProjects(3)`) |
| `/about` | About: `aboutIntro` (the v3 subline + the five loop labels), the story, How I work (`#how-i-work`: `MethodStrip showLines` + one `loopStepExample` link per step, D80), Philosophy |
| `/skills` | Skills & Tech Stack |
| `/projects` | Projects index (filterable) |
| `/projects/[slug]` | Individual project deep-dive (static, from `lib/data/projects.ts`; `order` per D59: agent-harness, voice-concierge, ghl-jobtread-integration first) |
| `/projects/voice-concierge` | The concierge deep-dive: case study, no metrics until measured (`docs/notes/voice-concierge-todo.md`), `architectureDiagram: 'voice-concierge'` (`diagrams/index.tsx`); linked from `/card` and `/talk` |
| `/projects/[slug]/opengraph-image` | 1200×630 PNG via `next/og`: title + first metric (D38); bundled font only, so →/↔ are SVG arrows |
| `/experience` | roles with linked bullets, resume projects, Earlier, education: resume v4 (v3 spec § 8) through `BulletWithLinks`; a project's name links its deep-dive, its repo line GitHub (new-tab links carry an sr-only "(opens in new tab)"); Earlier is one line per role, no bullets (D82) |
| `/contact` | Contact |
| `/approach` | permanent redirect to /about#how-i-work (D79): 308 from `next.config.ts` `redirects()`, pinned by `src/__tests__/app/approach-redirect.test.ts`; no page, off the Navbar, sitemap and smoke routes |
| `/evidence` | Noindex, off the Navbar: six `competencies` × 2–4 linked items via `resolvedItems` (`competencies.ts`, D7; rubric stub `docs/notes/maxx-level-4.md`) |
| `/card` | Conference contact card (no Navbar/Footer, via `SiteChrome`) |
| `/card/qr` | Black-on-white QR to `/card?src=qr` (`npm run qr` regenerates `public/card/qr.*`) |
| `/michael-herron.vcf` | vCard 3.0 from `buildVCard(profile)` (`src/lib/vcard.ts`), static route handler |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts` (static routes + every project, from `profile.siteUrl`) and `robots.ts`; both leave out `/evidence` and `/card/qr` |
| `/talk` | Voice concierge (D44: chrome, sitemap; on the Navbar, D60; the VoiceWidget on every other chrome page links here, D61, and is not shown on `/talk`): server header + privacy note around `TalkSession`; offline (no env: Connect skips the route, D46; a 503 or no agent in 10 s) is the state every check sees (plan `docs/plans/2026-10-20-VC2-talk-page.md`) |
| `/api/concierge/token` | POST `{visitor_id}` (UUID v4), checked in order: 403 `{error:'forbidden'}` unless the Origin is the site (`profile.siteUrl` or `https://mherron.dev`, its custom domain), this deployment's own Vercel host (`VERCEL_URL`/`VERCEL_BRANCH_URL`, D74) or (dev only) localhost (`origin.ts`); 503 `{offline:true}` without the three `LIVEKIT_*` env vars; 400 on a bad body; 503 if `listRooms` fails (`rooms.ts`); 429 `{error:'busy', reason:'visitor'\|'site'}` when this address (HMAC bucket of `x-forwarded-for`) has a live room or `CONCIERGE_MAX_ROOMS` (default 2) are live (`limits.ts`); else a 10-minute LiveKit token for room `concierge-<addr10>-<12 hex>` (D73) that dispatches agent `concierge` (`route.ts`, plans `docs/plans/2026-10-20-VC1-token-route.md`, `docs/plans/2026-10-20-VC5-mic-limits-server-only.md`) |

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (TypeScript check, prerenders every page; not a static export)
npm run lint         # ESLint
npm test             # Jest unit/integration tests (1252 tests, 87 suites after P3-02)
npm run test:watch   # watch mode
npm run logos        # regenerate src/components/logos/paths.ts from simple-icons (scripts/logos.mjs, D78)
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
- `experience.ts` — resume v4 line for line: `Bullet` (a string, or `{ text, links }` spans; `bulletText`), `roles` (MAXX, Builder Clarity), `resumeProjects` (two bullets each, D84), `earlierRoles` (D82) and `education`
- `profile.ts` — `profile`: name, positioning, contact and `siteUrl`; the single source for the vCard, `/card`, metadata and sitemap
- `approach.ts` — `methodSteps` (Diagnose → Simplify, the case studies' spine) next to `loopSteps` (Spec → Learn, the
  hero and /about strip, D77), and the six `principles` (`resolvedExamples`, `loopStepExample` for /about How I work); `competencies.ts` — the six `/evidence` competencies
- `index.ts` — barrel export
- `concierge.ts` — `/talk` copy (`talkPage`, `privacyNote`, `latencyLabels`) and the widget's `talkWidget`; `talkPage.intro` is
  `IntroParagraph[]` (a string, or `{ before, link, after }`: "my agent harness" → `/projects/agent-harness`, D62), read through `introText`

### Components
- `components/Navbar.tsx` — fixed top nav (seven links: Home, About, Skills, Projects, Talk, Experience, Contact; Talk since VC4, D60; Approach gone since D79) with active link highlighting, mobile hamburger (menu scrolls under `100dvh`) (`"use client"`)
- `components/Footer.tsx` — social links; `pb-24 xl:pb-8` so the links row clears the VoiceWidget (D61)
- `components/ScrollReveal.tsx` — reusable `whileInView` wrapper (`data-scroll-reveal`, forced visible in print); skips animation when `prefers-reduced-motion` is set
- `components/hero/HeroSection.tsx` — full-viewport hero with Framer Motion fade-up variants (`"use client"`)
- `components/hero/NodeGraph.tsx` — animated canvas node/connection graph (`"use client"`); hero, FloatingLogos (hidden below `xl`, D33) and NodeGraph honour reduced motion
- `components/hero/FloatingLogos.tsx` — the hero's twelve stack marks in four columns outside the text column, read from
  `components/logos/paths.ts` (generated by `npm run logos`, never edited by hand, D78); `.harness/logos-check.mjs`
  checks they clear the hero text at 1280. `components/logos/Logo.tsx` renders one mark (`<title>`, or `decorative`); FloatingLogos draws each of its twelve with it
- `components/SiteChrome.tsx` — Navbar + skip link + `#content` wrapper + Footer + VoiceWidget (not on `/talk`, `talkWidget.href`), none of them on `/card*` (`"use client"`)
- `components/VoiceWidget.tsx` — the floating 56 px link to `/talk` (`talkWidget` in `concierge.ts`, D61): `fixed right-4`, safe-area bottom, `z-40`, `print:hidden`, a ring that pulses twice only under `motion-safe:`; shown on every chrome page (`/evidence` too) but not on `/talk` or `/card*`
- `components/card/ConferenceNote.tsx` — `/card`'s optional line above Selected work from `profile.conferenceNote` (`''` renders nothing, D39)
- `components/focusRing.ts` — the shared `focus-visible` accent outline class string (card, about, evidence); `components/textLink.ts` — the underlined in-text link look built on it (`/evidence`, `/experience`, `BulletWithLinks`)
- `components/talk/` — `/talk` panels inside `TalkPanel` (bordered section + h2): `MemoryPanel`, `LatencyPanel`
  (Server-Component-safe, nulls render `–` via `format.ts`), `Transcript` (`role="log"`, aria-busy while a line is
  non-final) and `ForgetMeButton` (confirm step) (`"use client"`); fixtures in `src/__tests__/fixtures/concierge.ts`.
  `TalkSession` (`"use client"`) owns the one `Room` (made in the Connect handler, D45, after `import('livekit-client')`;
  also in state for `RoomAudio`, loaded with `next/dynamic`, so LiveKit is not in the first load), the one
  Connect/Leave button (it keeps focus), the mic toggle, `MessageBox` (lk.chat) and the Forget me RPC; `sessionReducer.ts` the
  phases (a 429 `busy` from the token route is its own phase with the reason's line and no retry, D66) (Jest mocks: see Testing)
- `lib/concierge/` — no React, no livekit-client: the §4 contract parsers (`contract.ts`, never throw; contract v2
  (v3 spec § 7, D95): `parseMemory` reads the optional v2 keys, left off a v1 body's result; `parseNavigate` for
  `concierge.navigate`, 1 KiB cap; `isAllowedHref(href, slugs)`, the usher's exact-match allowlist), the memory cache
  (`memoryCache.ts`: `saveMemory`/`loadMemory`/`clearMemory`, the raw body per visitor id, re-parsed on load, D91), latency stats (`latency.ts`), the visitor id (`visitorId.ts`; `readVisitorId` never writes) and the server-only env check (`env.ts`, D46), shared by the token route and `/talk`; for the route's limits (VC5) the Origin allowlist (`origin.ts`), the address bucket and room limits (`limits.ts`, pure) and the server-only room list (`rooms.ts`, `livekit-server-sdk`)
- `components/LoopingVideo.tsx` — muted looping clip with a pause/play button, paused under reduced motion (`"use client"`)
- `components/MethodStrip.tsx` — the five `loopSteps` (Spec → Learn, D77; `methodSteps` stays for the case studies) as an `ol` (D23; lines `sr-only` below md, D31); two users: the hero (labels only below md) and `/about`'s How I work (`showLines`: lines at every width; `examples`, one link per step)
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
- LiveKit: `moduleNameMapper` maps `^livekit-client$` → `src/__mocks__/livekit-client.ts` (`MockRoom.setup`, `pushText`,
  `addAgent`, `restart`) and `^@livekit/components-react$` → `src/__mocks__/livekit-components-react.tsx`; no test
  opens a connection. The token route's 200 and 429 cases are in `concierge-token-route-limits.test.ts`, which mocks
  `@/lib/concierge/rooms` with a factory (`mockResolvedValue([])` by default); `concierge-token-route.test.ts` mocks nothing (D42, D69).
  Under fake timers click with `fireEvent` and flush inside one `act` (see `TalkSession.test.tsx`)
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
  decision (the spec's ground rule 9); `qrcode` is pre-approved as a devDependency, and so is
  `simple-icons` at exactly 16.9.0 (D78), read only by `scripts/logos.mjs`: no `src` file imports it. `livekit-client`,
  `@livekit/components-react` and `livekit-server-sdk` are approved at exact pins (D41); keep `LIVEKIT_*` server-only.
  `server-only` is approved at `0.0.1` exact (D67): `env.ts` and `rooms.ts` import it, so a Client Component that
  pulls either in fails `next build` (next/jest maps it to an empty mock).
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
- Captures: `node .harness/captures.mjs <outDir> <prefix> <path>...` scrolls each page through (so ScrollReveal
  sections show), saves full-page PNGs at 1280 and 390 and prints eyebrow, strip rows, How I work links per page
  (P1's and P2's are in `docs/screenshots/v3/`; shrink one over 400 KB with PIL `quantize`).
- `case-study-agent-harness.test.ts` compares the page's code excerpt with `lib/driver.sh` in the agent-harness checkout
  (`AGENT_HARNESS_DIR`, default `/home/mh550/projects/agent-harness`; skipped when absent): editing those lines there
  turns this suite red until the excerpt is re-copied.
- Print: `node .harness/print-check.mjs [base] [path] [out.png]` emulates print media (white body, no visible
  nav/footer/canvas, `pre` wrapped, links underlined) and saves a full-page capture; exit 1 on a failure.
- Look at the 390 px screenshots of every page you changed ("What Michael will see" in the spec).

## Decisions and plans
- Spec: `docs/specs/2026-10-21-portfolio-v3.md` (current). Decisions: `docs/specs/2026-10-18-portfolio-v2.md` (settled:
  D1–D14; new defaults appended there as `D<n> *default*`, v3's in `## v3 decisions` from D75).
- Context: `docs/notes/brand.md`, `docs/notes/evidence-*.md`; older groundwork in `docs/notes/SITE_UPDATE_PLAN.md`.
- Plans: `docs/plans/<date>-<milestone>-<topic>.md`.

## Off-limits
- Never deploy: no `vercel` CLI, never push or merge to `main` (pushing `main` deploys production). Michael merges.
- Other repos (`~/projects/agent-harness`, `hit_list`, `dj-crate-streaming`) are read-only sources, only at the
  paths the evidence briefs name. Never read `.env` files, `/srv`, `/etc/restic`, or `agent-harness/journal/raw/`.
- Never weaken `src/__tests__/lib/content-guard.test.ts` (once M0 adds it) to make content pass.

