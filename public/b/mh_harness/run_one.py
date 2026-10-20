"""One harness run: start the game through adapter.py, enforce the timeout, append a row to results.jsonl.

Usage: python3 run_one.py CONFIG.json [--index K] [--round NAME]   (CONFIG.json holds one config object)

Also holds the functions sweep.py shares (harness_home, parse_telemetry, exit_reason, kill_tree, start_detached).
Importing this module runs nothing.
"""
from __future__ import annotations

import argparse
import json
import os
import signal
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import IO, Dict, List, Optional, Set, Tuple

import adapter

GAME_GRACE_S = 1.0  # run_one's SIGTERM-to-SIGKILL wait for the game: shorter than sweep's 2 s wait for run_one
TAIL_LINES = 20
TAIL_WIDTH = 2000

LLM_MARKER = "HARNESS_LLM "
TOOL_MARKER = "HARNESS_TOOL "


def _marker_json(line: str, marker: str) -> Optional[dict]:
    """The JSON object after the first `marker` on the line, or None if absent, malformed or not an object."""
    pos = line.find(marker)
    if pos < 0:
        return None
    try:
        value = json.loads(line[pos + len(marker):].strip())
    except ValueError:
        return None
    return value if isinstance(value, dict) else None


def _int(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    return 0


def parse_telemetry(log_text: str) -> dict:
    """Count HARNESS_LLM / HARNESS_TOOL lines anywhere in the log.

    Returns {'llm_calls', 'input_tokens', 'output_tokens', 'llm_ms_median' (None without timings), 'tool_calls',
    'repeated_tool_calls' (calls whose name and args equal an earlier call's)}.
    """
    llm_calls = 0
    input_tokens = 0
    output_tokens = 0
    ms_values: List[float] = []
    tool_calls = 0
    repeated = 0
    seen: Set[Tuple[str, str]] = set()

    for line in log_text.splitlines():
        llm = _marker_json(line, LLM_MARKER)
        if llm is not None:
            llm_calls += 1
            input_tokens += _int(llm.get("in"))
            output_tokens += _int(llm.get("out"))
            ms = llm.get("ms")
            if isinstance(ms, (int, float)) and not isinstance(ms, bool):
                ms_values.append(ms)
            continue
        tool = _marker_json(line, TOOL_MARKER)
        if tool is not None:
            tool_calls += 1
            key = (str(tool.get("name")), json.dumps(tool.get("args"), sort_keys=True))
            if key in seen:
                repeated += 1
            seen.add(key)

    return {
        "llm_calls": llm_calls,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "llm_ms_median": float(statistics.median(ms_values)) if ms_values else None,
        "tool_calls": tool_calls,
        "repeated_tool_calls": repeated,
    }


def exit_reason(returncode: Optional[int], timed_out: bool, words_found: int, expected_words: int) -> str:
    """'timeout' wins over everything, then 'error' for a non-zero exit, then 'solved' or 'incomplete'."""
    if timed_out:
        return "timeout"
    if returncode != 0:
        return "error"
    if words_found >= expected_words:
        return "solved"
    return "incomplete"


def harness_home() -> Path:
    """Base dir for results.jsonl, logs/ and work/: $MH_HARNESS_HOME if set, else this file's own directory (D46, D52)."""
    override = os.environ.get("MH_HARNESS_HOME")
    if override:
        return Path(override).resolve()
    return Path(os.path.dirname(os.path.abspath(__file__)))


def start_detached(argv: List[str], cwd: str, env: Dict[str, str], log_file: IO[bytes]) -> subprocess.Popen:
    """Start argv in its own session (POSIX) or process group (Windows), stdout and stderr into log_file."""
    kwargs: Dict[str, object] = {}
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    return subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL, stdout=log_file,
                            stderr=subprocess.STDOUT, **kwargs)


def _killpg(pgid: int, sig: int) -> None:
    try:
        os.killpg(pgid, sig)
    except (ProcessLookupError, PermissionError):
        pass


def kill_tree(proc: subprocess.Popen, grace_s: float = 2.0) -> None:
    """Kill proc and everything it started, then reap proc. Safe on a process that already exited.

    POSIX: SIGTERM to proc's process group, SIGKILL after grace_s. A child that calls setsid() itself leaves the
    group and escapes. Windows: taskkill /T /F, skipped once proc has exited (its pid may already be reused).
    """
    if os.name == "nt":
        if proc.poll() is None:
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        proc.wait()
        return
    _killpg(proc.pid, signal.SIGTERM)
    deadline = time.monotonic() + grace_s
    while proc.poll() is None and time.monotonic() < deadline:
        time.sleep(0.1)
    _killpg(proc.pid, signal.SIGKILL)  # stragglers in the group, even when the leader went quietly
    proc.wait()


