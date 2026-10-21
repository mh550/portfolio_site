# Review guide

For Michael. One PR per verified milestone, each branch cut from the one before it (`harness-merge/v2-2026-10-18-M0`
… `-M8`), so **merge in order and the diffs stay small**. Open each PR's Vercel preview on your phone (390 px wide)
and look at the pages named below. The full-page screenshots the harness took are in `docs/screenshots/v2/`; each
milestone's plan (`docs/plans/`) ends in a "What Michael will see" table.

## Merge order

1. **M1 first** (`/card`, before Monday). Its branch contains M0 (guardrails, `profile.ts`, content guard, `order`
   on projects, `methodSteps`) and the harness setup, so merging M1 also ships M0 and the harness setup.
2. M2 (positioning), M3 (case-study template), M4 (agent harness), M5 (home media server), M6 (HitList), M7
   (approach and evidence), M8 (navigation and polish), in that order. M4–M7 each need only M3, so if one looks
   wrong, merge the others and leave it.
3. The last PR also carries M9 (these docs).

Nothing here deploys until you merge into `main`. Pushing `main` deploys production.

## Per milestone

### M0: guardrails (ships with M1)
- Changed: `src/lib/data/profile.ts` is the one source for name, email, links; a jest content guard fails the build
  on tailnet hostnames, private IPs, phone numbers, TODOs and tokens; every project has an `order`.
- Look at: nothing visible. Run `npm test` if you want to see the guard.

### M1: `/card` (`docs/plans/2026-10-18-M1-card.md`)
- Changed: `/card` (no navbar or footer), `/card/qr` (black on white, for printing or showing), `/michael-herron.vcf`.
- Look at (phone): `/card` fits one screen without scrolling the buttons off; "Save contact" opens the Contacts
  card on an iPhone; the QR on `/card/qr` scans from another phone and lands on `/card?src=qr`; top projects listed.

### M2: positioning (`…-M2-positioning.md`)
- Changed: metadata and Open Graph, hero text and the five-step method strip, home sections, experience, about, skills.
- Look at: the hero fold at 390 (both buttons visible); the method strip shows labels only; copy sounds like you.

### M3: case-study template (`…-M3-case-study-template.md`)
- Changed: components for decision log, iterations, lessons and links; `ProjectDetail`. Existing project pages
  render as before.
- Look at: any old project page (e.g. `/projects/ghl-jobtread-integration`) looks unchanged.

### M4: agent harness (`…-M4-agent-harness.md`)
- Changed: `/projects/agent-harness` case study, two diagrams, code excerpt (compared with the harness repo in a test).
- Look at: the numbers in the metric strip, the diagrams stacked at 390, the code block scrolling inside itself.

### M5: home media server (`…-M5-home-media-server.md`)
- Changed: `/projects/home-media-server` case study, diagram, three fake-data phone screenshots.
- Look at: screenshots uncropped, three across from tablet width, one column on the phone; no hostnames or paths.

### M6: HitList (`…-M6-hit-list.md`)
- Changed: `/projects/hit-list` case study with two diagrams; ends "specified, not yet built". No media yet.
- Look at: that the status claims are true. Capture the phone shots from `docs/asset-checklist.md`.

### M7: `/approach` and `/evidence` (`…-M7-approach-evidence.md`)
- Changed: `/approach` (six principles, each linking to evidence), `/evidence` (noindex, not in the navbar).
- Look at: every link on both pages goes where its label says; the arrow after "merge" stays on the line.

### M8: navigation and polish (`…-M8-polish.md`)
- Changed: Approach link in the navbar, `/projects` sorted by `order`, `sitemap.xml` and `robots.txt`, a
  web-interface-guidelines pass (focus rings, contrast, reduced motion, dark colour scheme).
- Look at: tab through a page and see the outline; `/sitemap.xml` has no `/evidence` or `/card/qr`.
  Open question there: D36 (keep `Disallow` next to `noindex`?).

