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
| connecting | (same click) the page said `configured={false}`: no LiveKit env on the server (D46, VC2-06) | offline | nothing: no visitor id, no import, no fetch |
| connecting | fetch rejects, `res.status === 503`, `!res.ok`, or the body lacks string `url`/`token` | offline | nothing to release (no Room yet) |
| connecting | 200 `{url, token}` | connecting | `new Room()`; register the three handlers; add room listeners; `await room.connect(url, token)` |
| connecting | `connect()` rejects | offline | teardown (unregister, off, `disconnect()`) |
| connecting | `connect()` resolves, an agent is in `room.remoteParticipants` | live | `setMicrophoneEnabled(true)`; `startAudio()` if `!canPlaybackAudio` |
| connecting | `connect()` resolves, no agent | waiting | start the 10 000 ms timer; `setMicrophoneEnabled(true)` (superseded by D65, VC5-02: the mic is asked for only when the agent joins) |
| waiting | `ParticipantConnected` with `kind === ParticipantKind.AGENT` | live | clear the timer; `agentIdentity = p.identity`; `startAudio()` if needed; since D65 (VC5-02) `setMicrophoneEnabled(true)` here, and in the row above only for an agent already present |
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
  `<RoomAudio room>` (its `RoomContext.Provider`) needs it during render and `react-hooks` 7 (installed, via `eslint-config-next`) forbids
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
  already on). *Superseded by D65 (VC5-02): the toggle shows only in `live`, and the mic is asked for when the agent
  joins.* Its label says what a press does (`Mute microphone` / `Unmute microphone`), with no `aria-pressed`,
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

## Layout

Width and rhythm follow the existing pages (`approach/page.tsx`: eyebrow in `font-mono` accent, `text-5xl
sm:text-6xl` h1). `/talk` keeps the site chrome (Navbar, skip link, Footer; D44), so the page starts under the 64 px
Navbar (`pt-16` in `SiteChrome`).

