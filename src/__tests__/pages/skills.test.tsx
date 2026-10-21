import { fireEvent, render, screen, within } from '@testing-library/react';
import { clusters, nodes } from '@/lib/data';
import SkillsPage, { metadata } from '@/app/skills/page';

// /skills draws the graph (P5-03); the list view under the toggle is its text alternative and print view (D101)
describe('SkillsPage', () => {
  it('renders the heading', () => {
    render(<SkillsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tech Stack');
  });

  it('renders the graph, one group per cluster', () => {
    render(<SkillsPage />);
    const graph = screen.getByRole('group', { name: /^Tech stack:/ });
    for (const c of clusters) expect(within(graph).getByRole('group', { name: c.name })).toBeInTheDocument();
    expect(within(graph).getAllByRole('link')).toHaveLength(nodes.length);
  });

  it('has every node name in the list view, under its cluster <h2>, in order', () => {
    render(<SkillsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    const list = document.getElementById('skill-list')!;
    expect(within(list).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
      clusters.map((c) => c.name),
    );
    for (const n of nodes) {
      const dt = document.getElementById(`skill-${n.id}`)!;
      expect(dt.tagName).toBe('DT');
      expect(dt).toHaveTextContent(n.name);
      expect(list).toContainElement(dt);
    }
  });

  it('links a row to the projects that used it, by their short titles', () => {
    render(<SkillsPage />);
    const dd = document.getElementById('skill-harness-engineering')!.nextElementSibling as HTMLElement;
    expect(within(dd).getByRole('link', { name: 'Agent Harness' })).toHaveAttribute('href', '/projects/agent-harness');
  });

  it('prints the list, not the graph', () => {
    render(<SkillsPage />);
    expect(document.getElementById('skill-list')).toHaveClass('print:block');
    expect(screen.getByRole('group', { name: /^Tech stack:/ })).toHaveClass('print:hidden');
  });

  it('has no featured Differentiator block (D98)', () => {
    render(<SkillsPage />);
    expect(screen.queryByText('Differentiator')).toBeNull();
    expect(document.querySelector('.glow-accent')).toBeNull();
  });

  it('describes the stack as a graph, in the agentic-systems angle (P1-06)', () => {
    expect(metadata.description).toMatch(/agentic systems/);
    expect(metadata.description).toMatch(/as a graph/);
  });
});
