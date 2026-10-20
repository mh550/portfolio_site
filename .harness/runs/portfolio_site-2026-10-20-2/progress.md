# Progress log — run portfolio_site-2026-10-20-2 (branch `harness/portfolio_site-2026-10-20-2`)

What this file is: the shared memory of this harness run. Every session reads it at startup and adds a short
entry **at the top** (newest first): feature id, what landed, what the next session must know. The feature list is
`feature_list.json` in this directory: array order is priority, `after` lists are the real dependencies, a session
may flip only its own feature's `passes`. Michael steers through `INBOX.md` on this branch (first line
`status: run|pause|stop`; answers under `## Answers`). Plans go in `docs/plans/2026-10-20-<milestone>-<topic>.md`;
new defaults go in the booth spec's `## 7. Decisions` as `D<n> *default*` (D41–D50 are listed below for B1-01 to
append; numbering continues the v2 spec's D1–D40, never renumber).

---

### 2026-10-20 11:50 · B1-07 · passes

- **Review:** Opus read `git diff d1f2a62..HEAD -- public/b docs .gitignore` (2550 lines) and found 0 Critical,
  1 Important and 6 Minor. Plan § Review lists each finding with file:line and test name, and ends with the counts.
- **Fixed RED→GREEN (POSIX):** run_one now always kills the game's process group, also after the game exits by
  itself. Before, MCP or game servers it had started kept their ports into the next run. Test:
  `test_game_children_die_when_game_exits_itself`. Also fixed: sweep checks `timeout_s`/`expected_words` up front
  (exit 2, `test_config_fields_checked_before_any_run`); an old log it can't delete no longer stops the round
  (`test_undeletable_old_log_does_not_stop_the_sweep`); the stale-log test had a one-tick margin and now has more.
- **Simplified:** `run_one.kill_trees` serves both kill paths. One copy each of the signal flag, `positive_int`
  and `config_fields`. Code 834 → 829 lines. Python tests 96 → 99, Jest 643.
- **Verified:** unittest 99 OK. Fake round `--parallel 4` exit 0, `pick: base`. round1 refused, exit 2. ast 3.8 ok.
  Anti-goal greps are empty and every write is under `harness_home()`. Cleanup leaves the tree clean. CLAUDE.md
  is unchanged. `.harness/check.sh` printed `lint ok · jest ok · build ok`, and smoke exit 0.
- **Question for Michael (D56):** is the booth laptop Windows? There, `taskkill /T` can't reach the orphans of a
  game that has already exited. A Job object would fix that, but it is untested, so it is left.
- **Left (Minor):** Windows parallel appends to `results.jsonl` can tear (rare, and the torn line is skipped).
  `work/` is reused across sweeps (README: delete it to start clean).

### 2026-10-20 11:20 · B1-06 · passes

- **Landed:** `public/b/mh_harness/README.md` (44 lines: one line per file, the four commands, fake-round "try it",
  Windows `python`, output next to the scripts) and `tests/test_readme.py` (5 tests: < 60 lines, names every shipped
  file, the four commands, no `<`/TODO/`[X]`). Python 91 → 96 tests (20.9 s), Jest unchanged. Plan: Fake round
  evidence (39 lines) and the new test file in Files.
- **Verified from a clean mh_harness/:** round1 → refusal naming `base`/`mcps[0]`, exit 2; `--dry-run` → 6 warnings +
  6 `cmd:` lines, exit 0; fake round `--parallel 4 --interval 1` → 8 status lines, 4× `solved:1`, `pick: base`, 2.25 s;
  `report.py --md` table; `--parallel 2 --repeat 2` after `rm -rf` → 4× `solved:2`, `base vs base_ctl: 0.0 %`; every
  .py has `from __future__ import annotations` first; 3.8 grep empty; ast exit 0; content guard 20/20; smoke PASS exit 0;
  `.harness/check.sh` `lint ok · jest ok · build ok`; cleanup leaves only this commit's files.
