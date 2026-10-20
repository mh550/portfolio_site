# VC2 — The `/talk` page

Spec: `docs/specs/2026-10-19-voice-concierge-page.md` §2 W2, §3, §4 (the contract with the agent) and §5. VC2 has
seven features: VC2-01 (this plan), VC2-02 (contract parsers, latency maths, visitor id, copy), VC2-03 (the panels
and Forget me, from fixtures), VC2-04 (the page, connect, offline, the text streams), VC2-05 (mic, typing,
transcript, Forget me RPC, audio), VC2-06 (screenshots and measurements), VC2-07 (review, morning checklist,
CLAUDE.md). Policy is build-only: no LiveKit env in the suite, the smoke or the dev server, so the offline path is the
one every check sees. The live path is proven only in Jest, against the mocks below.

Every signature in § LiveKit calls is quoted from the installed packages (D41 pins: `livekit-client` 2.23.0,
`@livekit/components-react` 2.9.24, `@livekit/components-core` 0.12.15 under it). If a pin moves, re-check this
section before building on it.

## Files

| File | Feature | What it is |
|---|---|---|
| `src/app/talk/page.tsx` | VC2-04 | Server Component. `metadata` (title `Talk to my concierge — Michael Herron`, description `talkPage.description`), the eyebrow, one `h1`, the intro, `<TalkSession />`, the privacy note. Imports nothing from LiveKit |
| `src/components/talk/TalkSession.tsx` | VC2-04, VC2-05 | `'use client'`. Owns the one `Room`, the handlers, the 10 s timer and the session reducer; renders the controls, the status line, the panels, Forget me and the audio |
| `src/components/talk/RoomAudio.tsx` | VC2-07 | `'use client'`. `RoomContext.Provider` + `RoomAudioRenderer` for one `Room`; the only static import of `@livekit/components-react`. TalkSession loads it with `next/dynamic` (`ssr: false`) once a Room exists, and `livekit-client` with `import()` on Connect, so neither is in `/talk`'s first load |
| `src/components/talk/sessionReducer.ts` | VC2-04 | Pure reducer + `initialSession` + action types (see § State machine). No React, no LiveKit: unit-tested on its own |
| `src/components/talk/MemoryPanel.tsx` | VC2-03 | Presentational, no hooks (Server-Component-safe). Props `{ memory: MemoryBody \| null }` |
| `src/components/talk/LatencyPanel.tsx` | VC2-03 | Presentational, no hooks. Props `{ turns: MetricsBody[] }`; calls `summarise()` and `cachedShare()` |
| `src/components/talk/Transcript.tsx` | VC2-03 | `'use client'` (it scrolls to the newest line with a ref + effect). Props `{ lines: TranscriptLine[] }`; `aria-live="polite"` |
| `src/components/talk/ForgetMeButton.tsx` | VC2-03 | `'use client'` (confirm step state). Props `{ onForget: () => void; busy: boolean }` |
| `src/components/talk/TalkPanel.tsx`, `format.ts` | VC2-03 (built) | The bordered section + h2 every panel uses (fixed ids `talk-memory`, `talk-latency`, `talk-transcript`: one of each per page); `DASH`, `ms()`, `percent()`. `TranscriptLine` is exported from `Transcript.tsx`, which takes the MessageBox as `children` |
| `src/components/talk/MessageBox.tsx` | VC2-05 | Presentational form: label, input, Send. Props `{ disabled, onSend(text): Promise<boolean> }`; keeps the draft in local state, so `'use client'`, and clears it only when the send went (VC2-07) |
| `src/lib/concierge/contract.ts` | VC2-02 | §4 types (`MemoryBody`, `MemoryFact`, `MetricsBody`), topic and RPC constants, `parseMemory(text)`, `parseMetrics(text)`: typed object or `null`, never throws |
| `src/lib/concierge/latency.ts` | VC2-02 | `TURN_PATH_FIELDS` (VC2-07), `LATENCY_FIELDS`, `summarise(turns)`, `cachedShare(turn)`, `median(values)` |
| `src/lib/concierge/visitorId.ts` | exists (VC1-02); VC2-02 adds | `isUuidV4` (exists), `newUuidV4()`, `getOrCreateVisitorId(storage?)` |
| `src/lib/data/concierge.ts` | VC2-02 | `talkPage` (copy and labels), `privacyNote: string[]` (six entries), `latencyLabels`; exported from `src/lib/data/index.ts` |
| `src/__mocks__/livekit-client.ts` | VC2-04 | Jest mock: `MockRoom` + test helpers (§ Jest) |
| `src/__mocks__/livekit-components-react.tsx` | VC2-04 | Jest mock: `RoomContext`, `RoomAudioRenderer` |
| `src/__tests__/fixtures/concierge.ts` | VC2-02 | `memoryBody` (3 facts, voice and text, `name: null`, a summary), `metricsFull`, `metricsNulls`, `emptyMemory`, and their JSON strings |
| `src/__tests__/lib/concierge-contract.test.ts` | VC2-02 | parsers |
| `src/__tests__/lib/concierge-latency.test.ts` | VC2-02 | `summarise`, `cachedShare` |
| `src/__tests__/lib/concierge-visitor-id.test.ts` | exists; VC2-02 extends | `getOrCreateVisitorId`, `newUuidV4` |
| `src/__tests__/lib/concierge-data.test.ts` | VC2-02 | the six privacy points by keyword, no `http`/`.net`/digit other than 30, offline sentence exact |
| `src/__tests__/components/talk/{MemoryPanel,LatencyPanel,Transcript,ForgetMeButton}.test.tsx` | VC2-03 | one per component |
| `src/__tests__/components/talk/sessionReducer.test.ts` | VC2-04 | every transition in the table below |
| `src/__tests__/components/talk/TalkSession.test.tsx` | VC2-04 | connect, offline (503, non-OK, rejection, connect rejection, 10 s), handler order, unmount, streams into panels |
| `src/__tests__/components/talk/TalkSession-live.test.tsx` | VC2-05 | mic, typing, transcript segments, Forget me RPC, audio, Leave |
| `src/__tests__/components/talk/TalkSession-review.test.tsx` | VC2-07 | the § Review fixes: focus, double click, draft, failed send, Forget me after the call, reconnect, the bundle |
| `src/__tests__/pages/talk.test.tsx` | VC2-04 | the page: one h1, intro, privacy note, metadata |
| edits | VC2-04 | `jest.config.ts` (two mapper lines), `.harness/smoke-routes.txt` (`/talk`), `src/app/sitemap.ts` + `sitemap-robots.test.ts` (9 routes), `a11y-new-pages.test.tsx` (`/talk`), spec D44/D45 |

