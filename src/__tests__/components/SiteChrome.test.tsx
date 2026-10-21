import { act, render, screen } from '@testing-library/react';
import SiteChrome from '@/components/SiteChrome';
import { useConcierge } from '@/components/concierge/ConciergeProvider';
import TalkSession from '@/components/talk/TalkSession';
import { addAgent, lastRoom, resetRooms } from '@/__mocks__/livekit-client';
import { talkPage, talkWidget } from '@/lib/data';

let mockPath = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

function renderAt(pathname: string) {
  mockPath = pathname;
  return render(
    <SiteChrome>
      <p>child</p>
    </SiteChrome>
  );
}

describe('SiteChrome', () => {
  it('/card: renders children only, no nav, no footer, no pt-16 wrapper', () => {
    const { container, getByText } = renderAt('/card');
    expect(getByText('child')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('.pt-16')).toBeNull();
  });

  it('/card/qr: renders children only', () => {
    const { container, getByText } = renderAt('/card/qr');
    expect(getByText('child')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('.pt-16')).toBeNull();
  });

  it('/: nav, offset and footer (D19)', () => {
    const { container, getByText } = renderAt('/');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).toContainElement(getByText('child'));
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('/about: nav, offset and footer', () => {
    const { container, getByText } = renderAt('/about');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).toContainElement(getByText('child'));
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('/cardigan: keeps the chrome', () => {
    const { container } = renderAt('/cardigan');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });

  // Keyboard users skip the eight nav links on every page (M2-06)
  it('/: a skip link to the content comes first', () => {
    const { container, getByRole } = renderAt('/');
    const skip = getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#content');
    expect(container.querySelector('a')).toBe(skip);
    const target = container.querySelector('#content');
    expect(target).toContainElement(container.querySelector('p'));
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('/card: no skip link', () => {
    const { queryByRole } = renderAt('/card');
    expect(queryByRole('link', { name: 'Skip to content' })).toBeNull();
  });
  // VC4-03, D61: the floating link to /talk, last in the chrome, everywhere but /talk and /card*
  const widget = () => screen.queryByRole('link', { name: 'Talk to my voice concierge' });

  it.each(['/', '/about', '/projects/agent-harness'])('%s: the voice widget comes after the Footer', (path) => {
    const { container } = renderAt(path);
    const link = widget();
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', '/talk');
    const footer = container.querySelector('footer')!;
    expect(footer.compareDocumentPosition(link!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(footer).not.toContainElement(link);
  });

  it('/talk: no voice widget, Navbar and Footer kept', () => {
    const { container } = renderAt('/talk');
    expect(widget()).toBeNull();
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it.each(['/card', '/card/qr'])('%s: no voice widget', (path) => {
    renderAt(path);
    expect(widget()).toBeNull();
  });

  // P3-03, D85: the concierge's call lives around the chrome, so a page's content can read it; /card* has none.
  function Probe() {
    const { state, configured } = useConcierge();
    return <p data-testid="concierge">{`${state.phase} ${configured}`}</p>;
  }

  function renderProbeAt(pathname: string, configured?: boolean) {
    mockPath = pathname;
    return render(
      <SiteChrome configured={configured}>
        <Probe />
      </SiteChrome>
    );
  }

  it.each(['/', '/about', '/talk', '/projects/agent-harness', '/evidence'])('%s: the ConciergeProvider is there', (path) => {
    renderProbeAt(path, true);
    expect(screen.getByTestId('concierge')).toHaveTextContent('idle true');
  });

  it('passes configured through, false when it is not given', () => {
    renderProbeAt('/');
    expect(screen.getByTestId('concierge')).toHaveTextContent('idle false');
  });

  it.each(['/card', '/card/qr'])('%s: no ConciergeProvider', (path) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderProbeAt(path, true)).toThrow('useConcierge must be used inside ConciergeProvider');
    jest.restoreAllMocks();
  });

  // D85: a client-side navigation changes the pathname and the page under SiteChrome; the provider, and the call,
  // stay. The widget on the next page shows the call is still on and leads back to Leave.
  describe('a live call across a navigation', () => {
    const realFetch = global.fetch;
    beforeEach(() => {
      localStorage.clear();
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ url: 'wss://concierge.test.invalid', token: 'test-token' }),
      })) as unknown as typeof fetch;
    });
    afterEach(() => {
      global.fetch = realFetch;
      resetRooms();
    });

    const flush = () =>
      act(async () => {
        for (let i = 0; i < 30; i++) await Promise.resolve();
      });

    it('/talk → /about keeps the Room connected, and the widget names the live call', async () => {
      mockPath = '/talk';
      const { rerender } = render(
        <SiteChrome configured>
          <TalkSession />
        </SiteChrome>
      );
      await act(async () => {
        screen.getByRole('button', { name: talkPage.labels.connect }).click();
      });
      await flush();
      const room = lastRoom();
      await act(async () => {
        addAgent(room, 'agent-1');
      });
      await flush();

      mockPath = '/about';
      rerender(
        <SiteChrome configured>
          <Probe />
        </SiteChrome>
      );
      expect(room.disconnect).not.toHaveBeenCalled();
      expect(screen.getByTestId('concierge')).toHaveTextContent('live true');
      expect(screen.getByRole('link', { name: talkWidget.liveLabel })).toHaveAttribute('href', '/talk');
    });

    it('with no call the widget keeps its usual name', () => {
      renderAt('/about');
      expect(screen.getByRole('link', { name: talkWidget.label })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: talkWidget.liveLabel })).toBeNull();
    });
  });
});
