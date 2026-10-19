# Evidence brief: the agent harness (and the iterations that led to it)

Distilled 2026-10-18 from the sources below. Public-safe. Every claim on the case-study page must trace here or to a
source file. Deeper reading (read-only): `/home/mh550/projects/agent-harness/` — `README.md`,
`docs/architecture.md`, `journal/README.md`, `journal/decisions.md` (D-H1…D-H24), `journal/evidence/timeline.md`,
`journal/iterations/`, `journal/runs/2026-10-17-evaluation.md`, `ledger/runs.jsonl`. The journal says it was written
for exactly this purpose (the level-up interview and a portfolio case study) and has a case-study outline in
`journal/README.md`: read it first. **Never read or quote `journal/raw/`.** Repo: github.com/mh550/agent-harness
(public).

## Problem

Michael has ~10 hours a week and several personal projects. He wanted coding agents to build overnight while he
slept and to steer them from his phone. Every single-session approach hit one of three walls: the model's context
limit, the plan's usage limit, or the auto-mode permission classifier. The thesis of the journal: "how I learned to
drive long-running agents".

## Evolution (the heart of the case study)

| # | When | What | Why it changed |
|---|---|---|---|
| 0 | Sep 2026 | Long interactive sessions + spec / research / decisions files per idea | Worked, but needed Michael at the keyboard |
| 1 | Oct 13–15 | A written runbook (`OVERNIGHT.md`) as the agent's memory + an overnight `/loop` | Night 2 ran three loops in parallel on one plan; every repo went silent 00:12→07:19 on usage limits |
| 1b | Oct 15 | One fresh thread per milestone, each ending with a handoff file | "Context usage too high" |
| 2 | Oct 15–16 | Orchestrator + subagents by role: Sonnet writes failing tests, Opus implements, Opus reviews | hit_list +154 tests in ~2.5 h; dj suite 256 → ~1,100 in a day. New wall: the permission classifier blocked a rebuild ("production deploy") and merges |
| 3 | Oct 16 eve | Harness v1, after Anthropic's "Effective harnesses for long-running agents": an initializer turns the spec into a feature list, then one fresh `claude -p` session per feature (~60-line script) | It lived inside one project, ran in place, and one guard trip stopped the whole night |
| 4 | Oct 16 night | v2: its own repo. "Agents do judgment; the driver does bookkeeping." Worktree per run, repair-and-continue, independent verify session per milestone, tag + PR, phone steering via INBOX.md, metrics | Merges still needed a human; limits handled per run |
| 5 | Oct 17 | v3: merges verified milestones itself, waits out usage limits box-wide, queues runs, writes a retro and ledger entry per run, a read-only debrief when the queue ends | — (current; the run that built this site update is a v3 run) |

## Architecture (for a diagram)

`bin/harness` CLI → deterministic bash driver (in tmux) → per run: git worktree `~/worktrees/<project>/<run>` on
branch `harness/<run>`.
1. Initializer session (Fable) reads spec + brief → `feature_list.json` (milestones, `after` dependencies).
2. Loop per feature: project init script → fresh coding session (Opus or Sonnet, chosen per feature) → suite gate
   (cached by tree hash; a red suite un-passes the feature) → next feature.
3. Milestone done → independent verify session (Sonnet, escalates to Opus) re-runs every step and must write one
   evidence row per step.
4. Verified → tag `run/<run>/<milestone>` → PR → merged by the driver only if the tree that lands is byte-for-byte
   the verified tree (or left as a PR for Michael: this run uses that mode).
5. Around it: INBOX.md on the run branch (pause / stop / answers, editable from the GitHub phone app), push
   notifications, a box-wide usage-limit marker every run waits on, a queue with `--until`, `ledger/runs.jsonl`
   and `harness trends` feeding calibration back into the next initializer, a retro per run, a debrief per queue.
Dependencies: bash, git, node, jq, tmux, flock, claude, gh. Tests: 83 end-to-end checks with stub `claude`/`gh` on a
throwaway repo (~2 min).

## Key decisions (journal/decisions.md)

