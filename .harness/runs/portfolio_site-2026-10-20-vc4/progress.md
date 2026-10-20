# Progress log — run portfolio_site-2026-10-20-vc4 (branch `harness/portfolio_site-2026-10-20-vc4`)

What this file is: the shared memory of this harness run. Every session reads it at startup and adds a short
entry **at the top** (newest first): feature id, what landed, what the next session must know. The feature list is
`feature_list.json` in this directory: array order is priority, `after` lists are the real dependencies, a session
may flip only its own feature's `passes`. Michael steers through `INBOX.md` on this branch (first line
`status: run|pause|stop`; answers under `## Answers`). Plans go in `docs/plans/2026-10-20-<milestone>-<topic>.md`;
new defaults go in a new `## 7. Decisions` section of `docs/specs/2026-10-19-voice-concierge-page.md`, numbered
from **D59** (above every D in the v2 spec, D1–D49, and the booth spec, D41–D58, which already collide; never
renumber), each naming the decision it supersedes.

---

### 2026-10-20 13:27 · VC4-01 · passes

- **Plan** `docs/plans/2026-10-20-VC4-order-widget-nav.md`: § Order (before/after table; top 3 becomes agent-harness,
  voice-concierge, ghl-jobtread-integration on `/` and `/card`), § Navbar (Talk fifth of eight), § Voice widget (full
  TSX; `talkWidget` data in `concierge.ts`; opacity pulse ×2 under `motion-safe:` only, not `animate-ping`, which
  would overflow at 390), § Intro wording (`IntroParagraph = string | {before, link, after}`; `builtWith` stays a
  string + a third Links entry, kind `doc`), § Tests (every breaking test by file and name), empty Review/See tables.
- **Decisions**: voice-concierge spec gains `## 7. Decisions` D59–D62; v2 spec D44/D49 end "Superseded by D60 (VC4).",
  D47 "Superseded by D59 (VC4)."
- **Footer default** (D61): `pt-8 pb-24 xl:pb-8`, not `pb-24 sm:pb-8`: at 390 the links are centred and never meet
  the widget; the overlap is from `sm` to below `xl`, where the links row sits at the right edge.
- **Next sessions**: init note had paint-estimator 8 / ringcentral 7; the file says paint 7 / ringcentral 8 (the plan
  follows the file). hit-list and home-media-server tests pin `order` 4 and 3 too (now 7 and 5), listed in § Tests.
- Verified: jest 992 tests / 75 suites (no code change), `.harness/check.sh` → `check: lint ok · jest ok · build ok`,
  smoke exit 0 (42 PASS).
- Question for Michael: should `/evidence` (noindex) also lose the widget? Default: it keeps it.

### 2026-10-20 · initializer

