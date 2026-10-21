import { render, screen, within } from '@testing-library/react';
import { clusters, nodes } from '@/lib/data';
import SkillsPage, { metadata } from '@/app/skills/page';

// Until P5-03 draws the graph, /skills lists the graph's data (P5-02)
describe('SkillsPage', () => {
  it('renders the heading', () => {
    render(<SkillsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tech Stack');
  });

  it('renders the six clusters as headings, in order', () => {
    render(<SkillsPage />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(clusters.map((c) => c.name));
  });

  it('lists every node under its cluster, in drawing order', () => {
    render(<SkillsPage />);
    for (const c of clusters) {
      const items = within(screen.getByRole('list', { name: c.name })).getAllByRole('listitem');
      expect(items.map((li) => li.textContent)).toEqual(nodes.filter((n) => n.cluster === c.id).map((n) => n.name));
    }
  });

  it('has no featured Differentiator block (D98)', () => {
    render(<SkillsPage />);
    expect(screen.queryByText('Differentiator')).toBeNull();
    expect(document.querySelector('.glow-accent')).toBeNull();
  });

  it('keeps the agentic-systems description (P1-06)', () => {
    expect(metadata.description).toMatch(/agentic systems/);
  });
});
