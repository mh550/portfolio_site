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

describe('Footer accessibility (M8-02)', () => {
  it('names the new-tab links from their text, with "(opens in new tab)"', () => {
    render(<Footer />);
    for (const name of ['GitHub', 'LinkedIn']) {
      const link = screen.getByRole('link', { name: `${name} (opens in new tab)` });
      expect(link).not.toHaveAttribute('aria-label');
    }
    expect(screen.getByRole('link', { name: 'Email' })).not.toHaveAttribute('aria-label');
  });
});

describe('Footer clear of the voice widget (VC4-03, D61)', () => {
  it('pads its bottom by 96 px below xl and 32 px from xl', () => {
    const { container } = render(<Footer />);
    const classes = (container.querySelector('footer')!.getAttribute('class') ?? '').split(/\s+/);
    expect(classes).toEqual(expect.arrayContaining(['pt-8', 'pb-24', 'xl:pb-8']));
    expect(classes).not.toContain('py-8');
  });
});
