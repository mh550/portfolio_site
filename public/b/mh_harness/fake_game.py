"""Stand-in game for the harness tests and the fake round.

Behaviour comes from env vars: FAKE_SLEEP_S (float, total sleep, default 0), FAKE_WORDS (int, default 2),
FAKE_LLM_CALLS (int, default 3), FAKE_EXIT (int, default 0), FAKE_ALARM (text printed after the first call).
"""
from __future__ import annotations

import json
import os
import sys
import time


def main() -> int:
    sleep_s = float(os.environ.get("FAKE_SLEEP_S") or 0)
    words = int(os.environ.get("FAKE_WORDS") or 2)
    calls = int(os.environ.get("FAKE_LLM_CALLS") or 3)
    exit_code = int(os.environ.get("FAKE_EXIT") or 0)
    alarm = os.environ.get("FAKE_ALARM", "")

    print("HARNESS_PID {}".format(os.getpid()), flush=True)
    for i in range(1, calls + 1):
        if sleep_s > 0:
            time.sleep(sleep_s / calls)
        print("HARNESS_LLM " + json.dumps({"in": 1000 * i, "out": 50 * i, "ms": 100 * i}), flush=True)
        print("HARNESS_TOOL " + json.dumps({"name": "visit_city", "args": {"city": "city-{}".format(i)}}), flush=True)
        if alarm and i == 1:
            print("fake alarm: " + alarm, flush=True)
    if calls <= 0 and sleep_s > 0:
        time.sleep(sleep_s)
    print("RESULT " + json.dumps({"words_found": words, "score": words * 100}), flush=True)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