### M9: hand-off docs
- Changed: `docs/asset-checklist.md`, this file, `CLAUDE.md`, `README.md`. No code.

## VC1–VC3: Voice Concierge

Run `portfolio_site-2026-10-20`, spec `docs/specs/2026-10-19-voice-concierge-page.md`. One PR per milestone
(`harness-merge/portfolio_site-2026-10-20-VC1`, then `-VC2`, `-VC3`), each cut from the one before.

### Merge order
1. **VC1** (PR #14): the three LiveKit packages at exact pins (D41) and `POST /api/concierge/token`. Without the
   `LIVEKIT_*` env vars it answers 503 `{offline:true}`, so merging it changes nothing a visitor sees.
2. **VC2**: `/talk` (`docs/plans/2026-10-20-VC2-talk-page.md`). In the sitemap, not in the Navbar (D44; VC4 adds it, D60).
3. **VC3**: the `/projects/voice-concierge` deep-dive and diagram, and the `/card` link to `/talk`. Until VC3 is
   merged, the offline state's "Read how it works" link is a 404.

### Look at on the preview (390 px)
- `/talk` before Connect: the h1, the two intro lines and **Connect** above the fold; the privacy note below the
  panels; no sideways scroll. Captures: `docs/screenshots/v2/VC2-talk-390.png`, `-1280.png`.
- Press **Connect** with no env set: "The concierge is offline right now" and "Read how it works", both above the
  fold (`VC2-talk-offline-390.png`). The one console line is the browser's own 503 for the token POST.
- Tab from the top: Skip link, MH, menu, Connect, each with the cyan outline.

### VC3: the deep-dive and `/card` (`docs/plans/2026-10-20-VC3-voice-concierge-deep-dive.md`)
- Changed: a tenth project, `/projects/voice-concierge` (order 5 in VC3, D47; VC4 moved it to order 2, D59, so the
  top 3 on `/card` and home is now agent-harness, voice-concierge, ghl-jobtread-integration): problem, the five method lines, six decisions (one per memory practice), an honest
  outcome and links to `/talk` and the public agent repo, plus the architecture diagram (three panels: your
  browser and this site, LiveKit Cloud, your home box). `/card` gains a full-width "Talk to my concierge" button
  under LinkedIn · Email · GitHub (D48); the Navbar was unchanged in VC3 (D49; VC4 adds Talk, D60). Fact-check, review and design pass: the
  plan's § Fact-check, § Review and § Design pass tables.
- Look at (390): `/projects/voice-concierge`: the diagram stacks top to bottom with down arrows, no sideways
  scroll; the copy reads as a design being built, not a measured product. `/card`: the new button shows without
  scrolling (it ends at 496 px of 844). Captures: `VC3-voice-concierge-390.png`, `-1280.png`, `VC3-card-390.png`.
- Numbers: the page has none, on purpose. After real sessions, `docs/notes/voice-concierge-todo.md` says where they
  go (the evidence brief first, then `metrics` on the entry, four at most).
- Answered: the order changed in VC4 (D59, Michael's answer): agent-harness, voice-concierge,
  ghl-jobtread-integration, ringcentral-jobtread-integration, then home-media-server, linear-ai-workflow, hit-list,
  paint-estimator, mirrored-google-calendars, cherished. New top 3: agent-harness, voice-concierge,
  ghl-jobtread-integration.

### Morning: the live check (Michael)
The harness never runs this (build-only policy); every check it ran saw the offline state. Start the worker first,
per the agent repo's `MORNING.md` (`mh550/voice-concierge`).
1. In the Vercel project settings → Environment Variables, add `LIVEKIT_URL`, `LIVEKIT_API_KEY` and
   `LIVEKIT_API_SECRET` for **Preview** and **Production**. They stay server-only: no `NEXT_PUBLIC_` prefix.
2. Redeploy the VC2 (or VC3) preview so the route reads them and `/talk`, which is prerendered, is rebuilt knowing
   they are set (D46: without them Connect goes offline without calling the route). `/talk` → Connect should go Connecting → Waiting →
   Connected within 10 s, and the browser asks for the microphone once the concierge has joined (not before: since
   VC5-02 nothing asks for it while Waiting, and the Mute button appears only once Connected, D65).
3. Say your name and what you are working on. The transcript shows both sides, and "What it remembers" fills in
   with each fact, its channel and its source.
4. **Leave**, then **Connect** again: expect the greeting by name and "visit 2" in the memory panel.
5. Type a line in the message box and press Send: it shows as yours in the transcript and the concierge answers it.
6. **Forget me** → **Erase**: "Forgotten", the memory panel empties and the call ends with a short goodbye.
   Connect again: it greets you as a stranger (visit 1, nothing remembered).
7. The latency panel: "Memory on the turn path" near 0 ms on every turn (memory is read before the call, not on
   the turn); "Prompt tokens from cache" above 0 % from the second turn on; "Memory preload at connect" shown once.
   A null field shows "–": that's the agent not reporting it, not a page bug.

If something fails: the page is offline (no agent joined) → check that the worker is running and not killed (no
microphone prompt is expected then); a second microphone prompt or no sound → press "Turn on sound"; anything else, note the step and the console.

**Undo:** remove the three env vars in Vercel and redeploy: the token route answers 503 and `/talk` shows the
offline state again. Or leave the env and turn on the worker's kill switch (agent repo `MORNING.md`): the worker
declines the job, no agent joins, and the page shows the same offline state after 10 s.

## VC4: order, Navbar, widget

Run `portfolio_site-2026-10-20-vc4`, spec `docs/specs/2026-10-20-vc4-order-widget-limits.md`, plan
`docs/plans/2026-10-20-VC4-order-widget-nav.md` (its § Review is the Opus review table). Merge after VC3 and B2.

- Changed: the project `order` (D59: agent-harness, voice-concierge, ghl-jobtread-integration,
  ringcentral-jobtread-integration, then the rest), so home's Recent work and `/card`'s Selected work show those
  first three; **Talk** in the Navbar between Projects and Approach (D60, eight links); a floating 56 px cyan disc
  with a mic, bottom right, that links to `/talk` on every chrome page but `/talk` itself and `/card*` (D61; it
  pulses twice on load, not at all under reduced motion, and is hidden in print; the Footer gains bottom padding
  below `xl` so its links clear it); the `/talk` intro now reads "built with my agent harness", the words linking
  `/projects/agent-harness`, and the voice-concierge deep-dive credits the harness (D62).
- Look at (390): `/`: the disc bottom right, clear of the content and, scrolled to the bottom, of the footer links;
  open the menu: eight links, Talk fifth, nothing wraps; `/card`: the three cards are agent-harness,
  voice-concierge, ghl-jobtread-integration, and no disc; `/talk`: no disc, "my agent harness" is an underlined cyan
  link to the harness case study.
- Captures: `docs/screenshots/v2/VC4-home-390.png`, `VC4-home-1280.png`, `VC4-about-footer-390.png`,
  `VC4-card-390.png`, `VC4-menu-390.png`, `VC4-talk-390.png`.
- **Undo**, one piece at a time: the order is the `order:` values in `src/lib/data/projects.ts` (the plan's § Order
  table has the before column); the Navbar is the one `{ href: '/talk', label: 'Talk' }` entry in `links` in
  `src/components/Navbar.tsx`; the widget is the one `{pathname !== talkWidget.href && <VoiceWidget />}` line in
  `src/components/SiteChrome.tsx` (then the Footer's `pb-24 xl:pb-8` can go back to `py-8`); the intro is
  `talkPage.intro[0]` in `src/lib/data/concierge.ts`. Each has tests that pin it, so expect those to go red with it.

## VC5: mic timing and cost protection

Same run and spec as VC4, plan `docs/plans/2026-10-20-VC5-mic-limits-server-only.md` (its § Review is the Opus
review table, § Live check the full staged check). Merge after VC4. Decisions D63–D73 are in
`docs/specs/2026-10-19-voice-concierge-page.md` § 7.

- Changed: the browser asks for the microphone only once the concierge has joined, and the Mute button shows only
  when Connected (D65). `POST /api/concierge/token` now checks, in this order: the Origin (403 `{error:'forbidden'}`
  unless it is the site, a `portfolio-site-…-mh550s-projects` preview or, in dev, localhost; before the env check,
  D63) → the three `LIVEKIT_*` (503) → the body (400) → LiveKit's live room list (503 if that call fails: fail
  closed) → 429 `{error:'busy', reason:'visitor'}` if your address already has a live room, `reason:'site'` if
  `CONCIERGE_MAX_ROOMS` (default 2) rooms are live → a token for room `concierge-<10 hex of your address's
  HMAC>-<12 random hex>`, a new room per Connect, so two people behind one NAT never share one (D73, which
  supersedes D72's one room per address). No database: the room list is the state. `/talk` shows one line per 429 ("You already have a
  conversation open in another tab." / "The concierge is busy right now. Try again in a few minutes."), keeps
  Connect, and never retries by itself (D66). `server-only` (exact `0.0.1`, D67) guards `env.ts` and `rooms.ts`
  from the client bundle. The deep-dive gained one sentence on how it's protected (the agent's 5 sessions a day and
  10 minutes each, the provider caps), traced in `docs/notes/evidence-voice-concierge.md`.
- Look at (390): `/talk` is unchanged until you press Connect. Captures of the busy and offline replies (stubbed in
  the browser, not from the route): `docs/screenshots/v2/VC5-talk-busy-visitor-390.png`, `VC5-talk-busy-site-390.png`,
  `VC5-talk-busy-visitor-1280.png`, `VC5-talk-offline-503-390.png`.

### The staged live check (Michael)
The harness never runs this (build-only). On the PR preview, in order; stop at the first stage that doesn't match.
`P=<preview URL from the PR's Vercel comment>`.

1. **Origin, before any env is set.**
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
     -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'                                  # expect 403
   curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
     -H 'Origin: https://evil.example' -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'  # expect 403
   curl -s -o /dev/null -w '%{http_code}\n' -X POST $P/api/concierge/token -H 'content-type: application/json' \
     -H "Origin: $P" -d '{"visitor_id":"123e4567-e89b-42d3-a456-426614174000"}'                  # expect 503
   ```
   A 403 on the third means the preview host doesn't match the regex (D64): paste the host into INBOX.
   LiveKit Cloud → Rooms: nothing new (no token was signed).
2. **One visitor, two tabs** (the three `LIVEKIT_*` for **Preview** only, redeploy, start the worker). Tab A:
   Connect → Connected, and only then the microphone prompt. Room list: one `concierge-<10 hex>-<12 hex>` room
   with two participants (you and the agent). Tab B, same browser: Connect → "You already have a conversation
   open in another tab.", Connect still shown, no mic prompt; room list still one room. Tab A: Leave, and count
   the seconds the room stays listed; until it goes, Tab B still gets the another-tab line (D68). If it stays for
   minutes, tell the run (D68's alternative: count only rooms with a `visitor-` participant). Re-run stage 1:
   403, 403, then 200 (a token nobody uses: no room appears) or 429 if a conversation is live. D73's check: while
   Tab A is live, its room name has two hex parts (`concierge-<10 hex>-<12 hex>`), and stage 1's third curl from
   the same network answers 429 `visitor`.
3. **The site cap** (`CONCIERGE_MAX_ROOMS` unset = 2): two conversations live from two addresses (laptop, and a
   phone on cellular); the room list shows two `concierge-` rooms with different 10-hex parts. A third device on
   another network → "The concierge is busy right now. Try again in a few minutes.", no mic prompt; still two
   rooms.
4. **Production**, only after 1–3 hold: the three `LIVEKIT_*` in Production (`CONCIERGE_MAX_ROOMS` only if not 2),
   merge, stage 1's first two curls against `https://michael-herron.vercel.app` (403, 403), one Connect. Room list:
   one new `concierge-` room while it lasts, gone after Leave as fast as in stage 2.

Two things to confirm, not checkable in this run: the agent doesn't parse room names (in `mh550/voice-concierge`,
`grep -rn 'room.name\|room_name' concierge/` must show nothing that splits on `-` or expects
`concierge-<12 hex>`; rooms are now `concierge-<10 hex>-<12 hex>`, D73), and the preview regex matches your current previews (stage 1's third curl).

**Undo**, one piece at a time:
- The site cap too tight or too loose → set `CONCIERGE_MAX_ROOMS` in Vercel (Preview and/or Production) and
  redeploy; delete it to go back to 2.
- A room per Connect (D73) → back to D72's one room per address: `roomNameFor` in `src/lib/concierge/limits.ts`
  returns `` `concierge-${bucket}` `` and `roomsVerdict` matches the name exactly (revert the VC5-03 commit, which
  carries `limits.ts`, its tests and the route-limits test; then the room list shows `concierge-<10 hex>`).
- The route's limits → revert the VC5-04 commit: the VC1 route returns (no Origin check, no room list, room
  `concierge-<12 hex>`); `concierge-token-route-limits.test.ts` goes with it.
- The busy lines → revert the VC5-05 commit (a 429 then reads as offline).
- The mic timing → revert the VC5-02 commit (mic asked on connect again, toggle while Waiting).
- `server-only` → remove the two `import 'server-only'` lines and the dependency.
- Everything off → remove the three `LIVEKIT_*` and redeploy (503, `/talk` offline).

## P0–P1 (v3)

Run `portfolio_site-2026-10-21-v3`, spec `docs/specs/2026-10-21-portfolio-v3.md`, plan `docs/plans/2026-10-21-P1-angle.md`
(its § What Michael will see and § Review are filled in by P1-07 and P1-08). Decisions D75–D81 are in
`docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions.

**Merge note.** P0 (booth removed, D75) and P1 (positioning, loop strip, logos, About intro and How I work, the
approach fold) are on branch `harness/portfolio_site-2026-10-21-v3` in commit order; merge them before P2–P5, which
are cut after P1. Nothing deploys until you merge into `main`.

- Changed (P0-01, D75): the booth is gone: `public/b/` (and `/b/h.tgz`), `scripts/build-booth-bundle.mjs`, its
  test, `docs/notes/booth-bundle.md` and the `booth-bundle` script; `profile.conferenceNote` is `''`, so `/card` has
  no "Glad we met!" line. Undo: `git revert` the P0-01 commit.
- Changed (P1-02, D76, D77): `profile.positioning` is "Agentic Systems Engineer" with the v3 subline (the hero
  eyebrow, `<title>`, `/card`, the vCard `TITLE` and the OG footer read it); the hero strip reads `loopSteps` (Spec,
  Context, Build, Verify, Learn) instead of `methodSteps`, which the case studies keep; `aboutIntro`'s middle
  sentence names the five loop labels. Undo: the two strings in `profile.ts`, `MethodStrip` back to `methodSteps`.
- Changed (P1-03, D78): the hero's twelve logos come from `src/components/logos/paths.ts`, generated by
  `npm run logos` from `simple-icons` 16.9.0 (a devDependency now, no `src` import); `public/pipedream.svg` is
  deleted. `node .harness/logos-check.mjs` prints `overlaps: 0` at 1280.
- Changed (P1-04, D80): `/about` has a How I work section (`#how-i-work`) between the story and Philosophy: the
  loop strip with its lines and one case-study link per step (`loopStepExample`). The sourced bullets for a later
  story rewrite are in `docs/notes/about-narrative-bullets.md`.
- Changed (P1-05, D79): `/approach` is gone as a page. `next.config.ts` `redirects()` answers `/approach` with
  308 `location: /about#how-i-work` (the hash survives, so no `permanentRedirect` stub was needed). The Navbar has
  seven links (Home, About, Skills, Projects, Talk, Experience, Contact); the sitemap and the smoke routes drop
  `/approach`. `principles`, `resolvedExamples` and `exampleHref` stay in `approach.ts` (How I work reads five examples
  through `loopStepExample`; the six principle titles, summaries and other thirteen examples are now on no page, D81);
  `approachIntro` and `approachClosing` are deleted.
- Changed (P1-06): the `/skills` and `/projects` metadata descriptions read the agentic angle;
  `src/__tests__/lib/positioning-strings.test.ts` fails on the old positioning or the 10-18 subline in any text file
  under `src/` or `public/`.
- Changed (P1-07): `.harness/captures.mjs` takes the P1 captures (`docs/screenshots/v3/P1-*.png`, described in the
  plan's § What Michael will see); `.harness/print-check.mjs` skips elements with no computed colour (the `<source>`
  in /about's video).
- Changed (P1-08, review): FloatingLogos draws its marks with `Logo` (each svg has a `<title>`), the stale booth
  lines are out of `.gitignore`, and the decisions D75–D79 supersede carry a "Superseded" line. The review table is
  the plan's § Review.
- Look at (390): open `$P/approach` on the preview: it lands on `/about` scrolled to How I work, and About is the
  highlighted nav link. `curl -sI $P/approach` shows `308` and `location: /about#how-i-work`.

**Undo the redirect.** Delete the `redirects()` entry in `next.config.ts` (then `/approach` is a 404), or bring the
page back with `git revert` of the P1-05 commit: page, test, Navbar link, sitemap and smoke-route entries return
together.

## P2 (v3)

Same run and branch as P0–P1, plan `docs/plans/2026-10-21-P2-experience.md` (§ What Michael will see by P2-03, § Review
by P2-04). Decisions D82–D84 are in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions. Merge after P0–P1.

- Changed (P2-01): `src/lib/data/experience.ts` carries resume v4 (v3 spec § 8) line for line: the MAXX Potential and
  Builder Clarity bullets (three each; titles, companies and periods unchanged), `resumeProjects` (agent harness,
  music server, two bullets each, D84) and the six coursework items. A bullet is a string or `{ text, links }`;
  `components/experience/BulletWithLinks.tsx` turns the four § 3 phrases into links to their deep-dives.
- Changed (P2-02, D82): `/experience` reads h1 · the two roles · Projects (name → deep-dive, `github.com/…` line →
  GitHub in a new tab) · Earlier (Tahoma Films and High Cascade, one line each, no bullets) · Education. `/card` is
  unchanged.
- Changed (P2-03): captures `docs/screenshots/v3/P2-experience-{1280,390}.png`, print check passes.
- Changed (P2-04, review): new-tab links announce "(opens in new tab)" to screen readers; `Role.type` is gone;
  `components/textLink.ts` is the one link class for `/evidence` and `/experience`.
- Look at (390): `$P/experience`. Each of the four phrases ("contractor estimating app", "agentic bug-fix workflow",
  "JobTread ↔ GoHighLevel integration platform", "unified per-job communications log") is underlined and opens its
  case study. Each project name opens its deep-dive, and its repo line opens GitHub in a new tab. Earlier has two plain
  lines. No sideways scroll. Print preview: links underlined, no nav or footer.
- Questions: D83 (six `/evidence` items cite lines the resume dropped: keep, relink or drop?), D84 (add the harness's
  third bullet, "189 features passed in 4 days at ~$3 each"? `–` in the project periods?).

**Undo.** `git revert` the P2 commits (P2-01 … P2-04, newest first). The data, page, component and tests come back
together; `/experience` returns to the four M2-03 roles. To drop only the Earlier list (D82), delete `earlierRoles`
and its section.

## P3 (v3)

Same run and branch as P0–P2, plan `docs/plans/2026-10-21-P3-concierge-in-site.md` (§ What Michael will see by P3-09,
§ Review by P3-10). Decisions D85–D96 are in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions. Merge after P2.
The site accepts contract v1 and v2 bodies (D95), so it can merge before or after the agent's v2 in
`mh550/voice-concierge`; the six-kind memory view and Guide me need the v2 agent.

- Changed (P3-02, D95): `contract.ts` reads contract v2 (`about_visitor`, `about_agent`, `retention_days`, the
  `concierge.navigate` topic); a v1 body parses as before. `memoryCache.ts` keeps the last body per visitor id.
- Changed (P3-03, D85): the call lives in `ConciergeProvider` above every chrome page (not `/card*`), so it keeps
  going across client navigations; `/talk`'s `TalkSession` is markup over `useConcierge()` (471 → 29 lines after P3-10).
- Changed (P3-04, P3-05, D86–D89): the "Ask my site" pill on every chrome page but `/talk` opens a non-modal drawer
  (420 px right at `lg`, a bottom sheet below); a first-visit callout above it; Talk is off the Navbar (six links).
- Changed (P3-06, D90): the memory strip (five chips with counts) and the Memory · Latency · Privacy tabs, in the
  drawer and on `/talk`; Forget me is always on the Memory tab, disabled before a call.
- Changed (P3-07, D91–D93, D96): before a call the drawer shows the last memory greyed with "as of" (gone after
  `retention_days` or Forget me); a 429 for your own earlier room retries for 60 s ("Closing your earlier
  conversation…"); the intro and deep-dive copy lose "specs in, verified milestones out" and "pack".
- Changed (P3-08, D94): with Guide me on (the switch in the drawer's header) the agent can open one of the five
  pages or a project page, at most every 8 s, never from `/talk`, and the transcript says "Taking you to <name>".
- Changed (P3-09, P3-10): `.harness/concierge-check.mjs` and nine captures `docs/screenshots/v3/P3-*.png`; the review
  table is the plan's § Review.

**Morning check (a real call, on the branch's Vercel preview `$P`).** It needs the `LIVEKIT_*` env on the Preview
environment and the agent running (v2 for steps 4–5); the harness never touched either.

1. Open `$P/projects` in a fresh private window at phone width. The callout "This site talks…" sits above the pill;
   Close it. Reload: it stays gone.
2. Tap the pill: the drawer opens with its title focused. Connect, allow the mic. The status reads "Connected. Say
   hello, or type below." and the pill (behind the drawer) shows a dot.
3. Say your name. The transcript shows both sides; the strip's Profile count goes up once (it pulses); the Memory tab
   shows it under About you, with its source.
4. Ask "show me the agent harness". With Guide me on, the page changes to `/projects/agent-harness` and the transcript
   reads "Taking you to …"; the call keeps going. Turn Guide me off and ask again: the page stays.
5. Minimize, open About from the Navbar, tap the pill: the same call and transcript. Memory tab → Forget me → Erase:
   "Forgotten", the call ends, and after a reload the drawer shows no cached memory.
6. Desktop width: the drawer is a 420 px column on the right; Esc closes it and focus lands on the pill.

**What to look at.** At 390 the bottom sheet covers the page, so a Guide me follow is visible only as the notice
(D94 question). On a shared network a second visitor may see "Closing your earlier conversation…" (D92 question). The
cached memory shows to anyone on the same browser before Connect (D96 question).

**Undo.** Everything is client-side and env-free: `git revert` the P3 commits newest first (P3-10 … P3-02); the
`/talk` page from VC2 comes back whole with them. To keep the provider and only drop a part: Guide me off by default is
`readGuideMe()` returning true only for a stored `'on'` (`ConciergeProvider.tsx`, and `useState(false)` for it); the callout goes by deleting `<Callout />`
in `SiteChrome.tsx`; the cached memory by not calling `loadMemory` in the provider. Turning the concierge off entirely
needs no deploy of code: remove the `LIVEKIT_*` env from the environment and the pill's Connect reads offline.
