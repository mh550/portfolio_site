import { render, screen } from '@testing-library/react';
import ProjectsPage, { metadata } from '@/app/projects/page';

describe('ProjectsPage', () => {
  it('renders the h1', () => {
    render(<ProjectsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
  });

  it('describes the page in the agentic-systems angle (P1-06)', () => {
    expect(metadata.description).toBe('Agentic systems, integrations, full-stack apps and automation.');
  });
});
