import { useState } from 'react';
import type { NavigationMock } from '@/__tests__/helpers/navigation';
import { act, fireEvent, render, screen } from '@testing-library/react';
import VoiceWidget from '@/components/VoiceWidget';
import { focusRing } from '@/components/focusRing';
import { talkWidget } from '@/lib/data';

// P3-08: the provider calls useRouter() (the usher), so next/navigation is mocked (helpers/navigation.ts).
jest.mock('next/navigation', () => jest.requireActual<NavigationMock>('@/__tests__/helpers/navigation').mockNavigation);

// VC4-03, D61: the floating widget; P3-04, D86: a button that opens and closes the concierge panel; P3-05, D87: the
// "Ask my site" pill with the sound-bars glyph and the live states.
describe('VoiceWidget', () => {
  const classesOf = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const allClasses = (root: Element) =>
    [root, ...Array.from(root.querySelectorAll('*'))].flatMap(classesOf);

  it('is one button named by its visible label "Ask my site", not a link', () => {
    const { container } = render(<VoiceWidget />);
    const button = screen.getByRole('button', { name: 'Ask my site' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('Ask my site');
    // Idle: the visible label is the name, no aria-label over it
    expect(button).not.toHaveAttribute('aria-label');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('reads every string from talkWidget', () => {
    expect(talkWidget).toEqual({
      label: 'Ask my site',
      listening: 'Ask my site: listening',
      speaking: 'Ask my site: speaking',
      callout: 'This site talks. Ask it about my work, by voice or text.',
      close: 'Close',
      panelTitle: 'Ask my site',
      minimize: 'Minimize',
      guideMe: 'Guide me',
      guideMeHint: 'Lets the concierge open the pages it talks about',
      notice: 'Taking you to',
      pageNames: { '/': 'Home', '/about': 'About', '/skills': 'Skills', '/experience': 'Experience', '/contact': 'Contact' },
      href: '/talk',
    });
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

  describe('the sound-bars glyph', () => {
    const bars = (container: Element) => Array.from(container.querySelectorAll('svg rect'));

    it('is an aria-hidden inline svg of three rects', () => {
      const { container } = render(<VoiceWidget />);
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      expect(bars(container)).toHaveLength(3);
      expect(container.querySelectorAll('svg path, svg circle')).toHaveLength(0);
    });

    it.each([
      ['idle', {}],
      ['live, listening', { live: true }],
    ])('%s: the bars carry no animation class at all', (_, props) => {
      const { container } = render(<VoiceWidget {...props} />);
      expect(allClasses(container).filter((c) => c.includes('animate'))).toEqual([]);
    });

    it('speaking: each bar moves, only under motion-safe, staggered', () => {
      const { container } = render(<VoiceWidget live speaking />);
      const delays = bars(container).map((rect) => {
        const classes = classesOf(rect);
        expect(classes.some((c) => c.startsWith('motion-safe:animate-[concierge-bar'))).toBe(true);
        expect(classes.filter((c) => c.startsWith('animate-'))).toEqual([]);
        return classes.find((c) => c.startsWith('[animation-delay:'));
      });
      expect(new Set(delays).size).toBe(3);
    });

    it('speaking without a live call is not shown as speaking', () => {
      const { container } = render(<VoiceWidget speaking />);
      expect(allClasses(container).filter((c) => c.includes('animate'))).toEqual([]);
      expect(screen.getByRole('button', { name: talkWidget.label })).toBeInTheDocument();
    });
  });

  it('floats bottom right as a 48 px high pill above the safe-area inset, hidden in print', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('button'));
    for (const token of ['fixed', 'right-4', 'z-40', 'h-12', 'px-4', 'gap-2', 'rounded-full', 'print:hidden'])
      expect(classes).toContain(token);
    expect(classes).not.toContain('w-14');
    expect(classes.some((c) => c.startsWith('bottom-') && c.includes('env(safe-area-inset-bottom)'))).toBe(true);
  });

  it('carries every focusRing token, its outline offset outside the pill', () => {
    render(<VoiceWidget />);
    const classes = classesOf(screen.getByRole('button'));
    for (const token of focusRing.split(' ')) expect(classes).toContain(token);
    expect(classes).toContain('focus-visible:outline-offset-4');
  });

  // D87: the callout is the one-time invitation now; the twice-pulsing ring is gone.
  it('has no pulsing ring', () => {
    const { container } = render(<VoiceWidget />);
    const classes = allClasses(container);
    expect(classes.some((c) => c.includes('animate-pulse'))).toBe(false);
    expect(classes).not.toContain('motion-safe:[animation-iteration-count:2]');
  });

  it('is invisible while the panel it covers is open', () => {
    render(<VoiceWidget expanded />);
    expect(classesOf(screen.getByRole('button'))).toContain('invisible');
  });

  it('adds no heading and no landmark', () => {
    const { container } = render(<VoiceWidget />);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.queryAllByRole('complementary')).toHaveLength(0);
  });

  describe('live states', () => {
    it('without a call: no live dot', () => {
      const { container } = render(<VoiceWidget />);
      expect(container.querySelector('[data-live-dot]')).toBeNull();
    });

    it('live, listening: named "Ask my site: listening", the label still visible, an aria-hidden 8 px dot', () => {
      const { container } = render(<VoiceWidget live />);
      const button = screen.getByRole('button', { name: 'Ask my site: listening' });
      expect(button).toHaveTextContent('Ask my site');
      const dot = container.querySelector('[data-live-dot]');
      expect(dot).not.toBeNull();
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(classesOf(dot!)).toEqual(expect.arrayContaining(['h-2', 'w-2', 'rounded-full']));
    });

    it('live, speaking: named "Ask my site: speaking", with the dot', () => {
      const { container } = render(<VoiceWidget live speaking />);
      expect(screen.getByRole('button', { name: talkWidget.speaking })).toBeInTheDocument();
      expect(container.querySelector('[data-live-dot]')).not.toBeNull();
    });
  });

  // ≤ 390 px, once scrolled, the pill gives the page back its corner: the glyph alone, the name unchanged.
  describe('collapse at 390 px', () => {
    let matches = false;
    let changeListeners: (() => void)[] = [];
    const realMatchMedia = window.matchMedia;

    beforeEach(() => {
      changeListeners = [];
      window.matchMedia = jest.fn((query: string) => ({
        get matches() {
          return query === '(max-width: 390px)' && matches;
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, fn: () => void) => changeListeners.push(fn),
        removeEventListener: (_: string, fn: () => void) => {
          changeListeners = changeListeners.filter((l) => l !== fn);
        },
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })) as unknown as typeof window.matchMedia;
      window.scrollY = 0;
    });

    afterEach(() => {
      window.matchMedia = realMatchMedia;
      window.scrollY = 0;
      matches = false;
    });

    const scrollTo = (y: number) =>
      act(() => {
        window.scrollY = y;
        window.dispatchEvent(new Event('scroll'));
      });
    const label = () => screen.getByText(talkWidget.label);

    it('at 390, before any scroll: the label shows', () => {
      matches = true;
      render(<VoiceWidget />);
      const button = screen.getByRole('button', { name: talkWidget.label });
      expect(button).not.toHaveAttribute('data-collapsed');
      expect(classesOf(label())).not.toContain('sr-only');
    });

    it('at 390, once scrolled: the glyph alone, the label sr-only, the name unchanged', () => {
      matches = true;
      render(<VoiceWidget />);
      scrollTo(200);
      const button = screen.getByRole('button', { name: talkWidget.label });
      expect(button).toHaveAttribute('data-collapsed', 'true');
      expect(classesOf(label())).toContain('sr-only');
      expect(classesOf(button)).toEqual(expect.arrayContaining(['w-12', 'px-0', 'justify-center']));
    });

    it('back at the top: the label shows again', () => {
      matches = true;
      render(<VoiceWidget />);
      scrollTo(200);
      scrollTo(0);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-collapsed');
    });

    it('live and collapsed: the live name stays', () => {
      matches = true;
      render(<VoiceWidget live />);
      scrollTo(50);
      expect(screen.getByRole('button', { name: talkWidget.listening })).toHaveAttribute('data-collapsed', 'true');
    });

    it('above 390 it never collapses', () => {
      matches = false;
      render(<VoiceWidget />);
      scrollTo(500);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-collapsed');
      expect(classesOf(label())).not.toContain('sr-only');
    });

    it('a page already scrolled at 390 collapses after mount', () => {
      matches = true;
      window.scrollY = 300;
      render(<VoiceWidget />);
      expect(screen.getByRole('button')).toHaveAttribute('data-collapsed', 'true');
    });

    it('follows the media query when the width changes', () => {
      matches = false;
      render(<VoiceWidget />);
      scrollTo(300);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-collapsed');
      act(() => {
        matches = true;
        for (const fn of changeListeners) fn();
      });
      expect(screen.getByRole('button')).toHaveAttribute('data-collapsed', 'true');
    });

    it('removes the same scroll and media listeners it added, on unmount', () => {
      matches = true;
      const add = jest.spyOn(window, 'addEventListener');
      const remove = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<VoiceWidget />);
      const onScroll = add.mock.calls.find(([type]) => type === 'scroll')?.[1];
      expect(onScroll).toBeDefined();
      expect(changeListeners).toHaveLength(1);
      unmount();
      expect(remove).toHaveBeenCalledWith('scroll', onScroll!);
      expect(changeListeners).toHaveLength(0);
      add.mockRestore();
      remove.mockRestore();
    });

    // Safari before 14: MediaQueryList has only addListener/removeListener
    it('falls back to addListener on an old MediaQueryList', () => {
      const addListener = jest.fn();
      const removeListener = jest.fn();
      window.matchMedia = jest.fn(() => ({
        matches: true,
        media: '(max-width: 390px)',
        addListener,
        removeListener,
      })) as unknown as typeof window.matchMedia;
      const { unmount } = render(<VoiceWidget />);
      scrollTo(100);
      expect(screen.getByRole('button')).toHaveAttribute('data-collapsed', 'true');
      expect(addListener).toHaveBeenCalledTimes(1);
      unmount();
      expect(removeListener).toHaveBeenCalledWith(addListener.mock.calls[0][0]);
    });
  });

  it('without matchMedia (an old browser) it renders expanded and never throws', () => {
    const realMatchMedia = window.matchMedia;
    try {
      // @ts-expect-error: jsdom's own matchMedia is absent too; make sure
      delete window.matchMedia;
      render(<VoiceWidget />);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-collapsed');
    } finally {
      window.matchMedia = realMatchMedia;
    }
  });

  // The Callout hands focus here after Close
  it('carries the id the Callout focuses', () => {
    render(<VoiceWidget />);
    expect(screen.getByRole('button')).toHaveAttribute('id', 'concierge-pill');
  });

  // Review: on the 48 px circle the dot stays inside the round edge
  it('collapsed and live: the dot is inset onto the circle', () => {
    const realMatchMedia = window.matchMedia;
    try {
      window.matchMedia = jest.fn(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as unknown as typeof window.matchMedia;
      window.scrollY = 10;
      const { container } = render(<VoiceWidget live />);
      const classes = classesOf(container.querySelector('[data-live-dot]')!);
      expect(classes).toEqual(expect.arrayContaining(['absolute', 'right-1.5', 'top-1.5']));
    } finally {
      window.matchMedia = realMatchMedia;
      window.scrollY = 0;
    }
  });
});
