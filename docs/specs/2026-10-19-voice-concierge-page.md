# Voice Concierge page: talk to an agent that remembers you

Status: design, 2026-10-19. Builder: the agent-harness, overnight 10-19 → 10-20, in parallel with the agent's own run
(`~/projects/voice-concierge`, spec `docs/spec.md` there). This file is the web half; the contract in §4 is shared
with the agent's spec word for word.

## 1. Why

Michael shows this on Tue 10-20, including to LiveKit's Agents team. A visitor opens the page, talks or types to Michael's
concierge, and **sees what it remembers**: each fact, where and when it was learned, a per-turn latency readout, and a
"Forget me" button.

The page is the proof that he understands memory for voice agents. It also links to a project deep-dive that
explains the design.

**Anti-goals:**

- a page that errors or hangs when the agent is offline;
- secrets in the client bundle;
- fake or unmeasured numbers anywhere on the site;
- a design that breaks the site's existing look.

## 2. Scope

| # | What |
|---|---|
| W1 | **Token route.** `src/app/api/concierge/token/route.ts`, server-only. Reads `LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` from the environment (set in Vercel by Michael). With any of them missing it returns `503 {"offline": true}`. Takes `{visitor_id}` and validates it as a UUID v4. Returns `{url, token}`: a 10-minute token for identity `visitor-<visitor_id>` in a fresh room `concierge-<random>`, whose room configuration dispatches agent `concierge` with metadata `{"visitor_id", "channel_hint": "web"}`. Uses `livekit-server-sdk`. Tests mock the SDK |
| W2 | **`/talk` page.** Connect and leave, mic permission, voice and a text box, a live transcript, a **memory panel** (from `concierge.memory`), a **latency panel** (from `concierge.metrics`: the last turn plus a running median, including `memory_on_turn_path_ms` and the cached share of prompt tokens), and a **Forget me** button (RPC `concierge.forget_me`, with a confirm step). The visitor id is a UUID in `localStorage` (try/catch; without storage, each visit is new). Built with `livekit-client` and `@livekit/components-react` at pinned versions. Text-stream handlers are registered before `connect()` and unregistered on cleanup. If no agent joins in 10 s, or the route returns 503, the page shows "The concierge is offline right now" plus a link to the deep-dive. A short **privacy note** on the page: what's stored (facts it learned, visit summary, transcript events), where (Michael's server), for how long (30 days after the last visit), that the id is just this browser and not a login, and that Forget me erases everything about you on Michael's server (anonymous timing numbers, with no text and no id, are kept). Also say that LiveKit's observability keeps the conversation's transcript and timing traces, but no audio, for 30 days, and Forget me can't erase those |
| W3 | **Project deep-dive.** A `projects.ts` entry with slug `voice-concierge`: the problem, how the memory works (preload at connect, background extraction with delta merge, heard-text-only, write gate, invalidate vs delete, one thread per visitor), the Agents 2.0 mapping, and a link to `/talk`. **No metrics** until Michael measures them: leave `metrics` empty, and add a `docs/notes/voice-concierge-todo.md` line telling him where to add them. Add an authored diagram component (a new `DiagramKey` `voice-concierge`): browser → token route → LiveKit Cloud room ↔ agent worker (home box) ↔ SQLite thread store |
| W4 | **Entry points.** A "Talk to my concierge" link on `/card` (the conference card, so the QR leads there) and on the deep-dive. `/talk` goes in `.harness/smoke-routes.txt`, `sitemap.ts`, and the Navbar only if the spec's Navbar rules allow it (otherwise leave it off) |

**Out of scope:** changes to other pages beyond W4, analytics, auth.

## 3. Rules

- **New runtime dependencies, approved by Michael (10-19):** `livekit-client`, `@livekit/components-react` (with
  its `@livekit/components-styles` if needed) and `livekit-server-sdk`, at pinned versions. Record this in the v2 spec
  as the next `D<n>`, per ground rule 9.
- **The deep-dive links to the code** at `https://github.com/mh550/voice-concierge` only if that repo is public when the
  milestone runs (`gh repo view mh550/voice-concierge --json visibility`). Otherwise there's no code link: the content
  guard forbids private repo links.
