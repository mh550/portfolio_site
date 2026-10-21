# P5 · /skills as a graph

Plan for v3 spec § 10 (P5-01). `/skills` stops being five walls of chips and becomes one SVG drawing: six clusters
as titled rounded containers, each technology or practice a node (logo + label) that is a link, curved edges
inside a cluster always and across clusters on hover or when a project is selected. A project chip row shows which
parts of the stack a project used. The same data is a definition list under a "List view" toggle, and that list is
what prints. No physics, no new dependency: the layout is hand-laid by pure functions in `src/lib/graph/`.

Features: P5-02 data + math · P5-03 render + list view · P5-04 pan/zoom + 390 chip row · P5-05 project selection +
hover · P5-06 check (captures) · P5-07 review. Decisions D98–D103 (end of this file, and in the v2 spec).

## Data

`src/lib/data/skills.ts` exports three arrays and their types; `skillCategories` and `SkillCategory` go (D98: the
only readers are `src/app/skills/page.tsx`, `src/__tests__/pages/skills.test.tsx` and the `skillCategories` block
of `src/__tests__/lib/data.test.ts`, all rewritten in P5-02/P5-03; the barrel `index.ts` re-exports the new names).

```ts
export type ClusterId = 'agentic' | 'languages' | 'web' | 'data' | 'infra' | 'process';
export interface Cluster { id: ClusterId; name: string }                 // array order = layout order
export type Weight = 1 | 2 | 3;                                           // 3 core · 2 regular · 1 occasional
export interface SkillNode {
  id: string;                     // kebab-case, unique; the list row is #skill-<id>
  name: string;                   // the accessible name, the list's <dt>
  cluster: ClusterId;
  weight: Weight;
  logo?: LogoKey;                 // a key of logoPaths (generated, D78); no key → a dot
  since?: string;                 // 'YYYY', only where a resume date range gives it (Source column)
}
export type EdgeTo = string | `project:${string}`;                        // a node id, or a project slug
export interface SkillEdge { from: string; to: EdgeTo; label?: string } // `from` is always a node id
```

**What may be a node** (D98): an item on a § 8 TECHNICAL SKILLS line; an item of today's `skillCategories` not on
the drop list (they came from `docs/plans/2026-10-18-M2-positioning.md` § Skills), merged where one names the other;
or a tool a resume bullet or a project's `techStack` in `projects.ts` names. Dropped: **Ruby, R, Ruby on Rails,
Flask, MongoDB, PowerShell, WSL** (P5-01's step drops them by name; spec § 10 keeps only what a project on the site used, and MongoDB is in Cherished's `techStack`, Cherished is
not featured: a question for Michael, D98). **Zapier is kept, weight 1** (`ringcentral-jobtread-integration`'s
`techStack`). Merged: Agent orchestration → Harness engineering; Agentic AI → the cluster's name; AI-assisted
development → Claude Code; Docker → Docker Compose; Private networking → Tailscale; GitHub Actions → CI/CD;
Supabase Edge Functions → Edge functions; Linux CLI → Linux; Git → Git/GitHub; C/C++ → C++. `/evidence`'s
competencies don't change.

### Clusters (six, in this order; the first is the 390 px start)

| # | id | name |
|---|---|---|
| 1 | `agentic` | Agentic systems |
| 2 | `languages` | Languages |
| 3 | `web` | Web & mobile |
| 4 | `data` | Data & integration |
| 5 | `infra` | Infra & operations |
| 6 | `process` | Process & delivery |

### Nodes (51; the order inside a cluster is the drawing order, row by row)

§ 8 = the resume's TECHNICAL SKILLS lines; "skills.ts" = today's list; MAXX/BC = the resume's role bullets.

