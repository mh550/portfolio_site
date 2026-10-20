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
