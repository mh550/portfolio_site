"""Tests for README.md: one screen, every shipped file named, the four commands, no unfilled placeholders."""
from __future__ import annotations

import os
import re
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS_DIR = os.path.dirname(HERE)
README = os.path.join(HARNESS_DIR, "README.md")


def shipped_files():
    """Every file in the bundle, relative and with '/', minus README itself and run-time output."""
    found = []
    for root, dirs, files in os.walk(HARNESS_DIR):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "logs", "work")]
        for name in files:
            rel = os.path.relpath(os.path.join(root, name), HARNESS_DIR).replace(os.sep, "/")
            if rel not in ("README.md", "results.jsonl"):
                found.append(rel)
    return sorted(found)


class TestReadme(unittest.TestCase):
    def setUp(self):
        with open(README, encoding="utf-8") as f:
            self.text = f.read()

    def test_one_screen(self):
        self.assertLess(len(self.text.splitlines()), 60)

    def test_names_every_file(self):
        missing = [rel for rel in shipped_files() if rel not in self.text]
        self.assertEqual(missing, [])

    def test_four_commands(self):
        for command in ("python3 -m unittest discover -s tests", "--dry-run",
                        "sweep.py configs/round1.json --parallel 6", "report.py"):
            self.assertIn(command, self.text)

    def test_windows_and_output_notes(self):
        self.assertIn("Windows", self.text)
        self.assertRegex(self.text, r"`python`")
        for out in ("results.jsonl", "logs/", "work/"):
            self.assertIn(out, self.text)

    def test_no_placeholders(self):
        self.assertIsNone(re.search(r"<[A-Za-z]|TODO|\[X\]", self.text))


if __name__ == "__main__":
    unittest.main()
