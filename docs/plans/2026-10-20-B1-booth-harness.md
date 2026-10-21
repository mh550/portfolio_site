Removed 2026-10-21 (P0-01): the booth harness bundle and its route were deleted (D75); kept below for history.

# B1 · Booth harness (`public/b/mh_harness/`)

Spec: `docs/specs/2026-10-20-booth-harness-bundle.md` (§3 design, §4 tests, §5 PROMPTS.md, §7 decisions D41–D51).
Run: `portfolio_site-2026-10-20-2`, features B1-01 (this plan + fixed content) → B1-07 (review). Python 3.8+ standard
library only, POSIX and Windows. Every path below is relative to `public/b/mh_harness/` unless it starts with
`public/`, `docs/` or `src/`.

## Files

One line per file; "B1-0n" is the session that writes it.

- `run_one.py` (B1-02 parsing, B1-03 process): one run. CLI `run_one.py CONFIG.json [--index K] [--round NAME]`;
  holds the shared functions below; appends one row to `results.jsonl`.
- `sweep.py` (B1-04): a round. CLI `sweep.py CONFIGS.json [--parallel N] [--repeat K] [--interval S]
  [--alarm-after S] [--dry-run]`, defaults 4, 1, 15, 60; placeholder refusal, status lines, alarms, Ctrl-C, report.
- `report.py` (B1-05): `load_rows`, `summarise`, `render`; CLI `report.py [--round NAME] [--prod-cities 21] [--md]`.
- `adapter.py` (B1-03): the only game-specific file; `build_command(config, workdir)` and `parse_result(log_text)`,
  each under one `# ADAPT:` comment; the defaults run `fake_game.py`. Imports nothing from the other harness files.
- `fake_game.py` (B1-02): stand-in game driven by `FAKE_SLEEP_S`, `FAKE_WORDS`, `FAKE_LLM_CALLS`, `FAKE_EXIT`,
  `FAKE_ALARM` (§4); prints telemetry lines and a final `RESULT {…}`.
- `configs/round1.json` (B1-01, done): the six round-1 configs of spec §5 with `<current set>` / `<set B>`.
- `configs/fake-round.json` (B1-01, done): four configs that solve through the adapter defaults (D48).
- `PROMPTS.md` (B1-01, done): spec §5 verbatim. **No file name needed fixing**: every name the text uses
  (`agent_builder.py`, `mh_harness/adapter.py`, `mh_harness/sweep.py`, `mh_harness/report.py`,
  `mh_harness/configs/round1.json`) matches this list or the game repo, so the file is byte-identical to the block.
- `README.md` (B1-06): under 60 lines; one line per file, the four commands, Windows `python`, where output goes.
- `tests/test_telemetry.py` (B1-02): `parse_telemetry`, `exit_reason`, `fake_game.py`.
- `tests/test_run_one.py` (B1-03): `run_one.py` end to end against `fake_game.py`.
- `tests/test_sweep.py` (B1-04): `sweep.py` end to end.
- `tests/test_report.py` (B1-05): `report.py` on in-memory rows, plus the CLI's `no results yet`.
- `tests/test_readme.py` (B1-06): README under 60 lines, names every shipped file, the four commands, no placeholders.

Created at run time and git-ignored (`.gitignore`, B1-01): `results.jsonl`, `logs/`, `work/`, `__pycache__/`.

## Shared functions

All in `run_one.py` (D42). `sweep.py` does `import run_one`; `report.py` imports only `run_one.harness_home` (D55), and
`sweep.py` does `import report`. Each script's directory is on `sys.path` when it is run as a script, so plain
imports work; each test file starts with `sys.path.insert(0, <parent of tests/>)`.

