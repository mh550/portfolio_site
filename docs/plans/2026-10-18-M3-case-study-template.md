# M3 plan: the case-study template (2026-10-18)

For the M3 build sessions (M3-02 … M3-05). Spec: `docs/specs/2026-10-18-portfolio-v2.md` § M3, decisions D10,
D12, D16, D17. Checked against the tree at `78010ea` (Next 16.1.6, React 19.2, Jest 30 via `next/jest` + SWC).
M3 builds the template only; no real project gets a `caseStudy` until M4–M6. On the current data every
`/projects/<slug>` page must render exactly as it does today.

Build order: M3-02 (types, categories, filter, fixture) → M3-03 (five components) → M3-04 (`ProjectDetail`, page,
metadata test, diagram a11y) → M3-05 (review, screenshots, simplify, docs).

## Files

| File | Feature | Kind |
|---|---|---|
| `src/lib/data/projects.ts` | M3-02 | types below; `ProjectCategory` gains `'systems' \| 'process'` |
| `src/lib/data/index.ts` | — | unchanged: `export * from './projects'` already exports the new types and helpers |
| `src/components/projects/ProjectsGrid.tsx` | M3-02 | FILTERS gains Systems, Process after AI |
| `src/__tests__/fixtures/case-study-project.ts` | M3-02 | `fixtureProject: Project` (not a test file: `testMatch` is `*.test.*`) |
| `src/components/projects/case-study/CaseStudySection.tsx` | M3-03 | shared `<section>` + `<h2>` wrapper |
| `src/components/projects/case-study/{MethodSteps,DecisionLog,IterationTimeline,LessonList,ProjectLinks}.tsx` | M3-03 | server components |
| `src/components/projects/ProjectDetail.tsx` | M3-04 | server component, the whole page body (D16) |
| `src/app/projects/[slug]/page.tsx` | M3-04 | slug → `notFound()` or `<ProjectDetail project={project} />` |
| `src/components/projects/diagrams/index.tsx` | M3-04 | `role="img"` + `aria-label` per key (D17) |
| `src/lib/data/projects.ts` | M3-04 | `getCaseStudyAnchors(project)` (for M7's link test) |

## Types

Verbatim from the spec, plus `extraDiagrams` (D17). They go in `src/lib/data/projects.ts` next to `Project`:

```ts
export interface Decision { id: string; title: string; chose: string; over?: string; because: string; cost?: string }
export interface Iteration { when: string; label: string; what: string; why: string }
export interface Lesson { broke: string; rule: string }
export interface ProjectLink { label: string; href: string; kind: 'repo' | 'live' | 'doc' | 'demo' }
export interface CaseStudy {
  role: string; timeframe: string;
  method: { diagnose: string; decide: string; build: string; verify: string; simplify: string };
  decisions: Decision[]; iterations?: Iteration[]; lessons: Lesson[]; links: ProjectLink[];
  builtWith?: string;          // D10: the honest one-line "how it was built"
  extraDiagrams?: DiagramKey[]; // D17: rendered after IterationTimeline
}
// Project gains: caseStudy?: CaseStudy      (order already exists, from M0)
```

- `export type ProjectCategory = 'integration' | 'full-stack' | 'ai' | 'education' | 'systems' | 'process';`
- `detail.approach` and `detail.challenges` stay required (D16): new projects hold one-sentence summaries there.
- The method keys match `MethodStepId` in `approach.ts` (`diagnose … simplify`), so components index
  `method[step.id]` without a cast. Optionally type it `method: Record<MethodStepId, string>` — same shape; keep the
  spec's literal form if in doubt.
- No existing project entry changes in M3.

## Components

*Updated by M3-05 to match the shipped code exactly; M4–M6 author data against this without reading the code.*

All in `src/components/projects/case-study/`, all server components (no `"use client"`), no new dependencies.
Every component takes exactly one prop, a slice of `project.caseStudy`; there are no optional or styling props.
Copy that is not data (headings, "Chose … over … because …", "Cost:", "What broke", "The rule", "How it was
built") is fixed template text. The template adds **no punctuation**: write every data string as the sentence or
fragment it will be read as (see the authoring rules below the table).

**`CaseStudySection({ id, heading, children })`** — the one shared wrapper; every case-study block, and The Problem
and Outcome in case-study mode, renders through it (no copy-pasted section markup):
`<section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">` with
`<h2 id={`${id}-heading`} className={sectionHeadingClass}>`. `sectionHeadingClass` (`'text-2xl font-bold mb-4'`)
is exported from the same file and is the class of every h2 on a project page, case study or not.
`scroll-mt-24` keeps an anchored heading below the fixed 64 px Navbar. Each section is a landmark `region` named by
its heading.

| Component | Props (exact) | Renders | Anchors | Empty case |
|---|---|---|---|---|
| `MethodSteps` | `{ method: CaseStudy['method'] }` | `CaseStudySection id="method" heading="The Method"`, an `<ol>` of the five `methodSteps` from `approach.ts`, in that order. Per step, an `<h3>` (mono, accent) with an aria-hidden `01 `…`05 ` prefix and the step's `label`, then `<p>` `method[step.id]` (muted) | `<li id="diagnose">`, `decide`, `build`, `verify`, `simplify` (each `scroll-mt-24`); section `#method` | none: the type requires all five strings |
| `DecisionLog` | `{ decisions: Decision[] }` | `CaseStudySection id="decisions" heading="Key Decisions"`, a `<ul>` of cards (key `d.id`). Per decision: `id` as a mono chip, `title` as `<h3>`, then `<p>` "Chose {chose} over {over} because {because}" (the " over {over}" part only when `over` is set), then `<p>` "Cost: {cost}" only when `cost` is set | `#decisions` | `[]` → `null` |
| `IterationTimeline` | `{ iterations?: Iteration[] }` | `CaseStudySection id="iterations" heading="How It Evolved"`, an `<ol>` with a left rule. Per row: "{when} · {label}" (mono, accent eyebrow), `what` (`<p>`), `why` (`<p>`, muted, smaller) | `#iterations` | `undefined` or `[]` → `null` |
| `LessonList` | `{ lessons: Lesson[] }` | `CaseStudySection id="lessons" heading="What Broke"`, a `<ul>` of cards: "What broke" label + `broke` (muted), an aria-hidden `→` (points down on mobile, right from `sm`), "The rule" label (accent) + `rule`. Three columns from `sm`, stacked below | `#lessons` | `[]` → `null` |
| `ProjectLinks` | `{ links: ProjectLink[] }` | `CaseStudySection id="links" heading="Links"`, a wrapping `<ul>` of 44 px-tall bordered pills: an aria-hidden glyph for `kind` (repo `</>`, live `●`, doc `¶`, demo `▶`; ● and ▶ carry U+FE0E so iOS keeps them as text), then `label`. Three href shapes: a site path (one leading `/`, matched by `/^\/(?![/\\])/`, so `//host` and `/\host` are *not* site paths) → `next/link`, same tab; `#…`, `mailto:`, `tel:` → plain `<a>`, same tab; anything else → `<a target="_blank" rel="noopener noreferrer">` plus sr-only " (opens in new tab)" | `#links` | `[]` → `null` |

`ProjectDetail` itself (`src/components/projects/ProjectDetail.tsx`) owns the rest of the case-study page:

- **Header role line**: `{role} · {timeframe}` (mono, muted) between the description and the tech chips.
- **The Problem / Outcome**: `detail.problem` and `detail.outcome` in `CaseStudySection`s with ids `problem` and
  `outcome` (classic pages keep their bare h2s; the snapshot pins them).
- **Diagrams**: `detail.architectureDiagram` after The Problem, and each of `caseStudy.extraDiagrams` after
  How It Evolved. A new `DiagramKey` needs an entry in `DIAGRAMS`, `CAPTIONS` and `LABELS` in
  `src/components/projects/diagrams/index.tsx` (the `Record` types force all three).
- **builtWith**: a `<p>` with a mono, accent "How it was built" label and the sentence, no heading, only when set.

**Authoring rules for M4–M6** (`src/__tests__/lib/case-study-data.test.ts` checks the starred ones for every
project with a `caseStudy`):

- `decisions[].because` ends the sentence, so it carries the full stop: "Chose Supabase over Airtable because it
  keeps state in SQL." `chose`, `over` and `because` read as one sentence after "Chose".
- `decisions[].id` is unique within the project* (it is the React key and the visible chip, e.g. `D1`).
- `iterations[].when` is a short date-ish eyebrow ("Week 1", "Mar 2026"); `label` a two- or three-word name.
- `lessons[].broke` and `.rule` are full sentences with their own full stops.
- `links[].href` is a site path, `https://…`, `#…` or `mailto:`*. If the project sets `githubUrl` or `demoUrl`,
  the same URL must also be in `caseStudy.links`*: a case study does not render the header GitHub/Live links.
- `detail.approach` and `detail.challenges` stay required but are not rendered (D16): one sentence each.
- Copy follows `docs/notes/brand.md`; the content guard runs over the data file.

## Page order

`ProjectDetail({ project })` keeps today's `<main className="max-w-3xl mx-auto px-6 py-20">`, back link, divider,
`ScrollReveal` wrappers and back footer. `project.caseStudy` decides the body.

**Without `caseStudy`**: today's markup moved verbatim — header (back link, company, h1, shortDescription, tech
chips, GitHub/Live links) → MetricStrip → divider → The Problem → The Approach → diagram → Challenges → Outcome →
In the Code → A Closer Look → back footer. No class, text or order change.

**With `caseStudy`** (the spec's 13 steps, D16 and D17 applied):

1. Header: back link, company eyebrow, h1 title, shortDescription, a `{role} · {timeframe}` line (mono, muted),
   tech chips. No GitHub/Live links here: ProjectLinks (step 12) is the one link list on a case study.
2. `MetricStrip` (renders nothing without metrics), then the divider.
3. h2 **The Problem** — `detail.problem` (section `#problem`).
4. `detail.architectureDiagram` (D17: after Problem, not after Approach), when set.
5. `MethodSteps` (h2 The Method).
6. `DecisionLog` (h2 Key Decisions).
7. `IterationTimeline` (h2 How It Evolved), when iterations exist.
8. `caseStudy.extraDiagrams`, each a `ProjectDiagram`, in array order (D17).
9. `LessonList` (h2 What Broke).
10. h2 **Outcome** — `detail.outcome` (section `#outcome`).
11. h2 **In the Code** (`detail.codeSnippets`) then h2 **A Closer Look** (`detail.media`), each when present.
12. `ProjectLinks` (h2 Links).
13. The `builtWith` note.

Then the back footer. Not rendered in case-study mode: `detail.approach`, `detail.challenges` (D16).

So a full case study's h2 order is: The Problem, The Method, Key Decisions, How It Evolved, What Broke, Outcome,
In the Code, A Closer Look, Links (the last three only when their data exists).

**`getCaseStudyAnchors(project: Project): string[]`** (M3-04, `projects.ts`, barrel-exported): `[]` without a
case study; otherwise `problem, diagnose, decide, build, verify, simplify, method`, `decisions` (if any),
`iterations` (if any), `lessons` (if any), `outcome`, `links` (if any). (`problem` and `outcome` added by M3-05.) M7's link test uses it instead of re-deriving the rules; the
`ProjectDetail` test asserts every returned id exists in the rendered DOM.

**Diagram accessibility (D17, M3-04):** `ProjectDiagram` wraps `<Component />` in
`<div role="img" aria-label={LABELS[diagram]}>`; `LABELS: Record<DiagramKey, string>` says what the diagram shows
in one sentence (the `figcaption` stays visible and outside the `role="img"` element). Every existing key gets a
label; M4–M6 add one per new key (the `Record` type forces it).

## Testing

**Fixture** (`src/__tests__/fixtures/case-study-project.ts`, M3-02): `export const fixtureProject: Project` —
slug `fixture-case-study`, categories `['systems', 'process']`, `order: 99`, `featured: false`, two metrics, a
`detail` with one-sentence approach/challenges, `architectureDiagram: 'ghl-jobtread'`, one code snippet, and a
full `caseStudy`: role, timeframe, all five method strings, two decisions (one with `over` and `cost`, one with
neither), two iterations, two lessons, links of all four kinds plus one internal `/projects/...` link, `builtWith`,
`extraDiagrams: ['calendar-sync']`. Plain neutral text ("Fixture problem.") that the content guard accepts (no
TODO, no `[X]`, no phone-like numbers). It is never added to `projects`.

**Rendering**: `ProjectDetail` is a synchronous server component with no hooks, so tests call
`render(<ProjectDetail project={fixtureProject} />)` directly (framer-motion is already mocked). The async page is
tested by awaiting it: `render(await ProjectDetailPage({ params: Promise.resolve({ slug }) }))`; `notFound` is
mocked with `jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); }) }))`.

**Unchanged-page proof** (M3-04, in this order):
1. *Before touching `page.tsx`*, add `src/__tests__/app/project-page-unchanged.test.tsx`: for each of the six
   current slugs (a fixed list, not `projects`, so M4–M6 additions don't change it) render the awaited page and
   `expect(container.innerHTML).toMatchSnapshot()`. Run it once to write
   `src/__tests__/app/__snapshots__/project-page-unchanged.test.tsx.snap`; commit nothing yet.
2. Optionally save before-screenshots of `/projects/ghl-jobtread-integration` at 390 and 1280 to
   `$HARNESS_SCRATCH/M3-before-*.png` for M3-05.
3. Refactor into `ProjectDetail`. The snapshot test must pass untouched (never run `jest -u` for it). It stays in
   the suite: if a later milestone changes a non-case-study page on purpose, that session updates the snapshot and
   says so in its progress entry.
4. `ProjectDetail.test.tsx` also asserts the ghl h2 order is exactly `['The Problem', 'The Approach',
   'Challenges', 'Outcome', 'In the Code']` and that none of the case-study ids exist (the feature's own wording).

**Test files to create**

| File | Feature | Asserts |
|---|---|---|
| `src/__tests__/lib/case-study-types.test.ts` | M3-02 | `fixtureProject` and a minimal `Project` literal with no `caseStudy` both type-check; `getProjectsByCategory('systems')` and `('process')` return `[]` on current data |
| `src/__tests__/components/case-study/MethodSteps.test.tsx` | M3-03 | five `li` ids in order; each label from `methodSteps` with the fixture's text under it |
| `src/__tests__/components/case-study/DecisionLog.test.tsx` | M3-03 | chip, title, "Chose … over … because …", "Cost: …"; the no-`over`/no-`cost` decision has neither; `[]` → empty container |
| `src/__tests__/components/case-study/IterationTimeline.test.tsx` | M3-03 | `#iterations`, when · label · what · why per row; `undefined` and `[]` → empty container |
| `src/__tests__/components/case-study/LessonList.test.tsx` | M3-03 | `#lessons`, each "What broke" → "The rule" pair; `[]` → empty container |
| `src/__tests__/components/case-study/ProjectLinks.test.tsx` | M3-03 | one link per kind with label and glyph; external: `target="_blank"`, `rel="noopener noreferrer"`; internal `/…`: no target |
| `src/__tests__/components/ProjectDetail.test.tsx` | M3-04 | fixture: h2 order as above, ids from `getCaseStudyAnchors`, builtWith text, role · timeframe, no 'The Approach' / 'Challenges' headings, extra diagram after `#iterations` and before `#lessons`; ghl: the exact h2 order, no case-study ids |
| `src/__tests__/app/project-page-unchanged.test.tsx` (+ `.snap`) | M3-04 | snapshot of the six current pages, written before the refactor |
| `src/__tests__/app/project-metadata.test.ts` | M3-04 | `generateMetadata` for ghl (title `GoHighLevel ↔ JobTread Integration — Michael Herron`, description = shortDescription), unknown slug → 'Project Not Found', `generateStaticParams` = every slug, unknown slug page → `notFound` |
| `src/__tests__/components/ProjectDiagram.test.tsx` | M3-04 | every `DiagramKey` renders one `role="img"` with a non-empty `aria-label` and a figcaption |

**Existing tests to update**

- `src/__tests__/components/ProjectsGrid.test.tsx` (M3-02): six filter buttons in the order All, Integration,
  Full-Stack, AI, Systems, Process (`getAllByRole('button').map(b => b.textContent)`); clicking Systems shows
  'No projects in this category yet.' (that empty state already exists in `ProjectsGrid`).
- `src/__tests__/lib/data.test.ts`: not touched in M3. Its "exports an array with 6 projects" count changes in
  M4–M6, not here.
- `src/__tests__/lib/content-guard.test.ts`: never touched; the fixture lives under `src/` and must pass it.

Note for M3-02's third step ("it compiles under ts-jest"): this repo runs Jest through `next/jest` (SWC), which
strips types without checking them. The type check that makes the types test meaningful is `next build`'s
TypeScript pass (`tsconfig.json` includes `**/*.ts(x)`, so `src/__tests__/` is checked) and `npx tsc --noEmit`.
Run `npx tsc --noEmit` in M3-02 and see it fail on a deliberately wrong literal before trusting it.

## What Michael will see

No real project has a `caseStudy` yet, so M3 must leave every project page as it was. The screenshots are of
`/projects/ghl-jobtread-integration` on the dev server, full page, taken after scrolling so every reveal had run
(0 elements in `<main>` below opacity 1). No console or page errors, no horizontal scroll at 390.

| Page | What is on screen | Anything wrong |
|---|---|---|
| `docs/screenshots/v2/M3-ghl-jobtread-integration-390.png` (286 KB) | Hamburger navbar; "← Projects" back link; "BUILDER CLARITY" eyebrow; h1 "GoHighLevel ↔ JobTread Integration"; description; six tech chips on two rows; metric strip stacked (2 days → ~6 hrs, Bidirectional, 0); divider; The Problem; The Approach; the architecture diagram (GoHighLevel and JobTread panels stacked, waterfall chips wrapped to two rows, caption); Challenges; Outcome; In the Code with one JavaScript block; "← Back to all projects"; footer | Nothing added or missing versus before M3. The code block scrolls sideways inside itself at 390 (its `overflow-x-auto`, unchanged since before M3). The round "N" at the left edge is the Next dev indicator, not on the live site |
| `docs/screenshots/v2/M3-ghl-jobtread-integration-1280.png` (318 KB) | Same content: full navbar, metric strip in three columns, the diagram's two panels side by side with "on stage change →" between them, waterfall strip phone → email → name → create on one row | Nothing added or missing versus before M3 |

"Nothing added or missing" rests on the DOM, not on eyeballing: `project-page-unchanged.test.tsx` snapshotted all
six pages before the M3-04 refactor and passed untouched after it; the M3-05 review compared the snapshot from
before and after a4fcd74 and found the only difference is D17's `<div role="img" aria-label>` around each diagram,
which has no class and no visual effect. M3-05's refactor left the snapshot passing untouched again. The h2s in the
DOM are exactly The Problem, The Approach, Challenges, Outcome, In the Code, and none of the case-study ids exist.
No GitHub/Live links appear because this project has neither URL (as before).

Visible elsewhere: `/projects` now offers Systems and Process filters that show the empty state until M4–M6 add
projects in those categories.

## Review

M3-05, 2026-10-18. Opus review of `git diff 78010ea..HEAD -- src ':!src/__tests__'` (772 lines, 11 files, written
to `$HARNESS_SCRATCH/M3.diff`). **0 Critical, 0 Important, 7 Minor; all 7 fixed in M3-05**, test-first where they
change behaviour.

What the reviewer verified holds: the six classic pages differ from before M3 only by the D17 wrapper; the
case-study branch follows the 13 steps; approach/challenges are not rendered; the `anchors.has(...)` gates are
needed (an empty `ScrollReveal` would still take a `space-y-12` margin); no `&&` on numbers; "Chose … over …
because" spacing is right; the internal-link regex rejects `//host` and `/\host`; case-study ids don't clash with
any other id in `src/`.

| # | Severity | Where | Finding | Fix |
|---|---|---|---|---|
| 1 | Minor | `ProjectDetail.tsx` ProseSection | In case-study mode The Problem and Outcome were bare h2s, not labelled `region`s like every other block; the h2 class was copied four times | `ProseSection` takes an optional `id` and then renders `CaseStudySection` (`#problem`, `#outcome`, added to `getCaseStudyAnchors`); classic pages pass no id (snapshot untouched). `sectionHeadingClass` exported from `CaseStudySection` and used for every h2. Tests: regions named The Problem / Outcome; anchors test updated |
| 2 | Minor | `ProjectDetail.tsx` header | A case study drops `githubUrl`/`demoUrl` silently; an M4–M6 author could lose a link | New `src/__tests__/lib/case-study-data.test.ts`: for every project with a `caseStudy`, both URLs (when set) must be in `caseStudy.links`; it also checks href shapes and unique decision ids, with fixture-based tests that it catches each mistake |
| 3 | Minor | `ProjectLinks.tsx` | `#anchor` and `mailto:` links got `target="_blank"` and "(opens in new tab)" | `#…`, `mailto:`, `tel:` render a plain same-tab `<a>`; three new tests |
| 4 | Minor | `ProjectDetail.tsx` | The `ScrollReveal delay=0.1` + `ProjectDiagram` block was written three times | `DiagramReveal({ diagram, className? })`; the classic branch passes `mt-6` so its DOM is unchanged |
| 5 | Minor | `ProjectDetail.tsx` role line | `-mt-4 mb-6` only cancels the description's `mb-8`; someone might "fix" it | Comment explains it (the classic page's spacing is pinned) |
| 6 | Minor | `IterationTimeline.tsx` | Key `${when}-${label}` collides on two rows with the same when and label | Key `${i}-${when}`; duplicate-key test |
| 7 | Minor | `ProjectDetail.test.tsx` | No page-level test of empty decisions/lessons/links | Test: those ids absent and the body has exactly 8 non-empty children |

**Simplification pass.** One shared `CaseStudySection` (all five components plus Problem/Outcome); one heading
class; one `DiagramReveal`; `CodeAndMedia` shared by both branches. No component has an unused prop (each takes
one data slice). The classic and case-study branches stay separate bodies on purpose: merging them would change
the pinned classic DOM.

**`vercel-react-best-practices`.** Consulted; the applicable rules hold: no client boundary added (all server
components; `ScrollReveal` is the only client component and receives only children), `rendering-conditional-render`
(no `&&` on a number; `metrics && metrics.length > 0`), static lookup tables hoisted to module scope (`GLYPHS`,
`LABELS`, `sections`), no waterfalls (no data fetching; `params` awaited once). `bundle-barrel-imports` does not
apply: `@/lib/data` is a local barrel of server-only data modules, not a large library. Nothing else to fix.

**Ready for M4–M6.**
