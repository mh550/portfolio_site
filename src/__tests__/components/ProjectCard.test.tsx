import { render, screen } from '@testing-library/react';
import ProjectCard from '@/components/projects/ProjectCard';
import { projects } from '@/lib/data';

const ghl = projects.find((p) => p.slug === 'ghl-jobtread-integration')!;
const withLinks = { ...ghl, githubUrl: 'https://github.com/test', demoUrl: 'https://demo.example.com' };

describe('ProjectCard', () => {
  it('renders project title', () => {
    render(<ProjectCard project={ghl} />);
    expect(screen.getByText(ghl.title)).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<ProjectCard project={ghl} />);
    expect(screen.getByText(ghl.company)).toBeInTheDocument();
  });

  it('renders short description', () => {
    render(<ProjectCard project={ghl} />);
    expect(screen.getByText(ghl.shortDescription)).toBeInTheDocument();
  });

  it('renders tech stack tags', () => {
    render(<ProjectCard project={ghl} />);
    for (const tech of ghl.techStack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it('renders deep dive link with correct href', () => {
    render(<ProjectCard project={ghl} />);
    const link = screen.getByRole('link', { name: /deep dive/i });
    expect(link).toHaveAttribute('href', `/projects/${ghl.slug}`);
  });

  it('renders GitHub link when provided', () => {
    render(<ProjectCard project={withLinks} />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', withLinks.githubUrl);
  });

  it('renders demo link when provided', () => {
    render(<ProjectCard project={withLinks} />);
    expect(screen.getByRole('link', { name: /live demo/i })).toHaveAttribute('href', withLinks.demoUrl);
  });

  it('does not render GitHub link when not provided', () => {
    render(<ProjectCard project={ghl} />);
    expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument();
  });
});