```python
from __future__ import annotations
from typing import IO, Any, Dict, List, Optional
import subprocess
from pathlib import Path

def harness_home() -> Path:
    """Base dir for results.jsonl, logs/ and work/: $MH_HARNESS_HOME if set, else run_one.py's own directory (D46)."""

def parse_telemetry(log_text: str) -> dict:
    """{'llm_calls': int, 'input_tokens': int, 'output_tokens': int, 'llm_ms_median': Optional[float],
        'tool_calls': int, 'repeated_tool_calls': int}"""

def exit_reason(returncode: Optional[int], timed_out: bool, words_found: int, expected_words: int) -> str:
    """'timeout' if timed_out; else 'error' if returncode != 0; else 'solved' if words_found >= expected_words;
       else 'incomplete'. (timed_out wins over everything; returncode may be None only when timed_out.)"""

def kill_trees(procs: List[subprocess.Popen], grace_s: float = 2.0) -> None:
    """Kill each proc and everything it started (see Process control), one shared grace period; returns after
       all are reaped. Safe on processes that already exited. kill_tree(proc, grace_s) is kill_trees([proc])."""

def config_fields(config: dict) -> Tuple[str, float, int]:
    """(name, timeout_s, expected_words), raising KeyError/TypeError/ValueError (D53; sweep checks it up front)."""

# Also shared (B1-07): catch_interrupts() / interrupted() (the signal flag, D47) and positive_int (argparse type).

def start_detached(argv: List[str], cwd: str, env: Dict[str, str], log_file: IO[bytes]) -> subprocess.Popen:
    """Popen(argv, cwd=cwd, env=env, stdin=DEVNULL, stdout=log_file, stderr=STDOUT) in its own session/group."""

def main(argv: Optional[List[str]] = None) -> int:
    """The CLI; `if __name__ == "__main__": sys.exit(main())`."""
```

Parsing rules for `parse_telemetry` (B1-02):

- A marker (`HARNESS_LLM ` or `HARNESS_TOOL `) may sit anywhere on the line: take the text after the first
  occurrence, strip it, `json.loads` it; on `ValueError` or a non-dict, skip the line (it counts for nothing).
- LLM line: `in`, `out` ints (missing → 0), `ms` number (missing → not in the median). `input_tokens` = sum of `in`,
  `output_tokens` = sum of `out`, `llm_ms_median` = `statistics.median` of the `ms` values, `None` when there are none.
- Tool line: key = `(name, json.dumps(args, sort_keys=True))`; a call whose key was seen earlier in the same text
  counts once in `repeated_tool_calls` (three identical calls = 2 repeats). Same name with different args is not a
  repeat.
- Lines are split with `splitlines()`, so `\r\n` logs from Windows parse the same.

Other module-level names the build sessions use (not imported across files unless said):

- `adapter.FAKE_GAME = <abs path of fake_game.py>`; `build_command(config, workdir) -> Tuple[List[str], str]`
  returns `([sys.executable, FAKE_GAME], workdir)`; `parse_result(log_text) -> dict` returns
  `{"words_found": int, "score": Optional[int]}` from the last line containing `RESULT {` (`{"words_found": 0,
  "score": None}` when there is none or its JSON is malformed).
- `sweep.find_placeholders(configs) -> List[Tuple[str, str, str]]`: `(config name, field path, value)` for every
  string value containing `<` or `>`, walking dicts and lists; paths look like `mcps[0]`, `env.AGENT_PROMPT`, `name`.
- `sweep.find_alarm(log_text, elapsed_s, alarm_after_s, tool_calls) -> Optional[str]`: the first matching reason in
  this order: `429` (regex `\b429\b`), `rate limit`, `connection refused`, `address already in use` (all
  case-insensitive), `Traceback` (case-sensitive); else `no tool call after <alarm_after:g> s` when
  `tool_calls == 0 and elapsed_s >= alarm_after_s`; else `None`. Lines containing `HARNESS_` are skipped by the text
  checks, so a token count of 429 or a pid never raises an alarm.
- `report.load_rows(path, round_name=None) -> List[dict]`, `report.summarise(rows, prod_cities=21) -> dict`,
  `report.render(summary, md=False) -> str` (shapes under "results.jsonl row" and "Report").

