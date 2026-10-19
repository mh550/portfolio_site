import { render, screen } from '@testing-library/react';
import ProjectsGrid from '@/components/projects/ProjectsGrid';

// Every filter matches a project on the real data (M4), so the empty state is checked against an empty list.
jest.mock('@/lib/data', () => ({ ...jest.requireActual<typeof import('@/lib/data')>('@/lib/data'), projects: [] }));

describe('ProjectsGrid with no projects', () => {
  it('shows the empty state', () => {
    render(<ProjectsGrid />);
    expect(screen.getByText('No projects in this category yet.')).toBeInTheDocument();
  });
});
