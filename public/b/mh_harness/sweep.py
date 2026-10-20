"""A round: every config K times, N at a time, each as a run_one.py subprocess, with status lines and alarms.

Usage: python3 sweep.py CONFIGS.json [--parallel N] [--repeat K] [--interval S] [--alarm-after S] [--dry-run]
       (defaults 4, 1, 15, 60; CONFIGS.json holds a JSON array of configs, its stem names the round)

Refuses to start while a config still has a <placeholder>; --dry-run only warns about them and prints each run's
command and cwd. Ctrl-C kills every run's process tree and exits 130. Importing this module runs nothing.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import IO, Any, List, Optional, Tuple

import adapter
import report
import run_one

RUN_ONE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "run_one.py")
NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")  # a config name becomes a file name under work/ and logs/
TICK_S = 0.1  # how often finished runs are reaped and queued ones started; --interval only paces the status lines

# (reason, pattern) in the order find_alarm checks them; 429 is a whole token, Traceback case-sensitive (D49).
ALARMS = [
    ("429", re.compile(r"\b429\b")),
    ("rate limit", re.compile(r"rate limit", re.IGNORECASE)),
    ("connection refused", re.compile(r"connection refused", re.IGNORECASE)),
    ("address already in use", re.compile(r"address already in use", re.IGNORECASE)),
    ("Traceback", re.compile(r"Traceback")),
]


def _walk_strings(value: Any, path: str) -> List[Tuple[str, str]]:
    if isinstance(value, str):
        return [(path, value)]
    found: List[Tuple[str, str]] = []
    if isinstance(value, dict):
        for key, item in value.items():
            found += _walk_strings(item, "{}.{}".format(path, key) if path else str(key))
    elif isinstance(value, list):
        for i, item in enumerate(value):
            found += _walk_strings(item, "{}[{}]".format(path, i))
    return found


def find_placeholders(configs: List[dict]) -> List[Tuple[str, str, str]]:
    """(config name, field path, value) for every string value containing < or >, e.g. ("base", "mcps[0]", "<x>")."""
    hits: List[Tuple[str, str, str]] = []
    for config in configs:
        name = str(config.get("name"))
        for path, value in _walk_strings(config, ""):
            if "<" in value or ">" in value:
                hits.append((name, path, value))
    return hits


def find_alarm(log_text: str, elapsed_s: float, alarm_after_s: float, tool_calls: int) -> Optional[str]:
    """The first alarm reason in the log (HARNESS_ lines skipped), else the no-tool-call alarm, else None."""
    text = "\n".join(line for line in log_text.splitlines() if "HARNESS_" not in line)
    for reason, pattern in ALARMS:
        if pattern.search(text):
            return reason
    if tool_calls == 0 and elapsed_s >= alarm_after_s:
        return "no tool call after {:g} s".format(alarm_after_s)
    return None


def _placeholder_message(hit: Tuple[str, str, str]) -> str:
    return 'config "{}" field {} still has a placeholder: "{}"'.format(*hit)


def _config_problem(configs: Any) -> Optional[str]:
    """Why the configs file can't be run (D54), or None."""
    if not isinstance(configs, list):
        return "the configs file must hold a JSON array of configs"
    seen = set()
    for i, config in enumerate(configs):
        if not isinstance(config, dict) or not isinstance(config.get("name"), str):
            return "config #{} needs a \"name\" string".format(i)
        name = config["name"]
        if not NAME_RE.match(name):
            return 'config name "{}" may hold only letters, digits, _ . - (it names files)'.format(name)
        if name.casefold() in seen:  # Windows and macOS file names ignore case
            return 'two configs are named "{}" (their logs and work dirs would collide)'.format(name)
        seen.add(name.casefold())
    return None


def _read_log(path: Path) -> str:
    try:
        return path.read_bytes().decode("utf-8", errors="replace")
    except OSError:
        return ""


class Run:
    """One live run_one.py: its process, its own stdout file, and where the game's log will be."""

    def __init__(self, run_id: str, proc: subprocess.Popen, out_file: IO[bytes], out_path: Path, game_log: Path):
        self.run_id = run_id
        self.proc = proc
        self.out_file = out_file
        self.out_path = out_path
        self.game_log = game_log
        self.started = time.monotonic()


def _start(config: dict, index: int, round_name: str, home: Path) -> Run:
    run_id = "{}-{}".format(config["name"], index)
    workdir = home / "work" / run_id
    workdir.mkdir(parents=True, exist_ok=True)
    config_path = workdir / "config.json"
    config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    game_log = home / "logs" / (run_id + ".log")
    if game_log.exists():
        game_log.unlink()  # else the first status line could show an earlier round's log before run_one truncates it
    out_path = workdir / "run_one.out"
    env = dict(os.environ)
    env["MH_HARNESS_HOME"] = str(home)
    argv = [sys.executable, RUN_ONE, str(config_path), "--index", str(index), "--round", round_name]
    out_file = open(str(out_path), "wb")
    try:
        proc = run_one.start_detached(argv, str(home), env, out_file)
    except BaseException:
        out_file.close()
        raise
    return Run(run_id, proc, out_file, out_path, game_log)