## results.jsonl row

One JSON object per line, `json.dumps(row)` + `\n`, appended (`open(path, "a", encoding="utf-8")`) by `run_one.py`
after the game exits; exactly these 16 keys in this order:

| # | field | type | example | source |
|---|---|---|---|---|
| 1 | `name` | str | `"terse_trim"` | `config["name"]` |
| 2 | `index` | int | `0` | `--index`, default 0 |
| 3 | `round` | str | `"round1"` | `--round`, default the CONFIG.json stem |
| 4 | `config` | object | `{"name": "terse_trim", "mcps": […], "env": {…}, "expected_words": 2, "cities": 6, "timeout_s": 450, "control_of": null}` | the whole config as read |
| 5 | `words_found` | int | `2` | `adapter.parse_result(log)["words_found"]` |
| 6 | `score` | int or null | `1840` | `adapter.parse_result(log)["score"]` |
| 7 | `wall_s` | float | `212.47` | `time.monotonic()` start → reaped, `round(…, 2)` |
| 8 | `llm_calls` | int | `14` | `parse_telemetry` |
| 9 | `input_tokens` | int | `48210` | `parse_telemetry` |
| 10 | `output_tokens` | int | `1312` | `parse_telemetry` |
| 11 | `llm_ms_median` | float or null | `812.0` | `parse_telemetry` |
| 12 | `tool_calls` | int | `11` | `parse_telemetry` |
| 13 | `repeated_tool_calls` | int | `1` | `parse_telemetry` |
| 14 | `exit_reason` | str | `"solved"` | `exit_reason(...)`: `solved` / `incomplete` / `timeout` / `error` |
| 15 | `error_tail` | list of str or null | `["Traceback (most recent call last):", "…"]` | last 20 log lines when `error`, else null |
| 16 | `started_at` | str | `"2026-10-20T15:02:11Z"` | `datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")` at start |

Parallel `run_one.py` processes append to the same file; each row is one `write()` of a single line in append
mode, which is enough for a handful of runs. `report.load_rows` skips blank and malformed lines.

## Process control

**Start** (`start_detached`, used by `run_one.py` for the game and by `sweep.py` for each `run_one.py`):

- POSIX: `subprocess.Popen(..., start_new_session=True)`; the child leads its own process group (pgid = pid), so a
  terminal Ctrl-C reaches only `sweep.py` and the tree can be killed as one group.
- Windows (`os.name == "nt"`): `creationflags=subprocess.CREATE_NEW_PROCESS_GROUP`.
- Always `stdin=subprocess.DEVNULL`, `stdout=log_file`, `stderr=subprocess.STDOUT`; `log_file` is opened `"wb"` by
  the caller and closed by it after the child is reaped.

