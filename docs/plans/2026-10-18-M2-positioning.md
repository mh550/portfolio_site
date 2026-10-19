# M2 plan: positioning across the site (2026-10-18)

For the M2 build sessions (M2-02 … M2-06). Spec: `docs/specs/2026-10-18-portfolio-v2.md` § M2, decisions D1, D8,
D9, D13, D19, D20, D23, D24, and the new defaults D31 and D32 (appended by this plan). Copy rules:
`docs/notes/brand.md`. Everything below was checked against the tree at `5b9e3ff` (M6 verified, 392 tests, 40
suites). M7 has not run, so **M2-02 creates `MethodStrip`** (D23) and M7 reuses it.
An Opus review checked this plan against the notes and the code before commit (7 Important, 10 Minor; all applied:
root Open Graph without title/url, the reduced-motion tests, the NodeGraph redraw, the Deep dive links, the D9
exception, MAXX bullet 5 rewritten so it no longer overclaims).

Build order: M2-02 (metadata, hero, home), M2-03 (experience, about) and M2-04 (skills) are independent and touch
different files; M2-05 screenshots; M2-06 reviews.

## Files

| File | Feature | Change |
|---|---|---|
| `src/app/layout.tsx` | M2-02 | root `metadata` from `profile` |
| `src/components/MethodStrip.tsx` | M2-02 | new, no `"use client"` (no hooks), reads `methodSteps` |
| `src/components/hero/HeroSection.tsx` | M2-02 | eyebrow, tagline and subline from `profile`; MethodStrip; `min-h-svh`; reduced motion |
| `src/components/hero/FloatingLogos.tsx`, `NodeGraph.tsx` | M2-02 | reduced motion only (see Hero § Motion) |
| `src/components/projects/ProjectCard.tsx` | M2-02 | optional `headingAs?: 'h2' \| 'h3'` (default `'h2'`, so `/projects` is unchanged) |
| `src/app/page.tsx` | M2-02 | HeroSection + Recent work section |
| `src/components/SiteChrome.tsx` | M2-02 | Footer on `/` (D19) |
| `src/lib/data/experience.ts` | M2-03 | MAXX, Builder Clarity, High Cascade bullets; `gpa` removed |
| `src/app/experience/page.tsx` | M2-03 | GPA line removed; metadata description |
| `src/lib/data/approach.ts` | M2-03 | `aboutIntro: string[]` (D32) |
| `src/app/about/page.tsx` | M2-03 | intro under the h1; metadata description |
| `src/lib/data/skills.ts` | M2-04 | four capability groups |
| `src/app/skills/page.tsx` | M2-04 | featured panel + three stacked group cards; intro line and metadata description |

No new dependencies. No positioning literal (`'Systems & Process Engineer'`) and no subline literal in any non-test
`.tsx` under `src/` or in any data file other than `profile.ts`; components read `profile` (M2-06 greps for this,
excluding `src/__tests__/`, where tests such as `card.test.tsx` and `HeroSection.test.tsx` assert the literal).

## Metadata

`src/app/layout.tsx` (M2-02). `metadataBase` already exists (D24, M1-04); keep it.

```ts
const siteTitle = `${profile.name} — ${profile.positioning}`; // 'Michael Herron — Systems & Process Engineer'

export const metadata: Metadata = {
  // Resolves relative Open Graph image paths (D24)
  metadataBase: new URL(profile.siteUrl),
  title: siteTitle,
  description: profile.subline,
  // No title, description or url here: Next fills og:/twitter: title and description from each page's own
  openGraph: {
    type: 'website',
    siteName: profile.name,
    images: [{ url: profile.headshot, alt: `${profile.name} headshot` }],
  },
  twitter: { card: 'summary', images: [profile.headshot] },
};
```

