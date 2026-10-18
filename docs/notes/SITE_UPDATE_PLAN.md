# Portfolio Site Update Plan

**Goal:** Make projects *show* the work rather than *tell* about it, bring all content current with the latest Apprentice Profile + project notes, and prune stale projects.

**Source material:** `project_descriptions.md` (cleaned project notes), `Michael Herron - Apprentice Profile.md` (current résumé).

---

## Part A — Content Strategy: What to Convey & How

### The core problem with the current projects

Every project is **100% prose** — `problem → approach → challenges → outcome`, four paragraphs of text, zero visuals. For integration/automation work this is especially fatal: the work is *invisible by nature* (no app UI a recruiter can picture), so a wall of text reads as "claims" rather than "evidence."

There are **no project images anywhere** in `/public` (only a headshot, Mt. Hood, and snowboarding videos). The project cards have no thumbnail; the detail pages have no diagrams, screenshots, code, or metrics.

### "Show, don't tell" — the four evidence types

For each project, lead with **visual evidence** and let prose support it:

| Evidence type | Why it works for *this* work | Where it comes from |
|---|---|---|
| **Architecture / data-flow diagrams** | The integration logic *is* the product. The GHL↔JobTread data-model mapping and waterfall match are genuinely impressive — drawn out, they prove depth. | We author these as styled inline SVG/React diagrams (dark theme, accent cyan). No external assets needed. |
| **Before / after process diagrams** | Linear adoption: "scattered Google Sheets, no status tracking" → "automated filing + triage + dedup." A two-panel diagram tells that story in one glance. | Authored diagrams. |
| **Annotated tool/app screenshots** | Pipedream/n8n workflow canvases, the Linear board, the React Native paint estimator screens. Real screenshots = undeniable proof. | **Michael must capture** (see Asset Checklist). |
| **Metric callouts** | "~80% less bug-filing time," "2 days → ~6 hrs onboarding," "8 hrs/week saved per client." Big numbers up top anchor the impact. | From the Apprentice Profile. |
| **Code/config snippets** | The waterfall find-or-create (phone → email → name) shown as a short snippet proves it's real engineering, not a Zapier toggle. | Authored from the notes. |

### Per-project "show" treatment

1. **GoHighLevel ↔ JobTread** *(primary showcase)* — Data-model diagram of both platforms side by side; an arrow diagram of the waterfall match (phone→email→name) and find-or-create order (customer→contact→location→job); a Pipedream workflow screenshot; metric callouts.
2. **RingCentral ↔ JobTread** — Diagram: inbound call/text → phone match → one-or-many JobTread contacts → unified comment thread. Screenshot of a JobTread contact thread (redacted). Note the Zapier→n8n migration as an annotated decision.
3. **Linear Adoption (MAXX)** — *New project — CONFIRMED.* Before/after process diagram (sheets chaos → automated pipeline). Screenshot of the Linear board + an AI-agent triage comment. Metrics: doubled throughput, ~80% bug-filing reduction.
4. **React Native Paint Estimator (MAXX)** — *New project — CONFIRMED.* The hierarchy diagram (Job → Areas → Features → Tasks). App screenshots / short screen recording. Note: joined at go-live, drove RN paradigms.
   - *DB-migration tracking: NOT a standalone project (per decision). The migration pain point may be folded as a supporting detail in the Linear/process-improvement narrative if desired.*
5. **Mirrored Google Calendars** — Keep; add a small sync-architecture diagram and note the "inherited broken code → rebuilt" arc.
6. **Cherished (Duke)** — Keep but de-emphasize (academic). Add a screenshot if one exists; otherwise leave text-only and `featured: false`.

---

## Part B — Gap Analysis (everything that's out of date or missing)

### Projects (`src/lib/data/projects.ts`)
- ❌ **Missing all MAXX work** — Linear adoption, DB-migration tracking, React Native paint estimator. The notes describe three substantial MAXX projects; none are on the site.
- ❌ GHL↔JobTread lists tech as `Pipedream` but the notes say **Supabase** was the backend bridge. Reconcile (likely both).
- ❌ No media/diagram/metric/code fields on the `Project` type — schema must be extended to support "show."
- ⚠️ DB-migration notes are **cut off** — need Michael to supply the resolution before we can write it up (or fold it into the Linear/process-improvement story).

### Experience (`src/lib/data/experience.ts`)
- MAXX bullets are softer than the current profile. Update to match: "doubled sprint throughput," "~80% bug-filing reduction," agentic coding across triage/implementation/testing.
- MAXX role title: site uses "Full-Stack Software Engineer"; About page calls it "apprentice." Profile says **Full-Stack Software Engineer**. Pick one voice (recommend keeping the engineer title in Experience; soften "apprentice" wording on About — see Part D).
- Builder Clarity bullets could absorb the strong profile metrics (3 clients, 2 days→6 hrs, 8 hrs/week, ETL from 7+ sources into Postgres).

