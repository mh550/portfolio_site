"""Tests for report.py: summarise and render on rows built in memory, load_rows and the CLI on a tempdir."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS_DIR = os.path.dirname(HERE)
sys.path.insert(0, HARNESS_DIR)

import report  # noqa: E402

REPORT = os.path.join(HARNESS_DIR, "report.py")


def row(name, **overrides):
    """One results.jsonl row as run_one.py writes it; config fields (cities, control_of) go in overrides too."""
    config = {"name": name, "mcps": ["fake"], "env": {}, "expected_words": 2, "cities": overrides.pop("cities", 6),
              "timeout_s": 60, "control_of": overrides.pop("control_of", None)}
    base = {"name": name, "index": 0, "round": "r1", "config": config, "words_found": 2, "score": 200,
            "wall_s": 10.0, "llm_calls": 12, "input_tokens": 1000, "output_tokens": 100, "llm_ms_median": 800.0,
            "tool_calls": 6, "repeated_tool_calls": 0, "exit_reason": "solved", "error_tail": None,
            "started_at": "2026-10-20T15:00:00Z"}
    base.update(overrides)
    return base


def by_name(summary):
    return {r["name"]: r for r in summary["rows"]}


class TestSummarise(unittest.TestCase):
    def test_median_across_repeats(self):
        rows = [row("a", index=i, wall_s=w, llm_calls=c) for i, (w, c) in enumerate([(10, 4), (20, 9), (90, 5)])]
        a = by_name(report.summarise(rows))["a"]
        self.assertEqual(a["wall_s"], 20)
        self.assertEqual(a["llm_calls"], 5)
        self.assertEqual(a["runs"], 3)
        self.assertEqual(a["exit_reasons"], "solved:3")

    def test_null_values_are_skipped(self):
        rows = [row("a", llm_ms_median=None), row("a", index=1, llm_ms_median=600.0, wall_s=None)]
        a = by_name(report.summarise(rows))["a"]
        self.assertEqual(a["llm_ms_median"], 600.0)
        self.assertEqual(a["wall_s"], 10.0)
        a = by_name(report.summarise([row("a", llm_ms_median=None)]))["a"]
        self.assertIsNone(a["llm_ms_median"])

    def test_sort_words_then_wall(self):
        rows = [row("slow2", words_found=2, wall_s=300), row("fast1", words_found=1, wall_s=5),
                row("fast2", words_found=2, wall_s=100)]
        names = [r["name"] for r in report.summarise(rows)["rows"]]
        self.assertEqual(names, ["fast2", "slow2", "fast1"])

    def test_exit_reasons_counted_alphabetically(self):
        rows = [row("a", exit_reason="timeout"), row("a", index=1), row("a", index=2, exit_reason="error"),
                row("a", index=3)]
        a = by_name(report.summarise(rows))["a"]
        self.assertEqual(a["exit_reasons"], "error:1 solved:2 timeout:1")
        self.assertFalse(a["all_solved"])

    def test_noise_flag(self):
        rows = [row("base", wall_s=100), row("base_ctl", wall_s=110, control_of="base"),
                row("other", wall_s=100), row("other_ctl", wall_s=75, control_of="other")]
        noise = {n["name"]: n for n in report.summarise(rows)["noise"]}
        self.assertAlmostEqual(noise["base_ctl"]["gap_pct"], 10.0)
        self.assertFalse(noise["base_ctl"]["noisy"])
        self.assertAlmostEqual(noise["other_ctl"]["gap_pct"], 25.0)
        self.assertTrue(noise["other_ctl"]["noisy"])
        text = report.render(report.summarise(rows))
        self.assertIn("base vs base_ctl: 10.0 %\n", text + "\n")
        self.assertIn("other vs other_ctl: 25.0 % NOISY", text)

    def test_noise_without_its_base_is_na(self):
        summary = report.summarise([row("ctl", control_of="missing")])
        self.assertEqual(summary["noise"], [{"name": "ctl", "control_of": "missing", "gap_pct": None,
                                             "noisy": False}])
        self.assertIn("missing vs ctl: n/a", report.render(summary))

    def test_projection(self):
        summary = report.summarise([row("a", llm_calls=12, cities=6, llm_ms_median=790.0)], prod_cities=21)
        self.assertEqual(summary["projection"], [{"name": "a", "prod_llm_calls": 42.0, "llm_ms_median": 790.0}])
        self.assertIn("a: ~42 LLM calls at 790 ms median", report.render(summary))
        self.assertIn("prod projection (21 cities)", report.render(summary))

    def test_projection_without_cities_is_na(self):
        summary = report.summarise([row("a", cities=None, llm_ms_median=None)])
        self.assertIsNone(summary["projection"][0]["prod_llm_calls"])
        self.assertIn("a: n/a", report.render(summary))

    def test_pick_skips_incomplete_repeat(self):
        rows = [row("fast", wall_s=5), row("fast", index=1, wall_s=6, exit_reason="incomplete"),
                row("slow", wall_s=50), row("slow", index=1, wall_s=60)]
        summary = report.summarise(rows)
        self.assertEqual(summary["rows"][0]["name"], "fast")
        self.assertEqual(summary["pick"], "slow")
        self.assertIn("pick: slow", report.render(summary))

    def test_pick_none(self):
        summary = report.summarise([row("a", exit_reason="timeout")])
        self.assertIsNone(summary["pick"])
        self.assertTrue(report.render(summary).endswith("pick: none solved every repeat"))

    def test_cities_and_control_of_from_latest_row(self):
        rows = [row("a", cities=4), row("a", index=1, cities=8, control_of="b")]
        a = by_name(report.summarise(rows))["a"]
        self.assertEqual((a["cities"], a["control_of"]), (8, "b"))


class TestHandEditedRows(unittest.TestCase):
    """results.jsonl may be hand-edited at the booth: odd values degrade to n/a, never a traceback."""
    def test_odd_config_and_control_of(self):
        rows = [row("a", config="x"), row("b", control_of=["base"]), row("c", control_of=""),
                row("d", wall_s=float("nan"), llm_calls=float("inf"))]
        summary = report.summarise(rows)
        self.assertEqual(summary["noise"], [])
        d = by_name(summary)["d"]
        self.assertEqual((d["wall_s"], d["llm_calls"]), (None, None))
        self.assertEqual(by_name(summary)["a"]["cities"], None)
        report.render(summary)
        report.render(summary, md=True)

    def test_md_escapes_pipes(self):
        line = report.render(report.summarise([row("a|b")]), md=True).splitlines()[2]
        self.assertTrue(line.startswith("| a\\|b | 2 |"), line)


class TestRender(unittest.TestCase):
    def rows(self):
        return [row("terse_trim", wall_s=8.5, llm_calls=2), row("base", wall_s=12.25)]

    def test_text_table_is_aligned(self):
        lines = report.render(report.summarise(self.rows())).splitlines()
        self.assertEqual(lines[0].split(), ["name", "words", "wall_s", "llm", "out_tok", "in_tok", "tools",
                                            "repeats", "exits"])
        self.assertEqual(lines[1].split()[:3], ["terse_trim", "2", "8.5"])
        self.assertEqual(lines[2].split()[:3], ["base", "2", "12.25"])
        end = lines[0].index("wall_s") + len("wall_s")  # numbers right-aligned under their header
        self.assertEqual(lines[1].index(" 8.5 ") + len(" 8.5"), end, lines[:3])
        self.assertEqual(lines[2].index(" 12.25 ") + len(" 12.25"), end, lines[:3])
        self.assertEqual(lines[3], "")

    def test_md_starts_with_header_row(self):
        text = report.render(report.summarise(self.rows()), md=True)
        lines = text.splitlines()
        self.assertTrue(lines[0].startswith("| name | words | wall s |"), lines[0])
        self.assertTrue(lines[1].startswith("|---|"), lines[1])
        self.assertTrue(lines[2].startswith("| terse_trim | 2 | 8.5 |"), lines[2])
        self.assertIn("- terse_trim: ~7 LLM calls at 800 ms median", text)
        self.assertIn("pick: terse_trim", text)

    def test_empty_summary(self):
        self.assertEqual(report.render(report.summarise([])), "no results yet")


class TestLoadRows(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="harness-report-")
        self.addCleanup(shutil.rmtree, self.dir, True)
        self.path = os.path.join(self.dir, "results.jsonl")

    def write(self, lines):
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("".join(line + "\n" for line in lines))

    def test_latest_round_by_default(self):
        self.write([json.dumps(row("a", round="old")), json.dumps(row("b", round="new")),
                    json.dumps(row("c", round="old")), json.dumps(row("d", round="new"))])
        self.assertEqual([r["name"] for r in report.load_rows(self.path)], ["b", "d"])
        self.assertEqual([r["name"] for r in report.load_rows(self.path, "old")], ["a", "c"])

    def test_skips_blank_and_malformed_lines(self):
        self.write([json.dumps(row("a")), "", "{not json", "[1, 2]", json.dumps(row("b")), '{"name": "half'])
        self.assertEqual([r["name"] for r in report.load_rows(self.path)], ["a", "b"])

    def test_bom_and_unreadable_path(self):
        with open(self.path, "w", encoding="utf-8-sig") as f:
            f.write(json.dumps(row("a")) + "\n")
        self.assertEqual([r["name"] for r in report.load_rows(self.path)], ["a"])
        self.assertEqual(report.load_rows(self.dir), [])  # a directory, not a file

    def test_missing_file(self):
        self.assertEqual(report.load_rows(os.path.join(self.dir, "nope.jsonl")), [])


class TestCli(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp(prefix="harness-report-")
        self.addCleanup(shutil.rmtree, self.home, True)

    def report(self, *args):
        env = dict(os.environ, MH_HARNESS_HOME=self.home)
        return subprocess.run([sys.executable, REPORT] + list(args), env=env, stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE, universal_newlines=True, timeout=30)

    def test_no_results_yet(self):
        p = self.report()
        self.assertEqual((p.returncode, p.stdout, p.stderr), (0, "no results yet\n", ""))
        self.assertEqual(os.listdir(self.home), [])

    def test_round_md_and_prod_cities(self):
        with open(os.path.join(self.home, "results.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(row("a", round="one", llm_calls=12)) + "\n")
            f.write(json.dumps(row("b", round="two")) + "\n")
        p = self.report("--round", "one", "--prod-cities", "12", "--md")
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertTrue(p.stdout.startswith("| name |"), p.stdout)
        self.assertIn("| a |", p.stdout)
        self.assertNotIn("| b |", p.stdout)
        self.assertIn("a: ~24 LLM calls", p.stdout)
        self.assertEqual(self.report("--round", "three").stdout, "no results yet\n")


if __name__ == "__main__":
    unittest.main()
