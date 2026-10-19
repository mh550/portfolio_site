# Evidence brief: HitList (street-spot scouting app)

Distilled 2026-10-18. Public-safe. Deeper reading (read-only): `/home/mh550/projects/hit_list/` — `README.md`,
`APP_SPECIFICATIONS.md`, `OVERNIGHT.md` (the Status log has the failure stories), `docs/specs/2026-10-13-overnight-design.md`
(D1–D12), `docs/specs/2026-10-16-simplification-design.md` (D17–D27). Repo: github.com/mh550/hit-list (public; link
the repo root only, not its branches).

## Problem

Michael rides street snowboarding and skateboarding. A "spot" is one rideable feature (a rail, ledge, bank) at one
place. Scouting happens with cold hands, little time and often no signal, and spots are easy to forget. Principles
from the spec: mobile-first, capture fast and add details later, offline-first, private by default.

## Architecture (for a diagram)

- Expo / React Native, expo-router screens: Spots (List | Map), Quick Add (camera → review), batch Import from the
  photo library, spot detail and edit.
- State: zustand stores (spots with filters/search/sort, media, settings, location).
- Storage: expo-sqlite, offline-first, append-only versioned migrations (`PRAGMA user_version`). Photos copied into
  app storage (`photos/<spotId>/<mediaId>.jpg`); the database stores relative paths.
- Maps: Apple Maps via react-native-maps. Untitled spots get a town name from the system reverse geocoder (at most
  10 backfills per launch). Batch import reads EXIF date + GPS and groups photos by place.
- Delivery: Expo Go on his iPhone (Metro over a private network). CI: GitHub Actions (lint, typecheck, Jest) on every
  branch.

## Key decisions

- **D1** Upgrade Expo SDK 54 → 57 one version at a time, 2-hour time box, fall back to the last green hop (Expo Go
  only runs the newest SDK).
- **D2** Apple Maps over Mapbox: no API key, no custom build; Mapbox deferred until offline tiles are needed.
- **D3** Photos are copied into app storage, never written to the camera roll, never deleted by code.
- **D4** Untitled spots read "Untitled · Seattle · Oct 13, 2:22 PM". Review corrected a claim that geocoding was
  on-device (it is a network call to Apple); Michael chose to keep it, knowingly.
- **D6 / D11** Expo Go now, TestFlight later; web stays a stub.
- **D12** Batch import had no entry point at all (found while writing the phone guide). The agent placed it on
  Profile; Michael rejected that as bad UX and moved it to the Spots tab.
- **Simplification (D17–D27, Oct 16), after actually using the app:** a 20+ field, five-section form cut to
  name, location, photos, multi-select feature types, a "stopped" toggle, natural speed and notes. No drafts (D20).
  Natural speed became a labelled 5-step scale "None · Little · Some · Enough · Too much" instead of stars (D21).
  Gear removed entirely (D22): filtering by "what I own" was backwards; "needs extra speed" is what gear really
  encoded. Removed fields archived in a `legacy_json` column, not deleted (D26). The spec lists explicit anti-goals.
  (The simplification is specified, not yet built.)

## Timeline

- Feb 12–14, 2026: spec + four sprints, interactive. Then it stalled.
- Oct 13: revived to get it onto his phone; planning session wrote the overnight spec.
- Night of Oct 14/15: one overnight agent loop worked milestones M0–M7.
- Oct 15: a second session in orchestrator mode (Sonnet writes failing tests, Opus implements, Opus reviews).
- Oct 15/16: a crash on the real device → the simplification spec.

## Numbers

- ~131 commits (115 on Oct 14–15). Tests 115 → 220 (first night) → **374 tests in 37 suites**. 0 console errors,
  CI green, expo-doctor 21/21, iOS bundle 4.1 MB.

## What broke, and the rule it became

- **374 green tests, crash on the phone.** The `uuid` package needs `crypto.getRandomValues()`, which exists in
  Node/Jest but not in the phone's Hermes engine. Fix: `expo-crypto` `randomUUID` + a lint rule that blocks the import.
  Lesson: the test environment is not the device.
- **The test database lied about the phone.** `node:sqlite` turns foreign keys on by default; expo-sqlite starts with
  them off. Review then found a future table rebuild with foreign keys on would cascade-delete every photo. Fix:
  foreign keys off during migrations, on afterwards.
- **A library bug made map clusters vanish** (the clustering library's spiderfy indexed the wrong cluster) →
  replaced with a same-place action sheet.
- **Bugs Jest can't see:** a sort-chip row inherited `flexGrow: 1` and would have filled half the screen (caught by a
  reviewer reading the React Native source); an antimeridian-spanning region would crash the native map; "no
  location" spots at (0,0) dragged the map to West Africa.
- **"7679.1 mi"**: a spot saved without GPS showed that distance until a "What Michael will see" table (what the
  screen will actually display, row by row) exposed it. That check became a standing rule in every spec.
- **Silent data loss in Edit**: saving wiped some fields and stored NaN dimensions; caught in review.

## Demo material

- No public build exists (Expo Go only; web is a stub by decision). Do not attempt a web demo.
- No screenshots in the repo. Use authored diagrams (architecture; the 20+ → 7 field form before/after; the
  5-step speed scale as a small styled component) and add phone screenshots / a 15 s screen recording to
  `docs/asset-checklist.md`.

## Corrections

- 2026-10-18 (M6-01): "Silent data loss in Edit … caught in review" (What broke) is not how HitList's log tells it.
  The skate-stop wipe was found while planning the skate-stops item, and a failing test reproduced it; the dimension
  rounding and `NaN` were found while checking the other fields in that same item (`OVERNIGHT.md` line 331, the
  checklist at lines 253–255). Review then confirmed the fix (line 329). The page says "a failing test reproduces
  the loss before the fix" and does not credit review.
- 2026-10-18 (M6-01): "Night of Oct 14/15" (Timeline): the loop's M0 entry is at 2026-10-14 00:03 and its wrap-up
  at 2026-10-15 00:51, with the session idle 00:13–07:20 waiting on a "Continue" (`OVERNIGHT.md` lines 350, 513–514,
  533). The page dates it "Oct 14–15". The device crash is in the 2026-10-15 evening review entry (line 277), so the
  page dates it Oct 15, not "Oct 15/16"; the simplification spec is Oct 16.
- 2026-10-18 (M6-01): "That check became a standing rule in every spec" ("7679.1 mi"): the "What Michael will see"
  check was already in the overnight runbook (`OVERNIGHT.md` line 62) and is what caught the bug (line 382,
  `072c08b` "found by this table"). The page says the table stayed, on this site's build too.
- 2026-10-18 (M6-05): "Removed fields archived in a `legacy_json` column" (Key decisions, D26) is not every field:
  `status` is not archived, and the stored `gear` setting is ignored and dropped on the next save (HL simplification
  spec lines 108–111, 291). The page says "the old details are archived". "Four sprints" built every screen but the
  map view (HL overnight spec lines 123, 147–148).
