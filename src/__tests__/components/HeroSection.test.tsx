import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/hero/HeroSection';
import { profile } from '@/lib/data';

// Mock canvas for NodeGraph
HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

type VariantsLike = { visible: unknown };
type Recorded = { variants?: VariantsLike; custom?: unknown };

let mockReduced = false;
const mockRecorded: Recorded[] = [];

// The shared mock, plus a switchable useReducedMotion and a record of each hero element's variants
jest.mock('framer-motion', () => {
  const actual = jest.requireActual<typeof import('@/__mocks__/framer-motion')>('@/__mocks__/framer-motion');
  const React = jest.requireActual<typeof import('react')>('react');
  const record = (Tag: 'p' | 'h1' | 'div') =>
    // eslint-disable-next-line react/display-name
    React.forwardRef((props: Recorded & Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
      mockRecorded.push({ variants: props.variants, custom: props.custom });
      return React.createElement(actual.motion[Tag], { ...props, ref });
    });
  return {
    ...actual,
    useReducedMotion: () => mockReduced,
    motion: { ...actual.motion, p: record('p'), h1: record('h1'), div: record('div') },
  };
});

function visibleDurations() {
  return mockRecorded
    .filter((r) => r.variants)
    .map((r) => {
      const v = r.variants!.visible;
      const resolved = (typeof v === 'function' ? v(r.custom) : v) as { transition?: { duration?: number } };
      return resolved.transition?.duration;
    });
}

const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  mockReduced = false;
  mockRecorded.length = 0;
});

describe('HeroSection', () => {
  it('renders the name', () => {
    render(<HeroSection />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Michael');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Herron');
  });

  it('renders the positioning eyebrow from profile', () => {
    render(<HeroSection />);
    expect(screen.getByText('Agentic Systems Engineer')).toBeInTheDocument();
    expect(profile.positioning).toBe('Agentic Systems Engineer');
    // The pre-M2 eyebrow is gone
    expect(screen.queryByText(/Integration Engineer/)).toBeNull();
  });

  it('renders the tagline', () => {
    render(<HeroSection />);
    expect(screen.getByText(/I build simple, elegant systems that fit the humans who run them/i)).toBeInTheDocument();
  });

  it('renders the subline under the tagline', () => {
    render(<HeroSection />);
    const tagline = screen.getByText(profile.tagline);
    const subline = screen.getByText(profile.subline);
    expect(before(tagline, subline)).toBe(true);
  });

  it('renders the five loop labels in order, after the subline and before View Projects', () => {
    render(<HeroSection />);
    const strip = screen.getByRole('list', { name: 'How I work' });
    const labels = ['Spec', 'Context', 'Build', 'Verify', 'Learn'].map((l) => screen.getByText(l));
    for (let i = 1; i < labels.length; i++) expect(before(labels[i - 1], labels[i])).toBe(true);
    expect(before(screen.getByText(profile.subline), strip)).toBe(true);
    expect(before(strip, screen.getByRole('link', { name: /view projects/i }))).toBe(true);
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

  it('grows with its content: min-h-svh, not h-screen', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section')!;
    expect(section).toHaveClass('min-h-svh');
    expect(section).not.toHaveClass('h-screen');
  });

  it('does not render scroll indicator', () => {
    render(<HeroSection />);
    expect(screen.queryByText(/^scroll$/i)).not.toBeInTheDocument();
  });

  it('fades the content up when motion is allowed', () => {
    render(<HeroSection />);
    const durations = visibleDurations();
    expect(durations).toHaveLength(6);
    for (const d of durations) expect(d).toBe(0.7);
  });

  it('shows the content at once with reduced motion', () => {
    mockReduced = true;
    render(<HeroSection />);
    const durations = visibleDurations();
    expect(durations).toHaveLength(6);
    for (const d of durations) expect(d).toBe(0);
    // Same hidden state as the fade-up, so the server HTML (which can't know the preference) hydrates without a mismatch
    for (const r of mockRecorded.filter((x) => x.variants)) {
      expect((r.variants as unknown as { hidden: unknown }).hidden).toEqual({ opacity: 0, y: 32 });
    }
  });
});