- Follow `CLAUDE.md` and the v2 spec's design system (`docs/specs/2026-10-18-portfolio-v2.md`, `docs/notes/brand.md`).
- **The suite and smoke run with no LiveKit environment.** `/talk` renders its offline state with no page errors and
  no horizontal scroll at 390.
- **Mock `livekit-client` in Jest.** Never open a real connection in tests.
- **Every LiveKit API is checked against the installed package's types.** Never guess a signature.

## 4. The contract with the agent (word for word from the agent's spec §6)

- **Agent name** for explicit dispatch: `concierge`.
- **Dispatch metadata** (JSON) set by the token route: `{"visitor_id": "<uuid v4>", "channel_hint": "web"}`.
- **Participant identity** of the visitor: `visitor-<visitor_id>`.
- **Room**: one per visit, `concierge-<random>`, created by the token route's room config (`RoomConfiguration` with
  `agents: [RoomAgentDispatch{agentName, metadata}]`, empty timeout 30 s). The 10-min cap is enforced by the agent
  (B7).
- **Agent → page**, as text streams: the agent sends with `room.local_participant.send_text(body, topic=…)`, and the
  page receives with `room.registerTextStreamHandler(topic, …)`. The page registers **before** `connect()` and
  unregisters on cleanup (React StrictMode mounts twice). Bodies are JSON, at most 15 KiB:
  - topic `concierge.memory` carries `{ "visitor": {"name": str|null, "visits": int}, "facts": [ {"id","slot","value","channel","source","learned_at","confidence"} ], "summary": str|null, "updated_at": iso }`. It is sent at session start and after every merge.
  - topic `concierge.metrics` carries `{ "turn": int, "eou_ms", "stt_ms" (= transcription_delay), "llm_ttft_ms", "tts_ttfb_ms", "total_ms", "memory_on_turn_path_ms" (measured: on_user_turn_completed_delay), "preload_ms" (first message only), "extraction_ms" (when one ran, background), "prompt_tokens", "cached_tokens", "compacted": bool }`. Any field may be null if 1.8 doesn't report it.
- **Page → agent RPC methods**, registered by the agent on its local participant:
  - `concierge.forget_me`: erases the thread (§4.2) and **returns `{"ok": true}` immediately**; RPC times out at
    10 s. It then schedules one last `concierge.memory` with empty facts, a short goodbye, and the end of the
    session.
  - `concierge.get_memory`: returns the same JSON as the `concierge.memory` topic.
- **Text chat** uses the standard `lk.chat` topic and `lk.transcription`, as LiveKit's components expect.
- **Offline.** If no agent joins within 10 s, the page shows "The concierge is offline right now". With the kill
  switch on, the worker declines the job, so no agent joins and the same state shows.

## 5. Verification

- **Jest:**
  - **Token route:** 503 without env; 400 on a bad visitor id; a token whose decoded claims carry the identity, the
    room and the agent dispatch with the metadata (decode the JWT in the test).
  - **Panels:** rendering from fixture JSON matching §4.
  - **Forget me:** calls the RPC after confirming.
  - **Offline state.**
  - **localStorage:** the id persists, and the page survives when storage throws.
- **Smoke:** `/talk` and the deep-dive at 1280 and 390.
- **Morning (Michael):** a real call against the running worker on a Vercel preview, with the env set there.

## 6. Milestones

| M | Features | After |
|---|---|---|
| VC1 | W1 token route, plus dependencies | — |
| VC2 | W2 `/talk` page | VC1 |
| VC3 | W3 deep-dive + diagram, W4 entry points | VC1 (independent of VC2's internals) |

## 7. Decisions

Numbered from D59: the v2 spec (`docs/specs/2026-10-18-portfolio-v2.md`, D1–D49) and the booth spec
(`docs/specs/2026-10-20-booth-harness-bundle.md`, D41–D58) already use every lower number, and collide with each
other. Never renumber. Each entry names the decision it supersedes. VC4's plan:
`docs/plans/2026-10-20-VC4-order-widget-nav.md`.

- **D59** Project order (Michael, VC4 spec § VC4.1): 1 agent-harness, 2 voice-concierge, 3 ghl-jobtread-integration,
  4 ringcentral-jobtread-integration, 5 home-media-server, then the rest in their old relative order: 6
  linear-ai-workflow, 7 hit-list, 8 paint-estimator, 9 mirrored-google-calendars, 10 cherished. So
  `getTopProjects(3)`, which feeds `/card`'s Selected work and the home page's Recent work, becomes agent-harness,
  voice-concierge, ghl-jobtread-integration. Supersedes the v2 spec's D47 (voice-concierge at 5, top three
  unchanged). (VC4-01 plan; VC4-02 builds.)
