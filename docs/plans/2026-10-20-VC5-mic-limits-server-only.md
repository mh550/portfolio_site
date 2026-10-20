# VC5 plan: mic timing, token-route limits, server-only (2026-10-20)

For the VC5 build sessions (VC5-02 … VC5-07). Spec: `docs/specs/2026-10-20-vc4-order-widget-limits.md` § VC5
(Michael's answers of 2026-10-20). Decisions go in `docs/specs/2026-10-19-voice-concierge-page.md` § 7 (D63–D70,
§ Decisions below). The VC1 route table (`docs/plans/2026-10-20-VC1-token-route.md` § Route behaviour) stays true
for everything this plan does not change: identity, grants, TTL, `RoomConfiguration`, `no-store`, plain `Response`.

Build order: VC5-02 (mic timing) → VC5-03 (pure modules, `server-only`, the livekit-client import test) → VC5-04
(the route) → VC5-05 (`/talk` busy states, the deep-dive line, the todo note) → VC5-06 (screenshots, curl) → VC5-07
(review, hand-off docs, CLAUDE.md counts). Each feature updates the tests it breaks in the same commit (§ Tests).

INBOX.md § Answers was empty at plan time. Base: 1012 tests in 76 suites (`npx jest --silent`, after VC4-06).

## Mic timing

Today `connect()` calls `setMic(session, true)` right after `room.connect()` resolves, so an offline Connect (no
agent within `AGENT_JOIN_TIMEOUT_MS`) still pops the browser's microphone prompt. After VC5-02:

- `agentArrived(identity)` (in `TalkSession.tsx`) clears the join timer, keeps the identity, dispatches
  `agentJoined`, then calls `setMic(session, true)`. That is the **only** `setMic(session, true)` in the file
  (`grep -n 'setMic(session, true)' src/components/talk/TalkSession.tsx` → one line, inside `agentArrived`).
- Both arrivals go through it: the agent already in `room.remoteParticipants` when `connect()` resolves, and the
  agent that joins later (`RoomEvent.ParticipantConnected`).
- Once per session: `onParticipantConnected` only calls `agentArrived` while `session.agentIdentity` is null, and
  the post-connect scan returns early when it is set. A reconnect (Wi-Fi → cellular) replays no arrival, so the mic
  is not requested again. `setMicrophoneEnabled` never runs before the room is connected: livekit-client emits
  `ParticipantConnected` through `emitWhenConnected` (`livekit-client.esm.mjs`, `Room.emitWhenConnected`: emitted only
  in `ConnectionState.Connected`, buffered while reconnecting).
- The rest of the connect continuation is unchanged: `onPlayback()` and `unlockAudio(room)` still run when
  `connect()` resolves (no mic involved).
- **The mic toggle renders only in the `live` phase** (D65 *default*): today it shows in `waiting` too, where a press
  would ask for the mic before the agent is there. Condition `(phase === 'waiting' || phase === 'live')` becomes
  `phase === 'live'`. `micBlocked`'s status line is already live-only.
- The offline paths (`configured={false}`, 503, a 429, `connect()` rejecting, the 10 s timer) never reach
  `agentArrived`, so they never request the mic.

**As built (VC5-02).** `agentArrived` is exactly the four lines above (clear the timer, keep the identity,
`agentJoined`, `setMic(session, true)`); the post-connect continuation runs `onPlayback()`, `unlockAudio(room)`,
then returns if `agentIdentity` is set or calls `agentArrived` for an agent already present, else `connected` and
the 10 s timer. The toggle renders under `phase === 'live'`. Tests: `TalkSession-live.test.tsx` § the microphone (no
call after `connect()` alone, `[[true]]` after `addAgent`; `[[true]]` for an agent already present; one `[[true]]`
per Room across Leave and Connect; a second agent and a full reconnect with the agent re-announced add no call; no
toggle while Waiting, one once live) and `TalkSession.test.tsx` (no Room and no call with `configured={false}`; no
call on a 503, a rejected `connect()` or the 10 s offline path; no call at 3 000 ms and `[[true]]` once the agent
joins then, under fake timers). Two helpers that add the agent inside a synchronous `act` (`liveRoom`, the 3 000 ms
test) became `await act(async …)`: the mic's answer now settles after the arrival and must render inside `act`.

## Route behaviour

`src/app/api/concierge/token/route.ts` (VC5-04), `POST` only. Checks in this order; the first that applies answers.
Every reply goes through `reply()` and carries `Cache-Control: no-store`.

