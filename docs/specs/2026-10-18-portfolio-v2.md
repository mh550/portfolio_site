# Portfolio v2: show the work (overnight spec, 2026-10-18)

**Goal.** Turn the portfolio from a site that *tells* into one that *shows*: three new case studies (the agent
harness, the home media server + DJ crate pipeline, HitList) told as decisions, iterations and failures with real
numbers; a repositioning to **Systems & Process Engineer**; a `/card` page + QR code Michael can share at a
conference on **Monday 2026-10-19**; a method page (`/approach`); and an evidence page for his MAXX Potential
level-4 review (`/evidence`).

**Read first, every session:** this file, `docs/notes/brand.md` (positioning, voice, never-publish list, metrics
bank), and the evidence brief for the case study you are on (`docs/notes/evidence-agent-harness.md`,
`evidence-media-server.md`, `evidence-hit-list.md`). The older plan `docs/notes/SITE_UPDATE_PLAN.md` explains the
show-don't-tell groundwork already merged (diagrams, metrics, media, code snippets, two MAXX projects); build on it,
don't redo it.

## Ground rules

1. **Build only. Never deploy.** Pushing `main` deploys production on Vercel. Never run `vercel`, never push or merge
   to `main`, never `gh pr merge`. The harness opens one PR per verified milestone; Vercel builds a preview of it;
   Michael merges. (`MERGE_POLICY=pr`.)
2. **Every number and claim on the site traces to `docs/notes/`** (or to the source files those briefs name).
   Do not invent metrics, dates, quotes or outcomes. If a fact is missing, write less, not more.
3. **Never publish** what `docs/notes/brand.md` lists. The M0 content guard enforces the patterns; never weaken it to
   make a test pass. Read other repos only at the paths the briefs name, read-only; never read `.env` files,
   `/srv`, `/etc/restic`, or `agent-harness/journal/raw/`.
4. **Tests first** (Jest + Testing Library, as in `src/__tests__/`). framer-motion is mocked globally. The suite is
   `.harness/check.sh`: eslint + jest + `next build`. Green before every commit.
5. **Data-driven content.** Copy lives in `src/lib/data/*.ts`; components render it. New pages read data modules;
   tests assert against the data, not duplicated strings, except where this spec gives an exact string.
6. **Each milestone that adds a page** appends its path(s) to `.harness/smoke-routes.txt` (one per line) so
   `node .harness/smoke.mjs` covers it: no page errors, no console errors, no horizontal scroll at 390 px.
7. **"What Michael will see"** — every UI milestone's check feature saves 390 px and 1280 px screenshots of each
   new or changed page to `docs/screenshots/v2/<milestone>-<page>-<width>.png` (PNG, keep each under ~400 KB) and
   writes a short table in its plan file: page · what is on screen · anything that looks wrong. Look at them.
8. **Design system stays**: dark background `#0a0a0f`, cyan accent `#00d4ff`, Geist, Tailwind 4, framer-motion
   entrances via the existing `ScrollReveal`, `prefers-reduced-motion` respected. Diagrams are authored inline SVG/
   React in `src/components/projects/diagrams/` (follow the existing ones), each with `role="img"`, an
   `aria-label`, and a caption. Use the repo skills `web-design-guidelines` and `vercel-react-best-practices` in
   review features.
9. **Dependencies:** one new devDependency is pre-approved: `qrcode` (+ `@types/qrcode`) for the QR generation
   script (M1). Any other new package needs a decision recorded below as `D<n> *default*` with the reason; prefer
   none.
10. Plans go in `docs/plans/2026-10-18-<milestone>-<topic>.md`. New defaults you had to choose go in the
    "Decisions" list below as `D<n> *default*` (append; never renumber).

## Decisions already made (do not re-ask)

- **D1** Headline positioning is **"Systems & Process Engineer"** (Michael, 2026-10-18). It is a positioning line,
  not a job title: Experience entries keep their real titles exactly.
  Superseded by D76 (v3): the headline is "Agentic Systems Engineer".
- **D2** One PR per verified milestone, Michael merges (Michael, 2026-10-18). Nothing deploys overnight.
- **D3** Conference share = a `/card` page + a QR code to it (Michael, 2026-10-18). No print PDF, no wallpaper.
- **D4** The QR encodes `https://michael-herron.vercel.app/card?src=qr`. The site URL lives once, in
  `src/lib/data/profile.ts`.
- **D5** No phone number on the site or in the public vCard. Email is `mherron734@gmail.com`.
- **D6** `/card` and `/card/qr` render without the Navbar and Footer (extend the existing `ConditionalFooter`
  pathname pattern; add the same for the Navbar).
- **D7** `/evidence` (MAXX level 4) is built around general competencies now; Michael will paste the real level-4
  rubric later into `docs/notes/maxx-level-4.md`, and remapping must mean editing one data file. `noindex`, not in
  the nav.
