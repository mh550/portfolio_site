# P2: experience from the resume, with links (plan)

Date 2026-10-21. Spec: `docs/specs/2026-10-21-portfolio-v3.md` § 3 (links, layout) and § 8 (resume v4, the source
of every string below; the phone number is left out on purpose and is never added). Features: P2-01 data + links
component (this plan) → P2-02 page layout → P2-03 captures → P2-04 review. Decisions D82–D83 are allocated here and
recorded in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions, and D84 by P2-04. The next free number is D85. Built on the tree
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

`Role.type` stayed until P2-04's simplification pass dropped it (nothing read it). Project bullets are plain strings: the name and
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

Built in P2-02 (`src/app/experience/page.tsx`): the role titles stay h2 (as before), Projects / Earlier / Education
are `section`s labelled by their h2; a project's name is an h3 linked to its deep-dive (underlined like the bullet
links), the repo line a mono `github.com/…` link in a new tab. Local `Bullets` (the `—` list through
`BulletWithLinks`, shared by roles and projects), `Divider` and `PERIOD` replace three copies each.

## Tests

- `src/__tests__/lib/experience-data.test.ts` (new): the § 8 strings verbatim (six role bullets, four project
  bullets, six coursework items); link texts once per bullet; `/projects/<slug>` hrefs resolve; external hrefs are
  brand.md's four public repos; the three real titles unchanged; the § 3 link table exactly.
- `src/__tests__/components/experience/BulletWithLinks.test.tsx` (new): plain, internal, external, mid-sentence.
- `experience.test.tsx`, `data.test.ts`: the M2-03 bullet checks give way to § 8 (two roles, not four).
- `claims-on-linked-page.test.ts`: `/experience` content = roles, resume projects, earlier roles, education.

## What Michael will see

Taken from the harness dev server (port 7835) on 2026-10-21 with `node .harness/captures.mjs docs/screenshots/v3 P2
/experience` (status 200, no console errors). Link colours and boxes were read with `getComputedStyle` and
`getBoundingClientRect` in the same browser.

