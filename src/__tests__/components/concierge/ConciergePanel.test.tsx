import { act, fireEvent, render, screen } from '@testing-library/react';
import SiteChrome from '@/components/SiteChrome';
import ConciergePanel from '@/components/concierge/ConciergePanel';
import ConciergeProvider from '@/components/concierge/ConciergeProvider';
import { addAgent, lastRoom, removeParticipant, resetRooms } from '@/__mocks__/livekit-client';
import { talkPage, talkWidget } from '@/lib/data/concierge';

// P3-04, D86: the widget opens a non-modal drawer with the call controls, the transcript and the message box;
// Minimize and Esc close it and leave the call alone (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Panel).

let mockPath = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const realFetch = global.fetch;

beforeEach(() => {
  mockPath = '/';
  localStorage.clear();
  global.fetch = jest.fn(async () =>
    reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' })
  ) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  resetRooms();
});

const flush = () =>
  act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });

function renderChrome(pathname = '/', configured = true) {
  mockPath = pathname;
  return render(
    <SiteChrome configured={configured}>
      <a href="#page">a link on the page</a>
    </SiteChrome>
  );
}

const widget = () => screen.getByRole('button', { name: talkWidget.label });
const dialog = () => screen.queryByRole('dialog');
const classesOf = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

function open() {
  fireEvent.click(widget());
  return screen.getByRole('dialog', { name: talkWidget.panelTitle });
}

