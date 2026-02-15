import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/hero/HeroSection';

// Mock canvas for NodeGraph
HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

describe('HeroSection', () => {
  it('renders the name', () => {
    render(<HeroSection />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Michael');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Herron');
  });

  it('renders the tagline', () => {
    render(<HeroSection />);
    expect(screen.getByText(/I build systems that connect things/i)).toBeInTheDocument();
  });

  it('renders View Projects link pointing to /projects', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /view projects/i });
    expect(link).toHaveAttribute('href', '/projects');
  });

  it('renders About Me link pointing to /about', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /about me/i });
    expect(link).toHaveAttribute('href', '/about');
  });

  it('renders scroll indicator', () => {
    render(<HeroSection />);
    expect(screen.getByText(/scroll/i)).toBeInTheDocument();
  });
});
