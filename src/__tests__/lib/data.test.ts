import { readFileSync } from 'fs';
import { join } from 'path';
import {
  projects,
  sortByOrder,
  getProjectBySlug,
  getProjectsByCategory,
  getTopProjects,
  clusters,
  nodes,
  edges,
  roles,
  education,
} from '@/lib/data';

describe('projects data', () => {
  it('exports an array with 10 projects', () => {
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

  it('carries the D59 order on every project', () => {
    const orders = Object.fromEntries(projects.map((p) => [p.slug, p.order]));
    expect(orders).toEqual({
      'agent-harness': 1,
      'voice-concierge': 2,
      'ghl-jobtread-integration': 3,
      'ringcentral-jobtread-integration': 4,
      'home-media-server': 5,
      'linear-ai-workflow': 6,
      'hit-list': 7,
      'paint-estimator': 8,
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
    expect(getTopProjects(3).map((p) => p.slug)).toEqual(['agent-harness', 'voice-concierge', 'ghl-jobtread-integration']);
  });

  it('returns every featured project, sorted by order, when n exceeds the count', () => {
    const slugs = getTopProjects(10).map((p) => p.slug);
    expect(slugs).toEqual([
      'agent-harness',
      'voice-concierge',
      'ghl-jobtread-integration',
      'ringcentral-jobtread-integration',
      'home-media-server',
      'linear-ai-workflow',
      'hit-list',
      'paint-estimator',
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

// skillCategories and D20's featured group went with the graph (D98); skills-data.test.ts checks the graph
describe('skills data', () => {
  it('exports the graph through the barrel', () => {
    expect(clusters).toHaveLength(6);
    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });
});

describe('experience data', () => {
  it('exports the 2 resume roles (P2-01; the other two are earlierRoles, D82)', () => {
    expect(roles).toHaveLength(2);
  });

  it('all roles have required fields', () => {
    for (const r of roles) {
      expect(r.title).toBeTruthy();
      expect(r.company).toBeTruthy();
      expect(r.period).toBeTruthy();
      expect(r.bullets.length).toBeGreaterThan(0);
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
