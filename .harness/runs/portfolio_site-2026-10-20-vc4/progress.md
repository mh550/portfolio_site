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

### 2026-10-20 17:50 · VC5-07 · passes

- Opus review of `git diff e409a14^..HEAD`: no Critical. **Important, fixed (D72 *default*):** a forged-Origin shell could mint N tokens from one address before any room existed (each got a random room) → N agents. `roomNameFor` is now `concierge-<addr10>` (no random part), and `roomsVerdict` matches that exact name, so a burst of tokens shares one room and one agent dispatch (the token's roomConfig applies only to the join that creates the room). Tests first: 10 failed, then passed. Simplification: `mic`/`micBlocked` apply only when `live` (2 failed, then passed). `tsc --noEmit` went from 4 test-file errors to 0. Tests 1113 → 1114 (81 suites).
- Docs: plan § Review table and 7 answers, the known-limits note and D72; review guide § VC5 (what changed, the 4-stage live check, the room list, undo for each piece); CLAUDE.md token row (room per address) and count; D61/D68/D70/D71 now name what they supersede; the VC4 spec has a dated Built note with D59–D72 and the two things to confirm.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0 (42 PASS) at start and end; `grep -rn 'LIVEKIT_\|server-only' src/components src/lib/data` empty; SDK 2.19.1 `AbortSignal.timeout(timeout * 1e3)` checked.
- Not fixed: `TalkSession-review.test.tsx` › "a draft from a call that ended…" still logs "A component suspended inside an act scope". It fires during the `disconnected` emit and comes from a jsdom timer after `user.type`. It is test noise from before VC5 and doesn't fail anything.
- Questions for Michael: **D72**: keep one room per address? Side effect: two people behind one NAT who press Connect in the same second share a room. Undo is in `limits.ts` alone. Still open: D64 (preview regex vs exact `VERCEL_URL`), D68, D70 (TTL 60 s?), D71 (another-tab wording), and the offline line's missing full stop.
- Confirm on the live check: the agent doesn't parse room names (now `concierge-<10 hex>`), and the preview regex matches your previews.

### 2026-10-20 17:05 · VC5-06 · passes

- New `.harness/talk-busy-check.mjs` (Playwright, `page.route` fulfils every token POST) and four captures in `docs/screenshots/v2/`: `VC5-talk-busy-visitor-390.png` 56 KB, `VC5-talk-busy-site-390.png` 57 KB, `VC5-talk-busy-visitor-1280.png` 73 KB, `VC5-talk-offline-503-390.png` 55 KB. Plan § What Michael will see filled (7 rows: 4 captures, 3 curl lines). No code change; tests 1113 → 1113 (81 suites).
- How: `/talk` only fetches with LiveKit env (D46), so I restarted the 7834 dev server with dummy values (`wss://livekit.invalid`), ran the script (30 OK, 0 FAIL), then put the plain server back. Measured: Connect bottom y 664 at 390×844 (above the fold), 489 at 1280; scrollWidth 390; 1 POST per Connect over 15 s (2 presses → 2); getUserMedia 0; no mic toggle; focus stays on "Connect", `:focus-visible`, outline `rgb(0, 212, 255)`; only Chromium's 429/503 resource line in the console.
- curl on the plain server: no Origin → 403, `Origin: https://evil.example` → 403, `Origin: http://localhost:7834` → 503.
- Verified: `check: lint ok · jest ok · build ok` (1113/81); smoke exit 0 (42 PASS) at start and end.
- Next session: `kill $(cat server.pid)` leaves next-server running (the pid is the npx wrapper). Kill the pid holding the port (`ss -ltnp`) before restarting, or the new server dies with EADDRINUSE and you test the old one.
- Question for Michael (copy): "The concierge is offline right now" has no full stop; both busy lines have one. Add it (spec W2 wording + one pinned test)? D71 still open.

### 2026-10-20 16:30 · VC5-05 · passes

- `sessionReducer.ts`: `BusyReason`, phase `busy` (from `connecting` only), `busyReason` (null in `initialSession`); Connect/Leave reset it; `inRoom('busy')` false. `TalkSession.tsx`: `fetchCredentials` returns `{kind:'ok'}` | `{kind:'busy', reason}` (429 + `error:'busy'` + visitor|site only) | null; busy releases the session and dispatches, no timer, no refetch; the status line is one `statusLine` value; deep-dive link under busy too (D66). Copy `busyVisitor`/`busySite` in `concierge.ts`. Tests 1079 → 1113 (81 suites).
- Content: protection sentence appended to the voice-concierge `caseStudy.method.build`, verbatim row in `evidence-voice-concierge.md` § Sentences with digits, pinned by a new test; `voice-concierge-todo.md` § Cost protection (three layers, where to change each). Plan § /talk busy states has "As built (VC5-05)"; CLAUDE.md count and phases line.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0 (42 PASS) at start and end. Busy tests run 15 s of fake timers with `fetchMock` at 1 call, 0 `MockRoom` instances, no mic calls; a 429 with `reason:'other'`, another error or no body, and a busy body on a 503, read offline. Mutation: dropping the `session.alive` check after the fetch fails the new late-429 test.
- Opus review: no Critical. Applied: late-429-after-Leave and late-429-into-second-Connect tests; the focus test now starts on `<body>` (exercises the refocus effect); todo note names `127.0.0.1`. Not taken: the page line "accepts only this site's origin" (previews are the site's; the step's wording).
- Pre-existing, for VC5-07: `TalkSession-review.test.tsx` logs "A component suspended inside an act scope" (also on HEAD before this change).
- Question for Michael (D71): "You already have a conversation open in another tab." is also shown for ~30 s after Leave (D68) and to a second person on the same NAT (conference Wi-Fi). Keep it, or "A conversation from your network is still open. Try again in a minute."?
- Next (VC5-06): with no LiveKit env `/talk` never fetches (`configured={false}`), so a browser can't reach busy on the dev server; screenshots of it need the component rendered with `configured` and a stubbed route.

### 2026-10-20 15:50 · VC5-04 · passes

- `route.ts` now checks Origin (403 `forbidden`, before env, D63) → env (503) → body (400) → `listLiveRooms` (503, error dropped) → `roomsVerdict` (429 `busy` visitor|site) → token for `roomNameFor(bucket)`; no `console`, `profile` from `@/lib/data`, `node:crypto` import gone. Tests 1052 → 1079 (80 → 81 suites): new `concierge-token-route-limits.test.ts` (rooms mocked by factory, real SDK; the VC1 200 cases moved here, D69); `concierge-token-route.test.ts` still mocks nothing, sends the site Origin, adds 6 × 403/dev/prod cases (`jest.replaceProperty` for production); the sdk test shows a bad id and a 403 reach neither SDK spy nor `listLiveRooms`.
- Docs: CLAUDE.md token row (the plan's draft), a Testing note and the count; plan § Route behaviour has "As built (VC5-04)"; the VC1 plan's table is marked superseded in part.
- Verified: `check: lint ok · jest ok · build ok`; smoke exit 0 (42 PASS) at start and end; `grep -n console route.ts` empty. On `next dev` :7834 with no env, no Origin and `https://evil.example` → 403, `http://localhost:7834` and the site origin → 503. Mutations: logging the bucket fails 3 tests; dropping the 429 fails 5.
- Opus review: no Critical or Important issues. Applied: the route comment now says the bucket is in the caller's own token (D70); the no-leak test also decodes the JWT and checks the address isn't in it.
- For VC5-07: `npx tsc --noEmit` reports 3 errors that came in before this change (`booth-bundle.test.ts:92` `MH_HARNESS_HOME`, `concierge-rooms.test.ts:21,39` `mockResolvedValue` typed `never`). `next build` passes anyway; fix them in the cleanup pass.
- Next session (VC5-05): `/talk` busy states. A 403 from the route reads as offline today (any non-OK reply).
- D64 question still open (preview regex vs exact `VERCEL_URL`/`VERCEL_BRANCH_URL`); the route passes only `siteUrl` and `dev`, so switching needs only the extra `opts`.

### 2026-10-20 15:20 · VC5-03 · passes

- New `src/lib/concierge/origin.ts` (`isAllowedOrigin`), `limits.ts` (`addressOf`, `addressBucket`, `roomNameFor`, `roomsVerdict`, `maxRooms`, pure) and `rooms.ts` (`import 'server-only'`, `listLiveRooms` with `requestTimeout: 5, failover: false`, not wired yet). `env.ts` line 1 is `import 'server-only';`. `server-only@0.0.1` is an exact dependency (lockfile updated). CLAUDE.md Code rules name it (D67), and the `lib/concierge/` line names the new modules. Tests 1017 → 1052 (76 → 80 suites): `concierge-origin`, `concierge-limits`, `concierge-rooms` and `TalkSession-import.test.tsx`.
- The import test has its own file, as the plan says (step 4 allows an equivalent). It reaches the mock through `jest.requireActual`: a static import of `@/__mocks__/livekit-client` is the same module path as the mapped `livekit-client`, so it would run the counting factory. Mutation check: moving the `configured` guard below the import makes the zero case fail (1).
- Verified: `check: lint ok · jest ok · build ok`; smoke exit 0 (42 PASS) at start and end; `grep -L` on env/rooms prints nothing; `grep -rl livekit-client src/app` is empty; `npm ls server-only` → 0.0.1.
- Opus review: no Critical issues. Applied: `maxRooms` now also requires `Number.isSafeInteger` (a 20-digit value or Infinity would switch the cap off), plus tests for `'03'`, `:443` and a trailing-dot host.
- Question for Michael (D64, important): the preview regex also matches a Vercel project someone else names `portfolio-site-evil-mh550s-projects` (its `<name>.vercel.app` host), so a page there could spend tokens through its visitors' browsers. Should the allowlist be exactly `https://$VERCEL_URL` + `https://$VERCEL_BRANCH_URL` instead? **Proposed change:** if yes, VC5-03 step 1's `portfolio-site-abc123-…` → true case goes, and VC5-04 passes those two env values into `opts`.
- Next session (VC5-04): wire `listLiveRooms` + `roomsVerdict` into the route in the plan's order. `[::1]` is not a dev origin (browse `localhost`).

### 2026-10-20 14:55 · VC5-02 · passes

- `TalkSession.tsx`: `setMic(session, true)` moved into `agentArrived` (one line, :254; both arrivals go through it, guarded by `agentIdentity`), and the mic toggle renders only when `phase === 'live'` (D65). Tests 1012 → 1017 (76 suites): five new mic tests in `TalkSession-live.test.tsx` (none after connect alone, `[[true]]` after addAgent, agent already present, one per Room across Leave/Connect, a second agent and a reconnect add nothing, no toggle while waiting) plus `micCalls()` = [] on configured=false, 503, rejected connect() and the 10 s timer in `TalkSession.test.tsx`.
- Two helpers that added the agent in a sync `act` (`liveRoom`, the 3 000 ms test) became `await act(async …)`: the mic's answer now lands after the arrival, and without this React logged an act warning.
- Docs: plan § Mic timing has an "As built (VC5-02)" note; review guide morning step 2 says the browser asks for the mic once the concierge has joined; the VC2 plan's state-table rows and its VC2-05 note are marked superseded by D65; CLAUDE.md count is now 1017.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0 (42 PASS). The Opus reviewer found no Critical or Important issues. I applied its Minor test gaps.
- Next session (VC5-03) / VC5-07 Minors not taken: the reducer still accepts `mic`/`micBlocked` in connecting/waiting, which can no longer happen (trim it in VC5-07's simplification pass). While the browser's prompt is open the toggle reads "Unmute microphone" but a press mutes (`micWanted` is true); this is old behaviour that every session now hits. Consider disabling the toggle until the first answer.

### 2026-10-20 14:40 · VC5-01 · passes

- New plan `docs/plans/2026-10-20-VC5-mic-limits-server-only.md` (Mic timing, Route behaviour table 403→503→400→503→429 visitor→429 site→200, Origin rules with the preview regex checked against PR #16's host, Address hash, Modules, /talk busy states, server-only, Tests per feature, staged Live check, CLAUDE.md draft, empty What Michael will see/Review, Decisions). D63–D70 appended to `docs/specs/2026-10-19-voice-concierge-page.md` § 7. No code; tests unchanged at 1012/76.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0 (every route at 1280 and 390). An Opus reviewer checked the plan against the code. Fixes it led to, each confirmed in source: next/jest already maps `server-only` (no mapper of our own); `next dev` fills `x-forwarded-for`; `NODE_ENV` is readonly in TS, so use `jest.replaceProperty`; rooms mocks need `mockResolvedValue([])`; the livekit-client import test goes in its own file (isolateModules + render breaks hooks).
- Next session (VC5-02): mic → `agentArrived`, toggle only when `live` (D65). VC5-03: the import test is `TalkSession-import.test.tsx`, not `TalkSession.test.tsx` (see plan § server-only).
- Questions for Michael: (D68) after Leave the address reads "another tab" until LiveKit closes the room (≥20 s; minutes if the agent keeps the room). Keep counting every listed room (fail closed), or only rooms with a `visitor-` participant? (D70) A shell that forges Origin can mint many tokens and join them all at once, so only the provider caps bound it. Cut the token TTL from 600 s to about 60 s? (D64) Does the preview regex match your current previews? Also confirm `mh550/voice-concierge` doesn't parse room names (no agent code is checked out locally).
- Proposed changes: VC5-01 step 3 says addr10 never appears in a response, but the visitor's own JWT carries their room name; the plan narrows this to "never in plain text" (D70). VC5-03 step 4 names `TalkSession.test.tsx`; the plan puts the test in `TalkSession-import.test.tsx` (step 4 allows an equivalent).

### 2026-10-20 18:00 · verify VC4

All 6 features hold (35 steps).

| Feature | Step | What you ran or read | What you saw | Holds |
|---|---|---|---|---|
| VC4-01 | 1 | read plan headings + § Order table | all 8 sections present; order table 1–10 matches; getTopProjects(3) = agent-harness, voice-concierge, ghl-jobtread-integration stated | yes |
| VC4-01 | 2 | read plan § Voice widget | file, next/link, aria-label, svg, safe-area bottom, h-14, z-40, focusRing, print:hidden, motion-safe pulse, Footer pb-24 xl:pb-8 all specified | yes |
| VC4-01 | 3 | read plan § Intro wording and concierge.ts/projects.ts | intro first sentence verbatim, link shape, builtWith keeps 'Claude Code agents' and names harness | yes |
| VC4-01 | 4 | grep spec § 7 and v2 spec | ## 7 Decisions with D59–D62; 'Superseded by D60 (VC4).' after D44 and D49 | yes |
| VC4-01 | 5 | read plan § Tests; ran npx jest --silent | table lists data.test, case-study, Navbar tests by name; suite now 1012 tests/76 suites (later milestones add tests; plan-time count was for that commit) | yes |
| VC4-01 | 6 | check.sh (cached green) + node .harness/smoke.mjs | green; every route PASS at 1280 and 390 | yes |
| VC4-02 | 1 | grep order in projects.ts; read data.test.ts lines 54–83; jest | orders 1..10 exactly as listed; map test, uniqueness, getTopProjects(3) assertions present; jest green | yes |
| VC4-02 | 2 | read case-study test line 30, card.test:65, home.test:38; git diff main..HEAD -- '*.snap' | order toBe(2); hrefs[1]=/projects/voice-concierge in both; no .snap diff | yes |
| VC4-02 | 3 | read Navbar.tsx links, Navbar.test.tsx; grep -c | 8 links, Talk fifth; /talk test marks Talk; grep count 1; live menu lists 8 links in order | yes |
| VC4-02 | 4 | grep spec/CLAUDE.md | D44 and D49 followed by 'Superseded by D60 (VC4)'; CLAUDE.md /talk row says on the Navbar (D60); only /evidence is 'off the Navbar' | yes |
| VC4-02 | 5 | grep docs/review-guide.md | 'order 5' line says VC4 moved it to order 2 (D59) | yes |
| VC4-02 | 6 | check.sh + smoke | green / all PASS | yes |
| VC4-03 | 1 | read VoiceWidget.tsx and VoiceWidget.test.tsx | link /talk, aria-label, aria-hidden svg, fixed right-4, print:hidden, h-14 w-14, safe-area bottom, motion-safe:animate-pulse; tests assert these and no bare animate- | yes |
| VC4-03 | 2 | read SiteChrome.tsx and SiteChrome.test.tsx 70–95 | widget after Footer when pathname !== '/talk'; it.each / /about /projects/agent-harness present, /talk absent, /card and /card/qr absent; live: widget count 1 on /,/about,/projects, 0 on /talk,/card | yes |
| VC4-03 | 3 | a11y-new-pages.test:86 and VoiceWidget.test 'adds no heading and no landmark' | navigation count unchanged (1), widget adds none; jest green | yes |
| VC4-03 | 4 | Footer.tsx + Footer.test:48; own Playwright at 390 | pb-24 xl:pb-8 asserted; scrollWidth 390 on / /about /projects; widget box x318 y772 56x56 clear of footer links | yes |
| VC4-03 | 5 | read plan § Voice widget and spec D61 | classes, label, pathname rule match code; D61 names component and exclusions | yes |
| VC4-03 | 6 | check.sh + smoke | green / all PASS | yes |
| VC4-04 | 1 | read concierge.ts intro; grep 'writing much of the code' src/ | new first sentence verbatim, link /projects/agent-harness in data; grep empty | yes |
| VC4-04 | 2 | read talk.test.tsx 43–60, concierge-data.test:17; live /talk | link 'my agent harness' href /projects/agent-harness asserted; full intro text asserted; no-digit and no 'Claude Code agents writing' asserted; live href correct | yes |
| VC4-04 | 3 | read projects.ts builtWith and Links; jest | builtWith names harness, keeps 'Claude Code agents', says harness ran build sessions; link 'The agent harness that built it' (kind doc) present; evidence-verbatim test passes (jest green) | yes |
| VC4-04 | 4 | read evidence-voice-concierge.md and spec D62 | dated '## VC4 note (2026-10-20)' with source; D62 quotes final intro | yes |
| VC4-04 | 5 | check.sh + smoke | green / all PASS | yes |
| VC4-05 | 1 | ls -la docs/screenshots/v2/VC4-* | six named PNGs exist, 53–300 KB each, under 400 KB; /card live order confirmed agent-harness, voice-concierge, ghl-jobtread | yes |
| VC4-05 | 2 | own Playwright 390x844 on /about bottom, five pages | widget y772 h56 (bottom 828 = 844-16); no intersect with GitHub/LinkedIn/Email; scrollWidth 390 on / /about /projects /talk /card; 0 console/page errors | yes |
| VC4-05 | 3 | Playwright emulate reducedMotion on / | reduce -> animation-name none; no-preference -> pulse | yes |
| VC4-05 | 4 | Playwright Tab x22 on / at 1280 | order: Skip, MH, 8 nav links Talk fifth, page links, footer, widget; widget :focus-visible outline rgb(0, 212, 255) 2px | yes |
| VC4-05 | 5 | node .harness/print-check.mjs http://localhost:7834 / …/p.png | PASS print, exit 0; widget print:hidden (class asserted in test) | yes |
| VC4-05 | 6 | read plan § What Michael will see | six rows, one per screenshot, plus measurements | yes |
| VC4-05 | 7 | check.sh + smoke | green / all PASS | yes |
| VC4-06 | 1 | read plan § Review | 14-row table covering name, z-index, Footer, reduced motion, eight links at 390, intro honesty; Minor fixes with tests; no Critical/Important | yes |
| VC4-06 | 2 | grep -rniE tailnet/CGNAT/ntfy on VoiceWidget.tsx concierge.ts; jest content-guard | grep empty; full jest 1012 pass incl. content-guard | yes |
| VC4-06 | 3 | read CLAUDE.md lines 26–31, 41, 81–86; npx jest --silent | eight-link Navbar line, VoiceWidget line, /talk row, '1012 tests, 76 suites' matches jest output | yes |
| VC4-06 | 4 | read docs/review-guide.md § VC4: order, Navbar, widget | what changed, 390 look-at list, captures; undo notes present | yes |
| VC4-06 | 5 | check.sh + smoke | green / all PASS | yes |

### 2026-10-20 16:25 · VC4-06 · passes

- **Review** (Opus, `$HARNESS_SCRATCH/VC4.diff` = `git diff f9e8a58..HEAD`, 1356 lines, both skills): plan § Review is a
  14-row table; widget name, z-index vs Navbar/menu/skip link, Footer clearance (`xl` is the first breakpoint ≥ 1248),
  reduced motion, eight links at 390/768 and the intro's honesty all hold. Nothing Critical or Important.
- **Minor fixes taken**: Navbar mobile menu `max-h-[calc(100dvh-4rem)] overflow-y-auto` (new test failed first; at
  740×360 the menu is 295 px and scrolls to Contact, at 390×844 unchanged, 304 px); talk test splits class tokens;
  VoiceWidget test pins `motion-safe:[animation-iteration-count:2]`; `/talk` keys paragraphs by `introText(p)`;
  SiteChrome excludes `talkWidget.href`, not a `'/talk'` literal. Tests 1011 → 1012, 76 suites.
- **Docs**: review guide § "VC4: order, Navbar, widget" (changes, what to look at at 390, captures, undo per piece);
  CLAUDE.md /talk row, VoiceWidget line (where it shows), counts.
- Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0, 42 PASS; the ts.net/CGNAT/ntfy
  grep on VoiceWidget.tsx and concierge.ts is empty, content guard green.
- **Question for Michael**: `builtWith` says "a second run is writing the agent" (present tense); change it once the
  agent run is done? Not taken (optional): a visible hover/focus label on the mic disc; an `@theme` pulse token.
- **Proposed change**: step 3's "the /talk Routes row … has the widget" read as "mentions the widget"; the row says
  the widget on other pages links here and is not shown on `/talk` (D61).

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