`/talk` is **not** added to the Navbar (D44).

## Component tree

```
app/talk/page.tsx (Server)
├─ ScrollReveal → eyebrow "Voice concierge", h1, intro          (talkPage)
├─ TalkSession ('use client')
│   ├─ controls: Connect/Leave (one button, VC2-07) · mic toggle (live) · status line
│   │    └─ offline: "The concierge is offline right now" + link to /projects/voice-concierge
│   ├─ RoomAudio room   (next/dynamic, only while a Room exists)
│   │    └─ RoomContext.Provider → RoomAudioRenderer  (hidden <div>, one <audio> per remote audio track)
│   ├─ section "Transcript"  → Transcript lines + MessageBox
│   ├─ section "What it remembers" → MemoryPanel memory
│   ├─ section "Latency" → LatencyPanel turns
│   └─ ForgetMeButton onForget busy         (live only)
└─ section "Privacy" → privacyNote as a list                  (Server, after TalkSession)
```

The header and the privacy note are server-rendered; nothing in TalkSession's first render reads storage, time or
LiveKit, so the server HTML and the first client render are identical (no hydration warning). Facts carry
`learned_at`, formatted with the visitor's locale and time zone, but a fact only ever arrives on the client from a
stream, so that formatting never runs on the server.

## State machine

```
            Connect                 200 {url, token}           agent present / joins
  idle ─────────────▶ connecting ─────────────────▶ waiting ─────────────────────▶ live
   ▲  ▲                 │  503, non-OK,               │  10 s after connect()         │  │
   │  │                 │  fetch rejects,             │  resolved, no agent           │  │ agent leaves,
   │  │                 │  connect() rejects          ▼                               │  │ RoomEvent.Disconnected
   │  │                 └──────────────────────────▶ offline ◀─────────────────────────┘  │ (not ours)
   │  │                                               │ Connect (Try again)              ▼
   │  └────────────── Leave (from connecting, waiting, live, ended, offline) ◀──────── ended
   │                                                                    Connect again ──▶ connecting
```

`Phase = 'idle' | 'connecting' | 'waiting' | 'live' | 'ended' | 'offline'`. Session state (one `useReducer`):

