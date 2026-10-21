# Progress log — run portfolio_site-2026-10-21-v3 (branch `harness/portfolio_site-2026-10-21-v3`)

What this file is: the shared memory of this harness run. Every session reads it at startup and adds a short
entry **at the top** (newest first): feature id, what landed, what the next session must know. The feature list is
`feature_list.json` in this directory: array order is priority, `after` lists are the real dependencies (inside a
milestone every feature names the one before it, so a stuck milestone never blocks an independent one), and a
session may flip only its own feature's `passes`. Michael steers through `INBOX.md` on this branch (first line
`status: run|pause|stop`; answers under `## Answers`), but he is asleep for this run: **never park**, take the
spec's default, record it as the next `D<n> *default*` and go on. Plans go in `docs/plans/2026-10-21-<milestone>-<topic>.md`.
New defaults go in a new section at the end of `docs/specs/2026-10-18-portfolio-v2.md`, `## v3 decisions
(2026-10-21, from D75)`, numbered consecutively from **D75** (D1–D49 are the v2 spec, D41–D58 the booth spec,
D59–D74 the voice-concierge page spec § 7; they already collide, so never renumber), each naming what it supersedes.

---

### 2026-10-21 07:20 · P1-04 · passes

`/about` has `<section id="how-i-work" aria-labelledby="how-i-work-heading">` (h2 How I work, `scroll-mt-24`) between the story and Philosophy: `MethodStrip showLines label="The loop" examples=…`, one link per step from the new `loopStepExample(step)` in `approach.ts` (first linkable example of the step's principle → `{ href, text: first sentence }`, throws if none). `MethodStrip` gains an optional `examples` prop (hero passes none, unchanged). New `docs/notes/about-narrative-bullets.md`: 14 sourced bullets, 2 failure stories. Tests: about (+6), MethodStrip (+2), approach lib (+3), a11y-new-pages now covers `/about`: 1141 → 1155 tests, 82 suites. D80 marked built in the v2 spec and plan; CLAUDE.md /about row, MethodStrip line, test count.
Verified: about tests red first (5 failing); `.harness/check.sh` → `check: lint ok · jest ok · build ok`; step-4 jest command 4 suites/123 tests green; smoke exit 0, 42 PASS; Sonnet browser check: `/about#how-i-work` at 390 puts the h2 at top 96 under a 65 px navbar, no horizontal scroll, five steps in one row at 1280, accent focus outline, no console errors; 390 screenshot looked at. Opus review: 2 Important + 5 Minor, all fixed (bullets said "first two overnight runs" for Oct 17 → "first two harness v2 runs"; facts only in § 8 now cite it too; dropped sub-bullets with sources outside the allowed set; a redundant claims test removed).
Next session (P1-05): How I work is ready for the `/approach` redirect target. Note: full-page smoke screenshots don't trigger ScrollReveal, so sections below the fold look empty in them; scroll the section into view to look at it. Next free decision: **D81**.
Question for Michael: the Covid/Colorado detour in the current story has no note under docs/notes/, so the bullets leave it out; it stays on the page. Keep it in the rewrite?
Proposed change: at md+ the five columns in `max-w-3xl` are ~131 px wide, so the longer link texts wrap to ~6 lines of 12 px; P6's design notes could consider a wider section or a stacked layout.

### 2026-10-21 06:30 · P1-03 · passes

`scripts/logos.mjs` (`npm run logos`) writes `src/components/logos/paths.ts` (`logoPaths`, 12 keys, `LogoKey`; header: simple-icons 16.9.0, CC0, brand guidelines apply); `Logo.tsx` (title or `decorative`); `FloatingLogos` reads `logoPaths` in four columns outside the text column (plan § Logos); `pipedreamPath` and `public/pipedream.svg` gone; `simple-icons` moved to devDependencies at exactly 16.9.0. New `.harness/logos-check.mjs`. Tests: paths.test, Logo.test (new), FloatingLogos.test (12 names, none of the dropped six): 1122 → 1141 tests, 80 → 82 suites. CLAUDE.md Commands/Components/Code rules, D78 marked as built in the spec and plan.
Content guard: siPostgresql's path contains `1.582.553.9942` (compact SVG for 1.582 .553 .9942), which matched the US phone pattern. Fixed the content, not the guard: the generator adds separating spaces only in paths that trip the pattern (same 976 tokens, checked by tokenizing both) and throws if a path still trips it. Only postgresql is respaced.
Verified: tests red first; `.harness/check.sh` → `check: lint ok · jest ok · build ok`; `npm run logos` twice → `git diff` on src/components/logos clean; `npm ls simple-icons` 16.9.0; `grep "from 'simple-icons'" src` empty; `node .harness/logos-check.mjs` → logos: 12, overlaps: 0 at 1280×720/800/900 (hero text, navbar, VoiceWidget); smoke exit 0, 42 PASS; 1280 home screenshot looked at. Opus review of the diff: no findings.
Next session (P1-04): next free decision **D81**. No new questions.
Proposed change (repeat of P1-01's): step 3's "path starting with 'M'" is tested as `/^[Mm]/` (siClaude starts with `m`).

### 2026-10-21 05:45 · P1-02 · passes

`profile.ts`: positioning "Agentic Systems Engineer", v3 subline (tagline unchanged). `approach.ts`: `LoopStepId`, `LoopStep`, `loopSteps` (five rows verbatim from v3 spec § 2, principles per plan); `aboutIntro[1]` = "I work the way my harness runs: Spec, Context, Build, Verify, Learn."; `methodSteps` untouched. `MethodStrip` maps `loopSteps`. Tests updated/added in profile, vcard, vcf-route, layout-metadata, card, HeroSection, MethodStrip, home, about, approach (lib + page's strip loop now reads `loopSteps`): 1111 → 1122 tests, 80 suites. brand.md § Positioning has a `### v3` subsection (10-18 kept as history); D76/D77 marked as built in the v2 spec and plan; CLAUDE.md MethodStrip line.
Verified: tests red first (11 suites failing), then `.harness/check.sh` green (lint · jest · build); smoke exit 0, 42 PASS; case-study-anchors + case-study suites 35 pass, unedited; 390 px home and about screenshots read the new strings and loop; `grep -rni 'Systems & Process\|I find where work breaks' src public` → nothing.
Next session (P1-03): the old logos still overlap the strip at 1280 (pipedream next to the buttons, the lightning bolt left of Spec); the loop lines made the strip ~82 px tall as planned, so measure with the new tree. `approachIntro` stays until P1-05 (the /approach page reads it). Next free decision: **D81**. No new questions.

### 2026-10-21 05:10 · P1-01 · passes

Wrote `docs/plans/2026-10-21-P1-angle.md` (Positioning table of 10 files before/after, Loop strip type + five rows + step→principle links resolved on this tree, 12 logos with export names, generator, header and 12 positions measured at 1280×720/800/900, About, Approach fold, Site-wide strings, Tests table per feature, empty What Michael will see / Review tables, Decisions) and recorded **D76–D80** *default* in the v2 spec § v3 decisions. Docs only: 1111 tests / 80 suites, unchanged.
Verified: `.harness/check.sh` → `check: lint ok · jest ok · build ok`; smoke exit 0 at start; Opus review of the plan: 2 Important, 4 Minor and 2 Nit findings, fixed in the plan except Important #2 (below).
Next session (P1-02): `approach.test.tsx`'s method-label loop must switch to `loopSteps` in P1-02 (the /approach page lives until P1-05) or the suite goes red; about.test's intro assertion is P1-02's. Next free decision: **D81**.
Question for Michael: Spec and Context both link to `/projects/agent-harness#decisions` under the specified rule (different link texts). Keep that, or give Context a different principle?
Proposed change: P1-03 step 3 says each logo path starts with 'M'; `siClaude.path` starts with a lowercase `m` (valid relative moveto). Please read that step as `/^[Mm]/`.

### 2026-10-21 04:00 · verify P0

| Feature | Step | What you ran or read | What you saw | Holds |
|---|---|---|---|---|
| P0-01 | 1 | `git ls-files` on booth paths; `grep booth-bundle package.json`; `grep booth|/b/h.tgz CLAUDE.md`; `grep suites CLAUDE.md` | all empty; CLAUDE.md line 40 says 80 suites (test count 1115 there vs 1111 actual, not a step) | yes |
| P0-01 | 2 | `head -1` on the three booth spec/plan files | each starts 'Removed 2026-10-21 (P0-01): …' | yes |
| P0-01 | 3 | grep profile.ts; `npx jest card.test.tsx components/card`; read card.test.tsx:139 | `conferenceNote: ''`; 3 suites/37 tests pass; line 139 asserts queryByText(/Glad we met/) not in document | yes |
| P0-01 | 4 | diffed projects.ts excerpt vs driver.sh lines 204–220; jest case-study-agent-harness; grep Corrections | verbatim, 17 lines, ends `|| return 3`; suite passes, none skipped; dated 2026-10-21 Corrections line present | yes |
| P0-01 | 5 | tail of v2 spec; grep '^## v3 decisions' | section at line 444, first entry D75 *default*, names D50 and D39, reversible via git revert | yes |
| P0-01 | 6 | `.harness/check.sh`; `npx jest`; `node .harness/smoke.mjs` (twice) | 'check: lint ok · jest ok · build ok'; 80 suites/1111 tests pass; smoke exit 0, no FAIL lines | yes |

### 2026-10-21 03:00 · P0-01 · passes

Removed the booth (public/b, build script, its test, booth-bundle.md, npm script, CLAUDE.md route/command rows); added "Removed" lines to the three booth spec/plan files. `profile.conferenceNote` is now `''`; card.test asserts "Glad we met" is absent. Re-copied `merge_one` (17 lines) into the agent-harness excerpt, plus a Corrections line. Recorded D75 *default* in a new v3 section of the v2 spec.
Verified: `lib/check.sh` green; jest 81 → 80 suites, 1117 → 1111 tests, 0 failing; case-study-agent-harness 18 passed, none skipped; smoke passes every route.
Next session: D76 is the next free decision number. No questions.

### 2026-10-21 02:30 · initializer

**Scope.** `docs/specs/2026-10-21-portfolio-v3.md` in its § 12 order, per Michael's brief (`brief.md`): P0 cleanup,
P1 angle, P2 experience, P3 concierge in the site, P4 contact, P5 skills graph, P6 design recommendations (docs).
Build-only: never deploy, never touch the LiveKit env (a dummy env on the local dev server is fine), never push
`main`. The agent half (contract v2, spec § 7) is being built in parallel in `mh550/voice-concierge`: the page must
accept v1 and v2 bodies and treat every v2 field as optional.

**Features: 37.** P0 1 · P1 8 · P2 4 · P3 10 · P4 3 · P5 7 · P6 4. First three: P0-01, P1-01, P1-02.
Dependencies as § 12 says: P1 after P0; P2, P3, P4 and P5 each after P1 only; P6 after nothing (its three docs
features carry `after: []`, so they run whenever the queue ahead is blocked, and last otherwise). Earlier runs of
this project did 10–15 features in 2–3.4 h at $2–3.5 each (`~/projects/agent-harness/ledger/runs.jsonl`), so this
list is about 8–9 h.

**The suite is RED at the start of this run**, and P0-01 fixes it: `src/__tests__/lib/case-study-agent-harness.test.ts`
compares the agent-harness page's code excerpt with `/home/mh550/projects/agent-harness/lib/driver.sh`, and
`merge_one` there changed (its conflict branch now writes `$STATE/conflict-$m` and calls `needs_you`). Re-copy the
block from the comment line `# Merge one verified milestone` through the line ending `|| return 3` (lines 204–220
today, at most 25 lines) into `codeSnippets[0].code` of the agent-harness entry in `src/lib/data/projects.ts`.
Baseline: 81 suites / 1117 tests (1 failing); after P0-01 (booth test deleted): 80 suites.

**Where things live (read CLAUDE.md first; this is what it does not say yet).**
- Positioning: `profile.ts` (`positioning`, `subline`) feeds `layout.tsx`'s `<title>`, `HeroSection` eyebrow,
  `/card`, `/card/qr`, `vcard.ts` (`TITLE:`), the OG image. Tests that pin the old strings: `profile.test.ts`,
  `vcard.test.ts`, `vcf-route.test.ts`, `layout-metadata.test.ts`, `card.test.tsx`, `HeroSection.test.tsx`,
  `MethodStrip.test.tsx`, `home.test.tsx`, `about.test.tsx`, `approach*.test.ts(x)`, `competencies-links.test.ts`,
  and the snapshot `src/__tests__/app/__snapshots__/project-page-unchanged.test.tsx.snap`.
- The method: `approach.ts` has `methodSteps` (Diagnose…Simplify; the case studies' section ids, `MethodStepId`,
  `getCaseStudyAnchors` in `projects.ts`, `/evidence`) and `aboutIntro`. P1 adds `loopSteps` (Spec, Context, Build,
  Verify, Learn) **next to** it; `MethodStrip` (hero and the new `/about#how-i-work`) reads `loopSteps`; the
  case-study `MethodSteps` component keeps `methodSteps`. `approach.ts` imports `projects.ts` and vice versa: use
  them only inside functions, never at module load.
- `/approach` references: `Navbar.tsx`, `sitemap.ts`, `.harness/smoke-routes.txt`, CLAUDE.md, tests
  `Navbar.test.tsx`, `approach.test.tsx` (delete), `a11y-new-pages.test.tsx` (imports the page), `sitemap-robots.test.ts`,
  `competencies-links.test.ts` (ROUTES), `claims-on-linked-page.test.ts` (reads the data only; keeps working).
  `principles`, `resolvedExamples`, `exampleHref` stay: `/evidence` and `claims-on-linked-page` use them.
- Logos: `simple-icons` is **already a runtime dependency** (`^16.9.0`, imported directly by `FloatingLogos.tsx`
  since the original site). P1-03 moves it to devDependencies at exactly `16.9.0` and generates
  `src/components/logos/paths.ts` with `scripts/logos.mjs`. Installed 16.9.0 has siClaude, siLivekit, siPython,
  siTypescript, siGnubash, siSqlite, siPostgresql, siDocker, siLinux, siNextdotjs, siN8n, siGithub, siReact,
  siNodedotjs, siVercel, siTailscale, siSupabase, siOpenjdk, siCplusplus, siLinear, siZapier, siTailwindcss, siAnthropic;
  **no siLinkedin and no siPipedream** (simple-icons dropped LinkedIn). P4 draws the LinkedIn glyph by hand
  (`src/components/logos/extra.ts`) and records a D. Check a key with
  `node -e "console.log(!!require('simple-icons').siX)"` before using it.
- Experience: `experience.ts` has `roles: Role[]` (bullets are plain strings) and `education`; `experience.test.tsx`
  (14 tests) pins the current bullets. The resume v4 text is only in the v3 spec § 8: copy from there, never add the
  phone number (the content guard and brand.md forbid it).
- Concierge today: `TalkSession.tsx` (~480 lines, `'use client'`) owns the Room, the reducer (`sessionReducer.ts`,
  phases idle/connecting/waiting/live/ended/offline/busy), the three text-stream handlers registered before
  `connect()`, the mic (asked for only once the agent joins, D65), Forget me (RPC) and `MessageBox` (lk.chat). It is
  rendered by `src/app/talk/page.tsx` with `configured={conciergeEnv() !== null}`; `env.ts` and `rooms.ts` import
  `server-only`, so **a client file importing them fails `next build`**: P3-03 passes `configured` from
  `layout.tsx` (a Server Component) into `SiteChrome` as a prop. LiveKit loads on Connect (`import('livekit-client')`
  in the click handler, D45) and `RoomAudio` via `next/dynamic`; keep both out of the first load.
- Jest LiveKit: `src/__mocks__/livekit-client.ts` exports `Room` (= `MockRoom`, `Room.setup` hook, `Room.instances`),
  `lastRoom()`, `resetRooms()`, `pushText(room, topic, text, identity?)`, `addAgent(room, identity)`, `restart(room)`,
  `removeParticipant(room, identity)`, `RoomEvent`, `ConnectionState`, `ParticipantKind`; `@livekit/components-react`
  is mocked too. Under fake timers click with `fireEvent` and flush inside one `act` (see `TalkSession.test.tsx`).
  92 tests across `TalkSession*.test.tsx` render `<TalkSession>` directly: P3-03 gives them a provider wrapper
  helper (`src/__tests__/helpers/concierge.tsx`) rather than rewriting them.
- `SiteChrome.tsx` returns bare children on `/card*`; everything else (skip link, Navbar, `#content`, Footer,
  VoiceWidget except on `/talk`) renders inside it, so the `ConciergeProvider` goes there. The Navbar is `z-50`, the
  widget `z-40`; the Footer has `pb-24 xl:pb-8` to clear the widget (D61).
- Design tokens: `globals.css` `@theme inline` (`--color-background #0a0a0f`, `--color-surface #12121a`,
  `--color-accent #00d4ff`, `--color-muted #8888a0`). P3-06 adds the six `--color-mem-*` tokens there; a11y-new-pages
  has a contrast-ratio helper worth reusing. One `@media print` block at the end (pinned by `print-styles.test.ts`).
- Skills today: `skills.ts` = `skillCategories` (four groups, `process` featured, D20) read by `/skills` and
  `skills.test.tsx`; check `data.test.ts` before deleting the export.
- Contact today: `src/app/contact/page.tsx` has a subheader, three stacked cards and a closing note; the spec cuts
  the subheader and the note and makes three equal tiles in one screen.

**Harness gotchas.**
- Dev server: `.harness/init.sh` starts `next dev` on `$HARNESS_PORT`; `node .harness/smoke.mjs` loads every route at
  1280 and 390 (screenshots to `$HARNESS_SCRATCH`). If smoke suddenly returns 500 on every route after an HMR
  recompile, kill the server, move `.next` aside and rerun `init.sh` (seen on 2026-10-20 with a Tailwind
  `env(safe-area-inset-bottom)` arbitrary value).
- `.harness/check.sh` builds into `.next-check`; about 1 min. `playwright-cli` is not installed: Playwright lives in
  `/tmp/harness/pw` (see `smoke.mjs`'s `createRequire`); write one-off checks the way `talk-busy-check.mjs` does.
- Dummy env for concierge checks (P3-07, P3-09): restart the harness server with `LIVEKIT_URL=wss://livekit.invalid`
  and any key and secret, fulfil every token POST with `page.route`, then run `.harness/init.sh` again to restore the
  plain server. Nothing reaches LiveKit.
- Screenshots go to `docs/screenshots/v3/<milestone>-<page>-<width>.png`, under 400 KB each (reduce with PIL
  `quantize(16)` if needed, as `print-check.mjs`'s header describes), and every check feature lists them in its plan's
  "What Michael will see" table.
- Reviews read the milestone diff from a file: `git diff $(git log -1 --format=%H --grep='HARNESS: after <last id of
  the previous milestone>')..HEAD -- . ':!docs/screenshots' > $HARNESS_SCRATCH/<M>.diff`. Milestones can land out of
  order on this branch (P6 may run early), so if the range picks up another milestone's files, narrow it with paths.
- `docs/review-guide.md` gets a `## <M> (v3)` section per milestone (the review feature writes it); the voice-concierge
  evidence note's § Sentences with digits must list every new sentence with a digit on the deep-dive.
- Models: Opus for plans, builds, checks and reviews; Sonnet for P0-01 (mechanical) and P6-04 (URL and number
  verification). P6-01..03 are design work with research, not plain docs, so they run on Opus.

**Decisions this run makes for Michael (all the spec's defaults, recorded from D75; reversible).**
1. Positioning 'Agentic Systems Engineer' and the new subline (spec § 2); the tagline stays.
2. The loop strip's one example link per step uses a fixed step→principle mapping (P1-01 proposes spec→decisions-explicit,
   context→automate-bookkeeping, build→simplify-after-use, verify→verify-what-the-human-sees, learn→fakes-mirror-reality).
3. `/approach` → 308 to `/about#how-i-work`; after P1 the Navbar has seven links, after P3-05 six (Home, About, Skills,
   Projects, Experience, Contact): the spec's "seven" counted Approach.
4. Tahoma Films and the snowboard coaching stay as a one-line "Earlier" list on `/experience`.
5. The LinkedIn glyph on `/contact` is hand-drawn (simple-icons has none); simple-icons becomes a devDependency.
6. The widget stays on `/evidence` (D61's open question, unchanged).
7. The P3 check cannot capture a live call (no agent offline): the live state is covered by Jest only.
8. P5 uses a hand layout, no `d3-force`, unless the plan proves 390 px cannot fit (then record the pin).

**Questions for Michael (nothing waits on them).** Do you want the loop-step example links as mapped in 2? Is the
Navbar at six links right, or should Talk come back once the pill exists? Should `/evidence` lose the widget?
