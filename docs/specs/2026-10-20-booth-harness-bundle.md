# Booth harness bundle: a test harness Michael can pull onto a demo laptop with one command

Status: design, 2026-10-20. Builder: the agent-harness, top of the queue. **Deadline: live on the production site
before 4:30 pm ET Tue 10-20** (Michael merges the PR from his phone). Small run: two milestones at most.

## 1. Why

At All Things Open, IBM's booth runs an agent-builder game. A player edits `agent_builder.py` (a detective agent that
uses MCP servers to visit "cities" and find hidden words), picks MCP servers under a 12-point budget, and runs it
locally (2 words, 6 cities) or in production (4 words, 21 cities). Score: words found first, then time. A local run
takes 200–350 s. The staff OK'd driving the agent headless from a separate folder, as long as the game engine is
untouched and nothing reads or hardcodes the secret words.

Michael has 15–20 minutes at the booth laptop. Typing code or long prompts there would eat the window, so the
harness and the prompts ship as one tarball on his site:

```bash
curl -sL https://michael-herron.vercel.app/b/h.tgz | tar xz        # bash / zsh
curl.exe -sLO https://michael-herron.vercel.app/b/h.tgz; tar -xzf h.tgz   # Windows PowerShell
```

That creates `mh_harness/` in the demo repo. Michael then tells the laptop's coding assistant (IBM Bob) "Read
mh_harness/PROMPTS.md and do Step 1". Only one small file (`adapter.py`) depends on the game's code, and the
assistant fills it in at the booth; everything else is written and tested tonight.

**Anti-goals:**

- anything that reads, prints or stores the game's secrets or answer files;
- anything that edits files outside `mh_harness/`, apart from the agent edit that Step 2 asks for;
- a link to the bundle anywhere on the site (it is served, not advertised: no page, no nav, no sitemap entry);
- third-party Python packages (the booth laptop has an unknown Python, 3.8+; standard library only);
- POSIX-only code: the laptop may be Windows, macOS or Linux.

## 2. Scope

| # | What |
|---|---|
| B1 | **The harness**, Python 3.8+ standard library only, in `public/b/mh_harness/` (§3). `run_one.py`, `sweep.py`, `report.py`, `adapter.py`, `fake_game.py`, `configs/round1.json`, `PROMPTS.md` (§5, verbatim), `README.md` (one screen: what each file does, the commands). Unit tests in `public/b/mh_harness/tests/` (`python3 -m unittest discover -s tests` from `mh_harness/`), all against `fake_game.py` (§4) |
| B2 | **The bundle.** `scripts/build-booth-bundle.mjs` (node standard library plus the system `tar`) writes `public/b/h.tgz` with one top-level folder `mh_harness/`, no `__pycache__`, no `.pyc`. `.gitignore` covers `__pycache__/`, `results.jsonl`, `logs/`, `work/` under `public/b/mh_harness/`. A jest test `src/__tests__/lib/booth-bundle.test.ts` (node env): the tarball exists; extracted to a temp dir, its file list and bytes equal `public/b/mh_harness/`; when `python3` is on PATH it runs the unit tests from the extracted copy and expects exit 0 (skip with a logged reason otherwise). A note `docs/notes/booth-bundle.md`: the two curl lines above, a per-file fallback (`curl -sLO …/b/mh_harness/PROMPTS.md`), how to rebuild, and that the bundle is unlinked on purpose |

