import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VoiceWidget from '@/components/VoiceWidget';
import { focusRing } from '@/components/focusRing';
import { talkWidget } from '@/lib/data';

// VC4-03, D61: the floating widget; P3-04, D86: a button that opens and closes the concierge panel
describe('VoiceWidget', () => {
  const classesOf = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const allClasses = (root: Element) =>
    [root, ...Array.from(root.querySelectorAll('*'))].flatMap(classesOf);

  it('is one button named "Talk to my voice concierge", not a link', () => {
    const { container } = render(<VoiceWidget />);
    const button = screen.getByRole('button', { name: 'Talk to my voice concierge' });
    expect(button).toHaveAttribute('type', 'button');
    expect(talkWidget).toEqual({
      label: 'Talk to my voice concierge',
      liveLabel: 'Live call with my concierge',
      panelTitle: 'Ask my site',
      minimize: 'Minimize',
      href: '/talk',
    });
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('collapsed: aria-expanded false and no aria-controls (the panel is not in the DOM)', () => {
    render(<VoiceWidget />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
  });

  it('expanded: aria-expanded true and aria-controls the panel', () => {
    render(<VoiceWidget expanded />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'concierge-panel');
  });

  it('a click calls onToggle', () => {
    const onToggle = jest.fn();
    render(<VoiceWidget onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // Minimize and Esc unmount the panel, which drops focus on <body>: the widget takes it back.
  function Toggle({ initial = true }: { initial?: boolean }) {
    const [open, setOpen] = useState(initial);
    return (
      <>
        {open && (
          <button type="button" onClick={() => setOpen(false)}>
            close panel
          </button>
        )}
        <a href="/x">page link</a>
        <VoiceWidget expanded={open} onToggle={() => setOpen((o) => !o)} />
      </>
    );
  }

  it('takes focus back when the panel closes with focus inside it', () => {
    render(<Toggle />);
    const close = screen.getByRole('button', { name: 'close panel' });
    close.focus();
    fireEvent.click(close);
    expect(screen.getByRole('button', { name: talkWidget.label })).toHaveFocus();
  });

  it('leaves focus alone when it has moved to the page', () => {
    render(<Toggle />);
    const link = screen.getByRole('link', { name: 'page link' });
    link.focus();
    // fireEvent moves no focus: the panel closes while the page link holds it
    fireEvent.click(screen.getByRole('button', { name: 'close panel' }));
    expect(screen.queryByRole('button', { name: 'close panel' })).toBeNull();
    expect(link).toHaveFocus();
  });

  it('never grabs focus on first render', () => {
    render(<Toggle initial={false} />);
    expect(screen.getByRole('button')).not.toHaveFocus();
  });

  it('draws the microphone as an aria-hidden inline svg', () => {
    render(<VoiceWidget />);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('floats bottom right, 56 px, above the safe-area inset, hidden in print', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('button'));
    for (const token of ['fixed', 'right-4', 'h-14', 'w-14', 'print:hidden']) expect(classes).toContain(token);
    expect(classes.some((c) => c.startsWith('bottom-') && c.includes('env(safe-area-inset-bottom)'))).toBe(true);
  });

  it('carries every focusRing token', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('button'));
    for (const token of focusRing.split(' ')) expect(classes).toContain(token);
  });

  // The ring sits 2–4 px outside the disc; the outline goes 4–6 px out, so focus shows a distinct second ring
  it('moves the focus outline outside the decorative ring', () => {
    render(<VoiceWidget />);
    expect(classesOf(screen.getByRole('button'))).toContain('focus-visible:outline-offset-4');
  });

  it('pulses only under motion-safe', () => {
    const { container } = render(<VoiceWidget />);
    const classes = allClasses(container);
    expect(classes.some((c) => c.startsWith('motion-safe:animate-'))).toBe(true);
    // Two pulses, 4 s, under WCAG 2.2.2's 5 s: without the count it would loop forever
    expect(classes).toContain('motion-safe:[animation-iteration-count:2]');
    expect(classes.filter((c) => c.startsWith('animate-'))).toEqual([]);
  });

  it('adds no heading and no landmark', () => {
    const { container } = render(<VoiceWidget />);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.queryAllByRole('complementary')).toHaveLength(0);
  });

  // P3-03 review: the call outlives /talk (D85), so while one is on the widget says so, and leads back to Leave.
  it('without a call: no live dot', () => {
    const { container } = render(<VoiceWidget />);
    expect(container.querySelector('[data-live-dot]')).toBeNull();
  });

  it('during a call: named for the live call, with an aria-hidden live dot', () => {
    const { container } = render(<VoiceWidget live />);
    expect(screen.getByRole('button', { name: talkWidget.liveLabel })).toBeInTheDocument();
    const dot = container.querySelector('[data-live-dot]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });
});
