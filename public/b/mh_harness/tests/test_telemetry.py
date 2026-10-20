"""Tests for run_one.parse_telemetry, run_one.exit_reason and fake_game.py."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS_DIR = os.path.dirname(HERE)
sys.path.insert(0, HARNESS_DIR)

import run_one  # noqa: E402

FAKE_GAME = os.path.join(HARNESS_DIR, "fake_game.py")


def llm(i_in, i_out, ms):
    return "HARNESS_LLM " + json.dumps({"in": i_in, "out": i_out, "ms": ms})


def tool(name, args):
    return "HARNESS_TOOL " + json.dumps({"name": name, "args": args})


class TestParseTelemetry(unittest.TestCase):
    def test_three_llm_calls_sum_and_median(self):
        log = "\n".join([
            "starting game",
            llm(1000, 50, 900),
            llm(2000, 100, 100),
            llm(3000, 150, 400),
            "done",
        ])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["llm_calls"], 3)
        self.assertEqual(t["input_tokens"], 6000)
        self.assertEqual(t["output_tokens"], 300)
        self.assertEqual(t["llm_ms_median"], 400)
        self.assertEqual(t["tool_calls"], 0)
        self.assertEqual(t["repeated_tool_calls"], 0)

    def test_repeated_tool_calls(self):
        log = "\n".join([
            tool("visit_city", {"city": "Paris"}),
            tool("visit_city", {"city": "Rome"}),
            tool("guess_word", {"word": "x"}),
            tool("visit_city", {"city": "Paris"}),
        ])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["tool_calls"], 4)
        self.assertEqual(t["repeated_tool_calls"], 1)

    def test_three_identical_calls_are_two_repeats(self):
        line = tool("visit_city", {"city": "Paris"})
        t = run_one.parse_telemetry("\n".join([line, line, line]))
        self.assertEqual(t["tool_calls"], 3)
        self.assertEqual(t["repeated_tool_calls"], 2)

    def test_args_key_order_does_not_matter(self):
        log = "\n".join([
            'HARNESS_TOOL {"name": "go", "args": {"a": 1, "b": 2}}',
            'HARNESS_TOOL {"name": "go", "args": {"b": 2, "a": 1}}',
        ])
        self.assertEqual(run_one.parse_telemetry(log)["repeated_tool_calls"], 1)

    def test_same_name_different_args_is_not_a_repeat(self):
        log = "\n".join([
            tool("visit_city", {"city": "Paris"}),
            tool("visit_city", {"city": "Rome"}),
            tool("visit_city", {"city": "Oslo"}),
        ])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["tool_calls"], 3)
        self.assertEqual(t["repeated_tool_calls"], 0)

    def test_marker_after_timestamp_prefix(self):
        log = "\r\n".join([
            "2026-10-20 15:02:11,123 INFO agent: " + llm(10, 2, 250),
            "[15:02:12] " + tool("visit_city", {"city": "Lima"}),
        ])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["llm_calls"], 1)
        self.assertEqual(t["input_tokens"], 10)
        self.assertEqual(t["output_tokens"], 2)
        self.assertEqual(t["llm_ms_median"], 250)
        self.assertEqual(t["tool_calls"], 1)

    def test_malformed_json_is_skipped(self):
        log = "\n".join([
            "HARNESS_LLM {not json",
            "HARNESS_LLM [1, 2]",
            "HARNESS_TOOL {\"name\": \"visit_city\", \"args\": ",
            llm(5, 1, 30),
        ])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["llm_calls"], 1)
        self.assertEqual(t["input_tokens"], 5)
        self.assertEqual(t["tool_calls"], 0)

    def test_missing_fields_count_as_zero_and_skip_median(self):
        log = "\n".join(['HARNESS_LLM {"in": 7}', 'HARNESS_LLM {"out": 3, "ms": 80}'])
        t = run_one.parse_telemetry(log)
        self.assertEqual(t["llm_calls"], 2)
        self.assertEqual(t["input_tokens"], 7)
        self.assertEqual(t["output_tokens"], 3)
        self.assertEqual(t["llm_ms_median"], 80)

    def test_no_calls_gives_none_median(self):
        t = run_one.parse_telemetry("just some output\nRESULT {\"words_found\": 0}\n")
        self.assertEqual(t, {
            "llm_calls": 0, "input_tokens": 0, "output_tokens": 0, "llm_ms_median": None,
            "tool_calls": 0, "repeated_tool_calls": 0,
        })


class TestExitReason(unittest.TestCase):
    def test_solved(self):
        self.assertEqual(run_one.exit_reason(0, False, 2, 2), "solved")
        self.assertEqual(run_one.exit_reason(0, False, 3, 2), "solved")

    def test_incomplete(self):
        self.assertEqual(run_one.exit_reason(0, False, 1, 2), "incomplete")

    def test_timeout_wins_over_returncode(self):
        self.assertEqual(run_one.exit_reason(None, True, 0, 2), "timeout")
        self.assertEqual(run_one.exit_reason(-15, True, 2, 2), "timeout")
        self.assertEqual(run_one.exit_reason(0, True, 2, 2), "timeout")

    def test_nonzero_is_error(self):
        self.assertEqual(run_one.exit_reason(1, False, 2, 2), "error")
        self.assertEqual(run_one.exit_reason(-9, False, 0, 2), "error")


def run_fake(**env_overrides):
    env = dict(os.environ)
    for key in ("FAKE_SLEEP_S", "FAKE_WORDS", "FAKE_LLM_CALLS", "FAKE_EXIT", "FAKE_ALARM"):
        env.pop(key, None)
    env.update(env_overrides)
    return subprocess.run(
        [sys.executable, FAKE_GAME], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        universal_newlines=True, timeout=30,
    )


class TestFakeGame(unittest.TestCase):
    def test_two_calls_print_two_llm_two_tool_and_result(self):
        proc = run_fake(FAKE_LLM_CALLS="2")
        self.assertEqual(proc.returncode, 0)
        lines = proc.stdout.splitlines()
        self.assertTrue(lines[0].startswith("HARNESS_PID "))
        self.assertEqual(sum(1 for line in lines if "HARNESS_LLM " in line), 2)
        self.assertEqual(sum(1 for line in lines if "HARNESS_TOOL " in line), 2)
        self.assertTrue(lines[-1].startswith("RESULT {"))
        result = json.loads(lines[-1][len("RESULT "):])
        self.assertEqual(result, {"words_found": 2, "score": 200})
        t = run_one.parse_telemetry(proc.stdout)
        self.assertEqual(t["llm_calls"], 2)
        self.assertEqual(t["input_tokens"], 3000)
        self.assertEqual(t["output_tokens"], 150)
        self.assertEqual(t["tool_calls"], 2)
        self.assertEqual(t["repeated_tool_calls"], 0)

    def test_defaults_three_calls_two_words(self):
        proc = run_fake()
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(run_one.parse_telemetry(proc.stdout)["llm_calls"], 3)
        self.assertIn('RESULT {"words_found": 2, "score": 200}', proc.stdout)

    def test_alarm_text_is_printed(self):
        proc = run_fake(FAKE_ALARM="429")
        self.assertIn("fake alarm: 429", proc.stdout)
        self.assertNotIn("fake alarm", run_fake().stdout)

    def test_exit_code(self):
        proc = run_fake(FAKE_EXIT="3", FAKE_WORDS="1")
        self.assertEqual(proc.returncode, 3)
        self.assertIn('RESULT {"words_found": 1, "score": 100}', proc.stdout)


class TestImport(unittest.TestCase):
    def test_import_runs_nothing(self):
        proc = subprocess.run(
            [sys.executable, "-c", "import sys; sys.path.insert(0, sys.argv[1]); import run_one", HARNESS_DIR],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True, timeout=30,
        )
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, "")


if __name__ == "__main__":
    unittest.main()
