/** A resume line: plain, or with link spans (each `link.text` occurs exactly once in `text`). */
export type Bullet = string | { text: string; links: { text: string; href: string }[] };

export const bulletText = (b: Bullet): string => (typeof b === 'string' ? b : b.text);

export interface Role {
  title: string;
  company: string;
  period: string;
  bullets: Bullet[];
}

// Resume v4, word for word (v3 spec § 8); links per § 3: the site's deep-dive when one exists.
export const roles: Role[] = [
  {
    title: 'Full-Stack Software Engineer',
    company: 'MAXX Potential',
    period: 'February 2026 – Present',
    bullets: [
      {
        text: 'Shipped React Native, Next.js, edge-function, and Postgres features for a contractor estimating app (~8 issues/week); codified recurring UI fixes into a knowledge source agents load as procedural memory.',
        links: [{ text: 'contractor estimating app', href: '/projects/paint-estimator' }],
      },
      {
        text: 'Replaced siloed spreadsheet bug tracking with Linear and an agentic bug-fix workflow (CLI tooling + custom slash commands): 2× sprint throughput, ~80% less bug-filing time, no new software costs.',
        links: [{ text: 'agentic bug-fix workflow', href: '/projects/linear-ai-workflow' }],
      },
      'Designed enterprise Copilot Studio agents: split an over-scoped JD agent into manager and HR agents so each context holds only its data; built an org-restructure impact model alongside SAP SuccessFactors.',
    ],
  },
  {
    title: 'Founding Full-Stack Software Engineer',
    company: 'Builder Clarity',
    period: 'March 2025 – November 2025',
    bullets: [
      {
        text: 'Architected a multi-tenant JobTread ↔ GoHighLevel integration platform with managed multi-org OAuth, replacing per-client builds: 3 clients, onboarding cut from ~2 days to ~6 hours.',
        links: [{ text: 'JobTread ↔ GoHighLevel integration platform', href: '/projects/ghl-jobtread-integration' }],
      },
      {
        text: 'Integrated CRM, VoIP (RingCentral), and internal systems, incl. a unified per-job communications log, saving ~8 hrs/week per client; built ETL normalizing 4+ sources into Postgres.',
        links: [{ text: 'unified per-job communications log', href: '/projects/ringcentral-jobtread-integration' }],
      },
      'As first engineer, led the move from Zapier to n8n and Pipedream (custom JS components), replacing per-client automations with reusable multi-tenant workflows.',
    ],
  },
];

/** The resume's Projects group: the name links the deep-dive, the repo line links GitHub. */
export interface ResumeProject {
  name: string;
  href: string;
  repo: string;
  period: string;
  bullets: Bullet[];
}

export const resumeProjects: ResumeProject[] = [
  {
    name: 'Long-Running Agent Harness',
    href: '/projects/agent-harness',
    repo: 'https://github.com/mh550/agent-harness',
    period: 'October 2026 - present',
    bullets: [
      "Engineered a deterministic Bash harness that runs Claude Code agents in isolated git worktrees and takes tests, verification, and merges out of the agent's hands, merging only byte-identical verified trees.",
      'Designed agent memory through context engineering: a fresh context window per feature, rebuilt from durable on-disk state, with project rules as procedural memory and run retros as episodic memory.',
    ],
  },
  {
    name: 'Self-Hosted Music Server & DJ Pipeline',
    href: '/projects/home-media-server',
    repo: 'https://github.com/mh550/dj-crate-streaming',
    period: 'November 2025 - present',
    bullets: [
      'Self-hosted streaming + DJ ‘crate’ preparation pipeline using Docker Compose behind Tailscale: flagging a playlist as a crate enqueues its missing tracks; a worker container downloads, verifies, and files them.',
      'Song/version/copy identity model dedupes only decode-identical audio; downloads verified by ffmpeg decode analysis and acoustic fingerprint; 1,500+ offline tests on fakes built from captured live responses.',
    ],
  },
];

/** Roles not on the resume, kept as one line each (D82). */
export type EarlierRole = Pick<Role, 'title' | 'company' | 'period'>;

export const earlierRoles: EarlierRole[] = [
  { title: 'AI Workflow Engineer', company: 'Tahoma Films', period: 'February 2025' },
  { title: 'Snowboard Coach', company: 'High Cascade Snowboard Camp', period: 'Summers 2023 & 2024' },
];

export interface Education {
  degree: string;
  institution: string;
  period: string;
  honors: string[];
  coursework: string[];
}

export const education: Education = {
  degree: 'B.S. Computer Science, Visual & Media Studies Minor',
  institution: 'Duke University',
  period: 'Graduated December 2024',
  honors: ['George Scholar', 'Duke True North Leadership Program'],
  coursework: [
    'Database Systems',
    'Algorithm Design & Analysis',
    'Computer Security',
    'Server-side Web Apps',
    'Computer Systems',
    'Data Structures & Algorithms',
  ],
};
