import { render, screen } from '@testing-library/react';
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
});