```ts
interface SessionState {
  phase: Phase;
  agentIdentity: string | null;   // set on entering live; the RPC destination
  memory: MemoryBody | null;
  turns: MetricsBody[];           // every metrics body this session, in arrival order
  lines: TranscriptLine[];        // { key, who: 'visitor' | 'agent', text, final }
  micBlocked: boolean;            // live sub-state: the session stays live
  micOn: boolean;
  forget: 'idle' | 'busy' | 'done' | 'failed';
}
```

| From | Event | To | Effect |
|---|---|---|---|
| idle, offline, ended | Connect clicked | connecting | `getOrCreateVisitorId(browserStorage())` (reading `window.localStorage` itself throws when storage is blocked; `browserStorage()` returns `undefined` then, VC2-02) **in the click handler**; `fetch('/api/concierge/token', POST)`; panels cleared |
| connecting | fetch rejects, `res.status === 503`, `!res.ok`, or the body lacks string `url`/`token` | offline | nothing to release (no Room yet) |
| connecting | 200 `{url, token}` | connecting | `new Room()`; register the three handlers; add room listeners; `await room.connect(url, token)` |
| connecting | `connect()` rejects | offline | teardown (unregister, off, `disconnect()`) |
| connecting | `connect()` resolves, an agent is in `room.remoteParticipants` | live | `setMicrophoneEnabled(true)`; `startAudio()` if `!canPlaybackAudio` |
| connecting | `connect()` resolves, no agent | waiting | start the 10 000 ms timer; `setMicrophoneEnabled(true)` |
| waiting | `ParticipantConnected` with `kind === ParticipantKind.AGENT` | live | clear the timer; `agentIdentity = p.identity`; `startAudio()` if needed |
| waiting | timer fires | offline | teardown |
| live | `setMicrophoneEnabled` rejects | live | `micBlocked = true` ("Microphone blocked. You can still type.") |
| live | `ParticipantDisconnected` for `agentIdentity` (checked a microtask later: not while `room.state` is `Reconnecting`, since a full reconnect unwinds every participant first, VC2-04 review), or `RoomEvent.Disconnected` | ended | teardown; transcript, memory and latency stay visible |
| live | Forget me → Erase | live | `forget = 'busy'`; `performRpc(...)`; `{ok:true}` → `memory` = empty, `forget = 'done'` ("Forgotten"); rejection or other reply → `forget = 'failed'`, button re-enabled, error line |
| any but idle | Leave clicked | idle | teardown; everything cleared (`initialSession`) |
| any | unmount | — | teardown |

Rules the reducer and TalkSession keep:

- **One Room per Connect, created in the click handler**, never in an effect, so React StrictMode's double mount
  cannot create or register anything twice. The only effect is the unmount cleanup, `useEffect(() => () =>
  teardown(), [])`; under StrictMode its first (simulated) run finds no Room and does nothing.
- **The session lives in a ref** (`sessionRef.current = { room, timer, alive }`): teardown, the timer and the async
  continuations read it. The Room is also kept in state (`useState<Room | null>`) only because
  `RoomContext.Provider` needs it during render and `react-hooks` 7 (installed, via `eslint-config-next`) forbids
  reading refs in render. Both are set and cleared together in `connect()` and `teardown()`; nothing else writes them.
- **Teardown is one function**, idempotent: `alive = false`; `clearTimeout(timer)`; `room.off(...)` for each
  listener **before** `disconnect()` (so our own disconnect does not dispatch `ended`); unregister the three topics;
  `void room.disconnect()`; null the ref and the state. Every `await` in `connect()` checks `session.alive` after it
  resumes, so a Leave during `connecting` cannot bring a session back.
- **The 10 s timer starts when `connect()` resolves** (VC2-04 step 4). The token fetch has no timer of its own: the
  route is a local signing call and answers fast; `room.connect()` has the SDK's own connect timeouts and rejects on
  failure, which lands in `offline`. If the review finds a hang there, add `AbortSignal.timeout` on the fetch.
- **The mic turns on after `connect()` resolves** (no extra click: the morning check is "Connect, say your name").
  The toggle then calls `setMicrophoneEnabled(false | true)`. A rejection (e.g. `NotAllowedError`) only sets
  `micBlocked`; typing still works. The toggle's click also calls `room.startAudio()` when `!canPlaybackAudio`, since
  it is a user gesture.
