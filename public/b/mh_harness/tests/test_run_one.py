"""End-to-end tests for run_one.py against fake_game.py, each in its own MH_HARNESS_HOME tempdir."""
from __future__ import annotations

import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS_DIR = os.path.dirname(HERE)
sys.path.insert(0, HARNESS_DIR)

import adapter  # noqa: E402
import run_one  # noqa: E402

RUN_ONE = os.path.join(HARNESS_DIR, "run_one.py")

FIELDS = [
    "name", "index", "round", "config", "words_found", "score", "wall_s", "llm_calls", "input_tokens",
    "output_tokens", "llm_ms_median", "tool_calls", "repeated_tool_calls", "exit_reason", "error_tail", "started_at",
]


def make_config(name="t", env=None, expected_words=2, timeout_s=20):
    return {"name": name, "mcps": ["fake"], "env": env or {}, "expected_words": expected_words, "cities": 6,
            "timeout_s": timeout_s, "control_of": None}


def pid_alive(pid):
    """True while pid runs. A zombie counts as gone (killed, waiting for a reaper we don't control)."""
    if os.name == "nt":  # os.kill(pid, 0) would terminate the process on Windows
        out = subprocess.run(["tasklist", "/FI", "PID eq {}".format(pid)], stdout=subprocess.PIPE).stdout
        return str(pid).encode() in out
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    try:
        with open("/proc/{}/stat".format(pid)) as f:
            return f.read().rsplit(")", 1)[1].split()[0] != "Z"
    except OSError:
        return True


def kill_quietly(pid):
    try:
        os.kill(pid, signal.SIGKILL)
    except OSError:
        pass


