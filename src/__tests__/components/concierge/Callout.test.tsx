import { useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ConciergeProvider, { useConcierge, type ConciergeValue } from '@/components/concierge/ConciergeProvider';
import Callout from '@/components/concierge/Callout';
import { focusRing } from '@/components/focusRing';
import { talkWidget } from '@/lib/data';

// P3-05, D88: the first-visit callout next to the pill, once per browser.
const KEY = 'concierge.callout_seen';
const TEXT = 'This site talks. Ask it about my work, by voice or text.';

let ctx: ConciergeValue;
function Probe() {
  const value = useConcierge();
  useEffect(() => {
    ctx = value;
  });
  return null;
}

const tree = () => (
  <ConciergeProvider configured={false}>
    <Probe />
    <footer>
      <a href="mailto:x@example.com">Email</a>
    </footer>
    <Callout />
    <button type="button" id="concierge-pill">
      pill
    </button>
  </ConciergeProvider>
);

const classesOf = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
const note = () => screen.queryByRole('note');

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Callout', () => {
  it('first visit: a note with exactly the line, and a Close button', () => {
    render(tree());
    expect(talkWidget.callout).toBe(TEXT);
    const bubble = note();
    expect(bubble).not.toBeNull();
    expect(bubble).toHaveTextContent(TEXT);
    expect(screen.getByText(TEXT).textContent).toBe(TEXT);
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveAttribute('type', 'button');
    expect(bubble).toContainElement(close);
  });

  it('the Close glyph is aria-hidden and the button carries the focus ring', () => {
    render(tree());
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.querySelector('[aria-hidden="true"]')).not.toBeNull();
    for (const token of focusRing.split(' ')) expect(classesOf(close)).toContain(token);
  });

  it('Close hides it and sets the key', () => {
    render(tree());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('opening the panel hides it and sets the key; it stays hidden after Minimize', () => {
    render(tree());
    act(() => ctx.openPanel());
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe('1');
    act(() => ctx.minimizePanel());
    expect(note()).toBeNull();
  });

  it('with the key present it never renders', () => {
    localStorage.setItem(KEY, '1');
    render(tree());
    expect(note()).toBeNull();
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('a storage that throws shows it, with no error', () => {
    const error = jest.spyOn(console, 'error');
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    render(tree());
    expect(note()).not.toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it('a storage whose setItem throws: Close still hides it, with no error', () => {
    const error = jest.spyOn(console, 'error');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    render(tree());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(note()).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it('is not in the server HTML, so hydration matches on a first visit', () => {
    const html = renderToString(tree());
    expect(html).not.toContain('This site talks');
    expect(html).not.toContain('role="note"');
  });

  it('sits above the pill, bottom right, under the panel, hidden in print', () => {
    render(tree());
    const classes = classesOf(note()!);
    for (const token of ['fixed', 'right-4', 'z-40', 'print:hidden', 'max-w-[16rem]']) expect(classes).toContain(token);
    expect(classes.some((c) => c.startsWith('bottom-[calc(') && c.includes('env(safe-area-inset-bottom)'))).toBe(true);
  });

  it('animates its entrance only under motion-safe', () => {
    const { container } = render(tree());
    const classes = [...container.querySelectorAll('*')].flatMap(classesOf);
    expect(classes.some((c) => c.startsWith('motion-safe:animate-[concierge-callout'))).toBe(true);
    expect(classes.filter((c) => c.startsWith('animate-'))).toEqual([]);
  });

  it('adds no heading, no landmark and no live region', () => {
    const { container } = render(tree());
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(container.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull();
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.queryAllByRole('complementary')).toHaveLength(0);
  });
});

// P3-05 review: the bubble sits where the Footer's links end up, and it outlives the visitor's first look.
describe('Callout out of the way', () => {
  let observers: { cb: IntersectionObserverCallback; target: Element | null; disconnected: boolean }[] = [];
  const realIO = window.IntersectionObserver;

  beforeEach(() => {
    observers = [];
    window.scrollY = 0;
    window.IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
      const entry = { cb, target: null as Element | null, disconnected: false };
      observers.push(entry);
      return {
        observe: (el: Element) => {
          entry.target = el;
        },
        disconnect: () => {
          entry.disconnected = true;
        },
        unobserve: jest.fn(),
        takeRecords: () => [],
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = realIO;
    window.scrollY = 0;
  });

  const footerShows = (isIntersecting: boolean) =>
    act(() => {
      for (const o of observers) o.cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  const scrollTo = (y: number) =>
    act(() => {
      window.scrollY = y;
      window.dispatchEvent(new Event('scroll'));
    });

  it('watches the footer', () => {
    render(tree());
    expect(observers.at(-1)?.target?.tagName).toBe('FOOTER');
  });

  it('hides while the Footer is on screen, without setting the key, and comes back when it leaves', () => {
    render(tree());
    footerShows(true);
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
    footerShows(false);
    expect(note()).not.toBeNull();
  });

  it('hides once the visitor scrolls, without setting the key; back at the top it shows again', () => {
    render(tree());
    scrollTo(120);
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
    scrollTo(0);
    expect(note()).not.toBeNull();
  });

  it('a page loaded already scrolled shows no bubble', () => {
    window.scrollY = 400;
    render(tree());
    expect(note()).toBeNull();
  });

  it('removes its listeners when it goes', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    render(tree());
    const onScroll = add.mock.calls.find(([type]) => type === 'scroll')?.[1];
    expect(onScroll).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(remove).toHaveBeenCalledWith('scroll', onScroll!);
    expect(observers.every((o) => o.disconnected)).toBe(true);
  });

  it('without IntersectionObserver it still shows', () => {
    // @ts-expect-error: an old browser
    delete window.IntersectionObserver;
    render(tree());
    expect(note()).not.toBeNull();
  });

  it('Esc dismisses it for good, like Close', () => {
    render(tree());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('an Esc another control already handled leaves it', () => {
    render(tree());
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    event.preventDefault();
    act(() => {
      document.dispatchEvent(event);
    });
    expect(note()).not.toBeNull();
  });

  it('Close hands focus to the pill, so the next Tab goes on from there', () => {
    render(tree());
    const close = screen.getByRole('button', { name: 'Close' });
    close.focus();
    fireEvent.click(close);
    expect(screen.getByRole('button', { name: 'pill' })).toHaveFocus();
  });

  it('Esc with focus on Close hands focus to the pill too', () => {
    render(tree());
    screen.getByRole('button', { name: 'Close' }).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'pill' })).toHaveFocus();
  });

  it('Esc with focus elsewhere on the page leaves focus there', () => {
    render(tree());
    const link = screen.getByRole('link', { name: 'Email' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(note()).toBeNull();
    expect(link).toHaveFocus();
  });

  it('a call under way hides it: Connect counts as having found it', async () => {
    render(tree());
    await act(async () => {
      await ctx.connect();
    });
    expect(note()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe('1');
  });
});