- **Forget me shows only in `live`** (the RPC needs the agent's identity). After `{ok:true}` the agent sends one last
  empty `concierge.memory` and ends the session (§4), which lands in `ended` with the panel already empty.
- **`concierge.get_memory` is not called**: the agent sends `concierge.memory` at session start (§4).
- **As built (VC2-05):** the mic toggle shows in `waiting` and `live` (the room is connected in both; the mic is
  already on). Its label says what a press does (`Mute microphone` / `Unmute microphone`), with no `aria-pressed`,
  so the name and the state never contradict. `micBlocked` replaces the live status line; a later press that works
  clears it. Overlapping presses each flip what was last asked for (`session.micWanted`), and only the newest
  call's answer (`session.micSeq`) reaches the label. `RoomEvent.AudioPlaybackStatusChanged` (and a check once
  `connect()` resolves) sets `audioBlocked`, which shows a **Turn on sound** button calling `startAudio()` (the user
  gesture browsers want); `startAudio()` is also tried after `connect()` and on each mic or Send click.
  The text box is enabled only in `live`; a failed `sendText` is dropped quietly (the typed line stays). The Forget
  me answer is shown unless the visitor has left or connected again, so "Forgotten" stays after the agent ends the
  call; it sits in an always-present `aria-live` line under the button. A second Forget me while one is in flight sends nothing (`session.forgetting`). `isForgotten(reply)` in `contract.ts`: only a
  JSON object with `ok === true` counts. The Room is kept in state (`useState`) for `RoomContext.Provider`, set in
  `connect()` and cleared with the session.

## What Michael will see

VC2-06, 2026-10-20. Captures and measurements from the harness dev server (port 7832, no `LIVEKIT_*` env, so the
token route answers 503 and Connect lands in offline), 390 × 844 and 1280 × 844, `reducedMotion: 'reduce'`, after
scrolling top to bottom and back; full pages saved as 256-colour palette PNGs with sharp (script:
`$HARNESS_SCRATCH/vc2-shots.mjs`). The round "N" at the left is the Next dev indicator, not on the live site.

- **Above the fold at 390 × 844:** h1 `y 180 → bottom 300`; Connect `y 624 → bottom 664`. Offline: the status line
  ends at 700 and "Read how it works" at 747, so both show without scrolling. At 1280: h1 ends at 255, Connect at 489.
- **Horizontal scroll:** `document.documentElement.scrollWidth` = 390 idle and 390 offline (1280 at 1280).
- **Errors:** 0 page errors in either state; 0 console errors idle. Offline has one console line, Chromium's own
  network log for the token POST: `Failed to load resource: the server responded with a status of 503`. W1 requires
  that 503 and page code can't silence it; nothing in the page logs an error.
- **Keyboard:** Tab from the top reaches Skip to content → MH → (1280) Home, About, Skills, Projects, Approach,
  Experience, Contact / (390) Open menu → Connect. Every stop matches `:focus-visible` with a 2 px solid
  `rgb(0, 212, 255)` outline. The Navbar links and Connect have `transition-colors`, which in Tailwind 4 also fades
  `outline-color` over 150 ms, so the colour is read 300 ms after each Tab (read at once it is mid-fade).

