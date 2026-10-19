import { render, screen } from '@testing-library/react';
import FloatingLogos from '@/components/hero/FloatingLogos';

let mockReduced = false;
const mockAnimate: unknown[] = [];
const mockHover: unknown[] = [];

// The shared mock, plus a switchable useReducedMotion and a record of each motion.div's animate prop
jest.mock('framer-motion', () => {
  const actual = jest.requireActual<typeof import('@/__mocks__/framer-motion')>('@/__mocks__/framer-motion');
  const React = jest.requireActual<typeof import('react')>('react');
  // eslint-disable-next-line react/display-name
  const div = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
    mockAnimate.push(props.animate);
    if (props.whileHover) mockHover.push(props.whileHover);
    return React.createElement(actual.motion.div, { ...props, ref });
  });
  return { ...actual, useReducedMotion: () => mockReduced, motion: { ...actual.motion, div } };
});

beforeEach(() => {
  mockReduced = false;
  mockAnimate.length = 0;
  mockHover.length = 0;
});

describe('FloatingLogos', () => {
  it('renders all skill logos', () => {
    render(<FloatingLogos />);
    const labels = ['TypeScript', 'React', 'Supabase', 'Vercel', 'n8n', 'Zapier', 'Claude', 'Pipedream', 'Linear'];
    for (const label of labels) {
      // Either an SVG with aria-label or a div with the monogram text
      const el = screen.queryByRole('img', { name: label }) ?? screen.queryByText('PD');
      expect(el ?? screen.queryByTitle(label)).toBeTruthy();
    }
  });

  it('is aria-hidden so screen readers skip it', () => {
    const { container } = render(<FloatingLogos />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  // Up to 1024 px the logos sat behind the eyebrow, h1, tagline and strip labels (D33)
  it('is hidden below xl', () => {
    const { container } = render(<FloatingLogos />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('hidden', 'xl:block');
  });

  it('floats every logo when motion is allowed', () => {
    render(<FloatingLogos />);
    expect(mockAnimate.filter(Boolean)).toHaveLength(9);
  });

  it('keeps the logos still with reduced motion', () => {
    mockReduced = true;
    render(<FloatingLogos />);
    expect(mockAnimate.filter(Boolean)).toHaveLength(0);
  });

  it('grows a logo on hover only when motion is allowed', () => {
    render(<FloatingLogos />);
    expect(mockHover).toHaveLength(9);
    for (const h of mockHover) expect(h).toMatchObject({ scale: 1.5 });
  });

  it('only recolours a hovered logo with reduced motion (no scale)', () => {
    mockReduced = true;
    render(<FloatingLogos />);
    expect(mockHover).toHaveLength(9);
    for (const h of mockHover) {
      expect(h).toMatchObject({ color: '#00d4ff' });
      expect(h).not.toHaveProperty('scale');
    }
  });
});
