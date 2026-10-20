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

### 2026-10-20 15:40 · VC4-05 · passes

- **Screenshots** (new, 53–300 KB): `docs/screenshots/v2/VC4-home-390.png`, `VC4-home-1280.png`, `VC4-about-footer-390.png`,
  `VC4-card-390.png`, `VC4-menu-390.png`, `VC4-talk-390.png`; plan § What Michael will see has one row per screenshot
  plus the numbers. No layout bug found, so no code change; tests stay 1011, 76 suites.
- Measured (Playwright on 7834, script `$HARNESS_SCRATCH/vc405/run.mjs`): `/about` bottom at 390×844, widget 318,772
  56×56 (bottom 828), footer links y 726.5–745.5, 0 intersections; scrollWidth 390 on / /about /projects /talk /card,
  0 console/page errors; pulse `none` under reduce, `pulse` ×2 otherwise; Tab order Skip, MH, 8 links (Talk 5th), page
  links, footer, widget at tab 22, outline `rgb(0, 212, 255)` 2px offset 4; `/card` top 3 agent-harness,
  voice-concierge, ghl; print-check `/` exit 0, widget `display: none`. Navbar at 768: one row, 82 px spare.
- Gotcha for later checks: read `outline-color` ~200 ms after Tab; `transition-colors` (Tailwind 4) animates it from
  currentColor, so a same-frame read gives `rgb(10, 10, 15)` on the widget. Not a bug.
- Captures hide Next's dev-only "N" indicator (`nextjs-portal{display:none}`); production has none.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok` (1011 passed); smoke exit 0, 42 PASS.
- Next (VC4-06): the Opus review + simplify of the VC4 diff (`git diff f9e8a58..HEAD`).

### 2026-10-20 15:05 · VC4-04 · passes

- **Intro (D62)**: `concierge.ts` gains `IntroParagraph` + `introText`; `talkPage.intro[0]` is `{ before, link: { label:
  'my agent harness', href: '/projects/agent-harness' }, after }` ("A voice agent I designed on LiveKit and built with
  my agent harness: specs in, verified milestones out. It remembers you between visits."). `talk/page.tsx` renders it
  with `next/link` (accent, underline, `focusRing`). `grep -rn 'writing much of the code' src/` is empty.
- **Deep-dive**: `voice-concierge` `builtWith` is the plan's sentence ("My agent harness ran the build sessions…");
  `caseStudy.links[2]` = "The agent harness that built it" → `/projects/agent-harness`, kind `doc`.
- Docs: evidence brief § VC4 note (before/after table), D62 marked built, CLAUDE.md (intro shape, 1011 tests).
- Tests: talk +1 (link name/href/focusRing; paragraphs by `textContent`), concierge-data +1, case-study +1 (full
  `builtWith`), links test gains the third entry. 1008 → 1011, 76 suites; 5 failed before the code, 0 after.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0, 42 PASS; live HTML on 7834 shows
  the anchor inside the `<p>` and the deep-dive link; 390 px `/talk` screenshot checked. Opus review: no findings.
- Next (VC4-05): screenshots. Pre-existing, not mine: `npx tsc --noEmit` flags `booth-bundle.test.ts:92`
  (`MH_HARNESS_HOME` not on the env type); the build is unaffected (tests are outside it).

### 2026-10-20 14:25 · VC4-03 · passes

- **Widget (D61)**: new `src/components/VoiceWidget.tsx` (next/link to `/talk`, aria-label from `talkWidget` in
  `concierge.ts`, aria-hidden SVG mic, `fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 h-14 w-14`,
  `print:hidden`, `focusRing` + `focus-visible:outline-offset-4`, ring with `motion-safe:animate-pulse` ×2).
  `SiteChrome` renders it after the Footer unless `pathname === '/talk'` (`/card*` never reaches it). Footer
  `py-8` → `pt-8 pb-24 xl:pb-8`.
- Tests: new `VoiceWidget.test.tsx` (7), SiteChrome +6 (`/`, `/about`, `/projects/agent-harness` present and after
  the footer; `/talk`, `/card`, `/card/qr` absent), Footer +1, a11y chrome +1 (one nav, one contentinfo, no
  region/heading). 993 → 1008 tests, 75 → 76 suites; 5 failed before the code, 0 after.
- Review (Opus): the offset-2 focus outline sat on the ring's 2–4 px band (60% → 100% cyan only); fixed with
  `outline-offset-4` (Chromium computes 4px; capture shows a separate outer ring). Plan § Focus and D61 updated.
- Browser (Sonnet, 7834): 56×56 at 390/1280, right edge 374 at 390, scrollWidth 390; absent on /talk, /card,
  /card/qr; no overlap with `footer a` on /about bottom at 390/640/768/1024/1279/1280/1440; reduced motion
  `animation-name: none`, otherwise `pulse` ×2; last tab stop after "Email"; print `display: none`.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0, 42 PASS.
- Next (VC4-04): intro wording. CLAUDE.md lists VoiceWidget and the new count.

### 2026-10-20 13:50 · VC4-02 · passes

- **Order (D59)** in `projects.ts`: 1 agent-harness, 2 voice-concierge, 3 ghl, 4 ringcentral, 5 home-media-server,
  6 linear-ai-workflow, 7 hit-list, 8 paint-estimator, 9 mirrored, 10 cherished. Top 3 on `/` and `/card` is now
  agent-harness, voice-concierge, ghl-jobtread-integration (live `/card` HTML shows those three in that order).
- **Navbar (D60)**: `{ href: '/talk', label: 'Talk' }` fifth of eight; `/talk` marks only Talk (desktop + mobile).
- Tests: data.test (D59 map, both getTopProjects lists), case-study voice-concierge 2 / home-media-server 5 /
  hit-list 7, home + card assert link 2 is `/projects/voice-concierge`, Navbar eight links + new `/talk` test.
  992 → 993 tests, 75 suites; no `.snap` change. Saw 12 failures before the code change, 0 after.
- Docs: CLAUDE.md (`/talk` row "on the Navbar, D60", Navbar line, D59 note on `/projects/[slug]`, test count),
  review guide VC3 bullets (order 5 → D59, new top 3; question answered). v2 D44/D49 already end "Superseded by D60".
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0, 42 PASS.
- Next (VC4-03): the widget; the Navbar width at 768 with eight links is still VC4-05's to look at.

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
