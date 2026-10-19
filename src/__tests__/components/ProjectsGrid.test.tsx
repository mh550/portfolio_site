import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import { projects } from '@/lib/data';

describe('ProjectsGrid', () => {
  it('renders all projects by default', () => {
    render(<ProjectsGrid />);
    for (const p of projects) {
      expect(screen.getByText(p.title)).toBeInTheDocument();
    }
  });

  it('renders filter buttons', () => {
    render(<ProjectsGrid />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Integration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full-Stack' })).toBeInTheDocument();
  });

  it('offers six filters in order, Systems and Process after AI', () => {
    render(<ProjectsGrid />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'All',
      'Integration',
      'Full-Stack',
      'AI',
      'Systems',
      'Process',
    ]);
  });

  it('filtering by Systems shows only the agent-harness and home-media-server cards', async () => {
    const user = userEvent.setup();
    render(<ProjectsGrid />);
    await user.click(screen.getByRole('button', { name: 'Systems' }));
    expect(screen.getByRole('button', { name: 'Systems' })).toHaveAttribute('aria-pressed', 'true');
    for (const p of projects) {
      if (['agent-harness', 'home-media-server'].includes(p.slug)) expect(screen.getByText(p.title)).toBeInTheDocument();
      else expect(screen.queryByText(p.title)).not.toBeInTheDocument();
    }
    expect(screen.queryByText('No projects in this category yet.')).not.toBeInTheDocument();
  });

  it('filtering by Process shows only the agent-harness and hit-list cards', async () => {
    const user = userEvent.setup();
    render(<ProjectsGrid />);
    await user.click(screen.getByRole('button', { name: 'Process' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    for (const p of projects) {
      if (['agent-harness', 'hit-list'].includes(p.slug)) expect(screen.getByText(p.title)).toBeInTheDocument();
      else expect(screen.queryByText(p.title)).not.toBeInTheDocument();
    }
  });

  it('filtering by Full-Stack includes the hit-list card', async () => {
    const user = userEvent.setup();
    render(<ProjectsGrid />);
    await user.click(screen.getByRole('button', { name: 'Full-Stack' }));
    expect(screen.getByText('HitList: offline-first street-spot scouting app')).toBeInTheDocument();
  });

  it('All filter is active by default', () => {
    render(<ProjectsGrid />);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filtering by Integration shows only integration projects', async () => {
    const user = userEvent.setup();
    render(<ProjectsGrid />);
    await user.click(screen.getByRole('button', { name: 'Integration' }));

    const integrationProjects = projects.filter((p) => p.categories.includes('integration'));
    const nonIntegrationProjects = projects.filter((p) => !p.categories.includes('integration'));

    for (const p of integrationProjects) {
      expect(screen.getByText(p.title)).toBeInTheDocument();
    }
    for (const p of nonIntegrationProjects) {
      expect(screen.queryByText(p.title)).not.toBeInTheDocument();
    }
  });

  it('clicking All after filtering shows all projects', async () => {
    const user = userEvent.setup();
    render(<ProjectsGrid />);
    await user.click(screen.getByRole('button', { name: 'Integration' }));
    await user.click(screen.getByRole('button', { name: 'All' }));
    for (const p of projects) {
      expect(screen.getByText(p.title)).toBeInTheDocument();
    }
  });

  it('renders the cards sorted by order, lowest first (M8)', () => {
    render(<ProjectsGrid />);
    const rendered = screen.getAllByRole('article').map((a) => within(a).getByRole('heading').textContent);
    const expected = [...projects].sort((a, b) => a.order - b.order).map((p) => p.title);
    expect(rendered).toEqual(expected);
  });

  it('shows the first metric value in the preview band of each case study without a thumbnail', () => {
    render(<ProjectsGrid />);
    const caseStudies = projects.filter((p) => p.caseStudy && !p.thumbnail);
    expect(caseStudies.length).toBeGreaterThan(0);
    for (const p of caseStudies) {
      const card = screen.getAllByRole('article').find((a) => within(a).queryByRole('heading', { name: p.title }));
      expect(card).toBeDefined();
      const metric = p.metrics?.[0];
      expect(metric).toBeDefined();
      expect(within(card!).getAllByText(metric!.value).length).toBeGreaterThan(0);
    }
  });
});
