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

Moved to `docs/decisions.md` (D59–D74, IDs kept), the current rule set, rewritten in place.