**DOM order, which is the 390 px order:** header (eyebrow, h1, intro) → controls (the one Connect/Leave button, the
mic toggle and Turn on sound when they apply, the status line; offline: the sentence + the deep-dive link) →
transcript with the text box (`MessageBox` is the Transcript's `children`) → memory panel → latency panel → Forget me
(live only) and its `aria-live` line → privacy note.

**390 px:** one column (`grid grid-cols-1`; without `grid-cols-1` the implicit column grew to the latency table's
width and scrolled sideways, fixed in VC2-05), `px-6` (342 px content). The transcript is a bordered log
`max-h-80 overflow-y-auto`; the message box is full width (input grows, Send beside it). Panels are stacked bordered
sections (`TalkPanel`, `--color-surface`). The latency panel is a 3-column table (label · this turn · median) with
`tabular-nums`; labels wrap, numbers do not.

**1280 px:** `main` is `max-w-6xl mx-auto px-6 py-20`; the header (`ScrollReveal`) stays `max-w-3xl`. Below it
`lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10`: left = controls + transcript (`lg:h-[28rem]`) with the message
box; right = memory panel, latency panel, Forget me. The privacy note sits below the grid, `mt-16 max-w-3xl text-sm`,
muted.

**Above 844 px at 390** (measured by VC2-06 in Chromium at 390 × 844, no LiveKit env; § What Michael will see):

| Block | Ends at (px) |
|---|---|
| h1 "Talk to my concierge" (two lines) | 300 |
| the two intro paragraphs + `mb-8` | about 624 (Connect's top) |
| Connect | 664 |
| offline only: "The concierge is offline right now" | 700 |
| offline only: "Read how it works" | 747 |
| top of the transcript panel (idle) | about 690 (Connect's bottom + `space-y-6`), so its heading peeks above the fold |

So at 390 the h1, the intro, Connect and, after a failed Connect, the offline sentence and its link are all above
the fold; the transcript panel starts at the fold. `scrollWidth` is 390 in both states.

## LiveKit calls (quoted from the installed types)

Re-checked against `node_modules` on 2026-10-20 (VC2-01 restore): `livekit-client` 2.23.0,
`@livekit/components-react` 2.9.24, `@livekit/components-core` 0.12.15; every quote below is still exact.

`node_modules/livekit-client/dist/src/room/Room.d.ts`:

```ts
declare const Room_base: new () => TypedEmitter<RoomEventCallbacks>;
declare class Room extends Room_base {
    state: ConnectionState;
    /** map of identity: [[RemoteParticipant]] */
    remoteParticipants: Map<string, RemoteParticipant>;
    localParticipant: LocalParticipant;
    constructor(options?: RoomOptions);
    registerTextStreamHandler(topic: string, callback: TextStreamHandler): void;
    unregisterTextStreamHandler(topic: string): void;
    connect: (url: string, token: string, opts?: RoomConnectOptions) => Promise<void>;
    disconnect: (stopTracks?: boolean) => Promise<void>;
    startAudio: () => Promise<void>;
    /** Returns true if audio playback is enabled */
    get canPlaybackAudio(): boolean;
}
// RoomEventCallbacks (same file):
    reconnected: () => void;
    disconnected: (reason?: DisconnectReason) => void;
    participantConnected: (participant: RemoteParticipant) => void;
    participantDisconnected: (participant: RemoteParticipant, disconnectReason?: DisconnectReason) => void;
    audioPlaybackChanged: (playing: boolean) => void;
```

`on`/`off` come from `node_modules/typed-emitter/index.d.ts`:

```ts
  on<E extends keyof Events> (event: E, listener: Events[E]): this
  off<E extends keyof Events>(event: E, listener: Events[E]): this
```

`node_modules/livekit-client/dist/src/room/events.d.ts` (`RoomEvent` values are the callback keys):
`Disconnected = "disconnected"`, `ParticipantConnected = "participantConnected"`,
`ParticipantDisconnected = "participantDisconnected"`, `Reconnected = "reconnected"` (added in VC2-07),
`AudioPlaybackStatusChanged = "audioPlaybackChanged"`. `ConnectionState` (`Room.d.ts`) has
`Disconnected = "disconnected"` and `Reconnecting = "reconnecting"`; the page reads `room.state` against
`ConnectionState.Reconnecting` before treating an agent's `ParticipantDisconnected` as the end of the call.

The page constructs `new Room()` with no options (audio only, nothing published but the mic) and connects with
no `opts`.

`node_modules/livekit-client/dist/src/room/data-stream/incoming/StreamReader.d.ts`:

```ts
declare abstract class BaseStreamReader<T extends BaseStreamInfo> {
    get info(): T;
}
export declare class TextStreamReader extends BaseStreamReader<TextStreamInfo> {
    /** Yields each chunk's decoded text as it arrives - a delta, not the string accumulated so far. */
    [Symbol.asyncIterator](): { next: () => Promise<IteratorResult<string>>; return(): Promise<IteratorResult<string>>; };
    readAll(opts?: BaseStreamReaderReadAllOpts): Promise<string>;
}
export type TextStreamHandler = (reader: TextStreamReader, participantInfo: {
    identity: string;
}) => void;
```

`node_modules/livekit-client/dist/src/room/types.d.ts`:

```ts
export interface BaseStreamInfo {
    id: string;
    mimeType: string;
    topic: string;
    timestamp: number;
    size?: number;
    attributes?: Record<string, string>;
    encryptionType: Encryption_Type;
}
export interface SendTextOptions {
    topic?: string;
    destinationIdentities?: Array<string>;
    attachments?: Array<File>;
    onProgress?: (progress: number) => void;
    attributes?: Record<string, string>;
    compress?: boolean;
}
```

`node_modules/livekit-client/dist/src/room/participant/LocalParticipant.d.ts`:

```ts
    setMicrophoneEnabled(enabled: boolean, options?: AudioCaptureOptions, publishOptions?: TrackPublishOptions): Promise<LocalTrackPublication | undefined>;
    sendText(text: string, options?: SendTextOptions): Promise<TextStreamInfo>;
    performRpc(params: PerformRpcParams): TypedPromise<string, RpcError>;
```

`node_modules/livekit-client/dist/src/room/rpc/utils.d.ts`:

```ts
export interface PerformRpcParams {
    /** The `identity` of the destination participant */
    destinationIdentity: string;
    /** The method name to call */
    method: string;
    /** The method payload */
    payload: string;
    /** Timeout for receiving a response after the initial connection (milliseconds).
     * If a value less than 8000ms is provided, it will be automatically clamped to 8000ms ...
     * Default: 15000ms. */
    responseTimeout?: number;
}
```

`node_modules/livekit-client/dist/src/room/participant/Participant.d.ts`:

```ts
import { ..., ParticipantInfo_Kind as ParticipantKind, ... } from '@livekit/protocol';
export { ParticipantKind };
    identity: string;
    get isAgent(): boolean;
    get kind(): ParticipantKind;
```

`ParticipantKind` is `ParticipantInfo_Kind` from `@livekit/protocol` (`dist/index.d.ts`): `STANDARD = 0`, …,
`AGENT = 4`. Both `ParticipantKind` and `RoomEvent` are exported from `livekit-client`'s `dist/src/index.d.ts`.
The page tests `p.kind === ParticipantKind.AGENT`, as the feature says (`isAgent` also accepts an agent permission;
not needed here).

`node_modules/@livekit/components-react/dist/index.d.ts` re-exports the folders:

```ts
export * from './components';
export * from './hooks';
export * from './prefabs';
export * from './context';
```

and `dist/context/index.d.ts` line 6, `dist/components/index.d.ts` line 20 name the two the page uses:

```ts
export { RoomContext, useEnsureRoom, useMaybeRoomContext, useRoomContext } from './room-context';
export { RoomAudioRenderer, type RoomAudioRendererProps } from './RoomAudioRenderer';
```

(`dist/hooks/index.d.ts` line 38 `export { useChat } from './useChat';` and line 49
`export * from './useTranscriptions';` are the two the page must not use; see § One handler per topic.)

`node_modules/@livekit/components-react/dist/context/room-context.d.ts` and `components/RoomAudioRenderer.d.ts`:

```ts
export declare const RoomContext: React.Context<Room | undefined>;
export interface RoomAudioRendererProps {
    room?: Room;
    volume?: number;
    muted?: boolean;
}
export declare function RoomAudioRenderer({ room, volume, muted }: RoomAudioRendererProps): React.JSX.Element;
```

Those are the only two `@livekit/components-react` exports the page uses: no hooks. `RoomAudioRenderer` reads the
room from context, so it sits inside `<RoomContext.Provider value={room}>`. **As built (VC2-07):** both live in
`RoomAudio.tsx`, the only file with a static value import from `@livekit/components-react`; TalkSession loads it with
`next/dynamic` (`ssr: false`) and imports only types from `livekit-client` (a test pins this).

### The calls, as the page makes them

```ts
// Connect click (VC2-07): LiveKit loads alongside the token request, so it is not in /talk's first load
const livekit = Promise.all([import('livekit-client'), import('./RoomAudio')]);   // a failed load → offline
const [lk] = await livekit;
const room = new lk.Room();                                          // no options; audio only
room.registerTextStreamHandler('concierge.memory', onMemory);        // all three before connect()
room.registerTextStreamHandler('concierge.metrics', onMetrics);
room.registerTextStreamHandler('lk.transcription', onTranscription);
room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
    .on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
    .on(RoomEvent.Reconnected, onReconnected)                        // no agent after a full reconnect → ended
    .on(RoomEvent.Disconnected, dropped)
    .on(RoomEvent.AudioPlaybackStatusChanged, onPlayback);           // !canPlaybackAudio → Turn on sound
await room.connect(url, token);
[...room.remoteParticipants.values()].find((p) => p.kind === ParticipantKind.AGENT);  // already there → live
await room.localParticipant.setMicrophoneEnabled(true);              // and false/true from the toggle
if (!room.canPlaybackAudio) await room.startAudio();                 // also on Turn on sound, mic and Send clicks
await room.localParticipant.sendText(text, { topic: 'lk.chat' });
const reply = await room.localParticipant.performRpc({
  destinationIdentity: agentIdentity, method: 'concierge.forget_me', payload: '', responseTimeout: 10_000,
});                                                                  // isForgotten(reply): a JSON object, ok === true
// teardown: off(...) ×5, unregisterTextStreamHandler(topic) ×3, disconnect()
```

`onMemory` / `onMetrics`: `reader.readAll()` then `parseMemory` / `parseMetrics`; a `null` (bad body) or a rejected
`readAll` is dropped silently: no state change, no `console.error`. The stream handlers don't check
`session.alive` themselves: `send()` drops every dispatch once the session is gone; the participant handlers and
`dropped` check it directly.

### One handler per topic

`registerTextStreamHandler` throws on a second registration for the same topic. From
`node_modules/livekit-client/dist/livekit-client.esm.mjs` (line 27472):

```js
throw new DataStreamError("A text stream handler for topic \"".concat(topic, "\" has already been set."), DataStreamErrorReason.HandlerAlreadyRegistered);
```

`@livekit/components-react`'s `useChat`, `useTranscriptions` and the session hooks register their own handlers for
`lk.chat` and `lk.transcription` (`components-core`'s `setupTextStream` calls `room.registerTextStreamHandler(topic,
…)`). So **the page never mounts `useChat`, `useTranscriptions`, `useSession`/`useSessionMessages` or any
prefab that uses them** (e.g. `Chat`, `SessionProvider`-based UIs). It reads `lk.transcription` itself and sends
`lk.chat` with `sendText` (sending registers nothing). It does not register `lk.chat`: replies come back on
`lk.transcription`.

### `lk.transcription`

Attribute names, from `@livekit/components-core` 0.12.15 (`dist/index.mjs` line 507):
`TranscriptionFinal = "lk.transcription_final"`, `TranscriptionSegmentId = "lk.segment_id"`,
`TranscribedTrackId = "lk.transcribed_track_id"`.

The handler iterates the reader (`for await (const delta of reader)`), accumulating that stream's text, and after
each delta dispatches `{ key, who, text, final }`:

- `key` = `attributes['lk.segment_id'] ?? info.id`. One segment can arrive as several streams sharing the segment
  id (core's own comment: "Transcription updates for a segment arrive as separate streams sharing the same
  lk.segment_id"); a line with that key is **replaced**, not appended.
- `final` = `attributes['lk.transcription_final'] === 'true'` (core notes it flips `"false" → "true"` on the final
  STT result). A non-final line renders muted with a visible "…" marker.
  **As built (VC2-04):** the line is `final: false` while its stream is open; when the stream closes it is final
  unless the attribute (read after the trailer merged into `info.attributes`) is exactly `"false"`, so an agent
  stream without the attribute can't leave the log `aria-busy`. A new segment from the same speaker, and the end of
  the call (`ended`/`offline`), also settle any open line.
- `who` = `participantInfo.identity === room.localParticipant.identity ? 'visitor' : 'agent'`. The agent publishes
  the visitor's transcription under the visitor's identity; this is how `components-react`'s own session messages
  tell them apart (`room-Bfb4OWAI.mjs` ~line 5489: `case t.localParticipant.identity: type: "userTranscript"`).
- `lk.transcribed_track_id` is **not read** (as built, VC2-04): identity decides `who`, and the track id would change
  nothing on screen. Named here so nobody adds logic around it expecting a difference.

A typed line is appended locally as `{ who: 'visitor', final: true }` when `sendText` is called; the agent does not
echo `lk.chat` back.

## Jest

**Mapping** (`jest.config.ts`, added in VC2-04):

```ts
'^livekit-client$': '<rootDir>/src/__mocks__/livekit-client.ts',
'^@livekit/components-react$': '<rootDir>/src/__mocks__/livekit-components-react.tsx',
```

The real `livekit-client` can then never load in Jest, so no test can open a connection. `livekit-server-sdk` does
not import `livekit-client` (it uses `@livekit/protocol`), so the VC1 token-route tests keep the real SDK (D42);
VC2-04 re-runs them after the mapper change to confirm.

**`src/__mocks__/livekit-client.ts`** (type-checked by `next build`, so typed loosely but without `any` leaks):

- `RoomEvent` with the five values above (real strings), `ConnectionState` (`Disconnected`, `Connecting`,
  `Connected`, `Reconnecting`), `ParticipantKind` (`STANDARD: 0`, `AGENT: 4`), and `export type` re-exports are not needed: the
  component's `import type` lines are erased by SWC.
- `class Room` (exported as `Room`; also `MockRoom` for tests). A static `instances: Room[]`; the constructor pushes
  `this` and then runs `Room.setup?.(this)`, so a test can shape the room it is about to get (an agent already
  present, a `connect()` that rejects). Surface:
  - `on(event, fn)` / `off(event, fn)` returning `this`, `emit(event, ...args)`, `listenerCount(event)`, over a
    `Map<string, Set<fn>>`;
  - `state` (`'disconnected'` → `'connected'` on connect);
  - `remoteParticipants: Map<string, FakeParticipant>`;
  - `localParticipant = { identity: 'visitor-test', sendText: jest.fn(async () => ({ id: 'sent-1' })), performRpc:
    jest.fn(async () => '{"ok":true}'), setMicrophoneEnabled: jest.fn(async () => undefined) }`;
  - `canPlaybackAudio = true`, `startAudio = jest.fn(async () => {})`;
  - `connect = jest.fn(async (url, token) => { this.state = 'connected' })`;
  - `disconnect = jest.fn(async () => { … })`: sets `state = 'disconnected'` and emits `disconnected`, but, like the
    real one, a room already disconnected returns at once and emits nothing;
  - `textHandlers: Map<string, handler>`; `registerTextStreamHandler = jest.fn((topic, cb) => …)` **throws, like the
    real one, if the topic is already registered**; `unregisterTextStreamHandler = jest.fn(topic => delete)`.
- Helpers (tests import them from `@/__mocks__/livekit-client`, which resolves to the same module instance):
  - `lastRoom()`; `resetRooms()` (in `afterEach`);
  - `pushText(room, topic, body, { identity = 'agent-1', attributes = {}, chunks = [body] } = {})`: builds a fake
    reader (`info: { id, topic, attributes, timestamp, mimeType: 'text/plain' }`, `readAll()` resolving the joined
    chunks, an async iterator yielding `chunks`), calls the registered handler, and returns a promise that settles
    after the handler's reads (tests wrap it in `await act(...)`); throws if nothing is registered for the topic;
  - `addAgent(room, identity = 'agent-1')`: puts `{ identity, kind: ParticipantKind.AGENT }` into
    `remoteParticipants` and emits `participantConnected`; `removeParticipant(room, identity)` emits
    `participantDisconnected`; `restart(room)` does what a full reconnect does (every remote participant
    unwound, then `state = 'reconnecting'`, in one tick).
- Order assertions use Jest's own `mock.invocationCallOrder`: every value in
  `room.registerTextStreamHandler.mock.invocationCallOrder` is below `room.connect.mock.invocationCallOrder[0]`.

**`src/__mocks__/livekit-components-react.tsx`**: `RoomContext = React.createContext<unknown>(undefined)` and
`RoomAudioRenderer`, which renders `<div data-testid="room-audio-renderer" data-has-room hidden />` and records the
room it found in its context (`audioRenderer.room`), so a test checks it sits inside the provider for that room.

**Dynamic imports:** under Jest, `import('livekit-client')` and `next/dynamic`'s `import('./RoomAudio')` resolve
through the same mapper, so the mock is what Connect loads; tests flush the import promise inside the same `act`
as the fetch.

**Timers:** the 10 s tests use `jest.useFakeTimers()`, click Connect with `fireEvent.click` and flush the fetch,
import and connect promises inside one `act` (`connectWithFakeTimers` and `flush()` in `TalkSession.test.tsx`, 20
`await Promise.resolve()` turns; user-event with fake timers was not used), then
`act(() => jest.advanceTimersByTime(9_999))` (still waiting) and `(1)` (offline, `disconnect` called once). The
cancel test calls `addAgent` at 3 000 ms, advances to 10 000, and expects `live` and no disconnect.
`jest.useRealTimers()` in `afterEach`.

**fetch:** `global.fetch = jest.fn()` per test, restored in `afterEach`: `mockResolvedValue({ ok: false, status:
503, json: async () => ({ offline: true }) })`, `mockRejectedValue(new TypeError('Failed to fetch'))`, and the 200
case `{ ok: true, status: 200, json: async () => ({ url: 'wss://concierge.test.invalid', token: 'test-token' }) }`.
The test reads the request body to assert the `visitor_id` equals `localStorage.getItem('concierge.visitor_id')`
across two Connects.

**Storage:** `localStorage.clear()` in `beforeEach`; the throwing case uses
`jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })` and expects a
Connect that still POSTs a valid v4 id. `getOrCreateVisitorId`'s own tests pass a stub object instead.

**Rules:** no test opens a connection or reads a LiveKit env var; the malformed-body test spies on `console.error`
and asserts it was not called; `learned_at` formatting is asserted with the same `Intl.DateTimeFormat` options the
component uses, so the machine's time zone does not matter. jsdom has no `TextEncoder`, so
`parseMemory`/`parseMetrics` measure the 15 KiB cap with a hand-written `utf8Bytes(text)` in `contract.ts` (after a
cheap `text.length > MAX_BODY_BYTES` check); no `TextEncoder` or `Blob` in `src`.

## Contract types (VC2-02)

```ts
export const TOPIC = { memory: 'concierge.memory', metrics: 'concierge.metrics', transcription: 'lk.transcription', chat: 'lk.chat' } as const;
export const RPC_FORGET_ME = 'concierge.forget_me';
export const MAX_BODY_BYTES = 15 * 1024;

export interface MemoryFact {
  id: string; slot: string;                      // required, non-empty, else the body is rejected
  value: string;                                 // required string
  channel: string | null; source: string | null; learned_at: string | null; confidence: number | null;
}
export interface MemoryBody {
  visitor: { name: string | null; visits: number };
  facts: MemoryFact[]; summary: string | null; updated_at: string | null;
}
export interface MetricsBody {
  turn: number;                                  // integer, else rejected
  eou_ms: number | null; stt_ms: number | null; llm_ttft_ms: number | null; tts_ttfb_ms: number | null;
  total_ms: number | null; memory_on_turn_path_ms: number | null;
  preload_ms: number | null; extraction_ms: number | null;   // absent = null
  prompt_tokens: number | null; cached_tokens: number | null; compacted: boolean | null;
}
```

A numeric field that is present but not a finite number (a string, `NaN`) is read as `null`, not a rejection: §4
says any field may be null, and one odd field should not hide a whole turn. Missing `facts`, a fact without `id`
or `slot`, or a non-integer `turn` rejects the body (`null`), as the VC2-02 step says.

**As built (VC2-07):** `TURN_PATH_FIELDS` is `total_ms`, `eou_ms`, `stt_ms`, `llm_ttft_ms`, `tts_ttfb_ms`,
`memory_on_turn_path_ms`, and `LATENCY_FIELDS` is those six plus `extraction_ms` (the preload is shown once, the
token counts only as `cachedShare`). `isForgotten(reply)` (VC2-05) is true only for a JSON object with `ok === true`.

`summarise(turns)` returns, for each of `LATENCY_FIELDS`,
`{ last, median }`: `last` is the newest turn's value (possibly `null`), `median` ignores nulls (odd count: the
middle; even: the mean of the two middle values; none: `null`). The panel rounds for display. `cachedShare(turn)`
= `Math.round(cached / prompt * 100) / 100`, `null` when either is null or `prompt_tokens` is 0.

## Copy (`src/lib/data/concierge.ts`, VC2-02)

First person (Michael), plain, short sentences (`docs/notes/brand.md` § Voice). No numbers but 30. This is the
copy as built (`src/lib/data/concierge.ts`, pinned by `concierge-data.test.ts`); the first intro sentence was
widened in VC2-02 to credit the Claude Code agents, and VC2-05/07 added `startAudio` and `forgetFailedEnded`.

```ts
export const talkPage = {
  eyebrow: 'Voice concierge',
  title: 'Talk to my concierge',
  description: 'A voice agent that remembers you between visits, and shows you exactly what it remembers.',
  intro: [
    'This is a voice agent I designed and built on LiveKit, with Claude Code agents writing much of the code. It remembers you between visits.',
    'This page shows what it remembers, where it learned each thing, and how long each turn took. Talk or type.',
  ],
  offlineMessage: 'The concierge is offline right now',      // exact, no full stop (tests match it exactly)
  deepDiveHref: '/projects/voice-concierge',
  deepDiveLabel: 'Read how it works',
  labels: {
    connect: 'Connect', leave: 'Leave', send: 'Send', forgetMe: 'Forget me', erase: 'Erase', cancel: 'Cancel',
    micOn: 'Mute microphone', micOff: 'Unmute microphone',    // the label says what a press does; no aria-pressed
    message: 'Message', messagePlaceholder: 'Type a message',
    startAudio: 'Turn on sound',                              // shown when the browser blocks playback
  },
  status: {
    connecting: 'Connecting…',
    waiting: 'Waiting for the concierge to join…',
    live: 'Connected. Say hello, or type below.',
    ended: 'The call ended.',
    micBlocked: 'Microphone blocked. You can still type.',
    forgetConfirm: 'Erase everything the concierge remembers about you?',
    forgotten: 'Forgotten',
    forgetFailed: "Forget me didn't go through. Try again.",
    forgetFailedEnded: "Forget me didn't go through. Connect again to retry.",   // the call is over, no button
  },
  headings: { transcript: 'Transcript', memory: 'What it remembers', latency: 'Latency', privacy: 'Privacy' },
  empty: {
    transcript: 'Nothing said yet.',
    memory: 'Nothing remembered yet',
    latency: 'No turns yet.',
    newVisitor: 'a new visitor',
  },
  memory: {
    talkingTo: 'Talking to', visit: 'visit', summary: 'Summary',
    fact: { channel: 'Channel', source: 'Source', learnedAt: 'Learned', confidence: 'Confidence' },
  },
  speakers: { visitor: 'You', agent: 'Concierge' },
};

export const privacyNote: string[] = [
  'It stores the facts it learns about you, a short summary of each visit, and the transcript events.',
  'They are kept on my own server.',
  'They are deleted 30 days after your last visit.',
  'It knows you by a random id kept in this browser, not by a login. Another browser starts fresh.',
  'Forget me erases everything about you on my server. Anonymous timing numbers, with no text and no id, are kept.',
  "LiveKit's observability keeps the conversation's transcript and timing traces, but no audio, for 30 days. Forget me can't erase those.",
];

export const latencyLabels = {
  total_ms: 'Whole turn',
  eou_ms: 'End of turn detected',
  stt_ms: 'Speech to text',
  llm_ttft_ms: 'First token from the model',
  tts_ttfb_ms: 'First audio from speech',
  memory_on_turn_path_ms: 'Memory on the turn path',
  cachedShare: 'Prompt tokens from cache',
  preload_ms: 'Memory preload at connect',
  extraction_ms: 'Background extraction',
  compacted: 'History compacted',
  turn: 'Turn', yes: 'Yes', no: 'No',
  columns: { label: 'Step', last: 'This turn', median: 'Median' },
};
```

The memory panel's line reads "Talking to {name || 'a new visitor'} · visit {visits}" (`||`, so an empty name reads as new too); each fact row shows slot,
value, channel, source, `learned_at` (local date and time), and confidence as a percentage; a null shows as an en
dash (`–`) everywhere, never `null` or `NaN`.

## Decisions to record in the v2 spec when built

All recorded: D41–D45 are in `docs/specs/2026-10-18-portfolio-v2.md` (lines 156–177).

The numbers moved: VC1-03 used **D43** for lower-casing visitor ids, so the `/talk` chrome decision the feature
calls D43 becomes **D44**. VC2-04 appends:

- **D42** is already recorded (VC1-02): the token test signs with the real SDK and fake env and decodes the JWT;
  `livekit-client` and `@livekit/components-react` are mocked in Jest. VC2-04 adds nothing, only cites it.
- **D44** *default* `/talk` keeps the site chrome (Navbar, skip link, Footer), is indexable (no `robots` override)
  and is in `sitemap.ts`, but stays off the Navbar: the Navbar holds the seven sections of the site, and `/talk` is a
  demo reached from `/card` and the deep-dive (W4: "the Navbar only if the spec's Navbar rules allow it"). Reversible:
  one entry in `Navbar.tsx`'s link list.
- **D45** *default* The visitor id is read in the Connect click handler (`getOrCreateVisitorId(browserStorage())`;
  reading `window.localStorage` itself throws when storage is blocked, and `browserStorage()` returns `undefined`
  then, VC2-02), not in a mount effect, and the Room is created in that handler too: no state is set from an effect
  (`react-hooks/set-state-in-effect`), the server and first client render match, StrictMode cannot register
  handlers twice, and a visitor who never presses Connect gets no id stored.
- **No `@livekit/components-styles`**: already part of **D41**; no new entry.

## Tests per feature (what "done" looks like)

- **VC2-02:** contract fixtures parse to the expected objects; `null` for non-JSON, > 15 KiB, missing `facts`, fact
  without `id` or `slot`, `turn: 1.5`; medians `[120, 80, 200] → 120`, `[120, 80] → 100`, all nulls → `null`;
  `cachedShare` rounding and the null/zero cases; visitor id persists across two calls, a malformed stored value is
  replaced, throwing `getItem`/`setItem` and `undefined` storage still return a valid id; `newUuidV4` without
  `crypto.randomUUID` (fallback) passes `isUuidV4`; the copy test.
- **VC2-03:** each panel from the three fixtures and the empty memory; nulls render `–`; Transcript order and the
  non-final marker; ForgetMeButton confirm, Erase once, Cancel, disabled while busy.
- **VC2-04:** reducer table; offline on 503, non-OK, rejected fetch, rejected `connect`; the id sent is the stored
  one on the second Connect; registers precede connect; unmount → 3 unregisters + 1 disconnect; StrictMode render
  then Connect → each topic registered once; 10 s timeout and the 3 s agent cancel; memory and metrics bodies reach
  the panels; a bad body changes nothing and `console.error` is not called; page test; sitemap 9; a11y `/talk`.
- **VC2-05:** mic toggle true/false and the blocked message; Enter and Send call `sendText(text, { topic:
  'lk.chat' })`, append, clear, ignore whitespace; two chunks of one segment → one line, final text; Forget me RPC
  params exactly once, `{ok:true}` clears memory and shows "Forgotten", rejection re-enables and shows the error;
  RoomAudioRenderer inside the provider; `startAudio` when `canPlaybackAudio` is false; Leave → idle, panels cleared.
- **VC2-06:** three captures under 400 KB; h1 and Connect above 844 at 390; `scrollWidth` 390; Tab order and outline.
- **VC2-07:** review tables with outcomes; StrictMode and release tests; no LiveKit in Server Components or the
  first load; review guide and CLAUDE.md.

## Risks and notes

- The deep-dive link goes to `/projects/voice-concierge`, which VC3 creates. If VC2 merged without VC3 the link
  would 404; the morning merge order is VC1 → VC2 → VC3 together.
- `livekit-client` (and `components-react`, which imports it) is not in `/talk`'s first load: VC2-07 moved it behind
  `import('livekit-client')` on Connect and `next/dynamic` for `RoomAudio` (§ Review).
- The live path is only as right as the mocks. Michael's morning call (VC2-07's checklist) is the first real test of
  the transcript attribution, the RPC and audio unlock on a phone.

## What Michael will see

VC2-06, 2026-10-20. Captures and measurements from the harness dev server (port 7832, no `LIVEKIT_*` env, so the
token route answers 503 and Connect lands in offline), 390 × 844 and 1280 × 844, `reducedMotion: 'reduce'`, after
scrolling top to bottom and back; full pages saved as 256-colour palette PNGs with sharp (script:
`$HARNESS_SCRATCH/vc2-shots.mjs`). The round "N" at the left is the Next dev indicator, not on the live site.

- **Above the fold at 390 × 844:** h1 `y 180 → bottom 300`; Connect `y 624 → bottom 664`. Offline: the status line
  ends at 700 and "Read how it works" at 747, so both show without scrolling. At 1280: h1 ends at 255, Connect at 489.
- **Horizontal scroll:** `document.documentElement.scrollWidth` = 390 idle and 390 offline (1280 at 1280).
- **Errors:** 0 page errors and 0 console errors, idle and offline. Retaken 2026-10-20 after the verifier failed this
  step: Chromium logged `Failed to load resource: the server responded with a status of 503` for the token POST. Fix
  (D46, test first): the page passes TalkSession `configured={conciergeEnv() !== null}`, and without the env Connect
  goes offline with no request (`/api/*` requests on Connect: none). Tests: `TalkSession.test.tsx` "when the server
  says LiveKit is not configured…", `pages/talk.test.tsx` "without the LiveKit env…" / "with the LiveKit env set…",
  `lib/concierge-env.test.ts`. The token route reads the same `conciergeEnv()`.
- **Keyboard:** Tab from the top reaches Skip to content → MH → (1280) Home, About, Skills, Projects, Approach,
  Experience, Contact / (390) Open menu → Connect. Every stop matches `:focus-visible` with a 2 px solid
  `rgb(0, 212, 255)` outline. The Navbar links and Connect have `transition-colors`, which in Tailwind 4 also fades
  `outline-color` over 150 ms, so the colour is read 300 ms after each Tab (read at once it is mid-fade).

| Page and state | What is on screen | Anything wrong |
|---|---|---|
| `/talk` idle · 390 (`docs/screenshots/v2/VC2-talk-390.png`, 39 KB, 390 × 1805) | Hamburger navbar; eyebrow "VOICE CONCIERGE"; h1 "Talk to my concierge" on two lines; the two intro paragraphs; Connect. Then stacked: Transcript ("Nothing said yet.", the disabled message box and Send), What it remembers ("Nothing remembered yet"), Latency ("No turns yet."); the Privacy list (six points); footer | Nothing to fix |
| `/talk` offline · 390 (`VC2-talk-offline-390.png`, 41 KB, 390 × 1889) | As idle, with Connect back and "The concierge is offline right now" under it, then the accent link "Read how it works" (`/projects/voice-concierge`), above the fold; no request to the token route (D46) | The link 404s until VC3-02 builds the deep-dive (expected, the run's next milestone). Nothing to fix in VC2 |
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

