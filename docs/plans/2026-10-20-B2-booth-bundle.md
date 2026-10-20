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

Filled in by B2-02 (the curl | tar check against the init server).

## Review

Filled in by B2-03.
