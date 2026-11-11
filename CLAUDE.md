# CLAUDE.md

Michael Herron's portfolio site (`mherron.dev`): Next.js App Router, TypeScript, Tailwind 4, framer-motion. Vercel
deploys `main` to production. It also hosts the voice concierge's web half (`/talk` and the panel on every page).

**Spec:** `docs/specs/2026-10-21-portfolio-v3.md` is current; read it before implementing a new section or feature.
Hand-off: `docs/review-guide.md`, `docs/asset-checklist.md`.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build (type check, prerenders every page; not a static export)
npm run lint
npm test             # Jest; one file: npm test -- src/__tests__/components/Navbar.test.tsx
npm run logos        # writes src/components/logos/paths.ts (D78): never by hand; hand-drawn marks go in logos/extra.ts
```

E2E: the `playwright-cli` skill, always with `-s=portfolio --config=.playwright/cli.config.json` so sessions don't
collide, against a running `npm run dev`. In harness runs it isn't installed: use `node .harness/smoke.mjs`.

## Architecture

- **Content** lives in `src/lib/data/*.ts`; components render it, nothing is hardcoded. `profile.ts` is the single source
  for the vCard, `/card`, metadata and sitemap.
- **Server Components by default**; `"use client"` only where interaction needs it.
- **`SiteChrome`** (client) wraps every page except `/card*` (D15) and mounts `ConciergeProvider`, which owns the one
  LiveKit call above the pages, so it survives navigation (D85).
- **Client bundle boundaries** (tests enforce them): nothing `SiteChrome` imports may reach `projects.ts` or the
  `@/lib/data` barrel: import `@/lib/data/<file>` there, and pass data down from `layout.tsx` as props
  (`layout-concierge.test.tsx` follows the imports). `SkillGraph` imports only types from `@/lib/data`; its data
  comes from `app/skills/page.tsx`. No client file imports `src/lib/concierge/env.ts`.
- **`src/lib/concierge/`** has no React and no livekit-client (contract parsers that never throw, memory cache,
  limits); **`src/lib/graph/`** has no React and no DOM (the `/skills` layout and view math, no d3-force, D99).
- Colours are tokens in `globals.css` (`@theme inline`), used as `text-[var(--color-accent)]`.

## Testing

- Jest + React Testing Library in `src/__tests__/`. `framer-motion` is mocked globally (`src/__mocks__/`, via
  `moduleNameMapper`); so are `livekit-client` (`MockRoom`) and `@livekit/components-react`. No test opens a
  connection.
- Anything that renders `ConciergeProvider` calls `useRouter()`, so the test mocks `next/navigation` with
  `src/__tests__/helpers/navigation.ts`. `/talk` renders through `renderTalk()` (`src/__tests__/helpers/concierge.tsx`).
- Under fake timers, click with `fireEvent` and flush inside one `act` (see `TalkSession.test.tsx`).

## Code rules

- No new runtime dependency without a recorded decision. Approved at exact pins: `qrcode` (dev), `simple-icons`
  16.9.0 (dev, read only by `scripts/logos.mjs`, D78), `livekit-client`, `@livekit/components-react`,
  `livekit-server-sdk` (D41), `server-only` 0.0.1 (D67: `env.ts` and `rooms.ts` import it, so a Client Component
  that pulls either in fails `next build`). `LIVEKIT_*` stays server-only.
- Reuse `ScrollReveal`, `ProjectCard`, `MetricStrip`, `MediaGallery`, `CodeBlock` and the diagrams in
  `src/components/projects/diagrams/` rather than re-implementing them.
- Copy follows `docs/notes/brand.md` (voice, never-publish list, metrics bank). Every number traces to `docs/notes/`; a
  voice-concierge sentence with a digit is verbatim in `evidence-voice-concierge.md` § Sentences with digits.
- Skills: `vercel-react-best-practices` and `vercel-composition-patterns` for React work, `web-design-guidelines`
  for UI review, `playwright-cli` for browser checks.

## How to verify

- Suite: `.harness/check.sh` = eslint + `jest --silent` + `next build` into `.next-check` (never clobbers the dev
  server). About a minute. A subset: `npx jest src/__tests__/pages/about.test.tsx`.
- `.harness/init.sh` installs deps and starts `next dev` on `$HARNESS_PORT` in its own process group
  (`.harness/server.sh`); a rerun stops the previous one, so rerun it after any install before trusting the dev server.
- Smoke: `node .harness/smoke.mjs` loads every route at 1280 and 390 px and fails on HTTP ≥ 400, page or console
  errors, or horizontal scroll at 390. A new page goes into `.harness/smoke-routes.txt`.
- Page checks, each documented in its header: `captures.mjs` (full-page PNGs, shrink one over 400 KB with PIL
  `quantize`), `contact-check.mjs`, `skills-check.mjs`, `print-check.mjs`, `logos-check.mjs`, and
  `concierge-check.mjs` / `talk-busy-check.mjs` (these two need `next dev` restarted with dummy `LIVEKIT_*` env, as
  their headers say; rerun `.harness/init.sh` after).
- `case-study-agent-harness.test.ts` compares the page's excerpt with `lib/driver.sh` in the agent-harness checkout
  (`AGENT_HARNESS_DIR`, skipped when absent): an edit there turns this suite red until the excerpt is re-copied.
- Look at the 390 px screenshots of every page you changed ("What Michael will see" in the spec).

## Decisions and plans

- Decisions: `docs/decisions.md`, the current rule set (D1–D104; the removed booth's are `booth-D41`–`booth-D58`).
  A new default is the next `D<n> *default*` there, naming what it supersedes.
- Context: `docs/notes/brand.md`, `docs/notes/evidence-*.md`. Plans: `docs/plans/<date>-<milestone>-<topic>.md`.
- Routes that aren't what they seem are decisions: `/approach` (D79), `/evidence` and `/card*` (D6, D7, D36), `/talk`
  (D46, D49, D89), `/api/concierge/token` (D63), `/projects/[slug]` (D16, D17).

## Where things go

- What happened, what was tried, what failed → your run entry (`entry.json`), never this file.
- A decision → `docs/decisions.md`. Overturned → rewrite that entry in place plus one `(Updated in place <date>: …)`
  line; never a new entry beside a dead one.
- A fact a fresh session would otherwise rediscover → one line in `## Gotchas` below, edited in place.
- Tonight's scope → the run brief, never this file. How to work here → Michael's: propose it in `proposed_changes`.
- Anything the code, git or the suite can tell (test counts, file lists, prop names, constants) → nowhere.

## Gotchas

- `check.sh` never runs tsc: Jest strips types and `next build` skips tests. Run `npx tsc --noEmit` for type errors in tests. (v3 2026-10-21)
- Full-page shots show sections below the fold empty: ScrollReveal fires only in view. Scroll first (`captures.mjs` does). (v3 2026-10-21)
- Dev-server shots show Next's "N" badge: hide `nextjs-portal`. The fixed Navbar and pill over content are capture artifacts. (v3 2026-10-21)
- Chromium logs "Failed to load resource … 429/503" for a non-OK token POST, even via `page.route`: whitelist it in checks. (v3 2026-10-21)
- A new project, route or link breaks pinned counts in `data`, `sitemap-robots`, `card` and `Navbar` tests. (v3 2026-10-21)
- `next dev` with stale CSS or 500 everywhere while `next build` passes: Turbopack's cache. `rm -rf .next/dev`, rerun init.sh. (v3 2026-10-21)
- The content guard scans tests: build fake secrets as `'x'.repeat(32)`; a phone-shaped digit run (even an SVG path) fails. (v3 2026-10-21)
- jsdom lacks TextEncoder, matchMedia, setPointerCapture, PointerEvent; rects are zero-size. Guard in code, stub in tests. (v3 2026-10-21)
- Tests of route handlers, `Response`/`Headers` or the LiveKit server SDK need `/** @jest-environment node */` (default jsdom). (vc4 2026-10-20)
- Tailwind 4's `transition-colors` also fades `outline-color`: read a focus outline about 300 ms after Tab, not mid-fade. (vc4 2026-10-20)
- `jest.spyOn` on a module's exports fails under SWC (they are getters): mock with a `jest.mock` factory instead. (vc4 2026-10-20)

## Off-limits

- Never deploy: no `vercel` CLI, never push or merge to `main` (pushing `main` deploys production). Michael merges.
- Other repos are sources only at the paths the evidence briefs name; never `agent-harness/journal/raw/`.
- Never weaken `src/__tests__/lib/content-guard.test.ts` to make content pass.