- **Proposed change:** step 3 run straight after step 2 (as the plan's command block chains them) shows `solved:3`,
  since rows accumulate per round (D55); the step should start with `rm -rf results.jsonl logs work`. The step 4 ast
  one-liner prints ResourceWarnings under `-W error` (still exit 0); `open(f).read()` → `pathlib.Path(f).read_text()`.

### 2026-10-20 10:55 · B1-05 · passes

- **Landed:** `public/b/mh_harness/report.py` (`load_rows`, `summarise`, `render`, CLI `[--round] [--prod-cities 21] [--md]`,
  `no results yet`, exit 0) and `tests/test_report.py` (22 tests); `sweep._print_report` now prints the report (a report
  crash is one `report failed: …` stderr line, exit still 0; Ctrl-C during it → 130). Python 68 → 91 tests (21 s), Jest
  643 → 643. Spec **D55**: a round's rows accumulate across sweeps (re-run = more repeats), report imports
  `run_one.harness_home`, `-`/`n/a` rendering. Plan's import line updated.
- **Opus review** (9 findings): 1–8 fixed with tests (hand-edited `config`/`control_of`, NaN/Infinity, BOM, unreadable path,
  `|` in md cells, report crash, late Ctrl-C). Mutations (no wall tiebreak, threshold 30, pick ignores solved, first round
  default, mean, projection, narrow except) each fail their tests.
- **Verified:** fake round `--parallel 4 --interval 1` → status lines, 4-row table, `pick: base` (an earlier run printed
  `pick: base_ctl`, the fastest solved row), exit 0, 2.4 s; `report.py --md` → `| name | words | wall s |…`; ast 3.8 ok;
  `.harness/check.sh` `lint ok · jest ok · build ok`; smoke 38 PASS, exit 0; run files removed, tree clean.
- **Question for Michael:** D55: should re-running `round1.json` add to that round's repeats (current behaviour) or start fresh?
- **Proposed change:** `run_one._append_row` should add a `\n` first when the file ends mid-line (a cut-short append now
  swallows the next good row); it's old code, not in this feature.

### 2026-10-20 10:20 · B1-04 · passes

- **Landed:** `public/b/mh_harness/sweep.py` (`find_placeholders`, `find_alarm`, `main`; SIGINT/SIGTERM/SIGHUP set a flag
  read every 0.1 s tick; Ctrl-C SIGTERMs all live run_ones at once, then `kill_tree`s each, exit 130; each run's
  `run_one.out` echoed when it ends; `_print_report` prints the `report: <n> runs ended` placeholder) and
  `tests/test_sweep.py` (27 tests). Python 41 → 68 (21 s), Jest 643 → 643. Spec **D54**: exit 2 on an unreadable,
  non-array or duplicate/unsafe-name configs file (names `^[A-Za-z0-9][A-Za-z0-9_.-]*$`, duplicates compared case-folded),
  BOM ok, `--interval`/`--alarm-after` > 0. Plan: sweep flow and the extra test names.
- **Opus review** (9 findings), applied: an old game log is deleted before its run starts (no stale `ALARM: Traceback`), BOM
  and bad JSON give exit 2, case-folded and path-safe names, Ctrl-C in the last tick still exits 130, the Ctrl-C test
  always cleans up its sweep, positive floats; adapter's `# ADAPT:` comment no longer promises an empty workdir.
- **Verified:** round1.json → the exact refusal, exit 2, `grep -c base` 0, no results.jsonl; fake-round `--dry-run` → 4
  `cmd: … fake_game.py  cwd: …/work/…` lines, nothing created; a scratch fake round at `--parallel 2 --interval 0.5`
  printed status lines, 4× solved, 4 rows, 4.6 s; mutations (no parallel cap, no `_stop_all` on Ctrl-C) fail their tests;
  `ast` 3.8 ok; `.harness/check.sh` `lint ok · jest ok · build ok`.
- **Next session (B1-05):** swap the body of `sweep._print_report(home, round_name, runs_ended)` for
  `report.render(report.summarise(report.load_rows(home / "results.jsonl", round_name)))` and update the two tests that
  assert `report: 4 runs ended` / `report: 2 runs ended`. The Ctrl-C test asserts that no `report:` is printed.
- **Proposed change:** `test_stale_game_log_never_shows` passes with or without the fix here (the race needs a slow
  run_one start); it stays as a guard.

### 2026-10-20 09:48 · B1-03 · passes

- **Landed:** `adapter.py` (two `# ADAPT:` functions, `FAKE_GAME`); `run_one.py` gains `harness_home`, `start_detached`,
  `kill_tree(proc, grace_s=2.0)`, `child_env`, `main` + `__main__`; `tests/test_run_one.py` (23 tests). Python 18 → 41
  tests (5 s), Jest 643 → 643. Spec **D52** (override renamed `MH_HARNESS_HOME`), **D53** (bad config exit 2; start
  failure = `error` row); plan's Process control / Interrupts / Tests updated to match.
- **Why D52:** this harness exports `HARNESS_HOME=/home/mh550/projects/agent-harness`, so my first manual run wrote
  `results.jsonl`, `logs/terse_trim-2.log`, `work/terse_trim-2/` (09:36:54-56) **into agent-harness**. Cleanup there
  was denied to me. **Michael, please run:** `cd ~/projects/agent-harness && rm -f results.jsonl
  logs/terse_trim-2.log && rmdir work/terse_trim-2 work logs`.
- **Opus review** (16 findings) applied: signal handler only sets a flag + 0.1 s sliced wait (no orphan on a signal
  during `Popen`, Windows Ctrl-C works), `finally` kills an unreaped game on any exception, game grace 1 s < sweep's
  2 s (mutation-checked: grace 2 s fails `test_sweep_kill_reaches_game_that_ignores_sigterm` and orphans the game),
  SIGHUP, relative override resolved, float median, `\n`-only 2 KB-capped tail. Not done: Windows append atomicity.
- **Verified:** `grep -c '# ADAPT:'` → 2; `ast` 3.8 parse ok; from `/tmp` with only `HARNESS_HOME` set, rows go to
  `mh_harness/` (git-ignored, removed after); `.harness/check.sh` `lint ok · jest ok · build ok`; smoke green.
- **Next session (B1-04):** sweep starts run_one with `MH_HARNESS_HOME` (not `HARNESS_HOME`), kills it with
  `kill_tree(proc)` (default 2 s); `run_one.main` returns 130 on interrupt and 2 on a bad config.

### 2026-10-20 10:25 · B1-02 · passes

- **Landed:** `public/b/mh_harness/fake_game.py` (env-driven; `HARNESS_PID` first, then per call i `HARNESS_LLM
  {"in": 1000*i, "out": 50*i, "ms": 100*i}` + `HARNESS_TOOL visit_city city-<i>`, `fake alarm: <text>` after call 1,
  `RESULT {"words_found": W, "score": W*100}`, exit FAKE_EXIT); `run_one.py` with only `parse_telemetry` and
  `exit_reason` (plus private `_marker_json`, `_int`); `tests/test_telemetry.py` (18 tests). Jest 643 → 643.
- **Verified:** `python3 -m unittest discover -s tests` 18 ok in 0.13 s; `FAKE_LLM_CALLS=2 … | grep -c HARNESS_TOOL`
  → 2; `FAKE_EXIT=3 …; echo $?` → 3; importing run_one prints nothing; ast 3.8 parse ok; no `__pycache__` in
  `git status -uall`; `.harness/check.sh` `lint ok · jest ok · build ok`; smoke green.
- **Next session (B1-03):** add `harness_home`, `kill_tree`, `start_detached`, `main` to `run_one.py` (no `main` or
  `__main__` block yet) and `adapter.py`; `fake_game.py` with `FAKE_LLM_CALLS=0` sleeps FAKE_SLEEP_S in one go.
- **Proposed change:** the plan's B1-06 ast command under `python3 -W error` prints ResourceWarnings for the
  unclosed `open(f)` (exit still 0); use `pathlib.Path(f).read_text()` there.

### 2026-10-20 10:05 · B1-01 · passes

- **Landed:** `docs/plans/2026-10-20-B1-booth-harness.md` (Files, Shared functions, results.jsonl row, Process control,
  Report, Python 3.8 rules, Tests with named cases, Fake round, Review); `public/b/mh_harness/PROMPTS.md` (spec §5
  byte-identical, no file name needed fixing), `configs/round1.json`, `configs/fake-round.json`; `.gitignore` block;
  booth spec `## 7. Decisions` D41–D51. Jest 643 → 643 (no code yet).
- **Verified:** the `diff` of §5 vs PROMPTS.md is empty; a python assertion script checks every round1/fake-round
  field; each path's `git check-ignore -q` exits 0 and `h.tgz` exits 1; content guard 20/20; `.harness/check.sh`
  `lint ok · jest ok · build ok`; smoke green.
- **Next session (B1-02):** the plan fixes names beyond the feature text: `harness_home()` and `main()` in run_one.py,
  `fake_game.py` prints `HARNESS_PID <pid>` first (the timeout test needs it), LLM line i = `{"in": 1000*i, "out":
  50*i, "ms": 100*i}`, and `find_alarm` skips `HARNESS_` lines so a token count of 429 never alarms.
- **Question for Michael:** D51 *default*: `sweep.py --dry-run` warns about placeholders instead of refusing, because
  PROMPTS.md Step 2C dry-runs round1.json before Step 3 fills it. Say `dry-run refuses` in INBOX.md to change it.
- **Proposed change:** B1-01's check-ignore step runs `git check-ignore -q` with four paths, which git rejects
  (`--quiet is only valid with a single pathname`, exit 128); drop `-q` (exit 0) or check per path.

### 2026-10-20 09:30 · initializer (Fable) · feature list written

**Scope.** The brief wins: build the booth harness bundle (spec `docs/specs/2026-10-20-booth-harness-bundle.md`,
B1 + B2) and nothing else. Deadline: live before 4:30 pm ET today, so Michael needs the two PRs by early afternoon.
Don't touch the Voice Concierge work (PRs #14–16: `/talk`, the token route, anything named talk/concierge).

**Features: 10.** B1 (the Python harness, 7): B1-01 plan + verbatim content → B1-02 fake_game + log parsing →
B1-03 run_one + adapter → B1-04 sweep → B1-05 report → B1-06 check (README, fake round end to end) → B1-07 review.
B2 (the tarball, 3, `after: ["B1"]`): B2-01 build script + jest test + note + CLAUDE.md → B2-02 check against the
init server (sonnet) → B2-03 review. Expected: build sessions 5–15 min each, the whole run about 3 h.

**Where things live.**
- The harness: `public/b/mh_harness/` (Next serves `public/` as-is, so each file is fetchable at
  `/b/mh_harness/<file>` and the tarball at `/b/h.tgz`; no route, page or middleware is involved, there is none).
- Tests for it: `public/b/mh_harness/tests/test_*.py`, run with `cd public/b/mh_harness && python3 -m unittest
  discover -s tests`. `python -m` puts the cwd on `sys.path`, so `import run_one` works without `__init__.py`;
  still add `sys.path.insert(0, <parent dir>)` at the top of each test file so IDEs and other cwds work.
- The bundle script: `scripts/build-booth-bundle.mjs` next to `scripts/make-qr.mjs` (same style: top-level
  await, node stdlib). The jest test: `src/__tests__/lib/booth-bundle.test.ts` with `/** @jest-environment node */`
  on line 1 (jest defaults to jsdom); look at `src/__tests__/lib/qr.test.ts` for the pattern.
- The note: `docs/notes/booth-bundle.md`. Plans: `docs/plans/2026-10-20-B1-booth-harness.md` (B1-01) and
  `docs/plans/2026-10-20-B2-booth-bundle.md` (B2-02 creates it).

**Gotchas.**
- The content guard (`src/__tests__/lib/content-guard.test.ts`) scans `.md .json .txt` under `public/`, so
  PROMPTS.md, README.md and the configs must contain no `TODO`, `[X]`, `lorem ipsum`, phone-looking numbers
  (`ddd ddd dddd`), or `token: "<12+ chars>"`. `.py` files are not scanned, but keep them clean anyway. `<…>`
  placeholders and the word `ADAPT` are fine.
- Running the Python tests creates `__pycache__/`, `results.jsonl`, `logs/`, `work/` under `public/b/mh_harness/`.
  B1-01 adds them to `.gitignore`; `h.tgz` must stay unignored. Delete them before `npm run booth-bundle` anyway
  (the script excludes them, the jest test filters them, belt and braces).
- Child stdout through a pipe or file is block-buffered: `print(..., flush=True)` in fake_game.py and
  `PYTHONUNBUFFERED=1` in the env run_one gives its child, or the monitor sees nothing until exit.
- Timeout tests need `timeout_s` to accept floats; keep fake sleeps short so the whole Python suite is under
  60 s (the jest bundle test re-runs it, with a 180 s jest timeout on that case).
- Only Python 3.12 is installed here; the laptop may run 3.8. The B1-06 step runs `ast.parse(...,
  feature_version=(3, 8))` over every .py file, which rejects 3.9+ syntax but not 3.9+ library calls, hence the
  rules in D44.
- `.harness/check.sh` is `eslint` + `jest --silent` + `next build` into `.next-check`; the jest run now includes
  the Python suite via the bundle test, so budget about 2 min. `npx eslint` lints `scripts/*.mjs`.
- GNU tar 1.35 is here (`--sort=name` needs ≥ 1.28). Gzip in node (`zlib.gzipSync`) rather than `tar -z`, so the
  bytes carry no timestamp and a rebuild with no source change is a no-op in git.
- The init server is `next dev` on `$HARNESS_PORT` (7833 this run); it serves `public/` live, no restart needed
  after rebuilding h.tgz. `node .harness/smoke.mjs` must stay green; do not add `/b/` to `smoke-routes.txt`.
- PROMPTS.md is spec §5 verbatim. The spec says "apart from fixing a wrong file name", but every name in the
  text (agent_builder.py, mh_harness/adapter.py, sweep.py, report.py, configs/round1.json) matches the file list;
  B1-01 states in the plan that nothing needed fixing, or names what it fixed.

**Defaults (D41–D50; B1-01 appends them to the booth spec as `## 7. Decisions`, each with its alternative).**
- D41 `public/b/h.tgz` is committed, built by `npm run booth-bundle` (`scripts/build-booth-bundle.mjs`): GNU tar
  `--sort=name --owner=0 --group=0 --numeric-owner --mtime='2026-10-20 00:00Z' --mode=go-w,a+rX --format=ustar`
  piped to node `zlib.gzipSync` level 9, so the bytes are reproducible. Alternative: build it in a `prebuild` hook
  on Vercel (rejected: the jest test wants the committed bytes, and a stale tarball would be invisible).
- D42 No module beyond the spec's file list: the shared functions live in `run_one.py` (`parse_telemetry`,
  `exit_reason`, `kill_tree`, `start_detached`) and `sweep.py` / `report.py` import them (`import run_one`,
  `import report`); everything runs under `if __name__ == "__main__"`. Alternative: a `harness_lib.py`.
