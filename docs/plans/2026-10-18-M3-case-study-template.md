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

All in `src/components/projects/case-study/`, all server components (no `"use client"`), no new dependencies,
Tailwind classes in the existing style (`text-[var(--color-muted)]`, `border-white/8`, `bg-[var(--color-surface)]`).
Copy that is not data (headings, "Chose … over … because …", "Cost:", "What broke", "The rule") is fixed template
text, the spec's own wording.

**`CaseStudySection({ id, heading, children })`** — the one shared wrapper (M3-05 checks there is no copy-pasted
section markup): `<section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">` with
`<h2 id={`${id}-heading`} className="text-2xl font-bold mb-4">{heading}</h2>`. `scroll-mt-24` keeps an anchored
heading below the fixed 64 px Navbar.

| Component | Props | Renders | Anchors | Empty case |
|---|---|---|---|---|
| `MethodSteps` | `{ method: CaseStudy['method'] }` | `CaseStudySection id="method" heading="The Method"`, then an `<ol>` of the five `methodSteps` (from `approach.ts`, in its order): label (mono, accent) then `method[step.id]` | `<li id="diagnose">` … `<li id="simplify">` (each `scroll-mt-24`); section `#method` | none: all five strings are required by the type |
| `DecisionLog` | `{ decisions: Decision[] }` | `CaseStudySection id="decisions" heading="Key Decisions"`, a `<ul>`; per decision: the `id` as a chip (mono, small, bordered), `title` as `<h3>`, `Chose {chose} over {over} because {because}` — the `over {over}` clause omitted when `over` is absent (`Chose {chose} because {because}`), and `Cost: {cost}` only when `cost` is set | `#decisions` | `[]` → `null` |
| `IterationTimeline` | `{ iterations?: Iteration[] }` | `CaseStudySection id="iterations" heading="How It Evolved"`, an `<ol>`; per row `when · label` (mono eyebrow), then `what`, then `why` (muted) | `#iterations` | `undefined` or `[]` → `null` |
| `LessonList` | `{ lessons: Lesson[] }` | `CaseStudySection id="lessons" heading="What Broke"`, a `<ul>`; per lesson a "What broke" label + `broke`, an aria-hidden `→`, a "The rule" label + `rule` | `#lessons` | `[]` → `null` |
| `ProjectLinks` | `{ links: ProjectLink[] }` | `CaseStudySection id="links" heading="Links"`, a `<ul>`; per link an aria-hidden glyph for `kind` (text: repo `</>`, live `●`, doc `¶`, demo `▶`) and the visible `label`. `href` starting with `/` → `next/link`, no target. Otherwise `<a target="_blank" rel="noopener noreferrer">` plus `<span className="sr-only"> (opens in new tab)</span>` (as on `/card`). Each link `min-h-[44px]` inline-flex | `#links` | `[]` → `null` |

The `builtWith` note is not a component: `ProjectDetail` renders it as `<p>` with a mono "How it was built" label
and the sentence (no heading), only when set.

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
3. h2 **The Problem** — `detail.problem`.
4. `detail.architectureDiagram` (D17: after Problem, not after Approach), when set.
5. `MethodSteps` (h2 The Method).
6. `DecisionLog` (h2 Key Decisions).
7. `IterationTimeline` (h2 How It Evolved), when iterations exist.
8. `caseStudy.extraDiagrams`, each a `ProjectDiagram`, in array order (D17).
9. `LessonList` (h2 What Broke).
10. h2 **Outcome** — `detail.outcome`.
11. h2 **In the Code** (`detail.codeSnippets`) then h2 **A Closer Look** (`detail.media`), each when present.
12. `ProjectLinks` (h2 Links).
13. The `builtWith` note.

Then the back footer. Not rendered in case-study mode: `detail.approach`, `detail.challenges` (D16).

So a full case study's h2 order is: The Problem, The Method, Key Decisions, How It Evolved, What Broke, Outcome,
In the Code, A Closer Look, Links (the last three only when their data exists).

**`getCaseStudyAnchors(project: Project): string[]`** (M3-04, `projects.ts`, barrel-exported): `[]` without a
case study; otherwise `diagnose, decide, build, verify, simplify, method, decisions` (if any), `iterations` (if
any), `lessons` (if any), `links` (if any). M7's link test uses it instead of re-deriving the rules; the
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

| Page | What is on screen | Anything wrong |
|---|---|---|
| | | |

## Review

