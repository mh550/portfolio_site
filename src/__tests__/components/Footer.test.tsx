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

describe('Footer clear of the pill (VC4-03, D61; P3-05, D87)', () => {
  // The 48 px pill sits 16 px up (more on a phone with a home bar): 96 px clears it at every width, 390 included,
  // and at xl, where the links row ends under the pill's corner.
  it('pads its bottom by 96 px at every width', () => {
    const { container } = render(<Footer />);
    const classes = (container.querySelector('footer')!.getAttribute('class') ?? '').split(/\s+/);
    expect(classes).toEqual(expect.arrayContaining(['pt-8', 'pb-24']));
    expect(classes.filter((c) => /^[a-z0-9]+:pb-/.test(c))).toEqual([]);
    expect(classes).not.toContain('py-8');
  });
});
