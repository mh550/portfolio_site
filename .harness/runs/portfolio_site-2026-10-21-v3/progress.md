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
