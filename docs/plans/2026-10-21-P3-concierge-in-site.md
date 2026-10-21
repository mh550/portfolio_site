# P3: the concierge in the site (plan)

Date 2026-10-21. Spec: `docs/specs/2026-10-21-portfolio-v3.md` § 4 (the concierge in the site), § 5 (the memory
view) and § 7 (contract v2, shared with `mh550/voice-concierge`, word for word); the page contract it extends is
`docs/specs/2026-10-19-voice-concierge-page.md` § 4. Features: P3-01 this plan → P3-02 contract v2 + cache module →
P3-03 provider → P3-04 drawer → P3-05 pill, callout, Navbar → P3-06 memory strip, tabs, memory view → P3-07 cache,
busy retry, copy → P3-08 usher → P3-09 captures → P3-10 review. Decisions D85–D95 are allocated in § Decisions and
recorded in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions; the next free number is D96. Built on the tree
after P2 (1167 tests, 86 suites). Build-only: no test or check opens a LiveKit connection, nothing touches the
LiveKit env, and the page must work against a v1 agent (today's) and a v2 agent (being built in parallel).

## Ownership

*Built in P3-03* as below, with two differences: the six actions are made once per `configured` in one `useMemo`
(not one `useCallback` each), and the Forget me guard is a `forgetting` flag on the `Session`, so `forgetMe` reads no
state. P3-03 builds only the members it owns (`state`, `room`, `sessionCount`, `configured` and the six moved
actions); the later rows arrive with their features.
Review additions: the widget shows a live call (`VoiceWidget live`, `talkWidget.liveLabel`) until the drawer lands,
`pageshow` resets only a call `pagehide` ended, and the open question for P3-04/P3-10: livekit-client's own
`disconnectOnPageLeave` (default on) also listens for `beforeunload`, which a `mailto:` click fires in some browsers;
with the provider owning page-leave, `new Room({ disconnectOnPageLeave: false })` may be the better default.

Today `src/components/talk/TalkSession.tsx` (471 lines) owns everything: the reducer, the `Session` ref, the Room,
the token request, the stream handlers and the markup, and its unmount ends the call. P3-03 moves the call one level
up, into `src/components/concierge/ConciergeProvider.tsx` (`'use client'`), mounted by `SiteChrome` around the chrome
of every page but `/card*`. `SiteChrome` lives in the root layout, so a client-side navigation (every `next/link`)
re-renders the page under it and never unmounts the provider: the call survives `/projects` → `/about` → `/talk`.

### The context value

`useConcierge()` reads it and throws `Error('useConcierge must be used inside ConciergeProvider')` outside one.

| Member | Type | Source |
|---|---|---|
| `state` | `SessionState` (`sessionReducer.ts`: phase, memory, turns, lines, micOn, micBlocked, audioBlocked, forget, busyReason) | `useReducer(sessionReducer, initialSession)`, as today |
| `room` | `Room \| null` | state mirror of `session.room` (render needs it for `RoomAudio`; a ref can't be read in render) |
| `sessionCount` | `number` | Connects so far: `MessageBox` is keyed on it, so each session starts with an empty box |
| `agentSpeaking` | `boolean` | P3-05: `RoomEvent.ActiveSpeakersChanged` lists the agent's identity; false when no session |
| `panel` | `'closed' \| 'open'` | P3-04; `'closed'` on every first render |
| `guideMe` | `boolean` | P3-08; `true` until the stored value is read after mount |
| `cachedMemory` | `{ body: MemoryBody; savedAt: string } \| null` | P3-07: `loadMemory` after mount; replaced by each live body |
| `configured` | `boolean` | the provider's prop (below) |
| `connect()` | `() => Promise<void>` | moved from TalkSession |
| `leave()` | `() => void` | moved; also cancels a `closing` retry (P3-07) |
| `toggleMic()` | `() => void` | moved |
| `startAudio()` | `() => void` | moved |
| `sendMessage(text)` | `(text: string) => Promise<boolean>` | moved |
| `forgetMe()` | `() => Promise<void>` | moved; on success also `clearMemory` (P3-07) |
| `calloutSeen` | `boolean` | P3-05: `true` until the key is read after mount (so nothing renders on the server), then the stored value; set by `openPanel()` and `dismissCallout()` |
| `openPanel()` | `() => void` | P3-04: sets `'open'`; from P3-05 also marks the callout seen (state and storage) |
| `dismissCallout()` | `() => void` | P3-05: the callout's Close: `calloutSeen` true and the key stored |
| `minimizePanel()` | `() => void` | P3-04: sets `'closed'`; the widget takes focus back (§ Panel) |
| `setGuideMe(on)` | `(on: boolean) => void` | P3-08: sets and stores it |

The value is built with `useMemo` over the state pieces; the actions are `useCallback`s that read the session ref,
so their identity is stable and a consumer that only calls actions doesn't re-render on every transcript delta.
One context is enough for P3 (the widget, the panel and `/talk` all read state); splitting state and actions is a
P3-10 simplification candidate only if a profile shows a cost.

### What moves out of TalkSession.tsx, function by function

| In `TalkSession.tsx` today | After P3-03 |
|---|---|
| `RoomAudio` (`next/dynamic`) | provider: rendered once, `{room && <RoomAudio room={room} />}`, so audio plays on every page |
| `AGENT_JOIN_TIMEOUT_MS`, `FORGET_TIMEOUT_MS`, `TOKEN_ROUTE`, `STREAM_TOPICS`, `SEGMENT_ID`, `TRANSCRIPTION_FINAL` | provider module (tests import `AGENT_JOIN_TIMEOUT_MS` from the provider; `STREAM_TOPICS` gains `TOPIC.navigate` in P3-08) |
| `interface Session`, `teardown()` | provider module, unchanged (P3-07 adds `retry` to `Session`) |
| `Credentials`, `isBusyReason`, `fetchCredentials()` | provider module, unchanged |
| `readBody()`, `unlockAudio()` | provider module; P3-07 has `readBody` hand `use` the raw text too (`use(body, text)`), so the memory handler can `saveMemory` the text it parsed |
| unmount `useEffect` (teardown) | provider (unmount now means leaving the chrome: `/card*`, or the tab closing) |
| `release()`, `endSession()`, `setMic()` | provider, inside the component |
| `connect()`, `leave()`, `toggleMic()`, `startAudio()`, `sendMessage()`, `forgetMe()` | provider actions, bodies unchanged except `configured` read from the prop |
| `statusText`, `statusLine`, `forgetLine` | `src/components/concierge/status.ts`: `statusLine(state)` and `forgetLine(state)`, pure, shared by `/talk` and the drawer |
| `button`, `primary`, `quiet` class strings | `src/components/concierge/buttons.ts` (both views use them) |
| `primaryRef`, `wasInSession` focus effect, `onPrimaryClick`, `onPrimaryKeyDown` | stay in the view: `src/components/concierge/CallControls.tsx` (the one Connect/Leave button, mic toggle, Turn on sound, status line), used by `TalkSession` and `ConciergePanel` |
| the JSX | `TalkSession` keeps its grid and reads `useConcierge()`; nothing else in it |

TalkSession.tsx's prop `configured` goes; `src/app/talk/page.tsx` renders `<TalkSession />`.

### `configured` without importing env.ts into a client file

`src/app/layout.tsx` is a Server Component and may import `@/lib/concierge/env` (`server-only`). It renders
`<SiteChrome configured={conciergeEnv() !== null}>`; `SiteChrome` (client) passes the boolean to
`<ConciergeProvider configured={configured}>`. Only a boolean crosses the server/client boundary (P3-08 adds a second
serializable prop the same way: `usherTargets`, the project slugs and short titles, § Usher). The layout is
prerendered, so this is read at build time, exactly as `/talk`'s page reads it today (D46): an env change needs a
redeploy anyway. Guard: `grep -rln 'concierge/env' src/components` prints nothing (P3-03 step), and `next build`
fails if a client file reaches `env.ts` through `server-only`. `src/app/talk/page.tsx` stops importing `env.ts`.

### `pagehide`

The provider adds `window.addEventListener('pagehide', onPageHide)` in a mount effect and removes it in the cleanup.
`onPageHide` runs `teardown(sessionRef.current)` (listeners off, the four text-stream handlers unregistered,
`room.disconnect()`), without dispatching: the page is going away. A hard navigation, a reload or a tab close then
leaves the room at once; the agent's 20 s departure rule (§ 7) closes the session, so the next Connect from this
address is not `busy` for ten minutes. `pagehide` rather than `beforeunload` (bfcache-safe, and more reliable on mobile; a backgrounded tab that the
browser discards may fire neither, and the agent's 20 s rule covers that). A page restored from bfcache (`pageshow` with `persisted: true`) would still show the
phase it had, over a session that is already `alive: false`: the same effect listens for that `pageshow` and
calls the `leave()` action (`endSession()`, so `setRoom(null)` drops `RoomAudio` too, then `dispatch({ type:
'leave' })`), which resets to idle, so the visitor sees Connect again (one line, tested with a synthetic
event).

### StrictMode

Next's App Router runs React StrictMode in dev: every effect mounts, unmounts and mounts again. The rules that make
this safe, all already true of TalkSession and kept:

- The Room, the visitor id and the stream handlers are made in the Connect click handler, never in an effect (D45),
  so a double-mounted effect can't make a second Room or register a handler twice.
- The unmount effect tears down `sessionRef.current`, which is null on the simulated first unmount.
- `connect()` starts with `endSession()`, so two Connects in a row never leave two Rooms connected.
- The mount effects that read storage (P3-05 callout, P3-07 cache, P3-08 Guide me) only read and set state: run
  twice, they set the same value. None writes storage on mount.
- `pagehide` and `pageshow` listeners are added and removed by the same effect.

## Contract v2

**Built (P3-02):** everything in this section, as written, in `contract.ts`, `memoryCache.ts` and `visitorId.ts`
(`readVisitorId`); tests in `concierge-contract.test.ts`, `concierge-memory-cache.test.ts` and
`concierge-visitor-id.test.ts`. Nothing calls the v2 fields, `parseNavigate` or the cache yet (P3-06, P3-07, P3-08).

`src/lib/concierge/contract.ts` (P3-02). The rule for every v2 field: **optional, and never the reason a body is
rejected.** A v1 body (no `v`, none of the v2 keys) parses to exactly the object it parses to today: the v2 keys are
left off the result (not set to `null`), so the existing `concierge-contract.test.ts` cases stay `toEqual`-green. A
body that has `v` (a number ≥ 2) or any of `about_visitor`, `about_agent`, `retention_days` gets all four keys on the
result, each `null` when absent or malformed. v1's own rules don't change: a malformed entry in `facts` still rejects
the whole body (v1 behaviour, pinned); a malformed entry inside a v2 list is dropped on its own. "Not reported"
means the parsed value is `null` (or the v2 key is missing, for a v1 body); the page renders it as the line
`talkPage.memoryView.notReported` = **"not reported by this agent version"** (or `–` in a single cell, via
`format.ts`).

| Field (§ 7) | Type on `MemoryBody` | Value from a v1 agent | What the page renders then | Parser rule |
|---|---|---|---|---|
| `v` | `v?: number \| null` | key absent | nothing (only selects the v2 read) | integer ≥ 2 kept; anything else `null` |
| `about_visitor` | `about_visitor?: AboutVisitor \| null` | key absent | Profile from `facts`; the summary; one line "not reported by this agent version" for Episodes and Events | object kept, else `null` |
| `about_visitor.profile` | `MemoryFact[]` | — | v1: `facts` | array of facts via `parseFact`; a bad entry is dropped, not the body; not an array → `null` (the page then uses `facts`) |
| `about_visitor.episodes` | `Episode[]`, `{ visit: number; started_at: string \| null; ended_at: string \| null; summary: string \| null }` | — | "not reported by this agent version" | entries with an integer `visit` kept, others dropped; first 5 kept; not an array → `null` |
| `about_visitor.events` | `MemoryEvent[]`, `{ ts: string \| null; type: string; detail: string }` | — | "not reported by this agent version" | entries with string `type` and `detail` kept; `type` outside the seven named (`fact_added`, `fact_invalidated`, `fact_deleted`, `gate_rejected`, `extraction_ran`, `remember`, `forget`) is kept as the string; first 12 kept; not an array → `null` |
| `about_agent` | `about_agent?: AboutAgent \| null` | key absent | About the agent: one line "not reported by this agent version" | object kept, else `null`; each sub-field below on its own |
| `about_agent.knowledge` | `{ words, est_tokens: number \| null; sources_commit: string \| null; sections: string[] } \| null` | — | Knowledge row "not reported…" | object → numbers via `num`, `sections` keeps string entries; else `null` |
| `about_agent.instructions_est_tokens` | `number \| null` | — | `–` | `num` |
| `about_agent.memory_block_chars` | `number \| null` | — | `–` | `num` (§ 7 allows `null`) |
| `about_agent.working` | `{ items, est_tokens, compactions: number \| null; compacted: boolean \| null } \| null` | — | Working row "not reported…" | object → `num` / boolean; else `null` |
| `about_agent.cache` | `{ cached_share: number \| null } \| null` | — | Cache row `–` | object → `cached_share` a number in [0, 1] else `null` |
| `retention_days` | `retention_days?: number \| null` | key absent | the privacy note's "30 days" line stands alone | positive integer, else `null`; when set, the Memory tab's footer reads "Kept {n} days after your last visit" |
| `concierge.navigate` `href` | `NavigateBody.href: string` | never sent | — | required non-empty string (the allowlist is a separate check, § Usher) |
| `concierge.navigate` `reason` | `NavigateBody.reason: string \| null` | — | not shown (the notice names the destination) | string or `null` |
| `concierge.navigate` `at` | `NavigateBody.at: string \| null` | — | not shown | string or `null` |

Also in P3-02:

- `TOPIC.navigate = 'concierge.navigate'` and `RPC_GET_MEMORY = 'concierge.get_memory'`.
- `parseNavigate(text): NavigateBody | null`: `null` for a body over **1 KiB** (`MAX_NAVIGATE_BYTES = 1024`, the
  same `utf8Bytes` count `parseObject` uses for 15 KiB; `parseObject` takes the limit as a parameter), for
  non-JSON, a non-object, or a missing/empty `href`. Never throws.
- `isAllowedHref(href, slugs)` (§ Usher).
- `concierge.get_memory` returns the v2 body; it parses with `parseMemory`. P3 defines the name and does not call
  it (D95): the agent pushes `concierge.memory` at session start and after every merge, and the cache (P3-07)
  covers the before-the-call view. A later feature can call it after a `Reconnected` to resync.
- `src/__tests__/fixtures/concierge.ts` gains `memoryV2` (a full v2 body: three profile facts, two episodes with the
  current one `ended_at: null`, five events including one `gate_rejected` and one unknown type, `about_agent` with
  every field, `retention_days: 30`) and `memoryV2Json`, and `memoryV2NoAgent` (`v: 2`, `about_agent` missing).
- `src/lib/concierge/memoryCache.ts` (§ Cache).

## Panel

`src/components/concierge/ConciergePanel.tsx` (`'use client'`, P3-04; the strip and tabs come in P3-06).

*Built in P3-04* as below (D86 *As built*), plus: offline or busy shows "Read how it works" under the controls
(`DeepDiveLink.tsx`, the same link `/talk` shows; in the panel its click minimizes); the transcript is `Transcript
fill`; the sheet adds the safe-area inset at its bottom and scrolls on a short screen. Esc: inner handlers that own
an Esc call `preventDefault` (not `stopPropagation`); an IME composition's Esc is ignored. The widget is `invisible`
while the panel is open, and reaching `/talk` closes the panel. The Footer padding change waits for the pill (P3-05).

At ≥ 1024 px (`lg`), a 420 px drawer on the right, from under the Navbar to the bottom of the viewport:

```
 ┌────────────────────── Navbar (fixed, z-50, 64 px) ─────────────────────────┐
 │                                                 ┌─ ConciergePanel z-[45] ──┐
 │                                                 │ Ask my site        [ — ] │  header: h2 title (tabIndex -1),
 │                                                 │ [Connect] [Mute] ◉Guide  │  Minimize; CallControls row;
 │                                                 │ Connected. Say hello…    │  status line (role=status)
 │   the page, still usable                        ├──────────────────────────┤
 │   (no inert, no scroll lock;                    │ Transcript  (role=log)   │  flex-1, scrolls
 │    the right 420 px is under                    │  You: …                  │
 │    the drawer while it is open)                 │  Concierge: …            │
 │                                                 ├──────────────────────────┤
 │                                                 │ [ Type a message ][Send] │  MessageBox
 │                                                 ├──────────────────────────┤
 │                                                 │ ●Profile 3 ●Episodes 2 … │  MemoryStrip (P3-06)
 │                                                 │ Memory | Latency | Priv. │  PanelTabs (P3-06), the tab
 │                                                 │ (tab panel, max 40 vh)   │  panel scrolls on its own
 └─────────────────────────────────────────────────┴──────────────────────────┘
```

At 390 px (below `lg`), a full-height bottom sheet under the Navbar (the Navbar stays visible and usable above it):

```
 ┌──────── Navbar (z-50, 64 px) ─────────┐
 ├───────── ConciergePanel z-[45] ───────┤  fixed inset-x-0 bottom-0 top-16 max-h-dvh
 │ Ask my site                     [ — ] │  rounded-t-xl border-t
 │ [Connect]  [Mute]  ◉ Guide me         │  controls wrap onto two rows if needed
 │ The concierge is offline right now    │
 ├───────────────────────────────────────┤
 │ Transcript (role=log, flex-1)         │
 ├───────────────────────────────────────┤
 │ [ Type a message           ] [Send]   │
 ├───────────────────────────────────────┤
 │ ●Profile 3 ●Epis. – ●Events – …       │  strip scrolls sideways inside itself
 │ Memory | Latency | Privacy            │  (overflow-x-auto), never the page
 │ (tab panel, max 35 vh, scrolls)       │
 └───────────────────────────────────────┘
```

- **Classes**, one string for both layouts: `fixed z-[45] inset-x-0 top-16 bottom-0 max-h-dvh flex flex-col
  rounded-t-xl border-t border-white/10 bg-[var(--color-surface)] lg:left-auto lg:right-0 lg:w-[420px]
  lg:rounded-none lg:border-t-0 lg:border-l` (`lg:left-auto` releases `inset-x-0`'s left, so the drawer sits on the
  right).
- **Role.** `<section id="concierge-panel" role="dialog" aria-modal="false" aria-labelledby="concierge-panel-title">`. Not modal: no
  focus trap, no `inert` on the page, no `overflow-hidden` on `body` (the agent can usher the visitor while they
  read). Rendered only while `panel === 'open'` (so a closed panel adds nothing to the DOM, the smoke check's
  horizontal-scroll test sees nothing, and `a11y-new-pages` sees one dialog only when it opens it).
- **Where.** `SiteChrome`: after the Footer, before the widget (`<ConciergePanel />` then `<VoiceWidget />`), so
  the DOM order is page → Footer → panel → pill. Never on `/talk` (TalkSession is the full-page view of the same
  state; SiteChrome skips both the panel and the pill there) and never on `/card*` (no chrome, no provider).
- **Focus order inside** (DOM order is visual order, as the layouts draw it): title (programmatic target only,
  `tabIndex={-1}`) → Minimize (end of the title row) → Connect/Leave → mic toggle (live only) → Turn on sound (when
  blocked) → Guide me switch (P3-08) → transcript log (focusable, as today) → message field → Send → strip (not
  focusable: text) → tabs (one tab stop, arrows move) → the tab panel's controls (Forget me…).
- **Open.** The pill calls `openPanel()`; an effect in the panel focuses the title (`preventScroll: true`) on mount.
- **Esc.** `onKeyDown` on the dialog: `Escape` → `minimizePanel()` (only when the event wasn't already handled:
  ForgetMeButton's confirm step's own Esc, if it adds one, calls `stopPropagation`).
- **Minimize / Esc** set `panel: 'closed'` and do nothing else: the call, its Room and the phase stay. Focus goes back
  to the pill: VoiceWidget has an effect on `panel` that focuses its own button when the panel goes from open to
  closed (`preventScroll: true`), unless focus has already moved to something on the page (a link the visitor
  clicked); no `widgetRef` in the context.
- **z-index.** Navbar `z-50` > panel `z-[45]` > pill `z-40`. The skip link stays `z-[60]`. At ≥ 1024 the open
  drawer covers the pill (bottom right); the visitor closes it with Minimize or Esc. Below `lg` the sheet covers the
  page and the pill.
- **Footer padding.** The pill (§ Widget) is about 150 × 48 px, wider than the 56 px disc, and at `xl` the Footer's
  links row (right-aligned in `max-w-6xl`) would sit under it: `pb-24 xl:pb-8` becomes `pb-24` at every width
  (Footer.test.tsx pins `pt-8 pb-24` and no `xl:pb-8`). The open panel needs nothing from the Footer: it overlays.
- **Height.** The transcript is the `flex-1` region (`min-h-0`, scrolls); the tab panel has a `max-h` (40 vh at lg,
  35 vh below) and scrolls on its own, so the transcript keeps at least half the sheet.
- **Heading levels.** The title is an `h2`; Transcript's `TalkPanel` heading is an `h2` too (a dialog after the
  Footer starts its own outline at h2); the tab panels use `h3` for About you / About the agent. No skipped level
  (a11y-new-pages checks it with the panel open).

## Widget

*Built in P3-05* as below (D87 *As built*); the live states key on `phase === 'live'` (connecting and waiting show
the idle pill: the panel's status line says how far Connect got), and the dot is red with a background ring.

`src/components/VoiceWidget.tsx` (P3-04 makes it a toggle button, P3-05 the pill). A `<button type="button"
aria-expanded={panel === 'open'}>` with `aria-controls="concierge-panel"` only while the panel is open (the
section exists only then), `fixed right-4
bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 print:hidden`, `rounded-full`, accent background, `h-12`,
`px-4`, `gap-2`, the shared `focusRing` with `focus-visible:outline-offset-4`. Copy in `talkWidget` (§ Copy).

| State | When | Visible | Accessible name |
|---|---|---|---|
| idle | no session, or a session not yet live (`idle`, `connecting`, `waiting`, `closing`, `busy`, `offline`, `ended`) | glyph (bars still) + "Ask my site" | "Ask my site" (the visible label) |
| live, listening | `phase === 'live' && !agentSpeaking` | glyph (bars still) + "Ask my site" + a 8 px live dot (accent-on-background ring, `aria-hidden`) | "Ask my site: listening" (`aria-label`) |
| live, speaking | `phase === 'live' && agentSpeaking` | glyph (bars moving, `motion-safe:` only) + label + live dot | "Ask my site: speaking" |

- **Collapse at ≤ 390 px.** A client effect reads `matchMedia('(max-width: 390px)')` and `window.scrollY` on
  `scroll` (passive listener) and on the media query's `change`; when both hold (`matches && scrollY > 0`) the
  button gets `data-collapsed="true"`, the label span gets `sr-only` and the button becomes a 48 px circle
  (`w-12 px-0 justify-center`). The accessible name is unchanged (the label is still in the DOM, or the
  `aria-label` in the live states). Above 390 px it never collapses; at 390 before any scroll it shows the label.
  First render (server and client) is expanded: the effect sets it after mount, so no hydration mismatch.
- **Sound-bars glyph.** Inline `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="h-4 w-4">`
  with three `<rect>` bars (x 2, 7, 12; width 2; heights 6, 10, 6, vertically centred, `rx="1"`, `fill:
  currentColor`). While `agentSpeaking`, each rect gets `motion-safe:animate-[concierge-bar_0.9s_ease-in-out_infinite]`
  with staggered `[animation-delay:…]` (0, 150, 300 ms) and `origin-center` / `[transform-box:fill-box]`;
  `@keyframes concierge-bar` (scaleY 0.4 → 1 → 0.4) goes in `globals.css` next to the tokens. While not speaking
  the rects carry no animation class at all (the test checks for absence), so the bars are still. Under reduced
  motion `motion-safe:` never applies.
- `agentSpeaking` (provider): `RoomEvent.ActiveSpeakersChanged` with `speakers: Participant[]` → `speakers.some(p =>
  p.identity === session.agentIdentity)`; false at teardown. The LiveKit mock gains `RoomEvent.ActiveSpeakersChanged
  = 'activeSpeakersChanged'` and a helper `setSpeakers(room, identities)` that emits it.
- The old pulsing ring goes (the callout is the one-time invitation now; D87).

## Callout

*Built in P3-05* as below (D88 *As built*): SiteChrome renders it after the panel and before the pill; after the
P3-05 review it also goes for good on Esc and Connect, hands focus to the pill when it had it, and shows only at the
top of a page with the Footer out of sight.

`src/components/concierge/Callout.tsx` (`'use client'`, P3-05), rendered by SiteChrome next to the pill (same
fixed corner, `bottom` offset above the pill: `bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)]`,
`right-4`, `max-w-[16rem]`, `z-40`, `print:hidden`).

- **Storage key** `concierge.callout_seen`, value `'1'`, in `localStorage` through `browserStorage()`; every read
  and write in try/catch.
- **Text, exactly:** "This site talks. Ask it about my work, by voice or text." (`talkWidget.callout`), and a close
  button `aria-label="Close"` (an `×` glyph, `aria-hidden`). The bubble is a `<div role="note">` (not a dialog,
  not live: it's static text that appears once).
- **State lives in the provider** (`calloutSeen`, `dismissCallout()`), not in Callout, so opening the panel hides
  it for good on this page too: after Minimize or Esc the pill shows with no callout (P3-09's capture).
- **When it shows.** Only after mount (the provider's `useEffect` reads the key; the server HTML and the first client render have
  no callout); only when the key is absent; only while `panel === 'closed'`; never on `/talk` (no pill there) or
  `/card*` (no chrome). A storage whose `getItem` throws: shown (the read failed, treat as first visit), and no
  error escapes.
- **Dismissal.** The close button, or opening the panel (`openPanel()`), sets the key and hides it for good. A
  visit that neither closes nor opens leaves the key unset: it shows again next load until one of the two happens
  (the spec's "dismissed by closing or by opening the panel"). A storage whose `setItem` throws: hidden for this
  page's life, shown again next load.
- **Motion.** Entrance `motion-safe:animate-[concierge-callout_200ms_ease-out]` (fade + 4 px rise, keyframes in
  `globals.css`); no animation under reduced motion.

## Memory view

*Built in P3-06* as below (D90 *As built*): `globals.css` tokens, `design-tokens.test.ts` (ratio helper in
`src/__tests__/helpers/contrast.ts`), `MemoryStrip.tsx`, `PanelTabs.tsx` (`compact` in the drawer), `MemoryView.tsx`;
`MemoryPanel.tsx` and its test are gone; `LatencyPanel` has no heading of its own. On `/talk` the strip and tabs
are the right column from lg (after the message box in the DOM, under it below lg). Changed by the review: the strip
wraps (no `overflow-x-auto`), the compact cap is 25 vh below lg, and both callers wrap strip + tabs in a `section`
with an `sr-only` h2.

P3-06. Six kinds, two sections (spec § 5). New tokens in `globals.css` `@theme inline` (named `--color-mem-*` so
Tailwind exposes them and `a11y-new-pages`' `--color-<name>` reader finds them). Ratios computed with the WCAG
relative-luminance formula `a11y-new-pages.test.tsx` uses:

| Kind | Section | Token | Hex | vs `#12121a` (surface) | vs `#0a0a0f` (background) | vs `#1a1a2e` (surface-alt) |
|---|---|---|---|---|---|---|
| Profile | About you | `--color-mem-profile` | `#00d4ff` (the accent) | 10.52 | 11.16 | 9.63 |
| Episodes | About you | `--color-mem-episode` | `#fbbf24` (amber) | 11.16 | 11.83 | 10.22 |
| Events | About you | `--color-mem-event` | `#4ade80` (green) | 10.69 | 11.33 | 9.79 |
| Events: `gate_rejected` | About you | `--color-mem-event-rejected` | `#f87171` (red) | 6.74 | 7.14 | 6.17 |
| Knowledge | About the agent | `--color-mem-knowledge` | `#a78bfa` (violet) | 6.85 | 7.26 | 6.27 |
| Working | About the agent | `--color-mem-working` | `#f472b6` (magenta) | 7.03 | 7.46 | 6.44 |
| Cache | About the agent | `--color-muted` (existing) | `#8888a0` | 5.39 | 5.71 | 4.94 |

Every ratio ≥ 4.5 on all three surfaces. `src/__tests__/lib/design-tokens.test.ts` asserts it against `#12121a`
and `#0a0a0f` (the ratio function moves to `src/__tests__/helpers/contrast.ts`, imported by both tests).

**MemoryStrip** (`src/components/concierge/MemoryStrip.tsx`): five chips, Profile · Episodes · Events · Knowledge ·
Working, each a coloured dot (its token) + label + count, in one `ul` (`flex gap-2 overflow-x-auto`).

| Chip | Count from a v2 body | From a v1 body |
|---|---|---|
| Profile | `about_visitor.profile.length` (falls back to `facts.length` when `about_visitor` or its `profile` is null) | `facts.length` |
| Episodes | `about_visitor.episodes.length` | `–` |
| Events | `about_visitor.events.length` | `–` |
| Knowledge | `about_agent.knowledge.sections.length` | `–` |
| Working | `about_agent.working.items` | `–` |

A `–` chip has `title="not reported by this agent version"` and the same words `sr-only`. No body yet (and no cache):
every chip `–` with no title (nothing has been reported yet, by any version). A chip whose count differs from the
previous body's gets `motion-safe:animate-pulse motion-safe:[animation-iteration-count:1]` (prefixed too, so it comes after the
`animation` shorthand, as VoiceWidget's ring does today) for that body (a `key`
bump replays it); an unchanged chip has no animation class (tested with `rerender`). The previous counts are kept with React's
previous-props state pattern (or set in an effect), never a ref written during render, so StrictMode's double render
in dev doesn't swallow the pulse.

**PanelTabs** (`src/components/concierge/PanelTabs.tsx`): `role="tablist"` with three `role="tab"` buttons Memory ·
Latency · Privacy (`aria-selected`, `aria-controls`, roving `tabIndex`: the selected tab 0, the others −1;
ArrowLeft/ArrowRight wrap, Home/End jump; automatic activation), and one `role="tabpanel"` per tab
(`aria-labelledby` its tab, `tabIndex={0}`, the hidden ones `hidden`). Memory is selected first. Latency renders
`LatencyPanel turns={state.turns}`; Privacy renders `privacyNote` as the list `/talk` shows (`/talk` keeps its own
Privacy section too).

**MemoryView** (`src/components/concierge/MemoryView.tsx`), the Memory tab:

- **About you** (h3)
  - Profile: one chip per fact (`mem-profile` border): slot (mono, uppercase), value, a channel glyph (`voice` → a
    small sound-wave svg, `text` → a cursor svg, other or null → none; `aria-hidden`, with the channel name
    `sr-only`), learned-at in `title` (the `LEARNED_AT_FORMAT` from MemoryPanel, which moves to `format.ts`).
  - Episodes: one row per visit, "visit n · date · summary" (`mem-episode` marker), newest first as sent; the row
    with `ended_at: null` reads "visit n · date · in progress"; a null summary on an ended visit reads `–`.
  - Events: newest first as sent, at most 12, one sentence each (`detail`), the marker in `mem-event`, a
    `gate_rejected` row in `mem-event-rejected`; time in `title`.
  - From a v1 body: Profile from `facts`, the `summary` under it (as "Summary"), then the one line "not reported by
    this agent version" for Episodes and Events.
- **About the agent** (h3)
  - Knowledge (`mem-knowledge`): words, est. tokens, sections (count, the names in `title`), source commit (first 7
    characters, mono).
  - Working (`mem-working`): items, est. tokens, compacted Yes/No, compactions.
  - Cache (muted): cached share as a percentage (`percent` from `format.ts`).
  - A null number renders `–` (`orDash`); a whole null object renders its row as "not reported by this agent
    version"; a v1 body (no `about_agent` key) renders the section as that one line.
- **Forget me**, always at the foot of the tab: live → `ForgetMeButton` (its confirm step, unchanged); otherwise a
  disabled `<button disabled>Forget me</button>` with the hint **"Connect to erase what it remembers"** under it
  (linked by `aria-describedby`). The forget status line (`forgetLine`) sits under both.
- No body and no cache: "Nothing remembered yet" (today's `talkPage.empty.memory`).

`MemoryPanel.tsx` is replaced by `MemoryView` (P3-06): `FactRow`'s detail list and `LearnedAt` move into
MemoryView's Profile chips; `MemoryPanel.test.tsx` becomes `MemoryView.test.tsx` (v1 and v2 fixtures).

## Cache

P3-02 builds the module (built: `src/lib/concierge/memoryCache.ts`), P3-07 wires it. *Wired in P3-07* as below:
the provider's `cachedMemory`, `status.ts` `shownMemory(state, cachedMemory)` for the strip and the tab, the greyed
view with `data-stale` (every line `--color-muted` through Tailwind's `**:` variant, dots at 60 %), and a cached body
never pulses the strip; once forgotten the tab shows only the "Forgotten" line (D91 *As built*).

- **Key per visitor id:** `concierge.memory.<visitor_id>`, the id lower-cased by the key builder (`isUuidV4`
  accepts either case, and the token route lower-cases it too, D43), in `localStorage`.
- **Stored shape:** `JSON.stringify({ v: 1, savedAt: '<ISO 8601>', body: '<the raw JSON text of the concierge.memory
  body, as received>' })`. The raw text is stored, not the parsed object, so `loadMemory` re-parses it with
  `parseMemory` and an old cache can never smuggle a shape the parser wouldn't produce. `v` is the cache format.
- `saveMemory(storage, visitorId, bodyText, savedAt)`, `loadMemory(storage, visitorId) → { body: MemoryBody;
  savedAt: string } | null`, `clearMemory(storage, visitorId)`; `storage` is `Pick<Storage, 'getItem' | 'setItem' |
  'removeItem'> | undefined` (from `browserStorage()`). Every call in try/catch; a throwing storage never throws
  out. Corrupt JSON, a wrong `v`, a non-string `body`, or a body `parseMemory` rejects → `null`. A different
  visitor id reads a different key → `null`.
- **Reading the id without making one.** Loading the cache after mount must not create a visitor id (D45: a visitor
  who never presses Connect gets no id stored). `visitorId.ts` gains `readVisitorId(storage): string | null` (the
  stored valid id lower-cased, or null; never writes). No id → no cache read.
- **When.** Each parsed `concierge.memory` body during a call: `saveMemory` with `new Date().toISOString()`, and
  `cachedMemory` updated. After mount: `loadMemory` once. After Forget me succeeds: `clearMemory`, `cachedMemory`
  null, and the Memory tab shows "Forgotten". The agent then ends the call with a final `concierge.memory` (§ 7):
  once `forget === 'done'` in this session, memory bodies are neither saved nor dispatched, so "Forgotten" stays
  and the cache stays empty. The view before a call (`state.memory === null`) renders
  `cachedMemory.body` with `data-stale="true"` (text in `--color-muted`, chips at 60 % opacity) and the line "as of
  <time>" (`savedAt` in `LEARNED_AT_FORMAT`); a live body replaces it.
- Size: a body is at most 15 KiB, one key per browser's visitor id: well under any quota. A `setItem` that throws
  (quota, private mode) just doesn't cache.

## Busy retry

P3-07. *Built in P3-07*, with one difference from the table: a token on a retry dispatches a new `closed`
(closing → connecting) before the Room is made, so `connected` and `agentJoined` stay as they were (accepted from
`connecting`/`waiting` only); the retry is a loop in `connect()` waiting on the session's `timer` (D92 *As built*).
Today (D66) a 429 `busy` ends the Connect with a status line and no retry. With § 7's 20 s departure rule, a
visitor whose earlier room is still closing (a reload, a second tab just closed) gets `reason: 'visitor'` for up to
about 30 s; the page waits it out.

- New phase **`closing`** in `sessionReducer.ts`, status line `talkPage.status.closing` = **"Closing your earlier
  conversation…"**. `inRoom('closing')` is false (no Room exists), but the Connect/Leave button shows **Leave**
  (the view's `inSession` becomes `inRoom(phase) || phase === 'closing'`, exported as `isActive(phase)`).
- The provider keeps the retry on the `Session` (`retry: { timer, deadline }`): every **5 s**
  (`BUSY_RETRY_MS = 5_000`) it re-POSTs the token route, **one request in flight** (the next timer is set only
  after the previous response or failure), until a 200 continues the same `connect()` path (the Room is made then)
  or **60 s** (`BUSY_RETRY_LIMIT_MS = 60_000`, measured from the first 429) pass, when it dispatches `busy` with
  `reason: 'visitor'`, so the v1 `busyVisitor` line shows, and stops. `teardown` clears the timer; `alive` guards a
  response that lands after Leave.
- **Leave** during `closing`: `leave()` → `endSession()` clears the timer, `alive = false`; no further request.
- `reason: 'site'` and offline are unchanged (D66 kept for them).

| From | Action | To | Notes |
|---|---|---|---|
| `connecting` | `{ type: 'closing' }` (429 busy/visitor, first) | `closing` | timer set for 5 s |
| `connecting` | `busy` with `reason: 'site'` | `busy` | unchanged, no retry |
| `closing` | none: each further 429 visitor dispatches nothing (the retry timer is the provider's) | `closing` | one POST per 5 s |
| `closing` | `connected` (200, room.connect resolved, no agent yet) | `waiting` | the reducer accepts `connected` from `closing` as from `connecting` |
| `closing` | `agentJoined` (agent already in the room) | `live` | accepted from `closing` too |
| `closing` | `offline` (503, non-OK, fetch rejected, a 429 with another body) | `offline` | |
| `closing` | `busy` `reason: 'site'` (the site filled up meanwhile) | `busy` (site) | no further request |
| `closing` | `busy` `reason: 'visitor'` dispatched at 60 s | `busy` (visitor) | the v1 line; no further request |
| `closing` | `leave` | `idle` | timer cleared |
| `busy`, `offline`, `ended`, `idle` | `connect` | `connecting` | unchanged |

`.harness/talk-busy-check.mjs` gains the closing scenario (P3-07): route answers 429 visitor → the closing line,
POST timestamps 5 s apart (± 500 ms) with never two open, and after 60 s the busy line.

## Usher

P3-08. "Guide me": the agent's `show_page` tool sends `concierge.navigate` (§ 7) and the page follows it.

**Built (P3-08):** as written, with these differences. (1) The targets live in `src/lib/concierge/usher.ts`:
`usherTargets(projects)` (slug + title up to the first `:`), `usherName(href, targets, pageNames)` and
`USHER_INTERVAL_MS`; `layout.tsx` calls `usherTargets(projects)` and `SiteChrome` passes them to the provider
(default `[]`). (2) Three more refusals (the last two from the review): a body for the page already shown
(`pathname === href`), so the transcript never says "Taking you to About" on About; a body from any identity but
`session.agentIdentity`; and any body within 8 s of the visitor's own navigation (a same-tab link click, seen in the
capture phase, or `popstate`), so a body that lands while their page loads can't overtake it. Like every refusal
they leave the usher's clock alone. The clock is `performance.now()`, not `Date.now()`. Instead of `guideMeRef` and
`pathnameRef` the handler reads one ref, `usher` (`{ guideMe, pathname, router, targets }`), synced in an effect. (3) The
switch is `GuideMeSwitch.tsx`, its own row under `CallControls` (the controls row is shared with `/talk`, which has
no switch); the focus order is as § Panel lists. The clock and the notice counter are per session (`Session.ushered`,
`Session.notices`). (4) The tests' `next/navigation` mock is `src/__tests__/helpers/navigation.ts` (`mockNavigation`,
`mockRouter`, `navigation.pathname`, `resetNavigation`), not part of `helpers/concierge.tsx`: it has no imports, so a
`jest.mock` factory can load it first. Tests: `usher.test.tsx` (26), `Transcript.test.tsx`, `sessionReducer.test.ts`,
`ConciergePanel.test.tsx`, `layout-concierge.test.tsx` (the prop, and no concierge client file imports the projects
data).

- **Allowlist.** `isAllowedHref(href: string, slugs: readonly string[]): boolean` in `contract.ts`: true only for
  exactly `'/'`, `'/about'`, `'/skills'`, `'/experience'`, `'/contact'`, or `'/projects/<slug>'` with `slug` in
  `slugs` (exact string match, no decoding). False for anything else: `'//evil'`, `'https://…'`, `'/projects/'`,
  `'/projects/unknown'`, `'/about?x'`, `'/about#y'`, `'/about/'`, `''`, `'/talk'`, `'/card'`, `'/evidence'`. The
  provider gets the slugs and titles as a prop, `usherTargets: { slug: string; title: string }[]`, built in
  `layout.tsx` next to `configured` and passed through `SiteChrome`, so the client bundle never imports `projects.ts`.
- **Handler.** Registered with the other stream handlers before `room.connect()` (`STREAM_TOPICS` now four topics,
  all unregistered at teardown). On a body that `parseNavigate` accepts, the provider follows it only when **all**
  hold: `guideMe` is on; `isAllowedHref`; at least **8 s** (`USHER_INTERVAL_MS = 8_000`) since the last followed
  body (the clock starts at the first follow; a refused body doesn't reset it); `usePathname()` is not `/talk`. The handler is registered once at Connect and outlives renders, so it reads
  `guideMeRef` and `pathnameRef`, both synced in an effect (`useEffect(() => { ref.current = value })`), never
  written during render. Then `router.push(href)` (`useRouter` from
  `next/navigation`) and one transcript line `{ key: 'notice-<n>', who: 'notice', text: 'Taking you to <name>',
  final: true }`, where name is the project's title up to its first `:` ("Agent Harness", "Voice Concierge"; a title without
  one whole: "GoHighLevel ↔ JobTread Integration") or the page name (Home, About, Skills, Experience, Contact,
  `talkWidget.pageNames`). Nothing else: a refused body adds no line.
- **Notice line.** `TranscriptLine['who']` gains `'notice'`; `Transcript.tsx` renders it muted, italic, with no
  speaker label; the reducer's "a new segment from the same speaker ends the previous one" rule skips notices.
- **Guide me switch** in the panel header: `<button role="switch" aria-checked={guideMe}>Guide me</button>`;
  default **on**; stored in `localStorage` key **`concierge.guide_me`** as `'on'`/`'off'` (try/catch both ways),
  read after mount: a stored `'off'` renders unchecked; a throwing storage leaves it on. Shown in the panel only
  (on `/talk` the usher never navigates, so the switch would do nothing there).
- **Never on `/talk`.** The visitor who opened the concierge as the full page stays on it; the panel keeps the call
  across client-side navigation everywhere else.

## Copy

All of it in `src/lib/data/concierge.ts` (no string hardcoded in a component), plus two lines in `projects.ts`.

| Where | Before | After | Feature |
|---|---|---|---|
| `talkPage.intro[0]` | "A voice agent I designed on LiveKit and built with my agent harness: specs in, verified milestones out. It remembers you between visits." | "A voice agent I designed on LiveKit and built with my agent harness. It remembers you between visits, shows you what it remembers and where each thing came from, and can take you to the work it's talking about." ("my agent harness" still links `/projects/agent-harness`; `after` becomes `. It remembers you…talking about.`) | P3-07 |
| `talkPage.intro[1]` | "This page shows what it remembers, where it learned each thing, and how long each turn took. Talk or type." | "Talk or type. The Latency tab shows how long each turn took, and Forget me on the Memory tab erases what it knows about you." (intro[0] now says what it shows; this names the button in its own words, the mismatch § 4.4 fixes) | P3-07 |
| voice-concierge `caseStudy.builtWith` (`projects.ts`) | "…My agent harness ran the build sessions, specs in and verified milestones out: Claude Code agents wrote this page's code overnight in one run, and a second run is writing the agent." | "The spec and the design are mine: the agent, its memory and the contract between it and this page. My agent harness ran the build sessions: Claude Code agents wrote this page's code overnight in one run, and a second run is writing the agent." | P3-07 |
| voice-concierge deep-dive line (`projects.ts` ~815) | "…as one bounded block after the fixed instructions and the knowledge pack," | "…as one bounded block after the fixed instructions and what it knows about my work," (no "pack" on the page; `evidence-voice-concierge.md` keeps the agent repo's term in its tables) | P3-07 |
| `talkWidget` | `{ label: 'Talk to my voice concierge', href: '/talk' }` | `{ label: 'Ask my site', listening: 'Ask my site: listening', speaking: 'Ask my site: speaking', callout: 'This site talks. Ask it about my work, by voice or text.', close: 'Close', panelTitle: 'Ask my site', minimize: 'Minimize', guideMe: 'Guide me', notice: 'Taking you to', pageNames: { '/': 'Home', '/about': 'About', '/skills': 'Skills', '/experience': 'Experience', '/contact': 'Contact' }, href: '/talk' }` (`href` stays: SiteChrome hides the pill and panel there) | P3-04/05/08 |
| `talkPage.status.closing` | — | "Closing your earlier conversation…" (the closing line) | P3-07 |
| `talkPage.status.busyVisitor` | "You already have a conversation open in another tab." | unchanged: the line after 60 s (D71 stands) | — |
| `talkPage.memoryView` (new) | — | `{ aboutYou: 'About you', aboutAgent: 'About the agent', kinds: { profile: 'Profile', episodes: 'Episodes', events: 'Events', knowledge: 'Knowledge', working: 'Working', cache: 'Cache' }, notReported: 'not reported by this agent version', inProgress: 'in progress', asOf: 'as of', visit: 'visit', forgetHint: 'Connect to erase what it remembers', retention: 'Kept {n} days after your last visit', knowledge: { words: 'Words', estTokens: 'Est. tokens', sections: 'Sections', source: 'Source' }, working: { items: 'Items', estTokens: 'Est. tokens', compacted: 'Compacted', compactions: 'Compactions' }, cachedShare: 'Prompt tokens from cache' }` (the forget-me hint) | P3-06/07 |
| `talkPage.headings` | `{ transcript, memory: 'What it remembers', latency, privacy }` | `{ transcript, memory: 'Memory', latency: 'Latency', privacy: 'Privacy' }` (the tab names; `/talk`'s privacy h2 keeps "Privacy") | P3-06 |
| `talkPage.memory` (talkingTo, visit, summary, fact labels) | MemoryPanel's labels | kept where MemoryView reuses them, the rest removed in P3-10's pass | P3-06 |

No new string carries a digit except through data (`retention_days`, counts). The forget-me rule: every string in
`concierge.ts` that contains "forget" (case-insensitive) spells the control "Forget me" (a P3-06 test).

## Tests

Existing tests that change, per feature, then the new files. "Provider render" means `renderTalk()` / `renderChrome()`
in the new `src/__tests__/helpers/concierge.tsx` (`renderTalk({ configured = true } = {})` renders
`<ConciergeProvider configured={configured}><TalkSession /></ConciergeProvider>` and returns RTL's result plus
`unmountTalk`/`remountTalk` that swap the child under the same provider; `renderChrome(pathname)` mocks the pathname
and renders `SiteChrome`).

| Feature | Existing tests that change | New tests |
|---|---|---|
| P3-02 | `concierge-contract.test.ts` (the parse cases untouched; the one existing case that changes is 'contract constants', whose `TOPIC` `toEqual` gains `navigate` and which adds `RPC_GET_MEMORY`; v2, navigate and allowlist cases appended); `fixtures/concierge.ts` (gains `memoryV2`, `memoryV2NoAgent`, JSON forms) | `concierge-memory-cache.test.ts` (round trip, other id, corrupt JSON, wrong `v`, throwing storage for get/set/remove); `concierge-visitor-id.test.ts` gains `readVisitorId` cases (never writes) |
| P3-03 | `TalkSession.test.tsx`, `TalkSession-live.test.tsx`, `TalkSession-review.test.tsx`, `TalkSession-import.test.tsx` (`render(<TalkSession …/>)` → `renderTalk(…)`; `configured={false}` → `renderTalk({ configured: false })`; `AGENT_JOIN_TIMEOUT_MS` imported from the provider; the import test's "LiveKit not loaded before Connect" now covers the provider module); `talk.test.tsx` (the page renders `TalkSession` with no `configured`; wrap in the provider or mock `TalkSession`); `SiteChrome.test.tsx` (`configured` prop; provider present on chrome pages, absent on `/card*`); `a11y-new-pages.test.tsx` (`/talk` through the provider); `layout-metadata.test.ts` if it renders the layout | `components/concierge/ConciergeProvider.test.tsx` (survives TalkSession unmount/remount, `leave()` disconnects, `pagehide` disconnects, two Connects one Room, `useConcierge` throws outside, StrictMode render makes no Room); `status.test.ts` for `statusLine`/`forgetLine` if they leave the component |
| P3-04 | `VoiceWidget.test.tsx` (a button with `aria-expanded`, not a link to `/talk`); `SiteChrome.test.tsx` (panel after the Footer, before the widget; neither on `/talk` nor `/card*`); `a11y-new-pages.test.tsx` (one dialog with the panel open; focusable controls styled) | `components/concierge/ConciergePanel.test.tsx` (role, `aria-modal="false"`, label, lg/bottom-sheet classes, `z-[45]`, focus to title on open, Esc and Minimize close and refocus the pill, minimize while live keeps the Room, no `inert`, no body overflow class) |
| P3-05 | `VoiceWidget.test.tsx` (pill label, three rects, states and names, collapse via mocked `matchMedia` + scroll); `Navbar.test.tsx` (six links desktop and mobile; the `aria-current` test that used Talk uses another link; the short-landscape scroll test's count); `Footer.test.tsx` (`pb-24`, no `xl:pb-8`); `SiteChrome.test.tsx` (callout next to the pill); `sitemap-robots.test.ts` unchanged and green (`/talk` stays); `src/__mocks__/livekit-client.ts` (`ActiveSpeakersChanged`, `setSpeakers`) | `components/concierge/Callout.test.tsx` (first visit shows exact text, Close sets the key, opening the panel sets it, key present → nothing, throwing storage shows it with no error, not in `renderToString` output, `motion-safe:` only); `ConciergeProvider.test.tsx` gains `agentSpeaking` cases |
| P3-06 | `MemoryPanel.test.tsx` → `MemoryView.test.tsx`; `TalkSession*.test.tsx` queries for "What it remembers" → the Memory tab; `talk.test.tsx` (strip + tabs on `/talk`, its own Privacy section kept); `a11y-new-pages.test.tsx` (`/talk` and panel open; contrast block reads the ratio helper); `LatencyPanel.test.tsx` unchanged; `concierge-data.test.ts` (headings, `memoryView` copy, the forget-me spelling test) | `lib/design-tokens.test.ts`; `components/concierge/MemoryStrip.test.tsx` (v1 dashes with title, v2 counts, pulse on change only, via `rerender`); `PanelTabs.test.tsx` (roles, `aria-selected`, arrows/Home/End, panels); `MemoryView.test.tsx` (v1, v2, nulls, Forget me enabled/disabled with the hint) |
| P3-07 | `sessionReducer.test.ts` (closing transitions, the table above); `TalkSession-live.test.tsx` (closing under fake timers: one POST per 5 s, never two in flight, 60 s → busy line, Leave cancels; `site` unchanged); `concierge-data.test.ts` and `talk.test.tsx` (the new intro, both paragraphs); `case-study-voice-concierge.test.ts` (new `builtWith`); `claims-on-linked-page.test.ts` if the deep-dive line is cited; `.harness/talk-busy-check.mjs` (closing scenario); `docs/notes/evidence-voice-concierge.md` § Sentences with digits (the new sentences carry no digit) and a "P3 note" beside § VC4 note | `ConciergeProvider.test.tsx` gains cache cases with a fake storage (save on body, load after mount with `data-stale` and "as of", replaced by a live body, cleared after Forget me with "Forgotten", other visitor id loads nothing, no id → no read and no id written) |
| P3-08 | `Transcript.test.tsx` (`who: 'notice'` muted, unattributed); `sessionReducer.test.ts` (a notice doesn't finalise the agent's line); `ConciergePanel.test.tsx` (Guide me switch) | `components/concierge/usher.test.tsx` (`pushText(room, 'concierge.navigate', …)`: allowed → one push + one notice; 3 s later → none; 9 s later → push; unknown slug or external → nothing; on `/talk` → none; Guide me off → none; > 1 KiB → nothing; stored `'off'` → unchecked; throwing storage → on) |
| P3-09 | — | `.harness/concierge-check.mjs` (Playwright, dummy env, `page.route` for the token POST) |
| P3-10 | whatever the review's fixes touch | one failing test per Critical/Important fix |

The Jest mocks approach stays: `livekit-client` → `src/__mocks__/livekit-client.ts`. From P3-08 the provider calls
`useRouter()`, which throws outside a mounted app router (Next 16), so every test that renders the provider
(TalkSession*, talk, SiteChrome, a11y-new-pages, ConciergeProvider, usher, panel) needs `next/navigation` mocked:
`src/__tests__/helpers/concierge.tsx` exports `mockNavigation` (`usePathname`, and `useRouter` returning `{ push:
jest.fn() }`), and each such file calls `jest.mock('next/navigation', …)` with it (a test that already mocks
`usePathname` adds `useRouter`). No test opens a connection.

## What Michael will see

Filled by P3-09 (captures in `docs/screenshots/v3/`, each under 400 KB).

| Capture | Width | What is on it |
|---|---|---|

## Review

Filled by P3-10 (one row per finding).

| # | Severity | File:line | Finding | Resolution |
|---|---|---|---|---|
| P3-05-1 | Important | `Callout.tsx` Close | Close unmounts the bubble with focus in it: focus falls to `<body>` | fixed test-first: focus goes to the pill (`#concierge-pill`) |
| P3-05-2 | Important | `Callout.tsx`, `Footer.tsx` | the bubble covers the Footer links at the page end (and anything scrolled under it), no Esc | fixed test-first: shown only at `scrollY 0` with the Footer out of view; Esc dismisses |
| P3-05-3 | Minor | `ConciergeProvider.tsx` speakers | `agentSpeaking` stuck on through a reconnect | fixed: off on `Reconnecting` and when the agent leaves |
| P3-05-4 | Minor | `VoiceWidget.tsx` name | the name flips with every speaker update | fixed: 500 ms hold before speaking turns off (`AGENT_QUIET_MS`) |
| P3-05-5 | Minor | `VoiceWidget.tsx` bars | infinite animation vs WCAG 2.2.2 | kept: a real-time status that stops with the speech, `motion-safe:` only; recorded in D87 *As built* |
| P3-05-6 | Minor | `Callout.tsx` | the callout can show mid-call after navigating | fixed: Connect dismisses it |
| P3-05-7 | Minor | `VoiceWidget.tsx` collapse | `MediaQueryList.addEventListener` missing before Safari 14 | fixed: `addListener` fallback |
| P3-05-8 | Minor | `VoiceWidget.tsx` 390 | iPhone 15/16 (393 px) and 16 Pro (402 px) never collapse | kept per the spec; asked of Michael (progress entry) |
| P3-05-9 | Minor | `ConciergeProvider.tsx` value | speaker flips re-render every consumer | kept: rare with the 500 ms hold; split the context in P3-10 if profiling shows it |
| P3-05-10 | Minor | `ConciergeProvider.test.tsx` | new Connect while speaking untested | fixed: test added (offline can't follow an agent join) |
| P3-05-11 | Minor | `VoiceWidget.test.tsx` | the unmount test passed for any scroll handler; a matchMedia restore outside `finally` | fixed: asserts the same handler; `try/finally` |
| P3-05-12 | Minor | `VoiceWidget.tsx` dot | the collapsed dot sits off the circle | fixed: `right-1.5 top-1.5` |
| P3-06-1 | Important | `MemoryView.tsx` Forget me | the live Forget me swaps to a disabled button when the call ends: focus could fall to `<body>` | already handled: CallControls' call-ended effect hands lost focus (body or a disabled control) to Connect; drawer tests added for focus on Forget me and in the confirm step |
| P3-06-2 | Minor | `MemoryView.tsx` forget line | the `aria-live` line sits in a tab panel that can be hidden or unmounted | kept: the RPC answers within 10 s while the visitor is on the control; the line stays in the Memory tab |
| P3-06-3 | Minor | `ForgetMeButton.tsx` | Esc in the confirm step closed the whole drawer | fixed test-first: the step handles Esc (`preventDefault`, back to Forget me) |
| P3-06-4 | Minor | `ConciergePanel.tsx`, `TalkSession.tsx` | h3 "About you" sat under h2 "Transcript"; `/talk` lost its memory h2 | fixed test-first: strip + tabs in a `section` with an `sr-only` h2 |
| P3-06-5 | Minor | `MemoryView.tsx`, `MemoryStrip.tsx` | run-together accessible text ("Lisbonvoice", "Profile3") | fixed test-first: separators, "(voice)" |
| P3-06-6 | Minor | `MemoryView.tsx` events, knowledge | time, section names and `gate_rejected` only in `title` or colour | fixed test-first: `sr-only` text, "Not kept:" |
| P3-06-7 | Minor | `MemoryView.tsx`, `MemoryStrip.tsx` | long unbroken name/summary could widen `/talk`; the strip scrolled with nothing focusable | fixed test-first: `break-words`; the chips wrap |
| P3-06-8 | Minor | `PanelTabs.tsx` compact | at 390 × 844 a v2 body pushes the transcript to its minimum | fixed: 25 vh below lg (P3-09 captures a v2 body to confirm) |
| P3-06-9 | Minor | `MemoryView.tsx` episodes | every open episode read "in progress" | fixed test-first: only the newest |
| P3-06-10 | Minor | tests | no StrictMode strip test, no drawer outline with a v2 body | fixed: both added |
| P3-07-1 | Important | `ConciergeProvider.tsx` cache, `privacyNote` | the browser copy never expired, outlived the server's deletion, and the privacy note didn't mention it | fixed test-first (D96): `memoryExpired` drops a copy past `retention_days`; a seventh privacy line; a local clear control before a call asked of Michael |
| P3-07-2 | Minor | `limits.ts` bucket, `closing` | `reason: 'visitor'` is per address, so a neighbour on shared Wi-Fi sees the closing line | kept; asked of Michael in D92 *As built* |
| P3-07-3 | Minor | `fetchCredentials` | a token request in flight was never aborted (Leave → Connect could put two out) | fixed test-first: `AbortController` per session, aborted in teardown |
| P3-07-4 | Minor | retry wait | `connect()` never settled after teardown during the wait | fixed test-first: `session.wake` ends the wait in teardown |
| P3-07-5 | Minor | `MemoryView.tsx` stale | the greyed view erased a rejected event's red | fixed test-first: rejected rows keep `--color-mem-event-rejected` |
| P3-07-6 | Minor | `MemoryStrip.tsx` | stale counts weren't announced as old | fixed test-first: the list's name ends ", as of <time>" (`asOf` prop) |
| P3-07-7 | Minor | provider cache | another tab's Forget me left this tab showing the erased copy | fixed test-first: `storage` event reloads it |
| P3-07-8 | Minor | `CLAUDE.md` | a `TESTCOUNT` placeholder | fixed |
| P3-07-9 | Minor | tests | unmount, Leave → Connect, double click and bfcache during closing unpinned; the rejected-body test thin | fixed: tests added (they passed first: pins, not fixes) |
| P3-08-1 | Minor | `ConciergeProvider.tsx` handler | a body landing while the visitor's own navigation (a link, even to `/talk`) is pending overrides it: the pathname ref updates only on commit | fixed test-first: a same-tab link click (capture phase) or `popstate` holds the usher off for 8 s |
| P3-08-2 | Minor | `ConciergeProvider.tsx` handler | the sender's identity is ignored: any participant could move the visitor | fixed test-first: only `session.agentIdentity` |
| P3-08-3 | Minor | `ConciergeProvider.tsx` clock | `Date.now()` is not monotonic: a clock set back stalls the usher | fixed: `performance.now()` |
| P3-08-4 | Minor | `Footer.tsx`, `layout-concierge.test.tsx` | "projects.ts stays out of the client bundle" was false: Footer (under SiteChrome) imported the `@/lib/data` barrel; the guard only read direct imports | fixed test-first: Footer imports `@/lib/data/profile`; the guard follows SiteChrome's imports transitively |
| P3-08-5 | Minor | `ConciergePanel.test.tsx` | the "no switch on /talk" check rendered no TalkSession | fixed: renders SiteChrome with TalkSession on `/talk` |
| P3-08-6 | Minor | plan § Usher, `GuideMeSwitch.tsx` | the plan named `guideMeRef`/`pathnameRef`; the switch didn't say what it allows | fixed: plan corrected; `aria-describedby` hint `talkWidget.guideMeHint` |

## Decisions

Recorded in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions (D85–D95, all *default*; the next free is D96).
The feature that builds each adds an *As built* note there.

| D | What | Supersedes / keeps | Built in |
|---|---|---|---|
| D85 | `ConciergeProvider` in `SiteChrome` owns the one Room; `/talk`'s `TalkSession` is a consumer; `configured` comes from `layout.tsx` as a prop; `pagehide` disconnects, a bfcache `pageshow` resets to idle | supersedes D46's "the `/talk` page passes `configured` to TalkSession" (the env check itself stands); keeps D45 (Room and id made in the Connect handler, now the provider's) and D44 (chrome, indexable, sitemap) | P3-03 |
| D86 | the non-modal drawer: `role="dialog" aria-modal="false"`, 420 px right drawer at `lg`, bottom sheet under the Navbar below it, `z-[45]`, rendered only while open, never on `/talk` or `/card*`, no focus trap, no scroll lock | new; D44's chrome on `/talk` stands (no panel there) | P3-04 |
| D87 | the widget is the "Ask my site" pill (button, `aria-expanded`, sound-bars glyph, live dot and state names, ≤ 390 px collapse after scroll); the pulsing ring goes; Footer `pb-24` at every width | supersedes D61 (a 56 px mic disc linking to `/talk`, the twice-pulsing ring, `xl:pb-8`); D61's placement (`fixed right-4`, safe-area bottom, `z-40`, `print:hidden`, not on `/talk`/`/card*`, `/evidence` keeps it) stands | P3-04, P3-05 |
| D88 | the first-visit callout: key `concierge.callout_seen`, the exact line, dismissed by Close or opening the panel, after mount only | new | P3-05 |
| D89 | the Navbar has six links: Home, About, Skills, Projects, Experience, Contact; `/talk` stays in the sitemap and smoke routes, reached from the pill's panel, `/card` and the deep-dive | supersedes D60 (Talk on the Navbar) and D79's "seven links" count; the v3 spec § 4.1's "seven links" counted Approach, which P1 removed | P3-05 |
| D90 | the memory view: six kinds, the `--color-mem-*` tokens and hexes above, strip counts (Knowledge = sections, Working = items), v1 fallback "not reported by this agent version", Forget me always in the Memory tab (disabled with "Connect to erase what it remembers" before a call); `MemoryPanel` replaced by `MemoryView` | new; supersedes VC2's separate "What it remembers" panel on `/talk` | P3-06 |
| D91 | the memory cache: `localStorage` key `concierge.memory.<visitor_id>`, `{ v: 1, savedAt, body: <raw JSON text> }`, re-parsed on load; `readVisitorId` reads the id without creating one, so D45's "no id stored before Connect" holds | new | P3-02, P3-07 |
| D92 | 429 busy/visitor enters a `closing` phase ("Closing your earlier conversation…"), one token POST every 5 s, one in flight, for 60 s, then the v1 `busyVisitor` line; Leave cancels | supersedes D66 for `reason: 'visitor'` only; D66 stands for `site` and offline; D71's line stays as the final line | P3-07 |
| D93 | the concierge copy: `talkPage.intro` as § Copy (link kept), the deep-dive `builtWith` without "specs in, verified milestones out", "pack" off the page | supersedes D62's copy; D62's `IntroParagraph` shape and link stand | P3-07 |
| D94 | the usher: `concierge.navigate` followed only with Guide me on (default on, key `concierge.guide_me`), `isAllowedHref` (five pages + known project slugs, exact match), once per 8 s, never on `/talk`, with the notice "Taking you to <name>"; the switch is in the panel only | new | P3-02, P3-08 |
| D95 | contract v2 parsing: every v2 field optional and never a reason to reject; a v1 body parses unchanged (v2 keys left off); bad v2 list entries dropped one by one; navigate bodies capped at 1 KiB; `concierge.get_memory` defined but not called in P3 | new; extends the 2026-10-19 contract § 4 (its 15 KiB cap and v1 `facts` rule stand) | P3-02 |
