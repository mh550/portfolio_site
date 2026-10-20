"""One harness run: start the game through adapter.py, enforce the timeout, append a row to results.jsonl.

Also holds the functions sweep.py shares (parse_telemetry, exit_reason). Importing this module runs nothing.
"""
from __future__ import annotations

import json
import statistics
from typing import List, Optional, Set, Tuple

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
        "llm_ms_median": statistics.median(ms_values) if ms_values else None,
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
