# Decisions

Newest last. `*default*` = taken as the simplest reversible default, waiting for Michael to confirm.
This file is the current rule set: when a decision is overturned, the old entry is rewritten in place to the
rule that holds now, with one "(Updated in place <date>: …)" line naming what replaced it. History is in git.

IDs are the ones the specs gave them, never renumbered: D1–D49 from the v2 spec
(`docs/specs/2026-10-18-portfolio-v2.md`), D59–D74 from the voice-concierge page spec
(`docs/specs/2026-10-19-voice-concierge-page.md` § 7), D75 on from v3. The booth spec's D41–D58 collided with the
v2 spec's D41–D49, so they are `booth-D41`–`booth-D58` (end of this file). A new decision takes the next free
number (D105 next) and names what it supersedes.

## v2 (2026-10-18)

- **D1** The headline is a positioning line, not a job title: Experience entries keep their real titles exactly
  (Michael, 2026-10-18). The line itself is D76's.
  (Updated in place 2026-10-25: was "Systems & Process Engineer"; D76 made it "Agentic Systems Engineer".)
- **D2** One PR per verified milestone, Michael merges (Michael, 2026-10-18). Nothing deploys overnight.
- **D3** Conference share = a `/card` page + a QR code to it (Michael, 2026-10-18). No print PDF, no wallpaper.
- **D4** The QR encodes `https://michael-herron.vercel.app/card?src=qr`. The site URL lives once, in
  `src/lib/data/profile.ts`.
- **D5** No phone number on the site or in the public vCard. Email is `mherron734@gmail.com`.
- **D6** `/card` and `/card/qr` render without the Navbar and Footer; `SiteChrome` decides by pathname (D15).
  (Updated in place 2026-10-25: was "extend `ConditionalFooter`"; D15 folded it into `SiteChrome`.)
- **D7** `/evidence` (MAXX level 4) is built around general competencies now; Michael will paste the real level-4
  rubric later into `docs/notes/maxx-level-4.md`, and remapping must mean editing one data file. `noindex`, not in
  the nav.
