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
| `src/components/talk/sessionReducer.ts` | VC2-04 | Pure reducer + `initialSession` + action types (see § State machine). No React, no LiveKit: unit-tested on its own |
| `src/components/talk/MemoryPanel.tsx` | VC2-03 | Presentational, no hooks (Server-Component-safe). Props `{ memory: MemoryBody \| null }` |
| `src/components/talk/LatencyPanel.tsx` | VC2-03 | Presentational, no hooks. Props `{ turns: MetricsBody[] }`; calls `summarise()` and `cachedShare()` |
| `src/components/talk/Transcript.tsx` | VC2-03 | `'use client'` (it scrolls to the newest line with a ref + effect). Props `{ lines: TranscriptLine[] }`; `aria-live="polite"` |
| `src/components/talk/ForgetMeButton.tsx` | VC2-03 | `'use client'` (confirm step state). Props `{ onForget: () => void; busy: boolean }` |
| `src/components/talk/TalkPanel.tsx`, `format.ts` | VC2-03 (built) | The bordered section + h2 every panel uses (fixed ids `talk-memory`, `talk-latency`, `talk-transcript`: one of each per page); `DASH`, `ms()`, `percent()`. `TranscriptLine` is exported from `Transcript.tsx`, which takes the MessageBox as `children` |
| `src/components/talk/MessageBox.tsx` | VC2-05 | Presentational form: label, input, Send. Props `{ disabled, onSend(text) }`; keeps the draft in local state, so `'use client'` |
| `src/lib/concierge/contract.ts` | VC2-02 | §4 types (`MemoryBody`, `MemoryFact`, `MetricsBody`), topic and RPC constants, `parseMemory(text)`, `parseMetrics(text)`: typed object or `null`, never throws |
| `src/lib/concierge/latency.ts` | VC2-02 | `LATENCY_FIELDS`, `summarise(turns)`, `cachedShare(turn)`, `median(values)` |
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
| `src/__tests__/pages/talk.test.tsx` | VC2-04 | the page: one h1, intro, privacy note, metadata |
| edits | VC2-04 | `jest.config.ts` (two mapper lines), `.harness/smoke-routes.txt` (`/talk`), `src/app/sitemap.ts` + `sitemap-robots.test.ts` (9 routes), `a11y-new-pages.test.tsx` (`/talk`), spec D44/D45 |

`/talk` is **not** added to the Navbar (D44).

## Component tree

```
app/talk/page.tsx (Server)
├─ ScrollReveal → eyebrow "Voice concierge", h1, intro          (talkPage)
├─ TalkSession ('use client')
│   ├─ controls: Connect | Leave · mic toggle (live) · status line
│   │    └─ offline: "The concierge is offline right now" + link to /projects/voice-concierge
│   ├─ RoomContext.Provider value={room}   (only while a Room exists)
│   │    └─ RoomAudioRenderer               (hidden <div>, one <audio> per remote audio track)
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

## Layout

Width and rhythm follow the existing pages (`approach/page.tsx`: `max-w-3xl mx-auto px-6 py-20`, eyebrow in
`font-mono` accent, `text-5xl sm:text-6xl` h1). `/talk` keeps the site chrome (Navbar, skip link, Footer; D44), so
the page starts under the 64 px Navbar (`pt-16` in `SiteChrome`).

**DOM order, which is the 390 px order:** header (eyebrow, h1, intro) → controls (Connect, status line or offline
sentence + deep-dive link) → transcript with the text box → memory panel → latency panel → Forget me (live only) →
privacy note.

**390 px:** one column, `px-6` (342 px content). The transcript is a bordered box `max-h-80 overflow-y-auto`; the
message box is full width (input grows, Send beside it). Panels are stacked bordered sections (`--color-surface`).
The latency panel is a 3-column table (label · this turn · median) with `tabular-nums`; labels wrap, numbers do not.

**1280 px:** `main` widens to `max-w-6xl`; the header stays `max-w-3xl`. Below it a grid
`lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10`: left = controls + transcript (`h-[28rem]`) + message box;
right = memory panel, latency panel, Forget me. The privacy note spans the width below, `max-w-3xl`, `text-sm`, muted.

**Above 844 px at 390** (estimate; VC2-06 measures and writes the real `y + height`):

| Block | Approx. height | Ends at |
|---|---|---|
| Navbar offset | 64 | 64 |
| `py-20` top padding | 80 | 144 |
| eyebrow + margin | 36 | 180 |
| h1 "Talk to my concierge" (48 px, 2 lines, leading-tight) + `mb-6` | 144 | 324 |
| intro (2 sentences, `text-xl`, about 5 lines) + `mb-8` | 192 | 516 |
| Connect button | 48 | 564 |
| offline sentence + deep-dive link (offline state only) | 64 | 628 |
| top of the transcript box | — | ~650 |

So at 390 the h1, the intro, Connect and, after a failed Connect, the offline sentence and its link are all above
the fold; the transcript box starts just above it.

## LiveKit calls (quoted from the installed types)

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
`ParticipantDisconnected = "participantDisconnected"`, `AudioPlaybackStatusChanged = "audioPlaybackChanged"`.

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
room from context, so it sits inside `<RoomContext.Provider value={room}>`.

### The calls, as the page makes them

```ts
const room = new Room();
room.registerTextStreamHandler('concierge.memory', onMemory);        // all three before connect()
room.registerTextStreamHandler('concierge.metrics', onMetrics);
room.registerTextStreamHandler('lk.transcription', onTranscription);
room.on(RoomEvent.ParticipantConnected, onJoin)
    .on(RoomEvent.ParticipantDisconnected, onLeave)
    .on(RoomEvent.Disconnected, onDisconnected);
