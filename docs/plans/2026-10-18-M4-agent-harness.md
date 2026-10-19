# M4 plan: case study, the agent harness (2026-10-18)

For the M4 build sessions (M4-02 … M4-05). Spec: `docs/specs/2026-10-18-portfolio-v2.md` § M4, decisions D10, D12,
D16, D17, D27. Template: `docs/plans/2026-10-18-M3-case-study-template.md` § Components (props and authoring rules;
M4 authors data against it and changes no component). Sources: `docs/notes/evidence-agent-harness.md` (the brief) and,
read-only, `/home/mh550/projects/agent-harness/` (`journal/decisions.md`, `journal/evidence/timeline.md`,
`journal/runs/2026-10-17-evaluation.md`, `journal/iterations/`, `ledger/`, `lib/`). Never `journal/raw/`.

Build order: M4-02 (the entry + its tests) → M4-03 (two diagrams) → M4-04 (screenshots) → M4-05 (review).

**Copy below is final.** M4-02 pastes it into `src/lib/data/projects.ts` as written. Every string carries its own
punctuation (the template adds none). Changing a number means changing the Traceability table first.

## The project entry, field by field

| Field | Value |
|---|---|
| `slug` | `'agent-harness'` |
| `title` | `'Agent Harness: overnight software delivery with verification gates'` |
| `company` | `'Personal · open source'` |
| `shortDescription` | `'A driver that runs coding agents overnight, one fresh session per feature, and merges only work an independent session has verified.'` |
| `categories` | `['systems', 'process', 'ai']` |
| `techStack` | `['Bash', 'Node.js', 'Git', 'tmux', 'jq', 'GitHub CLI', 'Claude Code']` (brief line 44, the harness's dependencies) |
| `githubUrl` | `'https://github.com/mh550/agent-harness'` |
| `demoUrl` | not set |
| `featured` | `true` |
| `order` | `1` (D12) |
| `thumbnail`, `detail.media` | not set (D11: no fake screenshots; the shots to capture later are already listed in the brief's "Demo material") |
| `detail.architectureDiagram` | `'agent-harness'` (M4-03) |
| `caseStudy.extraDiagrams` | `['harness-evolution']` (M4-03) |

Place the entry **first** in the `projects` array (it is order 1; the array order is not used for display, but a
reader of the file should meet the flagship first).

### Metrics (exactly 4; the values are what M4-02's digit-run test checks)

```ts
metrics: [
  { value: '55', label: 'features passing in one day' },
  { value: '52', label: 'verified and merged, 12 PRs' },
  { value: '+374', label: 'tests added' },
  { value: '≈ $2.53', label: 'per passing feature' },
],
```

"One day" is Oct 17: two runs started overnight on v2 and finished on v3 that day (the Outcome says so; the brief's
"first v3 night" was corrected in M4-01, see Traceability). Keep the values short: the metric strip is one column
at 390 and a value must not wrap mid-number.

### detail (D16)

- `problem`: `'I have about 10 hours a week and several personal projects. I wanted coding agents to build overnight while I slept, and to steer them from my phone. Every approach that lived inside one session hit one of three walls: the model\'s context limit, my plan\'s usage limit, or the auto-mode permission classifier.'`
- `approach` (not rendered, one sentence): `'A fresh agent session per feature with its state on disk, a deterministic driver for the bookkeeping, and independent verification before anything merges.'`
- `challenges` (not rendered, one sentence): `'Usage limits, the permission classifier and thin verification each broke something before they became rules.'`
- `outcome`: `'On Oct 17 the harness ran two projects, starting overnight on v2 and finishing on v3 that day: 71 features planned, 55 passing, 52 verified and merged through 12 PRs, and 374 tests added (1,242 → 1,616). It cost $139.34 in total, about $2.53 per passing feature, across 127 sessions and 13.9 hours of run time. The update to this site is a v3 run too: its pull requests are linked below.'`
- `codeSnippets`: one snippet, see **Code excerpt**.

### caseStudy

- `role`: `'Designer and operator'`
- `timeframe`: `'Sep – Oct 2026'`

**method** (keys match `MethodStepId`):

| Key | Text |
|---|---|
| `diagnose` | `'Every single-session approach hit one of three walls: the context limit, the usage limit, or the permission classifier. One night three loops shared one plan and every repo went silent from 00:12 to 07:19; a long thread ran out of context; the classifier blocked merges.'` |
| `decide` | `'I gave each feature a fresh session and put all state on disk: a feature list, a progress log and git. Agents do the judgment; a deterministic bash driver does the bookkeeping.'` |
| `build` | `'Harness v1 was a ~60-line script inside one project. v2 became its own repo: a worktree per run, repair and continue, an independent verify per milestone, steering from my phone. v3 merged verified milestones itself, waited out usage limits and queued runs.'` |
| `verify` | `'A red suite un-passes a feature. Each finished milestone gets an independent verify session that re-runs every step and writes one evidence row per step. Nothing merges unless the tree that lands on main is byte-for-byte the tree that was verified.'` |
| `simplify` | `'I went from three parallel loops to one serial queue under one usage limit for the whole machine, and from a human tap on every merge to a gated merge. A PR-only mode stays for projects where I still merge, like this site.'` |

**decisions** (ids exactly `D-H1, D-H2, D-H4, D-H5, D-H11, D-H17`, in that order). Rendered as
"Chose {chose} over {over} because {because}" then "Cost: {cost}":

| id | title | chose | over | because | cost |
|---|---|---|---|---|---|
| `D-H1` | `A fresh session per feature` | `a new headless session for every feature, with its state on disk,` | `one long loop session or an orchestrator with subagents` | `every single-session approach hit the context limit eventually; subagents only delayed it.` | `Every piece of state has to be written down, which is also what makes it inspectable.` |
| `D-H2` | `Models by role` | `the most capable model for the one-time initializer, Opus to build and review, and Sonnet to verify,` | `one model for everything` | `the initializer runs once and decides the quality of the whole night, while verification can run on a cheaper model.` | — (not set) |
| `D-H4` | `Guard against false passes` | `a red suite that un-passes the feature, plus an independent verify session per milestone,` | `trusting the session's own "passes"` | `the expensive failure is a feature marked done that isn't, and a second agent re-running the steps cold is the cheapest independent check.` | `One more session per milestone, capped at two rounds after a stub test showed the coder and verifier ping-ponging.` |
| `D-H5` | `The driver does the git bookkeeping` | `a deterministic driver for sync, push, tag, PR and cleanup` | `letting agents merge and clean up` | `these steps must happen every time and the same way: a script does that; a prompt might not.` | — |
| `D-H11` | `Detect limits from structure, test against the real message` | `reading the structured error fields first, with a regex only as a fallback, and never counting a $0 session as an attempt,` | `a wider regex` | `structure doesn't change its wording between releases, and the $0 rule catches the next unknown error too.` | — (the captured fixture is in the first lesson) |
| `D-H17` | `The harness merges, under one invariant` | `one PR per verified milestone, opened and merged by the driver in milestone order,` | `a human tap on every merge` | `mornings shouldn't be a merge queue, and the tree that lands on main is byte-for-byte a tree that was verified, after its own review, an independent verify and a green suite.` | `Human review moved from every merge to policy and permissions; a PR-only setting restores the tap, and this site's run uses it.` |

Grammar check (the template prints them as one sentence): "Chose a new headless session for every feature, with its
state on disk, over one long loop session or an orchestrator with subagents because every single-session approach hit
the context limit eventually; subagents only delayed it." A `chose` that is a list or has a parenthetical (D-H1, D-H2, D-H4, D-H11, D-H17) ends with a comma so "over"
reads as a new clause; D-H5's does not need one; no `over` carries punctuation.

**iterations** — **D27 resolved: 6 rows.** The brief's row 1b (one fresh thread per milestone) folds into row 1, so
the timeline and the evolution diagram show the same six stages.

| when | label | what | why |
|---|---|---|---|
| `Sep 2026` | `Long sessions` | `Long interactive sessions, with spec, research and decisions files for each idea.` | `It worked, but it needed me at the keyboard.` |
| `Oct 13–15` | `Runbook + loop` | `A written runbook as the agent's memory and an overnight loop; later one fresh thread per milestone, each ending with a handoff file.` | `Three loops ran on one plan and every repo went silent from 00:12 to 07:19 on usage limits. A long thread hit "context usage too high".` |
| `Oct 15–16` | `Orchestrator + subagents` | `One session orchestrated by role: Sonnet wrote failing tests, Opus implemented, Opus reviewed.` | `It delivered (one app gained 154 tests in about 2.5 hours), then hit a new wall: the permission classifier blocked a rebuild as a "production deploy", and blocked merges.` |
| `Oct 16 eve` | `Harness v1` | `After Anthropic's "Effective harnesses for long-running agents": an initializer turned the spec into a feature list, then one fresh session ran per feature, from a ~60-line script.` | `It lived inside one project, ran in place, and one guard trip stopped the whole night.` |
| `Oct 16 night` | `Harness v2` | `Its own repo. "Agents do judgment; the driver does bookkeeping." A worktree per run, repair and continue, an independent verify per milestone, tag + PR, steering from my phone through INBOX.md, metrics.` | `Merges still needed a human, and each run handled usage limits on its own.` |
| `Oct 17` | `Harness v3` | `Merges verified milestones itself, waits out usage limits for the whole machine, queues runs, and writes a retro and a ledger entry per run.` | `The current version. The run that built this site update is a v3 run.` |

**lessons** (exactly 5; the brief's sixth item, the classifier, is told in iteration 3 and D-H17 instead):

| broke | rule |
|---|---|
| `The harness broke its own rule. I had tested the usage-limit detector against a message I made up; the real one said "You've hit your session limit", so 45 sessions were counted as failed attempts in 6 minutes, with 5 hours of budget left.` | `Fakes mirror the live API: read the structured error first, and test against output captured from the real CLI.` |
| `Two runs in parallel used up the 5-hour usage window in 2 h 49 min.` | `One usage limit for the whole machine, and runs go one at a time by default.` |
| `On one project, verify sessions took 29–40 s, and review found the real defects later.` | `A verify writes one evidence row per step; with rows missing, it runs again on Opus.` |
| `An independent review of v3 before its first run found 2 critical and 8 important bugs, including a verify refused by a usage limit that counted as "holds" and would have merged code with zero evidence.` | `The harness gets reviewed before it drives a real night, like any other code.` |
| `One feature waiting on a human stopped a whole run: 14 independent features never ran behind it.` | `Independent work has to be declared. The initializer can give a feature an after list so it doesn't wait on a blocked one, but by default a feature still waits on everything before it; blocking only on declared dependencies is the next proposed change.` |

**links** (the `githubUrl` must be in here, `case-study-data.test.ts` checks it):

```ts
links: [
  { label: 'agent-harness on GitHub', href: 'https://github.com/mh550/agent-harness', kind: 'repo' },
  {
    label: 'This site update, built by the harness',
    href: 'https://github.com/mh550/portfolio_site/pulls?q=is%3Apr+harness',
    kind: 'repo',
  },
],
```

**builtWith** (D10): `'I designed the process, the specs, the decision log and the verification gates, and I ran each night and reviewed its results. Claude Code agents wrote much of the harness code under that direction.'`

## Code excerpt

`detail.codeSnippets` holds exactly one snippet. Source: `/home/mh550/projects/agent-harness/lib/driver.sh`, lines
170–182 (13 lines, the start of `merge_one`, ending at the verified-tree check), quoted verbatim:

- `title`: `'lib/driver.sh · the merge gate: only the verified tree lands on main'`
- `language`: `'bash'` (a label only: `CodeBlock` prints it, no highlighter)
- `code`: the verbatim lines 170–182, as `sed -n 170,182p lib/driver.sh` printed them at agent-harness `a586f59`
  (M4-02 copies the bytes from the file itself, not from this plan):
```bash
# Merge one verified milestone (its tag) into main through a PR. The invariant: the tree that lands on main is the
# tree that was verified. 0 = merged or proposed · 1 = needs Michael (conflict, refusal) · 3 = held: main has content
# this milestone wasn't verified with (the next milestone's verify includes it, and its merge carries this one)
merge_one() {
  local m=$1 tag=run/$RUN_ID/$1 c head url tree
  head=harness-merge/$RUN_ID-$m
  c=$(git rev-list -n1 "$tag") || return 1
  git fetch -q origin "$MAIN_BRANCH" || return 1
  if git merge-base --is-ancestor "$c" "origin/$MAIN_BRANCH"; then touch "$STATE/merged-$m"; note "$m merged into $MAIN_BRANCH (already there)"; return 0; fi
  if ! tree=$(git merge-tree --write-tree "origin/$MAIN_BRANCH" "$c" 2>/dev/null | head -1); then
    note "$m conflicts with $MAIN_BRANCH; not merged (needs Michael)"; notify "$m needs Michael: conflicts with $MAIN_BRANCH"; return 1
  fi
  [[ $tree == "$(git rev-parse "$c^{tree}")" ]] || return 3
```

Notes for M4-02:

- Why this one and not the limit detection in `lib/metrics.mjs`: the last line *is* the invariant the case study
  is built on (D-H17, the verify step), and it fits in 13 lines. The limit detection is told in D-H11 and the first
  lesson instead.
- Paste it into a template literal. It contains `$` signs but no `${` and no backtick, so no escaping is needed;
  check that once with `grep -c '\${' ` on the pasted block (expect 0) or use `String.raw`.
- The verbatim test (M4-02 step 3) compares against the live file, which the harness keeps changing. If
  `driver.sh` moves on, re-copy lines from the current file (and update this plan's line numbers) instead of
  loosening the test. The repo is public, so the excerpt publishes nothing new; it names "Michael" in a comment,
  which is fine.
- At 390 the long lines scroll inside the code block (`overflow-x-auto`), not the page.

## Diagrams

Both go in `src/components/projects/diagrams/index.tsx`, next to the existing five, using its private `Node`, `Sub`,
`Arrow` and `Panel` primitives (keeping one file means no primitive is exported or duplicated). Each needs an entry in
`DIAGRAMS`, `CAPTIONS` and `LABELS`; `DiagramKey` in `projects.ts` gains `'agent-harness' | 'harness-evolution'`.
No SVG assets, no new dependency, no `"use client"`.

### `agent-harness` (architecture)

Two panels: the run itself, and what surrounds it. Stacked at 390 (`flex flex-col gap-4 md:flex-row`, as
`GhlJobtreadDiagram` does), side by side from `md`.

**Panel "One run" (tone accent)**, top to bottom, `Arrow` (down) between nodes:

| # | Node | Sub |
|---|---|---|
| 1 | `harness CLI` | `start · status · queue` |
| 2 | `Driver` | `deterministic bash, in tmux` |
| 3 | `Initializer session` | `spec → feature_list.json` |
| 4 | `Coding session per feature` (accent) | `fresh context, Opus or Sonnet` |
| 5 | `Suite gate` | `red suite un-passes the feature` |
| 6 | `Verify session per milestone` | `one evidence row per step` |
| 7 | `Tag + PR` | `run/<run>/<milestone>` |
| 8 | `main` (accent) | `only the verified tree merges` |

Arrows are unlabelled except two: 5 → 6 `milestone done` and 7 → 8 `tree == verified`.

**Panel "Around it" (tone muted)**, four nodes, no arrows:

| Node | Sub |
|---|---|
| `INBOX.md` | `pause · stop · answers, from my phone` |
| `Push notifications` | `verified, needs me, merged` |
| `Usage-limit marker` | `one for the machine; every run waits on it` |
| `Queue + ledger` | `runs go one at a time; a retro per run` |

The words M4-03's test asserts (CLI, driver, initializer, session, suite, verify, PR, main, INBOX) are all in the node
text above (case-insensitive match on `Driver`, `Initializer`, `Suite`, `Verify`).

- `aria-label` (`LABELS['agent-harness']`): `'The harness CLI starts a deterministic driver. The driver runs an initializer session that turns the spec into a feature list, then one fresh coding session per feature. Every feature passes a suite gate; every finished milestone gets an independent verify session; a verified milestone is tagged and opened as a PR into main, and merges only if the merged tree is the verified tree. Around the run: an INBOX file for steering from a phone, push notifications, one usage-limit marker for the whole machine, and a queue with a ledger.'`
- caption (`CAPTIONS['agent-harness']`): `'One run: fresh sessions do the judgment, the driver does the bookkeeping, and nothing reaches main unverified.'`

### `harness-evolution` (six stages)

A grid of six stage cards: `grid grid-cols-1 gap-3 md:grid-cols-6` (one column at 390, one row from `md`). Each card is
a `Node`: an eyebrow (`when`, mono 10 px, muted), the stage label (sm, bold), then the short "why it changed" line
(`Sub`). Between cards at 390 a down `Arrow`; from `md` no arrows (the row reads left to right; an `Arrow dir="right"`
in a 6-column grid would need its own columns, not worth it). Stage 5 (v3) is `accent`.

**No repeated data strings**: the component reads `when`, `label` and `short` from the agent-harness entry's
iterations, and builds its aria-label from the same three fields (M4-05 moved the short lines from a component array
into `Iteration.short`). The short lines are diagram copy (≤ 8 words, so a 100 px column at `md` stays readable),
not a second copy of the timeline's `why`:

| # | when | label | short |
|---|---|---|---|
| 0 | Sep 2026 | Long sessions | `Needed me at the keyboard` |
| 1 | Oct 13–15 | Runbook + loop | `Hit usage and context limits` |
| 2 | Oct 15–16 | Orchestrator + subagents | `Blocked by the permission classifier` |
| 3 | Oct 16 eve | Harness v1 | `One guard trip stopped the night` |
| 4 | Oct 16 night | Harness v2 | `Merges still needed a human` |
| 5 | Oct 17 | Harness v3 | `Current: it built this update` |

M4-03 step 3 names the stages "long sessions, runbook + loop, orchestrator + subagents, harness v1, v2, v3": the
labels above match case-insensitively.

- `aria-label`: `'Six stages, September to October 17, 2026: long interactive sessions, which needed me at the keyboard; a runbook and an overnight loop, which hit usage and context limits; an orchestrator with subagents, blocked by the permission classifier; harness v1, where one guard trip stopped the night; harness v2, where merges still needed a human; and harness v3, the current version, which built this site update.'`
- caption: `'Six ways of driving agents, each changed by what broke in the one before.'`

At 390 the six cards stack (one column, full width, arrows between); nothing scrolls sideways. At `md` and up the six
sit in one row inside the 3xl column (about 100 px each), which is why the short lines are short.

## Tests M4-02 and M4-03 write or update

| File | Feature | Change |
|---|---|---|
| `src/__tests__/lib/case-study-agent-harness.test.ts` (new) | M4-02 | the feature's steps 1–4: fields, method, decision ids, 6 iterations starting `Sep`/`Oct`, 5 lessons, links, builtWith names "Claude Code" and "designed"; snippet ≤ 25 lines and verbatim in `/home/mh550/projects/agent-harness/lib/driver.sh` (skipped with a `console.log` note when the directory is absent, e.g. on Vercel/CI); every digit run of every metric value and every decision id appears in the brief; entry JSON contains none of `.ts.net`, `ntfy`, `journal/raw` |
| `src/__tests__/lib/data.test.ts` | M4-02 | 6 → 7 projects; D12 order map gains `'agent-harness': 1`; `getTopProjects(3)` → `agent-harness, linear-ai-workflow, ghl-jobtread-integration` (paint-estimator leaves the top 3 and so leaves `/card`); `getTopProjects(10)` gains it first |
| `src/__tests__/lib/case-study-types.test.ts` | M4-02 | "no current project is in systems or process yet" → the two categories now return exactly `['agent-harness']` |
| `src/__tests__/components/ProjectsGrid.test.tsx` | M4-02 | the Systems-click empty-state test → Systems shows the agent-harness card; keep an empty-state test by filtering `education` or rendering an empty list, whichever the component allows |
| `src/__tests__/pages/card.test.tsx` | — | derives from `getTopProjects(3)`, should pass unchanged; run it |
| `src/__tests__/app/project-page-unchanged.test.tsx` | — | fixed six-slug list: must pass untouched |
| `src/__tests__/components/ProjectDiagram.test.tsx` | M4-03 | iterates every `DiagramKey`: the two new keys are covered once added; add the architecture-words test and the evolution stage-label + same-length test |

## What Michael will see

M4-04, 2026-10-18. Full-page captures from the dev server (port 7800), taken after scrolling top to bottom so every
reveal had run (0 elements in `<main>` below opacity 1), then saved as palette PNGs (sharp, already in
`node_modules` via Next; no dependency added) so all four fit under 400 KB **as full pages**: no top-3000 crop was
needed. Measurements come from the DOM in the same pass (script: `$HARNESS_SCRATCH/m4-shots.mjs`). No console or
page errors on any of the four; `document.documentElement.scrollWidth − innerWidth` is 0 on all four.

| Page | What is on screen | Anything wrong |
|---|---|---|
| `docs/screenshots/v2/M4-agent-harness-390.png` (303 KB, 390 × 11285, full page) | Hamburger navbar; "← Projects"; eyebrow "PERSONAL · OPEN SOURCE"; h1 "Agent Harness: overnight software delivery with verification gates" on five lines; description; role line "Designer and operator · Sep – Oct 2026"; seven tech chips on two rows. **Metric strip a single column**: four stacked cards 55 / 52 / +374 / ≈ $2.53, each value on one line (DOM: 1 left edge, 4 tops, every `dd` one line-height tall). The Problem; the architecture diagram with "One run" (CLI → Driver → Initializer → coding session → Suite gate → "milestone done" → Verify → Tag + PR → "tree == verified" → main) stacked above "Around it" (INBOX.md, push notifications, usage-limit marker, queue + ledger) and its caption. The Method 01–05. Key Decisions: six cards, **each reading "Chose … over … because …"** (all 6 `li` match), with Cost lines on D-H1, D-H4, D-H17. How It Evolved: six timeline rows; **the evolution diagram stacked**, six cards top to bottom joined by ↓, Harness v3 highlighted (DOM: 1 left edge, 6 tops). What Broke: five broke → rule cards. Outcome. In the Code: the `lib/driver.sh` block, **which scrolls sideways inside itself** (`pre` scrollWidth 1288 > clientWidth 340, `overflow-x: auto`; the page's own scrollWidth − innerWidth is 0). Links (two buttons), How it was built, "← Back to all projects", footer | Nothing to fix. In "Around it", the usage-limit marker's sub-label "one for the machine; every run waits on it" wraps with "it" alone on its last line: left as is, because balancing it means changing the shared `Sub` primitive's classes, which the six pinned classic pages also render (`project-page-unchanged` snapshot). D-H2, D-H5 and D-H11 have no Cost line by design (the plan's decisions table sets none). The round "N" at the left is the Next dev indicator, not on the live site |
| `docs/screenshots/v2/M4-agent-harness-1280.png` (353 KB, 1280 × 7184, full page) | Full navbar; h1 on three lines; **metric strip in one row of four** (DOM: 1 top, 4 lefts; labels balanced over two lines where they wrap, "features passing / in one day", "verified and / merged, 12 PRs"); the diagram's two panels side by side, "Around it" top-aligned beside the taller "One run"; decision cards one sentence across; the evolution diagram as one row of six cards (1 top); What Broke cards with broke and rule side by side; code block with the longest lines scrolling inside it (`pre` 1288 > 718) | **Fixed in M4-04 (found here):** (1) four metrics in `MetricStrip`'s `sm:grid-cols-3` left ≈ $2.53 alone on a second row: four metrics now lay out 2 × 2 from `sm` and in one row from `md`, with `text-balance` labels (three-metric pages keep `sm:grid-cols-3` unchanged; new `MetricStrip.test.tsx`). (2) "Around it" was stretched to the height of "One run" and was mostly empty box: the panel row is now `md:items-start` (test in `ProjectDiagram.test.tsx`). Neither change touches the classic pages (snapshot passes untouched) |
| `docs/screenshots/v2/M4-projects-390.png` (159 KB, 390 × 4680, full page) | "WORK" eyebrow, h1 Projects, intro; filter pills All (active), Integration, Full-Stack, AI, Systems, Process; **the first card is Agent Harness** (visual header "55 features passing in one day", "PERSONAL · OPEN SOURCE", title, description, seven chips, "Deep dive →" and GitHub); then GoHighLevel ↔ JobTread, Linear, RingCentral, Paint Estimator, Mirrored Google Calendars, Cherished | Nothing |
| `docs/screenshots/v2/M4-card-390.png` (36 KB, 390 × 1150, full page) | Photo, name, "Systems & Process Engineer", subline; Save contact; LinkedIn / Email / GitHub; **Selected work: the first item is "Agent Harness: overnight software delivery with verification gates"**, then Linear Adoption + Agentic Bug Workflow, then GoHighLevel ↔ JobTread Integration; Full portfolio →; Show QR | Nothing. /card exists on the branch (M1); Paint Estimator has left the card's top 3 as M4-01 predicted |

## Traceability

Every number, date and decision id in the copy above. "Brief" = `docs/notes/evidence-agent-harness.md`; "AH" =
`/home/mh550/projects/agent-harness/`.

| Claim in the copy | Where | Source |
|---|---|---|
| about 10 hours a week | problem | Brief line 13 ("~10 hours a week") |
| three walls: context, usage, classifier | problem, diagnose | Brief lines 13–15 |
| 00:12 to 07:19, three loops on one plan | diagnose, iteration Oct 13–15 | Brief line 23; AH `journal/evidence/timeline.md` turning point 5 |
| long thread ran out of context / "context usage too high" | diagnose, iteration Oct 13–15 | Brief line 24 (row 1b); timeline turning point 6 |
| Sep 2026 / Oct 13–15 / Oct 15–16 / Oct 16 eve / Oct 16 night / Oct 17 | iterations `when` | Brief lines 22–28 |
| timeframe Sep – Oct 2026 | caseStudy.timeframe | Brief lines 22 and 28 |
| 154 tests in about 2.5 hours | iteration Oct 15–16 | Brief line 25 ("hit_list +154 tests in ~2.5 h") |
| "production deploy", classifier blocked merges | iteration Oct 15–16 | Brief line 25; timeline turning point 9 |
| ~60-line script | build, iteration Oct 16 eve | Brief line 26; AH `journal/iterations/03-harness-v1.md` line 31 |
| "Agents do judgment; the driver does bookkeeping." | iteration Oct 16 night | Brief line 27 |
| Oct 17, overnight on v2, finished on v3 | outcome, metric label | AH `journal/runs/2026-10-17-evaluation.md` line 1 ("the first harness v2 night", runs started 02:24 EDT); `journal/iterations/05-harness-v3.md` line 3 (v3 built Oct 17 afternoon); ledger rows carry 3 and 2 continuations. Brief line 67 said "first v3 night": corrected in M4-01 |
| 55 passing | metric, outcome | Brief line 69; AH `ledger/runs.jsonl` passing 17 + 38 |
| 52 verified and merged, 12 PRs | metric, outcome | Brief line 69; ledger verified 14 + 38, merges 4 + 8 |
| 71 features planned, two projects | outcome | Brief line 69; ledger total 33 + 38 |
| +374 tests, 1,242 → 1,616 | metric, outcome | Brief line 70; ledger (1,359 − 1,120) + (257 − 122) |
| $139.34, ≈ $2.53 per passing feature | metric, outcome | Brief line 70; ledger 52.33 + 87.01, ÷ 55 = 2.533 |
| 13.9 hours of run time, 127 sessions | outcome | Brief line 70; ledger wall_h 7.86 + 6.08 (two overlapping runs, so run time, not elapsed time), sessions 53 + 74 |
| this site update is a v3 run | outcome, iteration v3, D-H17 cost, simplify | Brief line 28; spec ground rule 1 (`MERGE_POLICY=pr`) |
| D-H1 (context limit, subagents only delay it, state on disk) | decision | Brief line 49; AH `journal/decisions.md` D-H1 |
| D-H2 (most capable model initializes, Opus builds/reviews, Sonnet verifies) | decision | Brief line 51; decisions.md D-H2 ("runs once and decides the night's quality") |
| D-H4 (red suite un-passes, independent verify, 2 rounds, stub ping-pong) | decision | Brief line 54; decisions.md D-H4 |
| D-H5 ("a script does that; a prompt might not") | decision | Brief line 56; decisions.md D-H5 |
| D-H11 (structured fields, $0 rule, captured fixture) | decision, lesson 1 | Brief line 61; decisions.md D-H11 |
| D-H17 (mornings not a merge queue, byte-for-byte verified tree, review moved to policy, `MERGE_POLICY=pr`) | decision | Brief lines 57–58; decisions.md D-H17 ("so mornings aren't a merge queue") |
| 45 sessions in 6 minutes, 5 hours of budget left, "You've hit your session limit" | lesson 1 | Brief lines 79–81 |
| "fakes mirror the live API" | lesson 1 rule | Brief line 81; timeline turning point 4 |
| 5-hour window in 2 h 49 min | lesson 2 | Brief line 83; decisions.md D-H12, D-H18 |
| 29–40 s verifies, one evidence row per step, Opus escalation | lesson 3, verify | Brief lines 85–86; AH `journal/iterations/05-harness-v3.md` line 25 |
| 2 critical + 8 important bugs, limit-refused verify counted as "holds" | lesson 4 | Brief lines 87–88 |
| 14 independent features never ran | lesson 5 | Brief line 89; AH `ledger/debrief.md` line 7 |
| after lists; "block only on declared dependencies" still proposed | lesson 5 rule | decisions.md D-H20; AH `lib/features.mjs` `deps()` (default: every earlier feature); AH `ledger/debrief.md` line 43 (candidate PR); brief line 90 ("proposed") |
| tech stack | techStack | Brief line 44 |
| code excerpt | codeSnippets | AH `lib/driver.sh` lines 170–182 at `a586f59` |

Numbers deliberately left out: the initializer's "~18% of cost" (brief line 51; the ledger's init roles add up to
about 9%, init + plan to 18%, so the figure is ambiguous), "83 end-to-end checks" and the first v2 night's
27 sessions (true, but the page has enough numbers). Pathways is private and is not named; "one app" stands in for
hit_list in the Oct 15–16 row to keep it short.

## Brand check

Checked against `docs/notes/brand.md` by reading every string above.

| Rule | Holds | How |
|---|---|---|
| First person | yes | problem, decide, simplify, iterations 0 and v2, lesson 1, builtWith use "I"/"me"/"my"; no "Michael" in the copy (only in the code comment, which is quoted source) |
| Past tense for what happened | yes | problem, method, lessons and outcome narrate in the past; present tense only for standing rules (lesson rules, decision `because` clauses that are still true, the v3 row "Merges verified milestones itself", which is the current behaviour) |
| Numbers over adjectives | yes | every claim of success carries its number (55, 52, 374, $2.53, 154 tests) |
| No buzzwords | yes | none of: leverage, synergy, seamless, robust, cutting-edge, revolutionary, empower, best-in-class, game-changing (searched) |
| Show the reasoning | yes | six decisions as chose/over/because, three with a cost (D-H1, D-H4, D-H17); a cost is set only where the source names one |
| Failures not sanded off | yes | five lessons, including the harness breaking its own rule |
| Agent credit (D10) | yes | builtWith: "I designed the process … Claude Code agents wrote much of the harness code under that direction." Nothing claims hand-written code |
| Never publish | yes | no hostnames, no IPs, no ntfy topic or the word "ntfy", no `.env` content, no tokens, no phone, no Spotify, no artifact links, nothing from `journal/raw/`; links only to the two public repos; Pathways (private) neither linked nor named |

## Review

Before that: M4-01 had the copy fact-checked by an Opus reviewer against the brief and the agent-harness sources.
2 Important (the Oct 17 numbers were framed as "the first v3 night", but the evaluation calls it the first v2 night;
lesson 5's rule presented a proposal as built) and 3 Minor (decision grammar, D-H17's reason, a brand-check row). All
five were applied above, and the brief's heading was corrected (see its `## Corrections`). The excerpt, every ledger
sum and every Traceability line reference were confirmed.

### M4-05 (2026-10-18)

The diff is `git diff a6b769a~1 HEAD` (M4-01 through M4-04, without screenshots and run files), written to
`$HARNESS_SCRATCH/M4.diff` (1,075 lines). It was reviewed by three agents: Opus on the code, Opus on facts and
voice, and Sonnet on the Web Interface Guidelines in a browser. I checked each finding against the source before
acting on it.

**Fact check** (entry vs. brief; AH = `/home/mh550/projects/agent-harness/` at `a586f59`, ledger =
AH `ledger/runs.jsonl`)

| Claim (as on page) | Where | Source | ✓ |
|---|---|---|---|
| 55 features passing in one day | metric 1 | ledger passing 17 + 38; brief line 69 | ✓ |
| 52 verified and merged | metric 2 | ledger 14 + 38; brief line 69 | ✓ |
| 12 PRs | metric 2, outcome | ledger merges 4 + 8; AH `ledger/debrief.md` line 6 (#6–#13) | ✓ |
| +374 tests (1,242 → 1,616) | metric 3, outcome | ledger (1359 − 1120) + (257 − 122); brief line 70 | ✓ |
| ≈ $2.53 per passing feature | metric 4, outcome | 139.34 / 55 = 2.533; brief line 70 | ✓ |
| $139.34 total | outcome | ledger 52.33 + 87.01; debrief.md line 8 | ✓ |
| 127 sessions | outcome | ledger 53 + 74 | ✓ |
| 13.9 hours of run time | outcome | ledger wall_h 7.86 + 6.08; brief Corrections | ✓ |
| 71 features **attempted** | outcome | debrief.md line 15: 14 "never attempted" | ✗ → fixed: "71 features planned" |
| Oct 17; two projects; overnight on v2, finished on v3 | outcome | AH `journal/runs/2026-10-17-evaluation.md` line 1; `journal/iterations/05-harness-v3.md` line 3 | ✓ |
| about 10 hours a week | problem | brief line 13 | ✓ |
| three walls (context, usage, classifier) | problem | brief lines 14–15 | ✓ |
| three loops; silent 00:12 to 07:19 | method, iteration 1 | brief line 23; AH `journal/evidence/timeline.md` 56–59 | ✓ |
| "context usage too high" | method, iteration 1 | brief line 24; timeline.md 60–62 | ✓ |
| ~60-line script | method, iteration 3 | AH `journal/iterations/03-harness-v1.md` line 31 | ✓ |
| one evidence row per step | method, lesson 3 | brief lines 37–38; 05-harness-v3.md line 25 | ✓ |
| byte-for-byte verified tree | method, D-H17 | 05-harness-v3.md 40–41; `lib/driver.sh` 182 | ✓ |
| D-H1 | decisions | AH `journal/decisions.md` 7–13; brief | ✓ |
| D-H2 | decisions | decisions.md 16–20; brief line 52 | ✓ |
| D-H4 | decisions | decisions.md 29–34 | ✓ |
| D-H5 | decisions | decisions.md 36–41 | ✓ |
| D-H11 | decisions | decisions.md 89–95 | ✓ |
| D-H17 | decisions | decisions.md 134–145; spec line 19 (`MERGE_POLICY=pr`) | ✓ |
| Sep 2026 | iteration 0 | brief line 22 | ✓ |
| Oct 13–15 | iteration 1 | brief lines 23–24 | ✓ |
| Oct 15–16; 154 tests in about 2.5 hours; "production deploy" | iteration 2 | brief line 25; AH `journal/iterations/02-orchestrator-and-subagents.md` 70, 78 | ✓ |
| Oct 16 eve | iteration 3 | brief line 26 | ✓ |
| Oct 16 night | iteration 4 | brief line 27 | ✓ |
| Oct 17 | iteration 5 | brief line 28 | ✓ |
| Sep – Oct 2026 | timeframe | brief lines 22, 28 | ✓ |
| "You've hit your session limit"; 5 hours left | lesson 1 | evaluation.md 31–33 | ✓ |
| 45 sessions **spent** in 6 minutes | lesson 1 | evaluation.md 32 has "spent" in quotes ($0 sessions) | ✗ → fixed: "counted as failed attempts" |
| 5-hour window in 2 h 49 min | lesson 2 | evaluation.md 34 | ✓ |
| Verify sessions took 29–40 s | lesson 3 | evaluation.md 37–38: Pathways only, dj's took 10 min | ✗ → fixed: "On one project, …" |
| 2 critical + 8 important bugs | lesson 4 | 05-harness-v3.md 35–37 | ✓ |
| 14 independent features never ran | lesson 5 | debrief.md lines 7, 15 | ✓ |
| initializer **now** gives an after list, so a blocked feature stops only its dependants | lesson 5 rule | AH `lib/features.mjs` `deps()`: by default a feature waits on every earlier one | ✗ → fixed (see Important 2) |
| "each cost a night" | detail.challenges (not rendered) | only the usage limit cost a night | ✗ → fixed: "each broke something" |
| techStack | header | brief line 44; AH README line 10 | ✓ |
| links (repo, PRs filtered by "harness") | links | brand.md line 62; brief lines 99–100 | ✓ |

**Code excerpt re-diffed.** I wrote the snippet out of the data and compared it with
`git -C …/agent-harness show a586f59:lib/driver.sh | sed -n 170,182p | diff - excerpt.txt`, and again with the
working copy's lines 170–182. Both are identical, byte for byte.

**Findings**

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Important | Reduced motion hid the page (site-wide; it predates M4). `ScrollReveal` rendered a plain `div` when `useReducedMotion()` was true, but the server, which can't know the preference, had rendered `motion.div` with inline `opacity:0; transform: translateY(40px)`. React doesn't patch attributes on hydration, so 15 blocks on this page (8 on /about) stayed invisible, with a hydration-mismatch console error. | Fixed test-first: `ScrollReveal.test` now requires the same `motion.div`, revealed by `animate` with `duration: 0` (it failed first). In Playwright with `reducedMotion: 'reduce'` at 390: 0 elements at opacity 0 and 0 console errors on /projects/agent-harness, /about and /. |
| 2 | Important | Lesson 5's rule presented `after` lists as the fix. By default a feature still waits on every earlier one, which is the mechanism that blocked the 14. | Rewritten. A test pins "by default a feature still waits on everything before it". |
| 3 | Important | The outcome said "71 features attempted", but 14 never ran. This contradicted lesson 5, and the brief had the same error. | "71 features planned". A test bans "attempted" in the entry. Correction added to the brief. |
| 4 | Important | `HARNESS_EVOLUTION_WHY`, project copy, lived in a component, paired with the data by index, and was repeated again as prose in the aria-label. | Moved to `Iteration.short`. The diagram reads it, and its aria-label is built from `when`/`label`/`short`. The `!.!.!` chain was replaced with an explicit error. Tests: every iteration has a `short` of 8 words or fewer, and the label contains each stage. |
| 5 | Important | The verbatim-excerpt test `return`ed (counted as a pass) when the sibling repo was absent, and `jest --silent` hid the note. | `it.skip` when the directory is absent, with the path from `AGENT_HARNESS_DIR` (default unchanged). Checked: with `AGENT_HARNESS_DIR=/nonexistent` Jest reports "1 skipped". |
| 6 | Minor | Digit-run check `toContain('55')` also matches 155. | Bounded regex. |
| 7 | Minor | Lessons 1 and 3 overstated the source ("spent", "Verify sessions took 29–40 s"); iterations 2 and 3 narrated in the present tense; builtWith said "I … reviewed every night" (the reviews were Opus sessions). | Rewritten, with plan copy updated to match. Tests pin lessons 1 and 3. |
| 8 | Minor | The listitem test reads semantics that `role="img"` hides from screen readers. | Renamed to say it checks DOM order. |
| 9 | Minor | No direction marker between evolution cards from `md`. | Recorded: the `when` eyebrow (Sep → Oct 17) carries the order, and right arrows in 102 px columns would crowd the labels (see Diagrams above). |
| 10 | Minor | The timeline and the evolution diagram show the six stages back to back. | Recorded: the template's fixed order (D16/D17); the diagram is the 8-word summary of the timeline. |
| 11 | Minor | `MetricStrip`: 2-metric pages keep an empty third column at `sm`; the visible label is a `<p>` inside the `dl` group next to an sr-only `dt` (the label is read twice). Both predate M4. | Recorded, not changed: both alter the pinned classic-page snapshot (`project-page-unchanged`), so they need their own feature. |
| 12 | Minor | Links have no explicit `focus-visible` style (they rely on the browser outline); `MediaGallery` autoplay video has no pause control and ignores reduced motion (no video on this page). | Recorded for a site-wide accessibility pass. |
| 13 | Minor | The coding-session node says "Opus or Sonnet", but D-H2 says Opus builds. | No change: brief line 35 says "Opus or Sonnet, chosen per feature". |

**Voice** (brand.md): first person in problem, method, iteration 0 and lessons, and past tense for what happened
(iterations 2–3 fixed). Nothing from the never-publish list: ntfy, `.ts.net`, 100.x addresses, Gatus, Pathways,
hit_list, tokens, `.env` and `journal/raw` were all searched for. No buzzwords. builtWith credits "Claude Code agents
wrote much of the harness code" and claims only design, running and review.

**Web Interface Guidelines** on /projects/agent-harness (at 1280 and 390): one h1, then h2 sections with h3 under
Method and Decisions, no skipped level. 4 links in `main`, all with descriptive names; the two external ones carry
an sr-only "(opens in new tab)". Reduced motion was broken and is fixed (finding 1). scrollWidth − innerWidth = 0
at 390. 0 console errors. Both diagrams are `role="img"` with non-empty labels.

Ready to merge: yes
