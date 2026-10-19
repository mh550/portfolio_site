import {
  exampleHref,
  getCaseStudyAnchors,
  getProjectBySlug,
  principles,
  projects,
  resolvedExamples,
  type Principle,
} from '@/lib/data';

const ANCHORS = ['diagnose', 'decide', 'build', 'verify', 'simplify', 'decisions', 'iterations', 'lessons'];
const SLUGS = ['agent-harness', 'home-media-server', 'hit-list', 'linear-ai-workflow', 'ghl-jobtread-integration'];

const allExamples = principles.flatMap((p) => p.examples);
const allResolved = principles.flatMap((p) => resolvedExamples(p));

/** Runs `fn` with `slug` taken out of `projects`, then puts it back where it was. */
function withoutProject<T>(slug: string, fn: () => T): T {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) throw new Error(`no project ${slug}`);
  const [removed] = projects.splice(i, 1);
  try {
    return fn();
  } finally {
    projects.splice(i, 0, removed);
  }
}

/** Runs `fn` with `slug`'s caseStudy removed, then restores it. */
function withoutCaseStudy<T>(slug: string, fn: () => T): T {
  const project = getProjectBySlug(slug)!;
  const saved = project.caseStudy;
  project.caseStudy = undefined;
  try {
    return fn();
  } finally {
    project.caseStudy = saved;
  }
}

describe('principles', () => {
  it('has the six principles in order', () => {
    expect(principles.map((p) => [p.id, p.title])).toEqual([
      ['diagnose-first', 'Diagnose before building'],
      ['decisions-explicit', 'Make decisions explicit'],
      ['fakes-mirror-reality', 'Fakes mirror reality'],
      ['verify-what-the-human-sees', 'Verify what the human will see'],
      ['simplify-after-use', 'Simplify after use'],
      ['automate-bookkeeping', 'Automate the bookkeeping, keep judgment human'],
    ]);
  });

  it('gives each principle a summary and 1–3 examples', () => {
    for (const p of principles) {
      expect(p.summary.length).toBeGreaterThan(20);
      expect(p.examples.length).toBeGreaterThanOrEqual(1);
      expect(p.examples.length).toBeLessThanOrEqual(3);
      for (const e of p.examples) expect(e.text.length).toBeGreaterThan(20);
    }
  });

  it('uses only the eight case-study anchors', () => {
    for (const e of allExamples) if (e.anchor) expect(ANCHORS).toContain(e.anchor);
  });

  it('uses only the five planned slugs', () => {
    for (const e of allExamples) if (e.projectSlug) expect(SLUGS).toContain(e.projectSlug);
  });

  it('has exactly one example without a slug (D14, D34), and it has no anchor', () => {
    const unlinked = allExamples.filter((e) => !e.projectSlug);
    expect(unlinked).toHaveLength(1);
    expect(unlinked[0].anchor).toBeUndefined();
    expect(unlinked[0].text).toMatch(/chose not to build/);
  });
});

describe('resolvedExamples', () => {
  it('keeps only slugs that exist, and anchors only where that project renders them', () => {
    for (const e of allResolved) {
      if (!e.projectSlug) continue;
      const project = getProjectBySlug(e.projectSlug);
      expect(project).toBeDefined();
      if (e.anchor) {
        expect(project!.caseStudy).toBeDefined();
        expect(getCaseStudyAnchors(project!)).toContain(e.anchor);
      }
    }
  });

  it('filters nothing on the current data, and every principle keeps an example', () => {
    expect(allResolved).toHaveLength(allExamples.length);
    for (const p of principles) expect(resolvedExamples(p).length).toBeGreaterThanOrEqual(1);
  });

  it('keeps every anchor of the three case studies on the current data', () => {
    expect(allResolved.filter((e) => e.anchor)).toHaveLength(allExamples.filter((e) => e.anchor).length);
  });

  it('drops the examples of a project that is not on the branch', () => {
    withoutProject('hit-list', () => {
      const resolved = principles.flatMap((p) => resolvedExamples(p));
      expect(resolved.some((e) => e.projectSlug === 'hit-list')).toBe(false);
      expect(resolved).toHaveLength(allExamples.length - allExamples.filter((e) => e.projectSlug === 'hit-list').length);
      for (const p of principles) expect(resolvedExamples(p).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('keeps the example but drops the anchor when the project has no caseStudy', () => {
    withoutCaseStudy('agent-harness', () => {
      const resolved = principles.flatMap((p) => resolvedExamples(p)).filter((e) => e.projectSlug === 'agent-harness');
      expect(resolved).toHaveLength(allExamples.filter((e) => e.projectSlug === 'agent-harness').length);
      for (const e of resolved) expect(e.anchor).toBeUndefined();
    });
  });

  it('drops an anchor that the project does not render', () => {
    const p: Principle = {
      ...principles[0],
      examples: [{ projectSlug: 'hit-list', anchor: 'iterations', text: 'An example with an anchor hit-list may lack.' }],
    };
    const cs = getProjectBySlug('hit-list')!.caseStudy!;
    const saved = cs.iterations;
    cs.iterations = undefined;
    try {
      expect(resolvedExamples(p)).toEqual([{ projectSlug: 'hit-list', text: p.examples[0].text }]);
    } finally {
      cs.iterations = saved;
    }
  });

  it('keeps a principle whose only example points at a missing slug, with no examples', () => {
    withoutProject('hit-list', () => {
      const p: Principle = { ...principles[0], examples: [{ projectSlug: 'hit-list', anchor: 'lessons', text: 'Gone.' }] };
      expect(resolvedExamples(p)).toEqual([]);
    });
  });
});

describe('exampleHref', () => {
  it('links to the project, with the anchor as the hash', () => {
    expect(exampleHref({ projectSlug: 'hit-list', anchor: 'lessons', text: 'x' })).toBe('/projects/hit-list#lessons');
    expect(exampleHref({ projectSlug: 'linear-ai-workflow', text: 'x' })).toBe('/projects/linear-ai-workflow');
    expect(exampleHref({ text: 'x' })).toBeUndefined();
  });
});