- D43 Extra CLI flags beyond §3 so the tests are fast: `sweep.py --interval S` (default 15) and `--alarm-after S`
  (default 60); `run_one.py --round NAME`; `timeout_s` may be a float.
- D44 Python 3.8 rules: `from __future__ import annotations`, `typing.List/Dict/Optional/Tuple`, no `X | Y`
  unions, no `str.removeprefix`, no `match`, no `zoneinfo`, stdlib only; `statistics.median` for medians.
- D45 `sweep.py` writes each run's single config to `work/<name>-<K>/config.json` and starts
  `run_one.py <that file> --index K --round <configs stem>`; `run_one.py`'s CONFIG.json is one object.
- D46 `results.jsonl`, `logs/`, `work/` are resolved from run_one.py's own directory (not the cwd), so
  `python mh_harness/sweep.py …` from the game repo's root writes only inside `mh_harness/`. `HARNESS_HOME`
  overrides that base directory (the tests point it at a tempdir).
- D47 Interrupts: run_one handles SIGTERM/SIGINT by killing the game's process tree and exiting 130 without a
  results row; sweep on KeyboardInterrupt `kill_tree`s every live run_one and exits 130. The child's env gets
  `PYTHONUNBUFFERED=1` and `HARNESS_WORKDIR` (absolute).
