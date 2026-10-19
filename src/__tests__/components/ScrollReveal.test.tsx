import { render, screen } from '@testing-library/react';
import ScrollReveal from '@/components/ScrollReveal';

// Default mock: useReducedMotion returns false (animations enabled)
describe('ScrollReveal — normal motion', () => {
  it('renders children', () => {
    render(<ScrollReveal><p>Hello</p></ScrollReveal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('passes className to wrapper', () => {
    render(<ScrollReveal className="my-class"><p>Content</p></ScrollReveal>);
    expect(screen.getByText('Content').parentElement).toHaveClass('my-class');
  });

  // globals.css's print block forces [data-scroll-reveal] visible: nothing is scrolled into view on paper (S3-01)
  it('marks its wrapper for the print stylesheet', () => {
    render(<ScrollReveal><p>Print</p></ScrollReveal>);
    expect(screen.getByText('Print').parentElement).toHaveAttribute('data-scroll-reveal');
  });

  // A uniform negative margin also insets the observer's left and right edges, so content within 80 px of a side
  // (a narrow card or badge) would never count as in view and stay at opacity 0 (the TimelineLine bug, M2-05)
  it('reveals with a vertical-only viewport margin', async () => {
    const seen: Record<string, unknown>[] = [];
    jest.resetModules();
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual<object>('@/__mocks__/framer-motion'),
      motion: {
        div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
          seen.push(props);
          return <div>{children}</div>;
        },
      },
    }));
    const { default: SR } = await import('@/components/ScrollReveal');
    render(<SR><p>Margin</p></SR>);
    expect(seen[0].viewport).toEqual({ once: true, margin: '-80px 0px' });
    jest.dontMock('framer-motion');
    jest.resetModules();
  });
});

// Override mock to simulate prefers-reduced-motion
describe('ScrollReveal — reduced motion', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual<object>('@/__mocks__/framer-motion'),
      useReducedMotion: () => true,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  // The server can't know the preference (useReducedMotion is null there), so it renders the hidden initial state.
  // The client must keep the same motion.div and reveal it at once; a plain div here left the server's inline
  // opacity:0 in place (React doesn't patch attributes on hydration), hiding the page from reduced-motion users.
  it('keeps the motion wrapper and reveals it instantly when reduced motion is preferred', async () => {
    const seen: Record<string, unknown>[] = [];
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual<object>('@/__mocks__/framer-motion'),
      useReducedMotion: () => true,
      motion: {
        div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
          seen.push(props);
          return <div data-motion="">{children}</div>;
        },
      },
    }));
    const { default: SR } = await import('@/components/ScrollReveal');
    render(<SR><p data-testid="child">Reduced</p></SR>);
    expect(screen.getByTestId('child').parentElement).toHaveAttribute('data-motion');
    expect(seen[0]['data-scroll-reveal']).toBe(true);
    expect(seen[0].initial).toEqual({ opacity: 0, y: 40, x: 0 });
    expect(seen[0].animate).toEqual({ opacity: 1, y: 0, x: 0 });
    expect(seen[0].transition).toEqual({ duration: 0 });
  });
});