| id | name | cluster | w | logo | since | source |
|---|---|---|---|---|---|---|
| `harness-engineering` | Harness engineering | agentic | 3 | — | 2026 | § 8 Agentic AI; agent-harness (Oct 2026) |
| `context-engineering` | Context engineering | agentic | 3 | — | 2026 | § 8; agent-harness bullet 2 |
| `agent-memory` | Agent memory | agentic | 3 | — | 2026 | § 8; MAXX bullet 1, agent-harness, voice-concierge |
| `claude-code` | Claude Code | agentic | 3 | `claude` | — | § 8 |
| `durable-state` | Durable state | agentic | 2 | — | — | § 8 |
| `eval-gates` | Eval gates | agentic | 2 | — | — | § 8 |
| `livekit-agents` | LiveKit Agents | agentic | 1 | `livekit` | — | voice-concierge `techStack` |
| `mcp` | MCP | agentic | 1 | `modelcontextprotocol` | — | linear-ai-workflow `techStack` |
| `copilot-studio` | Copilot Studio | agentic | 1 | — | 2026 | MAXX bullet 3 (Feb 2026) |
| `typescript` | TypeScript | languages | 3 | `typescript` | — | § 8 Languages & Web |
| `python` | Python | languages | 3 | `python` | — | § 8 |
| `bash` | Bash | languages | 2 | `bash` | — | § 8 |
| `sql` | SQL | languages | 2 | — | — | § 8 |
| `javascript` | JavaScript | languages | 2 | `javascript` | — | skills.ts; BC bullet 3 (custom JS components) |
| `java` | Java | languages | 1 | `openjdk` | — | § 8 |
| `cpp` | C++ | languages | 1 | `cplusplus` | — | § 8 |
| `react` | React | web | 3 | `react` | — | § 8 |
| `react-native` | React Native | web | 3 | `react` | — | § 8; MAXX bullet 1 |
| `nextjs` | Next.js | web | 3 | `nextjs` | — | § 8 |
| `nodejs` | Node.js | web | 2 | `nodedotjs` | — | § 8 |
| `expo` | Expo | web | 1 | `expo` | — | skills.ts; hit-list `techStack` |
| `tailwind` | Tailwind CSS | web | 1 | `tailwindcss` | — | skills.ts (this site) |
| `framer-motion` | Framer Motion | web | 1 | — | — | skills.ts (this site) |
| `postgresql` | PostgreSQL | data | 3 | `postgresql` | — | § 8 Data & Integration |
| `supabase` | Supabase | data | 3 | `supabase` | — | § 8 |
| `multi-tenant` | Multi-tenant architecture | data | 3 | — | 2025 | skills.ts; BC bullet 1 (Mar 2025) |
| `oauth` | OAuth 2.0 | data | 2 | — | — | § 8 |
| `rest` | REST APIs | data | 2 | — | — | § 8 ("REST") |
| `webhooks` | Webhooks | data | 2 | — | — | § 8 |
| `etl` | ETL pipelines | data | 2 | — | — | § 8 ("ETL"); BC bullet 2 |
| `sqlite` | SQLite | data | 2 | `sqlite` | — | § 8 |
| `n8n` | n8n | data | 2 | `n8n` | 2025 | § 8; BC bullet 3 |
| `pipedream` | Pipedream | data | 2 | — | 2025 | § 8; BC bullet 3 (simple-icons has no Pipedream) |
| `zapier` | Zapier | data | 1 | `zapier` | — | skills.ts; ringcentral-jobtread-integration |
| `docker-compose` | Docker Compose | infra | 3 | `docker` | 2025 | § 8 Infra & Tools; dj-crate (Nov 2025) |
| `git` | Git/GitHub | infra | 3 | `github` | — | § 8 |
| `linux` | Linux | infra | 2 | `linux` | — | § 8 |
| `ci-cd` | CI/CD | infra | 2 | — | — | § 8; hit-list (GitHub Actions) |
| `vercel` | Vercel | infra | 2 | `vercel` | — | § 8 |
| `edge-functions` | Edge functions | infra | 2 | — | — | § 8; MAXX bullet 1 |
| `tailscale` | Tailscale | infra | 2 | `tailscale` | 2025 | § 8; dj-crate bullet 1 |
| `self-hosting` | Self-hosted infrastructure | infra | 2 | — | 2025 | skills.ts; dj-crate |
| `restic` | restic | infra | 1 | — | — | skills.ts; home-media-server `techStack` |
| `specs` | Specs & decision ledgers | process | 3 | — | — | skills.ts ("Specs and decision ledgers") |
| `tdd` | Test-driven development | process | 2 | — | — | skills.ts |
| `requirements` | Requirements | process | 2 | — | — | skills.ts |
| `linear` | Linear | process | 2 | `linear` | 2026 | § 8; MAXX bullet 2 (Feb 2026) |
| `agile` | AGILE/Scrum | process | 1 | — | — | skills.ts; cherished `techStack` |
| `project-management` | Project management | process | 1 | — | — | skills.ts |
| `team-onboarding` | Team onboarding | process | 1 | — | — | skills.ts |
| `user-driven-design` | User-driven design | process | 1 | — | — | skills.ts |