- **D-H1** A fresh session per feature: subagents only delay the context limit; fresh sessions force state onto
  disk where it can be inspected.
- **D-H2** Models by role: the most capable model only where leverage is highest (the initializer, ~18% of cost),
  Opus builds and reviews, Sonnet verifies.
- **D-H3** Repair and continue instead of stopping the night; stop only after 3 bad edits in a row.
- **D-H4** Guard against false passes: a red suite un-passes; an independent verifier, capped at 2 rounds (the stub
  test exposed coder/verifier ping-pong).
- **D-H5** The driver does all git bookkeeping: "a script does that; a prompt might not."
- **D-H6 → D-H17** From "PR per milestone, human merges" (forced by the classifier) to "the harness merges", under
  one invariant: the tree that lands on main is byte-for-byte a tree that was verified.
- **D-H8** Allow broadly, deny only history-destroying commands; deny rules are "a speed bump", the real guarantees
  are branch protection and scoped tokens.
- **D-H11** Detect usage limits from structured error fields, never count a $0 session, and test against a
  captured real message.
- **D-H12 / D-H18** One usage limit for the whole box; runs go one at a time by default.
- **D-H10 → D-H16, D-H21** Live systems get a staged protocol (dry run → 5 → 50 → all, snapshots, a lock) and live
  writes never overlap the nightly backup.

## Numbers (ledger/runs.jsonl, Oct 17: two runs started overnight on v2 and finished on v3 that day)

- 2 projects, 71 features attempted, **55 passing, 52 verified and merged through 12 PRs**.
- **+374 tests** (1,242 → 1,616). **$139.34 total, ≈ $2.53 per passing feature.** 13.9 h wall, 127 sessions.
- Pathways run: 38/38 features, tests 122 → 257, $87.01. dj run: 17/33 (blocked on a human-gated feature), tests
  1,120 → 1,359, $52.33.
- First v2 night: 27 consecutive real coding sessions with 0 repairs, 0 red un-passes, 0 permission denials,
  0 human interventions.
- Harness repo: built Oct 16–17, 83 end-to-end checks.

## What broke, and the rule it became

- **The harness broke its own rule.** The usage-limit detector was tested against a message Michael had made up.
  The real message said "You've hit your session limit", so 45 sessions were "spent" in 6 minutes with 5 hours of
  budget left. It was the exact failure night 1 had already taught ("fakes must mirror the live API"). Fix: D-H11,
  a fixture captured from real CLI output.
- **Parallel runs burned the shared limit**: two runs used the 5-hour window in 2 h 49 min → one box-wide limit,
  serial by default.
- **Verification was too thin**: verify sessions took 29–40 s and real defects were found later by review → one
  evidence row per step, escalation to Opus when rows are missing.
- **Review before first use paid off**: an independent review of v3 found 2 critical + 8 important bugs, including
  a limit-refused verify that counted as "holds" and would have merged code with zero evidence.
- **A blocked feature stopped whole runs** (14 independent features never ran behind one human-gated feature) →
  proposed: block only on declared dependencies (three retros proposed it; the debrief surfaced the pattern).
- **The classifier** refused "merge without review", "git destructive" and "self-modification". Michael designed
  around it (PRs, a deterministic driver, a never-list) rather than fighting it.

## Demo material

- Repo link (public). Code excerpts worth showing (short): the usage-limit detection with its captured fixture;
  the "verified tree == merged tree" check in `lib/driver.sh`; a `feature_list.json` entry.
- Terminal renders (as styled text blocks, not screenshots): `harness status`, `harness report`.
- This very site update: the run's PRs on github.com/mh550/portfolio_site are public proof ("this page was built
  by the harness it describes"; link the repo's pull requests filtered by `harness`).
- Screenshots to capture later (asset checklist): `harness attach` in tmux; a phone INBOX.md edit; an ntfy
  notification.

## Corrections

- 2026-10-18 (M4-01): the Numbers heading said "the first v3 night". `journal/runs/2026-10-17-evaluation.md` calls it
  "the first harness v2 night"; v3 was built that afternoon and the runs' continuations ran on it. The 13.9 h is the
  run time of two overlapping runs, not elapsed time.
