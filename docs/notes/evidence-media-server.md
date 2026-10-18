# Evidence brief: home media server + DJ crate pipeline

Distilled 2026-10-18. Public-safe. Deeper reading (read-only): `/home/mh550/projects/dj-crate-streaming/` —
`README.md`, `docs/hard-won-facts.md`, `docs/specs/2026-10-17-amperfy-pivot.md` (D24–D34), `docs/backup-plan.md`,
`docs/download-validation.md`, `docs/screenshots/`. Note: the local checkout's `main` is behind; read docs from
`origin/main` with `git -C /home/mh550/projects/dj-crate-streaming show origin/main:<path>` if a file is missing.
Repo: github.com/mh550/dj-crate-streaming (public). **Never copy hostnames, IPs, tokens or paths under `/srv` from
those files onto the site.**

## Problem

Michael wanted to stop depending on Spotify and stream his own music library from a box at home to his phone, and
to flip any playlist into a DJ "crate" so every track in it gets a DJ-quality file that is found, verified and filed
automatically. And it had to be safe to run unattended on a live server holding his only organised library.

## Architecture (for a diagram)

- A Pop!_OS desktop at home running Docker Compose. Remote access only through a private Tailscale network with
  HTTPS (nothing exposed to the LAN or the internet).
- **Navidrome**: the library, playlists and transcoding; the source of truth for which songs exist. Phone apps
  (Amperfy, or the installable web client) stream from it.
- **crates service** (stdlib Python + a vanilla-JS web client): crate flags, the wanted queue, approvals, in its own
  SQLite database. Streams are a redirect to a signed Navidrome URL, so audio never passes through it.
- **worker container**: claims approved downloads → searches a peer-to-peer network (Soulseek) through a VPN
  container with an upload cap → scores candidates → downloads → **verifies** (one ffmpeg decode: spectral cutoff,
  bits actually used, truncation, silence, clipping; `flac -t`; acoustic fingerprint) → files it with beets → tells
  Navidrome to rescan → swaps it into the crate.
- Playlist import from Spotify (public embed page + exports). MusicBrainz/AcoustID id backfill as propose / apply /
  revert.
- Safety: code never deletes; "trash" moves files to a dated folder with a reverse-move log. Nightly encrypted
  restic backup to a separate disk, consistent SQLite snapshots taken under a lock, a heartbeat for monitoring.

## Key decisions

- **D7** No automatic downloads at first: "the first real download is yours."
- **D2/D3** Originals are never modified; deletions go to trash with a logged reverse; dedupe only when copies decode
  to identical audio.
- **D9 → D24** Four quality tiers were built, then replaced by one rule after use: lossless or ≥ 256 kbps.
  Streaming quality is left to Navidrome and the phone app (D25). Deliberate simplification.
- **D16 → D26** "Prefer 12-inch extended mixes" → "source the exact track"; a version swap is a question, never
  automatic (D23).
- **D21 → D27** The crate flag first lived as a `#crate` tag in playlist comments, then moved into the crates
  database so names and comments stay clean ("the app owns the flag").
- **D18** Approved downloads run in their own worker container, keeping credentials inside containers.
- **D29** beets writes full tags only on a confident MusicBrainz match; never rewrite the whole library.
- **D32** Playlist clutter purge: 35 deleted, 10 kept, every one restorable from exports and a database snapshot.
- **D38 / D39** Snapshots are all-or-nothing and a failed snapshot fails the nightly backup, so a green heartbeat
  means the backup is really fresh.

## Timeline

- Sep 17–18, 2026: raw brainstorm → candidate scorer prototype, crate layer, fake Navidrome, web client (37 tests).
- Oct 13, night 1: the stack went live. 917 original files → 859 tracks, 35 genre playlists, backups confirmed.
  Tests 37 → 80.
- Oct 13–15: playlist import, tag cleanup, dedupe, quality tiers, download validation (tests → 249).
- Oct 15–16: worker + beets filing, song/version/copy identity model, replacement and play-now (tests ≈ 1,100).
- Oct 17: the simplification pivot (D24–D34); an overnight harness run built duplicate-cleanup tooling, health
  checks and lock-protected backups (tests 1,359).

## Numbers

- ~22 GB library, **831 songs after dedupe**; 46 playlists → 10 after the purge.
- Spotify imports matched 57/68, 92/126 and 107 tracks across three playlists.
- 376 files retagged, 359 re-filed out of "Compilations", 28 duplicates trashed, **1,405 playlist entries kept
  intact** through all of it.
- Whole-library verify: 22 of 831 files fail the crate check, 17 of them upscaled from ~128 kbps sources (≈ 75 min,
  6 in parallel).
- 485 MusicBrainz ids ready to apply; 16 applied as a reversible trial.
- **Tests 37 → 80 → 249 → ~1,100 → 1,359**, all offline against fakes built from captured live responses.

## What broke, and the rule it became

- **A guessed fake hid 3 critical bugs** in the download client → rule: fakes mirror the live API, built from
  captured real responses.
- **"859 = 859 = 859"**: every count matched while 92 titles were still wrong on the phone → rule: every milestone
  ends with a "What Michael will see" check, the screen itself, not the counts.
- **beets collapsed multi-valued genres** on the live library; review caught it and it was repaired from the originals.
- **The trash overwrote itself** (18 files already in trash) → rule: trash never overwrites.
- **Verification would have deleted good files**: embedded webp cover art makes ffmpeg print "[error]" lines.
- **beets mis-matched a 412 s 12-inch mix to a 403 s 90s mix** → the id backfill bypasses beets' matching.
- **Navidrome ids change** when a file is retagged and moved between scans → playlists must be repointed.
- **Backups of a WAL-mode SQLite database were inconsistent** (4 KB main file, data in `-wal`) → `sqlite3 .backup`
  snapshots under the lock before every nightly run.

## Demo material

- Safe screenshots (fake data) to copy into `public/projects/home-media-server/`:
  `/home/mh550/projects/dj-crate-streaming/docs/screenshots/01-playlists.png`, `02-crate-toggled.png`,
  `03-wanted.png`. **Do not use `m6-*.png`** (real library, username).
- A terminal excerpt of `verify` rejecting an upscaled file ("BAD: cutoff ≈ 16 kHz") as a styled code block; take
  the exact format from `docs/download-validation.md` (its example output, around line 60), never from the live server.
- No public URL (private network only, by design). Phone (Amperfy) screenshots go on the asset checklist.