- **D60** `/talk` is on the Navbar as "Talk", the fifth of eight links, between Projects and Approach (Michael, VC4
  spec § VC4.2). Supersedes the v2 spec's D44 ("stays off the Navbar") and D49 ("The Navbar stays at seven links");
  D44's other parts (chrome, indexable, in the sitemap) stand. (VC4-01 plan; VC4-02 builds.)
- **D61** *default* The voice widget (VC4 spec § VC4.3; details are defaults): `src/components/VoiceWidget.tsx`, a
  `next/link` to `/talk` named "Talk to my voice concierge" (`talkWidget` in `concierge.ts`), a 56 px accent disc
  with an inline `aria-hidden` SVG microphone, `fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40`
  (below the Navbar's `z-50`), the shared `focusRing` with `focus-visible:outline-offset-4` (clear of the ring), `print:hidden`, and a decorative ring that pulses twice (4 s)
  only under `motion-safe:`. `SiteChrome` renders it after the Footer on every chrome page except `/talk` (and
  `/card*`, which has no chrome); `/evidence` keeps it. The Footer's bottom padding becomes `pb-24 xl:pb-8` so its
  links stay clear of the widget at every width. Supersedes nothing (new element). Reversible: drop the element from `SiteChrome` and the padding from
  `Footer`. Question for Michael: should `/evidence` lose it too? (VC4-01 plan; VC4-03 builds.)
- **D62** The `/talk` intro and the deep-dive credit use the harness framing (Michael, VC4 spec § VC4.4). The intro's
  first paragraph is "A voice agent I designed on LiveKit and built with my agent harness: specs in, verified
  milestones out. It remembers you between visits.", with "my agent harness" linking `/projects/agent-harness`
  (*default* data shape: `IntroParagraph = string | { before, link: { label, href }, after }`). The deep-dive's
  `builtWith` stays a plain string (*default*): "The spec and the design are mine: the agent, its memory and the
  contract between it and this page. My agent harness ran the build sessions, specs in and verified milestones out:
  Claude Code agents wrote this page's code overnight in one run, and a second run is writing the agent."; its Links
  section gains "The agent harness that built it" (`/projects/agent-harness`, kind `doc`). Supersedes the VC2 intro
  copy (`docs/plans/2026-10-20-VC2-talk-page.md` § Copy) and VC3's `builtWith`. (VC4-01 plan; built in VC4-04, recorded in `docs/notes/evidence-voice-concierge.md` § VC4 note.)

VC5's plan: `docs/plans/2026-10-20-VC5-mic-limits-server-only.md`.

- **D63** *default* The Origin check runs before the env check: a shell POST gets 403 even on an offline site, so
  nothing about whether LiveKit is configured leaks to a caller from outside. Supersedes VC1's "env checked
  first" (`docs/plans/2026-10-20-VC1-token-route.md` § Route behaviour, row 1). (VC5-01 plan; VC5-04 builds.)
- **D64** *default* Without `x-forwarded-for` the address is `'unknown'`, one shared bucket (in practice only the
  Jest tests: Vercel sets the header, and `next dev`/`next start` fill it from the socket). The preview allowlist is the hostname regex
  `^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$` over `https:` with no port, derived from
  PR #16's preview host. Supersedes nothing (new). Question: does it match your current previews? (VC5-01 plan; VC5-03 and VC5-04 build.)
  VC5-03 review: anyone can create a Vercel project named e.g. `portfolio-site-evil-mh550s-projects`, whose
  `<name>.vercel.app` host matches, and a page there could spend through its visitors' browsers. Built as specified
  (VC5-03 step 1 requires the regex). Question: replace it with exactly `https://$VERCEL_URL` and
  `https://$VERCEL_BRANCH_URL` (each deployment trusts only its own hosts), or accept the risk?
- **D65** *default* The mic toggle renders only in the `live` phase (was `waiting` or `live`), so nothing can ask
  for the microphone before the agent joins; `setMicrophoneEnabled(true)` moves into `agentArrived`. Supersedes
  the VC2 plan's state-table row "connecting → waiting: `setMicrophoneEnabled(true)`" and its "As built (VC2-05)"
  note (toggle in `waiting` and `live`). (VC5-01 plan; VC5-02 builds.)
- **D66** *default* A 429 puts `/talk` in a `busy` phase (reason kept, Connect shown, the deep-dive link shown as
  offline shows it) with no automatic retry; any other non-OK reply stays offline. Supersedes nothing (new phase). (VC5-01 plan; VC5-05 builds.)
- **D67** `server-only` at `0.0.1`, exact pin, as a dependency (Michael approved it, spec § VC5.3); `env.ts` and
  `rooms.ts` import it; next/jest already maps it to an empty mock. Extends D41's list of approved packages. (VC5-01 plan; VC5-03 builds.)
- **D68** *default* `listLiveRooms` uses one 5 s attempt (`requestTimeout: 5`, `failover: false`), and every room
  it lists counts as live, whatever its participants (fail closed on cost). Effect: after Leave, the address reads
  busy until LiveKit closes the room. Alternative if that window is long: count only rooms with a `visitor-`
  participant (`listParticipants` per room). Supersedes nothing (new). Question: which do you want after stage 2 of the live check? (VC5-01 plan; VC5-03 and VC5-04 build.)
- **D69** *default* The token route's 200 cases move from `concierge-token-route.test.ts` to
  `concierge-token-route-limits.test.ts`, which mocks only `@/lib/concierge/rooms` (factory) and signs with the real
  SDK. `concierge-token-route.test.ts` stays mock-free. Refines D42 (the real SDK still signs every tested token).
  Overrides VC5-01 step 4's "only gains an allowed Origin header plus the 403 cases" (VC5-04 step 2 leaves it to
  the plan). (VC5-01 plan; VC5-04 builds.)
