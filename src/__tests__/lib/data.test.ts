import { readFileSync } from 'fs';
import { join } from 'path';
import {
  projects,
  sortByOrder,
  getProjectBySlug,
  getProjectsByCategory,
  getTopProjects,
  skillCategories,
  roles,
  education,
} from '@/lib/data';

describe('projects data', () => {
  it('exports an array with 9 projects', () => {
    expect(projects).toHaveLength(10);
  });

  it('each project has required fields', () => {
    for (const p of projects) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.shortDescription).toBeTruthy();
      expect(p.categories.length).toBeGreaterThan(0);
      expect(p.techStack.length).toBeGreaterThan(0);
      expect(p.detail.problem).toBeTruthy();
      expect(p.detail.approach).toBeTruthy();
      expect(p.detail.outcome).toBeTruthy();
    }
  });

  it('getProjectBySlug returns correct project', () => {
    const p = getProjectBySlug('ghl-jobtread-integration');
    expect(p?.title).toBe('GoHighLevel ↔ JobTread Integration');
  });

  it('getProjectBySlug returns undefined for unknown slug', () => {
    expect(getProjectBySlug('nonexistent')).toBeUndefined();
  });

  it('getProjectsByCategory returns only matching projects', () => {
    const integrationProjects = getProjectsByCategory('integration');
    expect(integrationProjects.length).toBeGreaterThan(0);
    for (const p of integrationProjects) {
      expect(p.categories).toContain('integration');
    }
  });

  it('slugs are unique', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('carries the D12 order on every project', () => {
    const orders = Object.fromEntries(projects.map((p) => [p.slug, p.order]));
    expect(orders).toEqual({
      'agent-harness': 1,
      'linear-ai-workflow': 2,
      'home-media-server': 3,
      'hit-list': 4,
      'voice-concierge': 5,
      'ghl-jobtread-integration': 6,
      'paint-estimator': 7,
      'ringcentral-jobtread-integration': 8,
      'mirrored-google-calendars': 9,
      cherished: 10,
    });
  });

  it('order values are unique', () => {
    const orders = projects.map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('cherished and mirrored-google-calendars are not featured (D12, D25)', () => {
    expect(getProjectBySlug('cherished')?.featured).toBe(false);
    expect(getProjectBySlug('mirrored-google-calendars')?.featured).toBe(false);
  });
});

describe('getTopProjects', () => {
  it('returns the first n featured projects by order', () => {
    expect(getTopProjects(3).map((p) => p.slug)).toEqual(['agent-harness', 'linear-ai-workflow', 'home-media-server']);
  });

  it('returns every featured project, sorted by order, when n exceeds the count', () => {
    const slugs = getTopProjects(10).map((p) => p.slug);
    expect(slugs).toEqual([
      'agent-harness',
      'linear-ai-workflow',
      'home-media-server',
      'hit-list',
      'voice-concierge',
      'ghl-jobtread-integration',
      'paint-estimator',
      'ringcentral-jobtread-integration',
    ]);
    expect(slugs).not.toContain('cherished');
  });

  it('returns an empty list for n <= 0 and does not reorder projects', () => {
    const before = projects.map((p) => p.slug);
    expect(getTopProjects(0)).toEqual([]);
    expect(getTopProjects(-1)).toEqual([]);
    expect(projects.map((p) => p.slug)).toEqual(before);
  });
});

describe('skills data', () => {
  // The 39 skill strings listed before M2 (hard-coded so a regroup can never drop one).
  const PRE_M2_SKILLS = [
    'Pipedream', 'n8n', 'Zapier', 'Multi-tenant architecture', 'RESTful APIs', 'OAuth 2.0', 'Webhooks',
    'TypeScript', 'JavaScript', 'Python', 'PowerShell', 'Java', 'C/C++', 'Ruby', 'R',
    'React', 'React Native', 'Next.js', 'Tailwind CSS', 'Framer Motion',
    'Node.js', 'Flask', 'Ruby on Rails', 'PostgreSQL', 'Supabase Edge Functions', 'ETL pipelines', 'MongoDB',
    'Supabase', 'Vercel', 'Git', 'Linear', 'Linux CLI', 'WSL', 'Claude Code',
    'AGILE/Scrum', 'Agentic AI', 'User-driven design', 'AI-assisted development', 'Test-driven development',
  ];
  // Added in M2 (sources: docs/plans/2026-10-18-M2-positioning.md § Skills).
  const NEW_SKILLS = [
    'Requirements', 'Specs and decision ledgers', 'Project management', 'Team onboarding',
    'Self-hosted infrastructure', 'Docker', 'Agent orchestration', 'Expo', 'SQLite',
    'GitHub Actions', 'restic', 'Private networking',
  ];
  const allSkills = () => skillCategories.flatMap((c) => c.skills);

  it('exports the four capability groups in order', () => {
    expect(skillCategories.map((c) => c.id)).toEqual(['process', 'systems', 'build', 'operate']);
    expect(skillCategories.map((c) => c.name)).toEqual([
      'Process & delivery',
      'Systems & architecture',
      'Build',
      'Operate & verify',
    ]);
  });

  it('Process & delivery is the only featured group (D20)', () => {
    const featured = skillCategories.filter((c) => c.featured);
    expect(featured.map((c) => c.id)).toEqual(['process']);
  });

  it('each category has at least 4 skills', () => {
    for (const cat of skillCategories) {
      expect(cat.skills.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('keeps all 39 pre-M2 skills', () => {
    expect(PRE_M2_SKILLS).toHaveLength(39);
    const missing = PRE_M2_SKILLS.filter((s) => !allSkills().includes(s));
    expect(missing).toEqual([]);
  });

  it('adds the new evidence-backed skills', () => {
    const missing = NEW_SKILLS.filter((s) => !allSkills().includes(s));
    expect(missing).toEqual([]);
  });

  it('lists no skill twice', () => {
    expect(new Set(allSkills()).size).toBe(allSkills().length);
  });
});

describe('experience data', () => {
  it('exports 4 roles', () => {
    expect(roles).toHaveLength(4);
  });

  it('all roles have required fields', () => {
    for (const r of roles) {
      expect(r.title).toBeTruthy();
      expect(r.company).toBeTruthy();
      expect(r.period).toBeTruthy();
      expect(r.bullets.length).toBeGreaterThan(0);
      expect(['work', 'education']).toContain(r.type);
    }
  });

  it('exports education with required fields', () => {
    expect(education.degree).toBeTruthy();
    expect(education.institution).toBe('Duke University');
    expect('gpa' in education).toBe(false);
    expect(education.coursework.length).toBeGreaterThan(0);
  });

  it('uses the committed "4+ sources" figure, never "7+" (brand.md metrics bank)', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/data/experience.ts'), 'utf8');
    expect(source).not.toContain('7+');
    expect(source).toContain('4+ sources');
  });
});

describe('sortByOrder (M8-02)', () => {
  it('returns a copy sorted by order and leaves the data untouched', () => {
    const before = projects.map((p) => p.slug);
    const sorted = sortByOrder();
    expect(sorted.map((p) => p.order)).toEqual(projects.map((p) => p.order).sort((a, b) => a - b));
    expect(sorted).not.toBe(projects);
    expect(projects.map((p) => p.slug)).toEqual(before);
  });
});
