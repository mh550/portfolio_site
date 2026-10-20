# Progress log: run `portfolio_site-2026-10-20` (Voice Concierge page)

What this file is: the shared memory of this run. Every session reads it at startup and appends its own entry at
the top (newest first) when it finishes: feature id, what landed (files, tests before → after), what it learned,
and anything the next session must know. Keep entries short; put detail in the milestone's plan file.

How to read the feature list (`feature_list.json`, same folder): array order is priority order; a session gets the
first feature whose `passes` is false and whose `after` (feature or milestone ids; by default everything before it)
all pass. A session changes only its own feature's `passes`. Steps are what the verifier re-runs, one evidence row
per step; the last step is always the suite.

How Michael steers: `INBOX.md` in this folder. First line `status: run | pause | stop`; answers to the questions
below go under `## Answers`. The harness pulls before every session; read the Answers before building.

---

### 2026-10-20 · verify VC1

| Feature | Step | What you ran or read | What you saw | Holds |
|---|---|---|---|---|
| VC1-01 | 1 | read package.json; `npm view` each pkg; `npm ci` in a temp copy; ls node_modules/@livekit; grep lock for components-styles | deps pin livekit-client 2.23.0, components-react 2.9.24, server-sdk 2.19.1 = npm latest; no ^/~; npm ci clean; no styles pkg (0 hits); plan § explains why | yes |
| VC1-01 | 2 | read spec D41 (line 156) | D41 *default* names the 3 packages, pins, reason (spec §3, Michael 10-19) | yes |
| VC1-01 | 3 | read plan quotes + decoded token; ls protocol/dist | AccessToken.d.ts, RoomConfiguration/RoomAgentDispatch quoted; decoded payload has sub, video.room, roomConfig.agents[0].agentName, exp, nbf (no iat, noted). livekit_room_pb.d.ts absent in installed protocol (declared in dist/index.d.ts); plan states this | yes |
| VC1-01 | 4 | read plan behaviour table + tests section | 503/400/200, room, identity, ttl 600, grants, metadata, emptyTimeout 30, runtime/dynamic, env per request, spec §5 tests and 'x'.repeat(32) guard advice all present | yes |
| VC1-01 | 5 | check.sh + `npx jest --silent` | check green; jest 60 suites/680 tests pass | yes |
| VC1-02 | 1 | read concierge-token-route.test.ts lines 55-90; ran it | no env → 503 toEqual {offline:true}; it.each of each var missing → 503; test passes | yes |
| VC1-02 | 2 | read test cases lines 90-116 | it.each: not-a-uuid, v1, 37-char, missing body, non-JSON → 400 {error:'bad_request'}, no token | yes |
| VC1-02 | 3 | read tests 118-200; ran; read route.ts | keys url+token, url=env, sub/room/roomJoin/nbf+600/agentName/metadata/emptyTimeout 30, distinct rooms, no key/secret in text; real SDK (no mocks in this file) | yes |
| VC1-02 | 4 | read visitorId.ts and concierge-visitor-id.test.ts; route imports it | isUuidV4 accepts either case v4; tests reject v1, bad variant, wrong length, non-strings; passes | yes |
| VC1-02 | 5 | read route.ts; curl POST on :7832 | runtime='nodejs', dynamic='force-dynamic', env read in handler; curl → HTTP 503 {"offline":true} | yes |
| VC1-02 | 6 | check.sh; `node .harness/smoke.mjs` (twice) | check green; smoke all PASS, exit 0 | yes |
| VC1-03 | 1 | read plan § Review (line 215) | 9-row table (file·finding·severity·outcome); Important flaky nbf fixed with frozen clock; commit e81219d adds tests | yes |
| VC1-03 | 2 | `grep -rn LIVEKIT src/components src/app --include=*.tsx`; `grep -rl LIVEKIT_API .next-check/static`; read route.ts and sdk test | both greps empty; error bodies are literals; room/identity from validated id + randomBytes; 37/10000-char ids rejected before SDK (regex anchored, spy test) | yes |
| VC1-03 | 3 | `npx jest content-guard.test.ts` | passes with route tests present | yes |
| VC1-03 | 4 | read CLAUDE.md; `npx jest --silent | tail` | route row, D41 packages in Code rules; counts 680 tests/60 suites match | yes |
| VC1-03 | 5 | check.sh | green | yes |

### 2026-10-20 00:36 · VC1-03 · passes

- **Review:** Opus read `VC1.diff` (652 lines). No Critical findings. 1 Important: the token test's `exp - nbf === 600` was flaky,
  because the SDK reads the clock twice (a throwaway test got 599). Now fixed with a frozen clock. Plan § Review has the 9-row table and the four leak/id checks with evidence.