await room.connect(url, token);
await room.localParticipant.setMicrophoneEnabled(true);              // and false from the toggle
if (!room.canPlaybackAudio) await room.startAudio();
await room.localParticipant.sendText(text, { topic: 'lk.chat' });
const reply = await room.localParticipant.performRpc({
  destinationIdentity: agentIdentity, method: 'concierge.forget_me', payload: '', responseTimeout: 10_000,
});                                                                  // JSON.parse(reply).ok === true
// teardown: off(...) ×3, unregisterTextStreamHandler(topic) ×3, disconnect()
```

`onMemory` / `onMetrics`: `reader.readAll()` then `parseMemory` / `parseMetrics`; a `null` (bad body) or a rejected
`readAll` is dropped silently: no state change, no `console.error`. Every handler first checks `session.alive`.

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
- `lk.transcribed_track_id` is read and kept on the line (`trackId`) but changes nothing on screen: identity decides
  `who`. Named here so nobody adds logic around it expecting a difference.

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

- `RoomEvent` with the four values above (real strings), `ConnectionState` (`Disconnected`, `Connecting`,
  `Connected`), `ParticipantKind` (`STANDARD: 0`, `AGENT: 4`), and `export type` re-exports are not needed: the
  component's `import type` lines are erased by SWC.
- `class Room` (exported as `Room`; also `MockRoom` for tests). A static `instances: Room[]`; the constructor pushes
  `this`. Surface:
  - `on(event, fn)` / `off(event, fn)` returning `this`, `emit(event, ...args)`, over a `Map<string, Set<fn>>`;
  - `state` (`'disconnected'` → `'connected'` on connect);
  - `remoteParticipants: Map<string, FakeParticipant>`;
  - `localParticipant = { identity: 'visitor-test', sendText: jest.fn(async () => ({ id: 'sent-1' })), performRpc:
    jest.fn(async () => '{"ok":true}'), setMicrophoneEnabled: jest.fn(async () => undefined) }`;
  - `canPlaybackAudio = true`, `startAudio = jest.fn(async () => {})`;
  - `connect = jest.fn(async (url, token) => { this.state = 'connected' })`;
  - `disconnect = jest.fn(async () => { this.state = 'disconnected'; this.emit('disconnected') })`;
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
    `participantDisconnected`.
- Order assertions use Jest's own `mock.invocationCallOrder`: every value in
  `room.registerTextStreamHandler.mock.invocationCallOrder` is below `room.connect.mock.invocationCallOrder[0]`.

**`src/__mocks__/livekit-components-react.tsx`**: `RoomContext = React.createContext<unknown>(undefined)` and
`RoomAudioRenderer = () => <div data-testid="room-audio-renderer" hidden />`, which a test finds inside the provider.

**Timers:** the 10 s tests use `jest.useFakeTimers()` with `userEvent.setup({ advanceTimers:
jest.advanceTimersByTime })`, flush the fetch and connect promises with `await act(async () => {})`, then
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
component uses, so the machine's time zone does not matter. `TextEncoder` exists in the Jest environment
(checked: `typeof TextEncoder` is `function` in Node); `parseMemory`/`parseMetrics` measure the 15 KiB cap with
`new TextEncoder().encode(text).length > 15 * 1024`. If jsdom hides it, fall back to `new Blob([text]).size`.

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

`summarise(turns)` returns, for each of `LATENCY_FIELDS` (`total_ms`, `eou_ms`, `stt_ms`, `llm_ttft_ms`,
`tts_ttfb_ms`, `memory_on_turn_path_ms`, `preload_ms`, `extraction_ms`, `prompt_tokens`, `cached_tokens`),
`{ last, median }`: `last` is the newest turn's value (possibly `null`), `median` ignores nulls (odd count: the
middle; even: the mean of the two middle values; none: `null`). The panel rounds for display. `cachedShare(turn)`
= `Math.round(cached / prompt * 100) / 100`, `null` when either is null or `prompt_tokens` is 0.

## Copy (`src/lib/data/concierge.ts`, VC2-02)

First person (Michael), plain, short sentences (`docs/notes/brand.md` § Voice). No numbers but 30.

```ts
export const talkPage = {
  eyebrow: 'Voice concierge',
  title: 'Talk to my concierge',
  description: 'A voice agent that remembers you between visits, and shows you exactly what it remembers.',
  intro: [
    'This is a voice agent I built on LiveKit. It remembers you between visits.',
    'This page shows what it remembers, where it learned each thing, and how long each turn took. Talk or type.',
  ],
  offlineMessage: 'The concierge is offline right now',      // exact, no full stop (tests match it exactly)
  deepDiveHref: '/projects/voice-concierge',
  deepDiveLabel: 'Read how it works',
  labels: {
    connect: 'Connect', leave: 'Leave', send: 'Send', forgetMe: 'Forget me', erase: 'Erase', cancel: 'Cancel',
    tryAgain: 'Connect',                                      // the button keeps its name in offline and ended
    micOn: 'Mute microphone', micOff: 'Unmute microphone',    // aria-pressed toggle
    message: 'Message', messagePlaceholder: 'Type a message',
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
  },
  headings: { transcript: 'Transcript', memory: 'What it remembers', latency: 'Latency', privacy: 'Privacy' },
  empty: {
    transcript: 'Nothing said yet.',
    memory: 'Nothing remembered yet',
    latency: 'No turns yet.',
    newVisitor: 'a new visitor',
  },
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
  columns: { label: 'Step', last: 'This turn', median: 'Median' },
};
```

The memory panel's line reads "Talking to {name ?? 'a new visitor'} · visit {visits}"; each fact row shows slot,
value, channel, source, `learned_at` (local date and time), and confidence as a percentage; a null shows as an en
dash (`–`) everywhere, never `null` or `NaN`.

## Decisions to record in the v2 spec when built

The numbers moved: VC1-03 used **D43** for lower-casing visitor ids, so the `/talk` chrome decision the feature
calls D43 becomes **D44**. VC2-04 appends:

- **D42** is already recorded (VC1-02): the token test signs with the real SDK and fake env and decodes the JWT;
  `livekit-client` and `@livekit/components-react` are mocked in Jest. VC2-04 adds nothing, only cites it.
- **D44** *default* `/talk` keeps the site chrome (Navbar, skip link, Footer), is indexable (no `robots` override)
  and is in `sitemap.ts`, but stays off the Navbar: the Navbar holds the seven sections of the site, and `/talk` is a
  demo reached from `/card` and the deep-dive (W4: "the Navbar only if the spec's Navbar rules allow it"). Reversible:
  one entry in `Navbar.tsx`'s link list.
- **D45** *default* The visitor id is read in the Connect click handler (`getOrCreateVisitorId(browserStorage())` (reading `window.localStorage` itself throws when storage is blocked; `browserStorage()` returns `undefined` then, VC2-02)),
  not in a mount effect, and the Room is created in that handler too: no state is set from an effect
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

## Risks and notes

- The deep-dive link goes to `/projects/voice-concierge`, which VC3 creates. If VC2 merged without VC3 the link
  would 404; the morning merge order is VC1 → VC2 → VC3 together.
- `livekit-client` (and `components-react`, which imports it) lands only in `/talk`'s client chunk, since only that
  page imports `TalkSession`. A dynamic `import('livekit-client')` at Connect would shrink the first load further;
  left to the VC2-07 review to weigh, not built now.
- The live path is only as right as the mocks. Michael's morning call (VC2-07's checklist) is the first real test of
  the transcript attribution, the RPC and audio unlock on a phone.

## What Michael will see

Filled by VC2-06: one row per screenshot (page and state · what is on screen · anything that looks wrong), plus the
measured `y + height` of the h1 and Connect at 390×844.

## Review

Filled by VC2-07: file · finding · severity · outcome.