- D48 `configs/fake-round.json` ships beside round1.json: four configs (base, base_ctl, terse, terse_trim) that
  run `fake_game.py` through the adapter's defaults, so README's "try it", the dry run and the checks need no
  editing. README notes Windows uses `python` where it says `python3` (PROMPTS.md already says `python`).
- D49 Exit codes: run_one 0 for solved/incomplete, 1 for timeout/error, 130 interrupted; sweep 0 when every run
  ended (whatever the reasons), 2 on a placeholder refusal, 130 interrupted; report always 0 (`no results yet`
  when the file is missing). Alarm text matches case-insensitively except `429` (whole token) and `Traceback`.
- D50 The bundle stays unlinked: no page, nav item, sitemap entry, smoke route or robots rule (a `Disallow`
  would advertise it). Docs only: `docs/notes/booth-bundle.md` and a CLAUDE.md row for `/b/h.tgz` plus the
  `npm run booth-bundle` command.

**Live steps (build-only policy).** None in B1/B2 beyond the init server. The curl lines in the note target
production; the B2-02 check runs them against `http://localhost:$HARNESS_PORT` only. Michael's live check after
merging: `curl -sL https://michael-herron.vercel.app/b/h.tgz | tar xz && ls mh_harness` in an empty folder.

**Questions for Michael (none block; defaults chosen).**
1. Merge order: the B1 PR first, then the B2 PR (B2's branch builds on B1). If there is time for only one, merge
   B2's, which contains B1. Before merging, the Vercel preview URL of the B2 PR serves `/b/h.tgz`; the curl line
   above works against it.
2. D41–D50 are all reversible; the one that changes what ships is D48 (an extra `configs/fake-round.json` in the
   bundle). Say `drop fake-round` in INBOX.md to remove it.