- **D70** *default* The visitor's own room name, and so their `addr10`, is inside their JWT (`video.room`); the
  address never is, and no body carries a bucket in plain text. The token TTL stays 600 s (VC1). Supersedes VC1's
  room name `concierge-<12 hex>` (`docs/plans/2026-10-20-VC1-token-route.md`). Question: cut it
  to about 60 s to narrow the mint-then-join window (§ Route behaviour, known limits)? (VC5-01 plan; VC5-04 builds.)
- **D71** *default* The `busyVisitor` line keeps the spec's wording, "You already have a conversation open in another
  tab.", although `reason: 'visitor'` means only "this network address has a live room": under D68 that is also the
  visitor's own room for up to about 30 s after Leave, or another person behind the same NAT (two phones on the
  conference Wi-Fi). Alternative: "A conversation from your network is still open. Try again in a minute." Question:
  keep the spec's line or switch? Supersedes nothing (the spec's own wording). (VC5-05 builds; a copy change in `talkPage.status.busyVisitor` only.)
- **D72** *default*, superseded by D73. One room per address: `roomNameFor(bucket)` is `concierge-<addr10>`, with no random part, and a
  room is this address's when its name is exactly that. Every token minted from one address before anyone joins
  names the same room, and the token's `roomConfig` (the agent dispatch) applies only to the join that creates it,
  so a script that mints a burst of tokens with a forged Origin starts one room and one agent, not one per token
  (VC5-07 review, Important). Supersedes the VC5 spec's `concierge-<addr10>-<random>` (§ VC5.2) and D70's room
  shape (the bucket is still in the caller's own JWT). Side effect: two people behind one NAT pressing Connect in
  the same second share a room. Reversible in `limits.ts` alone (review guide § VC5, Undo). Question: keep it?
  (VC5-07 builds.)
- **D73** *default* The room is the VC5 spec's `concierge-<addr10>-<randomBytes(6) hex>` again, and a room is this
  address's when its name starts with `concierge-<addr10>-`. Supersedes D72. Why: under D72 two people behind one
  NAT (the conference Wi-Fi) who press Connect before the first join creates the room share a room and hear each
  other; a burst of tokens minted with a forged Origin is a cost limit that the agent's caps and the provider caps
  bound, as a burst from many addresses already was. Question: keep the spec's form, or go back to D72 and accept
  the shared-room race? (VC5-01 re-run plans it, § D73 rework; VC5-03 and VC5-04 re-runs build.)