| Page and state | What is on screen | Anything wrong |
|---|---|---|
| `/talk` idle · 390 (`docs/screenshots/v2/VC2-talk-390.png`, 39 KB, 390 × 1805) | Hamburger navbar; eyebrow "VOICE CONCIERGE"; h1 "Talk to my concierge" on two lines; the two intro paragraphs; Connect. Then stacked: Transcript ("Nothing said yet.", the disabled message box and Send), What it remembers ("Nothing remembered yet"), Latency ("No turns yet."); the Privacy list (six points); footer | Nothing to fix |
| `/talk` offline · 390 (`VC2-talk-offline-390.png`, 41 KB, 390 × 1889) | As idle, with Connect back and "The concierge is offline right now" under it, then the accent link "Read how it works" (`/projects/voice-concierge`), above the fold; one POST to the token route, 503 | The link 404s until VC3-02 builds the deep-dive (expected, the run's next milestone). Nothing to fix in VC2 |
| `/talk` idle · 1280 (`VC2-talk-1280.png`, 51 KB, 1280 × 1612) | Full navbar (no Talk link, D44); h1 on one line; intro in a 768 px column; two columns: Connect over the Transcript panel on the left (7 fr), What it remembers and Latency on the right (5 fr), tops level with Connect; Privacy list; footer | The empty transcript log is tall (about 450 px) before anyone speaks. It is the log's fixed height, kept so the page doesn't jump when lines arrive; left as is |

## Review

VC2-07: an Opus review of `git diff d4c7d58..HEAD` (the whole of VC2, `$HARNESS_SCRATCH/VC2.diff`, 3 981 lines without
captures and run files) with the vercel-react-best-practices and web-design-guidelines skills. Every Critical and
Important finding was fixed with a failing test first (`TalkSession-review.test.tsx` unless named). The two focus
fixes and the double-click guard were also mutation-checked: removing each fix turns its test red.

| File | Finding | Severity | Outcome |
|---|---|---|---|
| `TalkSession.tsx` | Connect and Leave were different elements, so pressing either one dropped focus to `<body>`, and so did every phase change after it | Important | Fixed: one button whose label and handler switch, so it keeps focus; when a call ends with focus lost (Forget me unmounting, the input disabled) an effect hands it to Connect, never on page load. 4 tests |
| `TalkSession.tsx` | `livekit-client` and `@livekit/components-react` were static imports: 626 KB raw / 163 KB gz in `/talk`'s first load, offline visits included | Important | Fixed: `import('livekit-client')` on Connect, alongside the token request (a failed load reads as offline); new `RoomAudio.tsx` through `next/dynamic`. In the new build the LiveKit chunk (151 KB gz) is not in `talk/page_client-reference-manifest.js`; TalkSession's own chunk is 7 KB gz. Test: only `RoomAudio.tsx` imports LiveKit values statically |
| `TalkSession.tsx` | Leave appears where Connect was: a double click on Connect connected and left at once | Minor | Fixed: Leave ignores `event.detail > 1` |
| `ForgetMeButton.tsx` | After Erase, Forget me came back `disabled`, so focus sat on `<body>` through the RPC and for good once the call ended (VC2-05's Minor (b)) | Minor | Fixed: `aria-disabled` + a guard; focus is on Forget me at once and goes to Connect when the agent ends the call |
| `TalkSession.tsx`, `MessageBox.tsx` | A failed `sendText` still showed the typed line, and the draft was gone (Minor (a)) | Minor | Fixed: `onSend` returns `Promise<boolean>`; the line is added and the draft cleared only on success (and only if not typed over). 2 tests |
| `MessageBox.tsx` | The draft survived Leave into the next session (Minor (d)) | Minor | Fixed: `key` on the box, a count of Connects, so every session (after Leave, an ended call or offline) starts empty. 2 tests |
| `TalkSession.tsx` | A Forget me that failed after the call dropped said "Try again." with no button (Minor (e)) | Minor | Fixed: `forgetFailedEnded`, "Forget me didn't go through. Connect again to retry." |
| `TalkSession.tsx` | A full reconnect that outlasts the agent leaves the page live with nobody there (no participant events after a restart) | Minor | Fixed: on `RoomEvent.Reconnected`, no agent in `remoteParticipants` ends the call. 2 tests |
| `TalkSession.tsx` | A failed load of the LiveKit or `RoomAudio` chunk after Connect | Minor | Fixed with the bundle fix: both load in one `Promise.all` before the Room exists; a failure reads as offline, so `next/dynamic` never meets an unloaded chunk |
| `ForgetMeButton.tsx` and four others | `@/lib/data` barrel in client files put all project data in the `/talk` chunk | Minor | Fixed: `@/lib/data/concierge`. Test: no talk component imports the barrel |
| `TalkSession.tsx` | The mic label ignores mutes LiveKit doesn't report through `setMicrophoneEnabled` (server `TrackMuted`; a device pause, iOS call) (Minor (c)) | Minor | Left: the device pause (`pauseUpstream`) emits no room event, so a fix would cover only server mutes, which this agent doesn't send. Revisit with a live call |
| `TalkSession.tsx` | Leave or unmount while the mic permission prompt is open, then grant it: LiveKit keeps the track for up to 15 s waiting for a signal connection (mic indicator lit) | Minor | Left: the fix is publishing a self-made track (`createLocalAudioTrack` + `publishTrack`) and stopping it in teardown; more code than the case is worth tonight |
| `sessionReducer.ts` | `state.agentIdentity` duplicated `session.agentIdentity` and was never read | Simplify | Done: removed from state and the `agentJoined` action |
| `TalkSession.tsx` | `session.forgetting` repeated `forget === 'busy'` | Simplify | Done: one guard, on the reducer's state |
| `TalkSession.tsx` | `endSession`, `goOffline` and `dropped` each repeated teardown + `setRoom(null)` | Simplify | Done: `release(session)`. `goOffline`/`dropped` still leave the session in `sessionRef`, so a late Forget me answer shows |
| `TalkSession.tsx` | `inSession` re-implemented the reducer's `inRoom` | Simplify | Done: `inRoom` exported and reused |
| `LatencyPanel.tsx`, `latency.ts` | `TURN_ROWS` repeated `LATENCY_FIELDS`, and `summarise` computed medians nothing shows | Simplify | Done: `TURN_PATH_FIELDS` in `latency.ts`; `LATENCY_FIELDS` is the seven fields the panel shows |

A second Opus pass read the fixes (`$HARNESS_SCRATCH/VC2-07-fixes.diff`) and found what they broke; all fixed, test-first:

| File | Finding | Severity | Outcome |
|---|---|---|---|
| `MessageBox.tsx` | With the draft kept until `sendText` answers, Enter pressed twice sent the message twice | Important | Fixed: a `pending` ref; a second submit while one is out sends nothing. Test "Enter pressed twice before the send answers sends once" |
| `TalkSession.tsx` | One persistent button: a held Enter on Connect auto-repeats onto Leave (keyboard clicks have `detail` 0) | Minor | Fixed: `onKeyDown` cancels `event.repeat`. Test fires a repeat keydown (user-event never sets `repeat`) and expects it cancelled; mutation-checked |
| `TalkSession.tsx` | The focus hand-off could scroll the page when a call ends after the visitor tapped plain text | Minor | Fixed: `focus({ preventScroll: true })` |
| `TalkSession.tsx` | A draft still survived ended/offline → Connect; a send answered just as the call dropped kept its draft | Minor | Fixed: key on a Connect count; a resolved `sendText` counts as sent even if the session ended |

Known noise: the test "a draft from a call that ended is gone in the next session" logs React's "A component suspended inside an `act` scope" (the lazy `RoomAudio` remounting under user-event's click); it passes and nothing in the app suspends visibly.

Checks the feature asks for, with evidence:

| Check | Evidence |
|---|---|
| A StrictMode double mount leaves one set of handlers and one timer | `TalkSession.test.tsx` "under StrictMode, registers each topic once" (one Room, 3 registrations) and, new, "under StrictMode, one agent timer and one listener per room event" (one `setTimeout` of 10 000 ms; `listenerCount` 1 for each of the 5 events). The Room, handlers and timer are made in the Connect click handler, which StrictMode doesn't run twice; the one effect's mount body is empty. Mutation: dropping `clearTimeout` from teardown turns the new test red |
| Every timer, handler and Room is released on unmount and on Leave | `teardown()` clears the timer, removes the 5 listeners before `disconnect()`, unregisters the 3 topics and disconnects; unmount (the effect's cleanup) and Leave (`endSession`) both run it. Tests: "on unmount unregisters all three and disconnects once", the new StrictMode test (`clearTimeout` with the agent timer, 0 listeners, 0 text handlers), "Leave unregisters, disconnects once", "Leave while waiting stops the timer", Leave/unmount during the fetch and during `connect()`. The one gap is the in-flight mic publish above (Minor, left) |
| No Server Component imports `livekit-client` or `@livekit/components-react` | `grep -rlE "from '(livekit-client\|@livekit/components-react)'" src` (excluding mocks and tests): `TalkSession.tsx` (types only) and `RoomAudio.tsx`, both `'use client'`; `src/app/talk/page.tsx` imports neither. The bundle test pins it |
| The offline path renders with the dev server's console clean | `curl /talk` → 200 and `POST /api/concierge/token` → 503 `{"offline":true}`; the dev log's only new lines are `GET /talk 200` and `POST /api/concierge/token 503`. In Chromium at 390 × 844 and 1280 × 800 (Sonnet run): Tab to Connect, Enter → exactly "The concierge is offline right now" + "Read how it works", focus still on Connect; 0 page errors, no hydration warning; the one console line is Chromium's `Failed to load resource: … 503` for the token POST (W1's 503, which page code can't silence); `scrollWidth` 390 / 1280; the livekit-client chunk is requested only after Enter |
| No tailnet host, CGNAT IP or ntfy URL in the talk code | `grep -rniE 'ts\.net\|100\.(6[4-9]\|[7-9][0-9]\|1[01][0-9]\|12[0-7])\.\|ntfy' src/components/talk src/lib/concierge src/lib/data/concierge.ts` is empty (exit 1) |