- **Changed:** `route.ts` lower-cases the id (D43 *default*); `isUuidV4` is now a type guard and `readVisitorId` is one line.
  New `concierge-token-route-sdk.test.ts` (500 path, no SDK call on bad ids); new tests cover extra body fields and lower-casing.
  CLAUDE.md gains the route row, D41 packages and the counts. Tests 674 → 680, suites 59 → 60.
- **Verified:** `check.sh` green (fresh `.next-check`); `grep LIVEKIT` in tsx and `.next-check/static` both empty; content guard 20/20;
  curl :7832 → `{"offline":true}` 503; smoke 38/38.
- **Next (VC2-01):** the client must send `crypto.randomUUID()` (already lower-case). `isUuidV4` narrows to `string`.
- **Question for Michael:** D43, keep lower-casing ids? Also, the route has no Origin check or rate limit, so anyone can mint tokens,
  and each joined room dispatches the paid agent (capped at 10 min). Should a later milestone add an Origin allowlist?

### 2026-10-20 · VC1-02 · passes

- **Changed:** new `src/app/api/concierge/token/route.ts` (POST only; 503 `{offline:true}` checked before the body,
  400 `{error:'bad_request'}`, 200 `{url, token}`, 500 `{error:'token_failed'}`; `Cache-Control: no-store` on all) and
  `src/lib/concierge/visitorId.ts` (`isUuidV4`). Tests first: `src/__tests__/app/concierge-token-route.test.ts`
  (real SDK, real signing, `TokenVerifier` check) and `src/__tests__/lib/concierge-visitor-id.test.ts`. 643 → 674 tests, 57 → 59 suites.
- **Recorded:** D42 *default* in the v2 spec (route test signs with the real SDK; only `livekit-client`/components get mocked, in VC2).
  The plan's test paths now match the feature's file names.
- **Verified:** `check.sh` green; curl on :7832 → `{"offline":true}` HTTP 503 (GET → 405); smoke 38/38; route absent
  from `.next-check/prerender-manifest.json`; `grep -rl LIVEKIT_API .next-check/static` empty.
- **Next (VC1-03):** review the diff; CLAUDE.md still needs the route row, D41 packages and counts (674 tests, 59 suites).

### 2026-10-20 · VC1-01 · passes

- **Changed:** `package.json`/`package-lock.json` pin `livekit-client` 2.23.0, `@livekit/components-react` 2.9.24,
  `livekit-server-sdk` 2.19.1 (latest per `npm view`; `components-styles` not installed). D41 *default* in the v2 spec.
  New `docs/plans/2026-10-20-VC1-token-route.md`: quoted types, a decoded minted token, the route table, tests, live steps. Tests 643 → 643.
- **Verified:** `npm ci` clean (741 packages); `check.sh` green (57 suites, 643 tests, lint and build ok); smoke 38/38.
  A throwaway Jest test (node env) minted and decoded a real token, then was deleted.
- **Next session (VC1-02):** the route test needs `/** @jest-environment node */` (under jsdom, jose resolves to its browser ESM build).
  The token has `nbf`, **no `iat`**; dispatch `metadata` is a JSON *string*. Running `npm ci` kills the dev server; restart with `.harness/init.sh`.
