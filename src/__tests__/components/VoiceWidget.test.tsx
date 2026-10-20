import { render, screen } from '@testing-library/react';
import VoiceWidget from '@/components/VoiceWidget';
import { focusRing } from '@/components/focusRing';
import { talkWidget } from '@/lib/data';

// VC4-03, D61: the floating link to /talk
describe('VoiceWidget', () => {
  const classesOf = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const allClasses = (root: Element) =>
    [root, ...Array.from(root.querySelectorAll('*'))].flatMap(classesOf);

  it('is one link to /talk named "Talk to my voice concierge"', () => {
    const { container } = render(<VoiceWidget />);
    const link = screen.getByRole('link', { name: 'Talk to my voice concierge' });
    expect(link).toHaveAttribute('href', '/talk');
    expect(talkWidget).toEqual({ label: 'Talk to my voice concierge', href: '/talk' });
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  it('draws the microphone as an aria-hidden inline svg', () => {
    render(<VoiceWidget />);
    const svg = screen.getByRole('link').querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('floats bottom right, 56 px, above the safe-area inset, hidden in print', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('link'));
    for (const token of ['fixed', 'right-4', 'h-14', 'w-14', 'print:hidden']) expect(classes).toContain(token);
    expect(classes.some((c) => c.startsWith('bottom-') && c.includes('env(safe-area-inset-bottom)'))).toBe(true);
  });

  it('carries every focusRing token', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('link'));
    for (const token of focusRing.split(' ')) expect(classes).toContain(token);
  });

  // The ring sits 2–4 px outside the disc; the outline goes 4–6 px out, so focus shows a distinct second ring
  it('moves the focus outline outside the decorative ring', () => {
    render(<VoiceWidget />);
    expect(classesOf(screen.getByRole('link'))).toContain('focus-visible:outline-offset-4');
  });

  it('pulses only under motion-safe', () => {
    const { container } = render(<VoiceWidget />);
    const classes = allClasses(container);
    expect(classes.some((c) => c.startsWith('motion-safe:animate-'))).toBe(true);
    expect(classes.filter((c) => c.startsWith('animate-'))).toEqual([]);
  });

  it('adds no heading and no landmark', () => {
    const { container } = render(<VoiceWidget />);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.queryAllByRole('complementary')).toHaveLength(0);
  });
});