Out of scope: the Voice Concierge work (PRs #14–16 are open; don't touch `/talk`, the token route, or their files),
every page and component, the nav, the sitemap, `smoke-routes.txt`.

The site's content guard scans `public/`, so every `.md`, `.json` and `.txt` in the bundle must pass it: no `TODO`,
no `[X]`, no artifact links. Use `<…>` placeholders and the word `ADAPT` for marked spots.

## 3. Harness design

**Config** (one object per run; a configs file is a JSON array of them):

```json
{ "name": "terse_trim", "mcps": ["<server>", "<server>"], "env": {"AGENT_PROMPT": "terse", "MAX_TOOL_CHARS": "2000"},
  "expected_words": 2, "cities": 6, "timeout_s": 450, "control_of": null }
```

`control_of: "base"` marks a duplicate of `base` used to measure noise. `sweep.py` **refuses to start** if any string
in a config still contains `<` or `>` (an unfilled placeholder), naming the config and field, so a 5-minute round is
never wasted.

**Telemetry lines.** Step 2 has the assistant add two print statements to the agent, so parsing is generic:

```
HARNESS_LLM {"in": 1234, "out": 56, "ms": 812}           # one per LLM call; "in"/"out" may be characters if usage isn't available
HARNESS_TOOL {"name": "visit_city", "args": {"city": "…"}}  # one per tool call
```

**`adapter.py`** is the only file that knows the game. Two functions, each under an `# ADAPT:` comment saying what to
fill in:

- `build_command(config, workdir) -> (argv: list, cwd: str)`: how to start one local run headless with
  `config["mcps"]`. The default runs `fake_game.py` so the tests and a dry run work out of the box.
- `parse_result(log_text) -> dict`: `words_found`, `score` (or `None`) from the game's own output. The default parses
  `fake_game.py`'s final line.

**`run_one.py CONFIG.json [--index K]`**: makes `work/<name>-<K>/`, starts the adapter's command with the config's
`env` merged over `os.environ` plus `HARNESS_WORKDIR`, streams combined stdout/stderr to `logs/<name>-<K>.log`,
and enforces `timeout_s` by killing the whole process tree (POSIX: `start_new_session` + `os.killpg`; Windows:
`CREATE_NEW_PROCESS_GROUP` + `taskkill /T /F /PID`). Then it appends one line to `results.jsonl`:

`name, index, round, config, words_found, score, wall_s, llm_calls, input_tokens, output_tokens, llm_ms_median,
tool_calls, repeated_tool_calls, exit_reason, error_tail, started_at`

`repeated_tool_calls` counts calls whose name and args match an earlier call in the same run. `exit_reason`: `solved`
(`words_found >= expected_words`), `incomplete` (exited 0 short of that), `timeout`, `error` (non-zero exit;
`error_tail` is the last 20 log lines). `round` is the configs file's stem, passed by `sweep.py`.

**`sweep.py CONFIGS.json [--parallel N] [--repeat K] [--dry-run]`**: runs every config K times (default 1), N at a time
(default 4), each as a `run_one.py` subprocess. Every 15 s it prints one status line per live run: elapsed, LLM calls
and tool calls so far, and an **alarm** when the log shows `429`, `rate limit`, `connection refused`, `address already
in use`, `Traceback`, or no tool call after 60 s. Ctrl-C kills every child tree and exits. `--dry-run` prints each
command and cwd and runs nothing. When all runs end it prints `report.py`'s table for this round.

**`report.py [--round NAME] [--prod-cities 21]`**: reads `results.jsonl` (latest round by default). One row per config
name with medians across repeats: words found, wall s, LLM calls, output tokens, input tokens, tool calls, repeats,
exit reasons. Sorted by words found desc, then median wall s asc. Under the table:

- **noise**: for each `control_of` pair, the wall-time gap in %; flag `NOISY` above 20 %;
- **prod projection**: per config, `llm_calls / cities × prod_cities` and the median LLM ms, so a slow-scaling config shows;
- **pick**: the top row that solved every repeat.

Plain aligned text; `--md` prints a markdown table instead.

## 4. Tests (written first)

`fake_game.py` takes its behaviour from env vars (`FAKE_SLEEP_S`, `FAKE_WORDS`, `FAKE_LLM_CALLS`, `FAKE_EXIT`,
`FAKE_ALARM`), prints `HARNESS_LLM`/`HARNESS_TOOL` lines as it goes and a final `RESULT {"words_found": n, "score": s}`.

- 4 configs × 2 s with `--parallel 4` finish in under 5 s (they really run in parallel);
- a run past `timeout_s` ends `timeout` and leaves no live child process;
- a non-zero exit ends `error` with the log tail; `FAKE_ALARM=429` makes the 15 s monitor print an alarm (make the
  interval a parameter so the test is fast);
- metrics: LLM calls, token sums, median ms, tool calls and repeated calls parse correctly;
- a placeholder in a config stops `sweep.py` before any run starts;
- `report.py`: median across repeats, sort order, the `NOISY` flag, the projection, the pick.

## 5. PROMPTS.md (ship this text verbatim, apart from fixing a wrong file name)

````markdown
# Booth playbook

Engine untouched. Nothing reads or prints secrets. My files: mh_harness/ and the agent edit in Step 2.

## Step 0 (say it to the staff, ~60 s)
- "Still fine if I drive the agent headless from my own folder? The engine stays untouched."
- "Are prod submissions limited? Does the board keep my best or my last? Is there a time cap per prod run?"
- "Can I start a prod run and come back? Can mh_harness/ stay here until this afternoon?"

## Step 1: Discovery (read-only)
Read-only for now. Do NOT modify the game engine, and do NOT open or print anything holding secret words or answers.
Report in under 25 lines:
1. Entrypoint: exactly how the UI starts an agent run (file, function or command, arguments), local and prod. Give a
   one-line shell command that starts one LOCAL run headless with a chosen MCP set.
2. Where results come out: words found, score, elapsed time.
3. LLM: provider, model, temperature, max output tokens, and where each is set.
4. Agent loop: max steps, timeouts, whether tool calls can run in parallel, how tool results enter the conversation.
5. Quote the agent's system prompt.
6. MCP servers: names, point costs, how a selection is passed in.
7. Shared state that would break parallel runs: fixed ports, fixed file paths, global sessions, one game server.

## Step 2: Wire it up
A. In agent_builder.py, add env-var settings whose defaults keep today's behaviour:
   AGENT_PROMPT=original|terse (terse = the prompt at the end of this file, with <N> and <FORMAT> filled in),
   MAX_TOOL_CHARS=0 (0 = no trim; else truncate each tool result to N chars before it enters the context),
   MAX_STEPS=<current default>, and MAX_OUTPUT_TOKENS / TEMPERATURE if the LLM client exposes them.
   Print one line per LLM call:  HARNESS_LLM {"in": <input tokens>, "out": <output tokens>, "ms": <latency>}
   (characters if token usage isn't available), and one per tool call:  HARNESS_TOOL {"name": ..., "args": {...}}
B. Fill in the two ADAPT functions in mh_harness/adapter.py from Step 1. Change no other harness file.
C. Run: python mh_harness/sweep.py mh_harness/configs/round1.json --dry-run   and show me the commands.

## Step 3: Round 1
Fill the <…> MCP sets in mh_harness/configs/round1.json (base = my current set; mcpB = <set B>), then run
  python mh_harness/sweep.py mh_harness/configs/round1.json --parallel 6
Watch the status lines. Tell me at once about any ALARM. If no run has a tool call by 60 s, say so.

## Step 4: Evaluate
Run python mh_harness/report.py, then answer briefly:
1. Did base and base_ctl agree within ~20 %? If NOISY, say the wall-time ranking is unreliable.
2. Which configs solved 2/2? Rank them by LLM calls, then output tokens. Is the leader's wall-time lead bigger than
   the base vs base_ctl gap?
3. Exit reason per run.
4. From the prod projection (21 cities, 4 words): which config is most likely to find all 4, and fastest?
5. Recommend one config for prod.

## Step 5: Prod
Make the recommended config's values the DEFAULTS in agent_builder.py, so a UI run uses them with no env vars set.
Show the diff, then run git status and git diff and confirm changes exist only in agent_builder.py and mh_harness/.
Then I submit to prod from the UI.

## Cutoff
No tool call from any run by minute 7 at the booth: stop building. Set AGENT_PROMPT=terse and MAX_TOOL_CHARS=2000 as
the defaults (Step 5 alone) and iterate in the UI.

## Terse system prompt
You are a detective agent. Goal: find all <N> secret words as fast as possible.
- No narration or explanations. Only tool calls until your final answer.
- First get the full list of cities. Don't revisit a city unless a clue points back to it.
  Call several tools in one turn when you can.
- Keep a one-line ledger: visited | clues | words found.
- From long tool output, keep only clues and ignore the rest.
- The moment you have all <N> words, stop and answer in this format: <FORMAT>.
````

`configs/round1.json` ships with these six (MCP lists as `"<current set>"` / `"<set B>"` placeholders, which is why
`sweep.py` refuses to run it unedited): `base` (original prompt, no trim), `base_ctl` (`control_of: "base"`),
`terse`, `terse_trim` (`MAX_TOOL_CHARS=2000`), `terse_trim2` (same as `terse_trim`), `terse_mcpB` (`terse_trim` with
set B). All `expected_words: 2`, `cities: 6`, `timeout_s: 450`.

## 6. Done means

- `.harness/check.sh` passes (lint, jest including `booth-bundle.test.ts` and the content guard, build);
- against the server `.harness/init.sh` starts on `$HARNESS_PORT`: `curl -sL http://localhost:$HARNESS_PORT/b/h.tgz | tar xz` in a
  temp dir yields `mh_harness/`, its unit tests pass there, and `python3 mh_harness/sweep.py
  mh_harness/configs/round1.json` refuses with the placeholder message;
- a fake round (a configs file pointing at `fake_game.py`, `--parallel 4`) prints status lines and a report table;
- no page, link, nav item or sitemap entry points at `/b/`.

## 7. Decisions

Numbering continues the v2 spec's D1–D40 (`docs/specs/2026-10-18-portfolio-v2.md`); never renumber.

- **D41** *default* `public/b/h.tgz` is committed, built by `npm run booth-bundle` (`scripts/build-booth-bundle.mjs`):
  GNU tar `--sort=name --owner=0 --group=0 --numeric-owner --mtime='2026-10-20 00:00Z' --mode=go-w,a+rX
  --format=ustar` piped to node `zlib.gzipSync` level 9, so the bytes are reproducible. Alternative: build it in a
  `prebuild` hook on Vercel (rejected: the jest test wants the committed bytes, and a stale tarball would be invisible).
- **D42** *default* No module beyond the §2 file list: the shared functions live in `run_one.py` (`parse_telemetry`,
  `exit_reason`, `kill_tree`, `start_detached`) and `sweep.py` / `report.py` import them (`import run_one`,
  `import report`); every script runs only under `if __name__ == "__main__"`. Alternative: a separate `harness_lib.py`.
- **D43** *default* CLI flags beyond §3 so the tests are fast: `sweep.py --interval S` (default 15) and
  `--alarm-after S` (default 60); `run_one.py --round NAME`; `timeout_s` may be a float. Alternative: module
  constants the tests patch (rejected: the tests run the scripts as subprocesses).
- **D44** *default* Python 3.8 rules: `from __future__ import annotations`, `typing.List/Dict/Optional/Tuple`, no
  `X | Y` unions, no `str.removeprefix`, no `match`, no `zoneinfo`, stdlib only; `statistics.median` for medians.
  Alternative: require 3.10+ (rejected: the booth laptop's Python is unknown).
- **D45** *default* `sweep.py` writes each run's single config to `work/<name>-<K>/config.json` and starts
  `run_one.py <that file> --index K --round <configs stem>`; `run_one.py`'s CONFIG.json is one object. Alternative:
  pass the configs file plus a name to `run_one.py`.
- **D46** *default* `results.jsonl`, `logs/` and `work/` are resolved from `run_one.py`'s own directory, not the cwd,
  so `python mh_harness/sweep.py …` from the game repo's root writes only inside `mh_harness/`; `MH_HARNESS_HOME`
  overrides that base directory (the tests point it at a tempdir). Alternative: cwd-relative paths.
- **D47** *default* Interrupts: `run_one.py` handles SIGTERM/SIGINT by killing the game's process tree and exiting
  130 without a results row; `sweep.py` on KeyboardInterrupt `kill_tree`s every live `run_one.py` and exits 130. The
  child's env gets `PYTHONUNBUFFERED=1` and `HARNESS_WORKDIR` (absolute). Alternative: record interrupted runs as
  `error` rows (rejected: they would skew the round's medians).
- **D48** *default* `configs/fake-round.json` ships beside `round1.json`: four configs (base, base_ctl, terse,
  terse_trim) that run `fake_game.py` through the adapter's defaults, so README's "try it", the dry run and the checks
  need no editing. README notes Windows uses `python` where it says `python3` (PROMPTS.md already says `python`).
  Alternative: build the fake configs inside the tests only (Michael: say `drop fake-round` in INBOX.md).
- **D49** *default* Exit codes: `run_one.py` 0 for solved/incomplete, 1 for timeout/error, 130 interrupted;
  `sweep.py` 0 when every run ended (whatever the reasons), 2 on a placeholder refusal, 130 interrupted; `report.py`
  always 0 (`no results yet` when the file is missing). Alarm text matches case-insensitively, except `429` (a whole
  token) and `Traceback`. Alternative: `sweep.py` exits non-zero when any run failed.
- **D50** *default* The bundle stays unlinked: no page, nav item, sitemap entry, smoke route or robots rule (a
  `Disallow` would advertise it). Docs only: `docs/notes/booth-bundle.md` and a CLAUDE.md row for `/b/h.tgz` plus
  the `npm run booth-bundle` command. Alternative: a `robots.txt` `Disallow: /b/`.
- **D51** *default* `sweep.py --dry-run` does not refuse placeholders: PROMPTS.md Step 2C dry-runs `round1.json`
  before Step 3 fills its MCP sets, so the dry run prints one `warning: config "<name>" field <path> still has a
  placeholder: "<value>"` line per placeholder on stderr, then every `cmd:` line, and exits 0; only a real start
  refuses (exit 2). Alternative: refuse in the dry run too (rejected: Step 2C would fail as written).
- **D52** *default* The base-dir override is `MH_HARNESS_HOME`, not `HARNESS_HOME` (D46 edited to match): the agent
  harness that builds this site exports `HARNESS_HOME` (its own checkout), so under that name every harness session's
  manual run or fake round wrote `results.jsonl`, `logs/` and `work/` into another repo. A booth laptop has neither
  variable set, so the bundle behaves the same there. Alternative: keep `HARNESS_HOME` (rejected: B1-03 hit it).
- **D53** *default* `run_one.py` exits 2 (no row, nothing created) when the config lacks `name` or a number in
  `timeout_s` / an int in `expected_words`, and records an `error` row (the `OSError` in `error_tail`) when the
  adapter's command can't start, so the report shows the config instead of silently leaving it out. Alternative: a
  traceback and exit 1.