- **Proposed change:** VC1-01 step 3 names `@livekit/protocol/dist/gen/livekit_room_pb.d.ts`, which doesn't exist. The
  types are in `dist/index.d.ts` (server SDK's nested copy 1.51.0; the top-level copy is 1.52.1, with the same declarations).

## 2026-10-20 · Initializer (Fable)

**Scope (the brief wins):** VC1–VC3 of `docs/specs/2026-10-19-voice-concierge-page.md` only. The agent itself is
being built tonight in a parallel run at `~/projects/voice-concierge` (public repo `mh550/voice-concierge`,
confirmed PUBLIC by `gh repo view` at init). §4 of the page spec is the shared contract, word for word; build to
that text, not to the agent repo's live files, which may still move tonight. No LiveKit environment exists in the
suite, the smoke or the dev server: every page must render its offline state cleanly. PRs only; Michael merges.

**Features:** 15. VC1 token route + deps: 3 (plan+deps, build, review). VC2 `/talk`: 7 (plan, pure rules, panels,
page + session, interaction, check, review). VC3 deep-dive + entry points: 5 (plan + evidence note, data entry,
diagram + card link, check, review). Dependencies: VC2 after VC1; VC3 after VC1 (independent of VC2); inside each
milestone, sequential. First three: VC1-01, VC1-02, VC1-03.

**Baseline:** 643 tests, 57 suites, `.harness/check.sh` green in ~1 min; `node .harness/smoke.mjs` 38/38. Dev
server for this run: `http://localhost:$HARNESS_PORT` (7832 at init). Next 16.1.6, React 19.2, Jest 30, Node 24.

### Where things live

- Content is data: `src/lib/data/*.ts`, barrel `index.ts`. New here: `src/lib/data/concierge.ts` (page copy,
  privacy note) and the `voice-concierge` entry in `projects.ts`. Components render data; tests assert against the
  data, except where the spec gives an exact string (the offline sentence is one).
- Pure logic for the page goes in `src/lib/concierge/` (`visitorId.ts`, `contract.ts`, `latency.ts`): no DOM, no
  LiveKit imports, fully unit-tested. The route (`src/app/api/concierge/token/route.ts`) and the client component
  both import `isUuidV4` from there.
- Client code only in `src/components/talk/`. `TalkSession.tsx` is the one `"use client"` owner of the Room; the
  panels are presentational. `src/app/talk/page.tsx` stays a Server Component (metadata, h1, privacy note).
- Site chrome: `SiteChrome.tsx` strips Navbar/Footer only on `/card*`; `/talk` keeps both (default D43).
- Case-study template: `components/projects/ProjectDetail.tsx` + `case-study/*`; props and copy rules in
  `docs/plans/2026-10-18-M3-case-study-template.md` § Components. Diagrams: one file,
  `components/projects/diagrams/index.tsx`, with `DIAGRAMS`, `CAPTIONS`, `LABELS` keyed by `DiagramKey`
  (`projects.ts`); `ProjectDiagram.test.tsx` lists every key in `KEYS` and asserts one `role="img"` with a unique
  label and a figcaption.
- Plan files: `docs/plans/2026-10-20-VC1-token-route.md`, `…-VC2-talk-page.md`,
  `…-VC3-voice-concierge-deep-dive.md`. Decisions: append `D41 *default*` onward to the v2 spec's Decisions list;
  never renumber. Screenshots: `docs/screenshots/v2/VC<n>-<page>-<width>.png`, under 400 KB.
- Diff base for a milestone review: the parent of its first feature commit
  (`git log --format=%H --grep='^VC2-01' | tail -1`, then `^`). Feature commits start with `<id>:`.

### LiveKit facts checked at init (re-check against the installed types; never guess a signature)

- Versions on npm tonight: `livekit-server-sdk` 2.19.1, `livekit-client` 2.23.0, `@livekit/components-react`
  2.9.24 (peer `livekit-client ^2.20.1`, `react >=18`). Pin exactly (`npm i -E …`). `init.sh` re-runs `npm ci`
  when `package-lock.json` is newer than `node_modules`, so a lockfile change costs one reinstall per session.
- `livekit-server-sdk` re-exports `RoomConfiguration` and `RoomAgentDispatch` from `@livekit/protocol`;
  `AccessToken` has `ttl` (number = seconds, or a string), `addGrant(VideoGrant)`, a `roomConfig` setter and
  `async toJwt()`. Signing is pure (jose, HS256): the route test can mint and decode a real token with a fake key
  and secret, no network. Decode the payload in the test with `Buffer.from(seg, 'base64url')`.
- `livekit-client`: `Room.registerTextStreamHandler(topic, (reader, participantInfo) => …)` /
  `unregisterTextStreamHandler(topic)`; `reader.readAll()`; `reader.info.attributes` carries the
  `lk.*` transcription attributes; `LocalParticipant.sendText(text, { topic })`; `performRpc({ destinationIdentity,
  method, payload, responseTimeout })`; `setMicrophoneEnabled(bool)`; `Participant.kind === ParticipantKind.AGENT`
  (re-exported from `@livekit/protocol`). Registering a second handler on a topic that already has one throws, so
  do not combine your own `lk.transcription`/`lk.chat` handlers with `useTranscriptions`/`useChat`.
- `@livekit/components-react` is `sideEffects: false`; use `RoomContext.Provider value={room}` +
  `RoomAudioRenderer` for agent audio. `@livekit/components-styles` is not needed for that (default: leave it out).
- Browser autoplay: call `room.startAudio()` after the Connect click if `room.canPlaybackAudio` is false.
- Room and participant kinds, text streams and RPC all exist in the mock only: `src/__mocks__/livekit-client.ts`
  and `src/__mocks__/livekit-components-react.tsx`, wired through `moduleNameMapper` in `jest.config.ts` exactly
  like the existing framer-motion mock. No test may open a connection.

### Gotchas

- **Content guard** (`src/__tests__/lib/content-guard.test.ts`) scans `src/` and `public/`, including tests. Its
  secret pattern is `/(api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i`, so
  `process.env.LIVEKIT_API_SECRET = 'xxxxxxxxxxxx'` or a fixture `token: 'eyJhbGci…'` fails the suite. Build fakes
  from expressions (`'x'.repeat(32)`, `['a','b'].join('.')`). Also no `TODO`, no `[X]`, no phone-shaped numbers
  (`919 555 0123`), no `.ts.net`, no `ntfy.sh/`. Fix the content, never the guard.
- **Hydration and lint.** eslint-config-next 16 flags setState inside a mount effect. Read the visitor id from
  `localStorage` inside the Connect click handler, not on mount; the server and client renders then match and
  `next build` prerenders `/talk` without a `window` reference. If `livekit-client` turns out not to be SSR-safe at
  import time, lazy-load it inside the connect handler (`await import('livekit-client')`; `jest.mock` still applies).
- **Tests that count.** `data.test.ts` pins 9 projects and the full D12 order map; `sitemap-robots.test.ts` pins 8
  static routes and `8 + projects.length` URLs; `card.test.tsx` expects exactly 3 `/projects/` links and 2
  `target=_blank` links; `project-page-unchanged.test.tsx` snapshots the six classic pages (do not touch
  `ProjectDetail` markup); `opengraph-image.test.ts` renders every project's OG image and checks each glyph of the
  title and shortDescription (or first metric) against the bundled font's cmap: Latin only, `→`/`↔` are drawn as
  SVG, `≈` becomes `~`. `claims-on-linked-page.test.ts` pins 17 + 20 claims on `/approach` and `/evidence`: do not
  edit `approach.ts` or `competencies.ts`.
- **`a11y-new-pages.test.tsx`** renders each new page and requires one h1 first, no skipped heading levels, a
  `focus-visible:outline` class on every link/button (`focusRing` from `components/focusRing.ts`), and no link named
  only "here", "more" or an arrow. Add `/talk` and `/projects/voice-concierge` to its `pages` list.
- **Smoke** discovers project slugs from `/projects` and reads `.harness/smoke-routes.txt` for static pages: add
  `/talk` there (VC2-04). It fails on any console error, so a LiveKit warning logged at page load would fail it.
- **Print** (`globals.css` `@media print`, pinned by `print-styles.test.ts`): hide decorative extras with
  `print:hidden`; don't add a second print block.
- **Build-only policy.** Never set LiveKit env vars anywhere, never create `.env*`, never read
  `~/.config/voice-concierge/env`. The live check is written for Michael in `docs/review-guide.md` (VC2-07).
- **Agent repo reads** are limited to `~/projects/voice-concierge/docs/spec.md`, `docs/decisions.md` and
  `README.md`, read-only. It is being rewritten tonight: quote its Status line with the revision time in
  `docs/notes/evidence-voice-concierge.md` so the deep-dive's claims have a dated source.
- **Order of merges.** VC3's card link and the deep-dive's Links point at `/talk`, which VC2 builds. Both are on one
  branch, so by the time VC3 runs the page exists; the review guide tells Michael to merge VC1 → VC2 → VC3.

### Defaults chosen (record each as `D<n> *default*` in the v2 spec when the feature builds it)

- **D41** the three runtime packages at exact pins (VC1-01).
- **D42** the token route test signs a real token with the real SDK and fake env, then decodes it; the spec's
  "tests mock the SDK" is applied to `livekit-client` and `@livekit/components-react` in Jest (VC1-02 / VC2-04).
- **D43** `/talk` keeps the site chrome (Navbar, skip link, Footer), is indexable and in the sitemap, and stays off
  the Navbar: the v2 spec fixes the Navbar at seven links and the page spec allows it only if those rules permit.
  Reachable from `/card`, the deep-dive and the sitemap (VC3-03).
- **D44** the `voice-concierge` project is `featured: true, order: 5` (after HitList); `ghl-jobtread-integration`
  and later shift by one. `/card`'s Selected work and the home Recent work stay as they are; the card gets its own
  button (VC3-02). Michael can change this in INBOX.
- **D45** the `/card` button "Talk to my concierge" sits directly under the LinkedIn / Email / GitHub row (VC3-03).
- The visitor id is created at Connect time, not on mount; `@livekit/components-styles` is not installed.

### Questions for Michael (defaults apply until answered in INBOX.md § Answers)

1. **Where should Voice Concierge sit in the project order?** Default: 5th (after HitList), so `/card`'s three
   Selected work entries and the home page's Recent work do not change. Answer `order 2` to make it the second
   project everywhere (it would then replace Home media server on the card's Selected work, next to the new
   "Talk to my concierge" button).
2. **Should `/talk` be in the Navbar?** Default: no (the Navbar stays at seven links); it is linked from `/card`,
   the deep-dive and the sitemap. Answer `navbar yes` and VC3-03 adds it between Projects and Approach.
3. **Deep-dive title.** Default: "Voice Concierge: a voice agent that remembers returning visitors". Say another.
