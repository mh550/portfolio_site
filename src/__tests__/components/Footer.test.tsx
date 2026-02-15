import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders GitHub link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('github.com');
  });

  it('renders LinkedIn link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('linkedin.com');
  });

  it('renders Email link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /email/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('mailto:');
  });

  it('renders copyright with name', () => {
    render(<Footer />);
    expect(screen.getByText(/Michael Herron/)).toBeInTheDocument();
  });
});