- **D8** GPA comes off the site (Michael's own career rule: "don't volunteer it"). *default*
- **D9** The High Cascade bullet is corrected to "Mentored 12–18-year-old snowboarders…" (his experience bank). *default*
- **D10** Agent credit is honest and framed as the process story (see brand.md "Voice"). Each new case study has a
  one-line "How it was built" note.
- **D11** No fake screenshots or stock images; missing shots go in `docs/asset-checklist.md`.
- **D12** New slugs: `agent-harness`, `home-media-server`, `hit-list`. Projects sort by a numeric `order` field,
  lower first; the order itself is D59's. cherished is `featured: false`.
  (Updated in place 2026-10-25: the first order here was replaced by D47, then D59.)
- **D13** About keeps Michael's story; it gains a short "What I do" intro at the top (3 sentences max, from brand.md)
  and nothing else is rewritten beyond D8/D9-style factual fixes.
- **D14** A story that is not in the briefs, from Michael's ideas folder: an invite / gig-broadcast
  app was spec'd over five rounds of questions and then **deliberately not built**: an iOS Shortcut does the job
  with zero code, and the spec records the trip-wires for when building it would become worth it. Use it as the
  "Simplify / what I chose not to build" example in `principles` (D34, D81). No link (private).
  (Updated in place 2026-10-25: it was the `/approach` example; `/approach` redirects to `/about` since D79.)
- **D15** *default* Site chrome is one client component, `src/components/SiteChrome.tsx`, wrapping `{children}` in the
  root layout. By pathname it renders the Navbar, the 64 px top offset and the Footer: none of the three on `/card`
  and `/card/*`; all three everywhere else. `ConditionalFooter` folds
  into it. (Initializer, 2026-10-18: the layout's `pt-16` wrapper would otherwise leave a gap above the card.)
  (Updated in place 2026-10-25: the interim no-Footer rule on `/` ended with D19.)
- **D16** *default* In case-study mode `/projects/[slug]` does not render `detail.approach` or `detail.challenges`
  (MethodSteps and LessonList take their place). Both fields stay required and hold one-sentence summaries for the
  new projects. The page body moves to `src/components/projects/ProjectDetail.tsx` (takes `project`) so tests can
  render a fixture.
- **D17** *default* Diagrams on a case study: `detail.architectureDiagram` renders after Problem;
  `caseStudy.extraDiagrams?: DiagramKey[]` render after IterationTimeline (evolution and before/after diagrams).
  `ProjectDiagram` gains `role="img"` and an `aria-label` per key for every diagram, existing ones included.
- **D18** *default* M5's verify excerpt replaces the `/srv/incoming/…` path with `incoming/…` and is otherwise
  quoted exactly from `docs/download-validation.md`. The fourth media-server metric is D30's.
  (Updated in place 2026-10-25: its "Nothing deleted" was replaced by D30's "Trash, not delete".)
- **D19** *default* Once the home page has a "Recent work" section (M2), the Footer shows on `/` again.
- **D20** *default* No featured skills group: `/skills` is D98's graph.
  (Updated in place 2026-10-25: was "the single featured group is Process & delivery"; D98 replaced it.)
- **D21** *default* `scripts/make-qr.mjs` imports `src/lib/data/profile.ts` directly (Node ≥ 22.18 strips types; this
  box runs Node 24), so the site URL exists once (D4). The script is run by hand; its outputs are committed.
- **D22** *default* `/card` "Selected work" one-liners are each project's `shortDescription`.
- **D23** *default* The shared loop strip is `src/components/MethodStrip.tsx`: it reads `loopSteps` (D77), on the
  hero and in `/about`'s How I work; `methodSteps` stays for the case studies.
  (Updated in place 2026-10-25: it read `methodSteps` on the hero and `/approach`; D77 and D79 replaced that.)
- **D24** *default* Root metadata sets `metadataBase` to `profile.siteUrl` so Open Graph image paths resolve.
- **D25** *default* `mirrored-google-calendars` keeps `featured: false`; its place in the order is D59's.
  (Updated in place 2026-10-25: its order 8 and the pre-case-study top three were replaced by D59.)
- **D26** *default* Stretch items are milestones S1–S3, one feature each, ordered after M9 in the feature list.
- **D27** *default* The agent-harness iterations may keep the brief's row 1b as its own entry (6 or 7 iterations);
  the M4 plan decides, the test accepts either.
- **D28** *default* `/card` has no `ScrollReveal` or other entrance animation (it would delay the 30-second read);
  the vCard has no `PHOTO` (tiny file, simple encoding; the headshot is on the page) and is served
  `Content-Disposition: inline` so iOS shows "Add to Contacts".
- **D29** *default* Portrait (phone) screenshots show uncropped. `ProjectMedia` gains optional `width` and `height`;
  when both are set, `MediaGallery` renders the image at its own aspect ratio (no `fill`, no `object-cover` crop), and
  when every item is portrait the grid is `grid-cols-1 sm:grid-cols-3`. Items without them render as today. (M5-01: the
  three media-server demo shots are 840 × 1720; the 4:3 crop would show only their empty middles. No current project
  sets `detail.media`, so no other page changes.)
- **D30** *default* The fourth media-server metric reads "Trash, not delete" / "code never deletes a library file; every
  removal is a reversible move" instead of D18's "Nothing deleted": the D32 purge deleted 35 (restorable) playlists,
  `fetch` deletes its own failed downloads, and 18 trashed copies were overwritten on Oct 15 before the trash stopped
  overwriting, so "Nothing deleted" would overclaim. (M5-01 fact-check.)
- **D31** *default* Below 768 px the hero's method strip shows the five labels with arrows; each step's line is
  visible from 768 px up and read by screen readers at every width (`sr-only md:not-sr-only`). With the lines shown
  at 390 px, both hero buttons would fall below a 390×844 fold. `/about`'s How I work shows the lines at every width (D80).
  (M2-01.)
  (Updated in place 2026-10-25: the every-width page was `/approach`, a redirect since D79.)
- **D32** *default* The About intro (D13) lives in `src/lib/data/approach.ts` as `aboutIntro: string[]` (subline +
  "I work the way my harness runs:" and the five loop labels (D77) + "I own delivery from requirements to release."), not in `profile.ts`:
  `scripts/make-qr.mjs` imports `profile.ts` under Node's type stripping (D21), which can't resolve an extensionless
  import of `./approach`. (M2-01. Not the media server's own "D32 purge" in D30.)
  (Updated in place 2026-10-25: the middle sentence named the five method labels; D77 made it the loop labels.)
- **D33** *default* The hero's FloatingLogos show from 1280 px (`xl`) up and are hidden below it. Measured at 390,
  768 and 1024 px, they sat behind the eyebrow, h1, tagline, strip labels and step lines; the 40 %-white glyphs drop
  the muted tagline to about 1.5:1 where they cross. The logos are decorative (`aria-hidden`). Repositioning them per
  breakpoint is the alternative if Michael wants them on tablets. (M2-06.)
- **D34** *default* A principle example's `projectSlug` is optional: the D14 "chose not to build" example has none,
  renders as text without a link, and is never filtered out. Every other example names one of the five slugs in the
  M7 plan. (M7-01.)
- **D35** *default* On `/evidence` the High Cascade coaching item ("Mentored 12–18-year-old snowboarders", D9) is
  labelled `Personal`: the item contexts are only MAXX Potential, Builder Clarity and Personal, and coaching is the
  strongest "Communicate and teach" evidence outside those two employers. Dropping it is the alternative. (M7-01.)
- **D36** *default* `robots.txt` keeps `Disallow: /evidence` and `/card/qr` (M8-01's step) next to the pages'
  `noindex`, although a disallowed page's `noindex` is never fetched, so a page linked from elsewhere can still be
  listed as a bare URL. Relying on `noindex` alone (drop the two disallows) is the alternative. (M8-02.)
- **D37** *default* Three Minor findings of the M8-02 pass are left as they are: the straight `"…"` quotes in the
  case-study copy (curly quotes touch many tests and copy strings that trace to docs/notes), `text-balance` on the
  long h1s (they wrap acceptably at 390), and a sitemap test that walks `src/app` for new pages (the fixed route list
  is checked against the files on disk). Details in `docs/plans/2026-10-18-M8-polish.md`. (M8-02.)
- **D38** *default* The project Open Graph image (`src/app/projects/[slug]/opengraph-image.tsx`) shows the company,
  title, first metric (value + label) and "Michael Herron · " + `profile.positioning` (D76). A project without metrics
  (mirrored-google-calendars, cherished) shows its `shortDescription` instead. It uses next/og's bundled Latin Noto
  Sans only: → and ↔ are drawn as SVG arrows and ≈ becomes ~, because a glyph missing from that font makes next/og
  fetch one from Google Fonts (a test checks every drawn character against the font's cmap). The root `twitter.card`
  stays `summary`; `summary_large_image` on project pages is the alternative. (S1-01.)
  (Updated in place 2026-10-25: the footer read "Systems & Process Engineer" until D76.)
- **D39** *default* The `/card` conference note (`profile.conferenceNote`, Stretch 2) ships empty, so the live card is
  unchanged until Michael types a line. When set it renders as one `<p>` inside the Selected work section, above its
  heading, with an accent left rule (`src/components/card/ConferenceNote.tsx`); whitespace-only counts as empty.
  (S2-01.)
  (Updated in place 2026-10-25: the note had been set to "Glad we met!"; D75 set it back to `''`.)
- **D40** *default* The print stylesheet (Stretch 3) is one `@media print` block in `src/app/globals.css` that
  applies to every page, not only case studies: white page, black text on every element, borders #bbb, `nav` and
  `footer` hidden, `pre` wrapped and unclipped, links underlined with external URLs spelled out after them
  (`a[href^="http"]::after`), and ScrollReveal content (`data-scroll-reveal`) forced visible since nothing is scrolled
  into view on paper. NodeGraph, FloatingLogos, the LoopingVideo button and the project page's back links use
  `print:hidden`. Diagrams print as their bordered boxes (highlighted nodes look like plain ones); there is no separate light
  palette for them. A figure with code may break across pages. (S3-01.)
- **D41** *default* Three new runtime dependencies for the Voice Concierge page, pinned exactly (no `^`/`~`):
  `livekit-client` 2.23.0, `@livekit/components-react` 2.9.24 and `livekit-server-sdk` 2.19.1, the latest of each on
  npm on 2026-10-20. Reason: `docs/specs/2026-10-19-voice-concierge-page.md` §3, approved by Michael 10-19 (ground
  rule 9). `@livekit/components-styles` is left out: the panels are Tailwind and `RoomAudioRenderer` renders no
  visible UI. Details in `docs/plans/2026-10-20-VC1-token-route.md`. (VC1-01.)
- **D42** *default* The token route's Jest test signs a real token with the real `livekit-server-sdk` and fake env
  (`'k'.repeat(12)`, `'x'.repeat(32)`), then decodes and verifies it; nothing is mocked there, since signing is
  local (no network). The voice-concierge spec's "mock `livekit-client` in Jest" applies to `livekit-client` and
  `@livekit/components-react`, which VC2 mocks. (VC1-02.)
- **D43** *default* The token route lower-cases a valid visitor id before using it, so the identity
  `visitor-<id>` and the dispatch metadata `visitor_id` are always lower-case (RFC 9562 output form;
  `crypto.randomUUID()` is lower-case already). One visitor stays one identity on the agent side even if a client
  sends upper case. Reversible: drop the `.toLowerCase()` in `route.ts`. (VC1-03.)
- **D44** *default* `/talk` keeps the site chrome (Navbar, skip link, Footer), is indexable (no `robots` override)
  and is in `sitemap.ts`, but stays off the Navbar: the Navbar holds the seven sections of the site, and `/talk` is a
  demo reached from `/card` and the deep-dive (voice-concierge spec W4). Reversible: one entry in `Navbar.tsx`'s
  link list. (VC2-04.)
  (Updated in place 2026-10-25: D60 put Talk on the Navbar and D89 took it off again; `/talk` is reached from `/card`, the deep-dive
  and the concierge panel.)
- **D45** *default* `/talk` reads the visitor id with `getOrCreateVisitorId(browserStorage())` in the Connect click
  handler, not in a mount effect, and creates the LiveKit `Room` in that handler too. So no state is set from an
  effect, the server HTML and the first client render match, StrictMode cannot register the text-stream handlers
  twice, and a visitor who never presses Connect gets no id stored. `browserStorage()` rather than
  `window.localStorage`, because reading that property itself throws when the browser blocks site storage. (VC2-04.)
  (Updated in place 2026-10-25: the Connect handler and the Room are `ConciergeProvider`'s since D85, not `/talk`'s.)
- **D46** *default* `/talk`'s page reads the LiveKit env through `conciergeEnv()` (`src/lib/concierge/env.ts`, the
  same check the token route makes) and passes TalkSession only `configured: boolean`. When it is false, Connect shows
  "The concierge is offline right now" without POSTing to the token route, so the browser never logs Chromium's
  "Failed to load resource … 503" console error, and no visitor id is stored. With the env set, Connect POSTs as
  before and a 503 or failure still reads as offline. The page is prerendered, so the flag is fixed at build time:
  adding the env needs a redeploy, which Vercel needs for env changes anyway. Reversible: drop the prop (it defaults
  to `true`). (VC2-06.)
  (Updated in place 2026-10-25: since D85 `layout.tsx` passes `configured` through `SiteChrome` to `ConciergeProvider`; the env
  check and the offline behaviour stand.)
- **D47** *default* The voice-concierge deep-dive is `featured`; its place in the order is D59's (second), so
  `getTopProjects(3)` shows it. Its card band shows the category `ai` until it has a metric. Reversible: the `order`
  values in `projects.ts` and the order map in `data.test.ts`. (VC3-02.)
  (Updated in place 2026-10-25: was `order: 5` with the top three unchanged; D59 replaced it.)
- **D48** *default* `/card` gains a full-width secondary button "Talk to my concierge" (`next/link` to `/talk`, same
  tab) directly under the LinkedIn / Email / GitHub row and above Selected work. It reuses the row's
  `secondaryButton` (44 px, `focusRing`). The QR leads to `/card`, so a conference visitor is one tap from the voice
  demo; the h1 and Save contact stay above it. `/card` still has exactly 3 `/projects/` links and 2 new-tab links.
  The feature list called this D45, already taken. Reversible: delete the `Link` and its `card.test.tsx` test.
  (VC3-03.)
- **D49** *default* `/talk` stays off the Navbar (D44, D89). Adding it is one entry in `Navbar.tsx`'s link list plus
  `Navbar.test.tsx`. (VC3-03.)
  (Updated in place 2026-10-25: was "the Navbar stays at seven links"; D60 added Talk, D79 and D89 set today's six links.)

## Voice concierge page (2026-10-19 spec § 7: VC4, VC5)

- **D59** Project order (Michael, VC4 spec § VC4.1): 1 agent-harness, 2 voice-concierge, 3 ghl-jobtread-integration,
  4 ringcentral-jobtread-integration, 5 home-media-server, then the rest in their old relative order: 6
  linear-ai-workflow, 7 hit-list, 8 paint-estimator, 9 mirrored-google-calendars, 10 cherished. So
  `getTopProjects(3)`, which feeds `/card`'s Selected work and the home page's Recent work, becomes agent-harness,
  voice-concierge, ghl-jobtread-integration. Supersedes the v2 spec's D47 (voice-concierge at 5, top three
  unchanged). (VC4-01 plan; VC4-02 builds.)
- **D60** `/talk` is not on the Navbar; the Navbar's links are D89's six. (VC4-01 plan; VC4-02 built the first form.)
  (Updated in place 2026-10-25: Michael had put Talk on the Navbar, fifth of eight links (VC4 spec § VC4.2); D79 made it seven
  without Approach, and D89 took Talk off.)
- **D61** *default* The voice widget (VC4 spec § VC4.3; details are defaults): `src/components/VoiceWidget.tsx`, a
  `next/link` to `/talk` named "Talk to my voice concierge" (`talkWidget` in `concierge.ts`), a 56 px accent disc
  with an inline `aria-hidden` SVG microphone, `fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40`
  (below the Navbar's `z-50`), the shared `focusRing` with `focus-visible:outline-offset-4` (clear of the ring), `print:hidden`, and a decorative ring that pulses twice (4 s)
  only under `motion-safe:`. `SiteChrome` renders it after the Footer on every chrome page except `/talk` (and
  `/card*`, which has no chrome); `/evidence` keeps it. The Footer's bottom padding becomes `pb-24 xl:pb-8` so its
  links stay clear of the widget at every width. Supersedes nothing (new element). Reversible: drop the element from `SiteChrome` and the padding from
  `Footer`. Question for Michael: should `/evidence` lose it too? (VC4-01 plan; VC4-03 builds.)
  (Updated in place 2026-10-25: D87 replaced the mic disc linking to `/talk`, its ring and `xl:pb-8` with the "Ask my site" pill
  and `pb-24` at every width; the placement here stands.)
- **D62** The `/talk` intro and the deep-dive credit use the harness framing (Michael, VC4 spec § VC4.4). The intro's
  first paragraph is "A voice agent I designed on LiveKit and built with my agent harness: specs in, verified
  milestones out. It remembers you between visits.", with "my agent harness" linking `/projects/agent-harness`
  (*default* data shape: `IntroParagraph = string | { before, link: { label, href }, after }`). The deep-dive's
  `builtWith` stays a plain string (*default*): "The spec and the design are mine: the agent, its memory and the
  contract between it and this page. My agent harness ran the build sessions, specs in and verified milestones out:
  Claude Code agents wrote this page's code overnight in one run, and a second run is writing the agent."; its Links
  section gains "The agent harness that built it" (`/projects/agent-harness`, kind `doc`). Supersedes the VC2 intro
  copy (`docs/plans/2026-10-20-VC2-talk-page.md` § Copy) and VC3's `builtWith`. (VC4-01 plan; built in VC4-04, recorded in `docs/notes/evidence-voice-concierge.md` § VC4 note.)
  (Updated in place 2026-10-25: D93 replaced the intro copy and the `builtWith` text; the `IntroParagraph` shape, the link and the
  Links entry stand.)

VC5's plan: `docs/plans/2026-10-20-VC5-mic-limits-server-only.md`.

- **D63** *default* The Origin check runs before the env check: a shell POST gets 403 even on an offline site, so
  nothing about whether LiveKit is configured leaks to a caller from outside. Supersedes VC1's "env checked
  first" (`docs/plans/2026-10-20-VC1-token-route.md` § Route behaviour, row 1). (VC5-01 plan; VC5-04 builds.)
- **D64** *default* Without `x-forwarded-for` the address is `'unknown'`, one shared bucket (in practice only the
  Jest tests: Vercel sets the header, and `next dev`/`next start` fill it from the socket). Previews are allowed as
  D74 says. (VC5-01 plan; VC5-03 and VC5-04 build.)
  (Updated in place 2026-10-25: the preview allowlist was a hostname regex any Vercel project name could match; D74 replaced it with
  the deployment's own hosts.)
- **D65** *default* The mic toggle renders only in the `live` phase (was `waiting` or `live`), so nothing can ask
  for the microphone before the agent joins; `setMicrophoneEnabled(true)` moves into `agentArrived`. Supersedes
  the VC2 plan's state-table row "connecting → waiting: `setMicrophoneEnabled(true)`" and its "As built (VC2-05)"
  note (toggle in `waiting` and `live`). (VC5-01 plan; VC5-02 builds.)
- **D66** *default* A 429 puts `/talk` in a `busy` phase (reason kept, Connect shown, the deep-dive link shown as
  offline shows it) with no automatic retry; any other non-OK reply stays offline. Supersedes nothing (new phase). (VC5-01 plan; VC5-05 builds.)
  (Updated in place 2026-10-25: D92 gives `reason: 'visitor'` a `closing` phase that retries; this holds for `site`.)
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
- **D72** *default* Rooms are not shared per address: each Connect gets its own room, as D73 names it. (VC5-07.)
  (Updated in place 2026-10-25: was one room per address, `concierge-<addr10>` with no random part, against token bursts; D73
  reverted it because two people behind one NAT pressing Connect together shared a room.)
- **D73** *default* The room is the VC5 spec's `concierge-<addr10>-<randomBytes(6) hex>` again, and a room is this
  address's when its name starts with `concierge-<addr10>-`. Supersedes D72. Why: under D72 two people behind one
  NAT (the conference Wi-Fi) who press Connect before the first join creates the room share a room and hear each
  other; a burst of tokens minted with a forged Origin is a cost limit that the agent's caps and the provider caps
  bound, as a burst from many addresses already was. Question: keep the spec's form, or go back to D72 and accept
  the shared-room race? (VC5-01 re-run plans it, § D73 rework; VC5-03 and VC5-04 re-runs build.)
- **D74** (Michael's session, 2026-10-20) The allowlist adds `https://mherron.dev` and `https://www.mherron.dev`:
  `profile.siteUrl` 308-redirects there, so production requests carry that Origin and D64's list alone turned every
  live visitor away. Previews are allowed by exact host, `VERCEL_URL` or `VERCEL_BRANCH_URL` (Vercel system env), not by
  D64's regex, which matched a project anyone could name `portfolio-site-evil-mh550s-projects`. Supersedes D64's preview
  regex (the `'unknown'` bucket stays). If a preview answers 403, check that the Vercel project exposes system env vars.

## v3 (2026-10-21)

- **D75** *default*: the booth is removed. `public/b/` (including `/b/h.tgz`), `scripts/build-booth-bundle.mjs`, its test,
  `docs/notes/booth-bundle.md` and the `booth-bundle` script are deleted, and `profile.conferenceNote` is `''`, so `/card`
  no longer says "Glad we met!". Supersedes booth-D50 (unlinked booth bundle) and D39 (the card's conference note default).
  Reversible: `git revert` the P0-01 commit. The three booth spec/plan files keep their content under a "Removed" line.
- **D76** *default*: the positioning line is **"Agentic Systems Engineer"** and the subline "I build the harnesses,
  memory and verification around AI agents, and the integrations they run on." (v3 spec § 2); the tagline is
  unchanged. Supersedes D1's headline and brand.md's 2026-10-18 subline (kept there as history). Real job titles
  still never change. Reversible: two strings in `profile.ts`. (Allocated in P1-01.) *As built (P1-02):* `profile.ts`
  holds both strings; the hero eyebrow, `<title>`, `/card`, `/card/qr`, the vCard (`TITLE:Agentic Systems Engineer`)
  and the OG footer read them with no code edit; brand.md § Positioning has a `### v3 (2026-10-21)` subsection.
- **D77** *default*: the hero strip and `/about`'s How I work read a new `loopSteps` (Spec, Context, Build, Verify,
  Learn, lines from v3 spec § 2), each with a `principle` whose first linkable example is its one link
  (spec→decisions-explicit, context→automate-bookkeeping, build→simplify-after-use,
  verify→verify-what-the-human-sees, learn→fakes-mirror-reality). Supersedes D23's "reads `methodSteps`" and D32's
  "five method labels" in `aboutIntro`; D31's layout rule stands; `methodSteps` stays for the case studies.
  (Plan `docs/plans/2026-10-21-P1-angle.md` § Loop strip.) *As built (P1-02):* `approach.ts` exports `LoopStepId`,
  `LoopStep` and `loopSteps`; `MethodStrip` maps `loopSteps` (hero and, until P1-05, `/approach`); `aboutIntro[1]` is
  "I work the way my harness runs: Spec, Context, Build, Verify, Learn." built from the labels. `methodSteps` is
  unchanged; `approachIntro` stayed while `/approach` read it (P1-05 deleted both). The per-step
  example link (`loopStepExample`, `examples` prop) is P1-04's.
- **D78** *default*: the hero's twelve logos (Claude Code, LiveKit, Python, TypeScript, Bash, SQLite, PostgreSQL,
  Docker, Linux, Next.js, n8n, GitHub) come from `src/components/logos/paths.ts`, generated by `scripts/logos.mjs`;
  `simple-icons` moves to devDependencies at exactly 16.9.0 (like `qrcode`), with no runtime import. D33 stands.
  (P1-03 builds.) *As built (P1-03):* `npm run logos` writes `paths.ts` (`logoPaths`, `LogoKey`; titles override
  Claude → Claude Code and GNU Bash → Bash); `Logo.tsx` renders one mark; FloatingLogos reads `logoPaths` in four
  columns (left 4%/11%, right 11%/4%) and `public/pipedream.svg` is deleted. `.harness/logos-check.mjs` prints
  `overlaps: 0` at 1280×720/800/900 against the hero text, the navbar and the VoiceWidget.
- **D79** *default*: `/approach` is a permanent redirect to `/about#how-i-work` (`next.config.ts` `redirects()`, or a
  `permanentRedirect` stub if the hash is dropped); the Approach page is deleted and the Navbar has seven links:
  Home, About, Skills, Projects, Talk, Experience, Contact. Supersedes D60's "fifth of eight links, between Projects
  and Approach" (Talk stays fifth) and the M7 page / M8-02 Navbar entry for `/approach`; D49's seven links are back,
  with Talk where Approach was. Reversible: remove the
  redirect, `git revert` P1-05. (*Built in P1-05*: the `next.config.ts` `redirects()` entry; `curl -sI /approach` →
  308, `location: /about#how-i-work`, hash kept, so no stub; the page, its test, `approachIntro` and `approachClosing` are deleted.)
  (Updated in place 2026-10-25: the seven links became D89's six, without Talk.)
- **D80** *default*: `/about` gains a "How I work" section (`#how-i-work`) between the story and Philosophy: the loop
  strip with lines at every width and one case-study link per step. Extends D13 (About keeps Michael's story); the
  intro stays three sentences. (*Built in P1-04*: `loopStepExample` in `approach.ts`, `MethodStrip`'s `examples`;
  the narrative bullets are `docs/notes/about-narrative-bullets.md`.)
- **D81** *default*: `principles` in `approach.ts` stays whole (six titles, summaries and eighteen examples) after the
  Approach page is gone, although only the five examples How I work links (`loopStepExample`) render: it is the
  source those links are picked from, `claims-on-linked-page` still checks every linked example against its page, and the
  copy is Michael's to cut or reuse. Corrects the v3 spec § 3's reason ("the `/evidence` page and the case studies
  still read them": neither does). Reversible: trim `Principle` to `{ id, examples }` and drop the unused examples.
  (P1-08 review; asks Michael's P1-05 question.)
- **D82** *default*: Tahoma Films and High Cascade Snowboard Camp are not on the resume v4 (v3 spec § 8); they stay on
  `/experience` as a compact "Earlier" list (title · company · period, no bullets, `earlierRoles` in
  `experience.ts`) rather than being deleted (v3 spec § 3: show character). Supersedes their bullets (M2-03, D9's
  age-range bullet). Reversible: drop `earlierRoles` and its section. (P2-01; plan `docs/plans/2026-10-21-P2-experience.md`.)
- **D83** *default*: six `/evidence` items cite `/experience` lines the resume text drops (Foundational Capability
  Patterns, git-tracked migrations ×2, de facto PM, Agile/Scrum in Linear, the High Cascade mentoring). They stay
  (each still traces to brand.md or the spec) and keep linking to `/experience`, which still shows the role; the High
  Cascade item drops its age range ("Mentored young snowboarders at High Cascade…") so every number on `/evidence`
  is still on the page it links (`claims-on-linked-page`). Reversible: one edit in `competencies.ts`. Question for
  Michael: keep, relink or drop them? (P2-01.)
- **D84** *default*: the Long-Running Agent Harness keeps two bullets on `/experience`, as the v3 spec § 3 says ("two
  bullets each"); resume v4's third bullet (§ 8: "Runs remote-first on my home server … 189 features passed in 4
  days at ~$3 each") stays off the page. The two resume projects keep § 8's straight-hyphen periods
  (`October 2026 - present`) beside the roles' kept `–` strings. Narrows § 3's "exactly" to per-line for the
  projects. Reversible: append the line to `resumeProjects[0].bullets` and change the two-bullet checks in
  `experience-data.test.ts` and `experience.test.tsx`. Question for Michael: add the third bullet, and should the
  project periods use `–` like the roles? (P2-04 review, finding 1; plan `docs/plans/2026-10-21-P2-experience.md` § Review.)
- **D85** *default*: a `ConciergeProvider` (`src/components/concierge/ConciergeProvider.tsx`, client) mounted by
  `SiteChrome` on every chrome page owns the one Room, so a call survives client-side navigation; `/talk`'s
  `TalkSession` reads it through `useConcierge()`. `configured` comes from `src/app/layout.tsx` (`conciergeEnv() !==
  null`, a Server Component) as a prop through `SiteChrome`, so no client file imports `env.ts`; `pagehide`
  disconnects and a bfcache `pageshow` resets to idle. Supersedes D46's "the `/talk` page passes `configured` to
  TalkSession" (the env check stands); D45 (Room and visitor id made in the Connect handler, now the provider's)
  and D44 (chrome, indexable, sitemap) stand. Reversible: `git revert` P3-03. (P3-01 plan
  `docs/plans/2026-10-21-P3-concierge-in-site.md` § Ownership; P3-03 builds.) *As built (P3-03):* the provider holds
  the reducer, the session ref, the Room and the six actions (made once per `configured` in a `useMemo`) and renders
  `RoomAudio`; the Forget me guard is now a `forgetting` flag on the session, not the reducer's `forget`. `SiteChrome`
  takes `configured` (default `false`); `status.ts`, `buttons.ts` and `CallControls.tsx` (the Connect/Leave button
  and its focus rule) moved to `src/components/concierge/` for the drawer to reuse. Tests render through
  `renderTalk()` (`src/__tests__/helpers/concierge.tsx`); `layout-concierge.test.tsx` pins the layout's prop. From
  the P3-03 review: until P3-04's drawer, a call that outlives `/talk` is shown by the widget (`live`: the name
  `talkWidget.liveLabel`, "Live call with my concierge: back to it", and a red dot), so Leave and the mic toggle are
  one click away on every page; and a bfcache `pageshow` resets only a call that `pagehide` actually ended (an ended,
  offline or Forgotten state comes back as it was).
  *As built (P3-10):* the provider makes its Room with `disconnectOnPageLeave: false`: LiveKit's own page-leave
  listener fires on `beforeunload`, which a `mailto:` link raises without leaving; the provider's `pagehide` teardown
  is the one page-leave path.
  (Updated in place 2026-10-25: the widget's interim live name (`talkWidget.liveLabel`) went with D87's pill.)
- **D86** *default*: the concierge panel is a non-modal drawer (`role="dialog" aria-modal="false"`, labelled by its
  title): 420 px on the right at ≥ 1024 px, a full-height bottom sheet under the Navbar below that, `z-[45]`
  (Navbar `z-50`, pill `z-40`), rendered only while open, no focus trap, no `inert`, no scroll lock; Esc and
  Minimize close it without ending the call; never on `/talk` or `/card*`. Supersedes nothing (new). Reversible:
  drop `ConciergePanel` from `SiteChrome`. (Plan § Panel; P3-04 builds.) *As built (P3-04):* the provider holds
  `panel` (`'closed'` on first render) with `openPanel`/`minimizePanel`; `ConciergePanel.tsx` renders the h2 title
  (`tabIndex -1`, focused on open), Minimize, `CallControls`, the deep-dive link when offline or busy
  (`DeepDiveLink.tsx`, shared with `/talk`) and `Transcript fill` (the log is the `flex-1` region) with `MessageBox`;
  Esc closes unless a control already called `preventDefault` (the contract for P3-06's Forget me confirm step) or
  the Esc ends an IME composition. `VoiceWidget` is a `<button aria-expanded>` (`aria-controls` only while open)
  that toggles the panel, is `invisible` while it is open (the panel covers its corner at every width, so it leaves
  the tab order) and takes focus back when the panel closes with focus on `<body>`; until P3-05's pill it keeps the
  mic disc, and its live name is now "Live call with my concierge" (`aria-expanded` carries open/closed). An open
  panel stays open across client-side navigation; reaching `/talk` closes it. "Read how it works" in the panel
  closes it on click. The sheet scrolls on a short screen (the transcript section keeps a `min-h-52` floor), the
  log has `overscroll-contain`.
  (Updated in place 2026-10-25: the widget's interim mic disc and live name went with D87's pill.)
- **D87** *default*: the widget is the "Ask my site" pill: a `<button aria-expanded>` that toggles the panel, a
  three-bar sound glyph that moves only while the agent speaks (`motion-safe:`), a live dot and the accessible
  names "Ask my site: listening" / "Ask my site: speaking" during a call, collapsed to the glyph at ≤ 390 px once
  scrolled; the twice-pulsing ring goes, and the Footer keeps `pb-24` at every width (the pill is wider). Supersedes
  D61's mic disc linking to `/talk`, its ring and `xl:pb-8`; D61's placement (`fixed right-4`, safe-area bottom,
  `z-40`, `print:hidden`, not on `/talk` or `/card*`, kept on `/evidence`) stands. Reversible: `git revert` P3-05's
  widget commit. (Plan § Widget; P3-04 and P3-05 build.) *As built (P3-05):* `talkWidget` is `{ label, listening,
  speaking, callout, close, minimize, href }` (`liveLabel` gone; P3-10 dropped `panelTitle`: the panel's title is `label`; D94 adds the usher's keys). The live states key on `phase ===
  'live'` (connecting and waiting show the idle pill; the open panel's status line covers them); the dot is red with
  a background ring, inset on the collapsed circle. The provider's `agentSpeaking` turns on at once and off 500 ms
  (`AGENT_QUIET_MS`) after the agent leaves the speakers list, so a pause between words doesn't flip the focused
  pill's name; it goes off at once on `Reconnecting`, the agent leaving, Leave, a new Connect and `pagehide`. The bars
  loop while the agent speaks: a real-time status shown alongside its audio that stops when the speech does, and never
  under reduced motion (WCAG 2.2.2's pause is the OS setting). The collapse listens through `addListener` where
  `MediaQueryList.addEventListener` is missing (Safari < 14). The pill carries `id="concierge-pill"`.
- **D88** *default*: a first-visit callout next to the pill, "This site talks. Ask it about my work, by voice or
  text.", with a Close button; `localStorage` key `concierge.callout_seen` (try/catch), set by Close or by opening
  the panel; rendered after mount only, entrance under `motion-safe:` only, never on `/card*`. Supersedes nothing.
  Reversible: drop `Callout` from `SiteChrome`. (Plan § Callout; P3-05 builds.) *As built (P3-05):* SiteChrome renders
  it after the panel and before the pill. Also dismissed for good by Esc (from anywhere, unless a control already
  `preventDefault`ed it) and by Connect; Close or Esc with focus in the bubble hands focus to the pill. It shows only at
  `scrollY 0` with the `<footer>` out of sight (an `IntersectionObserver`), without setting the key, so it never
  covers the Footer's links or a focused control the page scrolls under it (WCAG 2.4.11); it comes back at the top.
- **D89** *default*: the Navbar has six links: Home, About, Skills, Projects, Experience, Contact. `/talk` stays in
  the sitemap and the smoke routes and is reached from `/card`, the deep-dive and the panel's call. Supersedes D60
  (Talk on the Navbar) and D79's "seven links"; the v3 spec § 4.1's "seven links" counted Approach, gone since P1.
  Reversible: one entry in `Navbar.tsx`. (Plan § Widget; P3-05 builds.) *As built (P3-05):* six links in the desktop
  list and the mobile menu; on `/talk` no link is current.
- **D90** *default*: the memory view shows six kinds (Profile, Episodes, Events, Knowledge, Working, Cache) in About
  you / About the agent, coloured by new `globals.css` tokens `--color-mem-profile` `#00d4ff`, `--color-mem-episode`
  `#fbbf24`, `--color-mem-event` `#4ade80`, `--color-mem-event-rejected` `#f87171`, `--color-mem-knowledge`
  `#a78bfa`, `--color-mem-working` `#f472b6` (each ≥ 6.17:1 on every dark surface; Cache uses `--color-muted`); the
  strip counts Knowledge as sections and Working as items; a v1 body shows Profile and the summary and "not
  reported by this agent version" for the rest; Forget me is always in the Memory tab, disabled with "Connect to
  erase what it remembers" before a call. `MemoryPanel` is replaced by `MemoryView`. Supersedes VC2's separate
  "What it remembers" panel. Reversible: `git revert` P3-06. (Plan § Memory view; P3-06 builds.) *As built
  (P3-06):* the strip and the tabs follow the message box in a `section` under an `sr-only` h2 "Memory, latency
  and privacy", in the drawer (`PanelTabs compact`: the tab panel capped at 25 vh below lg, not the plan's 35 vh, so
  a v2 body leaves the transcript room on a 390 × 844 sheet; 40 vh at lg) and on `/talk` (right column from lg, no cap; `/talk` keeps its own Privacy section);
  `LatencyPanel` lost its h2 (the tab names it); a strip chip pulses only when its new count is reported and differs
  (none on first render, none going back to `–`); the chips wrap rather than scroll sideways (a scroll container
  with nothing focusable can't be scrolled by keyboard); only the newest open episode is "in progress"; a
  `gate_rejected` event carries an `sr-only` "Not kept:" and every event time, learned-at and the Knowledge section
  names are `sr-only` text as well as `title`; Esc in Forget me's confirm step closes the step, not the drawer; a v1 body's "not reported" line reads "Episodes · Events: not
  reported by this agent version"; Profile chips show slot, value, the channel glyph (voice, text) and the source,
  learned-at in `title` and `sr-only`; `retention_days` adds "Kept {n} days after your last visit"; the Forget me
  line (`forgetLine`) sits under the button in the Memory tab.
- **D91** *default*: the last `concierge.memory` body is cached in `localStorage` under `concierge.memory.<visitor_id>`
  as `{ v: 1, savedAt, body: <the raw JSON text> }` and re-parsed with `parseMemory` on load; `readVisitorId` reads
  the id without creating one, so D45's "no id stored before Connect" holds; Forget me clears it. Supersedes
  nothing. Reversible: stop calling `saveMemory`. (Plan § Cache; P3-02 and P3-07 build.) *As built (P3-02):*
  `src/lib/concierge/memoryCache.ts` exports `memoryCacheKey`, `saveMemory(storage, visitorId, bodyText, savedAt)`,
  `loadMemory` → `{ body, savedAt } | null` and `clearMemory`; an id that isn't a UUID v4 reads and writes nothing;
  `visitorId.ts` exports `readVisitorId(storage)` (never writes). Nothing calls them yet (P3-07 wires them).
  *As built (P3-07):* `ConciergeProvider` reads the cache once after mount (only for an id `readVisitorId` finds) and
  exposes `cachedMemory`; each parsed live body is saved with the time it arrived under the id the token request
  sent; Forget me's `{ok: true}` clears it, and the agent's last, empty body after it is neither shown nor saved.
  `status.ts` `shownMemory(state, cachedMemory)` picks what the strip and the Memory tab show: the session's body,
  else the cached one with `asOf`, else nothing once forgotten. The cached view has `data-stale="true"`, every line
  in `--color-muted` (`**:` variant) and dots at 60 %, under "as of <date, time>" (`LEARNED_AT_FORMAT`); the strip is
  greyed alike and a cached body never pulses its chips (the first live body pulses what differs from it). Once
  forgotten the tab shows only the "Forgotten" line (no "Nothing remembered yet" above it).
- **D92** *default*: a 429 `busy`/`visitor` enters a `closing` phase ("Closing your earlier conversation…") and
  re-POSTs the token route every 5 s, one request in flight, for up to 60 s, then shows the v1 `busyVisitor` line;
  Leave cancels. Supersedes D66 for `reason: 'visitor'` only; D66 stands for `site` and offline, and D71's line is
  the final line. Reversible: dispatch `busy` on the first 429 again. (Plan § Busy retry; P3-07 builds.)
  *As built (P3-07):* `BUSY_RETRY_MS` and `BUSY_RETRY_LIMIT_MS` in `ConciergeProvider.tsx`; the retry is a loop
  inside the same `connect()` (one visitor id, the LiveKit import already under way), each wait on the session's
  `timer`, which teardown clears, so Leave, `pagehide` and unmount stop it; the deadline is checked when a wait ends
  (12 POSTs at most: the first at 0 s, then 5 s … 55 s). A token on a retry dispatches `closed` (closing →
  connecting) before the Room is made, so the rest of the connect runs from `connecting` as it always did (the
  plan's table had `connected`/`agentJoined` accepted from `closing`; they aren't needed). `isActive(phase)`
  (`inRoom` or `closing`) makes the one button read Leave while closing. Review: teardown aborts a token request
  still out (`AbortController` on the session) and ends the wait at once, so `connect()` settles. Question for
  Michael: `reason: 'visitor'` is the address bucket, not the visitor id, so on shared Wi-Fi a neighbour's call shows
  B "Closing your earlier conversation…" for a minute, then the "another tab" line; have the route compare the room's
  `visitor_id` and say `'self'`, or soften the copy ("Waiting for an earlier conversation on this network…")?
  *As built (P3-10):* the 60 s deadline runs on `performance.now()`. Also accepted: a second tab's Connect while the
  first is live reads the closing line for the minute before "another tab" (the route can't tell closing from live);
  a cross-tab "live" flag in `localStorage` would skip it, part of the question above.
- **D93** *default*: `talkPage.intro` becomes "A voice agent I designed on LiveKit and built with my agent harness.
  It remembers you between visits, shows you what it remembers and where each thing came from, and can take you to
  the work it's talking about." ("my agent harness" still links `/projects/agent-harness`) and "Talk or type. The
  Latency tab shows how long each turn took, and Forget me on the Memory tab erases what it knows about you."; the
  deep-dive `builtWith` drops "specs in and verified milestones out", and "knowledge pack" leaves the page.
  Supersedes D62's copy; D62's `IntroParagraph` shape and link stand. Question for Michael: keep the second
  paragraph, or cut the intro to the first? Reversible: three strings. (Plan § Copy; P3-07 builds.) *As built
  (P3-07):* both intro paragraphs as above, the deep-dive `builtWith` and decision VC-A's "knowledge pack" → "what it
  knows about my work"; `docs/notes/evidence-voice-concierge.md` § P3 note has the before/after (no sentence with a
  digit).
- **D94** *default*: the usher follows `concierge.navigate` only while the panel's Guide me switch is on (default
  on, `localStorage` `concierge.guide_me`), only to `isAllowedHref` targets ('/', '/about', '/skills',
  '/experience', '/contact', '/projects/<known slug>', exact match; the slugs and short titles come from
  `layout.tsx` as a prop, so `projects.ts` stays out of the client bundle), at most once per 8 s, never while on `/talk`,
  with the transcript notice "Taking you to <name>". Supersedes nothing (new). Reversible: unregister the topic.
  (Plan § Usher; P3-02 and P3-08 build.) *As built (P3-08):* as above, plus three refusals the spec doesn't name: a
  body for the page already shown, a body from anyone but the agent, and any body within 8 s of the visitor's own
  navigation (a link clicked in the tab, back or forward), so the agent never overtakes the visitor (no push, no
  notice, the usher's clock untouched). The switch sits on its own row under the call controls, with a screen-reader
  hint "Lets the concierge open the pages it talks about"; the 8 s clock is per call and monotonic. Names: a page's from `talkWidget.pageNames`, a project's
  title up to its first colon (`usherTargets` in `src/lib/concierge/usher.ts`). Question for Michael: the bottom sheet
  covers the page below `lg`, so on a phone the visitor sees the notice, not the page it opened, until they minimize;
  minimize the sheet on a follow at that width, or leave it?
- **D95** *default*: contract v2 parsing: every v2 field is optional and never a reason to reject a body; a v1 body
  parses to exactly today's object (the v2 keys left off); a malformed entry inside a v2 list is dropped on its own
  (v1's `facts` rule, which rejects the body, stands); `concierge.navigate` bodies over 1 KiB are dropped;
  `concierge.get_memory` is named (`RPC_GET_MEMORY`) but not called in P3, since the agent pushes memory at
  session start and the cache covers the time before a call. Extends the 2026-10-19 contract § 4 (its 15 KiB cap
  stands). Reversible: the parser's v2 branch is one function. (Plan § Contract v2; P3-02 builds.) *As built (P3-02):*
  `contract.ts` exports `TOPIC.navigate`, `RPC_GET_MEMORY`, `MAX_NAVIGATE_BYTES`, `MEMORY_EVENT_TYPES`, the
  `Episode`, `MemoryEvent`, `AboutVisitor`, `AboutAgent` and `NavigateBody` types, `parseNavigate` and
  `isAllowedHref`; a list in `about_visitor` that isn't an array is `null`, a `knowledge.sections` that isn't one
  is `[]`; episodes keep the first 5 good entries and events the first 12.
- **D96** *default* (P3-07 review): the browser's copy of the memory (D91) lives no longer than the server's: it is
  dropped and removed on load once `retention_days` (30 when a v1 body doesn't say) have passed since it was saved, or
  when its time is unreadable (`memoryExpired` in `memoryCache.ts`); another tab saving or clearing it (Forget me
  there) updates this one through the `storage` event; the privacy note gains a seventh line, after the id line:
  "This browser keeps a copy of what it last showed you, so the Memory tab has something before you connect. It goes
  when the server's copy does, or when Forget me runs." Supersedes nothing; extends D91 and spec W2's privacy list.
  Question for Michael: on a shared browser the copy shows before Connect and only a live call can erase it (Forget
  me is disabled until then, D90); add a local "Clear this browser's copy" control beside the disabled Forget me,
  or drop the cache before a call entirely? Reversible: delete the line and the `memoryExpired` call.
- **D97** *default* (P4-01): `/contact` is one screen (v3 spec § 6): the h1, one line from `profile.location` and the
  new `profile.availability` ("Durham, NC · open to remote, hybrid or relocation."), then three equal tiles (mail,
  LinkedIn, GitHub), each one link with a glyph, the label and the value; the eyebrow, the subheader and the closing
  note go. simple-icons 16.9.0 has no LinkedIn mark (removed at the brand's request), so the "in" glyph is authored in
  `src/components/logos/extra.ts` next to an authored envelope (both `fill-rule: evenodd`; `Logo` takes either key,
  `paths.ts` stays generated); GitHub keeps the generated path. Supersedes spec § 6's "simple-icons paths for LinkedIn"
  and the pre-v3 contact copy. Height budget in `docs/plans/2026-10-21-P4-contact.md` § Layout. Reversible: swap the
  path in `extra.ts`, or put the copy back.
  P4-03 review: LinkedIn's brand guidelines ask people not to recreate or alter the "in" mark, so the authored glyph
  is a departure from them, not only from the spec. Question for Michael: keep it, or download LinkedIn's official
  "in" asset from their brand page into `extra.ts`? The tiles take their names from their text, the new-tab note in
  an `sr-only` span like every other new-tab link (no `aria-label`).
- **D98** *default* (P5-01): `src/lib/data/skills.ts` becomes a graph (v3 spec § 10): `clusters` (six: Agentic
  systems, Languages, Web & mobile, Data & integration, Infra & operations, Process & delivery), `nodes` (51, each
  with `cluster`, `weight` 1–3, an optional `logo` key and `since` year) and `edges` (node ↔ node, and node →
  `project:<slug>`). A node is a § 8 skills-line item, an item of the old list not dropped, or a tool a resume bullet
  or a project's `techStack` names; Ruby, R, Ruby on Rails, Flask, MongoDB, PowerShell and WSL are dropped, Zapier
  stays at weight 1. Supersedes D20 (the featured Process & delivery group) and M2-04's four capability groups
  (`skillCategories`). Tables in `docs/plans/2026-10-21-P5-skills-graph.md` § Data. Question for Michael: MongoDB is
  in Cherished's `techStack` (Cherished is not featured); keep it off the graph? And are the weight-3 ("core") nodes
  the right ones? Reversible: edit the node rows.
- **D99** *default* (P5-01): no d3-force. The graph is a hand layout from pure functions (`src/lib/graph/`): three
  columns of clusters from 1024 px, two below, three nodes a row inside each, and at small widths the first view is
  one cluster at about 1:1. Reconsider (with the spec's pre-approved exact pin) only if a cluster passes 15 nodes or
  nodes must be placed by their connections (the merged projects-and-stack graph, P6 option A). Supersedes nothing.
- **D100** *default* (P5-01): the wheel zooms the graph only while focus is inside it or with Ctrl/⌘ held (a
  trackpad pinch); a plain wheel scrolls the page and is never `preventDefault`ed. Touch is `touch-action: pan-y
  pinch-zoom`: a sideways swipe pans the graph, a vertical one scrolls the page, a pinch zooms the page. Supersedes nothing.
- **D101** *default* (P5-01): each graph node is an `<a href="#skill-<id>">` to its row in the list view (weight,
  since, projects); following it opens the list view there and focuses the row, and `/skills#skill-<id>` opens it on
  load. Supersedes nothing.
- **D102** *default* (P5-01): the small-screen graph (first view = the first cluster, a cluster chip row that pans
  to each) applies below 640 px (`sm`), not only at ≤ 390 as spec § 10 and P5-04 say: the two-column drawing is too
  small to read at any phone width. Reversible: one media query.
- **D103** *default* (P5-01): the graph's `<svg>` is `role="none"`, not `role="img"` (P5-03's step): `img` makes
  its children presentational, which would hide the node links from screen readers. The focusable container is the
  one `role="group"`, named by a `hidden` span (`#skill-graph-title`), and each cluster is a nested group with its name.
  View changes (zoom, pan, chips, reset) are instant at every motion setting, so reduced motion has no viewBox
  animation to turn off; only the highlight fade is `motion-safe:`. Supersedes nothing.
  (Updated in place 2026-10-25: the group was named by the svg's `<title>`, which showed as a tooltip over every gap.)
- **D104** *default* (P5-07 review): a list-view row for a skill with no project edge shows only its weight and
  since; the "From my roles" suffix (P5-01's plan) goes, because it was untrue for Java and C++ (coursework, on the
  resume's skills line), Tailwind CSS and Framer Motion (this site), Linux and Vercel. Question for Michael: would
  you rather a per-node source line ("Coursework", "This site", "Home server")? Reversible: one optional field on
  `SkillNode` and one `dd` clause. Supersedes P5-01's "From my roles".

## Booth bundle (booth-D41 – booth-D58, 2026-10-20): removed

None of these binds: the booth bundle (`public/b/h.tgz`, `mh_harness`) was deleted in P0-01 (D75).
(Updated in place 2026-10-25: collapsed to one line each and renamed from D41–D58, which collided with the v2
spec's. Full text: `git show 5a2d235:docs/specs/2026-10-20-booth-harness-bundle.md` § 7.)

- **booth-D41** `public/b/h.tgz` committed, built reproducibly by `npm run booth-bundle`.
- **booth-D42** No module beyond the spec's file list; shared functions in `run_one.py`.
- **booth-D43** Extra CLI flags (`--interval`, `--alarm-after`, `--round`) so the tests run fast.
- **booth-D44** Python 3.8, stdlib only.
- **booth-D45** `sweep.py` writes one config per run under `work/<name>-<K>/`.
- **booth-D46** Output paths resolve from `run_one.py`'s directory; `MH_HARNESS_HOME` overrides (booth-D52).
- **booth-D47** Interrupts kill the game's process tree and exit 130 without a row.
- **booth-D48** `configs/fake-round.json` shipped beside `round1.json`.
- **booth-D49** Exit codes for `run_one.py`, `sweep.py` and `report.py`.
- **booth-D50** The bundle stayed unlinked (superseded by D75).
- **booth-D51** `sweep.py --dry-run` warns on placeholders instead of refusing.
- **booth-D52** The base-dir override is `MH_HARNESS_HOME`, not `HARNESS_HOME`.
- **booth-D53** `run_one.py` exits 2 on a bad config and records an `error` row when the command can't start.
- **booth-D54** `sweep.py` refuses bad configs files and duplicate names (exit 2); signal handling.
- **booth-D55** A round's rows accumulate across sweeps.
- **booth-D56** `run_one.py` always kills the game's group when the game ends.
- **booth-D57** Bundle members are `git ls-files mh_harness`.
- **booth-D58** The bundle's Python tests ran in the default jest run.
