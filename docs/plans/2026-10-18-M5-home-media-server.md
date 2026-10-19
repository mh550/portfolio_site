# M5 plan: case study, the home media server + DJ crate pipeline (2026-10-18)

For the M5 build sessions (M5-02 … M5-05). Spec: `docs/specs/2026-10-18-portfolio-v2.md` § M5, decisions D10, D11,
D12, D16, D17, D18, D29, D30. Template: `docs/plans/2026-10-18-M3-case-study-template.md` § Components (props and
authoring rules). Sources: `docs/notes/evidence-media-server.md` (the brief) and, read-only, the public repo
`/home/mh550/projects/dj-crate-streaming/` ("DJ" below). The local checkout's `main` is 103 commits behind, so every
DJ file below was read as `git -C /home/mh550/projects/dj-crate-streaming show origin/main:<path>` (origin/main =
`8d99309`, 2026-10-17 19:52). Never copy hostnames, IPs, tokens, usernames or paths under `/srv` from those files.

Build order: M5-02 (the entry, media, excerpt + its tests) → M5-03 (the diagram) → M5-04 (screenshots) → M5-05
(review).

**Copy below is final.** M5-02 pastes it into `src/lib/data/projects.ts` as written. Every string carries its own
punctuation (the template adds none). Changing a number means changing the Traceability table first.

**The decision ids below (D7, D3, D24, D27, D18, D38/39) are the DJ repo's own ledger ids**, not this site's spec
decisions of the same numbers. They are the visible chips on the page, as D-H1… are on the agent-harness page.

## The project entry, field by field

| Field | Value |
|---|---|
| `slug` | `'home-media-server'` |
| `title` | `'Self-hosted music library & DJ crate pipeline'` |
| `company` | `'Personal · home server'` |
| `shortDescription` | `'A music library I host at home and stream to my phone, with a crate pipeline that checks each file\'s real quality and never deletes from the library.'` |
| `categories` | `['systems', 'full-stack']` |
| `techStack` | `['Python', 'SQLite', 'Docker Compose', 'Navidrome', 'beets', 'ffmpeg', 'JavaScript', 'restic']` (brief lines 18–31) |
| `githubUrl` | `'https://github.com/mh550/dj-crate-streaming'` |
| `demoUrl` | not set (no public URL: private network only, by design; brief line 92) |
| `featured` | `true` |
| `order` | `3` (D12) |
| `thumbnail` | not set (the card's visual header falls back to the first metric, as agent-harness's does) |
| `detail.architectureDiagram` | `'media-server'` (M5-03; M5-02 leaves it unset until the key exists) |
| `detail.media` | the three demo screenshots, see **Media** |
| `detail.codeSnippets` | one snippet, see **Terminal excerpt** |
| `caseStudy.extraDiagrams` | not set |

Place the entry after `linear-ai-workflow` in the `projects` array (array order is for readers of the file only).

`shortDescription` is what `/card` shows (D22): with this entry `getTopProjects(3)` becomes agent-harness,
linear-ai-workflow, home-media-server, so it replaces ghl-jobtread-integration on the card.

### Metrics (exactly 4; M5-02's digit-run test checks the values)

```ts
metrics: [
  { value: '831', label: 'songs, self-hosted, identical copies removed' },
  { value: '1,405', label: 'playlist entries kept intact through the retag and dedupe' },
  { value: '1,359', label: 'tests, all offline against fakes' },
  { value: 'Trash, not delete', label: 'code never deletes a library file; every removal is a reversible move' },
],
```

The fourth refines D18 (spec) as **D30 *default***: D18's "Nothing deleted" would overclaim. No code deletes a
library *file* (DJ `docs/architecture.md` line 300), but `fetch` deletes its own failed download from the incoming
folder (DJ `docs/download-validation.md` line 69), the D32 purge deleted 35 *playlists* (restorable, told in
Simplify), and on Oct 15 18 trashed copies were overwritten before the trash learned never to overwrite (lesson 4).
"Trash, not delete" states the rule without claiming a perfect record; "every removal is a reversible move" is true
of the code since that fix. The digit-run test has nothing to check on it; the M5-02 test asserts its label contains
`reversible`.

### detail (D16)

