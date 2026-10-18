import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';
import { profile } from '@/lib/data';

describe('Footer', () => {
  it('renders GitHub link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', profile.github);
  });

  it('renders LinkedIn link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', profile.linkedin);
  });

  it('renders Email link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /email/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `mailto:${profile.email}`);
  });

  it('renders copyright with name', () => {
    render(<Footer />);
    expect(screen.getByText(/Michael Herron/)).toBeInTheDocument();
  });
});
