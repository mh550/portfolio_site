"""The round's report: one row per config with medians across repeats, then noise, prod projection and the pick.

Usage: python3 report.py [--round NAME] [--prod-cities 21] [--md]
       (reads results.jsonl, the latest round by default; --md prints a markdown table instead of aligned text)

Rows sort by words found (most first), then median wall s (fastest first). Importing this module runs nothing.
"""
from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional

import run_one

NOISY_PCT = 20.0  # a control pair whose wall-time gap is above this is flagged NOISY
MEDIAN_FIELDS = ["words_found", "wall_s", "llm_calls", "output_tokens", "input_tokens", "tool_calls",
                 "repeated_tool_calls", "llm_ms_median"]
# (header, md header, summary key) for each table column, in order
COLUMNS = [
    ("name", "name", "name"),
    ("words", "words", "words_found"),
    ("wall_s", "wall s", "wall_s"),
    ("llm", "llm", "llm_calls"),
    ("out_tok", "out tok", "output_tokens"),
    ("in_tok", "in tok", "input_tokens"),
    ("tools", "tools", "tool_calls"),
    ("repeats", "repeats", "repeated_tool_calls"),
    ("exits", "exits", "exit_reasons"),
]
LEFT_ALIGNED = {"name", "exit_reasons"}


def load_rows(path: Any, round_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Rows of results.jsonl whose round is round_name (default: the last valid line's); [] if the file is missing."""
    try:
        with open(str(path), encoding="utf-8-sig", errors="replace") as f:  # -sig: a Notepad re-save adds a BOM
            lines = f.read().splitlines()
    except OSError:  # missing, a directory, or locked
        return []
    rows = []
    for line in lines:
        try:
            value = json.loads(line)
        except ValueError:
            continue  # blank, malformed, or a line cut short by an interrupted append
        if isinstance(value, dict) and isinstance(value.get("name"), str):
            rows.append(value)
    if not rows:
        return []
    wanted = rows[-1].get("round") if round_name is None else round_name
    return [r for r in rows if r.get("round") == wanted]


def _number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _median(values: List[Any]) -> Optional[float]:
    numbers = [v for v in values if _number(v)]
    return statistics.median(numbers) if numbers else None


def _summarise_config(name: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    config = rows[-1].get("config")
    if not isinstance(config, dict):
        config = {}
    control_of = config.get("control_of")
    reasons = Counter(str(r.get("exit_reason")) for r in rows)
    out: Dict[str, Any] = {"name": name, "runs": len(rows)}
    for field in MEDIAN_FIELDS:
        out[field] = _median([r.get(field) for r in rows])
    out["cities"] = config.get("cities")
    out["control_of"] = control_of if isinstance(control_of, str) and control_of else None
    out["exit_reasons"] = " ".join("{}:{}".format(k, reasons[k]) for k in sorted(reasons))
    out["all_solved"] = set(reasons) == {"solved"}
    return out


def _sort_key(entry: Dict[str, Any]) -> tuple:
    words = entry["words_found"]
    wall = entry["wall_s"]
    return (-(words if words is not None else -1), wall if wall is not None else float("inf"), entry["name"])


def summarise(rows: List[Dict[str, Any]], prod_cities: int = 21) -> Dict[str, Any]:
    """Group rows by name: medians, exit-reason counts, the noise pairs, the prod projection and the pick."""
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for r in rows:
        grouped.setdefault(r["name"], []).append(r)
    entries = sorted((_summarise_config(name, group) for name, group in grouped.items()), key=_sort_key)
    by_name = {e["name"]: e for e in entries}

    noise = []
    for e in entries:
        if e["control_of"] is None:
            continue
        base = by_name.get(e["control_of"])
        base_wall = base["wall_s"] if base else None
        gap = None
        if base_wall and e["wall_s"] is not None:
            gap = abs(e["wall_s"] - base_wall) / base_wall * 100
        noise.append({"name": e["name"], "control_of": e["control_of"], "gap_pct": gap,
                      "noisy": gap is not None and gap > NOISY_PCT})

    projection = []
    for e in entries:
        cities = e["cities"]
        prod = None
        if e["llm_calls"] is not None and _number(cities) and cities > 0:
            prod = e["llm_calls"] / cities * prod_cities
        projection.append({"name": e["name"], "prod_llm_calls": prod, "llm_ms_median": e["llm_ms_median"]})

    pick = next((e["name"] for e in entries if e["all_solved"]), None)
    return {"round": rows[-1].get("round") if rows else None, "prod_cities": prod_cities, "rows": entries,
            "noise": noise, "projection": projection, "pick": pick}


def _cell(value: Any) -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return str(int(value)) if value.is_integer() else "{:.2f}".format(value).rstrip("0").rstrip(".")
    return str(value)


def _table(entries: List[Dict[str, Any]], md: bool) -> List[str]:
    cells = [[_cell(e[key]) for _, _, key in COLUMNS] for e in entries]
    if md:
        lines = ["| " + " | ".join(md_header for _, md_header, _ in COLUMNS) + " |",
                 "|" + "---|" * len(COLUMNS)]
        return lines + ["| " + " | ".join(text.replace("|", "\\|") for text in row) + " |" for row in cells]
    headers = [header for header, _, _ in COLUMNS]
    widths = [max(len(text) for text in column) for column in zip(headers, *cells)]
    lines = []
    for row in [headers] + cells:
        parts = [text.ljust(w) if key in LEFT_ALIGNED else text.rjust(w)
                 for text, w, (_, _, key) in zip(row, widths, COLUMNS)]
        lines.append("  ".join(parts).rstrip())
    return lines


def render(summary: Dict[str, Any], md: bool = False) -> str:
    """The table, a blank line, then the noise, prod projection and pick sections, as aligned text or markdown."""
    if not summary["rows"]:
        return "no results yet"
    item = "- " if md else "  "
    lines = _table(summary["rows"], md) + ["", "noise"]
    for n in summary["noise"]:
        gap = "n/a" if n["gap_pct"] is None else "{:.1f} %".format(n["gap_pct"])
        lines.append("{}{} vs {}: {}{}".format(item, n["control_of"], n["name"], gap, " NOISY" if n["noisy"] else ""))
    if not summary["noise"]:
        lines.append(item + "no control_of pairs")
    lines += ["", "prod projection ({} cities)".format(summary["prod_cities"])]
    for p in summary["projection"]:
        if p["prod_llm_calls"] is None:
            lines.append("{}{}: n/a".format(item, p["name"]))
            continue
        ms = "n/a" if p["llm_ms_median"] is None else "{:.0f}".format(p["llm_ms_median"])
        lines.append("{}{}: ~{:.0f} LLM calls at {} ms median".format(item, p["name"], p["prod_llm_calls"], ms))
    pick = summary["pick"]
    lines += ["", "pick: " + (pick if pick is not None else "none solved every repeat")]
    return "\n".join(lines)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Summarise results.jsonl, one row per config.")
    parser.add_argument("--round", help="round to report (a configs file's stem), default the latest")
    parser.add_argument("--prod-cities", type=run_one.positive_int, default=21,
                        help="cities in a prod run, for the projection, default 21")
    parser.add_argument("--md", action="store_true", help="print a markdown table instead of aligned text")
    args = parser.parse_args(argv)
    rows = load_rows(Path(run_one.harness_home()) / "results.jsonl", args.round)
    print(render(summarise(rows, args.prod_cities), md=args.md), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
