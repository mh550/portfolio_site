import { render, screen } from '@testing-library/react';
import SkillsPage from '@/app/skills/page';

describe('SkillsPage', () => {
  it('renders the heading', () => {
    render(<SkillsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tech Stack');
  });

  it('renders Integration & Automation as featured', () => {
    render(<SkillsPage />);
    expect(screen.getByText('Integration & Automation')).toBeInTheDocument();
    expect(screen.getByText('Differentiator')).toBeInTheDocument();
  });

  it('renders all skill categories', () => {
    render(<SkillsPage />);
    const categories = ['Languages', 'Frontend', 'Backend', 'Tools & Platforms', 'Practices'];
    for (const cat of categories) {
      expect(screen.getByRole('heading', { name: cat })).toBeInTheDocument();
    }
  });

  it('renders integration skills', () => {
    render(<SkillsPage />);
    expect(screen.getByText('Pipedream')).toBeInTheDocument();
    expect(screen.getByText('n8n')).toBeInTheDocument();
    expect(screen.getByText('OAuth')).toBeInTheDocument();
  });

  it('renders language skills', () => {
    render(<SkillsPage />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
