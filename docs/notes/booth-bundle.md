# Booth harness bundle (`/b/h.tgz`)

The test harness for the IBM agent-builder booth at All Things Open, served from the site as one tarball. Spec:
`docs/specs/2026-10-20-booth-harness-bundle.md`; plans: `docs/plans/2026-10-20-B1-booth-harness.md`,
`docs/plans/2026-10-20-B2-booth-bundle.md`.

## At the booth

From the root of the demo repo, one line creates `mh_harness/`:

```bash
curl -sL https://michael-herron.vercel.app/b/h.tgz | tar xz        # bash / zsh
curl.exe -sLO https://michael-herron.vercel.app/b/h.tgz; tar -xzf h.tgz   # Windows PowerShell
```

If `tar` is missing or the tarball won't open, every file is also served on its own:

```bash
mkdir mh_harness; cd mh_harness
curl -sLO https://michael-herron.vercel.app/b/mh_harness/PROMPTS.md
curl -sLO https://michael-herron.vercel.app/b/mh_harness/adapter.py
```

The same works for `run_one.py`, `sweep.py`, `report.py`, `fake_game.py` and `README.md`; fetch
`configs/round1.json` from inside a `configs/` folder.

Then tell the laptop's coding assistant:

```
Read mh_harness/PROMPTS.md and do Step 1
```

## Rebuilding

The tarball is committed (D41). After any change under `public/b/mh_harness/`:

```bash
npm run booth-bundle        # writes public/b/h.tgz (needs GNU tar; the bytes are reproducible)
git add public/b/h.tgz      # commit it with the change
```

Running it twice leaves `git status` clean. Run output (`__pycache__/`, `*.pyc`, `results.jsonl`, `logs/`, `work/`)
is left out of the tarball and ignored by git.

`src/__tests__/lib/booth-bundle.test.ts` fails when the tarball drifts from the folder: it extracts `h.tgz` to a temp
dir, compares the file list and every file's bytes with `public/b/mh_harness/`, and runs the bundle's own unit tests
(`python3 -m unittest discover -s tests`) from the extracted copy. A red "same bytes" test means: run
`npm run booth-bundle` and commit `public/b/h.tgz`.

## Unlinked on purpose

The bundle is served, not advertised (D50): no page, nav item, sitemap entry, smoke route or `robots.txt` rule (a
`Disallow: /b/` would point at it). The only references are this note and the `/b/h.tgz` row in `CLAUDE.md`.