| # | Check | Response |
|---|---|---|
| 1 | `Origin` header missing, or not allowed by `isAllowedOrigin(request.headers.get('origin'), { siteUrl: profile.siteUrl, dev: process.env.NODE_ENV !== 'production' })` (§ Origin rules) | `403 {"error": "forbidden"}` |
| 2 | `conciergeEnv()` null (any `LIVEKIT_*` missing, url not `wss://`) | `503 {"offline": true}` |
| 3 | Body not JSON, no string `visitor_id`, or not a UUID v4 (`readVisitorId`, unchanged) | `400 {"error": "bad_request"}` |
| 4 | `listLiveRooms(env)` rejects (network, auth, the 5 s timeout, D68) | `503 {"offline": true}` (fail closed; the error is dropped) |
| 5 | a live room named `concierge-<addr10>-*` (this address's bucket) | `429 {"error": "busy", "reason": "visitor"}` |
| 6 | `maxRooms(process.env)` or more live `concierge-*` rooms; `CONCIERGE_MAX_ROOMS` default 2, any value that is not a whole number ≥ 1 falls back to 2 | `429 {"error": "busy", "reason": "site"}` |
| 7 | otherwise | `200 {"url", "token"}`, room `concierge-<addr10>-<12 hex>` (`roomNameFor(bucket)`) |
| – | `toJwt()` throws (unchanged from VC1) | `500 {"error": "token_failed"}` |

Rows 5 and 6 are one call, `roomsVerdict(rooms, bucket, maxRooms(process.env))`, which returns `'visitor'`,
`'site'` or `null`; visitor wins when both apply. The route maps a non-null verdict to the 429 body; it holds no
other limit logic.

Sketch (VC5-04 writes the real thing; names are fixed, layout is not):

```ts
export async function POST(request: Request) {
  const dev = process.env.NODE_ENV !== 'production'; // read per request: the test seam (§ Tests)
  if (!isAllowedOrigin(request.headers.get('origin'), { siteUrl: profile.siteUrl, dev })) {
    return reply({ error: 'forbidden' }, 403);
  }
  const env = conciergeEnv();
  if (!env) return reply({ offline: true }, 503);
  const visitorId = await readVisitorId(request);
  if (!visitorId) return reply({ error: 'bad_request' }, 400);
  let rooms: { name: string }[];
  try {
    rooms = await listLiveRooms(env);
  } catch {
    return reply({ offline: true }, 503);
  }
  const bucket = addressBucket(addressOf(request.headers), env.apiSecret);
  const verdict = roomsVerdict(rooms, bucket, maxRooms(process.env));
  if (verdict) return reply({ error: 'busy', reason: verdict }, 429);
  const room = roomNameFor(bucket);
  // … AccessToken exactly as VC1 …
}
```

- No `console.*` anywhere in the route (`grep -n console src/app/api/concierge/token/route.ts` empty). The address,
  `addr10` and the secret never reach a body, a header or a log line.
- `process.env.NODE_ENV` is read inside the handler, never at module scope. In a production build Next inlines it
  as `'production'`, so `dev` is always false there.
- Known limits (accepted, D68): the check and the join are not atomic, and a room only exists once someone joins.
  So a script that forges the Origin can mint any number of tokens back to back (each sees no room and gets 200),
  then join them all within the token's 600 s TTL: that passes both the per-address and the site cap, and the
  agent's per-visitor-id cap too (the id is the caller's to choose). Against a determined shell the real bound is
  the provider caps (about $45 a week). The route caps stop browsers, other sites and casual scripts. Shortening
  the TTL to about 60 s narrows that window (LiveKit refreshes the token of a participant already connected) and
  is a question for Michael (D70), not built. And a room stays in `listRooms` after Leave until LiveKit closes it
  (the agent leaves, then LiveKit's departure timeout, 20 s by default): Leave then Connect at once reads "another
  tab" for that long. See § Live check stage 2 and the question in D68.
- The 200 body's JWT carries `video.room`, so the visitor's own `addr10` is in their own token (base64url, not plain
  text). That is by design (D70): it is their bucket, not their address, and no one else sees it. "Never in a
  response" means never in plain text and never someone else's.

**As built (VC5-04).** `route.ts` follows the sketch line for line: `dev` and the Origin check first (403), then
`conciergeEnv()` (503), `readVisitorId` (400), `listLiveRooms(env)` in a `try` (503, error dropped), then
`addressBucket(addressOf(request.headers), apiSecret)`, `roomsVerdict(…, maxRooms(process.env))` (429) and
`roomNameFor(bucket)` for the VC1 `AccessToken` code, unchanged. `profile` comes from the `@/lib/data` barrel; the
route no longer imports `node:crypto` (the room suffix is `limits.ts`'s). No `console.*`. Tests as § Tests says,
D69 taken: the 200 cases moved to `concierge-token-route-limits.test.ts`; `concierge-token-route.test.ts` mocks
nothing and keeps every 403, 503 and 400 case. Mutation checks: logging the bucket fails 3 limits tests; dropping
the 429 line fails 5. `next dev` on port 7834 with no env: no Origin and `https://evil.example` → 403
`{"error":"forbidden"}`; `http://localhost:7834` and the site origin → 503 `{"offline":true}`.

## Origin rules

`isAllowedOrigin(origin, { siteUrl, dev })` in `src/lib/concierge/origin.ts`, pure, never throws:

1. `origin` null → false. Parse with `new URL(origin)` inside `try`; a throw (the literal `'null'` that sandboxed
   frames send, any non-URL) → false.
2. The parsed `url.origin` must equal the header string exactly (rejects a path, a trailing slash, userinfo, upper
   case). From here on the comparison is on the whole origin or the whole hostname, never a substring.
3. Allowed when any of:
   - `url.origin === new URL(siteUrl).origin`, i.e. `https://michael-herron.vercel.app` (from `profile.siteUrl`;
     `http://` of the same host is a different origin, so false).
   - Vercel preview: `url.protocol === 'https:'`, `url.port === ''` and the hostname matches
     `PREVIEW_HOST = /^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$/`. Derived from the real
     preview host `portfolio-site-git-harness-merg-e67481-mh550s-projects-e64e7e0b.vercel.app` (PR #16's Vercel
     comment): Vercel's preview hosts are `<project>-git-<branch>-<team>` or `<project>-<hash>-<team>`, here project
     `portfolio-site` and team slug `mh550s-projects`, with a hash suffix when the name is truncated. Checked on
     2026-10-20 with `new URL(...).hostname` + this regex: the real host and `portfolio-site-abc123-mh550s-projects.vercel.app`
     match; `evil-mh550s-projects-e64e7e0b.vercel.app` and `portfolio-site-x-mh550s-projects.vercel.app.evil.example`
     do not.
   - Development only (`dev` true): `url.protocol === 'http:'` and hostname `localhost` or `127.0.0.1`, any port.
4. Anything else → false.

What it does and doesn't stop: a browser always sends `Origin` on a POST and a page's script can't change it, so
another website can't spend Michael's money through its visitors' browsers, and a bare `curl` gets 403. A shell can
still forge the header (and someone could name a Vercel project to fit the preview pattern): the route's room limits,
the agent's caps and the provider caps are what bound cost. The plan records this so nobody reads 403 as auth.

## Address hash

In `src/lib/concierge/limits.ts`, all pure:

- `addressOf(headers: Headers): string`: the first comma-separated entry of `x-forwarded-for`, trimmed; `'unknown'`
  when the header is absent or that entry is empty. On Vercel the platform overwrites `x-forwarded-for` with the
  client's address, so a visitor can't pick their bucket. `next dev` and `next start` fill a missing
  `x-forwarded-for` with the socket's remote address (`next/dist/server/base-server.js`, `??=`), so locally every
  tab of one browser shares a bucket (what the two-tab check wants), though a `curl` from `127.0.0.1` and a browser
  on `::1` can land in different ones. `'unknown'` (D64) is for a request with no header at all: in practice the
  Jest tests, which call `POST()` directly.
- `addressBucket(address: string, secret: string): string`: `createHmac('sha256', secret).update(address)
  .digest('hex').slice(0, 10)`, ten lowercase hex characters. Keyed with `LIVEKIT_API_SECRET`, so the bucket can't be
  reversed by hashing all IPv4 addresses without the secret.
- `roomNameFor(bucket: string): string`: `` `concierge-${bucket}-${randomBytes(6).toString('hex')}` ``
  (`/^concierge-[0-9a-f]{10}-[0-9a-f]{12}$/`). Room names are visible to whoever holds the token (it's in the JWT),
  which is the visitor themself: they see their own bucket, never anyone's address.
- A room is "this address's" when its name starts with `` `concierge-${bucket}-` `` (the trailing `-` matters).
- `roomsVerdict(rooms: { name: string }[], bucket: string, max: number): 'visitor' | 'site' | null`: rooms whose
  name doesn't start with `concierge-` are ignored (other uses of the LiveKit project); `'visitor'` if any is this
  address's; else `'site'` if the count of `concierge-` rooms is `>= max`; else `null`.
- `maxRooms(env: Record<string, string | undefined>): number`: `/^\d+$/` and `>= 1` → that number; anything else
  (`'0'`, `'-1'`, `'abc'`, `'2.5'`, undefined) → 2.
- The address and `addr10` are never logged or returned; tests assert it (§ Tests).

## Modules

| File | Kind | Exports | Imports |
|---|---|---|---|
| `src/lib/concierge/origin.ts` (new, VC5-03) | pure, no Node APIs | `isAllowedOrigin(origin: string \| null, opts: { siteUrl: string; dev: boolean }): boolean` | nothing |
| `src/lib/concierge/limits.ts` (new, VC5-03) | pure, `node:crypto` | `addressOf`, `addressBucket`, `roomNameFor`, `roomsVerdict`, `maxRooms` | `createHmac`, `randomBytes` |
| `src/lib/concierge/rooms.ts` (new, VC5-03) | `import 'server-only'` | `listLiveRooms(env: ConciergeEnv): Promise<{ name: string }[]>` | `RoomServiceClient` from `livekit-server-sdk`, `ConciergeEnv` type |
| `src/lib/concierge/env.ts` (VC5-03) | gains `import 'server-only'` on line 1 | unchanged | |
| `src/app/api/concierge/token/route.ts` (VC5-04) | uses all of the above + `profile` | `POST`, `runtime`, `dynamic` | |

`listLiveRooms(env)` = `new RoomServiceClient(env.url, env.apiKey, env.apiSecret, { requestTimeout: 5, failover:
false }).listRooms()` mapped to `{ name }`. The SDK turns `wss://` into `https://` itself (`TwirpRpc` constructor:
`host.replace("ws", "http")`). `requestTimeout: 5` and `failover: false` bound the wait at one 5 s attempt
(`AbortSignal.timeout`; the default is 10 s, and Cloud failover replays the call to other regions with backoff),
D68. VC5-03 adds it without wiring it; VC5-04 wires it.

`limits.ts` stays free of `server-only` (it takes the secret as an argument and reads no env), so its tests need no
mapping; `rooms.ts` and `env.ts` read or carry the secret, so they are server-only (§ server-only).

**Test strategy.** next/jest compiles with SWC, whose ES-module interop makes `jest.spyOn(module, 'export')` on a
module export unreliable. So:

- The limit tests live in a **new file** `src/__tests__/app/concierge-token-route-limits.test.ts`
  (`/** @jest-environment node */`) with
  `jest.mock('@/lib/concierge/rooms', () => ({ listLiveRooms: jest.fn() }))` (an explicit factory: an automock would
  load the real module) and the real `livekit-server-sdk` for signing.
- `concierge-token-route.test.ts` keeps mocking nothing (D42). It sends `Origin: https://michael-herron.vercel.app`
  on every case and gains the 403 cases. Its **200 cases move to the limits file** (D69 *default*): with the env
  set, a 200 now needs `listRooms`, which in an unmocked file would go to the network. What stays: every 503, 400
  and 403 case (none reaches `listLiveRooms`: 400 is decided before it).
- `concierge-token-route-sdk.test.ts` (spies on `AccessToken.prototype`, as today) also mocks
  `@/lib/concierge/rooms` with the same factory, so it can show a bad id and a 403 reach neither the SDK nor
  `listLiveRooms`.
- Both files that mock rooms set `jest.mocked(listLiveRooms).mockResolvedValue([])` in `beforeEach`: a bare
  `jest.fn()` resolves to `undefined`, `roomsVerdict(undefined, …)` throws, and the sdk file's existing 500
  `token_failed` case would fail before `toJwt` runs.

## /talk busy states

- Copy (`src/lib/data/concierge.ts`, `talkPage.status`, VC5-05): `busyVisitor: 'You already have a conversation open
  in another tab.'`, `busySite: 'The concierge is busy right now. Try again in a few minutes.'`.
- Reducer (`sessionReducer.ts`): `export type BusyReason = 'visitor' | 'site'`; `Phase` gains `'busy'`;
  `SessionState` gains `busyReason: BusyReason | null` (`null` in `initialSession`); action
  `{ type: 'busy'; reason: BusyReason }`:
  - from `connecting` only → `{ ...state, phase: 'busy', busyReason: action.reason }`; from any other phase (a late
    answer after Leave, or `live`) → unchanged state.
  - `connect` is allowed from `busy` (as from `idle`, `offline`, `ended`) and resets to `initialSession` + connecting,
    which clears `busyReason`; `leave` resets as today.
  - `inRoom('busy')` is false (no Room exists), so memory, metrics, lines, mic and audio actions are ignored there.
- `TalkSession.tsx`: `fetchCredentials` returns
  `{ kind: 'ok'; url; token } | { kind: 'busy'; reason: BusyReason } | null`. `kind: 'busy'` only for status 429
  with a JSON body `{ error: 'busy', reason: 'visitor' | 'site' }`; a 429 with any other body, a 403, a 503, a 500
  or a throw is `null` → offline as today. On busy: `release(session)` (no Room was made yet, so no Room and no
  `RoomAudio`), `dispatch({ type: 'busy', reason })`. No timer, no second fetch: the visitor presses Connect again.
- Render: the status line shows `busyVisitor` or `busySite` by `busyReason`; the primary button reads Connect
  (`inRoom` false) and keeps focus (it is the same element; VC5-06 checks `document.activeElement`); no mic toggle;
  the deep-dive link shows under `busy` as under `offline` (*default*, part of D66: something to read while waiting).
- The livekit-client import that starts beside the fetch (`Promise.all([import('livekit-client'), …])`) still starts
  on a configured Connect; on busy its result is unused. Not worth a second round trip to defer it.

**As built (VC5-05).** As above. `fetchCredentials` reads the body of an OK reply or a 429 only; a 429 is busy only
for `error === 'busy'` and a `reason` of `visitor` or `site`, so a busy-shaped body on a 503 is still offline. The
status line is one `statusLine` value computed before render. The protection sentence is appended to
`caseStudy.method.build` (the default place) and has its row in the brief's § Sentences with digits;
`docs/notes/voice-concierge-todo.md` § Cost protection names the three layers and where each is changed.

## server-only

- `package.json` `dependencies`: `"server-only": "0.0.1"` (exact, no caret; the only published version), installed
  with `npm install --save-exact server-only@0.0.1` so `package-lock.json` updates. Michael approved it (spec
  § VC5.3); recorded as D67.
- `import 'server-only';` on line 1 of: `src/lib/concierge/env.ts` (reads `LIVEKIT_*`) and
  `src/lib/concierge/rooms.ts` (carries the secret into the SDK). The route file is server code by construction
  and needs no marker. `origin.ts` and `limits.ts` don't import it (no env, secret only as an argument).
- `server-only`'s `index.js` throws unless the `react-server` export condition picks `empty.js`. Jest needs no new
  mapping: next/jest already maps `^server-only$` to its empty mock (`node_modules/next/dist/build/jest/jest.js`,
  "Disable server-only"), so the tests that import `env.ts` (the route tests, `concierge-env.test.ts`, the `/talk`
  page test) keep working. Don't add a mapper of our own.
- What it buys: a Client Component that imports `env.ts` or `rooms.ts`, directly or through a shared file, fails
  `next build` instead of shipping the module to the browser.
- The unconfigured-Connect test (VC5-03): not `jest.isolateModules` around a render (the isolated registry would
  load its own `react`, and `useReducer` fails with "Invalid hook call" against the outer react-dom). Instead a
  **new file** `src/__tests__/components/talk/TalkSession-import.test.tsx` with a hoisted counting factory:
  `let mockLoads = 0; jest.mock('livekit-client', () => { mockLoads++; return jest.requireActual('@/__mocks__/livekit-client'); });`.
  Render with `configured={false}`, click Connect, flush: `mockLoads` 0 and the status is offline. A second case
  (`jest.resetModules` is not needed: the factory runs once per registry) renders with `configured` and a fetch
  stub, clicks Connect and sees `mockLoads` 1, so the zero is not vacuous. VC5-03 step 4 allows "an equivalent
  module-registry spy"; this is it. `src/app/talk/page.tsx` imports
  nothing from `livekit-client` (`grep -rl livekit-client src/app` is empty today and stays so).

**As built (VC5-03).** `server-only@0.0.1` is in `dependencies` (exact) and `package-lock.json`. The modules that
import it are exactly `src/lib/concierge/env.ts` and `src/lib/concierge/rooms.ts` (line 1 of each); `origin.ts` and
`limits.ts` don't. `rooms.ts` is not called by the route yet (VC5-04 wires it). In `TalkSession-import.test.tsx` the
test reaches the mock through `jest.requireActual('@/__mocks__/livekit-client')`, never a static import: that path
is the file `livekit-client` maps to, so Jest keys the `jest.mock` factory to it and a static import of it runs the
factory at load (the count would start at 1). Checked by moving the `configured` guard below the import in
`TalkSession.tsx`: the unconfigured case then fails with `mockLoads` 1. Tests 1017 → 1052 (80 suites): the four new
files `concierge-origin`, `concierge-limits`, `concierge-rooms` and `TalkSession-import`. An Opus review found no
Critical issue. Applied: `maxRooms` also requires `Number.isSafeInteger` (a 20-digit value, or 400 nines = Infinity,
would switch the site cap off), and the tests pin `'03'` → 3, `:443` and a trailing-dot host → false. Not applied
(a question in D64): `PREVIEW_HOST` also matches a project someone else names `portfolio-site-…-mh550s-projects`;
the alternative is to allow exactly `https://$VERCEL_URL` and `https://$VERCEL_BRANCH_URL`. Not covered:
`http://[::1]:<port>` is refused in dev (browse `localhost` instead).

## Tests

Base 1012 tests / 76 suites. Each build feature adds or edits:

| Feature | File | What it proves |
|---|---|---|
| VC5-02 | `src/__tests__/components/talk/TalkSession-live.test.tsx` | after `connect()` resolves with no agent, `localParticipant.setMicrophoneEnabled` has 0 calls; after `addAgent(room)`, exactly one call `[true]`; with the agent already present at connect, one call; the existing toggle tests pass |
| VC5-02 | `src/__tests__/components/talk/TalkSession.test.tsx` | 0 mic calls on the 10 s offline path (fake timers, `AGENT_JOIN_TIMEOUT_MS`) and with `configured={false}`; no "Mute microphone" / "Unmute microphone" button while waiting, one once live |
| VC5-03 | `src/__tests__/lib/concierge-origin.test.ts` (new) | every case in VC5-03 step 1, plus the trailing-slash origin → false |
| VC5-03 | `src/__tests__/lib/concierge-limits.test.ts` (new) | every case in VC5-03 step 2; the HMAC computed in the test with `createHmac` |
| VC5-03 | `src/__tests__/lib/concierge-rooms.test.ts` (new, node env) | with `livekit-server-sdk` mocked by a factory: `RoomServiceClient` built with `(url, apiKey, apiSecret, { requestTimeout: 5, failover: false })`, `listRooms` result mapped to `{ name }`, a rejection propagates |
| VC5-03 | `src/__tests__/components/talk/TalkSession-import.test.tsx` (new) | the hoisted counting `jest.mock('livekit-client')` above: 0 loads on an unconfigured Connect, 1 on a configured one. Its own file because the factory runs once per module registry: in `TalkSession.test.tsx`, any earlier configured Connect would have loaded the module already and made a 0 meaningless |
| VC5-04 | `src/__tests__/app/concierge-token-route.test.ts` | Origin on every case; no Origin → 403 with no env (Origin before env, D63); `https://evil.example` → 403 with env set; `http://localhost:7834` → 503 under `NODE_ENV` test, 403 with `NODE_ENV` `'production'` for that case via `jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' })` (restored by `jest.restoreAllMocks()`; a plain assignment is a type error, Next declares `NODE_ENV` readonly, and `tsconfig` includes the tests, so `next build` would fail; the route reads it per request, so this is the seam); the 200 cases leave (D69) |
| VC5-04 | `src/__tests__/app/concierge-token-route-limits.test.ts` (new, node env, rooms mocked) | VC5-04 step 3: `[]` → 200 with `video.room` matching the room regex and the bucket equal to the test's HMAC of `'203.0.113.9'` (from `x-forwarded-for: 203.0.113.9, 10.0.0.1`); identity and dispatch metadata as VC1; plus the VC1 200 cases moved here (claims on a frozen clock, `TokenVerifier`, two calls two rooms, extra body fields ignored, body keys exactly `token`, `url`); this bucket's room → 429 visitor; two others → 429 site; three others and `CONCIERGE_MAX_ROOMS=4` → 200; rejection → 503 offline; no `x-forwarded-for` → the `'unknown'` bucket; no body text and no `console.*` spy call contains `'203.0.113.9'` or the bucket |
| VC5-04 | `src/__tests__/app/concierge-token-route-sdk.test.ts` | a bad id reaches neither SDK spy nor `listLiveRooms`; a 403 reaches none of them |
| VC5-05 | `src/__tests__/components/talk/sessionReducer.test.ts` | busy from connecting (reason kept); ignored from live, waiting, idle; connect from busy → connecting with `busyReason` null; leave from busy → initial; `inRoom('busy')` false |
| VC5-05 | `TalkSession.test.tsx` | 429 `{error:'busy', reason:'visitor'}` and `'site'` show their lines and Connect; a 429 with `reason: 'other'` reads offline; no Room made (`MockRoom` instances 0); `fetchMock` 1 call over 15 s of fake timers; mic never requested |
| VC5-05 | `src/__tests__/lib/case-study-voice-concierge.test.ts`, `content-guard.test.ts` | green after the protection sentence, which is copied verbatim into `docs/notes/evidence-voice-concierge.md` § Sentences with digits |

Fake secrets follow the VC1 plan's content-guard rule (`'x'.repeat(32)`, never a quoted 12+ char literal after
`secret =`). Under fake timers click with `fireEvent` and flush inside one `act` (CLAUDE.md § Testing).

## Live check (Michael)

Build-only: the harness never runs any of this. Run each stage on the PR's preview deployment, in order, and stop
at the first stage that doesn't match. `<preview>` is the preview URL from the PR's Vercel comment, e.g.
`https://portfolio-site-git-harness-merg-e67481-mh550s-projects-e64e7e0b.vercel.app`.

**Stage 1: Origin, before any env is set** (the preview has no `LIVEKIT_*` yet, or use a preview without them):

```bash
P=<preview>
curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
  -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'                                  # expect 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
  -H 'Origin: https://evil.example' -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'  # expect 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
  -H "Origin: $P" -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'                  # expect 503
```

If the third prints 403, the preview host doesn't match `PREVIEW_HOST` (§ Origin rules): paste the host into the
progress log or INBOX and the regex gets fixed. LiveKit Cloud's room list: no change (no token was signed).

**Stage 2: one visitor, two tabs** (set the three `LIVEKIT_*` for **Preview** only, redeploy, start the worker):

1. Tab A: `/talk` → Connect → Connected; the browser asks for the microphone only once "Connected" shows.
   LiveKit Cloud → Rooms: one room `concierge-<10 hex>-<12 hex>` with two participants (you and the agent).
2. Tab B (same browser): Connect → "You already have a conversation open in another tab.", Connect visible, no mic
   prompt. Room list: still one room.
3. Tab A: Leave. Watch the room list and note how many seconds the room stays. Then Tab B: Connect. If it still
   says "another tab" while the room is listed, that is the known window (D68): a room counts until LiveKit closes
   it. If the room stays for minutes (the agent keeps the room after the visitor leaves), tell the run: either the
   agent deletes its room when the visitor leaves (an agent-repo change) or the route counts only rooms with a
   `visitor-` participant (an extra `listParticipants` call; D68's alternative).
4. Re-run the stage 1 curls: 403, 403, and the third now prints 200 (a token is signed but nobody joins, so no room
   appears and nothing is spent), or 429 if a conversation from the same address or two others are live.

**Stage 3: the site cap** (`CONCIERGE_MAX_ROOMS` unset = 2): with two conversations live (a laptop, and a phone
on cellular so it has another address; the room list shows two `concierge-` rooms with different 10-hex parts), a
second device on yet another network presses Connect → "The concierge is busy right now. Try again in a few
minutes." and no mic prompt. Room list: still two.

**Stage 4: production.** Only after stages 1–3 hold: add the three `LIVEKIT_*` to Production (and
`CONCIERGE_MAX_ROOMS` only if you want other than 2), merge, and repeat stage 1's first two curls against
`https://michael-herron.vercel.app` (403, 403), then one Connect on the live site. Room list: one new
`concierge-` room while it lasts; after Leave it should go as fast as it did in stage 2.

**Undo:** the site cap too tight → set `CONCIERGE_MAX_ROOMS` higher in Vercel (Preview and/or Production) and
redeploy; remove it to go back to 2. The route itself → revert the VC5-04 commit (the VC1 route returns, with no
Origin check and no limits). Everything off → remove the three `LIVEKIT_*` (503, `/talk` offline).

**The agent repo.** The VC5 spec says the agent doesn't parse room names (`voice-concierge/concierge/*.py`). That
could not be checked in this run: `ls ~/projects/voice-concierge` on 2026-10-20 shows only `CLAUDE.md`, `docs`,
`knowledge` and `README.md`, no `concierge/` code. Michael confirms it against `mh550/voice-concierge`
(`grep -rn 'room.name\|room_name' concierge/`): nothing may split the name on `-` or expect
`concierge-<12 hex>`. The agent's 5 sessions a day and 10-minute caps (`concierge/limits.py`) are taken from the
spec, not read.

## CLAUDE.md text (drafted here; VC5-04 and VC5-07 write it)

Routes table, `/api/concierge/token` row:

> POST `{visitor_id}` (UUID v4), checked in order: 403 `{error:'forbidden'}` unless the Origin is the site, a
> `portfolio-site-…-mh550s-projects` preview or (dev only) localhost (`origin.ts`); 503 `{offline:true}` without the
> three `LIVEKIT_*` env vars; 400 on a bad body; 503 if `listRooms` fails (`rooms.ts`); 429 `{error:'busy',
> reason:'visitor'|'site'}` when this address (HMAC bucket of `x-forwarded-for`) has a live room or
> `CONCIERGE_MAX_ROOMS` (default 2) are live (`limits.ts`); else a 10-minute LiveKit token for room
> `concierge-<addr10>-<12 hex>` that dispatches agent `concierge` (`route.ts`, plans
> `docs/plans/2026-10-20-VC1-token-route.md`, `docs/plans/2026-10-20-VC5-mic-limits-server-only.md`)

Architecture, `lib/concierge/` line: add "the Origin allowlist (`origin.ts`), the address bucket and room limits
(`limits.ts`, pure) and the server-only room list (`rooms.ts`)". Code rules: "`server-only` is approved at
`0.0.1` exact (D67); `env.ts` and `rooms.ts` import it". Testing: "`concierge-token-route-limits.test.ts` mocks
`@/lib/concierge/rooms` with a factory (`mockResolvedValue([])` by default); next/jest maps `server-only` to an empty mock". Commands: the new
test and suite counts.

## What Michael will see

Filled by VC5-06. `/talk` asks the route only when the server has LiveKit env (D46), so the captures come from the
harness dev server on 7834 restarted with dummy values (`LIVEKIT_URL=wss://livekit.invalid`, a made-up key and
secret) and put back to no env after; `.harness/talk-busy-check.mjs` fulfils every `POST /api/concierge/token` with
`page.route`, so neither the route nor LiveKit is reached. Connect is pressed from the keyboard (focus + Enter).
Measured in every state: Connect's bottom edge at the top of the page is y 664 at 390 × 844 (above the fold) and
y 489 at 1280 × 800; `scrollWidth` 390 at 390 and 1280 at 1280; one token POST per press over 15 s (busy-visitor 390 and offline: two presses,
two POSTs; 2 s for the 1280 capture); `getUserMedia` (overridden with a counter before Connect) 0 calls; no mic
toggle; after the reply `document.activeElement` is the button "Connect", `:focus-visible` true, outline solid
`rgb(0, 212, 255)`; console errors only Chromium's own "Failed to load resource: … status of 429 (Too Many
Requests)" / "503 (Service Unavailable)" line, once per POST; 0 page errors. The Next.js dev badge (the "N" bottom
left) is dev-only.

| Capture or command | State | What is on screen or printed | Anything that looks wrong |
|---|---|---|---|
| `VC5-talk-busy-visitor-390.png` (56 KB) | 429 `{error:'busy', reason:'visitor'}`, 390 × 844, top of page | Eyebrow, h1, intro; Connect (focus ring) with "You already have a conversation open in another tab." on two lines under it; "Read how it works"; the Transcript panel starts at the fold. No mic toggle, no widget | Nothing in the layout. The wording is D71's open question (also shown for ~30 s after Leave, and to a second visitor on the same NAT) |
| `VC5-talk-busy-site-390.png` (57 KB) | 429 `{error:'busy', reason:'site'}`, 390 × 844 | As above with "The concierge is busy right now. Try again in a few minutes." on two lines | Nothing |
| `VC5-talk-busy-visitor-1280.png` (73 KB) | 429 visitor, 1280 × 800 | Navbar (Talk active), intro; Connect and the visitor line on one row; "Read how it works"; Transcript left, What it remembers and Latency right | Nothing |
| `VC5-talk-offline-503-390.png` (55 KB) | 503 `{offline:true}`, 390 × 844 | As the busy captures with "The concierge is offline right now" on one line | The offline line has no full stop while both busy lines have one; it is the spec's exact wording (W2, pinned by `concierge-data.test.ts`), so left as is (question below) |
| `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:7834/api/concierge/token -H 'content-type: application/json' -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'` | No Origin, no env | `403` (body `{"error":"forbidden"}`) | Nothing: Origin is checked before env (D63) |
| the same with `-H 'Origin: https://evil.example'` | Foreign Origin | `403` | Nothing |
| the same with `-H "Origin: http://localhost:7834"` | Dev origin, no env | `503` (body `{"offline":true}`) | Nothing |

Question for Michael (copy): add a full stop to "The concierge is offline right now" so the three lines match? It
changes the spec's W2 wording and the pinned test; one line in `concierge.ts`.

## Review

## Decisions

Recorded in `docs/specs/2026-10-19-voice-concierge-page.md` § 7, each naming what it supersedes.

- **D63** *default* The Origin check runs before the env check: a shell POST gets 403 even on an offline site, so
  nothing about whether LiveKit is configured leaks to a caller from outside. Supersedes VC1's "env checked
  first" (`docs/plans/2026-10-20-VC1-token-route.md` § Route behaviour, row 1).
- **D64** *default* Without `x-forwarded-for` the address is `'unknown'`, one shared bucket (in practice only the
  Jest tests: Vercel sets the header, and `next dev`/`next start` fill it from the socket). The preview allowlist is the hostname regex
  `^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$` over `https:` with no port, derived from
  PR #16's preview host. Supersedes nothing (new). Question: does it match your current previews?
- **D65** *default* The mic toggle renders only in the `live` phase (was `waiting` or `live`), so nothing can ask
  for the microphone before the agent joins; `setMicrophoneEnabled(true)` moves into `agentArrived`. Supersedes
  the VC2 plan's state-table row "connecting → waiting: `setMicrophoneEnabled(true)`" and its "As built (VC2-05)"
  note (toggle in `waiting` and `live`).
- **D66** *default* A 429 puts `/talk` in a `busy` phase (reason kept, Connect shown, the deep-dive link shown as
  offline shows it) with no automatic retry; any other non-OK reply stays offline. Supersedes nothing (new phase).
- **D67** `server-only` at `0.0.1`, exact pin, as a dependency (Michael approved it, spec § VC5.3); `env.ts` and
  `rooms.ts` import it; next/jest already maps it to an empty mock. Extends D41's list of approved packages.
- **D68** *default* `listLiveRooms` uses one 5 s attempt (`requestTimeout: 5`, `failover: false`), and every room
  it lists counts as live, whatever its participants (fail closed on cost). Effect: after Leave, the address reads
  busy until LiveKit closes the room. Alternative if that window is long: count only rooms with a `visitor-`
  participant (`listParticipants` per room). Question: which do you want after stage 2 of the live check?
- **D69** *default* The token route's 200 cases move from `concierge-token-route.test.ts` to
  `concierge-token-route-limits.test.ts`, which mocks only `@/lib/concierge/rooms` (factory) and signs with the real
  SDK. `concierge-token-route.test.ts` stays mock-free. Refines D42 (the real SDK still signs every tested token).
  Overrides VC5-01 step 4's "only gains an allowed Origin header plus the 403 cases" (VC5-04 step 2 leaves it to
  the plan).
- **D70** *default* The visitor's own room name, and so their `addr10`, is inside their JWT (`video.room`); the
  address never is, and no body carries a bucket in plain text. The token TTL stays 600 s (VC1). Question: cut it
  to about 60 s to narrow the mint-then-join window (§ Route behaviour, known limits)?
