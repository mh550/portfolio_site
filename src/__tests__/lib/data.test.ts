import {
  projects,
  getProjectBySlug,
  getProjectsByCategory,
  skillCategories,
  roles,
  education,
} from '@/lib/data';

describe('projects data', () => {
  it('exports an array with 4 projects', () => {
    expect(projects).toHaveLength(4);
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
  it('exports 3 roles', () => {
    expect(roles).toHaveLength(3);
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
