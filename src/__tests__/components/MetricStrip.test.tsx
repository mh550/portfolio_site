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
    expect(dl!.querySelector('dt')).not.toHaveClass('text-balance');
  });

  // M4-04: four metrics in a three-column grid left the fourth alone on a second row at 1280.
  it('lays four metrics out as 2×2 from sm and one row from md, never 3 + 1', () => {
    const dl = render(<MetricStrip metrics={metrics(4)} />).container.querySelector('dl');
    expect(dl).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-4');
    expect(dl).not.toHaveClass('sm:grid-cols-3');
    expect(dl?.children).toHaveLength(4);
    for (const label of dl!.querySelectorAll('dt')) expect(label).toHaveClass('text-balance');
  });

  // M5-04: at 1280 a phrase value ("Trash, not delete") in a quarter-width card wrapped to three lines
  // and stretched all four cards. A strip with a value too long for a quarter card stays 2×2.
  it('keeps four metrics 2×2 when a value is a phrase too long for a quarter-width card', () => {
    const withPhrase = [...metrics(3), { value: 'Trash, not delete', label: 'every removal is reversible' }];
    const dl = render(<MetricStrip metrics={withPhrase} />).container.querySelector('dl');
    expect(dl).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    expect(dl).not.toHaveClass('md:grid-cols-4');
    expect(dl).not.toHaveClass('sm:grid-cols-3');
  });

  it('still puts four short values (the agent-harness strip) in one row from md', () => {
    const short = ['55', '52', '+374', '≈ $2.53'].map((value) => ({ value, label: `l ${value}` }));
    const dl = render(<MetricStrip metrics={short} />).container.querySelector('dl');
    expect(dl).toHaveClass('sm:grid-cols-2', 'md:grid-cols-4');
  });

  it('switches at the boundary: a 7-character value keeps one row, an 8-character one goes 2×2', () => {
    const strip = (last: string) =>
      render(<MetricStrip metrics={[...metrics(3), { value: last, label: 'last' }]} />).container.querySelector('dl');
    expect(strip('1234567')).toHaveClass('md:grid-cols-4');
    expect(strip('12345678')).not.toHaveClass('md:grid-cols-4');
  });
});

// M8-02: the label was an sr-only <dt> plus a visible <p>, so screen readers read it twice (and <p> is not
// allowed directly in a <dl> group).
describe('MetricStrip semantics', () => {
  it('renders each label once, as the visible <dt>, and only dt/dd in each group', () => {
    const { container } = render(<MetricStrip metrics={metrics(3)} />);
    for (const group of container.querySelectorAll('dl > div')) {
      expect(Array.from(group.children).map((c) => c.tagName)).toEqual(['DT', 'DD']);
      expect(group.querySelector('dt')).not.toHaveClass('sr-only');
    }
    expect(container.textContent!.match(/metric 1/g)).toHaveLength(1);
  });

  // jsdom has no layout: pin the classes that show the value above its label and keep values top-aligned in a row
  // where one label wraps (in column-reverse, justify-end packs toward the top)
  it('shows the value above the label, packed to the top of the card', () => {
    const { container } = render(<MetricStrip metrics={metrics(3)} />);
    for (const group of container.querySelectorAll('dl > div')) {
      expect(group).toHaveClass('flex', 'flex-col-reverse', 'justify-end');
    }
  });
});
