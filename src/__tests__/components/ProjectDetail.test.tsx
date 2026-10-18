import { render, screen, within } from '@testing-library/react';
import ProjectDetail from '@/components/projects/ProjectDetail';
import { getProjectBySlug, getCaseStudyAnchors, type Project } from '@/lib/data';
import { fixtureProject } from '../fixtures/case-study-project';

const CASE_STUDY_IDS = ['problem', 'outcome', 'diagnose', 'decide', 'build', 'verify', 'simplify', 'method', 'decisions', 'iterations', 'lessons', 'links'];

const h2Texts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('h2')).map((h) => h.textContent);

/** True when `a` comes before `b` in document order. */
const precedes = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const byText = (container: HTMLElement, text: string) => within(container).getByText(text);

describe('ProjectDetail with a caseStudy', () => {
  const withMedia: Project = {
    ...fixtureProject,
    detail: {
      ...fixtureProject.detail,
      media: [{ type: 'image', src: '/fixture.png', alt: 'Fixture screenshot' }],
    },
  };

  it('renders the h2 headings in the case-study order', () => {
    const { container } = render(<ProjectDetail project={withMedia} />);
    expect(h2Texts(container)).toEqual([
      'The Problem',
      'The Method',
      'Key Decisions',
      'How It Evolved',
      'What Broke',
      'Outcome',
      'In the Code',
      'A Closer Look',
      'Links',
    ]);
  });

  it('does not render detail.approach or detail.challenges (D16)', () => {
    render(<ProjectDetail project={fixtureProject} />);
    expect(screen.queryByRole('heading', { name: 'The Approach' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Challenges' })).toBeNull();
    expect(screen.queryByText(fixtureProject.detail.approach)).toBeNull();
    expect(screen.queryByText(fixtureProject.detail.challenges)).toBeNull();
  });

  it('renders every case-study anchor id', () => {
    const { container } = render(<ProjectDetail project={fixtureProject} />);
    for (const id of CASE_STUDY_IDS) expect(container.querySelector(`#${id}`)).not.toBeNull();
    for (const id of getCaseStudyAnchors(fixtureProject)) expect(container.querySelector(`#${id}`)).not.toBeNull();
  });

  it('renders the header (company, title, role · timeframe) before the metric strip and The Problem', () => {
    const { container } = render(<ProjectDetail project={fixtureProject} />);
    const company = byText(container, 'Fixture Co');
    const title = screen.getByRole('heading', { level: 1, name: 'Fixture Case Study' });
    const roleLine = byText(container, 'Fixture role · Fixture timeframe');
    const metric = byText(container, '3 → 1');
    const problem = screen.getByRole('heading', { level: 2, name: 'The Problem' });
    expect(precedes(company, title)).toBe(true);
    expect(precedes(title, roleLine)).toBe(true);
    expect(precedes(roleLine, metric)).toBe(true);
    expect(precedes(metric, problem)).toBe(true);
  });

  it('puts the architecture diagram after The Problem and before The Method (D17)', () => {
    const { container } = render(<ProjectDetail project={fixtureProject} />);
    const problem = screen.getByRole('heading', { level: 2, name: 'The Problem' });
    const architecture = Array.from(container.querySelectorAll('figure')).find((f) =>
      f.textContent?.includes('waterfall match that prevents duplicates'),
    )!;
    expect(architecture).toBeDefined();
    expect(precedes(problem, architecture)).toBe(true);
    expect(precedes(architecture, container.querySelector('#method')!)).toBe(true);
  });

  it('puts the extra diagrams after #iterations and before #lessons (D17)', () => {
    const { container } = render(<ProjectDetail project={fixtureProject} />);
    const extra = Array.from(container.querySelectorAll('figure')).find((f) =>
      f.textContent?.includes('mirroring from a source calendar'),
    )!;
    expect(extra).toBeDefined();
    expect(precedes(container.querySelector('#iterations')!, extra)).toBe(true);
    expect(precedes(extra, container.querySelector('#lessons')!)).toBe(true);
  });

  it('renders code snippets and media after Outcome, then links, then the builtWith note', () => {
    const { container } = render(<ProjectDetail project={withMedia} />);
    const outcome = screen.getByRole('heading', { level: 2, name: 'Outcome' });
    const snippet = byText(container, 'Fixture snippet');
    const media = screen.getByRole('heading', { level: 2, name: 'A Closer Look' });
    const links = container.querySelector('#links')!;
    const builtWith = byText(container, 'Fixture built-with note.');
    expect(precedes(outcome, snippet)).toBe(true);
    expect(precedes(snippet, media)).toBe(true);
    expect(precedes(media, links)).toBe(true);
    expect(precedes(links, builtWith)).toBe(true);
    expect(byText(container, 'How it was built')).toBeInTheDocument();
  });

  it('omits the builtWith note, iterations and extra diagrams when they are absent', () => {
    const lean: Project = {
      ...fixtureProject,
      caseStudy: { ...fixtureProject.caseStudy!, builtWith: undefined, iterations: undefined, extraDiagrams: undefined },
    };
    const { container } = render(<ProjectDetail project={lean} />);
    expect(screen.queryByText('How it was built')).toBeNull();
    expect(container.querySelector('#iterations')).toBeNull();
    expect(container.textContent).not.toContain('mirroring from a source calendar');
  });

  it('makes The Problem and Outcome labelled sections like the other case-study blocks', () => {
    const { container } = render(<ProjectDetail project={fixtureProject} />);
    for (const [id, name] of [['problem', 'The Problem'], ['outcome', 'Outcome']]) {
      const section = container.querySelector(`section#${id}`)!;
      expect(section).not.toBeNull();
      expect(screen.getByRole('region', { name })).toBe(section);
    }
  });

  it('leaves no empty wrapper behind when decisions, lessons and links are empty', () => {
    const sparse: Project = {
      ...fixtureProject,
      caseStudy: { ...fixtureProject.caseStudy!, decisions: [], lessons: [], links: [] },
    };
    const { container } = render(<ProjectDetail project={sparse} />);
    for (const id of ['decisions', 'lessons', 'links']) expect(container.querySelector(`#${id}`)).toBeNull();
    const body = container.querySelector('#problem')!.closest('.space-y-12')!;
    // problem, architecture diagram, method, iterations, extra diagram, outcome, code, builtWith
    expect(body.children).toHaveLength(8);
    for (const child of Array.from(body.children)) expect(child).not.toBeEmptyDOMElement();
  });

  it('has no GitHub / Live Demo header links: ProjectLinks is the one link list', () => {
    render(
      <ProjectDetail
        project={{ ...fixtureProject, githubUrl: 'https://example.com/gh', demoUrl: 'https://example.com/demo-site' }}
      />,
    );
    expect(screen.queryByRole('link', { name: /GitHub/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Live Demo/ })).toBeNull();
  });
});

describe('ProjectDetail without a caseStudy', () => {
  const ghl = getProjectBySlug('ghl-jobtread-integration')!;

  it('renders the h2 order exactly as before M3', () => {
    const { container } = render(<ProjectDetail project={ghl} />);
    expect(h2Texts(container)).toEqual(['The Problem', 'The Approach', 'Challenges', 'Outcome', 'In the Code']);
  });

  it('renders none of the case-study ids', () => {
    const { container } = render(<ProjectDetail project={ghl} />);
    for (const id of CASE_STUDY_IDS) expect(container.querySelector(`#${id}`)).toBeNull();
  });
});
