"""End-to-end tests for sweep.py against fake_game.py, each in its own MH_HARNESS_HOME tempdir."""
from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS_DIR = os.path.dirname(HERE)
sys.path.insert(0, HARNESS_DIR)
sys.path.insert(0, HERE)

import sweep  # noqa: E402
from test_run_one import HarnessHomeCase, kill_quietly, make_config, pid_alive, wait_for_pid_line  # noqa: E402

SWEEP = os.path.join(HARNESS_DIR, "sweep.py")
ROUND1 = os.path.join(HARNESS_DIR, "configs", "round1.json")
FAKE_ROUND = os.path.join(HARNESS_DIR, "configs", "fake-round.json")


class SweepCase(HarnessHomeCase):
    def sweep(self, configs_path, *args, timeout=30):
        return subprocess.run([sys.executable, SWEEP, configs_path] + list(args), env=self.env(),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout,
                              universal_newlines=True)

    def configs(self, configs, filename="round-t.json"):
        return self.write_config(configs, filename)

    def home_entries(self):
        return sorted(os.listdir(self.home))


class TestSweep(SweepCase):
    def test_four_runs_in_parallel_under_5s(self):
        path = self.configs([make_config("c{}".format(i), env={"FAKE_SLEEP_S": "2"}) for i in range(4)])
        start = time.monotonic()
        p = self.sweep(path, "--parallel", "4")
        wall = time.monotonic() - start
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertLess(wall, 5)
        rows = self.rows()
        self.assertEqual(sorted(r["name"] for r in rows), ["c0", "c1", "c2", "c3"])
        self.assertEqual({r["round"] for r in rows}, {"round-t"})
        self.assertEqual({r["exit_reason"] for r in rows}, {"solved"})
        self.assertIn("report: 4 runs ended", p.stdout)

    def test_parallel_limit(self):
        path = self.configs([make_config("c{}".format(i), env={"FAKE_SLEEP_S": "1"}) for i in range(4)])
        start = time.monotonic()
        p = self.sweep(path, "--parallel", "2")
        wall = time.monotonic() - start
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertGreaterEqual(wall, 2)
        self.assertEqual(len(self.rows()), 4)

    def test_writes_single_config_per_run(self):
        path = self.configs([make_config("a"), make_config("b", expected_words=1)])
        p = self.sweep(path)
        self.assertEqual(p.returncode, 0, p.stderr)
        with open(os.path.join(self.home, "work", "b-0", "config.json"), encoding="utf-8") as f:
            self.assertEqual(json.load(f), make_config("b", expected_words=1))
        self.assertIn("a-0: solved words=2", p.stdout)  # run_one's summary line is echoed when the run ends

    def test_placeholder_refusal(self):
        p = self.sweep(ROUND1)
        self.assertEqual(p.returncode, 2)
        self.assertIn('refusing to start: config "base" field mcps[0] still has a placeholder: "<current set>"',
                      p.stderr)
        self.assertEqual(p.stdout, "")
        self.assertEqual(self.home_entries(), [])

    def test_dry_run_prints_commands_and_writes_nothing(self):
        p = self.sweep(FAKE_ROUND, "--dry-run")
        self.assertEqual(p.returncode, 0, p.stderr)
        lines = [line for line in p.stdout.splitlines() if line.startswith("cmd: ")]
        self.assertEqual(len(lines), 4)
        self.assertIn("fake_game.py  cwd: " + os.path.join(self.home, "work", "base-0"), lines[0])
        self.assertEqual(p.stderr, "")
        self.assertEqual(self.home_entries(), [])

    def test_dry_run_repeat_names_each_index(self):
        p = self.sweep(FAKE_ROUND, "--dry-run", "--repeat", "2")
        lines = [line for line in p.stdout.splitlines() if line.startswith("cmd: ")]
        self.assertEqual(len(lines), 8)
        self.assertTrue(lines[1].endswith(os.path.join("work", "base-1")), lines[1])

    def test_dry_run_warns_on_placeholders(self):
        p = self.sweep(ROUND1, "--dry-run")
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(len([line for line in p.stdout.splitlines() if line.startswith("cmd: ")]), 6)
        warnings = [line for line in p.stderr.splitlines() if line.startswith("warning: ")]
        self.assertEqual(len(warnings), 6)
        self.assertIn('warning: config "terse_mcpB" field mcps[0] still has a placeholder: "<set B>"', p.stderr)
        self.assertEqual(self.home_entries(), [])

    def test_alarm_429(self):
        path = self.configs([make_config("hot", env={"FAKE_ALARM": "429", "FAKE_SLEEP_S": "2"})])
        p = self.sweep(path, "--interval", "0.5")
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertRegex(p.stdout, r"\[hot-0\] \d+s llm=\d+ tools=\d+ ALARM: 429")

    def test_alarm_no_tool_call(self):
        path = self.configs([make_config("slow", env={"FAKE_SLEEP_S": "3", "FAKE_LLM_CALLS": "1"})])
        p = self.sweep(path, "--alarm-after", "0.5", "--interval", "0.5")
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn("[slow-0] ", p.stdout)
        self.assertIn("llm=0 tools=0 ALARM: no tool call after 0.5 s", p.stdout)

    def test_status_line_without_alarm(self):
        path = self.configs([make_config("calm", env={"FAKE_SLEEP_S": "2"})])
        p = self.sweep(path, "--interval", "0.5")
        status = [line for line in p.stdout.splitlines() if line.startswith("[calm-0] ")]
        self.assertTrue(status, p.stdout)
        self.assertRegex(status[0], r"^\[calm-0\] \d+s llm=\d+ tools=\d+$")

    def test_repeat_two_gives_index_0_and_1(self):
        path = self.configs([make_config("r")])
        p = self.sweep(path, "--repeat", "2")
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(sorted(r["index"] for r in self.rows()), [0, 1])
        self.assertTrue(os.path.isdir(os.path.join(self.home, "work", "r-1")))
        self.assertIn("report: 2 runs ended", p.stdout)

    def test_bad_configs_file_exits_2(self):
        for configs in ({"name": "x"}, [make_config("x"), make_config("x")], [{"mcps": []}]):
            with self.subTest(configs=configs):
                p = self.sweep(self.configs(configs))
                self.assertEqual(p.returncode, 2)
                self.assertIn("refusing to start", p.stderr)
                self.assertEqual(self.home_entries(), ["round-t.json"])

    @unittest.skipIf(os.name == "nt", "POSIX signals")
    def test_ctrl_c_kills_every_run_and_exits_130(self):
        path = self.configs([make_config("k{}".format(i), env={"FAKE_SLEEP_S": "30"}) for i in range(2)])
        proc = subprocess.Popen([sys.executable, SWEEP, path], env=self.env(), stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE)
        pids = [wait_for_pid_line(os.path.join(self.home, "logs", "k{}-0.log".format(i))) for i in range(2)]
        for pid in pids:
            if pid:
                self.addCleanup(kill_quietly, pid)
        self.assertNotIn(None, pids)
        proc.send_signal(signal.SIGINT)
        try:
            out, err = proc.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.communicate()
            self.fail("sweep did not exit after SIGINT")
        self.assertEqual(proc.returncode, 130, err)
        for pid in pids:
            self.assertFalse(pid_alive(pid), "game {} still running".format(pid))
        self.assertEqual(self.rows(), [])
        self.assertNotIn(b"report:", out)


