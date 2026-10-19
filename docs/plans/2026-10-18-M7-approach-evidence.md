# M7 plan: `/approach` and `/evidence` (2026-10-18)

For the M7 build sessions (M7-02 … M7-05). Spec: `docs/specs/2026-10-18-portfolio-v2.md` § M7, decisions D7, D14,
D23, D31, D32, D34, D35. Sources: `docs/notes/brand.md` ("brand"), `docs/notes/evidence-agent-harness.md` ("AH"),
`docs/notes/evidence-media-server.md` ("MS"), `docs/notes/evidence-hit-list.md` ("HL"), with line numbers as of
2026-10-18. Where a case study on this branch already says the same thing, the page string it matches is named too
(`src/lib/data/projects.ts`).

Build order: M7-02 (principles data, `/approach`, link tests) → M7-03 (competencies data, `/evidence`, link tests,
`docs/notes/maxx-level-4.md`) → M7-04 (screenshots, the table below) → M7-05 (review).

**Copy below is final.** M7-02 and M7-03 paste it into `src/lib/data/approach.ts` and `src/lib/data/competencies.ts`
as written. Every string carries its own punctuation. Changing a number means changing its source column first.

**Allowed values.** Example slugs: `agent-harness`, `home-media-server`, `hit-list`, `linear-ai-workflow`,
`ghl-jobtread-integration`. Example anchors: `diagnose`, `decide`, `build`, `verify`, `simplify`, `decisions`,
`iterations`, `lessons`, or none. Those eight are ids the case-study template renders (`getCaseStudyAnchors` in
`projects.ts`: the five `methodSteps` ids on the `MethodSteps` `li`s, plus the `DecisionLog`, `IterationTimeline` and
`LessonList` sections). `linear-ai-workflow` and `ghl-jobtread-integration` have no `caseStudy`, so their examples
carry no anchor.

## Principles

Types, in `src/lib/data/approach.ts` (next to `methodSteps`; `approach.ts` already imports only `./profile`, and it
now also imports `./projects` for the helper, which is fine: `profile.ts` never imports `approach.ts`, D32):

```ts
export type ProjectSlug = 'agent-harness' | 'home-media-server' | 'hit-list' | 'linear-ai-workflow' | 'ghl-jobtread-integration';
export type CaseStudyAnchor = MethodStepId | 'decisions' | 'iterations' | 'lessons';

export interface PrincipleExample {
  /** Absent only for the D14 example, which has no page to link (D34). */
  projectSlug?: ProjectSlug;
  anchor?: CaseStudyAnchor;
  text: string;
}

export interface Principle {
  id: 'diagnose-first' | 'decisions-explicit' | 'fakes-mirror-reality' | 'verify-what-the-human-sees'
    | 'simplify-after-use' | 'automate-bookkeeping';
  title: string;
  summary: string;
  examples: PrincipleExample[];
}
```

`resolvedExamples(p: Principle): PrincipleExample[]` keeps an example with no `projectSlug` (D34) and an example
whose slug is in `projects`; it drops an example whose slug is missing, and drops the `anchor` (not the example)
when that project has no `caseStudy` or the anchor is not in `getCaseStudyAnchors(project)`.
`exampleHref(e)` returns `/projects/<slug>` or `/projects/<slug>#<anchor>`, or `undefined` without a slug.

### 1. `diagnose-first` · Diagnose before building

Summary: `I look for where the work actually breaks and name it with a symptom or a number someone can check. Only then do I pick a fix.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `linear-ai-workflow` | none | `At MAXX Potential I traced a QA bottleneck to the tracking itself: one spreadsheet per person, with no status history. Moving the team to Linear and an AI-agent workflow brought 2× sprint throughput.` | brand 43; `linear-ai-workflow` `detail.problem` ("each team member kept their own sheet", "no status history"); experience.ts MAXX bullet 1 ("Diagnosed a QA/Engineering issue-tracking bottleneck") |
| `agent-harness` | `diagnose` | `Before the harness, every single-session approach hit one of three walls: the context limit, the usage limit or the permission classifier. One night every repo went silent from 00:12 to 07:19.` | AH 13–15, 23; page `method.diagnose` |
| `home-media-server` | `diagnose` | `After the first night live, the counts matched while 92 titles were still wrong on my phone and 28 files were second copies of the same audio.` | MS 64, 75; page `method.diagnose` |

### 2. `decisions-explicit` · Make decisions explicit

Summary: `I write each decision down: what I chose, what I passed on, and why. The next session, or the next person, reads the reasoning instead of guessing it.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `agent-harness` | `decisions` | `The harness keeps a numbered decision ledger. The first entry, D-H1: a fresh session per feature, because subagents only delay the context limit and fresh sessions force state onto disk.` | AH 5, 49–50; page decision "A fresh session per feature" |
| `home-media-server` | `decisions` | `The crate flag first lived as a #crate tag in playlist comments. I moved it into the crates app's own database and wrote down why: the app owns the flag.` | MS 42–43; page decision "The app owns the crate flag" |
| `hit-list` | `decisions` | `When the agent put batch import on the Profile tab, I rejected it as bad UX and moved it to the Spots tab. The ledger records it as D12.` | HL 35–36; page decision "Import lives on the Spots tab" |

