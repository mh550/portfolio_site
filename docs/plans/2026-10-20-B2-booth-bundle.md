# B2: the booth bundle (`public/b/h.tgz`)

Spec: `docs/specs/2026-10-20-booth-harness-bundle.md` §2 (B2), D41, D50. Hand-off note: `docs/notes/booth-bundle.md`.

## Files

| File | What |
|---|---|
| `scripts/build-booth-bundle.mjs` | `git ls-files mh_harness` plus parent folders, sorted, into GNU tar (`--no-recursion --dereference --owner=0 --group=0 --numeric-owner --mtime='2026-10-20 00:00Z' --mode=a-x,a=rX,u+w --format=ustar --null -T -`, `TAR_OPTIONS=''`, `LC_ALL=C`) piped into `zlib.gzipSync` level 9 with the OS byte pinned to 3; writes `public/b/h.tgz` or the path given as its argument (D41, D57; B2-01 used `--sort=name` and `--exclude`s, replaced in B2-03) |
| `package.json` | `"booth-bundle": "node scripts/build-booth-bundle.mjs"` (scripts block only) |
| `public/b/h.tgz` | committed output, 14 files (17 members with the 3 folders), 24887 bytes, unchanged by B2-03 |
| `src/__tests__/lib/booth-bundle.test.ts` | node env, 6 tests: gzip magic, one top-level `mh_harness`, file list equals `git ls-files`, same bytes, a rebuild into a temp dir gives the same tar stream (skipped with a logged reason without GNU tar), the bundle's unit tests pass from the extracted copy (180 s timeout; skipped with a logged reason without a working `python3`) |
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

- Windows: the tarball is ustar (header bytes 257–264 are `ustar\0 00`; B2-02 cited `tarfile.open(...).format`, which reports the write default, not the archive's, corrected in B2-03), so bsdtar (Windows `tar.exe`) reads it; bsdtar is not installed here, so that is not run. Python's stdlib opens it (17 members, equal to `tar -tzf | wc -l`), which is the fallback extractor.
- Nothing points at `/b/`: no hit in `src/` outside the bundle test's comments, none in `.harness/smoke-routes.txt`, 0 in `/sitemap.xml`, no line in `/robots.txt`. Smoke green, no route changed. No fix was needed.

## Review

B2-03, 2026-10-20. Opus read `git diff 3229eaf..HEAD` (B1-07's commit to B2-02's) from `/tmp/b2.diff`. It found no
Critical findings, 3 Important and 10 Minor. The committed `h.tgz` was correct: 17 members, owner 0/0, mtime
1792454400, files 0644, folders 0755, ustar magic, no gzip timestamp.

| # | Sev | Where | Finding | Outcome |
|---|---|---|---|---|
| 1 | Important | `booth-bundle.test.ts:49` | The test ran the extracted tree through the same exclusion filter as the folder, so a tarball holding `__pycache__/`, `results.jsonl`, `logs/` or `work/` passed | Fixed: the extracted list is compared, unfiltered, with `git ls-files` |
| 2 | Important | `build-booth-bundle.mjs:15-31` | Built from the working tree: untracked or ignored junk (`.pytest_cache/`, `.DS_Store`, `.venv/`) shipped and the test stayed green | Fixed (D57): members come from `git ls-files`. RED first: with `mh_harness/.pytest_cache/CACHEDIR.TAG` present, the old script wrote 15 files and the new list test failed (`+ ".pytest_cache/CACHEDIR.TAG"`). GREEN: the new script wrote 14 files, byte-identical to the committed `h.tgz`, with the junk still there |
| 3 | Important | `booth-bundle.test.ts:62-82` | The 99 Python tests add about 21 s to every `npm test` / `check.sh`, with flake risk under load | Recorded as D58 *default*: kept, because §2 B2 asks for it; gating it behind `BOOTH_PY=1` is Michael's call |
| 4 | Minor | `build-booth-bundle.mjs:39` | The gzip OS byte and zlib output vary by platform and node version | OS byte pinned to 3; the test compares gunzipped tar streams; the note says the bytes match only with the same node zlib |
| 5 | Minor | `build-booth-bundle.mjs:15-33` | `TAR_OPTIONS` and a checkout's exec bits (WSL, `core.fileMode=false`) could change the bytes | `TAR_OPTIONS=''`, `LC_ALL=C`, `--mode=a-x,a=rX,u+w` |
| 6 | Minor | excludes | Unanchored `logs`/`work` would drop any folder of that name at any depth | Gone with D57: there is no exclusion list now |
| 7 | Minor | script, test | Symlinks would be stored as links, which Windows `tar.exe` often can't create | `--dereference` |
| 8 | Minor | `booth-bundle.test.ts:31,65` | A missing tar reported "failed: null"; the Windows Store `python` alias would fail instead of skip | Reports `tar.error?.message`; skips unless `python --version` exits 0 |
| 9 | Minor | `build-booth-bundle.mjs:42-43` | Ran tar a second time, unchecked, only to count files | Count comes from the `git ls-files` list |
| 10 | Minor | `booth-bundle.md:24-25` | The per-file fallback left out `configs/fake-round.json` | Added; `tests/` marked optional |
| 11 | Minor | `booth-bundle.md:42` | Claimed `*.pyc` is ignored by git (only `__pycache__/` is) | Reworded |
| 12 | Minor | this plan, Windows bullet | `tarfile...format == USTAR_FORMAT` doesn't detect the format | Now cites the header magic (checked: `b'ustar\x0000'`) |
| 13 | Minor | this plan, Files | "14 files" vs "17 members" | Both stated |

A mutation check on the new rebuild test: with `--mtime=2026-10-21` in the script, it went red; with the script
restored, it went green.

Simplification: one member list (`git ls-files`), used by both the script and the test, with no exclusion list. There
is now one tar `-c` call and no `tar -tf`. The test has no unused imports. `npx eslint scripts
src/__tests__/lib/booth-bundle.test.ts` prints nothing. The reviewer suggested a `--check` mode in the script. I used
an output-path argument instead, so the test still extracts once for the per-file diagnostics and the Python run.

Anti-goals, re-checked:
- `grep -rln '/b/' src/` lists only `src/__tests__/lib/booth-bundle.test.ts` (no link).
- `git diff d1f2a62..HEAD -- package.json` touches only `scripts` (`booth-bundle`); there is no new dependency.
- `git diff d1f2a62..HEAD --stat | grep -iE 'talk|concierge'` finds nothing.