- `problem`: `'I wanted to stop depending on Spotify and stream my own music library from a box at home to my phone. I also wanted to flip any playlist into a DJ crate, where every track gets a DJ-quality file that is found, verified and filed automatically. And all of it had to be safe to run unattended on the one server that holds my only organised library.'`
- `approach` (not rendered, one sentence): `'Navidrome owns the library, a small crates service owns the crate flags and the queue, and a worker container verifies and files each approved download.'`
- `challenges` (not rendered, one sentence): `'A guessed fake, a tool that rewrote every tag and a trash folder that overwrote itself each broke something before they became rules.'`
- `outcome`: `'Since Oct 13 the library has run on a desktop at home: 831 songs, about 22 GB, streamed to my phone over a private network and, since Oct 14, backed up every night, encrypted, to a second disk. The cleanup retagged 376 files, moved 359 out of "Compilations" and trashed 28 duplicates, and all 1,405 playlist entries came through intact. A check of the whole library found 22 of 831 files that fail the crate check, 17 of them upscaled from ~128 kbps sources: that is the upgrade list. MusicBrainz ids for 485 files are ready to apply, and 16 went in as a reversible trial. As of Oct 17 the download path had run only in tests; the first real download is mine to start.'`
- `media`, `codeSnippets`: see below.

### caseStudy

- `role`: `'Designer and operator'`
- `timeframe`: `'Sep – Oct 2026'`

**method** (keys match `MethodStepId`):

| Key | Text |
|---|---|
| `diagnose` | `'My music was about 22 GB of files with no good way to play it away from home. After the first night live, the counts matched while 92 titles were still wrong on my phone, 28 files were second copies of the same audio, and nothing could yet tell a real lossless file from one upscaled from a low-bitrate mp3.'` |
| `decide` | `'Navidrome owns the songs and playlists. A small crates service owns only the crate flags, the wanted queue and approvals, in its own SQLite database, and a stream is a redirect to Navidrome, so audio never passes through it. Downloads run in their own worker container, and nothing downloads until I have approved the first one by hand.'` |
| `build` | `'I built it offline first, against a fake Navidrome, then took it live on Oct 13. Next came playlist import from Spotify, tag cleanup, dedupe, download validation, and a worker that searches a peer-to-peer network, Soulseek, through a VPN, verifies each file and files it with beets.'` |
| `verify` | `'Every download is checked by one decode for the spectral cutoff, the bits actually used, truncation, silence and clipping, plus flac -t, and by an acoustic fingerprint when it replaces a library copy. The same check ran over the whole library in about 75 minutes, 6 files at a time. The 1,359 tests run offline against fakes built from captured live responses, and each milestone ends with me looking at the phone, not the counts.'` |
| `simplify` | `'After using it, I replaced four quality tiers with one rule, lossless or 256 kbps and up, and left streaming quality to Navidrome and the phone app. "Prefer the 12-inch mix" became "source the exact track", the crate flag moved out of playlist comments into the app, and I deleted 35 cluttered playlists and kept 10; every one can be restored.'` |

"Soulseek" appears **once** in the whole entry, in `build`, as brand.md asks ("a peer-to-peer network, Soulseek").
No other string (metrics, outcome, decisions, iterations, lessons, captions, alt text, the diagram) may name it.

**decisions** (ids exactly `D7, D3, D24, D27, D18, D38/39`, in that order). Rendered as
"Chose {chose} over {over} because {because}" then "Cost: {cost}":

| id | title | chose | over | because | cost |
|---|---|---|---|---|---|
| `D7` | `The first real download is mine` | `no automatic downloads until I had approved one by hand and said go,` | `letting the queue download on its own from day one` | `the chain from download to library had only run in tests, so its first real run should be one file I watch.` | `As of Oct 17 the download path had not run live: copy replacement and play-now wait on that first approval.` |
| `D3` | `Duplicates go to the trash, not away` | `moving each second copy to a dated trash folder with a logged reverse move, and repointing its playlists,` | `deleting duplicates` | `a wrong call should be one move from undone, and these 28 were copies that decoded to identical audio.` | `Code never empties the trash; it grows until I empty it by hand, and a status command reports its size and age.` |
| `D24` | `One download quality` | `one rule, lossless or lossy at 256 kbps or more, with streaming quality left to Navidrome and the phone app,` | `the four quality tiers I had built and used` | `a downloaded file is kept for years and every stream is transcoded from it, so that one file's quality is the only one that matters.` | `The tier work became four tier names with the same rule in a config file.` |
| `D27` | `The app owns the crate flag` | `keeping which playlists are crates in the crates app's own database` | `a #crate tag written into each playlist's comment` | `playlist names and comments stay clean in every app that shows them, and one place holds the answer.` | — (not set) |
| `D18` | `Downloads run in their own container` | `a separate worker container that has no open port and handles only approved downloads,` | `running downloads from a script on the host` | `the web-facing service keeps a read-only view of the library, and credentials stay inside the containers.` | — |
| `D38/39` | `A green backup means a fresh backup` | `all-or-nothing database snapshots, and a nightly backup that fails when a snapshot fails,` | `refreshing each snapshot on its own and logging a warning` | `the monitoring heartbeat should be green only when the backup really holds fresh copies of both databases.` | `A broken snapshot turns the whole night red, even though the music itself was backed up.` |

