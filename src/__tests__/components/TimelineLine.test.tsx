import { render } from '@testing-library/react';

type Props = Record<string, unknown> & { children?: React.ReactNode };

// CSS margin shorthand: 1 value = all sides, 2 = vertical horizontal, 3 = top horizontal bottom, 4 = t r b l.
function sides(margin: string) {
  const v = margin.trim().split(/\s+/);
  return { right: v[1] ?? v[0], left: v[3] ?? v[1] ?? v[0] };
}

describe('TimelineLine', () => {
  // The bar is 1 px wide at left 5.5 px, so below 1280 px it sits ~30 px from the viewport edge. A uniform '-60px'
  // margin also insets the observer's root by 60 px on the left, so the bar never counted as in view and stayed
  // invisible at 390 and 768. Only the vertical margin may be negative.
  it('reveals on scroll with a vertical-only viewport margin', async () => {
    const seen: Props[] = [];
    jest.resetModules();
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual<object>('@/__mocks__/framer-motion'),
      motion: {
        div: ({ children, ...props }: Props) => {
          seen.push(props);
          return <div>{children}</div>;
        },
      },
    }));
    const { default: TimelineLine } = await import('@/components/TimelineLine');
    render(<TimelineLine />);
    const viewport = seen[0].viewport as { once: boolean; margin: string };
    expect(viewport.once).toBe(true);
    const { right, left } = sides(viewport.margin);
    expect(parseFloat(right)).toBe(0);
    expect(parseFloat(left)).toBe(0);
    expect(seen[0].whileInView).toEqual({ opacity: 1, y: 0, scaleY: 1 });
  });

  // Same element and initial state as the animated bar (the server can't know the preference), shown at once
  it('shows the bar at once with reduced motion', async () => {
    const seen: Props[] = [];
    jest.resetModules();
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual<object>('@/__mocks__/framer-motion'),
      useReducedMotion: () => true,
      motion: {
        div: ({ children, ...props }: Props) => {
          seen.push(props);
          return <div>{children}</div>;
        },
      },
    }));
    const { default: TimelineLine } = await import('@/components/TimelineLine');
    render(<TimelineLine />);
    expect(seen[0].initial).toEqual({ opacity: 0, y: 40, scaleY: 0 });
    expect(seen[0].animate).toEqual({ opacity: 1, y: 0, scaleY: 1 });
    expect(seen[0].whileInView).toBeUndefined();
    expect((seen[0].transition as { duration: number }).duration).toBe(0);
  });
});
