"""The only file that knows the game: how to start one run, and how to read its result.

The defaults run fake_game.py so the tests, the dry run and configs/fake-round.json work out of the box.
"""
from __future__ import annotations

import json
import os
import sys
from typing import List, Tuple

FAKE_GAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fake_game.py")


# ADAPT: return (argv, cwd) that starts ONE local game run headless, using config["mcps"] (and anything else in the
# config). workdir is this run's own empty directory (also in the env as HARNESS_WORKDIR); config["env"] is already
# in the child's environment. Use sys.executable for Python and absolute paths, so it works from any cwd.
def build_command(config: dict, workdir: str) -> Tuple[List[str], str]:
    return [sys.executable, FAKE_GAME], workdir


# ADAPT: return {"words_found": int, "score": int or None} read from the game's own output (log_text is the run's
# whole combined stdout/stderr). Return words_found 0 and score None when the game printed no result.
def parse_result(log_text: str) -> dict:
    for line in reversed(log_text.splitlines()):
        pos = line.find("RESULT {")
        if pos < 0:
            continue
        try:
            value = json.loads(line[pos + len("RESULT "):].strip())
        except ValueError:
            break
        if not isinstance(value, dict):
            break
        words = value.get("words_found")
        score = value.get("score")
        return {
            "words_found": words if isinstance(words, int) and not isinstance(words, bool) else 0,
            "score": score if isinstance(score, int) and not isinstance(score, bool) else None,
        }
    return {"words_found": 0, "score": None}
