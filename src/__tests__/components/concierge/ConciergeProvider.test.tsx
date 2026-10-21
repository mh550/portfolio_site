import { StrictMode, useEffect } from 'react';
import type { NavigationMock } from '@/__tests__/helpers/navigation';
import { renderToString } from 'react-dom/server';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ConciergeProvider, {
  AGENT_JOIN_TIMEOUT_MS,
  useConcierge,
  type ConciergeValue,
} from '@/components/concierge/ConciergeProvider';
import {
  MockRoom,
  RoomEvent,
  addAgent,
  lastRoom,
  removeParticipant,
  resetRooms,
  restart,
  pushText,
  setSpeakers,
} from '@/__mocks__/livekit-client';
import { AGENT_QUIET_MS } from '@/components/concierge/ConciergeProvider';
import { talkPage } from '@/lib/data/concierge';
import { renderTalk } from '@/__tests__/helpers/concierge';
import TalkSession from '@/components/talk/TalkSession';
import { dateTime } from '@/components/talk/format';
import { parseMemory } from '@/lib/concierge/contract';
import { memoryCacheKey, saveMemory } from '@/lib/concierge/memoryCache';
import { VISITOR_ID_KEY } from '@/lib/concierge/visitorId';
import { emptyMemoryJson, memoryJson, memoryV2Json } from '@/__tests__/fixtures/concierge';

// P3-08: the provider calls useRouter() (the usher), so next/navigation is mocked (helpers/navigation.ts).
jest.mock('next/navigation', () => jest.requireActual<NavigationMock>('@/__tests__/helpers/navigation').mockNavigation);

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

  // P3-10 review: LiveKit's own page-leave disconnect fires on `beforeunload`, which a mailto: link (the Footer's)
  // raises in some browsers without leaving the page; the provider's pagehide teardown covers real leaves.
  it('a beforeunload that does not leave the page keeps the call live', async () => {
    renderProbe();
    const room = await goLive();
    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });
    expect(room.disconnect).not.toHaveBeenCalled();
    expect(phase()).toBe('live');
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
    expect(room.registerTextStreamHandler).toHaveBeenCalledTimes(4); // memory, metrics, navigate, transcription
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

