import { render, screen, within } from '@testing-library/react';
import EvidencePage, { metadata } from '@/app/evidence/page';
import { competencies, evidenceIntro, projects } from '@/lib/data';

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

describe('EvidencePage', () => {
  it('has the title and is noindex', () => {
    expect(metadata.title).toBe('Evidence of practice — Michael Herron');
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it('renders the h1, the reading note and the D7 note', () => {
    render(<EvidencePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Evidence of practice — Michael Herron');
    expect(screen.getByText(evidenceIntro.reading)).toBeInTheDocument();
    expect(screen.getByText(evidenceIntro.mapping)).toBeInTheDocument();
    expect(evidenceIntro.mapping).toMatch(/general competencies/);
    expect(evidenceIntro.mapping).toMatch(/level-4 rubric/);
  });

  it('renders the six competencies as h2s, in order', () => {
    render(<EvidencePage />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
      competencies.map((c) => c.title),
    );
  });

  it('renders every item as a link with its context label', () => {
    render(<EvidencePage />);
    for (const c of competencies) {
      const section = screen.getByRole('region', { name: c.title });
      const items = within(section).getAllByRole('listitem');
      expect(items).toHaveLength(c.items.length);
      c.items.forEach((item, i) => {
        const link = within(items[i]).getByRole('link', { name: new RegExp(escapeRegExp(item.text)) });
        expect(link).toHaveAttribute('href', item.href);
        expect(within(items[i]).getByText(item.context)).toBeInTheDocument();
      });
    }
  });

  it('opens repo links in a new tab, safely, and says so', () => {
    render(<EvidencePage />);
    const external = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('https://'));
    expect(external.length).toBeGreaterThan(0);
    for (const a of external) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a).toHaveAccessibleName(/opens in a new tab/);
    }
    for (const a of screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/'))) {
      expect(a).not.toHaveAttribute('target');
    }
  });

  it('drops the items of a missing project and still renders six sections', () => {
    withoutProject('hit-list', () => {
      render(<EvidencePage />);
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
      const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
      expect(hrefs.some((h) => h?.startsWith('/projects/hit-list'))).toBe(false);
    });
  });

  it('renders no empty list when every item of a competency drops out', () => {
    // Every "Use AI with guardrails" item links linear-ai-workflow or agent-harness.
    withoutProject('linear-ai-workflow', () =>
      withoutProject('agent-harness', () => {
        render(<EvidencePage />);
        const section = screen.getByRole('region', { name: 'Use AI with guardrails' });
        expect(within(section).queryByRole('list')).toBeNull();
        expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
      }),
    );
  });

  it('never links to itself', () => {
    render(<EvidencePage />);
    for (const a of screen.getAllByRole('link')) expect(a.getAttribute('href')).not.toMatch(/^\/evidence/);
  });
});

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
