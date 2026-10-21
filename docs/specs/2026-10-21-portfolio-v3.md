# Portfolio v3: the agentic-systems angle, a graph tech stack, the concierge in the site

Date 2026-10-21. From Michael's test notes of 2026-10-20/21 on the live site (`mherron.dev`) and the voice
concierge. Builds on `origin/main` at `b7c974f` (VC1–VC5, B1–B2 and PR #21 merged). The agent half runs in parallel
in `mh550/voice-concierge` (spec `docs/specs/2026-10-21-integrated-concierge.md` there); §7 of this file is the
contract both build to, word for word.

Ground rules of `docs/specs/2026-10-18-portfolio-v2.md` still hold (content in `src/lib/data`, no new runtime
dependency without a `D<n>`, brand.md's voice and never-publish list, the content guard). Record every new default
below as the next `D<n> *default*` in the v2 spec, naming what it supersedes. **Nothing in this run needs Michael:
take the default written here, record it, and never park.** Michael merges the PRs (`MERGE_POLICY=pr`).

One milestone per section, in this order; each is a coherent PR.

## 1. Why

The site still says "Systems & Process Engineer" and shows n8n/Zapier/Pipedream logos. Michael's resume (v4,
2026-10-20) and his job search now lead with **agentic systems: harness and context engineering, durable agent
memory, verification agents can't bypass**, with integrations as the proof underneath. The site has to show that
angle, the same way v2 showed the process angle: real systems, decisions, numbers. Three other things came out of
testing: the tech-stack page is a wall of text, the concierge lives on a separate page a visitor has no reason to
open, and the design reads as generic.

**Anti-goals:** claiming hand-written code the agents wrote (brand.md § Voice); a number without a source in
`docs/notes/`; a page that breaks at 390 px; a redesign shipped tonight (this run mocks design directions, it
doesn't restyle the site); breaking `/card` (people from the conference still scan it).

## 2. The angle (P1)

Michael picks the final words; these are the defaults this run ships, so the diff is reviewable against the live
site. **Positioning is a line, not a job title** (brand.md): real titles in Experience never change.

| Field (`profile.ts`) | Now | Default for this run |
|---|---|---|
| `positioning` | Systems & Process Engineer | **Agentic Systems Engineer** |
| `tagline` | I build simple, elegant systems that fit the humans who run them. | keep, unchanged |
| `subline` | I find where work breaks down, design the system that fixes it, then build it, run it, and measure it. | **I build the harnesses, memory and verification around AI agents, and the integrations they run on.** |

Why this and not "Harness & Memory Engineer": LiveKit, n8n and Syntony readers recognise "agentic systems"; the
two specialties (harness engineering, memory and context engineering) are named in the subline and shown by the
two featured projects, so nothing is lost, and a general SWE reader isn't puzzled by a title that doesn't exist yet.
"Systems & process" stays as *how* he works, not the headline.

**The method strip** (`approach.ts` `methodSteps`, `MethodStrip`, every case study's section order). The five
verbs stay the spine of the case studies (they are the headings of six written case studies; don't rewrite those),
but the hero strip becomes the loop his harness literally runs, which is also how he works:

| id | label | line (hero and `/about`) |
|---|---|---|
| `spec` | Spec | I write down what done means before anything is built. |
| `context` | Context | Every session starts fresh, from state kept on disk, not from memory. |
| `build` | Build | Test first, one feature at a time, the smallest system that fixes the real problem. |
| `verify` | Verify | An independent check, with evidence per step, before anything merges. |
| `learn` | Learn | Every run is measured and written down, and the next plan reads it. |

Keep `MethodStepId` for the case-study anchors (`diagnose` … `simplify`) and add a separate `loopSteps` for the
strip, so `getCaseStudyAnchors`, `/evidence` and the six case studies keep working. `aboutIntro` reads the loop.

**Floating logos** (`FloatingLogos.tsx`): replace the nine with the stack he wants seen, inline SVG, no new runtime
dependency: Claude Code, LiveKit, Python, TypeScript, Bash, SQLite, PostgreSQL, Docker, Linux (Tux), Next.js, n8n,
GitHub. Drop Zapier, Supabase, Linear. `simple-icons` is pre-approved as a **devDependency** at an exact pin (D, like
`qrcode`): a `scripts/logos.mjs` copies the paths it needs into `src/components/logos/paths.ts` once, with each
icon's title, and the site imports from there. Mind each brand's guidelines in the generated file's header.

**Site-wide strings** that carry the positioning: `<title>`s and metadata descriptions, `/card`, the vCard `TITLE`,
Open Graph, `docs/notes/brand.md` § Positioning (add a dated "v3" subsection; keep the 10-18 one as history).

**About page** (`src/app/about/page.tsx`). Michael writes the final story. This run: (a) the intro reads the new
positioning and loop; (b) the Philosophy quote stays as is (his words); (c) write
`docs/notes/about-narrative-bullets.md`: 10–15 bullets Michael can write his story from, each one a fact with its
source (the resume v4 text in §8, `docs/notes/evidence-*.md`, brand.md's metrics bank), ordered as a narrative
(Duke → Builder Clarity → MAXX → the harness and the concierge → what he wants next), with two or three bullets on
the failure stories brand.md says to keep. No prose paragraphs; bullets only.

**Approach page: cut it (P1, same milestone).** Michael prefers show over tell. `/approach` becomes a permanent
redirect to `/about#how-i-work` (`next.config.ts` `redirects`), where a short "How I work" section shows the loop
strip with `showLines` and **one** example link per step into a case study (reuse `principles[].examples`: pick the
first example that has a page). Remove Approach from the Navbar, the sitemap and `smoke-routes.txt`; keep
`approach.ts`'s `principles` (How I work picks its links from them; *P1-08: neither `/evidence` nor the case studies
read them, see D81*). Delete
`src/app/approach/page.tsx` and its test; add a redirect test.

**P1 features** (sizing guide): plan · profile + loop strip + logos (+ the generator) · about intro + bullets note ·
approach fold + redirects + Navbar · site-wide strings and snapshots · check (screenshots `/`, `/about`, `/card` at
390 and 1280) · review + simplify.

## 3. Experience from the resume, with links (P2)

`experience.ts` follows the resume v4 text in §8 **exactly** for the two roles and the two resume projects; the
company/title/period lines don't change. Add an optional `links` on a bullet (`{ text, href }` spans inside the
bullet, rendered by a small `BulletWithLinks` component): link to the site's deep-dive when one exists, GitHub only
when there is none (the deep-dive already links its repo):

| Bullet text | Link |
|---|---|
| "agentic bug-fix workflow" (MAXX) | `/projects/linear-ai-workflow` |
| "contractor estimating app" (MAXX) | `/projects/paint-estimator` |
| "JobTread ↔ GoHighLevel integration platform" (BC) | `/projects/ghl-jobtread-integration` |
| "unified per-job communications log" (BC) | `/projects/ringcentral-jobtread-integration` |
| Long-Running Agent Harness | `/projects/agent-harness` (title) and `github.com/mh550/agent-harness` (the repo line) |
| Self-Hosted Music Server & DJ Pipeline | `/projects/home-media-server` and `github.com/mh550/dj-crate-streaming` |

Add a "Projects" group on `/experience` between work and education with those two resume projects (period, two
bullets each, links), since the resume has it. Tahoma Films and the snowboard coaching are not on the resume: keep
them as a compact "Earlier" list (one line each, no bullets) rather than deleting them (D default; show character).
Education: the resume's coursework list replaces the current one; honors stay. `/card`'s Selected work is
unchanged. Update `experience.test.tsx`, the vCard test if it reads the positioning, and snapshots.

P2 features: data + links component · page layout (Projects group, Earlier list) · check (390/1280) · review.

## 4. The concierge in the site (P3)

Today the widget is a mic icon linking to `/talk`. Michael: a visitor doesn't know what a mic means on a portfolio
and won't click it; the Talk nav link goes; the experience should happen in the site, and the agent should later
be able to usher the visitor to the content it talks about.

1. **One owner for the call, above the pages.** Move the `Room` owner out of `/talk` into a `ConciergeProvider`
   mounted in `SiteChrome` (client), so the call survives client-side navigation and `TalkSession`'s unmount no
   longer ends it. `/talk` stays as the full-page view of the same state (sitemap, `/card` link and the deep-dive
   link keep working); the Navbar loses **Talk** (seven links; update `Navbar.test.tsx`). Hard navigation and tab
   close still disconnect (`pagehide` → `room.disconnect()`); the agent now closes the session 20 s after the
   visitor leaves (§7), so a return isn't "busy" for ten minutes.
2. **The widget.** Not a mic. A pill, bottom right: a sound-bars glyph (three bars that move only while the agent
   is speaking; still otherwise) and the label **"Ask my site"**; it collapses to the glyph alone at ≤ 390 px once
   the visitor has scrolled, and while a call is live it shows a small live dot and the agent's state (listening /
   speaking) as its accessible name. One-time **indicator**: on the first visit per browser (localStorage,
   try/catch), a callout bubble next to the widget, "This site talks. Ask it about my work, by voice or text.",
   with a close button; dismissed by closing or by opening the panel; never on `/card*`; respects reduced motion.
3. **The panel.** Clicking the widget opens a drawer: right side, 420 px wide at ≥ 1024 px; a full-height bottom
   sheet at 390 px. Layout, top to bottom: header (title, Connect/Leave, mic toggle, minimize ×), the **transcript**
   (the tallest region), the message box, then a **memory strip** always visible: chips coloured by memory type
   (§5) with counts, and three tabs under it: **Memory** · **Latency** · **Privacy** (the privacy note moves here
   from `/talk`; `/talk` keeps it too). Minimize collapses the drawer back to the widget without ending the call.
   The drawer is a `role="dialog"` (not modal: the page behind stays usable so the agent can usher), focus goes to
   the header on open and back to the widget on close, Esc minimizes.
4. **Forget me, visible before it matters.** The Memory tab always shows the Forget me control: enabled during a
   call, disabled with the hint "Connect to erase what it remembers" otherwise. Fix the mismatch Michael hit: the
   intro and privacy copy mention the button only in those words.
5. **Memory that persists on screen.** Cache the last `concierge.memory` body in localStorage per visitor id
   (try/catch); before a call, the Memory tab shows it greyed with "as of <time>" so a returning visitor sees that
   the site kept state; Forget me clears the cache; "Forgotten" replaces it.
6. **Busy, closing, offline.** On 429 `busy`/`visitor`: "Closing your earlier conversation…" and a retry every 5 s
   for up to 60 s (one request at a time), then the v1 busy line (§7). Offline and `site` busy are unchanged.
7. **Copy.** Cut "specs in, verified milestones out." from `concierge.ts` and the deep-dive; the intro becomes
   "A voice agent I designed on LiveKit and built with my agent harness. It remembers you between visits, shows
   you what it remembers and where each thing came from, and can take you to the work it's talking about."
   Nothing on the page says "pack".
8. **Guide me (usher), the groundwork.** Handle `concierge.navigate` (§7): a **Guide me** toggle in the panel
   header (on by default while live, remembered in localStorage), `router.push(href)` for allowlisted hrefs only,
   a one-line notice in the transcript ("Taking you to Agent Harness"), rate-limited to one per 8 s, never on
   `/talk`. Tests with the LiveKit mock's `pushText`.

Keep the Jest mocks approach (`src/__mocks__/livekit-client.ts`); no test opens a connection. P3 features: plan ·
provider + `/talk` on it · widget + indicator · drawer + tabs + memory strip (uses §5's model from the v2 body with
v1 fallback) · forget-me/cache/busy · usher · check (390/1280 captures of the closed, open, live and minimized
states against the dev server with a dummy env, as VC5-06 did) · review + simplify.

## 5. The memory view (P3, the Memory tab and strip)

Show the kinds of memory, live, coloured, split between **About you** and **About the agent** (the v2 body's
`about_visitor` and `about_agent`; from a v1 body, show profile and summary only and label the rest "not reported
by this agent version"):

| Section | Kind | Colour token (new, in `globals.css`) | Shows |
|---|---|---|---|
| About you | **Profile** (semantic: typed slots) | `--mem-profile` (cyan, the accent) | one chip per fact: slot, value, channel glyph, learned-at on hover |
| About you | **Episodes** (episodic: visits) | `--mem-episode` (amber) | one row per visit: "visit n · date · summary"; the current visit "in progress" |
| About you | **Events** (this call's journal) | `--mem-event` (green; `gate_rejected` red) | newest first, 12 at most, each one sentence |
| About the agent | **Knowledge** (what it knows about Michael) | `--mem-knowledge` (violet) | words, estimated tokens, sections, the source commit |
| About the agent | **Working** (the in-call context) | `--mem-working` (magenta) | items, estimated tokens, compacted yes/no, compactions |
| About the agent | **Cache** | muted | cached share of prompt tokens |

Chips in the strip: Profile · Episodes · Events · Knowledge · Working, each with its count and colour; a chip that
just changed pulses once (`motion-safe:`). Colours must pass AA on the dark surface; add them to the design tokens
section of `globals.css` and to `CLAUDE.md` § Design System. The Latency tab is the current `LatencyPanel`.

## 6. Contact (P4, small)

Michael: no scrolling on a page like this; icon-centric; clean and trim. One screen at 1280 and at 390: the h1,
one line, and three equal tiles in a row (stacked at 390, still within one 844 px-high screen with the nav), each
with an inline SVG glyph (mail, LinkedIn, GitHub), the label and the value, the whole tile a link. **Cut the
subheader** ("Whether you have a project in mind…"; Michael is leaning that way, and the h1 "Let's Talk" plus the
tiles say it). Keep the location line as the one line under the h1: "Durham, NC · open to remote, hybrid or
relocation." Delete the closing note block. Use `simple-icons` paths for LinkedIn and GitHub (P1's generator);
mail is a plain glyph. Check at 390 × 844 and 1280 × 800: no vertical scroll (assert `scrollHeight <= innerHeight`
in the smoke capture). Features: build · check · review (one review for P4 and P5 together if the initializer
prefers).

## 7. Contract v2 (shared)

Everything in the 2026-10-19 contract (agent name `concierge`, dispatch metadata, identity `visitor-<visitor_id>`,
rooms `concierge-<addr10>-<12 hex>`, topics `concierge.memory` and `concierge.metrics`, RPCs `concierge.forget_me`
and `concierge.get_memory`, `lk.chat`, the 10 s offline rule) still holds. v2 **adds**; it removes nothing, and every
new field is optional, so a v1 page works against a v2 agent and a v2 page works against a v1 agent (missing fields
render as "not reported", never as an error).

- **`concierge.memory` v2 body** (sent at session start, after every merge, after a compaction, and once more as
  the final message before the agent leaves): the v1 keys `visitor`, `facts`, `summary`, `updated_at`, plus
  - `"v": 2`
  - `"about_visitor"`: `{ "profile": [fact…] (the valid typed-slot facts, same shape as v1 facts), "episodes": [ {"visit": int, "started_at": iso, "ended_at": iso|null, "summary": str|null} ] (newest first, at most 5; the current visit has ended_at null and summary null until the session ends), "events": [ {"ts": iso, "type": "fact_added"|"fact_invalidated"|"fact_deleted"|"gate_rejected"|"extraction_ran"|"remember"|"forget", "detail": str} ] (this session only, newest first, at most 12; detail is one short plain sentence with no instruction text and no URL) }`
  - `"about_agent"`: `{ "knowledge": {"words": int, "est_tokens": int, "sources_commit": str, "sections": [str]}, "instructions_est_tokens": int, "memory_block_chars": int|null, "working": {"items": int, "est_tokens": int, "compacted": bool, "compactions": int}, "cache": {"cached_share": float|null} }`
  - `"retention_days": 30`
- **`concierge.navigate`** (agent → page, new topic; body ≤ 1 KiB): `{ "href": "/projects/<slug>" | "/skills" | "/experience" | "/about" | "/contact" | "/", "reason": str, "at": iso }`. The agent sends it only from its `show_page` tool and only for hrefs on its allowlist (the routes above; project hrefs only for slugs its knowledge names). The page follows it only while the visitor's **Guide me** toggle is on (default on during a live call), with a visible one-line notice naming the destination, never more than once per 8 s, and never away from `/talk` if the visitor opened the concierge there as a full page (the panel keeps the call across client-side navigation).
- **`concierge.get_memory`** returns the v2 body.
- **Session end on departure**: when the visitor's participant disconnects and does not reconnect within 20 s, the agent runs its shutdown sequence (final extraction, visit summary, final `concierge.memory`, journal `visitor_left`) and leaves, so the room closes and the token route's one-room-per-address limit frees within about 30 s of the visitor leaving. The page, on a 429 `busy`/`visitor`, shows "Closing your earlier conversation…" and retries the token request every 5 s for up to 60 s before it shows the v1 busy line.


## 8. Resume v4 text (the source for §2 and §3; the phone number is left out on purpose and must never be added)

> **MICHAEL HERRON**
> mherron734@gmail.com | www.mherron.dev | github.com/mh550 | /in/mherron734
>
> *Full-stack engineer building agentic systems: harness and context engineering, durable agent memory, and verification agents can't bypass, on top of production multi-tenant integrations.*
>
> **WORK EXPERIENCE**
> **Full-Stack Software Engineer, MAXX Potential** *February 2026 - present*
>
> * Shipped React Native, Next.js, edge-function, and Postgres features for a contractor estimating app (~8 issues/week); codified recurring UI fixes into a knowledge source agents load as procedural memory.
> * Replaced siloed spreadsheet bug tracking with Linear and an agentic bug-fix workflow (CLI tooling + custom slash commands): 2× sprint throughput, ~80% less bug-filing time, no new software costs.
> * Designed enterprise Copilot Studio agents: split an over-scoped JD agent into manager and HR agents so each context holds only its data; built an org-restructure impact model alongside SAP SuccessFactors.
>
> **Founding Full-Stack Software Engineer, Builder Clarity** *March 2025 - November 2025*
>
> * Architected a multi-tenant JobTread ↔ GoHighLevel integration platform with managed multi-org OAuth, replacing per-client builds: 3 clients, onboarding cut from ~2 days to ~6 hours.
> * Integrated CRM, VoIP (RingCentral), and internal systems, incl. a unified per-job communications log, saving ~8 hrs/week per client; built ETL normalizing 4+ sources into Postgres.
> * As first engineer, led the move from Zapier to n8n and Pipedream (custom JS components), replacing per-client automations with reusable multi-tenant workflows.
>
> **PROJECTS**
> **Long-Running Agent Harness | github.com/mh550/agent-harness** *October 2026 - present*
>
> * Engineered a deterministic Bash harness that runs Claude Code agents in isolated git worktrees and takes tests, verification, and merges out of the agent's hands, merging only byte-identical verified trees.
> * Designed agent memory through context engineering: a fresh context window per feature, rebuilt from durable on-disk state, with project rules as procedural memory and run retros as episodic memory.
> * Runs remote-first on my home server, steered from laptop or phone via push alerts and a per-run inbox; parallel runs share one usage-limit gate with backoff; 189 features passed in 4 days at ~$3 each.
>
> **Self-Hosted Music Server & DJ Pipeline | github.com/mh550/dj-crate-streaming** *November 2025 - present*
>
> * Self-hosted streaming + DJ ‘crate’ preparation pipeline using Docker Compose behind Tailscale: flagging a playlist as a crate enqueues its missing tracks; a worker container downloads, verifies, and files them.
> * Song/version/copy identity model dedupes only decode-identical audio; downloads verified by ffmpeg decode analysis and acoustic fingerprint; 1,500+ offline tests on fakes built from captured live responses.
>
> **TECHNICAL SKILLS**
> **Agentic AI:** harness & context engineering, agent memory, durable state, eval gates, Claude Code
> **Languages & Web:** TypeScript, Python, Bash, SQL, Java, C++, React, React Native, Next.js, Node.js
> **Data & Integration:** PostgreSQL, Supabase, SQLite, REST, webhooks, OAuth 2.0, ETL, n8n, Pipedream
> **Infra & Tools:** Docker Compose, Linux, Git/GitHub, CI/CD, Vercel, edge functions, Tailscale, Linear
>
> **EDUCATION**
> *Duke University, Durham, NC* *Graduated December 2024*
> B.S. Computer Science; Visual & Media Studies Minor
> **Relevant Coursework:** Database Systems, Algorithm Design & Analysis, Computer Security, Server-side Web Apps, Computer Systems, Data Structures & Algorithms

## 9. Cleanup (P0, first, tiny)

- Remove the booth artifacts: `public/b/` (the tarball and `mh_harness/`), `scripts/build-booth-bundle.mjs`, the
  `booth-bundle` npm script, `src/__tests__/lib/booth-bundle.test.ts`, the `/b/h.tgz` row in `CLAUDE.md`,
  `docs/notes/booth-bundle.md`. Keep the spec and plans under `docs/specs` and `docs/plans` as history, with a
  one-line "Removed 2026-10-21" note at the top of each. The conference is over.
- `profile.conferenceNote` → `''` (the card stops saying "Glad we met!"; D default, reversible).
- One feature, plus the review that P1 runs anyway.

## 10. Tech stack as a graph (P5)

`/skills` becomes an interactive graph, not a list. Design it; these are Michael's ideas, not requirements, and
the bar is: visually compelling, clear, well thought out, interactive, and honest about what he uses.

- **Data** (`skills.ts`, restructured; the page keeps reading data only): `clusters` (5–7: Agentic systems ·
  Languages · Web & mobile · Data & integration · Infra & operations · Process & delivery), `nodes` (one per
  technology or practice, with `cluster`, `logo` key where a logo exists, `weight` 1–3 for how central it is,
  `since` optional) and `edges` between nodes **and to projects** (`{ from, to: 'project:<slug>' | node id, label? }`),
  so the graph can show which project used which parts of the stack. Everything that is on the resume's skills
  lines must be a node; drop Ruby, R, Rails, Flask, MongoDB, PowerShell, WSL, Zapier unless a project on the site
  used them (Zapier: `ringcentral-jobtread-integration` did; keep it, weight 1). The `/evidence` competencies
  don't change.
- **Render**: SVG (not canvas: the nodes are links and need focus and hover), clusters as rounded containers with
  a title, nodes as a logo (from P1's paths) plus label, edges as curved connectors drawn **within** a cluster
  always and **across** clusters only on hover or when a project is selected. Layout: deterministic, hand-laid
  cluster positions (no physics; `d3-force` is the fallback, pre-approved at an exact pin as a runtime dependency
  only if the plan proves a hand layout can't fit 390 px; record the D either way). Pan by drag and by arrow keys,
  zoom by wheel and ± buttons, "Reset view"; at 390 px the graph starts zoomed to the first cluster with the
  cluster titles as a horizontal chip row that pans to each. Selecting a project chip (the featured projects, from
  `projects.ts`) highlights its nodes and edges and dims the rest, with a "Open case study" link. Reduced motion:
  no animated transitions. Every node is a focusable element with its name; the whole graph has a text
  alternative: the same data as a definition list under a "List view" toggle (the list view is also what prints).
- **Tests**: data shape (every edge endpoint exists; every project slug exists; every logo key exists in paths),
  the list view renders every node, selecting a project marks its nodes `aria-pressed`/`data-active`, 390 px
  smoke has no horizontal page scroll. Jest renders the SVG; the pan/zoom math is pure functions in
  `src/lib/graph/` with unit tests.
- Features: plan (with an ASCII layout sketch per width) · data + pure layout math · render + list view ·
  interaction (pan/zoom/select) · check (390/1280 screenshots, default and one project selected) · review +
  simplify.

## 11. Recommendations, not builds (P6, docs; `after: []`, independent of everything)

Two HTML resources under `docs/design/` (self-contained files, inline CSS, no build step; Michael opens them from
the PR or locally), plus one note. Use the `frontend-design` skill if it is available to the session; otherwise
follow its spirit: a stated aesthetic direction, typography and colour chosen on purpose, nothing that reads as
a template default.

1. **`docs/design/2026-10-21-projects-showcase-options.html`**: three options for the projects section, each with
   a mockup drawn in HTML/CSS at 1280 and 390 (static, no JS needed): (A) the shared graph view (projects as
   nodes among the stack, click for a side panel that stays on the graph), (B) a case-file grid (big cover per
   project, metric band, filter chips) and (C) a timeline/log view (projects as entries in a dated ledger, in the
   voice of the harness). For each: what it shows a hiring manager in 10 s, the cost to build on the current data,
   what others have done (3–5 real portfolio or product references with URLs, checked to exist), and risks. End
   with a recommendation and why.
2. **`docs/design/2026-10-21-design-directions.html`**: Michael finds the site bland and wants colour and
   character: retro and overt, not minimalist; Linux, old video games, analog devices. Three directions, each
   with: a 1280 and a 390 mockup of the home hero and a project card, a palette (6–8 tokens with hex and AA
   contrast checked), type pairing (free fonts, named), motion rules, and how `/talk`'s panel and the memory
   colours (§5) fit in. Directions: (1) **terminal/Linux**: tty greens and ambers on near-black, monospace display
   type, window chrome, a boot-log motif; (2) **vintage console/CRT**: scanlines (subtle, off under reduced
   motion), chunky pixel display type for headings only, cartridge-label colour blocks, a CRT-bezel frame for the
   concierge panel; (3) **analog hardware**: brushed panels, knob and VU-meter motifs (the latency panel as a VU
   meter), warm oranges and cream on charcoal, mono labels like a mixer. A short section on **best practices for
   a site with character** (restraint: one motif per page, legibility first, motion as feedback not decoration,
   a real type scale, textures at low opacity, honour reduced motion and AA) and a comparison table. Recommend
   one, and say how it would be introduced as a token-only pass first (colours, type, radii) before any
   component work.
3. **`docs/notes/2026-10-21-framework-options.md`**: Michael is considering a different base that looks like a
   vintage OS, a game console or a CRT TV. List 4–6 real open-source portfolio or UI foundations (e.g. OS-window
   portfolio templates, retro UI kits, terminal-portfolio projects; check each URL and licence), what porting
   the data layer would take, and a recommendation: fork, borrow the look as tokens and components, or stay.
   Honest about the cost against the current 1115-test Next.js site.

Features: showcase options · design directions · framework note · a short review (sonnet) that checks every URL
resolves and every number in the files traces.

## 12. Order, dependencies, and what is left to later

P0 (cleanup) → P1 (angle) → P2 (experience) → P3 (concierge in the site) → P4 (contact) → P5 (graph) → P6 (docs,
`after: []`). P3 needs P1 only for the copy; P4 and P5 need P1 for the logo paths; P6 needs nothing. Emit these as
`after` lists so a blocked milestone doesn't stop the independent ones.

Left to Michael or a later run on purpose: the final About prose; any restyle beyond tokens (P6 recommends);
the merged projects-and-stack graph (P6 option A, if he picks it); measured concierge numbers
(`docs/notes/voice-concierge-todo.md`).

## 13. What Michael will see

Each `check` feature captures 390 and 1280 screenshots into `docs/screenshots/v3/` and lists what is on them in
its plan section "What Michael will see": the hero with the new eyebrow, strip and logos; `/about` with the loop
and "How I work"; `/experience` with linked bullets; the closed widget with its first-visit callout, the open
drawer with the memory strip, the minimized state over `/projects`; `/contact` in one screen; `/skills` graph
default and with a project selected; `/talk` as the full-page view.
