import { StrictMode, useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import ConciergeProvider, {
  AGENT_JOIN_TIMEOUT_MS,
  useConcierge,
  type ConciergeValue,
} from '@/components/concierge/ConciergeProvider';
import { MockRoom, addAgent, lastRoom, resetRooms } from '@/__mocks__/livekit-client';
import { talkPage } from '@/lib/data/concierge';
import { renderTalk } from '@/__tests__/helpers/concierge';

// P3-03, D85: the provider owns the one Room above the pages, so a call outlives the view that started it.

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const OK = reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' });
const realFetch = global.fetch;
let fetchMock: jest.Mock;

beforeEach(() => {
  localStorage.clear();
  fetchMock = jest.fn(async () => OK);
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  resetRooms();
  jest.restoreAllMocks();
});

const flush = () =>
  act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });

// Reads the context the way the drawer and the widget will; the effect hands the latest value to the test.
let ctx: ConciergeValue;
function Probe() {
  const value = useConcierge();
  useEffect(() => {
    ctx = value;
  });
  return <p data-testid="phase">{value.state.phase}</p>;
}
const phase = () => screen.getByTestId('phase').textContent;

function renderProbe({ configured = true } = {}) {
  return render(
    <ConciergeProvider configured={configured}>
      <Probe />
    </ConciergeProvider>
  );
}

async function goLive() {
  await act(async () => {
    await ctx.connect();
  });
  await flush();
  const room = lastRoom();
  await act(async () => {
    addAgent(room, 'agent-1');
  });
  await flush();
  return room;
}

describe('useConcierge', () => {
  it('throws outside a ConciergeProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useConcierge must be used inside ConciergeProvider');
  });

  it('starts idle with no Room and carries the configured prop', () => {
    renderProbe({ configured: false });
    expect(phase()).toBe('idle');
    expect(ctx.room).toBeNull();
    expect(ctx.configured).toBe(false);
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('exports the agent join timeout the sessions use', () => {
    expect(AGENT_JOIN_TIMEOUT_MS).toBe(10_000);
  });
});

describe('ConciergeProvider: the call outlives TalkSession', () => {
  it('a live call survives TalkSession unmounting and remounting under the same provider', async () => {
    const { unmountTalk, remountTalk } = renderTalk();
    await act(async () => {
      screen.getByRole('button', { name: talkPage.labels.connect }).click();
    });
    await flush();
    const room = lastRoom();
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.status.live);

    unmountTalk();
    expect(screen.queryByRole('status')).toBeNull();
    expect(room.disconnect).not.toHaveBeenCalled();
    expect(room.unregisterTextStreamHandler).not.toHaveBeenCalled();

    remountTalk();
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.status.live);
    expect(screen.getByRole('button', { name: talkPage.labels.leave })).toBeInTheDocument();
    expect(room.disconnect).not.toHaveBeenCalled();
    expect(MockRoom.instances).toHaveLength(1);
  });

  it('unmounting the provider itself (leaving the chrome) ends the call', async () => {
    const { unmount } = renderProbe();
    const room = await goLive();
    unmount();
    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('ConciergeProvider: ending the call', () => {
  it('leave() disconnects once and returns to idle', async () => {
    renderProbe();
    const room = await goLive();
    expect(phase()).toBe('live');
    act(() => ctx.leave());
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(phase()).toBe('idle');
    expect(ctx.room).toBeNull();
  });

  it('pagehide disconnects the room', async () => {
    renderProbe();
    const room = await goLive();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(room.textHandlers.size).toBe(0);
  });

  it('pagehide with no call does nothing', () => {
    renderProbe();
    expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow();
    expect(phase()).toBe('idle');
  });

  it('a page restored from the bfcache (pageshow, persisted) goes back to idle', async () => {
    renderProbe();
    await goLive();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    const restored = new Event('pageshow');
    Object.defineProperty(restored, 'persisted', { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });
    expect(phase()).toBe('idle');
    expect(ctx.room).toBeNull();
  });

  // Review Minor 1: only a call that pagehide actually ended is reset; an ended state (offline, Forgotten) is kept.
  it('a bfcache restore after no call was torn down keeps the state it had', async () => {
    renderProbe({ configured: false });
    await act(async () => {
      await ctx.connect();
    });
    expect(phase()).toBe('offline');
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    const restored = new Event('pageshow');
    Object.defineProperty(restored, 'persisted', { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });
    expect(phase()).toBe('offline');
  });

  it('a pageshow that is not a bfcache restore leaves the call alone', async () => {
    renderProbe();
    const room = await goLive();
    act(() => {
      window.dispatchEvent(new Event('pageshow'));
    });
    expect(phase()).toBe('live');
    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('removes the same page listeners it added, on unmount', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderProbe();
    const added = add.mock.calls.filter(([type]) => type === 'pagehide' || type === 'pageshow');
    expect(added.map(([type]) => type).sort()).toEqual(['pagehide', 'pageshow']);
    unmount();
    for (const [type, handler] of added) expect(remove).toHaveBeenCalledWith(type, handler);
  });
});

describe('ConciergeProvider: one Room at a time', () => {
  const connected = () => MockRoom.instances.filter((room) => room.state === 'connected');

  it('two Connects in a row, both in flight, make one Room', async () => {
    renderProbe();
    await act(async () => {
      void ctx.connect();
      void ctx.connect();
    });
    await flush();
    expect(MockRoom.instances).toHaveLength(1);
    expect(connected()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('a Connect during a live call disconnects the first Room before making the second', async () => {
    renderProbe();
    const first = await goLive();
    await act(async () => {
      await ctx.connect();
    });
    await flush();
    expect(MockRoom.instances).toHaveLength(2);
    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(connected()).toEqual([lastRoom()]);
  });

  it('under StrictMode, a Connect makes one Room with each topic registered once, and pagehide still ends it', async () => {
    render(
      <StrictMode>
        <ConciergeProvider configured>
          <Probe />
        </ConciergeProvider>
      </StrictMode>
    );
    expect(MockRoom.instances).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    const room = await goLive();
    expect(MockRoom.instances).toHaveLength(1);
    expect(room.registerTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(phase()).toBe('live');
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('configured={false}: connect goes offline with no request and no Room', async () => {
    renderProbe({ configured: false });
    await act(async () => {
      await ctx.connect();
    });
    expect(phase()).toBe('offline');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(MockRoom.instances).toHaveLength(0);
  });
});
