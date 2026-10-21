# Brand brief (2026-10-18)

The positioning, voice and content rules for the portfolio v2 run. The spec is
`docs/specs/2026-10-18-portfolio-v2.md`; this file is what "on brand" means.

## The problem this update solves

Michael does product-owner, project-manager and process-engineering work, but every title he has held says
"software engineer". The site today leads with tools ("Full-Stack & Integration Engineer", floating
n8n/Zapier/Pipedream logos), has no metrics, no diagrams, no links, and nothing newer than March 2026. It *tells*.
v2 must *show*: real systems, the decisions behind them, what broke, what he changed, and the numbers.

## Positioning

### v3 (2026-10-21, D76/D77 *default*, Michael picks the final words)

- **Headline: "Agentic Systems Engineer".** Same places as below (hero eyebrow, `<title>`, `/card`, vCard `TITLE`,
  Open Graph); still a positioning line, not a job title. "Systems & process" stays as *how* he works.
- **Tagline (keep):** "I build simple, elegant systems that fit the humans who run them."
- **Subline:** "I build the harnesses, memory and verification around AI agents, and the integrations they run on."
- **The loop (hero strip and About):** Spec → Context → Build → Verify → Learn, the loop the harness runs. The five
  verbs Diagnose → Decide → Build → Verify → Simplify stay the spine of every case study. How I work moves to
  `/about#how-i-work` (P1-04/P1-05; `/approach` redirects there).

### 2026-10-18 (decided by Michael; history, superseded by v3 above)


- **Headline title: "Systems & Process Engineer".** It appears in the hero eyebrow, the site `<title>`, the
  `/card` page, the vCard `TITLE`, and Open Graph metadata. It is a positioning line, **not** a job title.
- **Real job titles never change** (Michael's rule: "never retitle a job; framing lives in the summary and bullet
  order"). Experience keeps "Full-Stack Software Engineer" at MAXX Potential, "Founding Full-Stack Software
  Engineer" at Builder Clarity, "AI Workflow Engineer" at Tahoma Films.
- **Tagline (keep):** "I build simple, elegant systems that fit the humans who run them."
- **Subline (new):** "I find where work breaks down, design the system that fixes it, then build it, run it, and
  measure it." Supporting phrase where a shorter one is needed: "I own delivery from requirements to release."
- **The method, the spine of the site:** Diagnose → Decide → Build → Verify → Simplify. Every case study is
  told in that order, and `/approach` explains it with links into the case studies.
- **Target readers, in order:** (1) hiring managers and recruiters for SWE I/II, solutions / implementation /
  forward-deployed, technical BA/PM bridge roles (Durham/RTP); (2) MAXX Potential staff assessing his apprenticeship
  level-up to level 4; (3) people Michael meets at conferences, usually on a phone, for under a minute.

## Voice

- Plain, specific, first person, past tense for what happened. Short sentences. Numbers over adjectives.
- Approachable and genuine, not corporate (the original spec's tone). No buzzword stacks ("leveraging synergies").
- Show the reasoning: "I chose X over Y because Z; the cost was W." Admit what broke and what rule it became.
  The failure stories are the strongest evidence of how he thinks; do not sand them off.
- Credit honestly. Much of the recent code was written by Claude Code agents under Michael's direction. Say so,
  framed accurately: he designed the process, the specs, the decision ledgers, the verification gates and the
  harness; agents wrote much of the code; he reviewed, decided and ran it. That *is* the systems/process story.
  Never claim he hand-wrote code the agents wrote; never hide that agents were used.

## Metrics bank (public-safe; use these, not invented ones)

Work history (from his experience bank; "4+" is the committed outbound figure for ETL sources):
- MAXX: QA/Eng issue tracking moved to Linear + an AI agent workflow: **2× sprint throughput, ~80% less
  bug-filing time**. De facto project manager on a client engagement. Updated the org's Foundational Capability
  Patterns for AI-assisted rapid prototyping (solution tiers; citizen vs. professional development pathways).
  Bootstrapped git-tracked DB migrations and onboarded the team.
- Builder Clarity: multi-tenant integration platform, **3 clients**, onboarding **~2 days → ~6 hours**,
  **~8 hrs/week saved per client**, ETL from **4+ sources** into Postgres; introduced Agile/Scrum in Linear.

Recent projects: see `docs/notes/evidence-*.md`. Every number on the site must trace to one of these files.

## Content rules

- **Never publish** (a jest guard enforces the patterns, see the spec's M0): Tailscale hostnames (`*.ts.net`) or
  `100.x.y.z` addresses; ntfy topic names; anything from `.env` files, `/srv/docker/.env`, `/etc/restic/env`;
  API keys or tokens (AcoustID, Gatus, GitHub); Michael's phone number anywhere in `src/` or `public/`;
  Spotify playlist URLs; Artifact / status-page links; the contents of `agent-harness/journal/raw/`.
- Music sourcing: lead with "self-hosted library, verified quality, safe automation". The download source can be
  named once, plainly ("a peer-to-peer network, Soulseek"), with no peer usernames; do not make it the headline.
- No fake screenshots and no stock imagery. Where a real screenshot is missing, use an authored diagram, a code or
  terminal excerpt, or nothing, and add the shot to `docs/asset-checklist.md` for Michael to capture.
- Links: only real, public URLs. Public repos: github.com/mh550/agent-harness, github.com/mh550/hit-list,
  github.com/mh550/dj-crate-streaming, github.com/mh550/portfolio_site. **Pathways and mh550/projects are private:
  never link them.**
- Accessibility: every diagram has a text alternative (a `<title>`/`aria-label` plus a short caption);
  animations respect `prefers-reduced-motion`; text contrast AA on the dark theme.

## Contact facts (for `src/lib/data/profile.ts`)

- Name: Michael Herron · Location: Durham, NC
- Email: mherron734@gmail.com (the site's existing contact address; keep it)
- LinkedIn: https://www.linkedin.com/in/mherron734/ · GitHub: https://github.com/mh550
- Site: https://michael-herron.vercel.app · Headshot: `public/photos/headshot.png`
- Phone: **not on the site or in the public vCard** (D5).
