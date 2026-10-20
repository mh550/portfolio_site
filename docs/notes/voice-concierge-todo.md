# Voice Concierge: adding the measured numbers

`/projects/voice-concierge` shipped with no numbers, because none were measured (VC3-02). Its outcome says so: "No
latency numbers are measured yet. They go on this page once I have measured real sessions, and until then it shows
none." Once you have run real sessions, this is how the numbers go on the page.

## 1. Measure

In the agent repo (`mh550/voice-concierge`), after real sessions against the running worker, run
`scripts/latency_report.py` (the agent spec §4.7: p50/p95 per field from `anonymous_turn_metrics`; its C7 row adds
the cached-token share).
Note each number with the date, how many sessions and turns it covers, and the command you ran.

## 2. Write each number into the brief first

Add every number, word for word, to `docs/notes/evidence-voice-concierge.md` (a new § Measured numbers table: value ·
what it measures · sessions/turns · date · command), and replace the line "Measured numbers: none yet" there.
`src/__tests__/lib/case-study-voice-concierge.test.ts` fails on any sentence in the entry with a digit that the brief
does not hold verbatim, so the brief always comes first.

## 3. Put them on the entry

In `src/lib/data/projects.ts`, on the `voice-concierge` entry, add a `metrics` array of **four at most**
(`{ value, label }`, the same shape as the other case studies), for example p50 and p95 time to first audio and the
cached share of prompt tokens. The first metric shows on the `/projects` card band (it shows the category `ai` until
then) and in the Open Graph image.

Then change, in the same commit:

- `case-study-voice-concierge.test.ts`: replace "has no metrics" with the count and a check that every digit in a
  metric value is in the brief (as `case-study-hit-list.test.ts` does).
- `detail.outcome`: replace "No latency numbers are measured yet. They go on this page once I have measured real
  sessions, and until then it shows none." with one sentence on what was measured (and copy that sentence into the
  brief's § Sentences with digits if it has a digit). Update the outcome test that pins the old sentence.
- `ProjectsGrid.test.tsx`: drop the "voice-concierge band shows its category" test.

## 4. Keep the Open Graph image green

`src/__tests__/app/opengraph-image.test.ts` draws every project's title and first metric with the bundled font,
which has Latin glyphs only; a glyph it lacks fails the test ("draws only glyphs the bundled font has"). Write
values and labels in plain Latin text and ASCII digits, units as `ms`, `s` and `%`: no arrows, `≈` or `µ`. Run:

```bash
npx jest src/__tests__/lib/case-study-voice-concierge.test.ts src/__tests__/app/opengraph-image.test.ts src/__tests__/components/ProjectsGrid.test.tsx
.harness/check.sh
```

## Cost protection

Every conversation costs money, so three layers bound it (VC5, `docs/specs/2026-10-20-vc4-order-widget-limits.md`
§ VC5.2). The deep-dive says so in one sentence at the end of `caseStudy.method.build`; that sentence is copied
verbatim into `docs/notes/evidence-voice-concierge.md` § Sentences with digits, so change both together.

| Layer | What it limits | Where to change it |
|---|---|---|
| 1. The token route (this repo) | Only this site's origin, its Vercel previews and (dev only) `localhost` or `127.0.0.1` get a token (403 otherwise); one live conversation per network address (429 `visitor`) and `CONCIERGE_MAX_ROOMS` across the site, default 2 (429 `site`); if LiveKit's room list fails, no token (503) | `CONCIERGE_MAX_ROOMS` in the Vercel project's env (a whole number ≥ 1; anything else falls back to 2); the allowlist in `src/lib/concierge/origin.ts`; the limits in `src/lib/concierge/limits.ts`; the order in `src/app/api/concierge/token/route.ts` |
| 2. The agent (`mh550/voice-concierge`) | Each visitor id at 5 sessions a day, each session at 10 minutes | `concierge/limits.py` in the agent repo |
| 3. The provider accounts | About $45 a week across the accounts the agent spends on | Each provider's billing settings |

If you change a number, change the deep-dive sentence and its row in the brief in the same commit:
`case-study-voice-concierge.test.ts` fails on a sentence with a digit that the brief doesn't hold verbatim. The
route's own numbers are pinned by `concierge-limits.test.ts` and `concierge-token-route-limits.test.ts`.