### Skills (`src/lib/data/skills.ts`)
- Profile adds skills not on the site: **PowerShell**, **Supabase Edge Functions**, **ETL pipelines**, **multi-tenant integration architecture**, **Agentic AI**, **WSL**, **Linear**. Add these.

### Home / Hero
- Tagline is current. Consider a logo for **Linear** in the floating logos (now a core tool).

### Contact / Footer
- ✅ **Decided:** keep `mherron734@gmail.com`. No changes to contact page, footer, or contact test.

### Tests
- Adding projects/fields will touch snapshot-style assertions. Plan to update `src/__tests__/` (project data tests, contact test if email changes).

---

## Part C — Implementation Plan (phased)

### Phase 0 — Decisions & assets (blocking)
- Resolve the open questions in Part D (About pruning, email, which MAXX projects, DB-migration resolution).
- **Asset Checklist** — Michael captures & drops into `/public/projects/<slug>/`:
  - GHL↔JobTread: Pipedream workflow screenshot(s).
  - RingCentral: JobTread contact-thread screenshot (redacted).
  - Linear: board view + an AI-agent triage comment screenshot.
  - Paint estimator: 2–4 app screenshots or a 10–20s screen recording.
  - (Optional) Mirrored Calendars: a screenshot if available.

### Phase 1 — Data model extension (`src/lib/data/projects.ts`)
Extend the `Project` type to support visual evidence:
```ts
interface ProjectMedia { type: 'image' | 'video'; src: string; alt: string; caption?: string; }
interface Metric { value: string; label: string; }
interface CodeSnippet { title: string; language: string; code: string; }

interface Project {
  // ...existing...
  thumbnail?: ProjectMedia;     // card preview + detail hero
  metrics?: Metric[];           // big-number callouts
  detail: {
    problem; approach; challenges; outcome;   // existing
    architectureDiagram?: 'ghl-jobtread' | 'ringcentral' | 'linear-flow' | 'paint-hierarchy' | 'calendar-sync';
    media?: ProjectMedia[];     // screenshot gallery
    codeSnippets?: CodeSnippet[];
  };
}
```
- Add the 2 new MAXX projects; reconcile GHL tech stack (add Supabase); add the `ai` category usage where relevant.

### Phase 2 — Diagram components (`src/components/projects/diagrams/`)
Author reusable, theme-styled inline-SVG/React diagram components (dark bg, cyan accent, animate in with Framer Motion):
- `DataModelDiagram` (GHL vs JobTread entity maps + the waterfall match arrows).
- `ProcessBeforeAfter` (Linear adoption two-panel).
- `HierarchyDiagram` (paint Job→Area→Feature→Task).
- `SyncFlowDiagram` (RingCentral + calendar sync — parametrized).
- A `<MetricCallout>` strip and a `<CodeBlock>` (syntax-highlight via a lightweight approach; respects `prefers-reduced-motion`).

### Phase 3 — Project card upgrade (`ProjectCard.tsx`)
- Add a thumbnail/preview region at the top of the card (image, or a mini diagram/gradient placeholder when no asset). Keep the Server Component.
- Surface 1–2 top metrics as small badges.

### Phase 4 — Detail page upgrade (`projects/[slug]/page.tsx`)
- Add a **metrics strip** under the header.
- Render `architectureDiagram` after "The Approach."
- Render the media gallery (screenshots with captions) and code snippets in context.
- Keep the problem/approach/challenges/outcome prose but tighten it so visuals lead.

### Phase 5 — Experience + Skills + Hero
- Update `experience.ts` MAXX + Builder Clarity bullets to profile metrics; reconcile job title.
- Add new skills to `skills.ts`.
- (Optional) add Linear to `FloatingLogos.tsx`.

### Phase 6 — About page edits
- Apply the pruning decided in Part D (remove hit-list / stale personal projects; align "apprentice" wording).

### Phase 7 — Tests + build
- Update/extend tests in `src/__tests__/` for new project data + any contact email change.
- `npm test`, `npm run lint`, `npm run build`.
- E2E sanity pass with `playwright-cli -s=portfolio` on `/projects`, a couple of `/projects/[slug]`, `/about`.

---

## Part D — About Page Pruning (DECIDED)

✅ **Decision: remove both personal projects.** Delete the entire closing paragraph that begins "I'm also building projects where I'm the target user…" — both the **skate video classifier** and the **snowboard street-spot tracker / `github.com/mh550/hit-list`** ("Hitlist") references go. This drops the inactive-repo link and gives the page a tighter, more professional close ending on the MAXX apprenticeship paragraph.

Handled in **Phase 6**.