Grammar check (the template prints one sentence): "Chose no automatic downloads until I had approved one by hand
and said go, over letting the queue download on its own from day one because the chain from download to library had
only run in tests, so its first real run should be one file I watch." A `chose` with a list or a clause of its
own ends with a comma (D7, D3, D24, D18, D38/39); D27's does not need one. No `over` carries punctuation.

"Rule 3" in the spec's "D3 (+rule 3)" is DJ spec `2026-10-13-next-session-design.md` § 4 item 3 (garbage
collection: trash is never auto-emptied, a status command reports its size and age): it is D3's `cost`.

**iterations** (exactly 5, the brief's timeline; `when` starts `Sep` or `Oct`; no `short`, there is no evolution
diagram):

| when | label | what | why |
|---|---|---|---|
| `Sep 17–18` | `Offline prototype` | `A candidate scorer, the crate layer, a fake Navidrome and a web client, all tested offline: 37 tests.` | `I wanted the design proven against fakes before it touched the real library.` |
| `Oct 13` | `Live, night one` | `The stack went live: 917 original files became 859 tracks in 35 genre playlists, with backups confirmed. Tests went from 37 to 80.` | `Every count matched, but my phone still showed 92 wrong titles.` |
| `Oct 13–15` | `Library hygiene` | `Playlist import from Spotify, tag cleanup, dedupe, quality tiers and download validation; tests reached 249.` | `Downloads needed a place that could write to the library while the web-facing service stayed read-only.` |
| `Oct 15–16` | `Worker + identity` | `A worker container that files downloads with beets, a model of songs, versions and copies, copy replacement and play-now; about 1,100 tests by the end.` | `After using it, the tiers and the version rules were more machinery than the job needed.` |
| `Oct 17` | `The simplification` | `One download quality, the exact track, the app owns the crate flag. An overnight run of my agent harness then built duplicate-cleanup tooling, health checks and lock-protected backups: 1,359 tests.` | `The current version. The first real download waits for my go.` |

**lessons** (7; the brief's "Navidrome ids change" is left out: it is a fact about Navidrome, not something that
broke; keep the order):

| broke | rule |
|---|---|
| `A guessed fake hid 3 critical bugs in the download client: the tests passed against a fake written from a guess at the API.` | `Fakes mirror the live API: they are built from captured real responses.` |
| `After the first night every count matched, 859 = 859 = 859, while 92 titles were still wrong on my phone.` | `Every milestone ends by looking at the screen itself, not the counts. This site's build ends its milestones the same way.` |
| `beets rewrote every tag on the live library and collapsed multi-valued genres. Review caught it, and the genres were repaired from the original files.` | `No tool rewrites the whole library. beets writes full tags only on a fresh download with a confident MusicBrainz match.` |
| `On Oct 15 the dedupe moved copies into trash paths where an earlier repair had kept damaged copies, and 18 of them were overwritten.` | `The trash never overwrites: a name that is already there gets a numbered suffix.` |
| `Verification would have thrown away good files: embedded webp cover art makes ffmpeg print "[error]" lines about audio that is fine.` | `For FLAC, flac -t decides. A few ffmpeg complaints are a warning; only 10 or more, audio that won't decode, or digital silence fail.` |
| `beets matched a 412 s 12-inch mix to a 403 s 90s mix.` | `The id backfill doesn't use beets' matching: it proposes ids, I review them, and every apply can be reverted.` |
| `Backups of the app's SQLite database were inconsistent: the main file was 4 KB and the data sat in the -wal file beside it.` | `Databases are copied only with sqlite3 .backup, under the lock, before every nightly backup.` |

M5-02's test needs a lesson whose `broke` contains `859 = 859 = 859` (lesson 2) and one containing `guessed fake`
(lesson 1, case-insensitive: it starts "A guessed fake").

**links** (exactly one; `githubUrl` must be in it, `case-study-data.test.ts` checks that):