### 3. `fakes-mirror-reality` · Fakes mirror reality

Summary: `Tests run against fakes, so the fakes have to behave like the real thing. I build them from captured real responses, not from what I expect the system to say.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `agent-harness` | `lessons` | `The harness broke its own rule. I tested its usage-limit detector against a message I made up; the real one read differently, and 45 sessions were counted as failed attempts in 6 minutes. The fix was a fixture captured from the real CLI.` | AH 79–82, correction 111–112; page lesson 1 |
| `home-media-server` | `lessons` | `A fake written from a guess at the download client's API hid 3 critical bugs. The fakes are now built from captured real responses.` | MS 73–74; page lesson 1 |
| `hit-list` | `lessons` | `The test database enforced foreign keys and the phone's did not. Test fakes now start the way the device starts.` | HL 62–64; page lesson 2 |

### 4. `verify-what-the-human-sees` · Verify what the human will see

Summary: `Passing tests and matching counts are not the finish line. A milestone ends when I have looked at the screen the person will use.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `home-media-server` | `lessons` | `After the first night every count matched, 859 = 859 = 859, while 92 titles were still wrong on my phone.` | MS 75–76; page lesson 2 |
| `hit-list` | `lessons` | `A spot saved without GPS showed as "7679.1 mi" away. No test failed; a table of what the screen would show, row by row, caught it.` | HL 70–71, correction 92–94; page lesson 3 |
| `agent-harness` | `verify` | `Every finished milestone gets an independent verify session that re-runs each step and writes one evidence row per step. Nothing merges unless it is the tree that was verified.` | AH 37–40, 85–86; page `method.verify` |

### 5. `simplify-after-use` · Simplify after use

Summary: `The first version carries guesses. After I have used it, I cut what nobody needs, and sometimes I decide not to build at all.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `home-media-server` | `simplify` | `I built four download-quality tiers, used them, then replaced them with one rule: lossless or 256 kbps and up.` | MS 38–39; page `method.simplify` |
| `hit-list` | `simplify` | `After using HitList on my phone, I wrote a spec that cuts a 20+ field form in five sections to seven fields. It is specified, not yet built.` | HL 37–42; page `method.simplify` |
| none (D14, D34) | none | `I spec'd an invite and gig-broadcast app over five rounds of questions, then chose not to build it. An iOS Shortcut does the job with zero code, and the spec records when building it would become worth it.` | spec D14 (private: no link) |

### 6. `automate-bookkeeping` · Automate the bookkeeping, keep judgment human

Summary: `Scripts and agents take the repetitive, checkable work. The calls that need judgment, what to build and the rules for what ships, stay with a person.`

| Slug | Anchor | Text | Source |
|---|---|---|---|
| `agent-harness` | `decisions` | `In the harness a deterministic bash driver does all the git bookkeeping, because a script does that and a prompt might not. On this site every PR still waits for me to merge it.` | AH 56; spec D2; page decision "The driver does the git bookkeeping" |
| `linear-ai-workflow` | none | `At MAXX Potential, moving QA tracking to Linear and an AI-agent workflow cut bug-filing time by about 80%.` | brand 43–44 |
| `home-media-server` | `decisions` | `Nothing downloads on its own: the first real download is mine to approve, by hand. As of Oct 17 the download path had not run live.` | MS 35; page decision "The first real download is mine" |

Every principle has 3 examples; 17 link and 1 (D14) does not.

### Filtered at render time

All five slugs are in `projects` on this branch (M4-05, M5-05 and M6-05 pass), so on the current data `/approach`
filters out **nothing**, and every `agent-harness`, `home-media-server` and `hit-list` example keeps its anchor. If a
project were missing (a branch without its milestone), these examples drop out:

| If this slug is missing | Landed by | Examples dropped | What still renders |
|---|---|---|---|
| `agent-harness` | M4 | 1b, 2a, 3a, 4c, 6a (5) | Every principle keeps ≥ 1 example; the closing line links to `/projects` instead |
| `home-media-server` | M5 | 1c, 2b, 3b, 4a, 5a, 6c (6) | Every principle keeps ≥ 1 example |
| `hit-list` | M6 | 2c, 3c, 4b, 5b (4) | Every principle keeps ≥ 1 example |
| any of the three losing its `caseStudy` | — | none: the anchor is dropped, the link goes to `/projects/<slug>` | — |

`linear-ai-workflow` and `ghl-jobtread-integration` are pre-v2 projects, always present. A principle whose examples
all filter out still renders its h2 and summary with no empty list. In every case the pages render with **zero
broken links**: every `/projects/...` href points at a slug in `projects`, and every `#anchor` at an id that project's
page renders. The same rule covers `/evidence` (`resolvedItems`, below).

