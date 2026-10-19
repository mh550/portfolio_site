import { render, screen, within } from '@testing-library/react';
import ApproachPage, { metadata } from '@/app/approach/page';
import { approachIntro, getCaseStudyAnchors, getProjectBySlug, methodSteps, principles, projects } from '@/lib/data';

function projectLinks() {
  return screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('/projects'));
}

function withoutProject(slug: string, fn: () => void) {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) throw new Error(`no project ${slug}`);
  const [removed] = projects.splice(i, 1);
  try {
    fn();
  } finally {
    projects.splice(i, 0, removed);
  }
}

describe('ApproachPage', () => {
  it('has the title', () => {
    expect(metadata.title).toBe('Approach — Michael Herron');
  });

  it('renders the h1 and the two-sentence intro', () => {
    render(<ApproachPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How I work');
    expect(approachIntro).toHaveLength(2);
    for (const sentence of approachIntro) expect(screen.getByText(sentence)).toBeInTheDocument();
  });

  it('shows the five method labels and their lines, visible at every width', () => {
    render(<ApproachPage />);
    const strip = screen.getByRole('list', { name: 'How I work' });
    for (const step of methodSteps) {
      expect(within(strip).getByText(step.label)).toBeInTheDocument();
      const line = within(strip).getByText(step.line);
      expect(line.closest('.sr-only')).toBeNull();
    }
  });

  it('renders the six principles as h2s in order, each with its summary', () => {
    render(<ApproachPage />);
    const h2s = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual(principles.map((p) => p.title));
    for (const p of principles) expect(screen.getByText(p.summary)).toBeInTheDocument();
  });

  it('renders every example text, and the D14 example without a link', () => {
    render(<ApproachPage />);
    for (const e of principles.flatMap((p) => p.examples)) expect(screen.getByText(e.text)).toBeInTheDocument();
    const d14 = screen.getByText(/chose not to build/);
    expect(d14.closest('li')!.querySelector('a')).toBeNull();
  });

  it('links every example to a project that exists, and every hash to an anchor that project renders', () => {
    render(<ApproachPage />);
    const links = projectLinks().filter((a) => a.getAttribute('href') !== '/projects');
    expect(links.length).toBeGreaterThanOrEqual(17);
    for (const a of links) {
      const [path, hash] = a.getAttribute('href')!.split('#');
      const slug = path.replace('/projects/', '');
      const project = getProjectBySlug(slug);
      expect(project).toBeDefined();
      if (hash) expect(getCaseStudyAnchors(project!)).toContain(hash);
    }
  });

  it('names each example link after its project and section', () => {
    render(<ApproachPage />);
    expect(screen.getAllByRole('link', { name: `${getProjectBySlug('hit-list')!.title}: What Broke` })[0]).toHaveAttribute(
      'href',
      '/projects/hit-list#lessons',
    );
    expect(screen.getAllByRole('link', { name: `${getProjectBySlug('agent-harness')!.title}: Diagnose` })[0]).toHaveAttribute(
      'href',
      '/projects/agent-harness#diagnose',
    );
    expect(
      screen.getAllByRole('link', { name: `${getProjectBySlug('linear-ai-workflow')!.title}: Project page` })[0],
    ).toHaveAttribute('href', '/projects/linear-ai-workflow');
  });

  it('gives links that share a name the same href', () => {
    render(<ApproachPage />);
    const byName = new Map<string, Set<string>>();
    for (const a of screen.getAllByRole('link')) {
      const name = a.textContent!;
      byName.set(name, (byName.get(name) ?? new Set()).add(a.getAttribute('href')!));
    }
    for (const hrefs of byName.values()) expect(hrefs.size).toBe(1);
  });

  it('closes with a link to the agent harness case study', () => {
    render(<ApproachPage />);
    expect(screen.getByRole('link', { name: 'Read the agent harness case study' })).toHaveAttribute(
      'href',
      '/projects/agent-harness',
    );
  });

  it('without agent-harness, closes with /projects and never links to it', () => {
    withoutProject('agent-harness', () => {
      render(<ApproachPage />);
      expect(screen.getByRole('link', { name: 'See the projects' })).toHaveAttribute('href', '/projects');
      expect(screen.queryByRole('link', { name: 'Read the agent harness case study' })).toBeNull();
      for (const a of projectLinks()) expect(a.getAttribute('href')).not.toMatch(/agent-harness/);
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    });
  });

  it('renders a principle whose examples all filter out with its h2 and summary and no empty list', () => {
    const saved = principles[2].examples;
    principles[2].examples = [{ projectSlug: 'hit-list', anchor: 'lessons', text: 'Only hit-list.' }];
    try {
      withoutProject('hit-list', () => {
        render(<ApproachPage />);
        const section = screen.getByRole('heading', { level: 2, name: principles[2].title }).closest('section')!;
        expect(within(section).getByText(principles[2].summary)).toBeInTheDocument();
        expect(section.querySelector('ul')).toBeNull();
        expect(screen.queryByText('Only hit-list.')).toBeNull();
      });
    } finally {
      principles[2].examples = saved;
    }
  });

  it('gives every example link a visible accent focus outline', () => {
    render(<ApproachPage />);
    for (const a of screen.getAllByRole('link')) {
      expect(a).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-[var(--color-accent)]');
    }
  });

  it('without hit-list, renders no hit-list link and keeps every principle', () => {
    withoutProject('hit-list', () => {
      render(<ApproachPage />);
      for (const a of projectLinks()) expect(a.getAttribute('href')).not.toMatch(/hit-list/);
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    });
  });
});