```ts
links: [{ label: 'dj-crate-streaming on GitHub', href: 'https://github.com/mh550/dj-crate-streaming', kind: 'repo' }],
```

**builtWith** (D10): `'I designed the system, set the specs, decided or approved every entry in the decision log, and decided every change to the live library. Claude Code agents wrote much of the code under that direction; the Oct 17 work was an overnight run of my agent harness.'`

## Terminal excerpt

`detail.codeSnippets` holds exactly one snippet. Source: DJ `docs/download-validation.md` § "Reading the result",
lines 60–65 (the fenced block's six lines, without the fences), at origin/main `8d99309`. **One change (D18):**
`/srv/incoming/…/03 - Good Times.flac` → `incoming/…/03 - Good Times.flac`. Nothing else changes: the two leading
spaces on the `BAD` line, the five-space indents, `≈16` with no space, the `…`, `·` and `✗` characters all stay.

- `title`: `'verify · a "FLAC" upscaled from a lossy source is rejected (the docs\' example)'`
- `language`: `'text'`
- `code` (as it must read after the one replacement; M5-02 copies the bytes from the source and makes the
  replacement, then compares with this):

```text
BAD  incoming/…/03 - Good Times.flac  (tier crate)
     flac 44100 Hz / 16 bit / 2 ch / 501.0 s  [flac-streaminfo]
     · cutoff ≈16 kHz
     · band dB vs full: >11k -24.8  >13k -26.7  >15k -30.4  >16k -35.0  >17k -82.7  >18k -84.7 …
     · decoded 501.0 s · bits used 16 · peak -9.31 dBFS · flat factor 0.0
     ✗ cutoff ≈16 kHz (energy stops above 16 kHz) for a lossless file: lossless or 320 kbps reaches 19–20 kHz, so this likely came from ≤128 kbps
```

Notes for M5-02:

- It contains `BAD`, `cutoff ≈16 kHz` (twice) and no `/srv` (the M5-02 test checks all three). No hostname, IP,
  token or username: it is the doc's own illustrative example, not output from the live server, and the file name
  is the same demo track the screenshots show (Chic, "Good Times").
- No backtick and no `${`, so it pastes into a template literal as is; start it right after the opening backtick
  (no leading newline) and end it without a trailing newline.
- "320 kbps" in the last line is the verifier's own message about lossless and 320 kbps files; it is quoted
  output, not a claim, and does not contradict D24's 256 kbps floor.
- At 390 the long lines scroll inside `CodeBlock` (`overflow-x-auto`), not the page (M5-04 measures it).
- Privacy note for M5-05: the excerpt has no `100.` substring (`44100 Hz` has no dot after `100`).

## Media

Copy, byte-identical (`cp`, then `cmp`), from DJ `docs/screenshots/` into `public/projects/home-media-server/`.
They were committed with the crate layer on Sep 18 (DJ `0fdf5de`) and show the crates web client running against
the fake Navidrome: the header reads "fake-navidrome 0.0.0-fake · demo…" and the tracks are demo rows.

| File | Size | Pixels | `alt` | `caption` |
|---|---|---|---|---|
| `01-playlists.png` | 59,407 B | 840 × 1720 | `'The crates web client on a phone: three playlists, one marked as a crate with 1 of 3 tracks crate-ready.'` | `'Playlists, with one flagged as a crate. Demo data from the September prototype, running against a fake Navidrome.'` |
| `02-crate-toggled.png` | 90,401 B | 840 × 1720 | `'A playlist switched to a crate: two tracks marked ok, one marked needs source.'` | `'A playlist toggled into a crate: each track shows its format and whether it met the crate rule of the time. Demo data.'` |
| `03-wanted.png` | 107,924 B | 840 × 1720 | `'The wanted queue: two tracks whose library file does not meet the crate rule, each with the reason.'` | `'The wanted queue: what still needs a better file, and why. Demo data from the prototype, before the one-rule simplification.'` |

```ts
media: [
  { type: 'image', src: '/projects/home-media-server/01-playlists.png', alt: …, caption: …, width: 840, height: 1720 },
  { type: 'image', src: '/projects/home-media-server/02-crate-toggled.png', alt: …, caption: …, width: 840, height: 1720 },
  { type: 'image', src: '/projects/home-media-server/03-wanted.png', alt: …, caption: …, width: 840, height: 1720 },
],
```

- Every caption contains `demo data` (case-insensitive; the M5-02 test lower-cases).
- **`m6-*.png` are never used** (real library, a username). The M5-02 test asserts no file in
  `public/projects/home-media-server/` starts with `m6`; the privacy grep in M5-05 looks for `m6-`.
- `03-wanted.png` shows "320 floor" (the prototype's policy, before D24) and names the download source in its own
  intro text. Both are inside the image, not copy: the caption dates the shot instead, and the alt text names
  neither (Soulseek stays at one mention in the copy).
- **Portrait shots need D29.** The three are 840 × 1720 phone screens; `MediaGallery` today puts every image in an
  `aspect-[4/3]` box with `object-cover`, which would show only the empty middle of each. D29 *default* (appended
  to the spec in M5-01): `ProjectMedia` gains optional `width` and `height`; when both are set, `MediaGallery`
  renders `<Image width height sizes className="h-auto w-full">` inside the same rounded border, with no `fill`
  and no crop, and when **every** item has `height > width` the grid is `grid-cols-1 sm:grid-cols-3` (three phone
  screens in one row from `sm`, one column at 390). Items without `width`/`height` render exactly as today. No
  current project sets `detail.media`, so no other page changes; M5-02 adds a `MediaGallery` test for both paths.
- Phone screenshots of Amperfy on the real library are not on the site (they would show the real library); they
  belong on `docs/asset-checklist.md` once that file exists (brief line 92; whichever feature creates it).

## Diagram (`media-server`)

In `src/components/projects/diagrams/index.tsx`, next to the others, using its private `Node`, `Sub`, `Arrow` and
`Panel` primitives; an entry in `DIAGRAMS`, `CAPTIONS` and `LABELS`; `DiagramKey` in `projects.ts` gains
`'media-server'`. No SVG assets, no new dependency, no `"use client"`. Three panels, `flex flex-col gap-4
md:flex-row md:items-start` (stacked at 390, side by side from `md`, like the agent-harness diagram).

**Panel "Listening" (tone neutral)**, top to bottom:

| # | Node | Sub |
|---|---|---|
| 1 | `Phone` | `Amperfy or the web client` |
| 2 | `Private network` | `HTTPS only; nothing open to the LAN or the internet` |

Arrow 1 → 2 labelled `HTTPS`.

**Panel "Home server · Docker Compose" (tone accent)**, top to bottom:

| # | Node | Sub |
|---|---|---|
| 1 | `Navidrome` | `library, playlists, transcoding` |
| 2 | `crates service` | `crate flags, wanted queue, approvals` |
| 3 | `Worker` (accent) | `approved rows only: VPN search → verify → beets` |
| 4 | `Library` | `removals go to a trash with an undo log` |

Arrows: 1 → 2 `playlists · signed stream links`; 2 → 3 `approved downloads`; 3 → 4 `verified files, then a rescan`.
(The brief's "Navidrome ↔ crates service ↔ worker": the two-way traffic is in the arrow labels; `Arrow` has no
two-headed form and one is not worth adding.)

**Panel "Every night" (tone muted)**, top to bottom:

| # | Node | Sub |
|---|---|---|
| 1 | `Database snapshot` | `both databases, all or nothing, under the lock` |
| 2 | `Encrypted backup` | `to a second disk; the heartbeat is green only when it is fresh` |

Arrow 1 → 2 unlabelled.

The words M5-03's test asserts (Phone, HTTPS, Navidrome, crates service, worker, verify, beets, library, snapshot,
backup) are all in the node, sub and arrow text above (case-insensitive). The text has no `.ts.net`, no `100.`, no
`/srv`, no `http://`, no number and no product name for the download source.

- `aria-label` (`LABELS['media-server']`): `'My phone reaches the home server only through a private network, over HTTPS. On the server, Navidrome holds the library and the playlists and streams to the phone. The crates service keeps the crate flags, the wanted queue and the approvals. A worker container takes only approved downloads: it searches through a VPN, verifies each file, files it into the library with beets and asks Navidrome to rescan. Removals go to a trash with an undo log. Every night both databases are snapshotted, all or nothing, and an encrypted backup goes to a second disk; the heartbeat is green only when that backup is fresh.'`
- caption (`CAPTIONS['media-server']`): `'Nothing is open to the internet, streams go straight from Navidrome to the phone, and only approved, verified downloads reach the library.'`

## Tests M5-02 and M5-03 write or update

| File | Feature | Change |
|---|---|---|
| `src/__tests__/lib/case-study-home-media-server.test.ts` (new) | M5-02 | the feature's steps 1–5: header fields, 4 metrics (`831`, `1,405`, `1,359`, `reversible`), five method strings, decision ids exactly as above, 5 iterations, 6–8 lessons incl. `859 = 859 = 859` in a `broke` and `guessed fake`, one link, builtWith names "Claude Code" and "designed"; each media `src` exists under `public/`, each caption contains `demo data`, no file in the folder starts with `m6`, each file ≤ 120 KB and byte-identical to the DJ source (that part `it.skip`s when `/home/mh550/projects/dj-crate-streaming` is absent, like the agent-harness excerpt test); snippet `language` `text`, title contains `verify`, code contains `cutoff ≈16 kHz` and `BAD`, not `/srv`; the entry's JSON contains none of `.ts.net`, `100.`, `ntfy`, `/srv`, `m6-`, and contains `Soulseek` exactly once; every digit run of every metric value and every decision id appears in the brief |
| `src/__tests__/components/MediaGallery.test.tsx` (new or extended) | M5-02 | D29: an item with `width`/`height` renders an `img` with those attributes and no 4:3 box; an all-portrait list gets `sm:grid-cols-3`; an item without them renders as today |
| `src/__tests__/lib/data.test.ts` | M5-02 | 7 → 8 projects; D12 order map gains `'home-media-server': 3`; `getTopProjects(3)` → `agent-harness, linear-ai-workflow, home-media-server` (and `linear-ai-workflow, home-media-server, ghl-jobtread-integration` if agent-harness were absent, per M5-02 step 5) |
| `src/__tests__/lib/case-study-types.test.ts` | M5-02 | the `systems` category now returns `['agent-harness', 'home-media-server']` (by order) |
| `src/__tests__/components/ProjectsGrid.test.tsx` | M5-02 | the Systems filter shows two cards; Full-Stack gains one |
| `src/__tests__/pages/card.test.tsx` | — | derives from `getTopProjects(3)`; run it, expect the third item to change to this entry |
| `src/__tests__/app/project-page-unchanged.test.tsx` | — | fixed six-slug list: must pass untouched |
| `src/__tests__/components/ProjectDiagram.test.tsx` | M5-03 | iterates every `DiagramKey`, so the new key is covered once added; add the media-server words test and the banned-strings test (`.ts.net`, `100.`, `/srv`, `http://`) on the rendered text **and** the aria-label |

Watch the `100.` ban in prose: write "about 1,100 tests" mid-sentence (as above), never "1,100." at a sentence end.

## Traceability

Every number, date and decision id in the copy above. "Brief" = `docs/notes/evidence-media-server.md` (line
numbers as of M5-01); "DJ" = `/home/mh550/projects/dj-crate-streaming/` at origin/main `8d99309`; "AH ledger" =
`/home/mh550/projects/agent-harness/ledger/runs.jsonl`.

| Claim in the copy | Where | Source |
|---|---|---|
| 831 songs; identical copies removed (28; 102 same-recording groups remain, D31 not run live) | metric, outcome | Brief line 62 ("831 songs after dedupe"); DJ `docs/download-validation.md` line 79 ("22 of 831"); DJ `docs/specs/2026-10-13-next-session-design.md` line 245 ("asserts 831 songs") |
| about 22 GB | outcome, diagnose | Brief line 62; DJ `docs/backup-plan.md` line 26 ("~22 GiB") |
| 1,405 playlist entries kept intact | metric, outcome | Brief lines 64–65 |
| 1,359 tests | metric, verify, iteration Oct 17 | Brief lines 58 and 69; AH ledger run `dj-2026-10-17` `tests_end: 1359` |
| all offline against fakes built from captured live responses | metric label, verify | Brief line 69; DJ `docs/hard-won-facts.md` line 19 ("Fakes must mirror captured live responses") |
| Trash, not delete; code never deletes a library file; every removal a reversible move | metric | Brief line 30; DJ `docs/architecture.md` line 300 ("no code deletes a library file; trash never overwrites"); spec D18 refined by D30 |
| Sep 17–18, scorer prototype, crate layer, fake Navidrome, web client, 37 tests | iteration 1, build | Brief line 52 |
| Oct 13 live; 917 → 859 tracks, 35 genre playlists, backups confirmed, 37 → 80 | iteration 2, build, outcome | Brief lines 53–54; DJ next-session-design line 14 (859 files), line 19 (35 playlists) |
| 92 titles wrong on the phone; 859 = 859 = 859 | diagnose, iteration 2 why, lesson 2 | Brief line 75; DJ next-session-design lines 25–29 ("92 titles … That is the inconsistency Michael saw") |
| 28 second copies / 28 duplicates trashed | diagnose, outcome | Brief line 64; DJ next-session-design lines 17–18 ("28 of the 859 are redundant copies of the same audio") |
| Oct 13–15: import, tag cleanup, dedupe, tiers, validation, 249 tests | iteration 3 | Brief line 55 |
| Oct 15–16: worker + beets filing, identity model, replacement, play-now, ≈ 1,100 tests | iteration 4 | Brief line 56; DJ `README.md` line 39 ("about 1,100 tests") |
| Oct 17: pivot, overnight harness run, duplicate-cleanup tooling, health checks, lock-protected backups | iteration 5, builtWith | Brief line 57; AH ledger run `dj-2026-10-17` |
| timeframe Sep – Oct 2026 | caseStudy.timeframe | Brief lines 52 and 57 |
| 376 retagged, 359 re-filed out of "Compilations" | outcome | Brief line 64 |
| 22 of 831 fail the crate check, 17 upscaled from ~128 kbps | outcome | Brief lines 66–67; DJ `docs/download-validation.md` lines 79–80 |
| about 75 minutes, 6 at a time | verify | Brief lines 66–67; DJ `docs/hard-won-facts.md` line 45 |
| the checks in one decode (cutoff, bits used, truncation, silence, clipping, flac -t, fingerprint) | verify | Brief lines 25–26; DJ `docs/download-validation.md` lines 36–46 |
| ids for 485 files ready, 16 applied as a reversible trial | outcome | Brief line 68; DJ `docs/next-todos.md` lines 13–16 ("The 485 default-class rows are not applied yet", 16 `search` rows applied with revert logs) |
| since Oct 14, backed up every night, encrypted, to a second disk | outcome, diagram | Brief line 31; DJ `docs/backup-plan.md` lines 9–14 (restic timer, repo on a separate 1 TB HDD), lines 20–23 (the Oct 13 run predates the library; the Oct 14 03:30 run is the first real library backup) |
| private network, HTTPS, nothing open to the LAN or internet | outcome, diagram | Brief lines 18–19 |
| stream is a redirect to Navidrome; audio never passes through the crates service | decide, diagram caption | Brief line 23; DJ `README.md` line 179 ("Streaming never touches our process") |
| As of Oct 17 the download path had run only against fakes | outcome, D7 cost, iteration 5 | DJ `docs/architecture.md` line 446 ("The download path has never run live. 0 approvals ever"), lines 435–436 (copy replacement and play-now need a real download); the doc is from origin/main of Oct 17 |
| 35 playlists deleted, 10 kept; every one restorable | simplify | Brief line 46; DJ `docs/specs/2026-10-17-amperfy-pivot.md` D32 (35 deleted, 10 kept, restore from exports and a snapshot); DJ `docs/next-todos.md` lines 10–11. Brief line 62's "46 → 10" was wrong (35 + 10 = 45): corrected in M5-01, see the brief's `## Corrections` |
| D7 (approve one by hand first; one row, watch the log) | decision | Brief line 35; DJ next-session-design line 61; DJ `docs/architecture.md` line 446 (mitigation "Do D7's first download with one row and watch the log") |
| D3 (second copy → dated trash, playlists repointed; identical audio; never auto-emptied; status reports size and age) | decision | Brief lines 36–37; DJ next-session-design line 57 (D3), lines 243–251 (§ 4 items 2–3); DJ `docs/hard-won-facts.md` line 37 (`MOVES.txt` of reverse moves) |
| D24 (lossless or ≥ 256 kbps; streaming to Navidrome + app; tiers built then replaced after use) | decision, simplify | Brief lines 38–39; DJ amperfy-pivot D24, D25 |
| D24 because ("kept for years and every stream is transcoded from it") | decision | DJ next-session-design D17 ("A downloaded file is kept for years and every stream is transcoded from it") |
| D24 cost (two days; four names, same rule, in a config file) | decision | DJ `docs/plans/2026-10-15-m4-quality-tiers.md` (Oct 15) → amperfy-pivot (Oct 17); DJ `README.md` lines 81–82 ("the four tier names below are identical in `deploy/policy.toml`") |
| D27 (crate flag in crates.db, not `#crate` in comments) | decision, simplify | Brief lines 42–43; DJ amperfy-pivot D27 |
| D18 (worker container, no port, approved rows only, web service read-only, credentials in containers, host wrapper dropped) | decision, decide | Brief line 44; DJ next-session-design D18; DJ `docs/hard-won-facts.md` lines 7–9 |
| D38/39 (all-or-nothing snapshot; failed snapshot fails the backup after it still backs up; green heartbeat = fresh) | decision, diagram | Brief lines 47–48; DJ amperfy-pivot D38, D39 |
| "Prefer the 12-inch mix" → "source the exact track" | simplify | Brief lines 40–41; DJ amperfy-pivot D26 |
| 3 critical bugs, guessed fake → captured responses | lesson 1 | Brief lines 73–74; DJ `docs/plans/2026-10-13-m3-sourcing-slice.md` line 5 (review: 3 critical fixed) |
| beets collapsed multi-valued genres, repaired from originals; full tags only on a confident match | lesson 3 | Brief lines 45 and 77; DJ `docs/hard-won-facts.md` lines 30–33 |
| Oct 15, 18 files overwritten in the trash; numbered suffix | lesson 4 | Brief line 78; DJ `tests/test_dedupe_copies.py` line 142 ("Live 2026-10-15: M2's repair had kept damaged copies at the same trash paths; 18 were overwritten"); DJ `docs/architecture.md` line 300 ("`(2)` suffix") |
| webp covers print "[error]"; flac -t decides; 10 or more fail | lesson 5 | Brief line 79; DJ `docs/download-validation.md` line 39; DJ `docs/hard-won-facts.md` line 38 |
| 412 s 12-inch matched to a 403 s 90s mix; backfill bypasses beets; propose / apply / revert | lesson 6 | Brief lines 28–29 and 80; DJ `README.md` line 109 |
| WAL: 4 KB main file, data in `-wal`; `sqlite3 .backup` under the lock | lesson 7 | Brief lines 82–83; DJ `docs/hard-won-facts.md` lines 47–49 |
| tech stack | techStack | Brief lines 18–31 (Docker Compose, Navidrome, stdlib Python, vanilla JS, SQLite, ffmpeg, beets, restic) |
| verify excerpt | codeSnippets | DJ `docs/download-validation.md` lines 60–65, one path replaced (D18) |
| screenshots: demo data, Sep prototype | media | Brief lines 87–89; DJ commit `0fdf5de` (2026-09-18, "Crate layer: … fake server … web client"); the images' own header "fake-navidrome 0.0.0-fake" |

Numbers deliberately left out: the Spotify match rates (57/68, 92/126, 107; true, but the page has enough numbers),
the D6 upload cap, the 366 "Compilations" files of the Oct 13 snapshot (the brief's 359 re-filed is the outcome),
and the "Navidrome ids change" lesson (see lessons). Nothing names the host machine, the private-network address,
the VPN provider, the Navidrome username or any path on the server.

## Brand check

Checked against `docs/notes/brand.md` by reading every string above.

| Rule | Holds | How |
|---|---|---|
| Lead with self-hosting, verification, safe automation | yes | title and problem lead with the self-hosted library; verify and decisions D3, D18, D38/39 carry verification and safety; the download source appears once, mid-paragraph in `build`, never in a title, metric or decision |
| Download source named once, plainly, no peer names | yes | "a peer-to-peer network, Soulseek" in `build` only; the diagram says "VPN search"; no peer usernames anywhere |
| First person | yes | problem, method, D7/D24 and lessons use "I"/"my"; no "Michael" in the copy |
| Past tense for what happened | yes | problem, iterations, lessons and outcome narrate in the past; present tense only for standing behaviour (decide, verify, decision `because` clauses, lesson rules) |
| Numbers over adjectives | yes | every claim of scale carries its number (831, 1,405, 1,359, 22 of 831, 75 minutes, 485/16) |
| No buzzwords | yes | none of: leverage, synergy, seamless, robust, cutting-edge, revolutionary, empower, best-in-class, game-changing |
| Show the reasoning | yes | six decisions as chose/over/because, four with a cost (D7, D3, D24, D38/39) |
| Failures not sanded off | yes | seven lessons, including the trash overwriting itself and verification nearly throwing away good files; D7's cost says plainly that the download path has not run live |
| Agent credit (D10) | yes | builtWith: "I designed the system … Claude Code agents wrote much of the code under that direction" |
| Never publish | yes | no hostname, no IP, no `/srv` path (the excerpt's path is replaced), no ntfy, no `.env` content, no token, no phone, no Spotify URL, no `m6-*.png`; the one link is the public repo |
| No fake screenshots (D11) | yes | the three images are real screenshots of the real web client running on demo data, and every caption says so |

## Review

(M5-05 writes this section.)
