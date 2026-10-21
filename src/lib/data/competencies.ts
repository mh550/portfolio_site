// projects.ts is in an import cycle with approach.ts: call these only inside functions, never at module load.
import { resolveProjectLink } from './projects';

export type EvidenceContext = 'MAXX Potential' | 'Builder Clarity' | 'Personal';

export interface EvidenceItem {
  /** The link text, so it must make sense out of context. */
  text: string;
  /** An internal route, /projects/<slug>[#anchor], or a public repo root. */
  href: string;
  context: EvidenceContext;
  /** A phrase found in brand.md (MAXX and Builder Clarity items) or an evidence brief or the spec (Personal). */
  source: string;
}

export interface Competency {
  id: 'diagnose' | 'design' | 'deliver' | 'lead' | 'teach' | 'ai';
  title: string;
  items: EvidenceItem[];
}

// /evidence (M7, D7). Copy and sources: docs/plans/2026-10-18-M7-approach-evidence.md § Competencies, Evidence page.
// Remapping to the MAXX level-4 rubric means editing this file only (docs/notes/maxx-level-4.md).
export const evidenceIntro = {
  reading:
    'Each competency lists two to four pieces of my work, each labelled with where I did it and linked to the case study, role or repo it comes from.',
  mapping:
    'For now these map to general competencies; once I have the MAXX Potential level-4 rubric, this page will follow it instead.',
};

export const competencies: Competency[] = [
  {
    id: 'diagnose',
    title: 'Diagnose problems in real processes',
    items: [
      {
        context: 'MAXX Potential',
        text: 'Diagnosed a QA issue-tracking bottleneck (one spreadsheet per person) and moved the team to Linear',
        href: '/projects/linear-ai-workflow',
        source: 'QA/Eng issue tracking moved to Linear',
      },
      {
        context: 'Personal',
        text: 'Named the three walls every single-session agent run hit: context, usage limits, the permission classifier',
        href: '/projects/agent-harness#diagnose',
        source: "the model's context limit, the plan's usage limit, or the auto-mode permission classifier",
      },
      {
        context: 'Personal',
        text: 'Found 92 titles still wrong on my phone while every library count matched',
        href: '/projects/home-media-server#diagnose',
        source: '92 titles were still wrong on the phone',
      },
    ],
  },
  {
    id: 'design',
    title: 'Design systems and make decisions explicit',
    items: [
      {
        context: 'MAXX Potential',
        text: "Updated MAXX Potential's Foundational Capability Patterns for AI-assisted rapid prototyping: solution tiers, citizen vs. professional pathways",
        href: '/experience',
        source: 'Foundational Capability Patterns for AI-assisted rapid prototyping',
      },
      {
        context: 'Builder Clarity',
        text: 'Replaced per-client builds with one multi-tenant integration platform: onboarding from ~2 days to ~6 hours',
        href: '/projects/ghl-jobtread-integration',
        source: 'multi-tenant integration platform',
      },
      {
        context: 'Personal',
        text: 'Kept a numbered decision ledger for my agent harness: what I chose, over what, and why',
        href: '/projects/agent-harness#decisions',
        source: 'D-H1…D-H24',
      },
      {
        context: 'Personal',
        text: 'Split ownership in my music server: Navidrome owns the songs and playlists; the crates app owns only the crate flags, the wanted queue and approvals',
        href: '/projects/home-media-server#decide',
        source: 'the app owns the flag',
      },
    ],
  },
  {
    id: 'deliver',
    title: 'Deliver working, verified software',
    items: [
      {
        context: 'MAXX Potential',
        text: 'Bootstrapped git-tracked database migrations for the team',
        href: '/experience',
        source: 'Bootstrapped git-tracked DB migrations',
      },
      {
        context: 'Builder Clarity',
        text: 'Built ETL pipelines from 4+ sources into Postgres',
        href: '/experience',
        source: 'into Postgres',
      },
      {
        context: 'Personal',
        text: 'My agent harness verified and merged 52 features through 12 PRs in two runs, each milestone re-checked by an independent session',
        href: '/projects/agent-harness#verify',
        source: '52 verified and merged through 12 PRs',
      },
      {
        context: 'Personal',
        text: 'Put HitList on my iPhone and found the crash that 374 passing tests missed',
        href: '/projects/hit-list#lessons',
        source: '374 green tests, crash on the phone',
      },
    ],
  },
  {
    id: 'lead',
    title: 'Lead process and delivery',
    items: [
      {
        context: 'MAXX Potential',
        text: 'Served as de facto project manager on a client engagement',
        href: '/experience',
        source: 'De facto project manager on a client engagement',
      },
      {
        context: 'MAXX Potential',
        text: 'Moved the team to Linear and an AI-agent workflow: 2× sprint throughput',
        href: '/projects/linear-ai-workflow',
        source: '2× sprint throughput',
      },
      {
        context: 'Builder Clarity',
        text: 'Introduced Agile/Scrum in Linear for stakeholder visibility',
        href: '/experience',
        source: 'introduced Agile/Scrum in Linear',
      },
      {
        context: 'Personal',
        text: "Ran this site's update as specs, milestones and pull requests that I review and merge",
        href: 'https://github.com/mh550/portfolio_site',
        source: "the run's PRs on github.com/mh550/portfolio_site are public proof",
      },
    ],
  },
  {
    id: 'teach',
    title: 'Communicate and teach',
    items: [
      {
        context: 'MAXX Potential',
        text: 'Onboarded the team to git-tracked database migrations',
        href: '/experience',
        source: 'onboarded the team',
      },
      {
        // D35: High Cascade coaching is labelled Personal.
        context: 'Personal',
        text: 'Mentored young snowboarders at High Cascade: targeted drills, safe progression, patient feedback',
        href: '/experience',
        source: 'Mentored 12–18-year-old snowboarders',
      },
      {
        context: 'Personal',
        text: 'Designed the runbooks and specs my agents work from, so a fresh session picks up the work from disk',
        href: '/projects/agent-harness#iterations',
        source: 'fresh sessions force state onto disk',
      },
    ],
  },
  {
    id: 'ai',
    title: 'Use AI with guardrails',
    items: [
      {
        context: 'MAXX Potential',
        text: 'Moved QA tracking to Linear plus an AI-agent workflow: ~80% less bug-filing time',
        href: '/projects/linear-ai-workflow',
        source: '~80% less bug-filing time',
      },
      {
        context: 'Personal',
        text: 'Designed my agent harness to merge only a tree that is byte-for-byte the one that was verified',
        href: '/projects/agent-harness#decisions',
        source: 'byte-for-byte a tree that was verified',
      },
      {
        context: 'Personal',
        text: 'An independent review of v3 of my agent harness, before its first run, found 2 critical and 8 important bugs',
        href: '/projects/agent-harness#lessons',
        source: 'found 2 critical + 8 important bugs',
      },
    ],
  },
];

/** The items that can link on this branch, mirroring `resolvedExamples`: an item whose /projects/<slug> is missing
 *  drops out, and an anchor the project does not render (no caseStudy, or an empty section) is dropped from its href. */
export function resolvedItems(competency: Competency): EvidenceItem[] {
  return competency.items.flatMap((item) => {
    const m = item.href.match(/^\/projects\/([^#]+)(?:#(.+))?$/);
    if (!m) return [item];
    const link = resolveProjectLink(m[1], m[2]);
    if (!link) return [];
    return [link.anchor === m[2] ? item : { ...item, href: `/projects/${m[1]}` }];
  });
}
