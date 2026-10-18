import { projects, type Project } from '@/lib/data';
import { fixtureProject } from '../fixtures/case-study-project';

// Guards for M4–M6 data authors: rules the case-study template relies on but the types can't express.
const caseStudies = (list: Project[]) => list.filter((p) => p.caseStudy);

// A site path, an https URL, a same-page anchor or mailto: — the shapes ProjectLinks knows how to render.
const LINK_HREF = /^(\/(?![/\\])|https:\/\/|#|mailto:)/;

function problems(project: Project): string[] {
  const cs = project.caseStudy!;
  const hrefs = cs.links.map((l) => l.href);
  const out: string[] = [];
  // A case study drops the header GitHub / Live Demo links (D16): they must move into caseStudy.links.
  for (const url of [project.githubUrl, project.demoUrl]) {
    if (url && !hrefs.includes(url)) out.push(`${url} is not in caseStudy.links`);
  }
  for (const href of hrefs) if (!LINK_HREF.test(href)) out.push(`unsupported link href ${href}`);
  const ids = cs.decisions.map((d) => d.id);
  if (new Set(ids).size !== ids.length) out.push(`duplicate decision id in ${ids.join(', ')}`);
  return out;
}

describe('case-study data', () => {
  it('every project with a caseStudy follows the template rules', () => {
    const report = caseStudies(projects).flatMap((p) => problems(p).map((msg) => `${p.slug}: ${msg}`));
    expect(report).toEqual([]);
  });

  it('accepts the fixture and catches a header link missing from caseStudy.links', () => {
    expect(problems(fixtureProject)).toEqual([]);
    expect(problems({ ...fixtureProject, githubUrl: 'https://example.com/missing' })).toEqual([
      'https://example.com/missing is not in caseStudy.links',
    ]);
  });

  it('catches an unsupported href and a duplicate decision id', () => {
    const cs = fixtureProject.caseStudy!;
    const bad: Project = {
      ...fixtureProject,
      caseStudy: {
        ...cs,
        links: [{ label: 'Insecure', href: 'http://example.com', kind: 'doc' }],
        decisions: [cs.decisions[0], cs.decisions[0]],
      },
    };
    expect(problems(bad)).toEqual(['unsupported link href http://example.com', `duplicate decision id in F1, F1`]);
  });
});
