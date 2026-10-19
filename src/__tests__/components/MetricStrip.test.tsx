import { render } from '@testing-library/react';
import MetricStrip from '@/components/projects/MetricStrip';
import type { Metric } from '@/lib/data';

const metrics = (n: number): Metric[] =>
  Array.from({ length: n }, (_, i) => ({
    value: `${i + 1}`,
    label: `metric ${i + 1}`,
  }));

describe('MetricStrip columns', () => {
  it('renders nothing without metrics', () => {
    const { container } = render(<MetricStrip metrics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps one column on phones and three from sm for three metrics (classic pages, pinned)', () => {
    const { container } = render(<MetricStrip metrics={metrics(3)} />);
    const dl = container.querySelector('dl');
    expect(dl).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    expect(dl!.querySelector('p')).not.toHaveClass('text-balance');
  });

  // M4-04: four metrics in a three-column grid left the fourth alone on a second row at 1280.
  it('lays four metrics out as 2×2 from sm and one row from md, never 3 + 1', () => {
    const dl = render(<MetricStrip metrics={metrics(4)} />).container.querySelector('dl');
    expect(dl).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-4');
    expect(dl).not.toHaveClass('sm:grid-cols-3');
    expect(dl?.children).toHaveLength(4);
    for (const label of dl!.querySelectorAll('p')) expect(label).toHaveClass('text-balance');
  });
});
