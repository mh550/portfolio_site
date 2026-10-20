import { readFileSync } from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import LatencyPanel from '@/components/talk/LatencyPanel';
import { metricsCompacted, metricsFull, metricsNulls } from '@/__tests__/fixtures/concierge';

// The cells of the table row whose header reads `label`: [this turn, median].
const row = (label: string) => {
  const header = screen.getByRole('rowheader', { name: label });
  return within(header.closest('tr')!).getAllByRole('cell').map((cell) => cell.textContent);
};
const item = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('LatencyPanel', () => {
  it('has an h2 heading and an empty line before the first turn', () => {
    render(<LatencyPanel turns={[]} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Latency' })).toBeInTheDocument();
    expect(screen.getByText('No turns yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lists the six turn-path rows with the column headers, in order', () => {
    render(<LatencyPanel turns={[metricsFull]} />);
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Step', 'This turn', 'Median']);
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent)).toEqual([
      'Whole turn',
      'End of turn detected',
      'Speech to text',
      'First token from the model',
      'First audio from speech',
      'Memory on the turn path',
      'Prompt tokens from cache',
      'Background extraction',
    ]);
  });

  it('renders one full turn: values, medians equal to them, the cached share, preload, extraction', () => {
    render(<LatencyPanel turns={[metricsFull]} />);
    expect(screen.getByText('Turn 1')).toBeInTheDocument();
    expect(row('Whole turn')).toEqual(['830 ms', '830 ms']);
    expect(row('End of turn detected')).toEqual(['210 ms', '210 ms']);
    expect(row('Speech to text')).toEqual(['95 ms', '95 ms']);
    expect(row('First token from the model')).toEqual(['340 ms', '340 ms']);
    expect(row('First audio from speech')).toEqual(['180 ms', '180 ms']);
    expect(row('Memory on the turn path')).toEqual(['2 ms', '2 ms']);
    expect(row('Prompt tokens from cache')).toEqual(['75%', '75%']);
    expect(row('Background extraction')).toEqual(['610 ms', '610 ms']);
    expect(item('Memory preload at connect')).toBe('45 ms');
    expect(item('History compacted')).toBe('No');
  });

  it('renders a turn of nulls as en dashes, never null or NaN', () => {
    const { container } = render(<LatencyPanel turns={[metricsNulls]} />);
    expect(screen.getByText('Turn 2')).toBeInTheDocument();
    expect(row('Whole turn')).toEqual(['–', '–']);
    expect(row('Memory on the turn path')).toEqual(['–', '–']);
    expect(row('Prompt tokens from cache')).toEqual(['–', '–']);
    expect(item('Memory preload at connect')).toBe('–');
    expect(item('History compacted')).toBe('–');
    expect(screen.queryByRole('rowheader', { name: 'Background extraction' })).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/null|NaN|undefined/);
  });

  it('shows the last turn beside the running median of every turn', () => {
    const { container } = render(<LatencyPanel turns={[metricsFull, metricsNulls, metricsCompacted]} />);
    expect(screen.getByText('Turn 3')).toBeInTheDocument();
    expect(row('Whole turn')).toEqual(['1010 ms', '920 ms']);
    expect(row('First token from the model')).toEqual(['421 ms', '380 ms']);
    expect(row('Memory on the turn path')).toEqual(['3 ms', '3 ms']);
    expect(row('Prompt tokens from cache')).toEqual(['75%', '75%']);
    // Extraction was reported on an earlier turn, so the row stays, with this turn's gap as a dash.
    expect(row('Background extraction')).toEqual(['–', '610 ms']);
    // The preload happens once, at connect: shown once, from the turn that reported it.
    expect(screen.getAllByText('Memory preload at connect')).toHaveLength(1);
    expect(item('Memory preload at connect')).toBe('45 ms');
    expect(item('History compacted')).toBe('Yes');
    expect(container.textContent).not.toMatch(/null|NaN|undefined/);
  });

  it('keeps saying the history was compacted after a later turn that reported nothing', () => {
    render(<LatencyPanel turns={[metricsFull, metricsCompacted, metricsNulls]} />);
    expect(item('History compacted')).toBe('Yes');
  });

  it('keeps the numbers from wrapping', () => {
    render(<LatencyPanel turns={[metricsFull]} />);
    const cell = screen.getByRole('rowheader', { name: 'Whole turn' }).nextElementSibling!;
    expect(cell.className).toMatch(/tabular-nums/);
    expect(cell.className).toMatch(/whitespace-nowrap/);
  });

  it('has no hooks or client directive (Server-Component-safe)', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/components/talk/LatencyPanel.tsx'), 'utf8');
    expect(source).not.toMatch(/['"]use client['"]/);
    expect(source).not.toMatch(/\buse[A-Z]\w*\(/);
  });
});