def wait_for_pid_line(path, timeout=10):
    """The pid printed as the first line of path (HARNESS_PID <pid> or just <pid>), once it is complete."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if os.path.exists(path):
            with open(path, "rb") as f:
                first = f.readline().decode()
            if first.endswith("\n"):
                return int(first.split()[-1])
        time.sleep(0.05)
    return None


def wrapped_run_one(game_argv):
    """argv that runs run_one.main with adapter.build_command swapped for game_argv (sweep-style tests)."""
    code = ("import sys; sys.path.insert(0, {!r}); import adapter, run_one; "
            "adapter.build_command = lambda config, workdir: ({!r}, workdir); "
            "sys.exit(run_one.main(sys.argv[1:]))").format(HARNESS_DIR, game_argv)
    return [sys.executable, "-c", code]


class HarnessHomeCase(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="harness-test-")
        self.addCleanup(shutil.rmtree, self.home, True)

    def write_config(self, config, filename="cfg.json"):
        path = os.path.join(self.home, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(config, f)
        return path

    def env(self, **extra):
        env = {k: v for k, v in os.environ.items() if not k.startswith("FAKE_")}
        env["MH_HARNESS_HOME"] = self.home
        env.update(extra)
        return env

    def run_one(self, config, *args, env=None, timeout=30):
        path = self.write_config(config)
        return subprocess.run([sys.executable, RUN_ONE, path] + list(args), env=env or self.env(),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)

    def rows(self):
        path = os.path.join(self.home, "results.jsonl")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    def log_text(self, name, index=0):
        with open(os.path.join(self.home, "logs", "{}-{}.log".format(name, index)), encoding="utf-8") as f:
            return f.read()


class TestAdapter(unittest.TestCase):
    def test_build_command_runs_fake_game(self):
        argv, cwd = adapter.build_command(make_config(), "/tmp/w")
        self.assertEqual(argv, [sys.executable, os.path.join(HARNESS_DIR, "fake_game.py")])
        self.assertTrue(os.path.isabs(argv[1]))
        self.assertEqual(cwd, "/tmp/w")

    def test_parse_result_takes_last_result_line(self):
        log = 'RESULT {"words_found": 1, "score": 100}\nnoise\nRESULT {"words_found": 2, "score": 200}\n'
        self.assertEqual(adapter.parse_result(log), {"words_found": 2, "score": 200})

    def test_parse_result_without_result(self):
        self.assertEqual(adapter.parse_result("no result here\n"), {"words_found": 0, "score": None})

    def test_parse_result_malformed(self):
        self.assertEqual(adapter.parse_result("RESULT {oops\n"), {"words_found": 0, "score": None})


class TestRunOne(HarnessHomeCase):
    def test_solved_row(self):
        p = self.run_one(make_config(env={"FAKE_SLEEP_S": "0.2", "FAKE_WORDS": "2"}))
        self.assertEqual(p.returncode, 0, p.stderr)
        [row] = self.rows()
        self.assertEqual(row["exit_reason"], "solved")
        self.assertGreater(row["wall_s"], 0)
        self.assertEqual(row["llm_calls"], 3)
        self.assertEqual(row["tool_calls"], 3)
        self.assertEqual(row["llm_ms_median"], 200.0)
        self.assertIsInstance(row["llm_ms_median"], float)
        self.assertEqual(row["words_found"], 2)
        self.assertEqual(row["score"], 200)
        self.assertIsNone(row["error_tail"])
        self.assertEqual(row["index"], 0)
        self.assertEqual(row["round"], "cfg")
        self.assertRegex(row["started_at"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")
        self.assertIn('RESULT {"words_found": 2', self.log_text("t"))
        self.assertIn(b"t-0: solved words=2", p.stdout)

    def test_incomplete(self):
        p = self.run_one(make_config(env={"FAKE_WORDS": "1"}))
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(self.rows()[0]["exit_reason"], "incomplete")

    def test_error_has_tail(self):
        p = self.run_one(make_config(env={"FAKE_EXIT": "2", "FAKE_LLM_CALLS": "12"}))
        self.assertEqual(p.returncode, 1)
        row = self.rows()[0]
        self.assertEqual(row["exit_reason"], "error")
        tail = row["error_tail"]
        self.assertIsInstance(tail, list)
        self.assertEqual(len(tail), 20)  # 1 + 12*2 + 1 = 26 log lines, last 20 kept
        self.assertTrue(all(isinstance(line, str) for line in tail))
        self.assertTrue(tail[-1].startswith("RESULT "))

    def test_timeout_kills_tree(self):
        start = time.monotonic()
        p = self.run_one(make_config(env={"FAKE_SLEEP_S": "30", "FAKE_LLM_CALLS": "1"}, timeout_s=1), timeout=15)
        elapsed = time.monotonic() - start
        self.assertLess(elapsed, 5)
        self.assertEqual(p.returncode, 1)
        row = self.rows()[0]
        self.assertEqual(row["exit_reason"], "timeout")
        first = self.log_text("t").splitlines()[0]
        self.assertTrue(first.startswith("HARNESS_PID "), first)
        self.assertFalse(pid_alive(int(first.split()[1])))

    def test_float_timeout(self):
        p = self.run_one(make_config(env={"FAKE_SLEEP_S": "30", "FAKE_LLM_CALLS": "0"}, timeout_s=0.5), timeout=15)
        self.assertEqual(p.returncode, 1)
        self.assertEqual(self.rows()[0]["exit_reason"], "timeout")

    def test_config_env_reaches_child(self):
        p = self.run_one(make_config(env={"FAKE_WORDS": "5"}), env=self.env(FAKE_WORDS="1"))
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(self.rows()[0]["words_found"], 5)

    def test_child_env_has_workdir_and_unbuffered(self):
        # fake_game ignores these, so check the env builder run_one uses directly.
        env = run_one.child_env({"env": {"X_CFG": "1"}}, os.path.join(self.home, "work", "t-0"))
        self.assertEqual(env["X_CFG"], "1")
        self.assertEqual(env["PYTHONUNBUFFERED"], "1")
        self.assertTrue(os.path.isabs(env["HARNESS_WORKDIR"]))
        self.assertEqual(env["PATH"], os.environ.get("PATH"))

    def test_row_has_exactly_16_fields(self):
        self.run_one(make_config(), "--index", "3", "--round", "r9")
        [row] = self.rows()
        self.assertEqual(list(row.keys()), FIELDS)
        self.assertEqual(row["index"], 3)
        self.assertEqual(row["round"], "r9")
        self.assertEqual(row["config"], make_config())

    def test_writes_only_under_harness_home(self):
        before = set(os.listdir(HARNESS_DIR))
        self.run_one(make_config(name="w"), "--index", "1")
        self.assertTrue(os.path.isdir(os.path.join(self.home, "work", "w-1")))
        self.assertTrue(os.path.isfile(os.path.join(self.home, "logs", "w-1.log")))
        self.assertTrue(os.path.isfile(os.path.join(self.home, "results.jsonl")))
        after = set(os.listdir(HARNESS_DIR)) - {"__pycache__"}
        self.assertEqual(after, before - {"__pycache__"})

    def test_rows_append(self):
        self.run_one(make_config())
        self.run_one(make_config(), "--index", "1")
        self.assertEqual([r["index"] for r in self.rows()], [0, 1])

    @unittest.skipIf(os.name == "nt", "POSIX signals")
    def test_sigterm_exits_130_without_row(self):
        self._interrupt(signal.SIGTERM)

    @unittest.skipIf(os.name == "nt", "POSIX signals")
    def test_sigint_exits_130_without_row(self):
        self._interrupt(signal.SIGINT)

    def _interrupt(self, sig):
        path = self.write_config(make_config(env={"FAKE_SLEEP_S": "30", "FAKE_LLM_CALLS": "1"}, timeout_s=60))
        proc = subprocess.Popen([sys.executable, RUN_ONE, path], env=self.env(),
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        game_pid = wait_for_pid_line(os.path.join(self.home, "logs", "t-0.log"))
        self.assertIsNotNone(game_pid, "game never started")
        proc.send_signal(sig)
        proc.communicate(timeout=10)
        self.assertEqual(proc.returncode, 130)
        self.assertEqual(self.rows(), [])
        self.assertFalse(pid_alive(game_pid))

    def test_bad_config_exits_2_before_starting(self):
        config = make_config()
        config["timeout_s"] = None
        p = self.run_one(config)
        self.assertEqual(p.returncode, 2)
        self.assertIn(b"timeout_s", p.stderr)
        self.assertEqual(self.rows(), [])
        self.assertFalse(os.path.exists(os.path.join(self.home, "logs")))

    def test_start_failure_is_an_error_row(self):
        path = self.write_config(make_config())
        p = subprocess.run(wrapped_run_one([os.path.join(self.home, "no-such-game")]) + [path], env=self.env(),
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        self.assertEqual(p.returncode, 1, p.stderr)
        row = self.rows()[0]
        self.assertEqual(row["exit_reason"], "error")
        self.assertIn("could not start", row["error_tail"][-1])

    @unittest.skipIf(os.name == "nt", "POSIX signals")
    def test_sweep_kill_reaches_game_that_ignores_sigterm(self):
        # sweep kill_tree()s run_one (SIGKILL after 2 s); run_one must SIGKILL the game before that (D47).
        game = [sys.executable, "-c", "import os, signal, time; signal.signal(signal.SIGTERM, signal.SIG_IGN); "
                                      "print(os.getpid(), flush=True); time.sleep(30)"]
        path = self.write_config(make_config(timeout_s=60))
        with open(os.path.join(self.home, "run_one.out"), "wb") as out:
            proc = run_one.start_detached(wrapped_run_one(game) + [path], self.home, self.env(), out)
            game_pid = wait_for_pid_line(os.path.join(self.home, "logs", "t-0.log"))
            self.assertIsNotNone(game_pid, "game never started")
            self.addCleanup(kill_quietly, game_pid)  # don't leave a 30 s orphan behind if this test fails
            run_one.kill_tree(proc)
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline and pid_alive(game_pid):
            time.sleep(0.05)
        self.assertFalse(pid_alive(game_pid))
        self.assertEqual(proc.returncode, 130)
        self.assertEqual(self.rows(), [])


@unittest.skipIf(os.name == "nt", "process groups are POSIX; Windows uses taskkill /T")
class TestProcessControl(unittest.TestCase):
    def test_kill_tree_on_exited_process(self):
        with tempfile.TemporaryFile() as log:
            proc = run_one.start_detached([sys.executable, "-c", "pass"], os.getcwd(), dict(os.environ), log)
            proc.wait(timeout=10)
            run_one.kill_tree(proc)  # must not raise
        self.assertEqual(proc.returncode, 0)

    def test_kill_tree_reaches_grandchild(self):
        code = ("import subprocess, sys, time; "
                "p = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)']); "
                "print(p.pid, flush=True); time.sleep(30)")
        with tempfile.TemporaryFile() as log:
            proc = run_one.start_detached([sys.executable, "-c", code], os.getcwd(), dict(os.environ), log)
            deadline = time.monotonic() + 10
            grandchild = None
            while time.monotonic() < deadline and grandchild is None:
                log.seek(0)
                text = log.read().decode()
                if text.endswith("\n"):
                    grandchild = int(text.split()[0])
                time.sleep(0.05)
            self.assertIsNotNone(grandchild)
            run_one.kill_tree(proc)
        self.assertIsNotNone(proc.returncode)
        # The grandchild is not ours to reap; once killed it is reparented to init and reaped there.
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline and pid_alive(grandchild):
            time.sleep(0.05)
        self.assertFalse(pid_alive(grandchild))


class TestImport(unittest.TestCase):
    def test_main_and_shared_names_exist(self):
        for name in ("harness_home", "kill_tree", "start_detached", "main", "parse_telemetry", "exit_reason"):
            self.assertTrue(callable(getattr(run_one, name)), name)

    def test_harness_home_override(self):
        old = os.environ.get("MH_HARNESS_HOME")
        try:
            os.environ["MH_HARNESS_HOME"] = "/tmp/somewhere"
            self.assertEqual(str(run_one.harness_home()), os.path.realpath("/tmp/somewhere"))
            os.environ["MH_HARNESS_HOME"] = "rel"
            self.assertEqual(str(run_one.harness_home()), os.path.join(os.path.realpath(os.getcwd()), "rel"))
            del os.environ["MH_HARNESS_HOME"]
            self.assertEqual(str(run_one.harness_home()), HARNESS_DIR)
        finally:
            if old is None:
                os.environ.pop("MH_HARNESS_HOME", None)
            else:
                os.environ["MH_HARNESS_HOME"] = old


if __name__ == "__main__":
    unittest.main()