def _finish(run: Run) -> None:
    """Close the run's stdout file and echo it (run_one's summary line, or its error)."""
    run.out_file.close()
    text = _read_log(run.out_path).strip()
    if text:
        print(text, flush=True)
    if run.proc.returncode not in (0, 1):
        print("[{}] run_one exited {}".format(run.run_id, run.proc.returncode), flush=True)


def _status(run: Run, alarm_after_s: float) -> str:
    elapsed = time.monotonic() - run.started
    log_text = _read_log(run.game_log)
    telemetry = run_one.parse_telemetry(log_text)
    line = "[{}] {}s llm={} tools={}".format(run.run_id, int(elapsed), telemetry["llm_calls"],
                                             telemetry["tool_calls"])
    alarm = find_alarm(log_text, elapsed, alarm_after_s, telemetry["tool_calls"])
    if alarm is not None:
        line += " ALARM: " + alarm
    return line


def _stop_all(live: List[Run]) -> None:
    """SIGTERM every run_one at once (each then kills its game), then kill_tree them one by one."""
    if os.name != "nt":
        for run in live:
            try:
                os.killpg(run.proc.pid, signal.SIGTERM)
            except OSError:
                pass
    for run in live:
        run_one.kill_tree(run.proc)
        run.out_file.close()
    del live[:]


_interrupted = False


def _on_signal(signum: int, frame: object) -> None:
    # Only a flag, as in run_one.py: the loop sees it within one tick, so no signal lands half-way through Popen.
    global _interrupted
    _interrupted = True


def _catch_interrupts() -> None:
    for sig_name in ("SIGINT", "SIGTERM", "SIGHUP"):
        if hasattr(signal, sig_name):
            signal.signal(getattr(signal, sig_name), _on_signal)


def _print_report(home: Path, round_name: str) -> None:
    try:
        text = report.render(report.summarise(report.load_rows(home / "results.jsonl", round_name)))
    except Exception as exc:  # every row is saved already: the round still succeeded
        print("report failed: {!r}; run report.py --round {}".format(exc, round_name), file=sys.stderr, flush=True)
        return
    print(text, flush=True)


def _positive_int(text: str) -> int:
    value = int(text)
    if value < 1:
        raise argparse.ArgumentTypeError("must be 1 or more")
    return value


def _positive_float(text: str) -> float:
    value = float(text)
    if not value > 0:
        raise argparse.ArgumentTypeError("must be more than 0")
    return value


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run every config K times, N at a time, then print the report.")
    parser.add_argument("configs", help="JSON file holding an array of configs; its stem names the round")
    parser.add_argument("--parallel", type=_positive_int, default=4, help="runs at once, default 4")
    parser.add_argument("--repeat", type=_positive_int, default=1, help="runs per config, default 1")
    parser.add_argument("--interval", type=_positive_float, default=15.0,
                        help="seconds between status lines, default 15")
    parser.add_argument("--alarm-after", type=_positive_float, default=60.0,
                        help="alarm when a run has no tool call after this many seconds, default 60")
    parser.add_argument("--dry-run", action="store_true", help="print each run's command and cwd, run nothing")
    args = parser.parse_args(argv)

    try:
        with open(args.configs, encoding="utf-8-sig") as f:  # -sig: Windows Notepad may save a BOM
            configs = json.load(f)
    except (OSError, ValueError) as exc:
        print("refusing to start: {}: {}".format(args.configs, exc), file=sys.stderr, flush=True)
        return 2
    problem = _config_problem(configs)
    if problem is not None:
        print("refusing to start: {}: {}".format(args.configs, problem), file=sys.stderr, flush=True)
        return 2
    placeholders = find_placeholders(configs)
    if placeholders and not args.dry_run:
        print("refusing to start: " + _placeholder_message(placeholders[0]), file=sys.stderr, flush=True)
        return 2
    for hit in placeholders:  # D51: the dry run only warns, PROMPTS.md Step 2C dry-runs round1.json unfilled
        print("warning: " + _placeholder_message(hit), file=sys.stderr, flush=True)

    home = run_one.harness_home()
    round_name = Path(args.configs).stem
    queue = [(config, k) for config in configs for k in range(args.repeat)]

    if args.dry_run:
        for config, k in queue:
            cmd, cwd = adapter.build_command(config, str(home / "work" / "{}-{}".format(config["name"], k)))
            print("cmd: {}  cwd: {}".format(" ".join(cmd), cwd), flush=True)
        return 0

    _catch_interrupts()
    live: List[Run] = []
    last_status = time.monotonic()
    try:
        while queue or live:
            if _interrupted:
                raise KeyboardInterrupt
            while queue and len(live) < args.parallel:
                config, k = queue.pop(0)
                live.append(_start(config, k, round_name, home))
            for run in list(live):
                if run.proc.poll() is not None:
                    live.remove(run)
                    _finish(run)
            if live and time.monotonic() - last_status >= args.interval:
                last_status = time.monotonic()
                for run in live:
                    print(_status(run, args.alarm_after), flush=True)
            time.sleep(TICK_S)
    except KeyboardInterrupt:
        print("interrupted: stopping {} run(s)".format(len(live)), file=sys.stderr, flush=True)
        _stop_all(live)
        return 130
    except BaseException:
        _stop_all(live)
        raise
    if _interrupted:  # Ctrl-C during the last tick: still an interrupted round, no report
        return 130

    _print_report(home, round_name)
    return 130 if _interrupted else 0


if __name__ == "__main__":
    sys.exit(main())