- **D8** GPA comes off the site (Michael's own career rule: "don't volunteer it"). *default*
- **D9** The High Cascade bullet is corrected to "Mentored 12–18-year-old snowboarders…" (his experience bank). *default*
- **D10** Agent credit is honest and framed as the process story (see brand.md "Voice"). Each new case study has a
  one-line "How it was built" note.
- **D11** No fake screenshots or stock images; missing shots go in `docs/asset-checklist.md`.
- **D12** New slugs: `agent-harness`, `home-media-server`, `hit-list`. Project order (a numeric `order` field;
  lower first): agent-harness 1, linear-ai-workflow 2, home-media-server 3, hit-list 4, ghl-jobtread-integration 5,
  paint-estimator 6, ringcentral-jobtread-integration 7, mirrored-google-calendars 8, cherished 9
  (`featured: false`).
- **D13** About keeps Michael's story; it gains a short "What I do" intro at the top (3 sentences max, from brand.md)
  and nothing else is rewritten beyond D8/D9-style factual fixes.
- **D14** A story for `/approach` that is not in the briefs, from Michael's ideas folder: an invite / gig-broadcast
  app was spec'd over five rounds of questions and then **deliberately not built**: an iOS Shortcut does the job
  with zero code, and the spec records the trip-wires for when building it would become worth it. Use it as the
  "Simplify / what I chose not to build" example. No link (private).

- **D15** *default* Site chrome is one client component, `src/components/SiteChrome.tsx`, wrapping `{children}` in the
  root layout. By pathname it renders the Navbar, the 64 px top offset and the Footer: none of the three on `/card`
  and `/card/*`; the existing no-footer rule on `/` until D19; all three everywhere else. `ConditionalFooter` folds
  into it. (Initializer, 2026-10-18: the layout's `pt-16` wrapper would otherwise leave a gap above the card.)
- **D16** *default* In case-study mode `/projects/[slug]` does not render `detail.approach` or `detail.challenges`
  (MethodSteps and LessonList take their place). Both fields stay required and hold one-sentence summaries for the
  new projects. The page body moves to `src/components/projects/ProjectDetail.tsx` (takes `project`) so tests can
  render a fixture.
- **D17** *default* Diagrams on a case study: `detail.architectureDiagram` renders after Problem;
  `caseStudy.extraDiagrams?: DiagramKey[]` render after IterationTimeline (evolution and before/after diagrams).
  `ProjectDiagram` gains `role="img"` and an `aria-label` per key for every diagram, existing ones included.
- **D18** *default* M5's verify excerpt replaces the `/srv/incoming/…` path with `incoming/…` and is otherwise
  quoted exactly from `docs/download-validation.md`. The fourth media-server metric reads "Nothing deleted" /
  "every removal reversible" (a "0" reads oddly).
- **D19** *default* Once the home page has a "Recent work" section (M2), the Footer shows on `/` again.
- **D20** *default* After the M2 skills regroup the single featured group is **Process & delivery**.
- **D21** *default* `scripts/make-qr.mjs` imports `src/lib/data/profile.ts` directly (Node ≥ 22.18 strips types; this
  box runs Node 24), so the site URL exists once (D4). The script is run by hand; its outputs are committed.
- **D22** *default* `/card` "Selected work" one-liners are each project's `shortDescription`.
- **D23** *default* The shared method strip is `src/components/MethodStrip.tsx` (reads `methodSteps`), created by
  whichever of M2 (hero) and M7 (`/approach`) runs first; the other reuses it.
  Superseded in part by D77 (v3): the strip reads `loopSteps`; `methodSteps` stays for the case studies.
- **D24** *default* Root metadata sets `metadataBase` to `profile.siteUrl` so Open Graph image paths resolve.
- **D25** *default* `mirrored-google-calendars` keeps `featured: false` (as today) with order 8. Before the case
  studies land, the top three are linear-ai-workflow, ghl-jobtread-integration, paint-estimator.
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
  at 390 px, both hero buttons would fall below a 390×844 fold. `/approach` (M7) shows the lines at every width.
  (M2-01.)
- **D32** *default* The About intro (D13) lives in `src/lib/data/approach.ts` as `aboutIntro: string[]` (subline +
  the five method labels + "I own delivery from requirements to release."), not in `profile.ts`:
  `scripts/make-qr.mjs` imports `profile.ts` under Node's type stripping (D21), which can't resolve an extensionless
  import of `./approach`. (M2-01. Not the media server's own "D32 purge" in D30.)
  Superseded in part by D77 (v3): the middle sentence names the five loop labels.
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
  title, first metric (value + label) and "Michael Herron · Systems & Process Engineer". A project without metrics
  (mirrored-google-calendars, cherished) shows its `shortDescription` instead. It uses next/og's bundled Latin Noto
  Sans only: → and ↔ are drawn as SVG arrows and ≈ becomes ~, because a glyph missing from that font makes next/og
  fetch one from Google Fonts (a test checks every drawn character against the font's cmap). The root `twitter.card`
  stays `summary`; `summary_large_image` on project pages is the alternative. (S1-01.)
- **D39** *default* The `/card` conference note (`profile.conferenceNote`, Stretch 2) ships empty, so the live card is
  unchanged until Michael types a line. When set it renders as one `<p>` inside the Selected work section, above its
  heading, with an accent left rule (`src/components/card/ConferenceNote.tsx`); whitespace-only counts as empty.
  (S2-01.)
  Superseded by D75 (v3): the note had been set to "Glad we met!"; D75 sets it back to `''`.
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
  Superseded by D60 (VC4).
- **D45** *default* `/talk` reads the visitor id with `getOrCreateVisitorId(browserStorage())` in the Connect click
  handler, not in a mount effect, and creates the LiveKit `Room` in that handler too. So no state is set from an
  effect, the server HTML and the first client render match, StrictMode cannot register the text-stream handlers
  twice, and a visitor who never presses Connect gets no id stored. `browserStorage()` rather than
  `window.localStorage`, because reading that property itself throws when the browser blocks site storage. (VC2-04.)
- **D46** *default* `/talk`'s page reads the LiveKit env through `conciergeEnv()` (`src/lib/concierge/env.ts`, the
  same check the token route makes) and passes TalkSession only `configured: boolean`. When it is false, Connect shows
  "The concierge is offline right now" without POSTing to the token route, so the browser never logs Chromium's
  "Failed to load resource … 503" console error, and no visitor id is stored. With the env set, Connect POSTs as
  before and a 503 or failure still reads as offline. The page is prerendered, so the flag is fixed at build time:
  adding the env needs a redeploy, which Vercel needs for env changes anyway. Reversible: drop the prop (it defaults
  to `true`). (VC2-06.)
- **D47** *default* The voice-concierge deep-dive takes `order: 5`, after the four case studies with measured
  numbers (agent-harness, linear-ai-workflow, home-media-server, hit-list) and ahead of the older integration and
  client pages, which move down one (ghl-jobtread-integration 6 … cherished 10). It is `featured`, so
  `getTopProjects(3)` is unchanged: `/card`'s Selected work and the home page's Recent work still show agent-harness,
  linear-ai-workflow and home-media-server. `/projects` shows the new card fifth, its band showing the category `ai`
  until it has a metric. INBOX.md § Answers was empty. The feature list called this D44, already taken by `/talk`'s
  chrome. Reversible: the `order` values in `projects.ts` and the order map in `data.test.ts`. (VC3-02.)
  Superseded by D59 (VC4).
- **D48** *default* `/card` gains a full-width secondary button "Talk to my concierge" (`next/link` to `/talk`, same
  tab) directly under the LinkedIn / Email / GitHub row and above Selected work. It reuses the row's
  `secondaryButton` (44 px, `focusRing`). The QR leads to `/card`, so a conference visitor is one tap from the voice
  demo; the h1 and Save contact stay above it. `/card` still has exactly 3 `/projects/` links and 2 new-tab links.
  The feature list called this D45, already taken. Reversible: delete the `Link` and its `card.test.tsx` test.
  (VC3-03.)
- **D49** *default* The Navbar stays at seven links: `/talk` stays off it (restating D44 for VC3) and is reached from
  `/card`, the voice-concierge deep-dive (its Links section) and the sitemap. Adding it later is one entry in
  `Navbar.tsx`'s link list plus `Navbar.test.tsx`. The feature list called this D43, already taken. (VC3-03.)
  Superseded by D60 (VC4).

## Dependencies between milestones

M0 first. M1 after M0. M2 after M1. **M3 needs only M0.** **M4, M5 and M6 each need only M3** (independent of each
other and of M1/M2). **M7 needs only M3** (it links only to case studies that exist in the data, validated by a
test). **M8 needs M2 and M7.** M9 runs last and covers whatever landed. The initializer must emit these as `after`
lists so a blocked milestone never stalls an unrelated one.

**Priority order (the feature list's order):** M0, M1, M3, M4, M5, M6, M2, M7, M8, M9, then Stretch. The card is
needed Monday; the case studies are the core of the ask; positioning and polish follow. No milestone here needs an
answer from Michael: where something is unclear, choose the conservative option, record it as `D<n> *default*`,
and keep going. Never park a feature waiting on Michael.

## Queue

### M0 — Guardrails and the profile source of truth (≈30 min)
- [ ] `src/lib/data/profile.ts`: `profile = { name: 'Michael Herron', positioning: 'Systems & Process Engineer',
      tagline, subline, location: 'Durham, NC', email, linkedin, github, siteUrl: 'https://michael-herron.vercel.app',
      headshot: '/photos/headshot.png' }` with the exact values in brand.md. Export a typed `Profile`.
- [ ] Content guard test `src/__tests__/lib/content-guard.test.ts`: walks `src/` and `public/` (text files: ts, tsx,
      js, mjs, json, md, svg, txt, vcf, html, css; skip `src/__tests__/lib/content-guard.test.ts` itself) and fails
      on any match, naming file and line: `/\.ts\.net\b/`; CGNAT addresses
      `/\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/`; `/ntfy\.sh\//`; a US phone number
      `/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/`; `/open\.spotify\.com\/playlist/`; `/claude\.ai\/(code\/)?artifact/`;
      `/github\.com\/mh550\/(pathways|projects)\b/`; `/\[X\]/`; `/\bTODO\b/`; `/lorem ipsum/i`;
      `/(api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i`. Test the guard itself with an in-memory
      sample per pattern (each sample must be caught; a clean sample must pass).
- [ ] The guard is green on the current tree (it is expected to be; if not, fix the content, not the guard).
- [ ] `Project` gains a required `order: number`; set it on the 6 existing projects per D12 (`cherished` also
      becomes `featured: false`). Add `getTopProjects(n)` to `src/lib/data/projects.ts`: `featured` projects sorted
      by `order`, first `n`. Tests for both. (M1's card, M2's home section and M8's index all use it.)
- [ ] `src/lib/data/approach.ts` with `methodSteps`: the five steps `diagnose`, `decide`, `build`, `verify`,
      `simplify`, each `{ id, label, line }` (label "Diagnose" etc.; one short line each in brand voice). M2's hero
      strip and M7's page reuse it.
- [ ] Suite green.

### M1 — `/card`: the conference card + QR (≈1.5 h) · ships first, Michael needs it Monday
The person scanning has a phone and 30 seconds. Michael shows the QR from his own phone at `/card/qr`.
- [ ] `src/lib/vcard.ts`: `buildVCard(profile): string` → vCard 3.0, CRLF line endings, fields `BEGIN:VCARD`,
      `VERSION:3.0`, `N:Herron;Michael;;;`, `FN:Michael Herron`, `TITLE:Systems & Process Engineer`,
      `EMAIL;TYPE=INTERNET:mherron734@gmail.com`, `URL:https://michael-herron.vercel.app`,
      `X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/mherron734/`, `ADR;TYPE=WORK:;;;Durham;NC;;USA`,
      `END:VCARD`; values escaped per RFC 6350 (`,` `;` `\` newline). Unit tests: exact output for the real profile;
      escaping for a profile containing `;`, `,` and a newline; no phone line (D5).
- [ ] `src/app/michael-herron.vcf/route.ts`: `GET` returns `buildVCard(profile)` with
      `Content-Type: text/vcard; charset=utf-8` and `Content-Disposition: inline; filename="michael-herron.vcf"`;
      `export const dynamic = 'force-static'`. Test the handler's status, headers and body.
- [ ] `scripts/make-qr.mjs` (uses `qrcode`): writes `public/card/qr.svg` and `public/card/qr.png` (1024 px, margin 2,
      error correction `M`, dark `#0a0a0f` on white) encoding `${siteUrl}/card?src=qr`. Add `"qr": "node
      scripts/make-qr.mjs"` to package.json scripts. Commit the generated files. Test: regenerating the SVG string in
      the test with the same options equals the committed `public/card/qr.svg` (so the QR can never drift from
      `profile.siteUrl`).
- [ ] `/card` (`src/app/card/page.tsx`, server component, static): no Navbar/Footer (D6). Top to bottom at 390 px:
      headshot (96–128 px, round), name, "Systems & Process Engineer", the subline; a primary button **Save contact**
      → `/michael-herron.vcf`; secondary buttons **LinkedIn**, **Email** (`mailto:`), **GitHub**; a "Selected work"
      list of the top 3 projects by `order` among `featured: true` (title + one line, linking to
      `/projects/<slug>`; data-driven, so new case studies appear when they land); a "Full portfolio →" link to `/`;
      and a small **Show QR** link to `/card/qr`. Name and **Save contact** must be visible without scrolling at
      390×844. Every button ≥ 44 px tall. Metadata: title "Michael Herron — Systems & Process Engineer",
      description = the subline, Open Graph + Twitter card with the headshot.
- [ ] `/card/qr` (`src/app/card/qr/page.tsx`): white full-screen page, the QR image (`/card/qr.svg`) at
      `min(80vw, 420px)`, "Michael Herron" and "Systems & Process Engineer" under it, and a small "← Back" link to
      `/card`. `robots: { index: false }`. Black-on-white for scanning in a dim room.
- [ ] Tests: `/card` renders name, positioning, the Save contact href `/michael-herron.vcf`, the LinkedIn/email/
      GitHub hrefs from `profile`, and exactly 3 selected-work links whose slugs exist in `projects`; `/card/qr`
      renders an `<img>` with `src="/card/qr.svg"` and meaningful alt text; Navbar is absent on both.
- [ ] Add `/card` and `/card/qr` to `.harness/smoke-routes.txt`. Smoke green.
- [ ] `docs/conference-kit.md` (short, for Michael): how to use it Monday (open `/card/qr` on his phone, add it to
      the home screen, the other person scans; "Save contact" adds him in one tap; LinkedIn's own QR in the
      LinkedIn app as the fallback with no signal); how to check it after merging (scan the PNG from a second
      device; open the vCard on an iPhone); and that the page updates as case studies merge.
- [ ] What Michael will see: `docs/screenshots/v2/M1-card-390.png`, `M1-card-1280.png`, `M1-card-qr-390.png`.

### M2 — Positioning across the site (≈1.5 h)
- [ ] Root metadata (`src/app/layout.tsx`): title "Michael Herron — Systems & Process Engineer"; description = the
      subline; Open Graph site name and default image (headshot); all from `profile`.
- [ ] Hero (`src/components/hero/HeroSection.tsx`): eyebrow → `profile.positioning`; tagline unchanged; add the
      subline under it; add a compact five-step method strip **Diagnose → Decide → Build → Verify → Simplify**, one
      short line each (`methodSteps` from M0). Keep the two buttons and the node graph. Keep the floating logos.
- [ ] Home "Recent work" section under the hero: `getTopProjects(3)` as cards (reuse `ProjectCard`), with a
      "See all projects" link.
- [ ] Experience (`src/lib/data/experience.ts`): MAXX and Builder Clarity bullets updated to the metrics bank in
      brand.md (MAXX: Linear + AI agent workflow, 2× throughput, ~80% less bug-filing time; de facto PM on a client
      engagement; Foundational Capability Patterns; git-tracked DB migrations + team onboarding. Builder Clarity:
      3 clients, ~2 days → ~6 hours onboarding, ~8 hrs/week per client, ETL from 4+ sources, Agile/Scrum in Linear).
      D8 (remove GPA field and its rendering) and D9. **Titles unchanged** — a test asserts the exact title strings
      "Full-Stack Software Engineer" (MAXX Potential) and "Founding Full-Stack Software Engineer" (Builder Clarity).
- [ ] About: the D13 intro (3 sentences max, built from brand.md's subline and method). Nothing else rewritten.
- [ ] Skills (`src/lib/data/skills.ts` + page): regroup by capability, tools as the evidence under each:
      **Process & delivery** (requirements, Agile/Scrum in Linear, specs and decision ledgers, project management,
      onboarding docs), **Systems & architecture** (multi-tenant integrations, ETL/data pipelines, self-hosted
      infrastructure with Docker, agent orchestration), **Build** (TypeScript, React/Next.js, React Native/Expo,
      Python, Postgres/Supabase, SQLite), **Operate & verify** (test-first, CI, backups with restic, monitoring,
      private networking). Keep every skill currently listed somewhere; update the skills test.
- [ ] Tests updated/added for hero (eyebrow text, subline, 5 method steps), home recent-work (3 cards, ordered),
      experience (titles, no GPA, D9 text), about intro, skills groups.
- [ ] What Michael will see: home, about, skills, experience at 390 and 1280.

### M3 — The case-study template (≈1.5 h)
Extend the existing `Project` type (keep every current field working; all new fields optional):
```ts
export interface Decision { id: string; title: string; chose: string; over?: string; because: string; cost?: string }
export interface Iteration { when: string; label: string; what: string; why: string }
export interface Lesson { broke: string; rule: string }
export interface ProjectLink { label: string; href: string; kind: 'repo' | 'live' | 'doc' | 'demo' }
export interface CaseStudy {
  role: string; timeframe: string;
  method: { diagnose: string; decide: string; build: string; verify: string; simplify: string };
  decisions: Decision[]; iterations?: Iteration[]; lessons: Lesson[]; links: ProjectLink[];
  builtWith?: string;          // D10: the honest one-line "how it was built"
}
// Project gains: caseStudy?: CaseStudy      (order already exists, from M0)
```
- [ ] Categories gain `'systems'` and `'process'` (the `/projects` filter shows them; update ProjectsGrid tests).
- [ ] Components in `src/components/projects/case-study/`: `MethodSteps` (the five steps, each with the project's
      text, anchor ids `#diagnose` … `#simplify`), `DecisionLog` (each decision: id chip, title, "Chose X over Y
      because Z", cost if any; anchor `#decisions`), `IterationTimeline` (`#iterations`), `LessonList` ("What broke →
      the rule it became"; `#lessons`), `ProjectLinks` (icons per kind; external links `rel="noopener"`).
- [ ] `/projects/[slug]`: when `caseStudy` exists, render in this order: header (title, company/context, role,
      timeframe) → `MetricStrip` → Problem → diagram → MethodSteps → DecisionLog → IterationTimeline →
      LessonList → Outcome → media/code → ProjectLinks → builtWith note. Without `caseStudy`, the page renders
      exactly as today (a test proves an existing project is unchanged).
- [ ] `generateMetadata` per project (title "<title> — Michael Herron", description = shortDescription).
- [ ] Tests: a fixture project with a full `caseStudy` renders every section in order with its anchors; each
      component's empty/optional cases; `getProjectBySlug`/`getTopProjects` ordering.
- [ ] What Michael will see: one existing project page at 390/1280 (unchanged) — the template is proven on real
      content in M4.

### M4 — Case study: the agent harness (≈1.5 h) · slug `agent-harness`
Source: `docs/notes/evidence-agent-harness.md` (and the journal it points to). This is the flagship: it shows
process design, systems architecture and honest iteration at once.
- [ ] Project entry: title "Agent Harness: overnight software delivery with verification gates" (or tighter;
      keep it plain), company "Personal · open source", categories `['systems','process','ai']`, order 1,
      featured, metrics: 55 features passing · 52 verified & merged · +374 tests · ≈ $2.53 per feature.
- [ ] `caseStudy`: method (diagnose = the three walls; decide = fresh session per feature + driver does
      bookkeeping; build = v1 → v3; verify = independent verifier, evidence rows, "verified tree == merged tree";
      simplify = from parallel loops to one serial queue, from human merges to gated auto-merge). Decisions:
      D-H1, D-H2, D-H4, D-H5, D-H11, D-H17 (6, from the brief). Iterations: the 6-row evolution table.
      Lessons: the 5 "what broke" items. Links: the repo; the portfolio repo's harness PRs
      (`https://github.com/mh550/portfolio_site/pulls?q=is%3Apr+harness`) labelled "This site update, built by the
      harness". builtWith: honest credit (D10).
- [ ] Two diagrams: `agent-harness` (the architecture: CLI → driver → initializer → per-feature sessions → suite
      gate → verify → tag/PR → main, with INBOX/notifications/limit marker around it) and `harness-evolution`
      (iterations 0–5 on a horizontal timeline that stacks vertically at 390 px, each with its "why it changed").
- [ ] One short code excerpt (≤ 25 lines) from the public repo, quoted exactly with its path: the usage-limit
      detection or the verified-tree merge check (read from `/home/mh550/projects/agent-harness/lib/`).
- [ ] Tests: the entry exists with all case-study sections; every metric value appears in the evidence brief
      (a test reads `docs/notes/evidence-agent-harness.md` and asserts each metric's number string is in it);
      both diagrams render with `role="img"` and an aria-label.
- [ ] What Michael will see: `/projects/agent-harness` at 390/1280, plus the `/card` page now listing it.

### M5 — Case study: home media server + DJ crate pipeline (≈1.5 h) · slug `home-media-server`
Source: `docs/notes/evidence-media-server.md`. Lead with self-hosting, verification and safe automation (brand.md).
- [ ] Project entry: title "Self-hosted music library & DJ crate pipeline", company "Personal · home server",
      categories `['systems','full-stack']`, order 3, featured, metrics: 831 songs · 1,405 playlist entries kept
      intact · 1,359 tests · 0 files deleted by code (phrase the last as "nothing deleted: every removal reversible"
      if a number reads oddly).
- [ ] `caseStudy`: decisions D7, D3 (+rule 3), D24 (four tiers → one rule), D27 (the app owns the flag), D18, D38/39.
      Iterations: the timeline in the brief. Lessons: the 8 "what broke" items (pick the 6 strongest if the page
      gets long; keep "859 = 859 = 859" and "a guessed fake hid 3 critical bugs"). Links: the repo.
- [ ] Diagram `media-server`: phone → private network (HTTPS) → Navidrome ↔ crates service ↔ worker → verify →
      beets → library; nightly snapshot + backup to a second disk. No hostnames, no IPs, no paths under `/srv`.
- [ ] Media: copy the three fake-data screenshots named in the brief into `public/projects/home-media-server/` and
      use them via `MediaGallery` with captions saying they show demo data. A styled terminal block (CodeBlock) of
      the verify output rejecting an upscaled file, from `docs/download-validation.md`.
- [ ] Tests as in M4 (sections present, metrics traceable to the brief, diagram accessible, media files exist on
      disk).
- [ ] What Michael will see: `/projects/home-media-server` at 390/1280.

### M6 — Case study: HitList (≈1.25 h) · slug `hit-list`
Source: `docs/notes/evidence-hit-list.md`. The story: build fast, use it, then simplify hard.
- [ ] Project entry: title "HitList: offline-first street-spot scouting app", company "Personal · iOS (Expo)",
      categories `['full-stack','process']`, order 4, featured, metrics: 374 tests · 20+ fields → 7 · SDK 54 → 57 in
      one-version hops.
- [ ] `caseStudy`: decisions D1, D2, D3, D12, D21, D22. Iterations: Feb sprints → Oct revival → overnight loop →
      orchestrator session → device crash → simplification spec (say plainly the simplification is specified, not
      yet built). Lessons: the 374-tests crash, the foreign-key difference, "7679.1 mi", the invisible flexGrow bug,
      silent data loss in Edit. Links: the repo root only.
- [ ] Diagrams: `hit-list` (screens → stores → SQLite + photo files → maps/geocoder; capture → review → details
      later) and `form-simplification` (before: 20+ fields in five sections; after: the 7 fields, with the 5-step
      "None · Little · Some · Enough · Too much" scale drawn as it would appear).
- [ ] No screenshots exist: do not fake any. Add the phone shots to `docs/asset-checklist.md`.
- [ ] Tests as in M4.
- [ ] What Michael will see: `/projects/hit-list` at 390/1280.

### M7 — `/approach` and `/evidence` (≈1.5 h)
- [ ] `src/lib/data/approach.ts` (`methodSteps` exists from M0) gains
      `principles: { id, title, summary, examples: { projectSlug, anchor, text }[] }[]` — six principles:
      **Diagnose before building** · **Make decisions explicit** (decision ledgers) · **Fakes mirror reality**
      (captured responses; the harness's own limit-detector failure) · **Verify what the human will see**
      ("859 = 859 = 859", "7679.1 mi") · **Simplify after use** (four tiers → one rule; 20+ fields → 7; D14's
      "chose not to build") · **Automate the bookkeeping, keep judgment human** (the harness driver; MAXX Linear +
      AI workflow). Each example names a real project and links to an anchor on its page.
- [ ] `/approach` page: intro (2 sentences, brand voice), the method strip, the principles with their examples,
      and a closing line linking to the agent-harness case study ("this site update was built that way").
      Data-driven.
- [ ] A test asserts **every** example link resolves: its `projectSlug` exists in `projects` and its anchor is one
      the case-study template renders for that project (examples pointing at a project without a `caseStudy` link
      to the project page with no anchor). Examples whose project is missing are filtered out, so M7 never breaks
      when a case study has not landed.
- [ ] `src/lib/data/competencies.ts` + `/evidence`: competencies **Diagnose problems in real processes** ·
      **Design systems and make decisions explicit** · **Deliver working, verified software** · **Lead process and
      delivery** · **Communicate and teach** · **Use AI with guardrails**; each with 2–4 evidence items `{ text,
      href, context: 'MAXX Potential' | 'Builder Clarity' | 'Personal' }` drawn from brand.md (MAXX work) and the
      case studies. Page header "Evidence of practice — Michael Herron", one sentence on how to read it, a note
      that it maps to general competencies (D7). `robots: { index: false }`; not in the Navbar. Test: every href
      resolves to an existing route/slug/anchor; at least one MAXX Potential item per competency where the bank
      supports it (otherwise none, never invented).
- [ ] `docs/notes/maxx-level-4.md`: a stub explaining where Michael pastes the rubric and that remapping = editing
      `competencies.ts`.
- [ ] Add `/approach` and `/evidence` to `.harness/smoke-routes.txt`.
- [ ] What Michael will see: `/approach` and `/evidence` at 390/1280.

### M8 — Navigation, index and polish (≈1 h)
- [ ] Navbar gains **Approach** (between Projects and Experience); mobile menu too; Navbar test updated.
- [ ] `/projects` index sorted by `order`; filter includes the new categories; the new case studies show their
      top metric on the card (existing `ProjectCard` metric badges).
- [ ] `src/app/sitemap.ts` and `src/app/robots.ts` from the data (exclude `/evidence` and `/card/qr`).
- [ ] Review pass with the `web-design-guidelines` skill over the new pages: focus states, contrast, heading order,
      link text, reduced motion. Fix what it finds (or record a `D<n> *default*` for anything deliberately left).
- [ ] Smoke green on every route; suite green.

### M9 — Docs and hand-off (always, last)
- [ ] `docs/asset-checklist.md`: every screenshot/recording Michael should capture, per project, with where it goes
      (`public/projects/<slug>/`) and the `media` entry to add (HitList phone screens or a 15 s recording; Amperfy on
      the phone; `harness attach` in tmux; a phone INBOX edit; any MAXX screenshots he is allowed to share).
- [ ] `docs/review-guide.md` for Michael: per milestone, what changed, what to look at on the Vercel preview at
      phone width, and which PR to merge first (**M1 before Monday**: merging it also ships the setup and M0).
- [ ] CLAUDE.md: routes table (add `/card`, `/card/qr`, `/approach`, `/evidence`, `/michael-herron.vcf`), the test
      count, the data modules, the content guard, and the fact that build is not a static export.
- [ ] README.md: replace the create-next-app boilerplate with what this site is, how to run it, and how v2 was
      built (link to the harness case study).

### Stretch (in order, only with time left)
1. Per-case-study Open Graph images via `next/og` (`opengraph-image.tsx`) using the title + top metric, no
   external fonts.
2. `/card`: a "Met me at a conference?" one-line note above Selected work (copy in profile.ts, empty by default so
   nothing renders until Michael fills it).
3. Print stylesheet for case-study pages (clean black-on-white for handing a printout to a reviewer).

## v3 decisions (2026-10-21, from D75)

- **D75** *default*: the booth is removed. `public/b/` (including `/b/h.tgz`), `scripts/build-booth-bundle.mjs`, its test,
  `docs/notes/booth-bundle.md` and the `booth-bundle` script are deleted, and `profile.conferenceNote` is `''`, so `/card`
  no longer says "Glad we met!". Supersedes D50 (unlinked booth bundle) and D39 (the card's conference note default).
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
- **D87** *default*: the widget is the "Ask my site" pill: a `<button aria-expanded>` that toggles the panel, a
  three-bar sound glyph that moves only while the agent speaks (`motion-safe:`), a live dot and the accessible
  names "Ask my site: listening" / "Ask my site: speaking" during a call, collapsed to the glyph at ≤ 390 px once
  scrolled; the twice-pulsing ring goes, and the Footer keeps `pb-24` at every width (the pill is wider). Supersedes
  D61's mic disc linking to `/talk`, its ring and `xl:pb-8`; D61's placement (`fixed right-4`, safe-area bottom,
  `z-40`, `print:hidden`, not on `/talk` or `/card*`, kept on `/evidence`) stands. Reversible: `git revert` P3-05's
  widget commit. (Plan § Widget; P3-04 and P3-05 build.)
- **D88** *default*: a first-visit callout next to the pill, "This site talks. Ask it about my work, by voice or
  text.", with a Close button; `localStorage` key `concierge.callout_seen` (try/catch), set by Close or by opening
  the panel; rendered after mount only, entrance under `motion-safe:` only, never on `/card*`. Supersedes nothing.
  Reversible: drop `Callout` from `SiteChrome`. (Plan § Callout; P3-05 builds.)
- **D89** *default*: the Navbar has six links: Home, About, Skills, Projects, Experience, Contact. `/talk` stays in
  the sitemap and the smoke routes and is reached from `/card`, the deep-dive and the panel's call. Supersedes D60
  (Talk on the Navbar) and D79's "seven links"; the v3 spec § 4.1's "seven links" counted Approach, gone since P1.
  Reversible: one entry in `Navbar.tsx`. (Plan § Widget; P3-05 builds.)
- **D90** *default*: the memory view shows six kinds (Profile, Episodes, Events, Knowledge, Working, Cache) in About
  you / About the agent, coloured by new `globals.css` tokens `--color-mem-profile` `#00d4ff`, `--color-mem-episode`
  `#fbbf24`, `--color-mem-event` `#4ade80`, `--color-mem-event-rejected` `#f87171`, `--color-mem-knowledge`
  `#a78bfa`, `--color-mem-working` `#f472b6` (each ≥ 6.17:1 on every dark surface; Cache uses `--color-muted`); the
  strip counts Knowledge as sections and Working as items; a v1 body shows Profile and the summary and "not
  reported by this agent version" for the rest; Forget me is always in the Memory tab, disabled with "Connect to
  erase what it remembers" before a call. `MemoryPanel` is replaced by `MemoryView`. Supersedes VC2's separate
  "What it remembers" panel. Reversible: `git revert` P3-06. (Plan § Memory view; P3-06 builds.)
- **D91** *default*: the last `concierge.memory` body is cached in `localStorage` under `concierge.memory.<visitor_id>`
  as `{ v: 1, savedAt, body: <the raw JSON text> }` and re-parsed with `parseMemory` on load; `readVisitorId` reads
  the id without creating one, so D45's "no id stored before Connect" holds; Forget me clears it. Supersedes
  nothing. Reversible: stop calling `saveMemory`. (Plan § Cache; P3-02 and P3-07 build.) *As built (P3-02):*
  `src/lib/concierge/memoryCache.ts` exports `memoryCacheKey`, `saveMemory(storage, visitorId, bodyText, savedAt)`,
  `loadMemory` → `{ body, savedAt } | null` and `clearMemory`; an id that isn't a UUID v4 reads and writes nothing;
  `visitorId.ts` exports `readVisitorId(storage)` (never writes). Nothing calls them yet (P3-07 wires them).
- **D92** *default*: a 429 `busy`/`visitor` enters a `closing` phase ("Closing your earlier conversation…") and
  re-POSTs the token route every 5 s, one request in flight, for up to 60 s, then shows the v1 `busyVisitor` line;
  Leave cancels. Supersedes D66 for `reason: 'visitor'` only; D66 stands for `site` and offline, and D71's line is
  the final line. Reversible: dispatch `busy` on the first 429 again. (Plan § Busy retry; P3-07 builds.)
- **D93** *default*: `talkPage.intro` becomes "A voice agent I designed on LiveKit and built with my agent harness.
  It remembers you between visits, shows you what it remembers and where each thing came from, and can take you to
  the work it's talking about." ("my agent harness" still links `/projects/agent-harness`) and "Talk or type. The
  Latency tab shows how long each turn took, and Forget me on the Memory tab erases what it knows about you."; the
  deep-dive `builtWith` drops "specs in and verified milestones out", and "knowledge pack" leaves the page.
  Supersedes D62's copy; D62's `IntroParagraph` shape and link stand. Question for Michael: keep the second
  paragraph, or cut the intro to the first? Reversible: three strings. (Plan § Copy; P3-07 builds.)
- **D94** *default*: the usher follows `concierge.navigate` only while the panel's Guide me switch is on (default
  on, `localStorage` `concierge.guide_me`), only to `isAllowedHref` targets ('/', '/about', '/skills',
  '/experience', '/contact', '/projects/<known slug>', exact match; the slugs and short titles come from
  `layout.tsx` as a prop, so `projects.ts` stays out of the client bundle), at most once per 8 s, never while on `/talk`,
  with the transcript notice "Taking you to <name>". Supersedes nothing (new). Reversible: unregister the topic.
  (Plan § Usher; P3-02 and P3-08 build.)
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