class TestFindPlaceholders(unittest.TestCase):
    def test_paths(self):
        configs = [{"name": "a", "mcps": ["ok", "<set B>"], "env": {"AGENT_PROMPT": "<prompt>", "N": "1"}},
                   {"name": "<who>", "mcps": []}]
        self.assertEqual(sweep.find_placeholders(configs), [
            ("a", "mcps[1]", "<set B>"),
            ("a", "env.AGENT_PROMPT", "<prompt>"),
            ("<who>", "name", "<who>"),
        ])

    def test_none_in_fake_round(self):
        with open(FAKE_ROUND, encoding="utf-8") as f:
            self.assertEqual(sweep.find_placeholders(json.load(f)), [])

    def test_lone_angle_bracket_counts(self):
        self.assertEqual(sweep.find_placeholders([{"name": "a", "env": {"X": "a > b"}}]), [("a", "env.X", "a > b")])


class TestFindAlarm(unittest.TestCase):
    def alarm(self, text, elapsed_s=0.0, alarm_after_s=60.0, tool_calls=1):
        return sweep.find_alarm(text, elapsed_s, alarm_after_s, tool_calls)

    def test_harness_lines_never_alarm(self):
        self.assertIsNone(self.alarm('HARNESS_LLM {"in": 429, "out": 1}\nHARNESS_PID 429\n'))

    def test_reasons(self):
        self.assertEqual(self.alarm("HTTP 429 Too Many Requests"), "429")
        self.assertEqual(self.alarm("openai: Rate Limit reached"), "rate limit")
        self.assertEqual(self.alarm("Connection Refused on :8080"), "connection refused")
        self.assertEqual(self.alarm("OSError: [Errno 98] Address already in use"), "address already in use")
        self.assertEqual(self.alarm("Traceback (most recent call last):"), "Traceback")

    def test_order_is_429_first(self):
        self.assertEqual(self.alarm("Traceback (most recent call last):\nrate limit\n429\n"), "429")

    def test_no_false_alarms(self):
        self.assertIsNone(self.alarm("took 4290 ms\nprinting a traceback\nall fine\n"))

    def test_no_tool_call(self):
        self.assertIsNone(self.alarm("", elapsed_s=59.9, tool_calls=0))
        self.assertEqual(self.alarm("", elapsed_s=60.0, tool_calls=0), "no tool call after 60 s")
        self.assertIsNone(self.alarm("", elapsed_s=600.0, tool_calls=1))

    def test_text_alarm_beats_no_tool_call(self):
        self.assertEqual(self.alarm("429", elapsed_s=99, tool_calls=0), "429")


if __name__ == "__main__":
    unittest.main()
