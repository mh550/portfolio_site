import { render, screen, within } from '@testing-library/react';
import { skillCategories } from '@/lib/data';
import SkillsPage, { metadata } from '@/app/skills/page';

describe('SkillsPage', () => {
  it('renders the heading', () => {
    render(<SkillsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tech Stack');
  });

  it('renders the four capability groups as headings', () => {
    render(<SkillsPage />);
    for (const name of ['Process & delivery', 'Systems & architecture', 'Build', 'Operate & verify']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });

  it('renders Process & delivery in the featured panel', () => {
    render(<SkillsPage />);
    const panel = screen.getByRole('heading', { name: 'Process & delivery' }).closest('div.glow-accent');
    expect(panel).not.toBeNull();
    expect(panel).toContainElement(screen.getByText('Differentiator'));
    expect(panel).toContainElement(screen.getByText('Linear'));
    expect(document.querySelectorAll('div.glow-accent')).toHaveLength(1);
  });

  it('renders the other groups outside the featured panel', () => {
    render(<SkillsPage />);
    for (const name of ['Systems & architecture', 'Build', 'Operate & verify']) {
      expect(screen.getByRole('heading', { name }).closest('div.glow-accent')).toBeNull();
    }
  });

  it('spot-checks skills in their groups', () => {
    render(<SkillsPage />);
    const groupOf = (name: string) => screen.getByRole('list', { name });
    expect(within(groupOf('Build')).getByText('TypeScript')).toBeInTheDocument();
    expect(within(groupOf('Systems & architecture')).getByText('Docker')).toBeInTheDocument();
    expect(within(groupOf('Process & delivery')).getByText('Linear')).toBeInTheDocument();
  });

  it('renders each group as a list named by its heading, one item per skill', () => {
    render(<SkillsPage />);
    for (const cat of skillCategories) {
      const items = within(screen.getByRole('list', { name: cat.name })).getAllByRole('listitem');
      expect(items.map((li) => li.textContent)).toEqual(cat.skills);
    }
  });

  it('describes the page by capability, in the agentic-systems angle (P1-06)', () => {
    expect(metadata.description).toBe(
      'The tools and practices behind the agentic systems, integrations and apps I build, grouped by capability.',
    );
    render(<SkillsPage />);
    expect(screen.getByText('Grouped by what I do, with the tools I use for each.')).toBeInTheDocument();
  });
});