- `title` is a plain string, not a template: every page already sets its own full title ("About — Michael Herron").
- Next merges `openGraph` shallowly and only `/card` sets its own (`src/app/card/page.tsx:11-12`); the project pages
  and about/skills/experience/contact set only `title`/`description` (`src/app/projects/[slug]/page.tsx:14-22`). They
  inherit the root block, which is why it carries **no** `title`, `description` or `url`: when the inherited block has
  none, Next fills og:title/og:description and the twitter ones from the page's own `title` and `description`
  (`node_modules/next/dist/lib/metadata/resolve-metadata.js` ~586–642). So a shared project link unfurls with the
  project's title, its `shortDescription`, the site name and the headshot, not with the home page's title.
- `src/__tests__/app/layout-metadata.test.ts` imports `{ metadata }` from `@/app/layout` (next/jest already maps
  `next/font/*` and `.css` to mocks, so no extra mock is needed) and asserts: `title` is `'Michael Herron — Systems &
  Process Engineer'`; `description` is `profile.subline`; `String(metadata.metadataBase)` is
  `'https://michael-herron.vercel.app/'`; `openGraph.siteName` is `'Michael Herron'`; `JSON.stringify(openGraph.images)`
  contains `'/photos/headshot.png'`; `openGraph` has no `title`/`description`/`url` keys; `JSON.stringify(twitter)`
  contains `'summary'`. (`next build` type-checks tests: `metadataBase` is `null | string | URL` and the `Twitter`
  union has members without `card`, so stringify or narrow rather than reading `.href` / `.card` directly.)

## Hero

`src/components/hero/HeroSection.tsx` (M2-02). Top to bottom:

| # | Element | Source | Classes (change from today in bold) |
|---|---|---|---|
| 1 | eyebrow `<p>` | `profile.positioning` → "Systems & Process Engineer" | font-mono accent text-sm tracking-[0.3em] uppercase **mb-4 sm:mb-6** |
| 2 | `<h1>` "Michael **Herron**" | unchanged literal markup (the cyan span needs the split) | **mb-4 sm:mb-6** |
| 3 | tagline `<p>` | `profile.tagline` (same string as today) | text-xl sm:text-2xl muted font-light tracking-wide **mb-4** |
| 4 | subline `<p>` (new) | `profile.subline` | text-base sm:text-lg text-[var(--color-foreground)]/80 max-w-2xl mx-auto mb-8 |
| 5 | `<MethodStrip />` (new) | `methodSteps` | wrapper mb-8 sm:mb-10 |
| 6 | buttons | unchanged: **View Projects** → `/projects`, **About Me** → `/about` | unchanged |

Stays: `NodeGraph`, `FloatingLogos`, the radial overlay, the fade-up variants (delays 0, 0.15, 0.3 as today; then
**subline 0.4, strip 0.5, buttons 0.6**, the buttons moving from 0.45), `pointer-events-none` on the content with `pointer-events-auto` on the buttons. No
scroll indicator (the existing test keeps asserting that).

### MethodStrip

`src/components/MethodStrip.tsx`, D23. Props: `{ className?: string }`; it always renders all five `methodSteps`.

```tsx
<ol aria-label="How I work" className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-2
    md:grid md:grid-cols-5 md:items-start md:gap-4 ${className ?? ''}`}>
  {methodSteps.map((step, i) => (
    <li key={step.id} className="text-center">
      <span className="font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
        {step.label}
      </span>
      {i < methodSteps.length - 1 && <span aria-hidden="true" className="mx-2 text-[var(--color-muted)]">→</span>}
      <p className="sr-only md:not-sr-only md:mt-2 md:text-xs md:leading-snug md:text-[var(--color-muted)]">
        {step.line}
      </p>
    </li>
  ))}
</ol>
```

- **D31 *default*:** below 768 px the strip shows the five labels with arrows (one or two wrapped rows); each step's
  `line` is visible from `md` (768 px) up and is read by screen readers at every width (`sr-only md:not-sr-only`).
  Reason: with the lines visible at 390 px the strip alone is ~300 px tall and pushes both buttons below a 390×844
  fold (see the budget below). The full lines are on `/approach` (M7) for every width.
- The strip contains no links and no buttons (M7 may wrap the labels in anchors on `/approach`; that is M7's call).
- Contrast: labels are `#00d4ff` on `#0a0a0f` (≈ 11.2:1); lines `#8888a0` on `#0a0a0f` (≈ 5.7:1), both AA.
- At `md` and up the arrow sits after each label inside its grid cell, so it reads Diagnose → | Decide → | … |
  Simplify.

