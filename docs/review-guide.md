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
