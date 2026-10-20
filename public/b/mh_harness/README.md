# mh_harness

Runs one game config many times, N at a time, and reports which config finds the most words fastest.
Python 3.8+, standard library only, Linux, macOS and Windows. On Windows type `python` wherever this says `python3`.

## Files

- `run_one.py`: one run of one config: starts the game through the adapter, logs it, enforces `timeout_s`,
  appends one row to `results.jsonl`.
- `sweep.py`: a round: refuses unfilled placeholders, runs every config K times N at a time, prints status lines
  and alarms (429, rate limit, Traceback, no tool call), kills every run on Ctrl-C, then prints the report.
- `report.py`: one row per config (medians across repeats), sorted by words found then wall time; noise between
  a config and its control, the prod projection, and a pick.
- `adapter.py`: the only file that knows the game. Fill in the two functions under `# ADAPT:` (how to start one
  headless run, how to read its result); the defaults run `fake_game.py`.
- `fake_game.py`: a stand-in game for the tests and the fake round.
- `configs/round1.json`: the six round-1 configs; fill in their angle-bracket placeholders first.
- `configs/fake-round.json`: four configs that run `fake_game.py`, to try everything without the game.
- `PROMPTS.md`: what to say to the staff and to the coding assistant, step by step.
- `tests/test_telemetry.py`, `tests/test_run_one.py`, `tests/test_sweep.py`, `tests/test_report.py`,
  `tests/test_readme.py`: unit tests, all against `fake_game.py`.

## Commands

From inside `mh_harness/` (from the game repo's root, prefix the script paths with `mh_harness/`):

```bash
python3 -m unittest discover -s tests                    # all tests, under a minute
python3 sweep.py configs/round1.json --dry-run            # each run's command and cwd, runs nothing
python3 sweep.py configs/round1.json --parallel 6        # round 1, then the report
python3 report.py                                        # the latest round again (--md for markdown)
```

Try it without the game: `python3 sweep.py configs/fake-round.json --parallel 4 --interval 1` (a few seconds).

Other options: `sweep.py --repeat K` (runs per config), `--interval S` (status lines, default 15),
`--alarm-after S` (no tool call, default 60); `report.py --round NAME`, `--prod-cities 21`.
Exit codes: `sweep.py` 0 when every run ended, 2 on a placeholder refusal, 130 on Ctrl-C.

## Output

`results.jsonl` (one row per run), `logs/` (one log per run) and `work/` (one directory per run) are created
next to the scripts, whatever the current directory. Re-running a round adds repeats to it. Delete all three to
start clean.