### 390 px layout and the fold

Measured today (Sonnet, Playwright, `next dev` on :7800, after 2.5 s): the hero is `h-screen` (844 tall at 390×844,
667 at 375×667, 800 at 1280×800), nav bottom 65. At 390×844: eyebrow 209–249 (two lines: the 33-character eyebrow
wraps), h1 273–393 (two lines), tagline 417–473, View Projects 513–557, **About Me 573–619**. At 375×667 About Me
ends at 545; at 1280×800 at 533. No horizontal scroll at any of the three. The before shot is
`$HARNESS_SCRATCH/M2-01-hero-before-390.png`.

Budget after M2 at 390×844 (content column 342 px): today's content is 410 px tall (209 → 619). The subline is ~100
characters at 16 px, so about 4 lines (≈ 96 px) + 32 px margin. The label strip is two wrapped rows (≈ 56 px) + 32
px margin. The tighter mobile margins above take back about 36 px. That is ≈ 590 px of content, centred in 844, so
roughly 127 → 717: everything clears the 65 px nav and **About Me should end near 720 ≤ 844**. M2-02 measures the
real number and writes it in this section; M2-05 copies it into the table.

**Measured after M2-02** (Sonnet, Playwright on :7800, `next dev`, after 2.5 s; page-absolute top–bottom in px):

| Viewport | eyebrow | h1 | tagline | subline | strip | View Projects | About Me | hero height |
|---|---|---|---|---|---|---|---|---|
| 390×844 | 159–179 | 195–315 | 331–387 | 403–475 | 507–563 | 595–639 | **655–701** | 844 |
| 375×667 | 96–116 | 132–252 | 268–352 | 368–440 | 472–528 | 560–604 | **620–666** | 746 (grows, page scrolls) |
| 1280×800 | 174–194 | 218–314 | 338–370 | 386–442 | 474–556 | 596–642 (same row) | 596–642 | 800 |

About Me ends at **701 ≤ 844** at 390×844 (the estimate was ~720), and at 666 ≤ 667 at 375×667. No overlaps,
`scrollWidth − innerWidth` 0 at all three, nav bottom 65. Under `reducedMotion: 'reduce'` the boxes are identical and
eyebrow and About Me have opacity 1 at 100 ms. The step lines are a 1×1 `sr-only` box at 390 and 375 and visible at
1280. Below 768 the labels wrap Diagnose → Decide → Build → / Verify → Simplify, so an arrow trails "Build" at the
line end (cosmetic; for M2-05 to judge). Shots: `$HARNESS_SCRATCH/M2-02-hero-390.png`, `M2-02-hero-1280.png`.