describe('ConciergePanel', () => {
  it('is not in the DOM until the widget opens it', () => {
    renderChrome();
    expect(dialog()).toBeNull();
    expect(document.getElementById('concierge-panel')).toBeNull();
  });

  it('is a non-modal dialog named by its header title', () => {
    renderChrome();
    const panel = open();
    expect(panel).toHaveAttribute('aria-modal', 'false');
    expect(panel).toHaveAttribute('id', 'concierge-panel');
    const title = screen.getByRole('heading', { level: 2, name: talkWidget.panelTitle });
    expect(panel).toHaveAttribute('aria-labelledby', title.id);
    expect(title).toHaveAttribute('tabindex', '-1');
  });

  it('header: title, Minimize, Connect; then the transcript log, then the message box', () => {
    renderChrome();
    const panel = open();
    const order = [
      screen.getByRole('heading', { name: talkWidget.panelTitle }),
      screen.getByRole('button', { name: 'Minimize' }),
      screen.getByRole('button', { name: talkPage.labels.connect }),
      screen.getByRole('log'),
      screen.getByRole('textbox', { name: talkPage.labels.message }),
      screen.getByRole('button', { name: talkPage.labels.send }),
    ];
    for (const el of order) expect(panel).toContainElement(el);
    order.slice(1).forEach((el, i) => {
      expect(order[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    // No mic toggle before the call is live
    expect(screen.queryByRole('button', { name: talkPage.labels.micOn })).toBeNull();
    expect(screen.queryByRole('button', { name: talkPage.labels.micOff })).toBeNull();
  });

  it('the transcript is the region that grows', () => {
    renderChrome();
    open();
    const log = screen.getByRole('log');
    expect(classesOf(log)).toEqual(expect.arrayContaining(['flex-1', 'min-h-0', 'overflow-y-auto']));
    expect(classesOf(log)).not.toContain('max-h-80');
  });

  it('a 420 px right drawer at lg, a bottom sheet under the Navbar below it, z-[45]', () => {
    renderChrome();
    const classes = classesOf(open());
    for (const token of ['fixed', 'z-[45]', 'inset-x-0', 'bottom-0', 'top-16', 'max-h-dvh', 'flex', 'flex-col']) {
      expect(classes).toContain(token);
    }
    for (const token of ['lg:left-auto', 'lg:right-0', 'lg:w-[420px]']) expect(classes).toContain(token);
    expect(classes).toContain('print:hidden');
  });

  it('opening moves focus to the header title', () => {
    renderChrome();
    open();
    expect(screen.getByRole('heading', { name: talkWidget.panelTitle })).toHaveFocus();
  });

  it('Minimize closes it and hands focus back to the widget', () => {
    renderChrome();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(dialog()).toBeNull();
    expect(widget()).toHaveFocus();
    expect(widget()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Esc inside it closes it and hands focus back to the widget', () => {
    renderChrome();
    open();
    const connect = screen.getByRole('button', { name: talkPage.labels.connect });
    connect.focus();
    fireEvent.keyDown(connect, { key: 'Escape' });
    expect(dialog()).toBeNull();
    expect(widget()).toHaveFocus();
  });

  it('an Esc another control already handled leaves it open', () => {
    renderChrome();
    const panel = open();
    const input = screen.getByRole('textbox', { name: talkPage.labels.message });
    input.addEventListener('keydown', (event) => event.preventDefault());
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(panel).toBeInTheDocument();
  });

  it('other keys leave it open', () => {
    renderChrome();
    const panel = open();
    fireEvent.keyDown(panel, { key: 'Enter' });
    expect(dialog()).not.toBeNull();
  });

  it('the widget toggles it: aria-expanded and aria-controls only while it is open', () => {
    renderChrome();
    expect(widget()).toHaveAttribute('aria-expanded', 'false');
    expect(widget()).not.toHaveAttribute('aria-controls');
    open();
    expect(widget()).toHaveAttribute('aria-expanded', 'true');
    expect(widget()).toHaveAttribute('aria-controls', 'concierge-panel');
    fireEvent.click(widget());
    expect(dialog()).toBeNull();
  });

  it('leaves the page behind usable: no inert, no focus trap, no scroll lock', () => {
    const { container } = renderChrome();
    const bodyClasses = document.body.className;
    const bodyStyle = document.body.getAttribute('style');
    open();
    expect(container.querySelector('[inert]')).toBeNull();
    expect(document.body.className).toBe(bodyClasses);
    expect(document.body.getAttribute('style')).toBe(bodyStyle);
    // No trap: Tab off the last control is not held back, and focus on the page leaves the dialog open
    const send = screen.getByRole('button', { name: talkPage.labels.send });
    expect(fireEvent.keyDown(send, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(send, { key: 'Tab', shiftKey: true })).toBe(true);
    const pageLink = screen.getByRole('link', { name: 'a link on the page' });
    pageLink.focus();
    expect(pageLink).toHaveFocus();
    expect(dialog()).not.toBeNull();
  });

  // Review (P3-04): the open sheet hides the widget, so the widget leaves the tab order while the panel is open
  it('the widget is invisible while the panel covers it, and visible again after', () => {
    renderChrome();
    open();
    expect(classesOf(widget())).toContain('invisible');
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(classesOf(widget())).not.toContain('invisible');
  });

  it('an Esc that ends an IME composition leaves it open', () => {
    renderChrome();
    const panel = open();
    fireEvent.keyDown(panel, { key: 'Escape', isComposing: true });
    expect(dialog()).not.toBeNull();
  });

  it('a short screen scrolls the sheet, not the page; the log contains its own scroll', () => {
    renderChrome();
    expect(classesOf(open())).toContain('overflow-y-auto');
    // The transcript section keeps a floor (log + message box), so below it the sheet scrolls instead of clipping
    expect(classesOf(screen.getByRole('log'))).toContain('overscroll-contain');
    expect(classesOf(screen.getByRole('log').closest('section')!)).toContain('min-h-52');
  });

  it('"Read how it works" closes the panel, so the page it opens is not under the sheet', async () => {
    renderChrome('/', false);
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
    });
    fireEvent.click(screen.getByRole('link', { name: talkPage.deepDiveLabel }));
    expect(dialog()).toBeNull();
  });

  it('sits after the Footer and before the widget', () => {
    const { container } = renderChrome('/about');
    const panel = open();
    const footer = container.querySelector('footer')!;
    expect(footer.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panel.compareDocumentPosition(widget()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('stays open across a client-side navigation', () => {
    const { rerender } = renderChrome('/');
    open();
    mockPath = '/projects';
    rerender(
      <SiteChrome configured>
        <p>projects</p>
      </SiteChrome>
    );
    expect(screen.getByRole('dialog', { name: talkWidget.panelTitle })).toBeInTheDocument();
  });

  it('offline: shows the status line and the deep-dive link', async () => {
    renderChrome('/', false);
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
    });
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
    expect(screen.getByRole('link', { name: talkPage.deepDiveLabel })).toHaveAttribute('href', talkPage.deepDiveHref);
  });

  it('renders nothing outside an open panel even when mounted directly', () => {
    const { container } = render(
      <ConciergeProvider configured={false}>
        <ConciergePanel />
      </ConciergeProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  describe('during a live call', () => {
    async function goLive() {
      renderChrome('/');
      open();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
      });
      await flush();
      const room = lastRoom();
      await act(async () => {
        addAgent(room, 'agent-1');
      });
      await flush();
      return room;
    }

    it('shows Leave and the mic toggle in the header', async () => {
      await goLive();
      expect(screen.getByRole('button', { name: talkPage.labels.leave })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: talkPage.labels.micOn })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: talkPage.labels.message })).toBeEnabled();
    });

    it('Minimize keeps the Room and the call; reopening shows it still live', async () => {
      const room = await goLive();
      fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
      expect(dialog()).toBeNull();
      expect(room.disconnect).not.toHaveBeenCalled();
      const live = screen.getByRole('button', { name: talkWidget.listening });
      expect(live).toHaveFocus();
      fireEvent.click(live);
      expect(screen.getByRole('button', { name: talkPage.labels.leave })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(talkPage.status.live);
    });

    it('Esc from the focused message box keeps the Room and the call, and focus goes to the live widget', async () => {
      const room = await goLive();
      const input = screen.getByRole('textbox', { name: talkPage.labels.message });
      input.focus();
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(dialog()).toBeNull();
      expect(room.disconnect).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: talkWidget.listening })).toHaveFocus();
    });

    it('the live widget is named for the call whether the panel is open or not', async () => {
      await goLive();
      expect(screen.getByRole('button', { name: talkWidget.listening })).toHaveAttribute('aria-expanded', 'true');
      expect(talkWidget.listening).toBe('Ask my site: listening');
    });

    it('a dropped call with focus on the message box hands focus to Connect in the panel', async () => {
      const room = await goLive();
      screen.getByRole('textbox', { name: talkPage.labels.message }).focus();
      await act(async () => {
        removeParticipant(room, 'agent-1');
      });
      await flush();
      const connect = screen.getByRole('button', { name: talkPage.labels.connect });
      expect(screen.getByRole('dialog')).toContainElement(connect);
      expect(connect).toHaveFocus();
    });

    it('Leave in the panel ends the call and keeps the panel open', async () => {
      const room = await goLive();
      fireEvent.click(screen.getByRole('button', { name: talkPage.labels.leave }));
      expect(room.disconnect).toHaveBeenCalled();
      expect(dialog()).not.toBeNull();
      expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeInTheDocument();
    });
  });
});

describe('ConciergePanel is never on /talk or /card*', () => {
  it('/talk: no widget and no panel', () => {
    renderChrome('/talk');
    expect(screen.queryByRole('button', { name: talkWidget.label })).toBeNull();
    expect(dialog()).toBeNull();
  });

  // Review (P3-04): /talk is the full view of the call, so reaching it closes the panel for good
  it('an open panel closes on /talk and stays closed after it', () => {
    const { rerender } = renderChrome('/');
    open();
    mockPath = '/talk';
    rerender(
      <SiteChrome configured>
        <p>talk</p>
      </SiteChrome>
    );
    expect(dialog()).toBeNull();
    mockPath = '/about';
    rerender(
      <SiteChrome configured>
        <p>about</p>
      </SiteChrome>
    );
    expect(dialog()).toBeNull();
    expect(screen.getByRole('button', { name: talkWidget.label })).toHaveAttribute('aria-expanded', 'false');
  });

  it.each(['/card', '/card/qr'])('%s: no widget and no panel', (path) => {
    renderChrome(path);
    expect(screen.queryByRole('button')).toBeNull();
    expect(dialog()).toBeNull();
  });
});
