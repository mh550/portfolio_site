import { render, screen } from '@testing-library/react';
import FloatingLogos from '@/components/hero/FloatingLogos';
import { logoPaths } from '@/components/logos/paths';

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
  // The twelve marks of the stack (D78), from components/logos/paths.ts
  const LABELS = [
    'Claude Code', 'LiveKit', 'Python', 'TypeScript', 'Bash', 'SQLite',
    'PostgreSQL', 'Docker', 'Linux', 'Next.js', 'n8n', 'GitHub',
  ];

  it('renders exactly the twelve stack logos', () => {
    const { container } = render(<FloatingLogos />);
    for (const label of LABELS) {
      expect(screen.getByRole('img', { name: label, hidden: true })).toBeInTheDocument();
    }
    expect(container.querySelectorAll('svg')).toHaveLength(12);
  });

  it('drops the old marks', () => {
    render(<FloatingLogos />);
    for (const label of ['Zapier', 'Supabase', 'Linear', 'Pipedream', 'React', 'Vercel', 'Claude']) {
      expect(screen.queryByRole('img', { name: label, hidden: true })).toBeNull();
    }
  });

  it('draws every mark from the generated paths on a 24×24 box', () => {
    const { container } = render(<FloatingLogos />);
    const ds = [...container.querySelectorAll('path')].map((p) => p.getAttribute('d'));
    expect(ds.sort()).toEqual(Object.values(logoPaths).map((l) => l.path).sort());
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
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

  it('is hidden in print (S3-01)', () => {
    const { container } = render(<FloatingLogos />);
    expect(container.firstChild).toHaveClass('print:hidden');
  });

  it('floats every logo when motion is allowed', () => {
    render(<FloatingLogos />);
    expect(mockAnimate.filter(Boolean)).toHaveLength(12);
  });

  it('keeps the logos still with reduced motion', () => {
    mockReduced = true;
    render(<FloatingLogos />);
    expect(mockAnimate.filter(Boolean)).toHaveLength(0);
  });

  it('grows a logo on hover only when motion is allowed', () => {
    render(<FloatingLogos />);
    expect(mockHover).toHaveLength(12);
    for (const h of mockHover) expect(h).toMatchObject({ scale: 1.5 });
  });

  it('only recolours a hovered logo with reduced motion (no scale)', () => {
    mockReduced = true;
    render(<FloatingLogos />);
    expect(mockHover).toHaveLength(12);
    for (const h of mockHover) {
      expect(h).toMatchObject({ color: '#00d4ff' });
      expect(h).not.toHaveProperty('scale');
    }
  });
});
