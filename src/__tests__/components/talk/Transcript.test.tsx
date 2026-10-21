import { fireEvent, render, screen, within } from '@testing-library/react';
import Transcript, { type TranscriptLine } from '@/components/talk/Transcript';

const lines: TranscriptLine[] = [
  { key: 'a', who: 'agent', text: 'Hi, I am the concierge.', final: true },
  { key: 'b', who: 'visitor', text: 'I work on robots.', final: true },
  { key: 'c', who: 'agent', text: 'Robots, nice', final: false },
];

const log = () => screen.getByRole('log');

describe('Transcript', () => {
  // D94: the usher's notice is the page's own line: muted, italic, no speaker label, never aria-busy.
  it('renders a notice line muted and unattributed', () => {
    render(
      <Transcript lines={[...lines.slice(0, 2), { key: 'notice-1', who: 'notice', text: 'Taking you to About', final: true }]} />
    );
    const items = within(log()).getAllByRole('listitem');
    const notice = items[2];
    expect(notice).toHaveTextContent(/^Taking you to About$/);
    expect(notice).toHaveAttribute('data-who', 'notice');
    expect(notice.className).toMatch(/text-\[var\(--color-muted\)\]/);
    expect(notice.className).toMatch(/\bitalic\b/);
    expect(within(notice).queryByText('Concierge')).toBeNull();
    expect(within(notice).queryByText('You')).toBeNull();
    expect(log()).toHaveAttribute('aria-busy', 'false');
  });

  it('has an h2 heading that names a polite live region', () => {
    render(<Transcript lines={lines} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Transcript' })).toBeInTheDocument();
    expect(log()).toHaveAttribute('aria-live', 'polite');
    expect(log()).toHaveAccessibleName('Transcript');
  });

  it('renders the lines oldest first, each with its speaker', () => {
    render(<Transcript lines={lines} />);
    const items = within(log()).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'Concierge Hi, I am the concierge.',
      'You I work on robots.',
      'Concierge Robots, nice…',
    ]);
  });

  it('marks a non-final line visibly, and only that line', () => {
    render(<Transcript lines={lines} />);
    const [first, , last] = within(log()).getAllByRole('listitem');
    expect(last).toHaveAttribute('data-final', 'false');
    expect(within(last).getByText('…')).toBeInTheDocument();
    expect(within(last).getByText('Robots, nice').className).toMatch(/italic/);
    expect(first).toHaveAttribute('data-final', 'true');
    expect(within(first).queryByText('…')).not.toBeInTheDocument();
    expect(within(first).getByText('Hi, I am the concierge.').className).not.toMatch(/italic/);
  });

  it('is aria-busy while a line is still being spoken, so partial text is not read out', () => {
    const { rerender } = render(<Transcript lines={lines} />);
    expect(log()).toHaveAttribute('aria-busy', 'true');
    rerender(<Transcript lines={lines.map((line) => ({ ...line, final: true }))} />);
    expect(log()).toHaveAttribute('aria-busy', 'false');
  });

  it('shows an empty line before anything is said', () => {
    render(<Transcript lines={[]} />);
    expect(within(log()).getByText('Nothing said yet.')).toBeInTheDocument();
    expect(within(log()).queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('scrolls to the newest line when one arrives', () => {
    const { rerender } = render(<Transcript lines={lines.slice(0, 1)} />);
    Object.defineProperty(log(), 'scrollHeight', { configurable: true, value: 640 });
    rerender(<Transcript lines={lines} />);
    expect(log().scrollTop).toBe(640);
  });

  it('stays put when the reader has scrolled up to reread', () => {
    const { rerender } = render(<Transcript lines={lines.slice(0, 2)} />);
    Object.defineProperty(log(), 'scrollHeight', { configurable: true, value: 640 });
    Object.defineProperty(log(), 'clientHeight', { configurable: true, value: 200 });
    log().scrollTop = 100;
    fireEvent.scroll(log());
    rerender(<Transcript lines={lines} />);
    expect(log().scrollTop).toBe(100);
    log().scrollTop = 440;
    fireEvent.scroll(log());
    rerender(<Transcript lines={[...lines, { key: 'd', who: 'visitor', text: 'Yes.', final: true }]} />);
    expect(log().scrollTop).toBe(640);
  });

  it('is keyboard-focusable (it scrolls) with the site focus ring', () => {
    render(<Transcript lines={lines} />);
    expect(log()).toHaveAttribute('tabindex', '0');
    expect(log().className).toMatch(/focus-visible:outline-\[var\(--color-accent\)\]/);
  });

  it('renders children (the message box) after the log, inside the section', () => {
    render(
      <Transcript lines={lines}>
        <form aria-label="Message form" />
      </Transcript>,
    );
    const section = screen.getByRole('heading', { name: 'Transcript' }).closest('section')!;
    expect(within(section).getByRole('form', { name: 'Message form' })).toBeInTheDocument();
  });
});