| Capture | What it shows |
|---|---|
| [`P2-experience-1280.png`](../screenshots/v3/P2-experience-1280.png) (273 KB) | Eyebrow EXPERIENCE, h1 History, then the timeline: MAXX Potential (Full-Stack Software Engineer, February 2026 – Present) and Builder Clarity (Founding Full-Stack Software Engineer, March 2025 – November 2025: the en dash and capital P are the site's kept role strings), three bullets each. **The four linked phrases**: "contractor estimating app" → `/projects/paint-estimator`, "agentic bug-fix workflow" → `/projects/linear-ai-workflow`, "JobTread ↔ GoHighLevel integration platform" → `/projects/ghl-jobtread-integration`, "unified per-job communications log" → `/projects/ringcentral-jobtread-integration`. **How a link looks**: the phrase is in the foreground colour (`#e8e8f0`, brighter than the muted grey bullet text around it), with an accent-cyan underline at 50 % opacity, 4 px below the text. It turns accent on hover, the `/evidence` look. The links open in the same tab. **Projects** (h2): Long-Running Agent Harness (October 2026 - present) and Self-Hosted Music Server & DJ Pipeline (November 2025 - present; straight hyphen, as § 8 has it). Each name is an h3 with the same underlined-link look, linking to its deep-dive (`/projects/agent-harness`, `/projects/home-media-server`). Under it is a mono accent repo line (`github.com/mh550/agent-harness`, `github.com/mh550/dj-crate-streaming`) that opens GitHub in a new tab (screen readers hear "(opens in new tab)", P2-04), then two bullets. **Earlier** (h2): two plain lines, "AI Workflow Engineer · Tahoma Films · February 2025" and "Snowboard Coach · High Cascade Snowboard Camp · Summers 2023 & 2024", with no list. **Education**: the Duke card with honors (George Scholar, Duke True North Leadership Program) and the six resume coursework items (Database Systems, Algorithm Design & Analysis, Computer Security, Server-side Web Apps, Computer Systems, Data Structures & Algorithms) in a second column. The text column is 720 px wide. |
| [`P2-experience-390.png`](../screenshots/v3/P2-experience-390.png) (257 KB) | Same order in one column, with the hamburger menu. The four linked phrases keep their underline and wrap inside their bullet ("agentic bug-fix / workflow", "JobTread ↔ / GoHighLevel integration platform", "unified per-job / communications log"). The project names wrap to two lines ("Self-Hosted Music Server & DJ / Pipeline"), and the repo lines fit on one line. Earlier's lines wrap after the company. Coursework is in one column under Honors. **No horizontal scroll**: `scrollWidth − innerWidth = 0` (smoke and captures). **The longest bullet** (the music-server bullet, 211 characters) has its box at x 24 → 366 of 390, with `scrollWidth` = `clientWidth` = 342, so it wraps without overflow. Capture artefacts, not page bugs: the fixed VoiceWidget mic shows once, over the Builder Clarity heading, where the first 900 px viewport ends (it floats bottom-right as you scroll, D61), and the round "N" at the left is the Next dev-mode indicator, which production does not show. |
| Print (`print-check.mjs`, scratch `print-experience.png`, 201 KB, not committed) | White page, black text, no nav, footer or VoiceWidget. `linksNotUnderlined: 0`: all four bullet links, both project names and both repo lines print underlined, and the external repo links print their URL in brackets after them. `hiddenReveals: 0`, `nonBlackText: 0`. Exit 0 (`PASS print`). |

## Review

Independent Opus review (P2-04) of `git diff <HARNESS: after P1-08>..HEAD -- . ':!docs/screenshots'` (1145 lines,
`$HARNESS_SCRATCH/P2.diff`), file:line as of the reviewed tree (13b53cc). No Critical findings.

| # | Severity | File:line | Finding | Resolution |
|---|---|---|---|---|
| 1 | Important → Minor | `src/lib/data/experience.ts:67` | The agent harness's third § 8 bullet ("Runs remote-first … 189 features passed in 4 days at ~$3 each") is left out with no recorded reason | Not a code defect: § 3 says "two bullets each" and P2-01/P2-02's steps pin two. Recorded as **D84** *default* (two bullets, the third stays off) with the question for Michael; adding it is one line plus two test lengths |
| 2 | Important | `src/app/experience/page.tsx:104`, `src/components/experience/BulletWithLinks.tsx:29` | `target="_blank"` links (the repo lines, any external bullet link) give screen readers no new-tab cue, unlike Footer, `/card` and ProjectLinks | Fixed test-first in 025c040: `<span className="sr-only"> (opens in new tab)</span>`; `BulletWithLinks.test.tsx` and `experience.test.tsx` query the link by that name (both failed before the fix) |
| 3 | Minor | `src/app/experience/page.tsx:99` | The project-name link repeats `BulletWithLinks`' `LINK` class word for word (`/evidence` has a third copy) | Fixed in 1b251bb: `src/components/textLink.ts` exports `textLink`; BulletWithLinks, `/experience` and `/evidence` (`leading-relaxed ${textLink}`) read it |
| 4 | Minor | `src/lib/data/experience.ts:11` | `Role.type` is dead: no reader in `src/`, `'education'` can't occur | Fixed in 1b251bb: field, its two values and the `data.test.ts` assertion dropped |
| 5 | Minor | `src/lib/data/experience.ts:19,66`; this plan § What Michael will see | Role periods use `– Present` (the kept site strings), project periods `- present` (§ 8 verbatim); this plan described both as `– present` | Plan wording corrected to what renders. The strings stay: brand.md keeps role periods, § 3 keeps the project lines exactly. Question for Michael in D84 |
| 6 | Minor | `src/app/experience/page.tsx:69` | Job titles are h2 peers of Projects / Earlier / Education, with no "Work" heading | Kept: the role-title h2s are the page's structure since v2, the heading order is valid (h1 → h2 → h3, a11y test green), and the h2-order test pins it on purpose |
| 7 | Minor | `src/components/experience/BulletWithLinks.tsx:15` | A link span missing from the text is dropped silently; no component test for it | Test added in 1b251bb (the line renders whole as plain text); the data test already fails on a missing span in the real data |
| 8 | Minor | `src/__tests__/pages/experience.test.tsx:77,135,136` | Project bullets were checked against the whole page and by data length; the "Pioneered" test was vestigial; titles were checked three times | Fixed in 1b251bb: the Projects test reads each project's rendered `li`s (text and count 2); the "Pioneered" test and the duplicate title test are gone (`experience-data.test.ts` keeps the titles). Not done: parsing § 8 out of the spec in a test (couples the suite to a doc; the hand copy in `RESUME` is the reviewed source) |
| 9 | Minor | `CLAUDE.md` Data Layer | "resume v4 word for word" is true per line, not per section (finding 1) | CLAUDE.md now says two bullets per project (D84) and names `textLink` |

**Every claim with a digit in the new bullets traces to § 8** (reviewer extracted the § 8 lines and compared them
character for character; all ten bullets match): ~8 issues/week, 2× sprint throughput, ~80% less bug-filing time
(MAXX); 3 clients, ~2 days → ~6 hours, ~8 hrs/week per client, 4+ sources (Builder Clarity); 1,500+ offline tests
(music server); the periods October 2026 - present, November 2025 - present, Graduated December 2024. The two role
periods use `–` where § 8 has `-` (kept strings, brand.md); the Earlier periods (February 2025, Summers 2023 & 2024)
are not in § 8 by design (D82). The 189 features / 4 days / ~$3 claim is not on the page (D84).

**Simplification pass**: `Role.type` dropped (unused); the text-link class is one `textLink`; period formatting is not
duplicated (`PERIOD` is one class string, Earlier's `title · company · period` join is written once). `npx eslint src`
is clean.

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
- **D84** *default* (P2-04): the agent harness keeps two bullets on `/experience`, as § 3 says ("two bullets each");
  § 8's third ("Runs remote-first on my home server … 189 features passed in 4 days at ~$3 each") stays off. The
  project periods keep § 8's straight hyphen (`October 2026 - present`) next to the roles' `–`. Reversible: append the
  line to `resumeProjects[0].bullets` and change the two-bullet checks. Question for Michael: add the third bullet,
  and should the project periods use `–` like the roles?
