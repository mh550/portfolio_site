# P2: experience from the resume, with links (plan)

Date 2026-10-21. Spec: `docs/specs/2026-10-21-portfolio-v3.md` § 3 (links, layout) and § 8 (resume v4, the source
of every string below; the phone number is left out on purpose and is never added). Features: P2-01 data + links
component (this plan) → P2-02 page layout → P2-03 captures → P2-04 review. Decisions D82–D83 are allocated here and
recorded in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions. The next free number is D84. Built on the tree
after P1 (1146 tests, 84 suites).

## Data

`src/lib/data/experience.ts`, word for word from § 8 (straight `-` in the project periods as the resume has it; the
two role periods keep their current `–` strings: titles, companies and periods never change, brand.md).

| Export | Shape | Content |
|---|---|---|
| `Bullet` | `string \| { text: string; links: { text: string; href: string }[] }` | a plain line, or a line with link spans; every `link.text` occurs exactly once in `text` |
| `bulletText(b)` | `Bullet → string` | the line's text either way (tests, keys, claims check) |
| `roles: Role[]` | `{ title, company, period, bullets: Bullet[], type }` | MAXX Potential and Builder Clarity only, three § 8 bullets each |
| `resumeProjects: ResumeProject[]` | `{ name, href, repo, period, bullets: Bullet[] }` | Long-Running Agent Harness (`/projects/agent-harness`, `https://github.com/mh550/agent-harness`, `October 2026 - present`) and Self-Hosted Music Server & DJ Pipeline (`/projects/home-media-server`, `https://github.com/mh550/dj-crate-streaming`, `November 2025 - present`), two § 8 bullets each |
| `earlierRoles: EarlierRole[]` | `{ title, company, period }` | AI Workflow Engineer · Tahoma Films · February 2025; Snowboard Coach · High Cascade Snowboard Camp · Summers 2023 & 2024 (D82) |
| `education` | unchanged shape | `coursework` = the six § 8 items in resume order; degree, institution, period, honors unchanged |

`Role.type` stays for now (P2-04's simplification pass decides). Project bullets are plain strings: the name and
the repo line carry the links (P2-02 renders them), so the bullets don't repeat them.

## Links

Exactly the § 3 table, deep-dive first (GitHub only where there is no deep-dive; none of the four lacks one):

| Role | `link.text` | `href` |
|---|---|---|
| MAXX Potential | agentic bug-fix workflow | `/projects/linear-ai-workflow` |
| MAXX Potential | contractor estimating app | `/projects/paint-estimator` |
| Builder Clarity | JobTread ↔ GoHighLevel integration platform | `/projects/ghl-jobtread-integration` |
| Builder Clarity | unified per-job communications log | `/projects/ringcentral-jobtread-integration` |

`src/components/experience/BulletWithLinks.tsx` (Server Component): one `<span>` (so a flex `li` keeps it as one
item); a string renders as text; a linked bullet is cut at each link span, in text order. An internal href (`/…`)
renders `next/link`, an external one `<a target="_blank" rel="noopener noreferrer">`; both use the `/evidence` link
look (foreground text, accent underline at 50 %, accent on hover) and `focusRing`.

## Layout

P2-02 builds it; P2-01 only keeps `/experience` rendering (the two roles through `BulletWithLinks`, education).
Order: h1 · the two roles (timeline, as today) · h2 Projects (name → deep-dive, repo line → GitHub, period, two
bullets) · h2 Earlier (one line each: title · company · period, no list of bullets) · h2 Education.

## Tests

- `src/__tests__/lib/experience-data.test.ts` (new): the § 8 strings verbatim (six role bullets, four project
  bullets, six coursework items); link texts once per bullet; `/projects/<slug>` hrefs resolve; external hrefs are
  brand.md's four public repos; the three real titles unchanged; the § 3 link table exactly.
- `src/__tests__/components/experience/BulletWithLinks.test.tsx` (new): plain, internal, external, mid-sentence.
- `experience.test.tsx`, `data.test.ts`: the M2-03 bullet checks give way to § 8 (two roles, not four).
- `claims-on-linked-page.test.ts`: `/experience` content = roles, resume projects, earlier roles, education.

## What Michael will see

| Capture | What it shows |
|---|---|

## Review

| # | Severity | File:line | Finding | Resolution |
|---|---|---|---|---|

## Decisions

- **D82** *default*: Tahoma Films and High Cascade Snowboard Camp are not on the resume; they stay on `/experience`
  as a compact "Earlier" list (title · company · period, no bullets) rather than being deleted (spec § 3: show
  character). Reversible: drop `earlierRoles` and its section.
- **D83** *default*: six `/evidence` items cite `/experience` lines the resume text drops (Foundational Capability
  Patterns, git-tracked migrations ×2, de facto PM, Agile/Scrum in Linear, the High Cascade mentoring). They stay
  (each still traces to brand.md) and keep linking to `/experience`, which still shows the role; the High Cascade
  item loses its age range ("Mentored young snowboarders…") so every number on `/evidence` is still on the page it
  links (`claims-on-linked-page`). Reversible: one edit in `competencies.ts`. Question for Michael: keep, relink or
  drop them?
