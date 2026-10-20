# VC4: project order, voice widget, mic timing, per-visitor limits

Date 2026-10-20. Michael's answers (chat, 2026-10-20 ~13:30 ET) to the VC1–VC3 questions. Builds on
`harness-merge/portfolio_site-2026-10-20-VC3` (VC1–VC3 plus the booth bundle B1–B2). These answers supersede
D44/D49 (Navbar), the D44 project order, and the intro wording in `src/lib/data/concierge.ts`. Record each change
below as `D<n>` in `docs/specs/2026-10-19-voice-concierge-page.md`, naming the decision it supersedes.

One milestone per section, in this order; each is a PR (Michael merges).

## VC4: content and navigation

1. **Project order** (`order` in `src/lib/data/projects.ts`): 1 `agent-harness`, 2 `voice-concierge`,
   3 `ghl-jobtread-integration`, 4 `ringcentral-jobtread-integration` (the Builder Clarity integrations, together),
   5 `home-media-server`. Every other project keeps its current relative order after those, from 6. `order` stays
   unique. `/card`'s Selected work and the home page's Recent work follow `order` as they do today; update the
   tests and snapshots that pin the old order, and say in the plan what a visitor now sees on `/card` and `/`.
2. **Navbar**: add `/talk` between Projects and Approach. Label "Talk" (short enough for the 390 px menu; the
   page's own h1 says what it is). The Navbar becomes eight links; update `Navbar.test.tsx` and the v2 spec's
   seven-link wording.
3. **Voice widget**: a small floating button, bottom right, on every page that has the site chrome, except `/talk`
   itself and the `/card` pages. For now it is a link to `/talk` (an `<a>`, not a button that opens anything),
   with a microphone icon and an accessible name like "Talk to my voice concierge". It must not cover content at
   390 px (respect the safe-area inset, keep it clear of the footer's links), must have the site's focus ring,
   and must respect reduced motion (no pulsing when `prefers-reduced-motion: reduce`). No new dependency for the
   icon (inline SVG). Screenshots at 390 and 1280 in `docs/screenshots/v2/`.
4. **Intro wording** (`src/lib/data/concierge.ts` and anywhere the deep-dive repeats it): replace "with Claude
   Code agents writing much of the code" with harness-engineering framing: Michael designed it and built it with
   his own agent harness (link `/projects/agent-harness`). Proposed: "A voice agent I designed on LiveKit and
   built with my agent harness: specs in, verified milestones out. It remembers you between visits." Keep it
   honest (brand.md § Voice): the harness ran the build sessions; don't claim hand-written code. The deep-dive
   should say the same in one sentence, linking to the harness case study.

## VC5: mic timing, cost protection, server-only

1. **Mic waits for the agent.** In `TalkSession.tsx`, don't call `setMicrophoneEnabled(true)` on room connect;
   call it in `agentArrived`. If the agent never arrives (the 10 s offline path), the visitor is never asked for
   the microphone. Tests: no mic call before the agent joins; one call after.
2. **Token route protection** (`src/app/api/concierge/token/route.ts`). Every conversation costs Michael money;
   today anyone can mint tokens from anywhere. Add, in this order, before any token is signed:
   - **Origin allowlist**: accept only requests whose `Origin` is the production site (from `profile.siteUrl`),
     this project's Vercel preview hosts (`*-mh550s-projects-*.vercel.app` pattern, read the real one from a PR
     comment) and `http://localhost:<port>` in development. Otherwise 403 `{error:'forbidden'}`.
   - **Per-visitor limit, by network address**: hash the caller's address (first `x-forwarded-for` entry, which
     Vercel sets) with `LIVEKIT_API_SECRET` as the HMAC key and take 10 hex characters; put it in the room name
     (`concierge-<addr10>-<random>`). Before signing, list the live rooms with `RoomServiceClient.listRooms()`
     (already in `livekit-server-sdk`) and refuse with 429 `{error:'busy', reason:'visitor'}` if this address
     already has a live room, and 429 `{reason:'site'}` if the site has `CONCIERGE_MAX_ROOMS` (default 2) or
     more live `concierge-` rooms. No database: LiveKit's room list is the state. If `listRooms` fails, refuse
     (fail closed) with 503 `{offline:true}`.
   - The agent already caps each visitor id at 5 sessions a day and each session at 10 minutes
     (`voice-concierge` repo, `concierge/limits.py`); Michael's provider accounts are capped at about $45 a week.
     Say so in the deep-dive's "how it's protected" line, and in `docs/notes/voice-concierge-todo.md`.
   - `/talk` shows a friendly line for each 429 ("You already have a conversation open in another tab." /
     "The concierge is busy right now. Try again in a few minutes.") and does not retry by itself.
   - Tests in the node jest environment with the real SDK for signing and a fake `RoomServiceClient`; the address
     hash never appears in a response body or log line. The room-name change doesn't affect the agent (it doesn't
     parse room names; checked in `voice-concierge/concierge/*.py`).
3. **`server-only`**: add the `server-only` package (exact pin) and `import 'server-only'` at the top of
   `src/lib/concierge/env.ts` and of any new server module that reads the LiveKit secret. Approved by Michael.
   Add a test that an unconfigured Connect never imports `livekit-client`.

## Rules

- Build-only: never set LiveKit env vars, never create `.env*`, never read `~/.config/voice-concierge/env`.
- Michael's live check (review guide): on the PR preview, two tabs → the second gets the "another tab" line;
  `curl -X POST` from a shell (no Origin) → 403.
- Proceed on sensible defaults and record them; don't stop for questions. Michael is at a conference today.

## Built (2026-10-20, run `portfolio_site-2026-10-20-vc4`)

VC4 (VC4-01 – VC4-06) and VC5 (VC5-01 – VC5-07) are built on branch `harness/portfolio_site-2026-10-20-vc4`, plans
`docs/plans/2026-10-20-VC4-order-widget-nav.md` and `docs/plans/2026-10-20-VC5-mic-limits-server-only.md`, hand-off
in `docs/review-guide.md` § VC4 and § VC5. Decisions are in `docs/specs/2026-10-19-voice-concierge-page.md` § 7,
each naming what it supersedes:

- Michael's answers: D59 (project order), D60 (Talk on the Navbar), D62 (harness framing), D67 (`server-only`
  exact pin).
- Defaults taken: D61 (widget details), D63 (Origin before env), D64 (no `x-forwarded-for` → one `'unknown'`
  bucket; the preview-host regex), D65 (mic toggle only when live), D66 (the `busy` phase, no retry), D68 (one 5 s
  room-list attempt; every listed room counts), D69 (the 200 tests' new file), D70 (TTL stays 600 s), D71 (the
  another-tab wording), D72 (one room per address, `concierge-<addr10>`, no random part: the VC5-07 review's fix
  for tokens minted in a burst), superseded by D73 (the spec's `concierge-<addr10>-<12 hex>` again, a room per
  Connect, so two people behind one NAT never share a room; built in VC5-03, 2026-10-20).

Michael must confirm two things the run could not check:

1. **The agent does not parse room names.** Rooms are now `concierge-<addr10>-<12 hex>` (were
   `concierge-<12 hex>`; D73, the spec's form). The agent's code was not on this machine (`~/projects/voice-concierge` has docs only), so
   in `mh550/voice-concierge`: `grep -rn 'room.name\|room_name' concierge/` shows nothing that splits the name on
   `-` or expects the old form.
2. **The preview-host regex matches your current previews.** `^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$`
   (D64, from PR #16's host). Stage 1 of the live check (review guide § VC5): the third curl, with the preview's
   own Origin, must print 503, not 403.
