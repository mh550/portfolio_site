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
