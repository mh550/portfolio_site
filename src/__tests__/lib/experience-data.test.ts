/** @jest-environment node */
import { bulletText, earlierRoles, education, getProjectBySlug, resumeProjects, roles } from '@/lib/data';
import type { Bullet } from '@/lib/data';

// The resume v4 text, v3 spec § 8, word for word (P2-01).
const RESUME = {
  'MAXX Potential': [
    'Shipped React Native, Next.js, edge-function, and Postgres features for a contractor estimating app (~8 issues/week); codified recurring UI fixes into a knowledge source agents load as procedural memory.',
    'Replaced siloed spreadsheet bug tracking with Linear and an agentic bug-fix workflow (CLI tooling + custom slash commands): 2× sprint throughput, ~80% less bug-filing time, no new software costs.',
    'Designed enterprise Copilot Studio agents: split an over-scoped JD agent into manager and HR agents so each context holds only its data; built an org-restructure impact model alongside SAP SuccessFactors.',
  ],
  'Builder Clarity': [
    'Architected a multi-tenant JobTread ↔ GoHighLevel integration platform with managed multi-org OAuth, replacing per-client builds: 3 clients, onboarding cut from ~2 days to ~6 hours.',
    'Integrated CRM, VoIP (RingCentral), and internal systems, incl. a unified per-job communications log, saving ~8 hrs/week per client; built ETL normalizing 4+ sources into Postgres.',
    'As first engineer, led the move from Zapier to n8n and Pipedream (custom JS components), replacing per-client automations with reusable multi-tenant workflows.',
  ],
  'Long-Running Agent Harness': [
    "Engineered a deterministic Bash harness that runs Claude Code agents in isolated git worktrees and takes tests, verification, and merges out of the agent's hands, merging only byte-identical verified trees.",
    'Designed agent memory through context engineering: a fresh context window per feature, rebuilt from durable on-disk state, with project rules as procedural memory and run retros as episodic memory.',
  ],
  'Self-Hosted Music Server & DJ Pipeline': [
    'Self-hosted streaming + DJ ‘crate’ preparation pipeline using Docker Compose behind Tailscale: flagging a playlist as a crate enqueues its missing tracks; a worker container downloads, verifies, and files them.',
    'Song/version/copy identity model dedupes only decode-identical audio; downloads verified by ffmpeg decode analysis and acoustic fingerprint; 1,500+ offline tests on fakes built from captured live responses.',
  ],
};

const COURSEWORK = [
  'Database Systems',
  'Algorithm Design & Analysis',
  'Computer Security',
  'Server-side Web Apps',
  'Computer Systems',
  'Data Structures & Algorithms',
];

// brand.md § Never publish / Links: the only public repos.
const PUBLIC_REPOS = [
  'https://github.com/mh550/agent-harness',
  'https://github.com/mh550/hit-list',
  'https://github.com/mh550/dj-crate-streaming',
  'https://github.com/mh550/portfolio_site',
];

const allBullets: Bullet[] = [...roles.flatMap((r) => r.bullets), ...resumeProjects.flatMap((p) => p.bullets)];
const allLinks = allBullets.flatMap((b) => (typeof b === 'string' ? [] : b.links.map((l) => ({ ...l, bullet: b.text }))));

describe('experience.ts follows the resume v4 text (P2-01)', () => {
  it('has the two resume roles, in order, with their real titles and periods', () => {
    expect(roles.map((r) => [r.title, r.company, r.period])).toEqual([
      ['Full-Stack Software Engineer', 'MAXX Potential', 'February 2026 – Present'],
      ['Founding Full-Stack Software Engineer', 'Builder Clarity', 'March 2025 – November 2025'],
    ]);
  });

  it.each(['MAXX Potential', 'Builder Clarity'] as const)('gives %s exactly its three resume bullets', (company) => {
    const role = roles.find((r) => r.company === company)!;
    expect(role.bullets.map(bulletText)).toEqual(RESUME[company]);
  });

  it('holds the two resume projects with their links, periods and bullets', () => {
    expect(resumeProjects.map(({ name, href, repo, period }) => ({ name, href, repo, period }))).toEqual([
      {
        name: 'Long-Running Agent Harness',
        href: '/projects/agent-harness',
        repo: 'https://github.com/mh550/agent-harness',
        period: 'October 2026 - present',
      },
      {
        name: 'Self-Hosted Music Server & DJ Pipeline',
        href: '/projects/home-media-server',
        repo: 'https://github.com/mh550/dj-crate-streaming',
        period: 'November 2025 - present',
      },
    ]);
    for (const p of resumeProjects) {
      expect(p.bullets.map(bulletText)).toEqual(RESUME[p.name as keyof typeof RESUME]);
    }
  });

  it('keeps Tahoma Films and High Cascade as earlier roles with no bullets (D82)', () => {
    expect(earlierRoles).toEqual([
      { title: 'AI Workflow Engineer', company: 'Tahoma Films', period: 'February 2025' },
      { title: 'Snowboard Coach', company: 'High Cascade Snowboard Camp', period: 'Summers 2023 & 2024' },
    ]);
  });

  it('never retitles the three real job titles (brand.md)', () => {
    const titleOf = (company: string) => [...roles, ...earlierRoles].find((r) => r.company === company)?.title;
    expect(titleOf('MAXX Potential')).toBe('Full-Stack Software Engineer');
    expect(titleOf('Builder Clarity')).toBe('Founding Full-Stack Software Engineer');
    expect(titleOf('Tahoma Films')).toBe('AI Workflow Engineer');
  });

  it('replaces the coursework with the resume list and keeps the honors', () => {
    expect(education.coursework).toEqual(COURSEWORK);
    expect(education.honors).toEqual(['George Scholar', 'Duke True North Leadership Program']);
    expect(education.degree).toBe('B.S. Computer Science, Visual & Media Studies Minor');
    expect(education.period).toBe('Graduated December 2024');
  });
});

describe('bullet links (P2-01, v3 spec § 3)', () => {
  it('are exactly the four links of the § 3 table', () => {
    expect(allLinks.map(({ text, href }) => [text, href])).toEqual([
      ['contractor estimating app', '/projects/paint-estimator'],
      ['agentic bug-fix workflow', '/projects/linear-ai-workflow'],
      ['JobTread ↔ GoHighLevel integration platform', '/projects/ghl-jobtread-integration'],
      ['unified per-job communications log', '/projects/ringcentral-jobtread-integration'],
    ]);
  });

  it('puts every link text in its bullet exactly once', () => {
    for (const { text, bullet } of allLinks) expect(bullet.split(text)).toHaveLength(2);
  });

  it('resolves every internal href to a project and keeps external ones to the public repos', () => {
    const hrefs = [...allLinks.map((l) => l.href), ...resumeProjects.flatMap((p) => [p.href, p.repo])];
    for (const href of hrefs) {
      const slug = href.match(/^\/projects\/([^/#]+)$/)?.[1];
      if (slug) expect(getProjectBySlug(slug)).toBeDefined();
      else expect(PUBLIC_REPOS).toContain(href);
    }
  });

  it('bulletText reads both shapes', () => {
    expect(bulletText('plain')).toBe('plain');
    expect(bulletText({ text: 'a b c', links: [{ text: 'b', href: '/projects/x' }] })).toBe('a b c');
  });
});