**Scope.** The spec `docs/specs/2026-10-20-vc4-order-widget-limits.md` (Michael's answers of 10-20) and his brief:
build VC4 then VC5, sensible defaults recorded in the spec, no questions, build-only, don't touch `public/b/`.
The base has VC1–VC3 and B1–B2 (PRs #14–#18, all merged). Suite at start: 992 tests, 75 suites, green; dev server
on `$HARNESS_PORT` (7834 at init).

**Features: 13.** VC4 (content and navigation): 6 — plan, order + Navbar, widget, intro wording, check, review.
VC5 (mic timing, limits, server-only): 7 — plan, mic, pure rules + server-only, route wiring, /talk busy lines +
deep-dive protection line, check, review. VC5-01 has `after: ["VC4"]` (the spec: one PR per milestone, in order).
Earlier VC features took 5–20 minutes each; these are sized the same.

**Where things live (read before building).**
- Order: `order` on each entry of `src/lib/data/projects.ts` (today 1 agent-harness, 2 linear-ai-workflow,
  3 home-media-server, 4 hit-list, 5 voice-concierge, 6 ghl, 7 ringcentral, 8 paint-estimator, 9 mirrored,
  10 cherished). `getTopProjects(3)` = first three **featured** by order → feeds `/` Recent work and `/card`
  Selected work (both tests derive from it). Pinned explicitly in `src/__tests__/lib/data.test.ts` (the order map,
  getTopProjects lists) and `case-study-voice-concierge.test.ts` (`order` 5). The `.snap` file is per-slug and has
  no order. `docs/review-guide.md` VC3 bullets say "order 5 … top 3 unchanged": update them.
- Navbar: `src/components/Navbar.tsx` `links` array (desktop `ul` and mobile menu both map it);
  `Navbar.test.tsx` pins seven names twice (lines 22 and 51) and a current-page test. v2 spec D44/D49 and CLAUDE.md
  say "off the Navbar": supersede, don't delete.
- Site chrome: `src/components/SiteChrome.tsx` (`"use client"`, reads `usePathname`) already excludes `/card*`; the
  widget goes there, with `/talk` excluded too. `SiteChrome.test.tsx` mocks `next/navigation` per test.
  `focusRing` is `src/components/focusRing.ts`. Tailwind 4: use `motion-safe:` for the pulse, `print:hidden`,
  `bottom-[max(1rem,env(safe-area-inset-bottom))]`. Footer (`src/components/Footer.tsx`) is a centred column at
  390: name, then GitHub · LinkedIn · Email. Navbar is `z-50`; keep the widget below it (`z-40`).
- Intro copy: `talkPage.intro` is a `string[]` rendered as `<p>` in `src/app/talk/page.tsx`; `talk.test.tsx` checks
  each sentence by text. The link to `/projects/agent-harness` needs a data shape change (plan decides). The
  deep-dive's `builtWith` (`projects.ts` ~line 873) is a plain string rendered by `ProjectDetail.tsx` line ~190;
  `case-study-voice-concierge.test.ts` line 76 expects `/Claude Code agents/` in it. **Every sentence with a digit in
  the voice-concierge entry must be verbatim in `docs/notes/evidence-voice-concierge.md` § Sentences with digits**
  (test at line 113): the protection sentence (5 sessions, 10 minutes, $45, 2 rooms) goes in the brief first.
- Token route: `src/app/api/concierge/token/route.ts` (env → 400 → sign). `src/lib/concierge/env.ts` is the
  shared env check (D46). Tests: `concierge-token-route.test.ts` (node env, **mocks nothing**, D42) and
  `concierge-token-route-sdk.test.ts` (spies on the real SDK). Both build `Request`s with no Origin header: every
  case must gain `Origin: https://michael-herron.vercel.app` once the allowlist lands.
- LiveKit SDK: `RoomServiceClient(host, apiKey, secret).listRooms(names?)` (`livekit-server-sdk` 2.19.1); its Twirp
  client rewrites `wss://` → `https://` itself, so `env.url` is the host. It uses global `fetch` (Node 24 here,
  Vercel fine). Mocking: next/jest's SWC output defines exports as getters, so `jest.spyOn(module, 'fn')` can fail;
  use `jest.mock('@/lib/concierge/rooms')` in a new test file instead.
- `server-only`: not installed yet (`npm i -E server-only@0.0.1`). next/jest already maps `^server-only$` to an
  empty mock (`node_modules/next/dist/build/jest/jest.js` line 173), so Jest needs no config change; `next build`
  needs the package. `/talk`'s page imports `env.ts` and is a Server Component, which is fine.
- TalkSession: `setMic(session, true)` is called right after `room.connect()` (line ~`onPlayback(); unlockAudio;
  setMic`). `agentArrived` is the function to move it into. Mic toggle renders in `waiting` and `live`.
  `fetchCredentials` returns null on any non-OK: the 429 reasons need a richer return. Reducer: `sessionReducer.ts`,
  phases `idle|connecting|waiting|live|ended|offline`. Tests: `TalkSession.test.tsx` (fetch mock, `reply(status,
  body)` helper, fake timers flushed in one `act`), `TalkSession-live.test.tsx` (mic, `addAgent(room)`),
  `src/__mocks__/livekit-client.ts` (`MockRoom.setup`, `localParticipant.setMicrophoneEnabled` is a jest.fn).
- Vercel preview host, read from PR #16's Vercel comment:
  `portfolio-site-git-harness-merg-e67481-mh550s-projects-e64e7e0b.vercel.app`. Production origin is
  `profile.siteUrl` = `https://michael-herron.vercel.app`.
- The agent repo checkout `~/projects/voice-concierge` holds only docs today (no `concierge/*.py`), so "the agent
  doesn't parse room names" cannot be checked locally; the plan records it for Michael (public repo
  `github.com/mh550/voice-concierge`; a read-only shallow clone into a temp dir is allowed if a session wants to).
- Screenshots: Playwright lives in `$HARNESS_PW/node_modules/playwright` (see `.harness/smoke.mjs` line 9); captures
  go to `docs/screenshots/v2/VC4-*.png` / `VC5-*.png`, under 400 KB. Print check: `node .harness/print-check.mjs`.
- Counts in CLAUDE.md (992 tests, 75 suites) must be updated by the review features.

**Gotchas.**
- Never create `.env*`, never set `LIVEKIT_*` in the dev server; every check sees the offline state. The /talk 429
  check therefore intercepts the route with Playwright's `page.route`.
- Origin before env (D63 default) means `curl -X POST` without Origin gets 403 even on the harness server, which
  makes the shell check verifiable here.
- Content guard (`content-guard.test.ts`) fails on TODO/placeholder words and US phone numbers: write the busy
  copy exactly as the spec gives it.
- `project-page-unchanged.test.tsx` snapshots the classic pages: don't touch their data.

**Defaults taken (Michael can overrule in INBOX `## Answers`; each is one-line reversible).**
1. Decisions for VC4/VC5 go in a new `## 7. Decisions` of the voice-concierge spec, numbered from D59.
2. Origin is checked before the env check (403 before 503), so nothing about the env leaks to a foreign caller.
3. No `x-forwarded-for` → bucket `unknown` (all local tabs share one room slot; matches "another tab" locally).
4. Preview regex `^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$`, https only.
5. The mic toggle shows only once the agent is live (it was visible while waiting).
6. The widget is excluded on `/talk` and `/card*` only; `/evidence` keeps it.
7. The "how it's protected" sentence is appended to the deep-dive's Build method line (not a new section).

**Questions for Michael (none block a feature).**
- Does the agent read the room name anywhere (`concierge/*.py`)? The route now names rooms
  `concierge-<addr10>-<random>`. Default assumes no.
- Is `CONCIERGE_MAX_ROOMS` = 2 right for the conference week, and should it be set in Vercel at all (unset = 2)?
- Should `/evidence` (noindex) also lose the widget? Default: it keeps it.