Counts: agentic 9 · languages 7 · web 7 · data 11 · infra 9 · process 8. The P5-02 test holds the § 8 list as
these names: Harness engineering, Context engineering, Agent memory, Durable state, Eval gates, Claude Code ·
TypeScript, Python, Bash, SQL, Java, C++, React, React Native, Next.js, Node.js · PostgreSQL, Supabase, SQLite, REST
APIs, Webhooks, OAuth 2.0, ETL pipelines, n8n, Pipedream · Docker Compose, Linux, Git/GitHub, CI/CD, Vercel, Edge
functions, Tailscale, Linear (33; "harness & context engineering" is two nodes, "REST" and "ETL" take the names
the projects' `techStack` and skills.ts use: "REST APIs" (skills.ts says "RESTful APIs"), "ETL pipelines").

**Logo keys to add to `scripts/logos.mjs`'s ICONS** (all checked against simple-icons 16.9.0's exports):
`react` (siReact), `nodedotjs` (siNodedotjs), `vercel` (siVercel), `tailscale` (siTailscale), `supabase`
(siSupabase), `openjdk` (siOpenjdk, title "Java"; there is no siJava), `cplusplus` (siCplusplus, title "C++"),
`linear` (siLinear), `zapier` (siZapier), `tailwindcss` (siTailwindcss), and three beyond the step's list so
peers in a cluster don't mix marks and dots: `javascript` (siJavascript), `expo` (siExpo), `modelcontextprotocol`
(siModelcontextprotocol, title "MCP").
**Pipedream has none** (no siPipedream), nor do restic, OAuth or Copilot Studio: those draw a dot. React Native reuses
`react` (React Native's own site uses the React mark). FloatingLogos keeps its twelve; `paths.test.ts`'s key list
grows to 25.

### Edges

Node ↔ node (drawn always when both ends share a cluster; across clusters only on hover or in a selected
project's chain). `label` is optional; the one set, Zapier → n8n "moved from" (BC bullet 3), is the drawn path's
`<title>` (a mouse tooltip; edges are decoration to assistive tech).

| from | to | same cluster? |
|---|---|---|
| claude-code | harness-engineering | yes |
| harness-engineering | context-engineering | yes |
| harness-engineering | eval-gates | yes |
| context-engineering | agent-memory | yes |
| agent-memory | durable-state | yes |
| livekit-agents | agent-memory | yes |
| mcp | claude-code | yes |
| typescript | javascript | yes |
| nextjs | react | yes |
| react | react-native | yes |
| react-native | expo | yes |
| nextjs | tailwind | yes |
| supabase | postgresql | yes |
| etl | postgresql | yes |
| oauth | multi-tenant | yes |
| pipedream | multi-tenant | yes |
| n8n | webhooks | yes |
| rest | webhooks | yes |
| zapier | n8n | yes (`label: 'moved from'`) |
| docker-compose | self-hosting | yes |
| tailscale | self-hosting | yes |
| restic | self-hosting | yes |
| linux | docker-compose | yes |
| git | ci-cd | yes |
| ci-cd | vercel | yes |
| specs | requirements | yes |
| user-driven-design | requirements | yes |
| linear | project-management | yes |
| agile | project-management | yes |
| bash | harness-engineering | no |
| git | harness-engineering | no |
| specs | harness-engineering | no |
| eval-gates | tdd | no |
| agent-memory | sqlite | no |
| python | livekit-agents | no |
| linear | mcp | no |
| typescript | nextjs | no |
| typescript | react-native | no |
| javascript | nodejs | no |
| javascript | pipedream | no |
| sql | postgresql | no |
| supabase | edge-functions | no |
| nextjs | vercel | no |

Node → project (`to: 'project:<slug>'`), from each project's `techStack`, the resume bullets that name it
(agent-harness bullets 1–2; dj-crate bullet 1 for Tailscale; BC bullet 1 for multi-tenant and OAuth) or its
deep-dive in `projects.ts` (voice-concierge → agent-memory: "remembers returning visitors"). Linux has no project
edge: no `techStack` or bullet names it, though both home-server projects run on it. Every
featured project has at least two (the test asserts ≥ 2 per featured project; the chip highlights these):

| project (featured, in `order`) | nodes |
|---|---|
| `agent-harness` | harness-engineering, context-engineering, agent-memory, durable-state, eval-gates, claude-code, bash, nodejs, git |
| `voice-concierge` | agent-memory, livekit-agents, claude-code, python, typescript, nextjs, sqlite |
| `ghl-jobtread-integration` | multi-tenant, oauth, pipedream, supabase, rest, webhooks, javascript |
| `ringcentral-jobtread-integration` | n8n, zapier, rest, webhooks, javascript |
| `home-media-server` | python, javascript, sqlite, docker-compose, tailscale, self-hosting, restic |
| `linear-ai-workflow` | linear, mcp, claude-code, git |
| `hit-list` | react-native, expo, typescript, sqlite, ci-cd |
| `paint-estimator` | react-native, typescript, nodejs |
| `mirrored-google-calendars` (not featured: list view only) | nextjs, supabase, pipedream, typescript |
| `cherished` (not featured: list view only) | nextjs, typescript, agile |

Nodes with no project edge (Copilot Studio, SQL, Java, C++, React, Tailwind CSS, Framer Motion, PostgreSQL, ETL
pipelines, Linux, Vercel, Edge functions, Specs & decision ledgers, Test-driven development, Requirements, Project
management, Team onboarding, User-driven design) are on the resume or today's list from Michael's roles, not from a
project on the site; the list view says "From my roles" for them rather than inventing a project.

## Layout

All coordinates are viewBox units, sized so one unit is about one CSS px where the graph is read: at 1280 the page
container widens from `max-w-5xl` to `max-w-6xl` (1152 − 48 = 1104 px) and the 1052-unit drawing draws at 1.05 px a
unit; at 390 the first cluster's fit draws at 1.03 (below).

Constants (`src/lib/graph/layout.ts`): `PAD = 16` (outer), `GAP = 24` (between clusters), `CLUSTER_W = 324`,
`TITLE_H = 44`, `INSET = 6`, `CELL_W = 104`, `CELL_H = 76`, `CELLS = 3` a row, `BOTTOM = 12`. A cluster's height is
`TITLE_H + rows × CELL_H + BOTTOM` with `rows = ceil(n / 3)`: 7–9 nodes → 284, 10–12 → 360. A row of clusters is as
tall as its tallest; clusters are top-aligned in it. Columns: `width >= 1024 ? 3 : 2` (CSS px of the viewport, from
`matchMedia('(min-width: 1024px)')`; server render = 3).

Inside a cluster, node `i` sits in cell `(c, r) = (i % 3, floor(i / 3))`, cell origin `(cx + INSET + c × 104,
cy + TITLE_H + r × 76)`; a last row with k < 3 nodes is centred (shifted by `(3 − k) × 52`). The node's point (logo
centre, edge endpoint) is the cell's `(+52, +22)`; its logo is 28 / 24 / 20 units for weight 3 / 2 / 1; the label is
centred under it, 12 units, line 1 baseline at `+52`, line 2 at `+66`, `labelLines(name)` splitting at the last space
that keeps each line ≤ 16 characters (every name above fits two lines: "Specs & decision" / "ledgers",
"Self-hosted" / "infrastructure"). A node's box (what "no overlap" tests) is the cell
less 2 units a side: `100 × 72`, so two boxes never meet by construction.

### 1280 (3 columns; drawing 1052 × 700; svg 1104 × 735 px, the whole drawing is the first view)

```
 x: 16                    340 364                   688 712                  1036   (units)
 y: 16 ┌─ AGENTIC SYSTEMS ────┐  ┌─ LANGUAGES ──────────┐  ┌─ WEB & MOBILE ───────┐
       │ ◆Harn. ◆Context ◆Mem.│  │ ◆TypeSc ◆Python ●Bash│  │ ◆React ◆RNative ◆Next│
       │ ◆Claude ●Durable ●Eval│  │ ●SQL  ●JavaSc  ·Java │  │ ●Node  ·Expo  ·Tailw.│
       │ ·LiveKit ·MCP ·Copil.│  │        ·C++          │  │      ·Framer M.      │
   300 └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
   324 ┌─ DATA & INTEGRATION ─┐  ┌─ INFRA & OPERATIONS ─┐  ┌─ PROCESS & DELIVERY ─┐
       │ ◆Postgr ◆Supab ◆Mult.│  │ ◆Docker ◆Git/GH ●Lin.│  │ ◆Specs  ●TDD  ●Reqs  │
       │ ●OAuth ●REST ●Hooks  │  │ ●CI/CD ●Vercel ●Edge │  │ ●Linear ·Agile ·PM   │
       │ ●ETL  ●SQLite ●n8n   │  │ ●Tails. ●Self-h ·rest│  │   ·Onboard ·UDD      │
       │   ●Pipedr. ·Zapier   │  │                      │  │                      │
   684 └──────────────────────┘  └─ 608 ───────────────┘  └─ 608 ───────────────┘
                                                                     700 = bounds
 ◆ weight 3 (28-unit mark, semibold label)  ● weight 2 (24)  · weight 1 (20, muted)
 Three nodes a row in drawing order, a short last row centred (the sketch abbreviates labels; the svg draws them
 whole, two lines at most).
```

| cluster | x | y | w | h |
|---|---|---|---|---|
| agentic | 16 | 16 | 324 | 284 |
| languages | 364 | 16 | 324 | 284 |
| web | 712 | 16 | 324 | 284 |
| data | 16 | 324 | 324 | 360 |
| infra | 364 | 324 | 324 | 284 |
| process | 712 | 324 | 324 | 284 |

Bounds `1052 × 700` (16 + 284 + 24 + 360 + 16). Above the svg: the project chips (wrapping, one or two rows) and the
toolbar; below it the instructions line.

### 390 (2 columns; drawing 704 × 1008; svg 358 × 317 px, first view = `fitCluster('agentic')`)

```
 drawing (units)                                svg at 390 (page px-4: 358 px wide)
 x: 16        340 364        688                ┌────────────────────────────────┐
 y:16 ┌agentic─┐  ┌languages┐                   │┌─ AGENTIC SYSTEMS ───────────┐ │
      │  284   │  │  284    │                   ││ (◆)Harness (◆)Context (◆)Agent│
  300 └────────┘  └─────────┘                   ││ (◇)Claude ◇Durable ◇Eval    │ │
  324 ┌web─────┐  ┌data─────┐                   ││ ·LiveKit  ·MCP  ·Copilot    │ │
      │  284   │  │  360    │                   │└─────────────────────────────┘ │
  608 └────────┘  │         │                   └────────────────────────────────┘
                  └─ 684 ───┘                    view 4 4 348 308 (x y w h)
  708 ┌infra───┐  ┌process──┐                    chips: [Agentic systems] Languages Web & mobile …
      │  284   │  │  284    │                          (aria-pressed on the cluster under the view centre)
  992 └────────┘  └─────────┘
                       1008 = bounds
```

| cluster | x | y | w | h |
|---|---|---|---|---|
| agentic | 16 | 16 | 324 | 284 |
| languages | 364 | 16 | 324 | 284 |
| web | 16 | 324 | 324 | 284 |
| data | 364 | 324 | 324 | 360 |
| infra | 16 | 708 | 324 | 284 |
| process | 364 | 708 | 324 | 284 |

Bounds `704 × 1008`. Below 640 px (`matchMedia('(max-width: 639px)')`, D102) the svg's aspect is the first
cluster's fit, `348 : 308` (the cluster ± 12 units), so at 390 the svg is 358 × 317 px and one unit is 1.03 px: the
labels draw at about 12 px, as at 1280. The tallest cluster, `fitCluster('data')`, needs `348 × 384` and at that
aspect becomes `433.9 × 384`: 0.83 px a unit, labels at 10 px. From 640
to 1023 px the 2-column drawing is the first view (720 px wide at 768: 1.02 px a unit, 1031 px tall). The chip rows
(projects, clusters) are single lines that scroll inside themselves (`overflow-x-auto`), never the page.

## Math

`src/lib/graph/` is pure TypeScript: no React, no DOM, no data import (it takes `import type` from
`@/lib/data/skills` only, so tests pass fixtures). `layout.ts`:

| function | signature | does |
|---|---|---|
| `layoutGraph` | `(data: GraphData, width: number) => GraphLayout` | deterministic cluster rects and node points per the constants above; `GraphData = { clusters, nodes, edges }`; `GraphLayout = { width, height, columns: 2 \| 3, clusters: ClusterBox[], nodes: Record<string, NodePoint> }`, `ClusterBox = { id, name, x, y, w, h }`, `NodePoint = { id, cluster, x, y, size, lines: string[], box: Rect }` |
| `labelLines` | `(name: string, max = 16) => string[]` | one or two lines, split at the last space that fits |
| `curvePath` | `(a: Point, b: Point, bend = 0.2) => string` | `M ax ay C c1x c1y c2x c2y bx by`; the controls at ⅓ and ⅔ of the chord, pushed `bend × length` along the normal `(−dy, dx)` (to the right of a → b in y-down units: a west-to-east edge bows down); numbers rounded to 0.1 |
| `edgePaths` | `(layout, edges) => EdgePath[]` | the node ↔ node edges as `{ from, to, d, cross }` (`cross` = different clusters); project edges are skipped |
| `projectChain` | `(layout, nodeIds: string[]) => [string, string][]` | a selected project's nodes sorted by (cluster order, drawing order) and joined in that order: one segment between consecutive nodes, so a project touching k clusters crosses k − 1 times |
| `clusterAt` | `(layout, p: Point) => ClusterId \| null` | the cluster whose rect holds `p` (for the 390 chip row's `aria-pressed`) |

Built in P5-02 beyond this table (from its review): `NodePoint` also carries `name` and `weight`; `LABEL_DY = [30,
44]` (the label baselines below the point); `columnsFor(width)` (the column rule); `NARROW_ASPECT` (308 / 348, the svg's
aspect below 640). `clusterAt` gives null in a gap between clusters: no chip is pressed there. In `skills.ts`:
`projectSlug(to)`, `projectsOf(edges, nodeId)` (the list view's "Used in") and `nodesOf(edges, slug)` (a chip's nodes).

`view.ts` (`View = { x, y, w, h }`, `Bounds = { w, h }`; every function returns a new view, clamped):

| function | signature | does |
|---|---|---|
| `viewBoxFor` | `(view: View) => string` | `"x y w h"`, each rounded to 0.01 |
| `clampView` | `(view, bounds, pad = 24) => View` | keeps the aspect; `w` in `[160, max(bounds.w + 2·pad, (bounds.h + 2·pad) / aspect)]` (`h` scaled with it, so a tall phone view can still zoom out to the whole drawing); `x` in `[−pad, bounds.w + pad − w]`, `y` likewise; a view wider (taller) than the padded drawing is centred on that axis |
| `zoomAt` | `(view, factor, point, bounds) => View` | `w' = w / factor` capped to `[160, max]` first, then `x' = p.x − (p.x − x) / f` with the applied `f = w / w'` (same for y): the point stays under the cursor even at a limit, so a press there changes nothing; a factor that is not a positive number returns the view; then `clampView` |
| `panBy` | `(view, dx, dy, bounds) => View` | moves by drawing units; then `clampView` |
| `fitCluster` | `(layout, clusterId, aspect, pad = 12) => View` | the cluster rect ± `pad`, grown on one axis to `aspect = h / w`, centred; then `clampView` (the step's `fitCluster(clusterId)`, with the layout and aspect it needs to stay pure) |
| `fitAll` | `(layout, aspect) => View` | the whole drawing at that aspect (the first view from 640 px, and Reset there) |
| `centerOn` | `(view, point, bounds) => View` | same size, centred on `point` (a focused node outside the view) |
| `clientToDrawing` | `(view, rect: { left, top, width, height }, client: Point) => Point` | a pointer position in drawing units; exact because the svg's aspect always equals the view's (no letterbox) |
| `contains` | `(view, point, margin = 0) => boolean` | is the point inside the view (less a margin) |

Constants: `ZOOM_STEP = 1.25` (buttons, + / −), wheel factor `exp(−deltaY × 0.002)` clamped to `[0.8, 1.25]`,
`PAN_STEP = 0.1` of the view's width (arrows), `DRAG_SLOP = 4` px before a pointer move counts as a drag.

**No d3-force** (D99). The hand layout fits 390 by zooming to one cluster at about 1:1 (the numbers above), every
position is reproducible in a test, and the clusters carry the meaning; physics would add a dependency, a settle
animation to suppress under reduced motion, and a layout that shifts when a node is added. **Reconsider d3-force
only if** a cluster passes 15 nodes (5 rows, 436 units: the 390 fit drops under 0.8 px a unit and labels under
10 px), or the drawing has to place nodes by their connections rather than their cluster (the merged projects-and-
stack graph, P6 option A). Either is a new `D<n>` and the spec's pre-approved exact pin.

## Render

`src/app/skills/page.tsx` (Server Component) keeps the eyebrow "Skills" and h1 "Tech Stack", gets a new intro
("What I build with, grouped by what it's for. Pick a project to see the parts it used.") and metadata description
("The stack behind the agentic systems, integrations and apps I build, as a graph: pick a project to see what it
used."), drops the featured "Differentiator" block (D98), widens to `max-w-6xl` (`px-4 sm:px-6`) and renders
`<SkillGraph clusters nodes edges projects />`, where `projects` is `{ slug, title, featured, order }[]` built on
the server (title cut at its first colon, as `usherTargets` does), so the client bundle never imports `projects.ts`.

`src/components/skills/SkillGraph.tsx` (`"use client"`), top to bottom:

1. **Project chips**: `<div role="group" aria-label="Highlight a project's stack">`, one `<button aria-pressed>` per
   featured project in `order` ("Agent Harness", "Voice Concierge", …); while one is pressed, a line beside them:
   "<title> · N skills · **Open case study**" (a link to `/projects/<slug>`), also the text of an `sr-only`
   `aria-live="polite"` status.
2. **Toolbar**: the 390 cluster chip row (`flex sm:hidden`, D102; `aria-label="Jump to a group"`, a button per
   cluster, `aria-pressed` on `clusterAt(view centre)`), then Zoom in / Zoom out / Reset view (`aria-label`s, 44 px
   targets below `sm`) and the **List view** toggle (`<button aria-pressed>`).
3. **Graph container**: `<div tabIndex={0} role="group" aria-labelledby="skill-graph-title"
   aria-describedby="skill-graph-help">`, `print:hidden`, `touch-pan-y touch-pinch-zoom` (D100), `hidden` while the
   list view is on. In it one `<svg role="none" viewBox={viewBoxFor(view)} preserveAspectRatio="xMidYMid meet">`
   (D103: not `role="img"`, whose children are presentational and would hide the node links; `none` so the
   container is the one group, named by the svg's title) with `<title id="skill-graph-title">Tech stack: 51 skills in six groups. The list view has the
   same data as text.</title>` (counts from the data), then in paint order:
   - per cluster a `<g data-cluster role="group" aria-label={name}>` (so a screen reader tabbing through nodes hears
     which group it is in): `<rect rx="16">` (surface fill, `white/8` stroke) and its name as `<text aria-hidden>`
     (mono, uppercase, 13 units, accent); its node links (below) are drawn inside this `g`;
   - the intra-cluster `<path>`s (`edgePaths(...).filter(e => !e.cross)`, `white/15`, 1.25 units, no fill);
   - the cross-cluster `<path>`s, **only** those of the hovered node (`data-hover`) and of the selected project's
     chain (`data-active`): not in the DOM otherwise;
   - per node, inside its cluster's `g` and after all edges (edges sit in their own `aria-hidden` `g` painted
     first), an `<a href="#skill-<id>" aria-label={name} data-node={id}>` holding a `focusRing` rect (shown on
     `:focus-visible`), the `Logo decorative` mark at its size or a dot (`r = size / 4`), and the label `<text>`
     (`lines` as `<tspan>`s; weight 3 foreground and semibold, 2 foreground, 1 muted).
4. **Instructions**: `<p id="skill-graph-help">Arrow keys pan, plus and minus zoom. Drag to move.</p>` (muted, small).
5. **List view** (D101): `<div id="skill-list">` with, per cluster, an `<h2>` and a `<dl>`: `<dt id="skill-<id>"
   tabIndex={-1}>` name, `<dd>` "Core · since 2026 · Used in: Agent Harness, Voice Concierge" (weight 3/2/1 = core /
   regular / occasional; the project names link `/projects/<slug>`; no project edge → "From my roles"). Its class is
   `hidden print:block` while off and `block` while on: never the `hidden` attribute, because Tailwind's preflight
   makes `[hidden]` `display: none !important` and print could not show it.

Node and edge states are data attributes the CSS reads: `data-active="true"` (in the selected project),
`data-dim="true"` (everything else while a project is selected: opacity 0.25), `data-hover="true"`; opacity changes
are `motion-safe:transition-opacity`. **View changes are instant** at every motion setting (D103): no tween, no
`transition` on the svg or any viewport group, so reduced motion has nothing to switch off (the P5-03 test sets
`useReducedMotion` true through the framer-motion mock and asserts no `transition` class or style on the svg).

Hydration: the server renders the 3-column whole view; `useSyncExternalStore` over the two `matchMedia` queries
(server snapshot `'wide'`; `getSnapshot` returns a primitive `'narrow' | 'mid' | 'wide'`; no `window.matchMedia`, as
in jsdom, reads as `'wide'`, guarded like `VoiceWidget`) switches to 2 columns and, below 640, to
`fitCluster('agentic')` after hydration. A changed snapshot resets the view with the previous-value pattern (state
holding the last snapshot, compared during render), not an effect. The list view's rows are built from the data and
`labelLines` is only called by `layoutGraph`, so no component but `SkillGraph.tsx` imports `src/lib/graph/` (P5-04's
grep). The list
view and print never depend on it.

**Built in P5-03** (deviations from the above): the paint order needs every container under every edge and every
edge under every node, so a cluster is two `g`s: an `aria-hidden` `g[data-cluster-box]` (rect + title) in the first
layer, and the `g[data-cluster] role="group" aria-label` holding its node links in the last; edges sit between them.
Each node link holds a transparent cell rect (its hit area and the box its `focusRing` outline draws around). Until
P5-04 the first view is `fitAll` at every width (2 columns below 1024, the whole drawing at 390); the narrow
`fitCluster` start, the container's `tabIndex`, the help line and `aria-describedby` come with pan and zoom. A
`hashchange` to `#skill-<id>` opens the list like a load with it. The intro and metadata leave out "pick a project"
until P5-05 builds the chips. `Logo` takes `x`, `y` and `size` to place a mark inside the graph's svg.
An Opus review of P5-03 (1 Important, 12 Minor) led to: the row to focus is state (`rowRequest`), cleared by the toggle,
so a hashchange with the list open moves focus and a stale row never steals it; each node has its own `<title>`
tooltip and a labelled edge its label; the cell rect also draws the focus ring (`group-focus-visible:stroke`: Chrome
shows it inside the outline, WebKit may draw only this one); a modified click is left to the browser; the hash is
compared undecoded (no `URIError`); a click or the toggle clears the hover; a `dt` reached by script shows a
`focus:` outline; `projectSlug`/`projectsOf`/`nodesOf` moved to `src/lib/graph/edges.ts` (re-exported by `skills.ts`)
so the component imports only types from `@/lib/data`. Left for P5-05: a next/link to `#skill-<id>` uses pushState
(no `hashchange`); use a plain `<a>` or listen for it.

**Built in P5-04**: the view is `useState` (reset by a viewport change with the previous-value pattern, as the
columns are); the toolbar is the cluster chip row (`flex sm:hidden`, full width, `overflow-x-auto`), then `+` /
`−` / Reset (aria-labels Zoom in, Zoom out, Reset view) and List view (`ml-auto`); the chip row and zoom controls are
`print:hidden` and leave the DOM while the list view is on, as the help line goes `hidden`. Keys with Ctrl, ⌘ or Alt
are left to the browser (Ctrl + is page zoom). A line- or page-mode wheel (Firefox `deltaMode` 1 / 2) is read as 16 /
800 px. Focus on a node whose box is not wholly in view centres it (`contains` on the box's corners). The container
swallows `dragstart` (a link drag would cancel the pan) and is `select-none`.
An Opus review of P5-04 (2 Important, 5 Minor, 4 on tests) led to, test-first: the drag starts from the view on
screen when it crosses the slop (`viewRef`), and a press that focuses a node doesn't `centerOn` it; a wheel that
zooms nothing (sideways, or past a limit) is not prevented, so the page scrolls and back-swipe works; the click guard
outlives a drag by one task only (a touch drag has no click); IME keys pass; the controls are 44 px at every width;
the chip row is `p-1` so focus rings aren't clipped; the tests tie the wheel listener, its bounds after a viewport
change and the chip row's list-view exit. Left for P5-07: below 640 the server-rendered svg is the wide aspect until
hydration switches to the narrow one (a jump of about 77 px at 390, by design since the server has no width).

## Interaction

| Input | Where | What happens | Never |
|---|---|---|---|
| Wheel / trackpad scroll | over the graph | zooms at the cursor (`zoomAt`, `clientToDrawing`) **only** while focus is inside the graph container or with Ctrl/⌘ held (trackpad pinch sends ctrl-wheel), then `preventDefault` (D100) | a plain wheel over an unfocused graph is not `preventDefault`ed: the page scrolls |
| Zoom in / Zoom out buttons | toolbar | `zoomAt(view, 1.25 or 0.8, view centre)` | |
| Reset view | toolbar | the first view again: `fitAll` from 640, `fitCluster('agentic')` below; clears nothing else | |
| `+` / `=` / `-`, `0` | focus in the graph | zoom in / out at the centre; reset | |
| Arrow keys | focus in the graph (the container or a node link) | `panBy` 10 % of the view's width (or height), `preventDefault` | the page doesn't scroll while the graph has focus; it does as soon as focus leaves |
| Tab onto a node outside the view | node link | `centerOn` that node, so a keyboard user always sees what has focus | |
| Pointer drag | graph container | after 4 px of movement: `el.setPointerCapture?.(pointerId)` (jsdom has none), pan by the pointer delta in drawing units; a click under 4 px still follows a node link; after a drag, an `onClickCapture` `preventDefault`s the click so a drag ending on a node doesn't open the list; `pointercancel` and `lostpointercapture` end the drag (a vertical swipe under `pan-y` cancels); a zero-size rect (jsdom) skips the pan and the wheel zooms at the view centre, so no NaN viewBox | no `window` or `document` listeners: capture keeps the events on the element, so nothing can leak; the one non-React listener is the `wheel` one (React's `onWheel` is passive and can't `preventDefault`), added `{ passive: false }` in an effect and removed in its cleanup |
| Touch | graph container | `touch-action: pan-y pinch-zoom` (`touch-pan-y touch-pinch-zoom`): a horizontal swipe pans the graph, a vertical swipe scrolls the page, a pinch zooms the page as anywhere else (the graph has no pinch handler; ± are its zoom on touch) | the graph never traps a vertical swipe or a pinch |
| Cluster chip (below 640) | chip row | `fitCluster(id)`; the chip under the view centre is `aria-pressed` | |
| Project chip | chip row | toggles the selection: its nodes `data-active`, every other node and edge `data-dim`, its `projectChain` drawn with `data-active`, "Open case study" shown, the status announced; below 640 the view moves to the chain's first cluster if none of its nodes is in view | |
| Hover or focus a node | node | `data-hover` on it, its cross-cluster edges drawn; leave/blur removes them | a hover never clears or changes a selection |
| Esc | anywhere in the graph section | clears the selection (and the hover), `preventDefault` so nothing else acts on it | does nothing (and lets Esc through) when nothing is selected |
| Click / Enter on a node | node link | opens the list view, moves focus to `#skill-<id>` and sets the hash (`history.replaceState`) (D101) | |
| `/skills#skill-<id>` on load | page | opens the list view at that row | |
| List view toggle | toolbar | shows the list, hides the graph (and back); focus stays on the toggle | |
| Reduced motion | everywhere | the same: view changes are instant anyway; highlight fades are `motion-safe:` only | no animated viewBox |

**Built** (P5-03 drew the hover, P5-04 the pan and zoom, P5-05 the project chips): every row above holds. P5-05's
deviations: the chip row (`role="group"` "Highlight a project's stack", short titles, featured projects with an edge,
in `order`) scrolls in its row below `sm` and wraps from it, and leaves the DOM with the zoom controls while the list
view is on; the selection stays in state, so it comes back with the graph. Only the chain's **cross-cluster** pairs
are drawn as new paths (`data-cross data-active`); an intra edge whose ends are both the project's turns accent and
`data-active`, every other edge `data-dim`. A dimmed node is back at full opacity while hovered as well as on
keyboard focus (its `opacity-25` class leaves while it is the hover; `focus-visible:opacity-100` covers a focus the
mouse has left). The visible line is "<title> · N skills · Open case study"; the `sr-only` `aria-live="polite"`
status, always in the DOM so it is announced, reads "<title>: N skills highlighted." Reset view keeps the selection.
Esc is handled on the section's wrapper `div`, so it works from a chip, the toolbar or a node, but not from the list
view (where the selection isn't shown: it passes through there).
An Opus review of P5-05 (0 Critical, 0 Important, 10 Minor) led to, test-first: Esc from the list view passes through
and keeps the selection; a clear is announced ("Highlight cleared."); a chip below 640 counts a node in view only
when its whole cell is (`inView`, shared with Tab's `reveal`); "1 skill" singular; one `partOf` drives a node's and an
edge's attributes and classes; one `print:hidden`. Left, with reasons: Safari doesn't focus a clicked button, so
there Esc after a mouse click on a chip reaches `body` and does nothing (the second click clears; a `document`
listener would also clear on an Esc meant for the concierge panel); "Open case study" is the feature's wording though
four featured projects have the classic page; hover paths under a selection carry `data-hover` only (a hover adds,
it doesn't join the selection); at 390 the longest chip ("Self-hosted music library & DJ crate pipeline") nearly
fills the scrolling row, and the chips' own `transition-colors` predates P5-05: both for P5-07's look.

## Accessibility and list view

- Every node is an `<a>` with `aria-label` = its full name and `href="#skill-<id>"`, its row in the list view (D101):
  the list row is the node's detail (weight, since, projects), so the link has a real target. Tab order: project
  chips → toolbar → graph container → nodes in cluster and drawing order. Every link and button gets the shared
  `focusRing` (`focus-visible`).
- The container is the one `role="group"`, named by the svg's `<title>` (`aria-labelledby`); the svg is
  `role="none"` (D103); each cluster is a nested `role="group"` with its name; rects, edges, logos and label text
  are `aria-hidden` decoration, the names live on the links.
- The **List view** toggle is a `<button aria-pressed>` in the toolbar; pressing it shows the list and hides the
  graph (and back), focus stays on the toggle, and its state is the only thing that decides which one is on screen.
- The container announces itself ("Tech stack graph", group) and its keys (`aria-describedby` → the instructions).
- Selection is announced through the `aria-live="polite"` line; chips carry `aria-pressed`. Dimmed nodes stay
  focusable and their labels readable on focus (a focused node drops `data-dim`'s opacity); the list stays the
  text alternative.
- **The list view is the text alternative and the print view**: every node under its cluster `<h2>`, as a `<dl>`;
  `print:block` always, the graph `print:hidden` always, so `print-check.mjs` sees the list and no svg.
- 390: no horizontal page scroll (the chip rows scroll themselves); touch targets 44 px.

## Tests

| File | Feature | Asserts |
|---|---|---|
| `src/__tests__/lib/skills-data.test.ts` (new) | P5-02 | ids unique; every node's cluster exists; weights 1–3; every `logo` is a key of `logoPaths`; every edge's `from` is a node id and its `to` a node id or `project:<slug>` with the slug in `projects`; every featured project has ≥ 2 project edges; every § 8 name (the 33 above, held in the test) is a node name; none of Ruby, R, Ruby on Rails, Flask, MongoDB, PowerShell, WSL is a node; Zapier is, at weight 1, with an edge to `project:ringcentral-jobtread-integration`; `since` is four digits when set; `labelLines(name)` gives ≤ 2 lines of ≤ 16 chars for every node; clusters are the six names in order |
| `src/__tests__/lib/data.test.ts` (edit) | P5-02 | the `skillCategories` describe block goes (its D20 assertions are superseded by D98); the barrel still exports `clusters`, `nodes`, `edges` |
| `src/__tests__/components/logos/paths.test.ts` (edit) | P5-02 | the key list is the 25 keys; still generated (header line) |
| `src/__tests__/lib/graph-math.test.ts` (new) | P5-02 | `layoutGraph` deterministic (two calls deep-equal) and per width (3 columns at 1280, 2 at 390, bounds `1052 × 700` and `704 × 1008` for the real data); no two node boxes in a cluster intersect, every node box inside its cluster rect; `labelLines` splits "Multi-tenant architecture" into two lines ≤ 16; `clampView` never shows beyond bounds ± pad and keeps aspect; `zoomAt` keeps the point fixed (drawing coords before and after equal at the same relative position); `panBy` then `clampView` stops at the edge; `fitCluster(layout, 'agentic', aspect)` at width 390 is no wider than the cluster + 2 × 12 (and the data cluster's fit holds its whole rect); `fitAll` holds the bounds; `centerOn` centres; `clientToDrawing` maps the rect's corners to the view's; `curvePath` matches `/^M [\d.-]+ [\d.-]+ C( [\d.-]+){6}$/`; `edgePaths` marks `cross`; `projectChain` crosses k − 1 times for a project in k clusters |
| `src/__tests__/components/skills/SkillGraph.test.tsx` (new) | P5-03–05 | the container `role="group"` named by the svg's `<title>` (svg `role="none"`); a nested group per cluster named by it; a `g[data-cluster]` per cluster with a rect and its name; a link per node named by its name with `href="#skill-<id>"`; path count = intra edges with nothing hovered or selected; hover/focus adds that node's cross paths (`data-hover`), leave removes them; Zoom in/out/Reset change the `viewBox` attribute as `zoomAt`/the first view say; a plain `wheel` leaves `viewBox` unchanged and `defaultPrevented` false, with `ctrlKey` (or focus inside) it zooms and is prevented; ArrowRight changes `viewBox` by `panBy`; pointerDown/Move/Up pans; matchMedia mocked narrow → first `viewBox` = `fitCluster('agentic')`, cluster row present with `sm:hidden`, a chip click pans and moves `aria-pressed`; wide → `fitAll` first; project chip `aria-pressed`, `data-active` / `data-dim` counts, chain paths `data-active`, "Open case study" href, Esc and a second click clear; hover with a selection keeps it; reduced motion (mock override) → no `transition` class or style on the svg; node click opens the list and focuses `#skill-<id>`; unmount removes the wheel listener (spy on `removeEventListener`) |
| `src/__tests__/pages/skills.test.tsx` (rewritten) | P5-03, P5-05 | h1 "Tech Stack"; no "Differentiator"; List view toggle `aria-pressed` flips; every node name is in the list view, each under its cluster `<h2>`, `#skill-<id>` on its `<dt>`; project names in a row link `/projects/<slug>`; the list has `print:block`, the graph `print:hidden`; selecting "Agent Harness" marks ≥ 3 nodes `data-active` and "Open case study" points at `/projects/agent-harness`; metadata description names the graph |
| `src/__tests__/pages/a11y-new-pages.test.tsx` (edit) | P5-03 | /skills in the pages list: one h1, `focus-visible` styles on every node link and button, no vague link text |
| `.harness/skills-check.mjs` (new) | P5-06 | in Chromium on the harness dev server: no horizontal page scroll at 390; Tab from the h1 reaches the controls and then the first node link (name printed); ArrowRight changes `viewBox`; the agent-harness chip marks N ≥ 3 nodes active; every node label's bbox is inside its cluster rect at 1280 and no two label bboxes intersect; captures `docs/screenshots/v3/P5-skills-{1280,selected-1280,390,list-390}.png` (each < 400 KB); exit 0 |

Unchanged and still green: `content-guard`, `Logo.test` (extra keys stay apart from generated ones),
`FloatingLogos` (its twelve keys), `print-styles`, smoke (`/skills` already in it).

## What Michael will see

Filled by P5-06 from `.harness/skills-check.mjs` (exit 0, `skills-check: ok`, 0 console errors at either width) on
the harness dev server (:7835). The captures close the first-visit callout first (the script prints how much of the
graph it covered); the pill stays, as on every chrome page.

| Capture | What it shows |
|---|---|
| `docs/screenshots/v3/P5-skills-1280.png` (182 KB) | The whole drawing (viewBox `0 0 1052 700`): eight project chips in two rows, + / − / Reset and List view, six cluster containers in 3 columns; all 51 labels inside their cluster rect and no two label boxes intersecting |
| `docs/screenshots/v3/P5-skills-selected-1280.png` (186 KB) | Agent Harness pressed: N = 9 active (Harness engineering, Context engineering, Agent memory, Claude Code, Durable state, Eval gates, Bash, Node.js, Git/GitHub), 42 dimmed, 3 cross paths; "Agent Harness · 9 skills · Open case study" → `/projects/agent-harness` |
| `docs/screenshots/v3/P5-skills-390.png` (67 KB) | First view `4 4 348 308` = Agentic systems, its chip pressed in the Jump to a group row, the project chip row scrolling above it; scrollWidth 390 |
| `docs/screenshots/v3/P5-skills-list-390.png` (357 KB) | List view: 51 `dt`s under six headings, graph hidden, scrollWidth 390 |

- Keyboard (1280): Tab from the h1 → the eight project chips → Zoom in → Zoom out → Reset view → List view → the graph
  → **Harness engineering** (the first node link, focus-visible ring). ArrowRight on the graph: `0 0 1052 700` →
  `24 0 1052 700`; `0` resets it.
- Print: `node .harness/print-check.mjs http://localhost:7835 /skills $HARNESS_SCRATCH/print-skills.png` → PASS (white
  body, nav/footer hidden, every link underlined, all text black); the capture shows the list, not the svg.
- For P5-07: the List view toggle still prints (a lone outlined button above the list; the zoom row is `print:hidden`,
  its row isn't). The fixed pill sits over the graph at scroll 0 (64×48 px at 1280, on Tailwind CSS's label; 136×48 px
  at 390, on Copilot Studio's), and the first-visit callout over it too (184×66 / 256×66 px) until closed or scrolled.

## Review

Filled by P5-07 (`$HARNESS_SCRATCH/P5.diff`).

| # | Severity | File:line | Finding | Resolution |
|---|---|---|---|---|

## Decisions

Recorded in `docs/specs/2026-10-18-portfolio-v2.md` § v3 decisions as D98–D103 (P5-01):

- **D98** `skills.ts` is a graph (`clusters`, `nodes`, `edges`, § Data above); `skillCategories`, its four groups
  and D20's featured Process & delivery block go. Node rule and drop list as above; MongoDB dropped although
  Cherished (not featured) lists it. Weights are this plan's reading.
- **D99** No d3-force: a hand layout, reconsidered only under § Math's two conditions.
- **D100** The wheel zooms only with focus inside the graph or Ctrl/⌘; touch is `pan-y pinch-zoom`.
- **D101** A node links to its list-view row `#skill-<id>`; following it opens the list view there.
- **D102** The small-screen behaviour (first view on the first cluster, the cluster chip row) applies below 640 px
  (`sm`), not only at ≤ 390: the 2-column drawing is unreadable at any phone width.
- **D103** The graph container is the `role="group"`, named by the svg's `<title>`; the svg is `role="none"`, not
  `role="img"`, and each cluster a nested group; view changes are instant at every
  motion setting (no viewBox tween).