def child_env(config: dict, workdir: Path) -> Dict[str, str]:
    """os.environ, then the config's env, then HARNESS_WORKDIR (absolute) and PYTHONUNBUFFERED=1."""
    env = dict(os.environ)
    for key, value in (config.get("env") or {}).items():
        env[str(key)] = str(value)
    env["HARNESS_WORKDIR"] = str(Path(workdir).resolve())
    env["PYTHONUNBUFFERED"] = "1"
    return env


_interrupted = False


def _on_signal(signum: int, frame: object) -> None:
    # Only a flag: the wait loop below sees it within 0.1 s, so no signal can land half-way through Popen.
    global _interrupted
    _interrupted = True


def _catch_interrupts() -> None:
    for sig_name in ("SIGTERM", "SIGINT", "SIGHUP"):
        if hasattr(signal, sig_name):
            signal.signal(getattr(signal, sig_name), _on_signal)


def _tail(log_text: str) -> List[str]:
    """The last TAIL_LINES lines (split on newlines only, so \r progress bars stay one line), each cut to TAIL_WIDTH."""
    lines = log_text.replace("\r\n", "\n").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    return [line[:TAIL_WIDTH] for line in lines[-TAIL_LINES:]]


def _append_row(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(str(path), "a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run one game config, append one row to results.jsonl.")
    parser.add_argument("config", help="JSON file holding one config object")
    parser.add_argument("--index", type=int, default=0, help="repeat number K (work/<name>-<K>/), default 0")
    parser.add_argument("--round", default=None, help="round name for the row, default the CONFIG.json stem")
    args = parser.parse_args(argv)

    with open(args.config, encoding="utf-8") as f:
        config = json.load(f)
    try:
        name = str(config["name"])
        timeout_s = float(config["timeout_s"])
        expected_words = int(config["expected_words"])
    except (KeyError, TypeError, ValueError) as exc:
        print("run_one: {}: needs name, a number in timeout_s and an int in expected_words ({!r})".format(
            args.config, exc), file=sys.stderr, flush=True)
        return 2
    run_id = "{}-{}".format(name, args.index)
    round_name = args.round if args.round is not None else Path(args.config).stem

    home = harness_home()
    workdir = home / "work" / run_id
    workdir.mkdir(parents=True, exist_ok=True)
    log_path = home / "logs" / (run_id + ".log")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    cmd, cwd = adapter.build_command(config, str(workdir))
    env = child_env(config, workdir)

    _catch_interrupts()
    proc: Optional[subprocess.Popen] = None
    timed_out = False
    interrupted = False
    with open(str(log_path), "wb") as log_file:
        started_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        start = time.monotonic()
        try:
            proc = start_detached(cmd, cwd, env, log_file)
        except OSError as exc:
            log_file.write("run_one: could not start {}: {}\n".format(cmd, exc).encode("utf-8"))
        if proc is not None:
            try:
                deadline = start + timeout_s
                # Short slices: on Windows one long wait() would not see Ctrl-C until the game ends.
                while proc.poll() is None:
                    if _interrupted:
                        interrupted = True
                        break
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        timed_out = True
                        break
                    try:
                        proc.wait(timeout=min(0.1, remaining))
                    except subprocess.TimeoutExpired:
                        pass
            finally:
                if proc.returncode is None:  # timed out, interrupted or crashed: never leave the game running
                    kill_tree(proc, grace_s=GAME_GRACE_S)
        wall_s = round(time.monotonic() - start, 2)
    if interrupted:
        return 130  # D47: no row, an interrupted run would skew the medians

    log_text = log_path.read_text(encoding="utf-8", errors="replace")
    result = adapter.parse_result(log_text)
    telemetry = parse_telemetry(log_text)
    returncode = proc.returncode if proc is not None else None
    reason = exit_reason(returncode, timed_out, result["words_found"], expected_words)
    row = {
        "name": name,
        "index": args.index,
        "round": round_name,
        "config": config,
        "words_found": result["words_found"],
        "score": result["score"],
        "wall_s": wall_s,
        "llm_calls": telemetry["llm_calls"],
        "input_tokens": telemetry["input_tokens"],
        "output_tokens": telemetry["output_tokens"],
        "llm_ms_median": telemetry["llm_ms_median"],
        "tool_calls": telemetry["tool_calls"],
        "repeated_tool_calls": telemetry["repeated_tool_calls"],
        "exit_reason": reason,
        "error_tail": _tail(log_text) if reason == "error" else None,
        "started_at": started_at,
    }
    _append_row(home / "results.jsonl", row)
    print("{}: {} words={} wall={}s".format(run_id, reason, result["words_found"], wall_s), flush=True)
    return 0 if reason in ("solved", "incomplete") else 1


if __name__ == "__main__":
    sys.exit(main())