## Approach page

`src/app/approach/page.tsx`, a Server Component, static, rendering only data from `approach.ts`:

- `metadata`: title `'Approach — Michael Herron'`, description `profile.subline`.
- h1: `How I work`.
- Intro, `approachIntro: string[]` in `approach.ts` (2 sentences, brand voice):
  `I work in five steps, at work and at home.` ·
  `Most examples below link to the place in a case study where it happened, including the times it went wrong.`
- The method strip: `MethodStrip` from `src/components/MethodStrip.tsx` (D23, shipped by M2). It gains one prop,
  `showLines?: boolean` (default `false` = today's hero behaviour). With `showLines` each step's line is visible at
  every width (D31), with no `sr-only`. The hero is unchanged; its test still passes.
- The six principles in data order, each a `section` with an h2 (the title), the summary, and a `ul` of resolved
  examples: the example text as a paragraph, then a link to `exampleHref(e)` named
  `<project title>: <section>` (section = the method label for a step anchor, "Key Decisions", "How It Evolved" or
  "What Broke" for the others, "Project page" with no anchor). Two examples can share a name (e.g. 2a and 6a), and
  then they share the href too, so a link name always means one destination. The D14 example renders as
  text only. `ScrollReveal` per section.
- Closing line, `approachClosing` in `approach.ts`: `This site update was built that way, one verified milestone at a time.`
  then a link `Read the agent harness case study` → `/projects/agent-harness` when that slug is in `projects`,
  otherwise `See the projects` → `/projects`.
- `/approach` goes into `.harness/smoke-routes.txt`. The Navbar link is M8's job, not M7's.

## Competencies

Types, in `src/lib/data/competencies.ts`:

```ts
export type EvidenceContext = 'MAXX Potential' | 'Builder Clarity' | 'Personal';
export interface EvidenceItem {
  text: string;      // the link text, so it must make sense out of context
  href: string;      // internal route, /projects/<slug>[#anchor], or a public repo root (below)
  context: EvidenceContext;
  /** A phrase found in brand.md (MAXX and Builder Clarity items) or the evidence brief (Personal). */
  source: string;
}
export interface Competency { id: string; title: string; items: EvidenceItem[] }
```

`resolvedItems(c)` mirrors `resolvedExamples`: an item whose `/projects/<slug>` is missing drops out; an anchor on a
project without that anchor is dropped. The test matches `source` after collapsing whitespace in both strings, because
brand.md wraps lines (e.g. "Foundational Capability / Patterns" across lines 44–45). The `source` phrases avoid
brand.md's `**` bold markers.

### 1. `diagnose` · Diagnose problems in real processes

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Diagnosed a QA issue-tracking bottleneck (one spreadsheet per person) and moved the team to Linear` | `/projects/linear-ai-workflow` | `QA/Eng issue tracking moved to Linear` · brand 43; "one spreadsheet per person": the linked page's `detail.problem` |
| Personal | `Named the three walls every single-session agent run hit: context, usage limits, the permission classifier` | `/projects/agent-harness#diagnose` | `the model's context limit, the plan's usage limit, or the auto-mode permission classifier` · AH 14–15 |
| Personal | `Found 92 titles still wrong on my phone while every library count matched` | `/projects/home-media-server#diagnose` | `92 titles were still wrong on the phone` · MS 75 |

### 2. `design` · Design systems and make decisions explicit

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Updated MAXX Potential's Foundational Capability Patterns for AI-assisted rapid prototyping: solution tiers, citizen vs. professional pathways` | `/experience` | `Foundational Capability Patterns for AI-assisted rapid prototyping` · brand 44–45 |
| Builder Clarity | `Replaced per-client builds with one multi-tenant integration platform: onboarding from ~2 days to ~6 hours` | `/projects/ghl-jobtread-integration` | `multi-tenant integration platform` · brand 47 |
| Personal | `Kept a numbered decision ledger for my agent harness: what I chose, over what, and why` | `/projects/agent-harness#decisions` | `D-H1…D-H24` · AH 5 |
| Personal | `Split ownership in my music server: Navidrome owns the songs and playlists; the crates app owns only the crate flags, the wanted queue and approvals` | `/projects/home-media-server#decide` | `the app owns the flag` · MS 43 |

### 3. `deliver` · Deliver working, verified software

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Bootstrapped git-tracked database migrations for the team` | `/experience` | `Bootstrapped git-tracked DB migrations` · brand 46 |
| Builder Clarity | `Built ETL pipelines from 4+ sources into Postgres` | `/experience` | `into Postgres` · brand 48 (the `4+` sits inside bold markers) |
| Personal | `My agent harness verified and merged 52 features through 12 PRs in two runs, each milestone re-checked by an independent session` | `/projects/agent-harness#verify` | `52 verified and merged through 12 PRs` · AH 69 |
| Personal | `Put HitList on my iPhone and found the crash that 374 passing tests missed` | `/projects/hit-list#lessons` | `374 green tests, crash on the phone` · HL 59 |

### 4. `lead` · Lead process and delivery

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Served as de facto project manager on a client engagement` | `/experience` | `De facto project manager on a client engagement` · brand 44 |
| MAXX Potential | `Moved the team to Linear and an AI-agent workflow: 2× sprint throughput` | `/projects/linear-ai-workflow` | `2× sprint throughput` · brand 43 |
| Builder Clarity | `Introduced Agile/Scrum in Linear for stakeholder visibility` | `/experience` | `introduced Agile/Scrum in Linear` · brand 48 |
| Personal | `Ran this site's update as specs, milestones and pull requests that I review and merge` | `https://github.com/mh550/portfolio_site` | `the run's PRs on github.com/mh550/portfolio_site are public proof` · AH 99 |

### 5. `teach` · Communicate and teach

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Onboarded the team to git-tracked database migrations` | `/experience` | `onboarded the team` · brand 46 |
| Personal | `Mentored 12–18-year-old snowboarders at High Cascade: targeted drills, safe progression, patient feedback` | `/experience` | `Mentored 12–18-year-old snowboarders` · spec D9 (D35: labelled Personal) |
| Personal | `Designed the runbooks and specs my agents work from, so a fresh session picks up the work from disk` | `/projects/agent-harness#iterations` | `fresh sessions force state onto disk` · AH 49–50 |

### 6. `ai` · Use AI with guardrails

| Context | Text | Href | Source phrase · line |
|---|---|---|---|
| MAXX Potential | `Moved QA tracking to Linear plus an AI-agent workflow: ~80% less bug-filing time` | `/projects/linear-ai-workflow` | `~80% less bug-filing time` · brand 43–44 |
| Personal | `Designed my agent harness to merge only a tree that is byte-for-byte the one that was verified` | `/projects/agent-harness#decisions` | `byte-for-byte a tree that was verified` · AH 57–58 |
| Personal | `An independent review of v3 of my agent harness, before its first run, found 2 critical and 8 important bugs` | `/projects/agent-harness#lessons` | `found 2 critical + 8 important bugs` · AH 87 |

Every competency has a MAXX Potential item (6 of 6; the step needs ≥ 4): the bank (brand 43–46) supports one each.
No MAXX claim outside brand 43–46 is used. Item counts: 3, 4, 4, 4, 3, 3.

## Evidence page

`src/app/evidence/page.tsx`, a Server Component, static:

- `metadata`: title `'Evidence of practice — Michael Herron'`, `robots: { index: false }`. Not in `Navbar.tsx`, and
  M8's sitemap excludes it (spec M8).
- h1: `Evidence of practice — Michael Herron`.
- Reading note (one sentence, `evidenceIntro.reading` in `competencies.ts`): `Each competency lists two to four pieces of my work, each labelled with where I did it and linked to the case study, role or repo it comes from.`
- D7 note (`evidenceIntro.mapping`): `For now these map to general competencies; once I have the MAXX Potential level-4 rubric, this page will follow it instead.`
- Six `section`s with an h2 each and a `ul` of resolved items: the context as a small label, then the item text as
  the link. External repo links open in a new tab with `rel="noopener noreferrer"`; internal ones use `next/link`.
- `docs/notes/maxx-level-4.md` (M7-03): where Michael pastes the rubric, and that remapping = editing
  `src/lib/data/competencies.ts` only (titles, ids and which items sit under which competency).
- `/evidence` goes into `.harness/smoke-routes.txt`.

## Tests

M7-02:
- `src/__tests__/lib/approach-links.test.ts`: the six ids and titles in order; each principle has a summary and
  1–3 examples; every `anchor` is one of the eight; every `projectSlug` is one of the five; exactly one example has
  no slug (D14) and it has no anchor; for every resolved example the slug is in `projects`, and an anchor is present
  only when that project has a `caseStudy` whose `getCaseStudyAnchors` includes it; with `projects` mocked without
  `hit-list` (and, separately, without a `caseStudy` on `agent-harness`), `resolvedExamples` drops the hit-list
  examples and the agent-harness anchors; every principle keeps ≥ 1 example on the current data.
- `src/__tests__/pages/approach.test.tsx`: the h1, the two intro sentences, the six principle h2s, the five method
  labels and lines (visible: not inside `.sr-only`), every link whose href starts `/projects/` resolves to a slug in
  `projects` (and its hash, if any, to an anchor that project renders), the closing link is `/projects/agent-harness`,
  and with `agent-harness` mocked out it is `/projects` and no link names it; links that share a name share an href;
  `metadata.title`.
- `MethodStrip.test.tsx` gains: `showLines` renders the lines without `sr-only`; the default is unchanged.

M7-03:
- `src/__tests__/lib/competencies-links.test.ts`: the six titles in order; 2–4 items each; ≥ 4 competencies with a
  MAXX Potential item; each MAXX and Builder Clarity item's `source` is in brand.md and each Personal item's `source`
  in one evidence brief or the spec (whitespace collapsed); every href is an internal route among `/`, `/about`,
  `/skills`, `/projects`, `/experience`, `/contact`, `/approach`, `/card`, or `/projects/<existing slug>` with an
  optional anchor among the eight (only when that project has a `caseStudy` rendering it), or exactly one of
  `https://github.com/mh550/{agent-harness,hit-list,dj-crate-streaming,portfolio_site}`; no href is `/evidence`.
- `src/__tests__/pages/evidence.test.tsx`: h1, reading note, D7 note, six h2s, each item rendered as a link with its
  context label, `metadata.robots.index === false`; `Navbar.test.tsx`: no link to `/evidence`.
- `content-guard.test.ts` covers the new files untouched (the private-repo pattern guards the hrefs).
- Both milestones: `node .harness/smoke.mjs http://localhost:$HARNESS_PORT /approach` (and `/evidence`) PASS at 1280
  and 390; `.harness/check.sh` green.

## What Michael will see

M7-04, 2026-10-19. Full-page captures from the dev server (port 7800) with `reducedMotion: 'reduce'`, taken after
scrolling top to bottom and back to the top (so the fixed Navbar sits at the top), saved as 256-colour palette PNGs
with sharp. All four are **full pages** under 400 KB, so no top-3000 crop was needed. The measurements come from the
DOM in the same pass (script: `$HARNESS_SCRATCH/m7-shots.mjs`): 0 console or page errors,
`document.documentElement.scrollWidth − innerWidth` = **0** at 390 and at 1280 on both pages, no element in `<main>`
below opacity 1, no clipped text. The round "N" at the left is the Next dev indicator, not on the live site.

| Page · width | What is on screen | Anything wrong |
|---|---|---|
| `/approach` · 390 (`docs/screenshots/v2/M7-approach-390.png`, 191 KB, 390 × 5815, full page) | Hamburger navbar; eyebrow "APPROACH"; h1 "How I work"; the two intro sentences. **Method strip** stacked, left-aligned: Diagnose, Decide, Build, Verify, Simplify, each with its line visible (`showLines`), no arrows. **Six principles** as h2s in order (Diagnose before building · Make decisions explicit · Fakes mirror reality · Verify what the human will see · Simplify after use · Automate the bookkeeping, keep judgment human), each with its summary and 3 examples; links per principle 3 · 3 · 3 · 3 · 2 · 3 = 17 (Simplify's third, the D14 "chose not to build" example, is text only, as planned). Link names "<project title>: <section>" wrap onto two lines under the example. **Closing line** "This site update was built that way, one verified milestone at a time." with "Read the agent harness case study" → `/projects/agent-harness`; footer | Nothing to fix |
| `/approach` · 1280 (`M7-approach-1280.png`, 213 KB, 1280 × 3754) | Full navbar (no Approach link yet, M8 adds it); the same content in a 768 px column; the method strip in one row of five with → between the first four and the lines under each label; six principles, 17 links, each link name on one line; closing line and link | Nothing to fix |
| `/evidence` · 390 (`M7-evidence-390.png`, 111 KB, 390 × 3648) | Eyebrow "EVIDENCE"; h1 "Evidence of practice — Michael Herron" on three lines; the reading note; the D7 note in muted text. **Six competencies** as h2s in order, items 3 · 4 · 4 · 4 · 3 · 3 = 21, every item a link under its context label (MAXX POTENTIAL first in all six, then BUILDER CLARITY, then PERSONAL); one external link (`https://github.com/mh550/portfolio_site`) ending in ↗; footer. `meta robots` = `noindex`; 0 Navbar links to `/evidence` | **Fixed in M7-04:** the ↗ after "…that I review and merge" wrapped onto a line by itself. The arrow now follows a no-break space (U+00A0), so it stays with "merge" (new test in `evidence.test.tsx`; re-captured, it sits on the "merge" line) |
| `/evidence` · 1280 (`M7-evidence-1280.png`, 131 KB, 1280 × 2784) | Full navbar without Evidence; h1 on two lines; the two notes; six competencies with 21 linked items, most on one or two lines; the ↗ on the portfolio_site line | Nothing to fix |

**Anchor landings.** Each hashed example link from `/approach`, opened with Playwright `page.goto` (from
`about:blank`, so every one is a full load), returned 200 and `document.getElementById(hash)` found the element:

| Link (from `/approach`) | Status | Element found |
|---|---|---|
| `/projects/agent-harness#diagnose` | 200 | `LI#diagnose` "01 Diagnose" |
| `/projects/hit-list#decisions` | 200 | `SECTION#decisions` "Key Decisions" |
| `/projects/home-media-server#lessons` | 200 | `SECTION#lessons` "What Broke" |

The other 8 hashed links on `/approach` (home-media-server#diagnose, agent-harness#decisions,
home-media-server#decisions, agent-harness#lessons, hit-list#lessons, agent-harness#verify, home-media-server#simplify,
hit-list#simplify) and the 8 on `/evidence` (adding agent-harness#iterations) passed the same check: 19 of 19.

## Review

M7-05, 2026-10-19. The diff is `b5fbd93..55f7fd4` without `.harness/runs` and the screenshots (1735 lines). It was
written to `$HARNESS_SCRATCH/M7.diff` and reviewed from there by two Opus reviewers: one for code, one fact-checking
all 39 claims. The `web-design-guidelines` pass was run by hand. Tests went from 508 to 552 (50 → 51 suites).

### Findings

| # | Severity | Where | Finding | Done |
|---|---|---|---|---|
| F1 | Important | `competencies.ts` design-2 | "3 clients" isn't on `/projects/ghl-jobtread-integration` (only `/experience` and brand 47 have it) | Took "3 clients" out of the item; the onboarding figure is on the page (metric, outcome). New test `claims-on-linked-page.test.ts`: every number in an example or item also appears in the data of the page its link opens (37 links, repo links excluded) |
| F2 | Important | `approach.ts` 2a, `competencies.ts` design-3 | "D-H1 to D-H24" is sourced (AH 5), but `#decisions` shows 6 entries and never says 24 | Reworded: "a numbered decision ledger. The first entry, D-H1: …" and "Kept a numbered decision ledger …: what I chose, over what, and why" (the DecisionLog's chose/over/because). Caught by the same test |
| F3 | Important | `approach.ts` 6c | "The first real download was mine to approve" reads as done; the linked page (D7 cost, outcome) says the path had not run live as of Oct 17 | "Nothing downloads on its own: the first real download is mine to approve, by hand. As of Oct 17 the download path had not run live." Test first |
| F4 | Important | `competencies.ts` teach-3 | "Wrote the runbooks and specs my agents work from" overclaims: a planning session wrote HitList's overnight spec (HL 47), and brand.md (Voice) says he *designed* the specs | "Designed the runbooks and specs …". Test first: no item says "wrote the specs/runbooks" |
| F5 | Important | `competencies.ts` design-4 | The Navidrome/crates ownership split is told in the Decide step (`projects.ts` home-media-server `method.decide`); `#decisions` only has D7, D18, D27 | Linked to `#decide`. Test first |
| F6 | Important | `competencies.ts` `evidenceIntro.reading` | "linked to where you can check it" overpromises: 7 of 21 items link to `/experience`, which restates the claim | "… linked to the case study, role or repo it comes from." Test first |
| F7 | Important (accepted) | `approach.ts` 1a, `competencies.ts` diagnose-1, lead-3 | The MAXX "bottleneck / one spreadsheet per person" detail and the Builder Clarity "for stakeholder visibility" are not on brand.md's bank lines; they come from `docs/notes/apprentice-profile.md` and are already published on `linear-ai-workflow` and `/experience` | Kept, as M7-01 did: no number involved, and the linked page states it. Whether brand.md should grow these phrases is Michael's call, low stakes |
| F8 | Minor | `approach/page.tsx` | Link names repeated the full title: "Agent Harness: overnight software delivery with verification gates: Diagnose" | Named from the title up to its first colon ("Agent Harness: Diagnose", "HitList: What Broke"). Test first |
| F9 | Minor | `approach/page.tsx` | `SECTION_NAMES` was a hand copy of three case-study h2s, typed `Partial` | One `caseStudySectionHeadings` in `case-study/sectionHeadings.ts`, read by `DecisionLog`, `IterationTimeline`, `LessonList` and `/approach` |
| F10 | Minor | `approach.ts`, `competencies.ts` | `resolvedExamples` and `resolvedItems` repeated the same project/anchor check | One `resolveProjectLink(slug, anchor?)` in `projects.ts`, used by both |
| F11 | Minor | `approach`, `evidence`, `card` pages | Three copies of the focus-outline class string | One `focusRing` in `src/components/focusRing.ts` |
| F12 | Minor | `MethodStrip.tsx` | On `/approach` the list's name "How I work" repeated the h1 | New `label` prop (default "How I work"); `/approach` passes "The five steps". Test first |
| F13 | Minor | `approach.test.tsx` | The link count was `>= 17` | Exact: resolved linked examples + 1 |
| F14 | Minor | `evidence.test.tsx` | The no-break space was a literal U+00A0 in a regex | ` ` |
| F15 | Minor | both page tests | The "without hit-list" tests could pass vacuously | Each first asserts a hit-list link exists |
| F16 | Minor | four test files | `withoutProject` / `withoutCaseStudy` were copied four times | One `src/__tests__/helpers/projects.ts` |
| F17 | Minor | `approach.ts` 5c | 37-word sentence (brand: short sentences) | Split at "chose not to build it." |
| F18 | Minor | `competencies.ts` ai-3 | "Had v3 … independently reviewed" is passive | "An independent review of v3 …, before its first run, found 2 critical and 8 important bugs" (AH 87's wording) |
| F19 | Minor (left) | `approach`/`evidence` pages | The eyebrow, h1 and closing-link labels are in the components, not `lib/data` | Left: every page on the site writes its h1 and eyebrow in `page.tsx` (about, skills, projects, experience, contact). Moving all of them is one site-wide change, not an M7 change |
| F20 | Minor (left) | `competencies.ts` lead-4 | The repo root is a weaker proof than the `pulls?q=is:pr+harness` filter (AH 99–100) | Left: the M7-03 step only allows the four repo roots as https hrefs; changing that is a feature-list change (Proposed changes) |

0 Critical. 6 Important fixed and 1 accepted. 11 Minor fixed and 2 left with a reason.

### Fact-check

Sources: brand = `docs/notes/brand.md`, AH/MS/HL = the evidence briefs, P = the linked project's data in
`projects.ts`, E = `experience.ts`, with line numbers as of M7-05. ✓ = ok as shipped; ✎ = fixed above.

| Ref | Claim | Source | Linked page states it | |
|---|---|---|---|---|
| 1a | QA bottleneck, one sheet per person, no status history; 2× sprint throughput | brand 43 (2×); detail F7 | `linear-ai-workflow` problem, metrics | ✓ (F7) |
| 1b | three walls; every repo silent 00:12–07:19 | AH 14–15, 23 | `#diagnose` | ✓ |
| 1c | 92 titles wrong while counts matched; 28 second copies | MS 64, 75 | `#diagnose` | ✓ |
| 2a | numbered ledger; D-H1 a fresh session per feature | AH 5, 49–50 | `#decisions` D-H1 | ✎ F2 |
| 2b | `#crate` tag moved into the crates app's DB; the app owns the flag | MS 42–43 | `#decisions` D27 | ✓ |
| 2c | import moved from Profile to Spots; D12 | HL 35–36 | `#decisions` D12 | ✓ |
| 3a | made-up limit message; 45 sessions counted as failed attempts in 6 min; real fixture | AH 79–82, correction 111–112 | `#lessons` | ✓ |
| 3b | guessed fake hid 3 critical bugs; fakes from captured responses | MS 73–74 | `#lessons` | ✓ |
| 3c | test DB enforced foreign keys, the phone's did not | HL 62–64 | `#lessons` | ✓ |
| 4a | 859 = 859 = 859 while 92 titles wrong | MS 75 | `#lessons` | ✓ |
| 4b | "7679.1 mi" without GPS; a screen table caught it | HL 70–71, correction 92–94 | `#lessons` | ✓ |
| 4c | independent verify, one row per step; only the verified tree merges | AH 37–40, 57–58 | `#verify` | ✓ |
| 5a | four tiers → lossless or 256 kbps and up | MS 38 | `#simplify` | ✓ |
| 5b | 20+ fields in five sections → seven; specified, not built | HL 37–42 | `#simplify` | ✓ |
| 5c | invite/gig app spec'd, not built; iOS Shortcut | spec D14, D34 (no link) | — | ✎ F17 |
| 6a | bash driver does the git bookkeeping; every PR waits for Michael | AH 32, 56; spec D2 | `#decisions` D-H5 | ✓ |
| 6b | ~80% less bug-filing time | brand 43–44 | `linear-ai-workflow` | ✓ |
| 6c | nothing downloads on its own; not run live as of Oct 17 | MS 35 | `#decisions` D7 cost | ✎ F3 |
| diagnose-1 | QA bottleneck, moved to Linear | brand 43; detail F7 | `linear-ai-workflow`, E MAXX 1 | ✓ (F7) |
| diagnose-2 | three walls | AH 14–15 | `#diagnose` | ✓ |
| diagnose-3 | 92 titles wrong while counts matched | MS 75 | `#diagnose` | ✓ |
| design-1 | Foundational Capability Patterns; tiers, pathways | brand 44–45 | `/experience` | ✓ |
| design-2 | multi-tenant platform; ~2 days → ~6 hours | brand 47 | `ghl-jobtread-integration` metric, outcome | ✎ F1 |
| design-3 | numbered decision ledger: chose, over, why | AH 5 | `#decisions` | ✎ F2 |
| design-4 | Navidrome owns songs/playlists; crates app the flags, queue, approvals | MS 20–23, 43 | `#decide` | ✎ F5 |
| deliver-1 | git-tracked DB migrations | brand 46 | `/experience` | ✓ |
| deliver-2 | ETL from 4+ sources into Postgres | brand 42, 48 | `/experience` | ✓ |
| deliver-3 | 52 features, 12 PRs, two runs, independent verify | AH 67, 69 | metrics, `#verify` | ✓ |
| deliver-4 | 374 passing tests, crash on the iPhone | HL 59–61 | `#lessons` | ✓ |
| lead-1 | de facto PM on a client engagement | brand 44 | `/experience` | ✓ |
| lead-2 | Linear + AI workflow: 2× sprint throughput | brand 43 | `linear-ai-workflow` | ✓ |
| lead-3 | Agile/Scrum in Linear for stakeholder visibility | brand 48; qualifier F7 | `/experience` | ✓ (F7) |
| lead-4 | this site's update as specs, milestones, PRs he merges | AH 40, 99–100 | repo root | ✓ (F20) |
| teach-1 | onboarded the team to migrations | brand 46 | `/experience` | ✓ |
| teach-2 | mentored 12–18-year-old snowboarders (Personal) | spec D9, D35 | `/experience` | ✓ |
| teach-3 | designed the runbooks and specs agents work from | AH 23, 49–50; brand Voice | `#iterations` | ✎ F4 |
| ai-1 | ~80% less bug-filing time | brand 43–44 | `linear-ai-workflow` | ✓ |
| ai-2 | merges only a byte-for-byte verified tree | AH 39–40, 57–58 | `#decisions` D-H17 | ✓ |
| ai-3 | review of v3 before first run: 2 critical, 8 important | AH 87–88 | `#lessons` | ✎ F18 |

Page copy: `approachIntro` holds ("Most": 15 of 18 examples carry an anchor), `approachClosing` links
`/projects/agent-harness`, the six summaries are sourced (MS 76, AH 56, spec D14), and `evidenceIntro.mapping`
matches D7. Never-publish list: no hits in either file (tailnet hosts, `100.x`, ntfy, `.env`, `/srv`, tokens,
AcoustID, Gatus, Spotify, `journal/raw`, phone patterns, private repos). No buzzwords.

### Simplification

- `MethodStrip` is the only method strip: the hero and `/approach` both render it (`showLines` and the new `label`
  are its only variations).
- No principle or competency copy is duplicated: the pages render `approach.ts` / `competencies.ts`, and the tests
  read the same exports (the two `/chose not to build/` matches pick out the D14 example; they don't restate it).
- One link resolver (F10), one set of section headings (F9), one focus ring (F11), one set of test helpers (F16).

### Web interface guidelines (`/approach`, `/evidence`)

| Rule | Result |
|---|---|
| Heading order | One h1, then six h2s on each page; sections are `aria-labelledby` their h2. Pass |
| Link text | Example links read "<project>: <section>" (F8), evidence links are the full claim, and the closing link says where it goes. External link: "(opens in a new tab)" sr-only, `rel="noopener noreferrer"`, ↗ `aria-hidden`. Pass |
| Focus states | `focus-visible` 2 px accent outline on every link (`focusRing`), with tests on both pages. Pass |
| Hover states | Evidence links change colour on hover. The `/approach` links had none at rest → fixed with `hover:decoration-2` |
| Reduced motion | Only `ScrollReveal`, which renders static under `prefers-reduced-motion`; `MethodStrip` has no motion. Pass |
| Lists | `ul`/`li` for examples and items; the method strip is an `ol` with `role="list"` and its own name (F12); no empty list when everything filters out (tested). Pass |
| Typography | The no-break space before ↗ (M7-04). Straight quotes and apostrophes, as on every other page of the site (0 curly quotes in `lib/data`): left, since curly quotes would be a site-wide change |
| Copy | Sentence-case headings follow the spec's titles, not the guideline's Title Case: left, on purpose |
| Overflow, 390 | 0 px (M7-04, re-checked in M7-05) |

### Verified after the fixes

- A Sonnet browser check on :7800 (`$HARNESS_SCRATCH/browser-M7-05/check.mjs`, 390 and 1280, reduced motion) passed
  7 of 7 points. It found 0 console or page errors and 0 px overflow. `/approach` has one h1, six h2s, the strip
  `ol` named "The five steps", and 17 example links that each match `^[^:]+: [^:]+$` plus the closing link.
  `/evidence` has noindex, six h2s, 21 item links, the new reading note, and the ownership item on `#decide`. All 19
  hashed links (11 + 8) return 200 and their element exists. The first example link gets a 2 px solid
  `rgb(0, 212, 255)` focus outline. I looked at both 390 px shots.
- The four `docs/screenshots/v2/M7-*.png` were re-captured with the M7-04 script after the copy fixes: approach-390
  179 KB (390 × 5661), approach-1280 204 KB, evidence-390 113 KB (390 × 3707), evidence-1280 132 KB. In the same pass
  hscroll was 0, nothing was clipped, and there were 0 errors. The sizes in the table above are M7-04's.
- `.harness/check.sh` and `node .harness/smoke.mjs` are green (see the M7-05 progress entry).

Ready to merge: yes
