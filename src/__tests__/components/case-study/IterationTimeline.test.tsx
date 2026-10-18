import { render, screen } from '@testing-library/react';
import IterationTimeline from '@/components/projects/case-study/IterationTimeline';
import { fixtureProject } from '../../fixtures/case-study-project';

const iterations = fixtureProject.caseStudy!.iterations!;

describe('IterationTimeline', () => {
  it('renders a #iterations section headed How It Evolved', () => {
    const { container } = render(<IterationTimeline iterations={iterations} />);
    expect(container.querySelector('section#iterations')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'How It Evolved' })).toBeInTheDocument();
  });

  it('renders when · label · what · why per row, in order', () => {
    const { container } = render(<IterationTimeline iterations={iterations} />);
    const rows = Array.from(container.querySelectorAll('ol > li'));
    expect(rows).toHaveLength(iterations.length);
    rows.forEach((row, i) => {
      const it = iterations[i];
      expect(row).toHaveTextContent(`${it.when} · ${it.label}`);
      const text = row.textContent ?? '';
      const order = [it.when, it.label, it.what, it.why].map((s) => text.indexOf(s));
      expect(order.every((n) => n >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    });
  });

  it('renders nothing when iterations is undefined', () => {
    const { container } = render(<IterationTimeline iterations={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty array', () => {
    const { container } = render(<IterationTimeline iterations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
