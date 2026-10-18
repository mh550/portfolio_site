import { getCaseStudyAnchors, getProjectBySlug, type Project } from '@/lib/data';
import { fixtureProject } from '../fixtures/case-study-project';

const METHOD_IDS = ['diagnose', 'decide', 'build', 'verify', 'simplify', 'method'];

describe('getCaseStudyAnchors', () => {
  it('returns [] for a project without a caseStudy', () => {
    expect(getCaseStudyAnchors(getProjectBySlug('ghl-jobtread-integration')!)).toEqual([]);
  });

  it('returns every anchor for a full case study, method steps first', () => {
    expect(getCaseStudyAnchors(fixtureProject)).toEqual([...METHOD_IDS, 'decisions', 'iterations', 'lessons', 'links']);
  });

  it('leaves out the sections whose data is empty', () => {
    const empty: Project = {
      ...fixtureProject,
      caseStudy: { ...fixtureProject.caseStudy!, decisions: [], iterations: undefined, lessons: [], links: [] },
    };
    expect(getCaseStudyAnchors(empty)).toEqual(METHOD_IDS);
  });
});