**Height:** `h-screen` becomes **`min-h-svh`** with `pt-24 pb-16` (keep `-mt-16`, `flex items-center
justify-center`, `overflow-hidden`). At 390×844 the hero still fills exactly one screen. On a short phone (375×667,
602 px under the nav) the content (~590 px plus padding) no longer fits; with `h-screen overflow-hidden` it would be
clipped at the top and bottom, whereas `min-h-svh` lets the hero grow and the page scroll. (`min-h-svh` is the
small-viewport form of `min-h-screen`, so it is M2-02 step 4's "`min-h-screen` and scrolls cleanly" alternative.) `NodeGraph` already resizes
its canvas with a `ResizeObserver` (`canvas.offsetHeight`), so a taller hero needs no change there.

### Motion

The hero does not honour `prefers-reduced-motion` today: the fade-ups always run, `FloatingLogos` loops forever and
`NodeGraph` animates every frame. M2-06 checks this, so M2-02 fixes it in the same way `ScrollReveal` does:

- `HeroSection`: `const reduced = useReducedMotion()`; every `motion.*` keeps `initial="hidden" animate="visible"`
  (same element: the server can't know the preference; see the comment in `ScrollReveal.tsx`) but gets
  `variants={reduced ? instant : fadeUp}`, where `instant = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1,
  y: 0, transition: { duration: 0 } } }`. A `transition` prop would not work: the transition inside a variant wins
  over the component's `transition` prop.
- `FloatingLogos`: when `reduced`, no `animate` loop (the logos stay in place).
- `NodeGraph`: after the `if (!ctx) return` guard, `const reduced = window.matchMedia?.('(prefers-reduced-motion:
  reduce)')?.matches` (jsdom has no `matchMedia`, and the hero tests stub `getContext → null`). When reduced, don't
  start the `requestAnimationFrame` loop; draw one frame after `init()` **and** in the `ResizeObserver` callback
  (it fires on `observe()`, and setting `canvas.width` clears the canvas, so without a redraw the canvas is blank).
- Tests. Not `jest.resetModules()` + `require` as in `ScrollReveal.test.tsx`: after a reset the required component
  gets a fresh React and NodeGraph's real hooks fail with "invalid hook call". Instead the HeroSection test file
  declares `let mockReduced = false` and a `jest.mock('framer-motion', …)` factory that spreads
  `jest.requireActual('@/__mocks__/framer-motion')`, returns `useReducedMotion: () => mockReduced`, and wraps
  `motion.p`/`h1`/`div` to record each element's `variants` prop. With `mockReduced = true`, every recorded
  `variants.visible` resolves (call it with the `custom` value if it is a function) to `transition.duration === 0`;
  with `false`, to `0.7`. NodeGraph test: stub `window.matchMedia` (`matches: true`), a minimal 2D context, a
  `ResizeObserver` class that calls back on `observe()`, and spy on `requestAnimationFrame`: it is not called and
  `ctx.arc` (or `clearRect`) was called after the resize callback.

## Recent work

`src/app/page.tsx` (M2-02) renders `<HeroSection />` and then:

```tsx
<section aria-labelledby="recent-work-heading" className="max-w-5xl mx-auto px-6 py-20">
  <ScrollReveal>
    <h2 id="recent-work-heading" className="text-3xl sm:text-4xl font-bold mb-10">Recent work</h2>
  </ScrollReveal>
  <div className="grid gap-6 md:grid-cols-3">
    {getTopProjects(3).map((project, i) => (
      <ScrollReveal key={project.slug} delay={i * 0.05}>
        <ProjectCard project={project} headingAs="h3" />
      </ScrollReveal>
    ))}
  </div>
  <Link href="/projects" className="mt-10 inline-flex min-h-11 items-center gap-2 text-[var(--color-accent)] …">
    See all projects <span aria-hidden="true">→</span>
  </Link>
</section>
```

- On today's data `getTopProjects(3)` is `agent-harness` (1), `linear-ai-workflow` (2), `home-media-server` (3).
  **No test hard-codes these slugs**: `home.test.tsx` compares against `getTopProjects(3)`, as `card.test.tsx` does.
- `ProjectCard` is reused unchanged except for `headingAs` (default `'h2'`): under the section's h2 the card titles
  are h3, so the heading order is h1 (hero) → h2 Recent work → h3 × 3. The title is not a link; each card's link to
  its page is "Deep dive →" (`ProjectCard.tsx:82-87`). Three identical "Deep dive →" names on one page is a known
  link-text issue (also on `/projects`); M2-06's guidelines pass decides whether to add an `aria-label` with the
  title, for both pages at once.
- `md:grid-cols-3`: one column at 390, three cards of ~315 px at 1280 (max-w-5xl). The cards have no thumbnails, so
  each leads with its first metric (the existing PreviewBand).
- The link's accessible name is "See all projects" (the arrow is `aria-hidden`); it is ≥ 44 px tall (`min-h-11`).
- **Footer on `/` (D19):** `SiteChrome` renders `<Footer />` on every non-card path; the `pathname !== '/'` check and
  its comment go. `SiteChrome.test.tsx`'s case "/: nav and offset, no footer" becomes "/: nav, offset and footer".

## Experience

`src/lib/data/experience.ts` (M2-03). **Titles, companies and periods are byte-identical to today**; only bullets
and the `Education` shape change. The new arrays, word for word, each bullet with the brand.md line it comes from:

**MAXX Potential** (`title: 'Full-Stack Software Engineer'`), process work first, then the build work already on the
site:

1. `'Diagnosed a QA/Engineering issue-tracking bottleneck and moved the team to Linear with an AI-agent workflow: 2× sprint throughput and ~80% less bug-filing time.'`
   ("Diagnosed … bottleneck": apprentice-profile.md MAXX bullet 1 and today's copy; numbers: brand.md 43–44: "Linear + an AI agent workflow: **2× sprint throughput, ~80% less bug-filing time**")
2. `'Served as de facto project manager on a client engagement.'`
   (brand.md 44: "De facto project manager on a client engagement.")
3. `'Updated the org\'s Foundational Capability Patterns for AI-assisted rapid prototyping: solution tiers and citizen vs. professional development pathways.'`
   (brand.md 44–45, near verbatim)
4. `'Bootstrapped git-tracked database migrations and onboarded the team to them.'`
   (brand.md 46: "Bootstrapped git-tracked DB migrations and onboarded the team.")
5. `'Chose Linear partly for its MCP server, so the team\'s Claude Code workflow could fetch and update issues directly; bug filing and triage, including duplicate detection, became automated.'`
   (replaces today's "Pioneered agentic coding workflows across triage, implementation, and testing …", which
   overclaims: the lead engineer was already using Claude Code, Michael pushed for Linear, and the automation covered
   filing, triage and implementation, not testing. project_descriptions.md 13 "I pushed to adopt **Linear**", 19
   "an **MCP server**", 21 "*fetch* and *update* issues directly from his agentic AI development workflow", 25
   "Bug filing and triage became fully automated. Duplicates are automatically identified")
6. `'Built full-stack React Native features for a paint-estimator app, establishing development paradigms and reusable modules from go-live.'`
   (unchanged from today; project_descriptions.md § MAXX Potential › 3, lines 36–48)

**Builder Clarity** (`title: 'Founding Full-Stack Software Engineer'`):

1. `'First engineer hired. Architected a multi-tenant integration platform that eliminated per-client buildouts — scaling to 3 clients and cutting onboarding from ~2 days to ~6 hours.'`
   (unchanged; brand.md 47: "**3 clients**, onboarding **~2 days → ~6 hours**")
2. `'Integrated CRM, VoIP, and internal systems via secure data pipelines (GoHighLevel ↔ JobTread, RingCentral ↔ JobTread), eliminating manual data entry and saving ~8 hrs/week per client.'`
   (unchanged; brand.md 48: "**~8 hrs/week saved per client**")
3. `'Built and maintained ETL pipelines ingesting and normalizing data from 4+ sources into Postgres for a previously fragmented dataset.'`
   (**7+ → 4+**; brand.md 42 and 48: "'4+' is the committed outbound figure", "ETL from **4+ sources** into Postgres")
4. `'Introduced Agile/Scrum in Linear for stakeholder visibility, and led the technical migration from Zapier to n8n and Pipedream.'`
   (brand.md 48: "introduced Agile/Scrum in Linear"; the migration clause is today's copy, re-ordered)

**Tahoma Films** (`'AI Workflow Engineer'`): unchanged.

**High Cascade Snowboard Camp** (`'Snowboard Coach'`), D9: bullet 1 becomes
`'Mentored 12–18-year-old snowboarders; designed targeted drills, prioritized safe progression.'` (en dash, as
today); bullet 2 unchanged. ("12–18 snowboarders per session" misread an age range as a head count.)

**GPA (D8):** remove `gpa` from the `Education` interface and the `education` object; remove the
`<p>GPA: {education.gpa}</p>` line from `src/app/experience/page.tsx` and move its `mb-5` onto the degree line (so
the spacing above Honors stays). Nothing else on the page changes.

**Experience metadata:** `description: \`Work history and education of ${profile.name}.\`` (today's says
"full-stack and integration engineering", the old positioning).

### Traceability (every number in the planned bullets)

| Number | Bullet | Source |
|---|---|---|
| 2× | MAXX 1 | brand.md 43 "**2× sprint throughput**" |
| ~80% | MAXX 1 | brand.md 43–44 "**~80% less bug-filing time**" |
| 3 clients | BC 1 | brand.md 47 "**3 clients**"; apprentice-profile.md BC 1 |
| ~2 days → ~6 hours | BC 1 | brand.md 47 "onboarding **~2 days → ~6 hours**" |
| ~8 hrs/week | BC 2 | brand.md 48 "**~8 hrs/week saved per client**" |
| 4+ sources | BC 3 | brand.md 42, 48 ("7+" in apprentice-profile.md is superseded by brand.md 42) |
| 12–18-year-old | High Cascade 1 | **not in brand.md**: spec D9 ("his experience bank"), a settled decision that names this exact text; brand.md's metrics bank covers only MAXX and Builder Clarity (lines 42–48) |

So every number in the planned MAXX and Builder Clarity bullets is in brand.md; the one age range outside it is
fixed by D9. No other digits appear in the new bullets (MAXX 3's "Foundational Capability Patterns" and the rest carry none).
M2-03's test asserts `'7+'` is absent from `experience.ts` and that `'4+ sources'` is present.

## About

`src/app/about/page.tsx` (M2-03), D13. The intro, word for word (three sentences):

> I find where work breaks down, design the system that fixes it, then build it, run it, and measure it. I work in
> five steps: Diagnose, Decide, Build, Verify, Simplify. I own delivery from requirements to release.

Sources: sentence 1 is `profile.subline` (brand.md 21–22); sentence 2 names the method (brand.md 23); sentence 3 is
brand.md's supporting phrase (line 22).

- **D32 *default*:** the intro lives in `src/lib/data/approach.ts` as `aboutIntro: string[]`, built from data:
  `[profile.subline, \`I work in five steps: ${methodSteps.map((s) => s.label).join(', ')}.\`, 'I own delivery from
  requirements to release.']` (approach.ts imports `profile` from `./profile`). Not in `profile.ts`: `scripts/make-qr.mjs`
  imports `profile.ts` under Node's type stripping (D21), which can't resolve an extensionless `./approach` import.
- Placement: directly under the h1 "My Story", inside the header `ScrollReveal`, before the story block with the
  floated headshot. The h1's `mb-12` becomes `mb-6`; the intro is one `<p>` rendering `aboutIntro.join(' ')`, classes
  `text-xl leading-relaxed text-[var(--color-foreground)] max-w-2xl mb-12`. No new heading (an h2 "What I do"
  would put the story under it). The story paragraphs, the float, Philosophy and Outside the Terminal are unchanged.
- **About metadata:** `description: \`Duke CS grad, first engineer at Builder Clarity, now at MAXX Potential.
  ${profile.subline}\`` (every clause is in the story; it drops "full-stack and integration engineer").

## Skills

`src/lib/data/skills.ts` (M2-04). Four groups, in this order; `SkillCategory` is unchanged.

| id | name | featured | skills (in display order) |
|---|---|---|---|
| `process` | Process & delivery | **true** (D20) | Requirements, Specs and decision ledgers, AGILE/Scrum, Linear, Project management, Team onboarding, User-driven design (7) |
| `systems` | Systems & architecture | false | Multi-tenant architecture, ETL pipelines, RESTful APIs, OAuth 2.0, Webhooks, Pipedream, n8n, Zapier, Self-hosted infrastructure, Docker, Agent orchestration, Agentic AI (12) |
| `build` | Build | false | TypeScript, JavaScript, Python, PowerShell, Java, C/C++, Ruby, R, React, Next.js, React Native, Expo, Tailwind CSS, Framer Motion, Node.js, Flask, Ruby on Rails, PostgreSQL, Supabase, Supabase Edge Functions, MongoDB, SQLite, Claude Code, AI-assisted development (24) |
| `operate` | Operate & verify | false | Test-driven development, GitHub Actions, restic, Private networking, Git, Vercel, Linux CLI, WSL (8) |

51 strings, no duplicates (checked with a script against the table). The 12 new strings and their evidence:
Requirements (brand.md 22 "from requirements to release"); Specs and decision ledgers (brand.md 36); Project
management (brand.md 44 "De facto project manager"); Team onboarding (brand.md 46 "onboarded the team");
Self-hosted infrastructure and Docker (evidence-media-server.md 18 "Docker Compose"); Agent orchestration
(evidence-agent-harness.md 25 "Orchestrator + subagents by role"); Expo and SQLite (evidence-hit-list.md 16, 19);
GitHub Actions (evidence-hit-list.md 23 "CI: GitHub Actions"); restic (evidence-media-server.md 31); Private
networking (evidence-media-server.md 18 "a private Tailscale network"; the word Tailscale is not used, and no
hostname). **Left out:** "Monitoring" (the spec lists it, but the media server's heartbeat is built and not installed,
evidence-media-server.md 101) and "CI" as a bare word (GitHub Actions says it).

Every one of today's 39 skills survives:

| Skill today | Group today | Group after |
|---|---|---|
| Pipedream, n8n, Zapier, Multi-tenant architecture, RESTful APIs, OAuth 2.0, Webhooks | Integration & Automation | systems |
| TypeScript, JavaScript, Python, PowerShell, Java, C/C++, Ruby, R | Languages | build |
| React, React Native, Next.js, Tailwind CSS, Framer Motion | Frontend | build |
| Node.js, Flask, Ruby on Rails, PostgreSQL, Supabase Edge Functions, MongoDB | Backend | build |
| ETL pipelines | Backend | systems |
| Supabase, Claude Code | Tools & Platforms | build |
| Vercel, Git, Linux CLI, WSL | Tools & Platforms | operate |
| Linear | Tools & Platforms | process |
| AGILE/Scrum, User-driven design | Practices | process |
| Agentic AI | Practices | systems |
| AI-assisted development | Practices | build |
| Test-driven development | Practices | operate |

(7 + 8 + 5 + 6 + 1 + 2 + 4 + 1 + 2 + 1 + 1 + 1 = 39.) "AGILE/Scrum" keeps its spelling because M2-04's test
hard-codes today's strings; the site will show "AGILE/Scrum" as a skill chip and "Agile/Scrum in Linear" in the
Builder Clarity bullet (brand.md 48). Accepted; a later rename needs that test changed first.

`src/app/skills/page.tsx`:
- The featured group renders in the existing highlighted panel (cyan border, glow, "Differentiator" tag kept),
  which now shows **Process & delivery**.
- The other three render as stacked full-width cards (`grid gap-6`, no `sm:grid-cols-2`) in data order: Systems &
  architecture, Build, Operate & verify, each with an h2 and its chips. Three cards in a two-column grid would leave
  one alone and set Build (24 chips) beside a much shorter card.
- h1 stays "Tech Stack". The intro line becomes "Grouped by what I do, with the tools I use for each." and the
  metadata description "Skills grouped by capability: process and delivery, systems and architecture, building, and
  operating and verifying."

## Tests

Every new behaviour test fails first. Counts are rough; the session records the real before → after.

| Feature | File | Asserts |
|---|---|---|
| M2-02 | `src/__tests__/app/layout-metadata.test.ts` (new) | Metadata above |
| M2-02 | `src/__tests__/components/MethodStrip.test.tsx` (new) | an `ol` named "How I work" with 5 `li`; the labels Diagnose, Decide, Build, Verify, Simplify in document order; each `methodSteps[i].line` present; 4 arrows, all `aria-hidden`; no links or buttons |
| M2-02 | `src/__tests__/components/HeroSection.test.tsx` | eyebrow text 'Systems & Process Engineer' (`profile.positioning`), and 'Full-Stack & Integration Engineer' absent; tagline (existing); `profile.subline`; the five labels in document order, after the subline and before View Projects (`compareDocumentPosition`); both links (existing); the section has `min-h-svh`, not `h-screen`; the reduced-motion block (Hero § Motion) |
| M2-02 | `src/__tests__/components/NodeGraph.test.tsx` (new) or in HeroSection's file | reduced motion: no `requestAnimationFrame` loop |
| M2-02 | `src/__tests__/components/ProjectCard.test.tsx` | default title is an h2; with `headingAs="h3"` it is an h3 |
| M2-02 | `src/__tests__/pages/home.test.tsx` (new) | h2 "Recent work"; the h3 titles equal `getTopProjects(3).map((p) => p.title)` in order; the "Deep dive" links' hrefs equal `/projects/<slug>` for those three, in order; link "See all projects" with `href="/projects"`. Mock canvas as HeroSection.test does |
| M2-02 | `src/__tests__/components/SiteChrome.test.tsx` | `/` now has a footer |
| M2-03 | `src/__tests__/pages/experience.test.tsx` | exact titles for MAXX Potential, Builder Clarity, Tahoma Films (and 'Snowboard Coach'); High Cascade has a bullet starting 'Mentored 12–18-year-old snowboarders'; MAXX bullets contain '2×' and '~80%', 'de facto project manager', 'Foundational Capability Patterns', 'git-tracked database migrations'; Builder Clarity bullets contain '3 clients', '~2 days', '~6 hours', '~8 hrs/week', '4+ sources', 'Agile/Scrum in Linear'; no bullet contains 'Pioneered'; `queryByText(/GPA/)` is null; the old `GPA:` assertion goes |
| M2-03 | `src/__tests__/lib/data.test.ts` | `'gpa' in education` is false (replaces `education.gpa` truthy); `readFileSync('src/lib/data/experience.ts')` has no `'7+'` |
| M2-03 | `src/__tests__/lib/approach.test.ts` | `aboutIntro.length` ≤ 3; `aboutIntro[0] === profile.subline`; the joined text contains every `methodSteps` label |
| M2-03 | `src/__tests__/pages/about.test.tsx` | the intro (`aboutIntro.join(' ')`) renders and sits before the 'Duke University' story text (`compareDocumentPosition`); existing spot checks stay ('Duke University', plus a new one for 'Colorado'); `metadata.description` does not contain 'full-stack and integration engineer' |
| M2-04 | `src/__tests__/lib/data.test.ts` | 4 categories, ids `['process','systems','build','operate']` and the four names; exactly one featured, `process`; each ≥ 4 skills; the union ⊇ the 39 strings hard-coded from today's file plus Docker, restic, SQLite, Expo, Agent orchestration, Specs and decision ledgers; no duplicates |
| M2-04 | `src/__tests__/pages/skills.test.tsx` | the four group headings; 'Process & delivery' and 'Differentiator' are in the same panel (`closest('div.glow-accent')`); spot-checks 'TypeScript', 'Docker', 'Linear'; the old "Integration & Automation as featured" and category-name tests are replaced |

Expected: about 392 → 420 tests, 40 → 43 suites. The content guard
(`src/__tests__/lib/content-guard.test.ts`) must stay green untouched; none of the new copy has a phone number,
hostname, `TODO` or `[X]`.

## What Michael will see

Filled by M2-05 from `docs/screenshots/v2/M2-<page>-<width>.png`.

| Page | What is on screen | Anything that looks wrong |
|---|---|---|
| `/` at 390 | | |
| `/` at 1280 | | |
| `/about` at 390 | | |
| `/about` at 1280 | | |
| `/skills` at 390 | | |
| `/skills` at 1280 | | |
| `/experience` at 390 | | |
| `/experience` at 1280 | | |

## Review

Filled by M2-06.
