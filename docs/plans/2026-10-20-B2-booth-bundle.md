# B2: the booth bundle (`public/b/h.tgz`)

Spec: `docs/specs/2026-10-20-booth-harness-bundle.md` §2 (B2), D41, D50. Hand-off note: `docs/notes/booth-bundle.md`.

## Files

| File | What |
|---|---|
| `scripts/build-booth-bundle.mjs` | GNU tar (`--sort=name --owner=0 --group=0 --numeric-owner --mtime='2026-10-20 00:00Z' --mode=go-w,a+rX --format=ustar`, excludes `__pycache__`, `*.pyc`, `results.jsonl`, `logs`, `work`) piped into `zlib.gzipSync` level 9; writes `public/b/h.tgz` |
| `package.json` | `"booth-bundle": "node scripts/build-booth-bundle.mjs"` (scripts block only) |
| `public/b/h.tgz` | committed output, 14 files, 24887 bytes at B2-01 |
| `src/__tests__/lib/booth-bundle.test.ts` | node env, 5 tests: gzip magic, one top-level `mh_harness`, same file list, same bytes, the bundle's unit tests pass from the extracted copy (180 s timeout; skipped with a logged reason without `python3`) |
| `docs/notes/booth-bundle.md` | curl lines, per-file fallback, the assistant's first command, rebuild, unlinked on purpose |

## Mutation check (B2-01)

```bash
printf 'x' >> public/b/mh_harness/README.md
npx jest src/__tests__/lib/booth-bundle.test.ts -t "same bytes"   # ✕ red: Received ["README.md"]
npm run booth-bundle                                               # wrote public/b/h.tgz (14 files, 24888 bytes)
npx jest src/__tests__/lib/booth-bundle.test.ts -t "same bytes"   # ✓ green
# README.md restored from a copy, rebuilt: sha256 1266b778… again, git status clean
```

Reproducibility: two `npm run booth-bundle` in a row give the same sha256 (`1266b778…`), also with `__pycache__/`,
`*.pyc`, `results.jsonl`, `logs/` and `work/` present in the folder (all excluded).

## What Michael will see

Checked against the init server (`next dev`, port 7833) from empty temp dirs, run 2026-10-20 (B2-02).

```bash
curl -sL http://localhost:7833/b/h.tgz | tar xz        # one entry: mh_harness/ (17 members, same list as tar -tzf public/b/h.tgz)
curl -sI http://localhost:7833/b/h.tgz | head -1       # HTTP/1.1 200 OK
curl -sLO http://localhost:7833/b/mh_harness/PROMPTS.md  # per-file fallback: cmp with public/b/mh_harness/PROMPTS.md is identical
cd mh_harness
python3 -m unittest discover -s tests                  # Ran 99 tests in 21.4s ... OK
python3 sweep.py configs/round1.json                   # refusing to start: config "base" field mcps[0] still has a placeholder: "<current set>"  (exit 2)
python3 sweep.py configs/fake-round.json --parallel 4 --interval 1
python3 report.py --md
```

Trimmed output of the fake round (about 2 s): status lines `[base-0] 2s llm=2 tools=2`, four `<name>-0: solved words=2 wall=2.04s` lines, then

```
name        words  wall_s  llm  out_tok  in_tok  tools  repeats  exits
base            2    2.04    3      300    6000      3        0  solved:1
base_ctl        2    2.04    3      300    6000      3        0  solved:1
terse           2    2.04    3      300    6000      3        0  solved:1
terse_trim      2    2.04    2      150    3000      2        0  solved:1
pick: base
```

`report.py --md` prints the same round as a `| name | words | wall s | ...` markdown table.

- Windows: the tarball is ustar (`tarfile.open(...).format == tarfile.USTAR_FORMAT`), so bsdtar (Windows `tar.exe`) reads it; bsdtar is not installed here, so that is not run. Python's stdlib opens it (17 members, equal to `tar -tzf | wc -l`), which is the fallback extractor.
- Nothing points at `/b/`: no hit in `src/` outside the bundle test's comments, none in `.harness/smoke-routes.txt`, 0 in `/sitemap.xml`, no line in `/robots.txt`. Smoke green, no route changed. No fix was needed.

## Review

Filled in by B2-03.
