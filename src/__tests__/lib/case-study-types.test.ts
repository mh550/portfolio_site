/** @jest-environment node */
// Type-level test for the case-study shape (M3-02). Jest runs through next/jest (SWC), which strips types
// without checking them: `tsc --noEmit` and `next build` check this file, including the @ts-expect-error lines.
import {
  getProjectsByCategory,
  projects,
  type CaseStudy,
  type Decision,
  type Iteration,
  type Lesson,
  type Project,
  type ProjectCategory,
  type ProjectLink,
} from '@/lib/data';
import { fixtureProject } from '../fixtures/case-study-project';

const minimalProject: Project = {
  slug: 'no-case-study',
  title: 'No Case Study',
  company: 'Fixture Co',
  shortDescription: 'A project without a case study.',
  categories: ['integration'],
  techStack: [],
  featured: false,
  order: 100,
  detail: { problem: 'P.', approach: 'A.', challenges: 'C.', outcome: 'O.' },
};

// Each line must fail to type-check; tsc reports an unused @ts-expect-error if the types get looser.
// @ts-expect-error kind is one of repo | live | doc | demo
const badLink: ProjectLink = { label: 'Bad', href: '/x', kind: 'video' };
// @ts-expect-error because is required
const badDecision: Decision = { id: 'D', title: 'T', chose: 'c' };
// @ts-expect-error why is required
const badIteration: Iteration = { when: 'w', label: 'l', what: 'w' };
// @ts-expect-error rule is required
const badLesson: Lesson = { broke: 'b' };
// @ts-expect-error all five method steps are required
const badMethod: CaseStudy['method'] = { diagnose: 'd', decide: 'd', build: 'b', verify: 'v' };
// @ts-expect-error extraDiagrams holds DiagramKeys
const badDiagrams: CaseStudy['extraDiagrams'] = ['not-a-diagram'];
// @ts-expect-error not a category
const badCategory: ProjectCategory = 'devops';

describe('case-study types', () => {
  it('a project with a full caseStudy type-checks', () => {
    const cs: CaseStudy | undefined = fixtureProject.caseStudy;
    expect(cs?.decisions).toHaveLength(2);
    expect(cs?.iterations).toHaveLength(2);
    expect(cs?.lessons).toHaveLength(2);
    expect(cs?.links.map((l) => l.kind)).toEqual(['repo', 'live', 'doc', 'demo', 'doc']);
    expect(cs?.extraDiagrams).toEqual(['calendar-sync']);
    expect(fixtureProject.categories).toEqual(['systems', 'process']);
  });

  it('a project without a caseStudy type-checks', () => {
    expect(minimalProject.caseStudy).toBeUndefined();
  });

  it('the @ts-expect-error literals exist at runtime (they only matter to tsc)', () => {
    expect([badLink, badDecision, badIteration, badLesson, badMethod, badDiagrams, badCategory]).toHaveLength(7);
  });

  it('no current project is in systems or process yet', () => {
    expect(getProjectsByCategory('systems')).toEqual([]);
    expect(getProjectsByCategory('process')).toEqual([]);
  });

  it('the fixture is not in projects', () => {
    expect(projects.map((p) => p.slug)).not.toContain(fixtureProject.slug);
  });
});