**Kill** (`kill_tree(proc, grace_s=2.0)`; run_one passes `GAME_GRACE_S = 1.0` for the game, so a game that ignores
SIGTERM still dies before sweep's 2 s SIGKILL of run_one, B1-03 review):

- POSIX: `os.killpg(proc.pid, SIGTERM)` (every proc first, for `kill_trees`); poll `proc.poll()` every 0.1 s for up to `grace_s`; then `os.killpg(proc.pid,
  SIGKILL)` regardless (stragglers in the group), ignoring `ProcessLookupError`/`PermissionError` throughout; then
  `proc.wait()`.
- Windows: if `proc.poll() is None`, `subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)],
  stdout=DEVNULL, stderr=DEVNULL)`; then `proc.wait()`. `/T` follows parent pids, so it reaches the game under `run_one.py` too.

**run_one.py** flow: read the config; `name`, `float(timeout_s)` and `int(expected_words)` must parse, else a
message on stderr and exit 2 before anything is created (D53) → `workdir = harness_home()/"work"/f"{name}-{index}"` (mkdir parents,
exist_ok) → `argv, cwd = adapter.build_command(config, str(workdir))` → `env = {**os.environ, **config["env"],
"HARNESS_WORKDIR": str(workdir.resolve()), "PYTHONUNBUFFERED": "1"}` (config env values are strings) → open
`harness_home()/"logs"/f"{name}-{index}.log"` → `start_detached` (an `OSError` is written into the log and the run
becomes an `error` row, D53) → wait in 0.1 s slices until it exits, the deadline passes (`timed_out = True`) or a
signal set the flag; a `finally` always `kill_tree`s the game, so whatever it started dies even after it exits by itself (B1-07, D56) → read the log (`utf-8`, `errors="replace"`) →
`parse_telemetry` + `adapter.parse_result` → append the row → print one summary line (`<name>-<K>: <exit_reason>
words=<n> wall=<s>s`, flush) → exit code per D49.

**Interrupts** (D47): `run_one.py` installs handlers for SIGTERM, SIGINT and SIGHUP (where it exists) that only set
a module flag (no exception can land inside `Popen` or `kill_tree`; the sliced wait notices it within 0.1 s, also on
Windows, where one long `wait()` would not see Ctrl-C); the loop then `kill_tree`s the game, appends **no** row and
returns 130. A game that already exited when the signal came still gets its row. `sweep.py` catches `KeyboardInterrupt` around its loop, `kill_trees` every live `run_one.py` at once (whose
SIGTERM handler then kills its game within the 2 s grace) and returns 130.

**sweep.py** flow: load the configs (a JSON array of objects with distinct non-empty `name`s, else exit 2, D54) → `find_placeholders`: with `--dry-run` print a `warning:` line
per hit to stderr and continue (D51); otherwise print `refusing to start: config "<name>" field <path> still has a
placeholder: "<value>"` for the first hit to stderr and exit 2 before creating anything → build the queue of
`(config, K)` for K in `range(repeat)` → `--dry-run`: for each, `argv, cwd = adapter.build_command(config,
str(home/"work"/f"{name}-{K}"))` and print `cmd: <" ".join(argv)>  cwd: <cwd>`; create nothing; exit 0 → otherwise
loop with a 0.1 s tick: start queued runs while fewer than N are live (write `work/<name>-<K>/config.json`, then
`start_detached([sys.executable, <abs run_one.py>, cfg, "--index", K, "--round", <configs stem>], cwd=<harness
home>, env=os.environ + MH_HARNESS_HOME, log_file=open(work/<name>-<K>/run_one.out, "wb"))`), reap finished ones, and
every `--interval` seconds print per live run `[<name>-<K>] <int elapsed>s llm=<n> tools=<n>` from
`parse_telemetry(<its game log>)`, plus ` ALARM: <reason>` from `find_alarm` (flush) → when all ended print
`report.render(report.summarise(report.load_rows(home/"results.jsonl", <configs stem>)))` → exit 0. The tick, not
`--interval`, decides how fast runs are reaped, so four 2 s runs finish in about 2 s.

## Report

`summarise(rows, prod_cities=21)` groups rows by `name` and returns:

```python
{"round": "round1", "prod_cities": 21,
 "rows": [{"name": "terse_trim", "runs": 2, "words_found": 2, "wall_s": 201.3, "llm_calls": 12,
           "output_tokens": 900, "input_tokens": 41000, "tool_calls": 10, "repeated_tool_calls": 0,
           "llm_ms_median": 790.0, "cities": 6, "control_of": None,
           "exit_reasons": "solved:2", "all_solved": True}, ...],          # sorted: words desc, wall asc
 "noise": [{"name": "base_ctl", "control_of": "base", "gap_pct": 12.5, "noisy": False}],
 "projection": [{"name": "terse_trim", "prod_llm_calls": 42.0, "llm_ms_median": 790.0}],
 "pick": "terse_trim"}                                                   # or None
```

- Numeric fields are `statistics.median` over the rows' non-null values (null when none); `exit_reasons` is
  `"<reason>:<count>"` joined by spaces, reasons sorted alphabetically; `cities` and `control_of` come from the
  latest row's `config`.
- `gap_pct = abs(ctl.wall_s - base.wall_s) / base.wall_s * 100` (null if base wall is 0 or missing); `noisy` is
  `gap_pct > 20`. Rendered `base vs base_ctl: 12.5 %`, plus ` NOISY` when noisy.
- `prod_llm_calls = llm_calls / cities * prod_cities`; rendered `<name>: ~<prod_llm_calls:.0f> LLM calls at
  <llm_ms_median:.0f> ms median` (`n/a` for a null median).
- `pick` = the first sorted row with `all_solved`; rendered `pick: <name>` or `pick: none solved every repeat`.
- `render(md=False)`: an aligned text table (columns `name words wall_s llm out_tok in_tok tools repeats exits`), a
  blank line, `noise`, `prod projection (<prod_cities> cities)`, `pick`. `md=True` prints the same table as a
  markdown table starting `| name | words | wall s | …` with a `|---|` separator row, the sections as `-` bullets.
- `load_rows(path, round_name=None)`: rows whose `round` equals `round_name`, default the `round` of the last valid
  line; `[]` when the file is missing. The CLI prints `no results yet` and exits 0 when there are no rows.

## Python 3.8 rules

(D44) Each `.py` file starts with `from __future__ import annotations` (after the module docstring), so annotations
are never evaluated; type names come from `typing` (`List`, `Dict`, `Optional`, `Tuple`, `IO`, `Any`) anyway, since
anything outside an annotation is evaluated. No `X | Y` unions, no `list[str]` outside annotations, no
`str.removeprefix`/`removesuffix`, no `match`, no `:=` (legal in 3.8, avoided for clarity), no `zoneinfo`, no `functools.cache`, no parenthesised context managers. Standard library only. Every `print` that may
go to a pipe or file passes `flush=True`. `shlex.join` exists in 3.8 but quotes for POSIX only; the dry run uses
`" ".join(argv)`. Paths via `pathlib.Path`; text I/O passes `encoding="utf-8"`. B1-06 checks the syntax with
`ast.parse(..., feature_version=(3, 8))`.

## Tests

`cd public/b/mh_harness && python3 -m unittest discover -s tests` (green, under 60 s in total). Every test that runs
a script uses `subprocess.run([sys.executable, <script>, …], env={**os.environ, "MH_HARNESS_HOME": <tempdir>},
timeout=…)` so the real `results.jsonl`, `logs/` and `work/` are never touched. `fake_game.py` prints `HARNESS_PID
<pid>` as its first line (flush) so the timeout test can find the game's pid; it also prints, for call i (from 1),
`HARNESS_LLM {"in": 1000*i, "out": 50*i, "ms": 100*i}` then `HARNESS_TOOL {"name": "visit_city", "args": {"city":
"city-<i>"}}`, `fake alarm: <FAKE_ALARM>` after the first call when set, and `RESULT {"words_found": <FAKE_WORDS>,
"score": <FAKE_WORDS * 100>}` last.

- `tests/test_telemetry.py` (B1-02)
  - `TestParseTelemetry.test_three_llm_calls_sum_and_median`: llm_calls 3, token sums, median = middle `ms`.
  - `TestParseTelemetry.test_repeated_tool_calls`: 4 tool lines, two identical → tool_calls 4, repeated 1.
  - `TestParseTelemetry.test_same_name_different_args_is_not_a_repeat`
  - `TestParseTelemetry.test_marker_after_timestamp_prefix`
  - `TestParseTelemetry.test_malformed_json_is_skipped`
  - `TestParseTelemetry.test_no_calls_gives_none_median`
  - `TestExitReason.test_solved`, `test_incomplete`, `test_timeout_wins_over_returncode`, `test_nonzero_is_error`
  - `TestFakeGame.test_two_calls_print_two_llm_two_tool_and_result` (FAKE_LLM_CALLS=2)
  - `TestFakeGame.test_alarm_text_is_printed` (FAKE_ALARM=429 → `429` in stdout)
  - `TestFakeGame.test_exit_code` (FAKE_EXIT=3 → returncode 3)
- `tests/test_run_one.py` (B1-03)
  - `TestRunOne.test_solved_row` (FAKE_SLEEP_S=0.2, FAKE_WORDS=2: solved, wall_s > 0, llm_calls 3, tool_calls 3,
    the log holds the RESULT line)
  - `TestRunOne.test_incomplete` (FAKE_WORDS=1)
  - `TestRunOne.test_error_has_tail` (FAKE_EXIT=2: error, error_tail ≤ 20 strings ending in the RESULT line)
  - `TestRunOne.test_timeout_kills_tree` (FAKE_SLEEP_S=30, timeout_s 1: timeout within 5 s; the `HARNESS_PID` pid
    is gone: `os.kill(pid, 0)` raises `OSError`)
  - `TestRunOne.test_config_env_reaches_child` (config `FAKE_WORDS` beats the test's own env)
  - `TestRunOne.test_row_has_exactly_16_fields`
  - `TestRunOne.test_writes_only_under_harness_home` (work/, logs/, results.jsonl appear in the tempdir)
  - `TestRunOne.test_sigterm_exits_130_without_row`, `test_sigint_exits_130_without_row` (POSIX only)
  - `TestRunOne.test_float_timeout`, `test_rows_append`, `test_child_env_has_workdir_and_unbuffered`
  - `TestRunOne.test_bad_config_exits_2_before_starting`, `test_start_failure_is_an_error_row` (D53)
  - `TestRunOne.test_sweep_kill_reaches_game_that_ignores_sigterm` (POSIX: `kill_tree(run_one)` leaves no game)
  - `TestAdapter` (4: default argv, last RESULT, none, malformed), `TestProcessControl` (POSIX: exited process,
    grandchild), `TestImport` (shared names; `harness_home` override, relative override resolved)
- `tests/test_sweep.py` (B1-04)
  - `TestSweep.test_four_runs_in_parallel_under_5s` (FAKE_SLEEP_S=2, `--parallel 4`: < 5 s, 4 rows)
  - `TestSweep.test_placeholder_refusal` (exit 2, stderr names the config and `mcps[0]`, no work/ or logs/)
  - `TestSweep.test_dry_run_prints_commands_and_writes_nothing` (4 `cmd:` lines, nothing created)
  - `TestSweep.test_dry_run_warns_on_placeholders` (D51: round1.json → exit 0, 6 `cmd:` lines, `warning:` on stderr)
  - `TestSweep.test_alarm_429` (FAKE_ALARM=429, `--interval 0.5` → `ALARM: 429`)
  - `TestSweep.test_alarm_no_tool_call` (FAKE_SLEEP_S=3, FAKE_LLM_CALLS=1, `--alarm-after 0.5 --interval 0.5`)
  - `TestSweep.test_repeat_two_gives_index_0_and_1`
  - `TestFindAlarm.test_harness_lines_never_alarm` (a `HARNESS_LLM {"in": 429}` line → None)
  - Also (B1-04): `TestSweep.test_parallel_limit` (4 × 1 s at `--parallel 2` ≥ 2 s), `test_writes_single_config_per_run`,
    `test_dry_run_repeat_names_each_index`, `test_status_line_without_alarm`, `test_bad_configs_file_exits_2` (D54),
    `test_ctrl_c_kills_every_run_and_exits_130` (POSIX: SIGINT → 130, both games gone, no rows, no report);
    `TestFindPlaceholders` (3), `TestFindAlarm` (6 in all)
- `tests/test_report.py` (B1-05), rows built in memory with a `row(name, **overrides)` helper
  - `TestSummarise.test_median_across_repeats` (wall 10, 20, 90 → 20)
  - `TestSummarise.test_sort_words_then_wall`
  - `TestSummarise.test_noise_flag` (10 % not NOISY, 25 % NOISY)
  - `TestSummarise.test_projection` (llm_calls 12, cities 6, prod 21 → 42)
  - `TestSummarise.test_pick_skips_incomplete_repeat`
  - `TestRender.test_md_starts_with_header_row`
  - `TestLoadRows.test_latest_round_by_default` (tempfile)
  - `TestCli.test_no_results_yet` (empty MH_HARNESS_HOME → `no results yet`, exit 0)

## Fake round

The B1-06 check, run from the worktree root; its trimmed output (≤ 40 lines) replaces this paragraph's last line.

```bash
cd public/b/mh_harness
rm -rf results.jsonl logs work; find . -name __pycache__ -exec rm -rf {} +
time python3 -m unittest discover -s tests                       # green, under 60 s
python3 sweep.py configs/round1.json; echo "exit=$?"              # refusal naming base / mcps[0], exit=2
python3 sweep.py configs/round1.json --dry-run                    # D51: warnings + 6 cmd: lines, exit 0
time python3 sweep.py configs/fake-round.json --parallel 4 --interval 1   # status lines, table, 4× solved:1, pick
python3 report.py --md                                            # the same round as a markdown table
python3 sweep.py configs/fake-round.json --parallel 2 --repeat 2 && python3 report.py   # solved:2, base vs base_ctl
cd ../../..
python3 -W error -c "import ast,glob; [ast.parse(open(f).read(), f, feature_version=(3,8)) for f in glob.glob('public/b/mh_harness/*.py')+glob.glob('public/b/mh_harness/tests/*.py')]"
rm -rf public/b/mh_harness/results.jsonl public/b/mh_harness/logs public/b/mh_harness/work
find public/b/mh_harness -name __pycache__ -exec rm -rf {} +; git status --short   # clean
```

Evidence (B1-06, 2026-10-20, Python 3.12, from a clean `mh_harness/`; `<cwd>` = `public/b/mh_harness`):

```text
$ python3 -m unittest discover -s tests
Ran 96 tests in 20.714s
OK                                                                   real 0m20.863s
$ python3 sweep.py configs/round1.json; echo "exit=$?"
refusing to start: config "base" field mcps[0] still has a placeholder: "<current set>"
exit=2
$ python3 sweep.py configs/round1.json --dry-run                    (exit 0)
warning: config "base" field mcps[0] still has a placeholder: "<current set>"     (… 6 warnings)
cmd: /usr/bin/python3 <cwd>/fake_game.py  cwd: <cwd>/work/base-0                  (… 6 cmd: lines)
$ time python3 sweep.py configs/fake-round.json --parallel 4 --interval 1
[base-0] 1s llm=1 tools=1                                           (… 8 status lines, all four runs)
base-0: solved words=2 wall=2.04s                                   (… 4 end lines)
name        words  wall_s  llm  out_tok  in_tok  tools  repeats  exits
base            2    2.04    3      300    6000      3        0  solved:1
base_ctl        2    2.04    3      300    6000      3        0  solved:1
terse           2    2.04    3      300    6000      3        0  solved:1
terse_trim      2    2.04    2      150    3000      2        0  solved:1
noise
  base vs base_ctl: 0.0 %
prod projection (21 cities)                                         (… 4 lines)
pick: base                                                          real 0m2.254s, exit=0
$ python3 report.py --md
| name | words | wall s | llm | out tok | in tok | tools | repeats | exits |
|---|---|---|---|---|---|---|---|---|
| base | 2 | 2.04 | 3 | 300 | 6000 | 3 | 0 | solved:1 |                    (… 3 more rows, noise, projection, pick)
$ rm -rf results.jsonl logs work; python3 sweep.py configs/fake-round.json --parallel 2 --repeat 2; python3 report.py
terse           2    2.02    3      300    6000      3        0  solved:2
base            2    2.04    3      300    6000      3        0  solved:2       (base_ctl, terse_trim: solved:2 too)
  base vs base_ctl: 0.0 %
pick: terse
$ python3 -W error -c "import ast,glob; …feature_version=(3,8)…"     exit 0 (ResourceWarnings only)
```

Without the `rm -rf` the repeat run shows `solved:3`: rows accumulate per round (D55).

## Review

B1-07, Opus, over `git diff d1f2a62..HEAD -- public/b docs .gitignore` (2550 lines; all five modules, configs,
PROMPTS.md, spec §1–§7). It found no Python 3.9+ syntax, and no write outside `harness_home()`.

**Critical:** none.

**Important**

1. `run_one.py:245` (`finally`): the game's tree was killed only when the game was still running, so the
   processes a game started (MCP servers, a local game server) outlived a run that exited or crashed by itself.
   They kept their ports, so the next run failed with `address already in use`. **Fixed** (POSIX): `kill_tree`
   always runs, and a game that has already exited costs no grace period. RED→GREEN:
   `tests/test_run_one.py` `TestRunOne.test_game_children_die_when_game_exits_itself`. Windows half **left**:
   `taskkill /T` cannot find the orphans of an exited parent. A Job object would, but it is untestable here
   (**D56**).

**Minor**

2. `sweep.py:122`: an unguarded `game_log.unlink()` (WinError 32 while another process holds the log) stopped
   the whole round. **Fixed**: OSError ignored. `tests/test_sweep.py`
   `test_undeletable_old_log_does_not_stop_the_sweep`.
3. `run_one.py:186`: on Windows, `O_APPEND` writes from parallel `run_one`s are not atomic, so rows that end at
   the same instant can tear. **Left**: the window is milliseconds, and `load_rows` skips a torn line.
4. `sweep.py:79`: `timeout_s`/`expected_words` were checked only inside `run_one`, so a typo (`"timeout"`)
   dropped that config from the round silently. **Fixed**: `_config_problem` calls `run_one.config_fields`
   before any run, exit 2. `test_config_fields_checked_before_any_run`.
5. `run_one.py:212`: `work/<name>-<K>/` is reused across sweeps. **Left**: the fake game keeps no state there,
   and the ADAPT command decides what lives there (README: delete `work/` to start clean).
6. `tests/test_sweep.py` `test_stale_game_log_never_shows`: its margin was one 0.1 s tick, because the fresh run
   also printed `tools=1`. **Fixed**: the stale log now holds 5 tool lines, and the test asserts that no
   `tools=5` appears.
7. No test covered children of a game that exits by itself. **Fixed** by the test for Important 1.

**Simplification** (applied): `sweep._stop_all` re-implemented the SIGTERM half of `kill_tree`; both now use
`run_one.kill_trees` (one shared grace period). Removed sweep's copy of the signal flag (`run_one.catch_interrupts`
/ `interrupted`) and report's and sweep's copies of `_positive_int` (`run_one.positive_int`). sweep and run_one
share `config_fields`. The docstring no longer says sweep uses `exit_reason`. Rejected: removing sweep's last
`return 130 if … else 0`, which handles a Ctrl-C while the report prints (B1-05). `summary["round"]` and the
per-config `"runs"` stay: they are cheap and a test reads `runs`. Python files total 834 → 829 lines. Tests:
96 → 99.

**Anti-goals checked:** `grep -rniE 'secret|answer' public/b/mh_harness/*.py` finds nothing. Every `open(`/`Path(`
target is under `harness_home()` (`results.jsonl`, `logs/`, `work/`) or is a configs file being read. The
`/b/` grep over `src/` and `public/` (`*.ts`, `*.tsx`, `*.md`, minus `mh_harness`) is empty. CLAUDE.md is
unchanged since `d1f2a62`.

**Counts:** 0 Critical, 1 Important (fixed on POSIX, Windows half left as D56), 6 Minor (4 fixed, 2 left).