// P3-05, D87: the pill's bars move while the agent speaks. LiveKit's ActiveSpeakersChanged lists who speaks now.
describe('ConciergeProvider: agentSpeaking', () => {
  it('is false before a call and false while live until the agent speaks', async () => {
    renderProbe();
    expect(ctx.agentSpeaking).toBe(false);
    await goLive();
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('follows the agent identity in the speakers list', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    expect(ctx.agentSpeaking).toBe(true);
    act(() => setSpeakers(room, ['visitor-test', 'agent-1']));
    expect(ctx.agentSpeaking).toBe(true);
    act(() => setSpeakers(room, ['visitor-test']));
    // A pause between words is not the end of the reply: speaking holds AGENT_QUIET_MS (review: a screen reader
    // re-reads a focused button's name each time it changes)
    expect(ctx.agentSpeaking).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, AGENT_QUIET_MS + 50));
    });
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('holds through a short pause, and a pause that lasts turns it off', async () => {
    jest.useFakeTimers();
    try {
      renderProbe();
      const room = await goLive();
      act(() => setSpeakers(room, ['agent-1']));
      act(() => setSpeakers(room, []));
      act(() => jest.advanceTimersByTime(AGENT_QUIET_MS - 100));
      act(() => setSpeakers(room, ['agent-1']));
      act(() => jest.advanceTimersByTime(AGENT_QUIET_MS));
      expect(ctx.agentSpeaking).toBe(true);
      act(() => setSpeakers(room, []));
      act(() => jest.advanceTimersByTime(AGENT_QUIET_MS - 1));
      expect(ctx.agentSpeaking).toBe(true);
      act(() => jest.advanceTimersByTime(1));
      expect(ctx.agentSpeaking).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('goes false at once when the room starts reconnecting', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    await act(async () => {
      restart(room);
      room.emit(RoomEvent.Reconnecting);
    });
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('goes false on a new Connect while the agent speaks', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    await act(async () => {
      await ctx.connect();
    });
    expect(room.disconnect).toHaveBeenCalled();
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('another participant speaking is not the agent', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['someone-else']));
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('speakers before the agent joined count for nothing', async () => {
    renderProbe();
    await act(async () => {
      await ctx.connect();
    });
    await flush();
    const room = lastRoom();
    act(() => setSpeakers(room, ['agent-1']));
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('goes false on Leave, and the listener comes off', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    expect(ctx.agentSpeaking).toBe(true);
    act(() => ctx.leave());
    expect(ctx.agentSpeaking).toBe(false);
    expect(room.listenerCount('activeSpeakersChanged')).toBe(0);
  });

  it('goes false when the agent drops mid-sentence', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    await act(async () => {
      removeParticipant(room, 'agent-1');
    });
    await flush();
    expect(phase()).toBe('ended');
    expect(ctx.agentSpeaking).toBe(false);
  });

  it('goes false on pagehide', async () => {
    renderProbe();
    const room = await goLive();
    act(() => setSpeakers(room, ['agent-1']));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(ctx.agentSpeaking).toBe(false);
  });
});

// P3-05, D88: the first-visit callout's state lives here, so opening the panel hides it for good on this page too.
describe('ConciergeProvider: the callout', () => {
  const KEY = 'concierge.callout_seen';

  it('reads the key after mount: absent means not seen', () => {
    renderProbe();
    expect(ctx.calloutSeen).toBe(false);
  });

  it('a stored key means seen', () => {
    localStorage.setItem(KEY, '1');
    renderProbe();
    expect(ctx.calloutSeen).toBe(true);
  });

  it('dismissCallout() sets the key and hides it', () => {
    renderProbe();
    act(() => ctx.dismissCallout());
    expect(ctx.calloutSeen).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('openPanel() dismisses it too', () => {
    renderProbe();
    act(() => ctx.openPanel());
    expect(ctx.panel).toBe('open');
    expect(ctx.calloutSeen).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('a storage whose getItem throws reads as a first visit, with no error', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    renderProbe();
    expect(ctx.calloutSeen).toBe(false);
  });

  it('a storage whose setItem throws still hides it for this page', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    renderProbe();
    act(() => ctx.dismissCallout());
    expect(ctx.calloutSeen).toBe(true);
  });
});

// P3-07 (D91, plan § Cache): the last memory body per visitor id, shown greyed with "as of" before a call.
describe('ConciergeProvider: the memory cache', () => {
  const ID = '0b6f1d2e-3c4a-4b5d-8e6f-7a8b9c0d1e2f';
  const OTHER = '11111111-2222-4333-8444-555555555555';
  // An hour ago, so the copy is inside its 30 days whenever the suite runs.
  const SAVED_AT = new Date(Date.now() - 3_600_000).toISOString();
  const seed = (visitorId: string | null, cachedFor = ID, body = memoryV2Json) => {
    if (visitorId) localStorage.setItem(VISITOR_ID_KEY, visitorId);
    saveMemory(localStorage, cachedFor, body, SAVED_AT);
  };
  const memoryTab = () => screen.getByRole('tabpanel', { name: talkPage.headings.memory });
  const stale = () => memoryTab().querySelector('[data-stale="true"]');
  const asOf = () => `${talkPage.memoryView.asOf} ${dateTime(SAVED_AT)}`;

  it('loads the cached body for the stored visitor id after mount', () => {
    seed(ID);
    renderProbe();
    expect(ctx.cachedMemory).toEqual({ body: parseMemory(memoryV2Json), savedAt: SAVED_AT });
  });

  it('nothing is read in the first render, so the server HTML has no cached memory', () => {
    seed(ID);
    const html = renderToString(
      <ConciergeProvider configured>
        <TalkSession />
      </ConciergeProvider>
    );
    expect(html).not.toContain('data-stale');
    expect(html).not.toContain('Lisbon');
  });

  it('before a call the Memory tab shows the cached body greyed, with "as of" its time', () => {
    seed(ID);
    renderTalk();
    expect(stale()).not.toBeNull();
    expect(within(memoryTab()).getByText(asOf())).toBeInTheDocument();
    expect(within(stale() as HTMLElement).getByText('Lisbon')).toBeInTheDocument();
    // The strip counts the cached body too, greyed alike.
    expect(screen.getByRole('list', { name: `${talkPage.memoryView.strip}, ${asOf()}` })).toHaveAttribute('data-stale', 'true');
  });

  it('another visitor id loads nothing', () => {
    seed(OTHER, ID);
    renderProbe();
    expect(ctx.cachedMemory).toBeNull();
  });

  it('no visitor id: no cache read and no id written (D45)', () => {
    seed(null, ID);
    const getItem = jest.spyOn(Storage.prototype, 'getItem');
    renderProbe();
    expect(ctx.cachedMemory).toBeNull();
    expect(getItem.mock.calls.map(([key]) => key)).not.toContain(memoryCacheKey(ID));
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  });

  it('a storage that throws loads nothing, with no error', () => {
    seed(ID);
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderProbe();
    expect(ctx.cachedMemory).toBeNull();
  });

  it('a live body replaces it: saved under the id the token request sent, and shown fresh', async () => {
    seed(ID);
    renderTalk();
    fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
    await flush();
    const room = lastRoom();
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    expect(stale()).not.toBeNull();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).visitor_id).toBe(ID);
    expect(stale()).toBeNull();
    expect(within(memoryTab()).queryByText(asOf())).toBeNull();
    const stored = JSON.parse(localStorage.getItem(memoryCacheKey(ID)) ?? 'null');
    expect(stored).toMatchObject({ v: 1, body: memoryJson });
    expect(Date.parse(stored.savedAt)).not.toBeNaN();
    expect(stored.savedAt).not.toBe(SAVED_AT);
  });

  it('after Leave the body just received is the cached one, greyed', async () => {
    renderProbe();
    const room = await goLive();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    expect(ctx.cachedMemory?.body).toEqual(parseMemory(memoryJson));
    act(() => ctx.leave());
    expect(ctx.state.memory).toBeNull();
    expect(ctx.cachedMemory?.body).toEqual(parseMemory(memoryJson));
  });

  it('a body the parser rejects is neither shown nor cached', async () => {
    seed(ID);
    renderProbe();
    const room = await goLive();
    await act(() => pushText(room, 'concierge.memory', '{"visitor":1}'));
    expect(ctx.cachedMemory?.savedAt).toBe(SAVED_AT);
    expect(ctx.state.memory).toBeNull();
    expect(JSON.parse(localStorage.getItem(memoryCacheKey(ID))!).savedAt).toBe(SAVED_AT);
  });

  // D96: the browser's copy goes when the server's does.
  it('a copy older than its retention is not shown and is removed', () => {
    localStorage.setItem(VISITOR_ID_KEY, ID);
    saveMemory(localStorage, ID, memoryV2Json, new Date(Date.now() - 31 * 86_400_000).toISOString());
    renderProbe();
    expect(ctx.cachedMemory).toBeNull();
    expect(localStorage.getItem(memoryCacheKey(ID))).toBeNull();
  });

  it('another tab saving or clearing the copy updates this one (storage event)', () => {
    seed(ID);
    renderProbe();
    expect(ctx.cachedMemory).not.toBeNull();
    const fire = (key: string | null) =>
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key }));
      });
    localStorage.removeItem(memoryCacheKey(ID));
    fire(memoryCacheKey(ID));
    expect(ctx.cachedMemory).toBeNull();
    saveMemory(localStorage, ID, memoryJson, SAVED_AT);
    fire('unrelated.key');
    expect(ctx.cachedMemory).toBeNull();
    fire(memoryCacheKey(ID));
    expect(ctx.cachedMemory?.body).toEqual(parseMemory(memoryJson));
    localStorage.clear();
    fire(null);
    expect(ctx.cachedMemory).toBeNull();
  });

  it('removes its storage listener on unmount', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderProbe();
    const handler = add.mock.calls.find(([type]) => type === 'storage')?.[1];
    expect(handler).toBeDefined();
    unmount();
    expect(remove).toHaveBeenCalledWith('storage', handler);
  });

  it('Forget me clears the cache, "Forgotten" replaces the view, and the final empty body is not kept', async () => {
    seed(ID);
    renderTalk();
    fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
    await flush();
    const room = lastRoom();
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    await flush();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    fireEvent.click(screen.getByRole('button', { name: talkPage.labels.forgetMe }));
    fireEvent.click(screen.getByRole('button', { name: talkPage.labels.erase }));
    await flush();
    expect(localStorage.getItem(memoryCacheKey(ID))).toBeNull();
    expect(within(memoryTab()).queryByText('Lisbon')).toBeNull();
    expect(within(memoryTab()).queryByText(talkPage.empty.memory)).toBeNull();
    expect(within(memoryTab()).getByText(talkPage.status.forgotten)).toBeInTheDocument();
    // The agent's last word before it ends the call (spec § 4): an empty body, not cached, not shown.
    await act(() => pushText(room, 'concierge.memory', emptyMemoryJson));
    await act(async () => {
      room.emit(RoomEvent.Disconnected);
    });
    expect(localStorage.getItem(memoryCacheKey(ID))).toBeNull();
    expect(stale()).toBeNull();
    expect(within(memoryTab()).getByText(talkPage.status.forgotten)).toBeInTheDocument();
    expect(within(memoryTab()).queryByText(talkPage.empty.memory)).toBeNull();
  });
});

// Review (P3-07): Leave during the closing wait settles connect(), so nothing awaiting it hangs.
describe('ConciergeProvider: closing', () => {
  it('connect() settles when Leave ends the wait', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockResolvedValue(reply(429, { error: 'busy', reason: 'visitor' }));
      renderProbe();
      let settled = false;
      act(() => {
        void ctx.connect().then(() => (settled = true));
      });
      await flush();
      expect(phase()).toBe('closing');
      act(() => ctx.leave());
      await flush();
      expect(settled).toBe(true);
      expect(phase()).toBe('idle');
    } finally {
      jest.useRealTimers();
    }
  });
});
