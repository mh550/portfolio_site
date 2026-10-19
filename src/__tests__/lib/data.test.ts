import {
  projects,
  getProjectBySlug,
  getProjectsByCategory,
  getTopProjects,
  skillCategories,
  roles,
  education,
} from '@/lib/data';

describe('projects data', () => {
  it('exports an array with 7 projects', () => {
    expect(projects).toHaveLength(8);
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
      'ghl-jobtread-integration': 5,
      'paint-estimator': 6,
      'ringcentral-jobtread-integration': 7,
      'mirrored-google-calendars': 8,
      cherished: 9,
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
    const expected = getProjectBySlug('agent-harness')
      ? ['agent-harness', 'linear-ai-workflow', 'home-media-server']
      : ['linear-ai-workflow', 'home-media-server', 'ghl-jobtread-integration'];
    expect(getTopProjects(3).map((p) => p.slug)).toEqual(expected);
  });

  it('returns every featured project, sorted by order, when n exceeds the count', () => {
    const slugs = getTopProjects(10).map((p) => p.slug);
    expect(slugs).toEqual([
      'agent-harness',
      'linear-ai-workflow',
      'home-media-server',
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
  it('exports 6 skill categories', () => {
    expect(skillCategories).toHaveLength(6);
  });

  it('Integration & Automation is marked as featured', () => {
    const integration = skillCategories.find((c) => c.id === 'integration');
    expect(integration?.featured).toBe(true);
  });

  it('each category has at least 3 skills', () => {
    for (const cat of skillCategories) {
      expect(cat.skills.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('only one category is featured', () => {
    const featured = skillCategories.filter((c) => c.featured);
    expect(featured).toHaveLength(1);
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
    expect(education.gpa).toBeTruthy();
    expect(education.coursework.length).toBeGreaterThan(0);
  });
});
