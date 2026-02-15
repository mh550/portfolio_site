import { render, screen } from '@testing-library/react';
import ExperiencePage from '@/app/experience/page';
import { roles, education } from '@/lib/data';

describe('ExperiencePage', () => {
  it('renders the main heading', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('History');
  });

  it('renders all work roles', () => {
    render(<ExperiencePage />);
    for (const role of roles) {
      expect(screen.getByRole('heading', { name: role.title })).toBeInTheDocument();
      expect(screen.getByText(role.company)).toBeInTheDocument();
    }
  });

  it('renders role bullet points', () => {
    render(<ExperiencePage />);
    // Spot-check one bullet from Builder Clarity role
    expect(screen.getByText(/First engineer hired/)).toBeInTheDocument();
  });

  it('renders Education section', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { name: /education/i })).toBeInTheDocument();
    expect(screen.getByText(education.institution)).toBeInTheDocument();
    expect(screen.getByText(education.degree)).toBeInTheDocument();
    expect(screen.getByText(`GPA: ${education.gpa}`)).toBeInTheDocument();
  });

  it('renders honors', () => {
    render(<ExperiencePage />);
    for (const h of education.honors) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it('renders coursework', () => {
    render(<ExperiencePage />);
    for (const c of education.coursework) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });
});
