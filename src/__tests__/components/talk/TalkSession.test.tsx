import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AGENT_JOIN_TIMEOUT_MS } from '@/components/concierge/ConciergeProvider';
import { renderTalk } from '@/__tests__/helpers/concierge';
import {
  MockRoom,
  ParticipantKind,
  addAgent,
  lastRoom,
  pushText,
  removeParticipant,
  resetRooms,
  restart,
} from '@/__mocks__/livekit-client';
import { isUuidV4, VISITOR_ID_KEY } from '@/lib/concierge/visitorId';
import { talkPage } from '@/lib/data';
import { memoryJson, metricsFullJson } from '@/__tests__/fixtures/concierge';

const TOPICS = ['concierge.memory', 'concierge.metrics', 'lk.transcription'];

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const OK = reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' });

const newFetchMock = () => jest.fn<(url: string, init: RequestInit) => Promise<unknown>>();
let fetchMock: ReturnType<typeof newFetchMock>;
const realFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
  fetchMock = newFetchMock();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  resetRooms();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const status = () => screen.getByRole('status');
// Every setMicrophoneEnabled call on every Room this test made.
const micCalls = () => MockRoom.instances.flatMap((room) => room.localParticipant.setMicrophoneEnabled.mock.calls);
const sentId = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body as string).visitor_id;
// Drains the fetch → res.json() → connect() promise chain inside one act scope, so every update it makes renders.
const flush = () =>
  act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });

async function connect(user = userEvent.setup()) {
  await user.click(screen.getByRole('button', { name: talkPage.labels.connect }));
  await flush();
}

// Under fake timers React's scheduler (setTimeout) is frozen, so an update made outside act() never renders: click
// synchronously, then flush.
async function connectWithFakeTimers() {
  fireEvent.click(screen.getByRole('button', { name: talkPage.labels.connect }));
  await flush();
}

function expectOffline() {
  expect(status()).toHaveTextContent(new RegExp(`^${talkPage.offlineMessage}$`));
  expect(screen.getByRole('link', { name: talkPage.deepDiveLabel })).toHaveAttribute('href', '/projects/voice-concierge');
}

describe('TalkSession: before Connect', () => {
  it('shows Connect and no offline line, and touches nothing on mount', () => {
    renderTalk();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    // No Room, so nothing could ask for the microphone (VC5-02).
    expect(MockRoom.instances).toHaveLength(0);
    expect(micCalls()).toEqual([]);
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
  });

  // P3-06, D90: the transcript, then the memory strip and the Memory · Latency · Privacy tabs.
  it('renders the transcript, the memory strip and the three tabs, empty', () => {
    renderTalk();
    expect(screen.getByRole('heading', { level: 2, name: 'Transcript' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: talkPage.memoryView.strip })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Memory', 'Latency', 'Privacy']);
    expect(screen.getByRole('tabpanel', { name: 'Memory' })).toHaveTextContent(talkPage.empty.memory);
  });

  it('puts the strip and the tabs after the message box, with no height cap (not compact)', () => {
    renderTalk();
    const box = screen.getByRole('textbox', { name: talkPage.labels.message });
    const strip = screen.getByRole('list', { name: talkPage.memoryView.strip });
    expect(box.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('tabpanel', { name: 'Memory' }).className).not.toMatch(/max-h/);
    // Its own h2 (visually hidden), so heading navigation reaches the memory view on /talk.
    expect(screen.getByRole('region', { name: talkPage.memoryView.heading })).toContainElement(strip);
  });
});

describe('TalkSession: the token route', () => {
  it('POSTs the visitor id as JSON to /api/concierge/token', async () => {
    fetchMock.mockResolvedValue(reply(503, { offline: true }));
    renderTalk();
    await connect();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/concierge/token');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(isUuidV4(sentId(0))).toBe(true);
  });

  it('shows the offline line and the deep-dive link on a 503, without creating a Room', async () => {
    fetchMock.mockResolvedValue(reply(503, { offline: true }));
    renderTalk();
    await connect();
    expectOffline();
    expect(MockRoom.instances).toHaveLength(0);
    expect(micCalls()).toEqual([]);
  });

  it('when the server says LiveKit is not configured, goes offline with no request, Room or visitor id', async () => {
    renderTalk({ configured: false });
    await connect();
    expectOffline();
    expect(fetchMock).not.toHaveBeenCalled();
    // No Room, so nothing could ask for the microphone (VC5-02).
    expect(MockRoom.instances).toHaveLength(0);
    expect(micCalls()).toEqual([]);
    expect(localStorage.getItem(VISITOR_ID_KEY)).toBeNull();
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeEnabled();
    // Pressing Connect again stays offline.
    await connect();
    expectOffline();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the offline line on any other non-OK status', async () => {
    fetchMock.mockResolvedValue(reply(500, { error: 'server' }));
    renderTalk();
    await connect();
    expectOffline();
  });

  it('shows the offline line when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    renderTalk();
    await connect();
    expectOffline();
  });

  it('shows the offline line when a 200 lacks the url or token', async () => {
    fetchMock.mockResolvedValue(reply(200, { url: 'wss://concierge.test.invalid' }));
    renderTalk();
    await connect();
    expectOffline();
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('sends the id stored in localStorage, the same one on a second Connect', async () => {
    fetchMock.mockResolvedValue(reply(503, { offline: true }));
    renderTalk();
    await connect();
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    expect(isUuidV4(stored)).toBe(true);
    expect(sentId(0)).toBe(stored);
    await connect();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentId(1)).toBe(stored);
  });

  it('sends an id already in localStorage from an earlier visit', async () => {
    const earlier = '3f2b8c1e-7a4d-4e9b-9c2a-1d5e6f7a8b9c';
    localStorage.setItem(VISITOR_ID_KEY, earlier);
    fetchMock.mockResolvedValue(reply(503, { offline: true }));
    renderTalk();
    await connect();
    expect(sentId(0)).toBe(earlier);
  });

  it('still sends a valid id when storage throws', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    fetchMock.mockResolvedValue(reply(503, { offline: true }));
    renderTalk();
    await connect();
    expect(isUuidV4(sentId(0))).toBe(true);
  });
});

// D66: a 429 {error:'busy'} says why Connect was refused and leaves the retry to the visitor.
describe('TalkSession: the token route says busy (429)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it.each([
    ['visitor', talkPage.status.busyVisitor],
    ['site', talkPage.status.busySite],
  ])('reason %s shows its line and Connect, makes no Room and never retries', async (reason, line) => {
    fetchMock.mockResolvedValue(reply(429, { error: 'busy', reason }));
    renderTalk();
    // fireEvent.click doesn't move focus, so this is the case of a click that leaves focus on <body> (Safari): the
    // page hands it to Connect as the session ends.
    expect(document.body).toHaveFocus();
    await connectWithFakeTimers();
    expect(status()).toHaveTextContent(new RegExp(`^${line}$`));
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toHaveFocus();
    expect(screen.queryByRole('button', { name: talkPage.labels.leave })).toBeNull();
    expect(screen.getByRole('link', { name: talkPage.deepDiveLabel })).toHaveAttribute('href', '/projects/voice-concierge');
    expect(MockRoom.instances).toHaveLength(0);
    act(() => jest.advanceTimersByTime(15_000));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent(new RegExp(`^${line}$`));
    expect(MockRoom.instances).toHaveLength(0);
    expect(micCalls()).toEqual([]);
  });

  it.each([
    ['an unknown reason', { error: 'busy', reason: 'other' }],
    ['another error', { error: 'rate', reason: 'site' }],
    ['no body', null],
  ])('a 429 with %s reads as offline', async (_, body) => {
    fetchMock.mockResolvedValue(reply(429, body));
    renderTalk();
    await connectWithFakeTimers();
    expectOffline();
    expect(MockRoom.instances).toHaveLength(0);
    expect(micCalls()).toEqual([]);
  });

  it('a busy body on any status but 429 reads as offline', async () => {
    fetchMock.mockResolvedValue(reply(503, { error: 'busy', reason: 'site' }));
    renderTalk();
    await connectWithFakeTimers();
    expectOffline();
  });

  it('Connect after busy asks again, and a 200 then makes the Room', async () => {
    fetchMock.mockResolvedValueOnce(reply(429, { error: 'busy', reason: 'site' })).mockResolvedValueOnce(OK);
    renderTalk();
    await connectWithFakeTimers();
    expect(status()).toHaveTextContent(talkPage.status.busySite);
    await connectWithFakeTimers();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(MockRoom.instances).toHaveLength(1);
    expect(status()).toHaveTextContent(talkPage.status.waiting);
  });
});

describe('TalkSession: the room', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(OK);
  });

  it('registers the three text-stream handlers before connect(), with the url and token from the route', async () => {
    renderTalk();
    await connect();
    const room = lastRoom();
    expect(MockRoom.instances).toHaveLength(1);
    expect(room.registerTextStreamHandler.mock.calls.map(([topic]) => topic).sort()).toEqual([...TOPICS].sort());
    expect(room.connect).toHaveBeenCalledWith('wss://concierge.test.invalid', 'test-token');
    const connectOrder = room.connect.mock.invocationCallOrder[0];
    for (const order of room.registerTextStreamHandler.mock.invocationCallOrder) expect(order).toBeLessThan(connectOrder);
  });

  it('on provider unmount (leaving the chrome) unregisters all three and disconnects once', async () => {
    const { unmount } = renderTalk();
    await connect();
    const room = lastRoom();
    unmount();
    expect(room.unregisterTextStreamHandler.mock.calls.map(([topic]) => topic).sort()).toEqual([...TOPICS].sort());
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(room.textHandlers.size).toBe(0);
  });

  it('under StrictMode, registers each topic once (one Room), and provider unmount leaves none', async () => {
    const { unmount } = renderTalk({ strict: true });
    await connect();
    expect(MockRoom.instances).toHaveLength(1);
    const room = lastRoom();
    expect(room.registerTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.unregisterTextStreamHandler).not.toHaveBeenCalled();
    unmount();
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('Leave unregisters, disconnects once and returns to Connect', async () => {
    const user = userEvent.setup();
    renderTalk();
    await connect(user);
    const room = lastRoom();
    await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
  });

  it('a rejected connect() shows the offline line and releases the room', async () => {
    MockRoom.setup = (room) => room.connect.mockRejectedValueOnce(new Error('could not establish signal connection'));
    renderTalk();
    await connect();
    expectOffline();
    const room = lastRoom();
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(micCalls()).toEqual([]);
  });

  it('is live at once when the agent is already in the room', async () => {
    MockRoom.setup = (room) => room.remoteParticipants.set('agent-1', { identity: 'agent-1', kind: ParticipantKind.AGENT });
    renderTalk();
    await connect();
    expect(status()).toHaveTextContent(talkPage.status.live);
  });

  it('a participant that is not an agent does not make it live', async () => {
    renderTalk();
    await connect();
    const room = lastRoom();
    act(() => {
      room.emit('participantConnected', { identity: 'someone', kind: ParticipantKind.STANDARD });
    });
    expect(status()).toHaveTextContent(talkPage.status.waiting);
  });

  it('when the agent leaves, the call ends, the room is released and the panels stay', async () => {
    renderTalk();
    await connect();
    const room = lastRoom();
    act(() => {
      addAgent(room, 'agent-1');
    });
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    await act(async () => removeParticipant(room, 'agent-1'));
    expect(status()).toHaveTextContent(talkPage.status.ended);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });
});

describe('TalkSession: the call drops or reconnects', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(OK);
  });

  it('a disconnect from the server while live ends the call, releases the room and keeps the panels', async () => {
    renderTalk();
    await connect();
    const room = lastRoom();
    act(() => {
      addAgent(room);
    });
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    act(() => {
      room.emit('disconnected');
    });
    expect(status()).toHaveTextContent(talkPage.status.ended);
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.listenerCount('disconnected')).toBe(0);
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
  });

  it('a disconnect while waiting for the agent reads as offline', async () => {
    renderTalk();
    await connect();
    act(() => {
      lastRoom().emit('disconnected');
    });
    expectOffline();
  });

  it('a full reconnect, which unwinds the agent for a moment, does not end the call', async () => {
    renderTalk();
    await connect();
    const room = lastRoom();
    act(() => {
      addAgent(room, 'agent-1');
    });
    await act(async () => restart(room));
    expect(status()).toHaveTextContent(talkPage.status.live);
    expect(room.disconnect).not.toHaveBeenCalled();
  });
});

describe('TalkSession: Leave or unmount before the room is up', () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  }

  it('Leave during the token fetch: no Room is ever made', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderTalk();
    await connect(user);
    await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    pending.resolve(OK);
    await flush();
    expect(MockRoom.instances).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(status()).toHaveTextContent(/^$/);
  });

  it('a 429 that lands after Leave changes nothing', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderTalk();
    await connect(user);
    await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    pending.resolve(reply(429, { error: 'busy', reason: 'visitor' }));
    await flush();
    expect(status()).toHaveTextContent(/^$/);
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeInTheDocument();
  });

  it("the first Connect's late 429 doesn't mark the second Connect busy", async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const user = userEvent.setup();
    renderTalk();
    await connect(user);
    await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    await connect(user);
    first.resolve(reply(429, { error: 'busy', reason: 'site' }));
    await flush();
    expect(status()).toHaveTextContent(talkPage.status.connecting);
    second.resolve(OK);
    await flush();
    expect(MockRoom.instances).toHaveLength(1);
    expect(status()).toHaveTextContent(talkPage.status.waiting);
  });

  // D85: TalkSession going away (a client-side navigation off /talk) no longer ends a Connect in flight.
  it('TalkSession unmounted during the token fetch: the call still comes up, and is live on remount', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockReturnValue(pending.promise);
    const { unmountTalk, remountTalk } = renderTalk();
    await connect();
    unmountTalk();
    pending.resolve(OK);
    await flush();
    expect(MockRoom.instances).toHaveLength(1);
    const room = lastRoom();
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    await flush();
    remountTalk();
    expect(status()).toHaveTextContent(talkPage.status.live);
    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('provider unmount during the token fetch: no Room is ever made', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockReturnValue(pending.promise);
    const { unmount } = renderTalk();
    await connect();
    unmount();
    pending.resolve(OK);
    await flush();
    expect(MockRoom.instances).toHaveLength(0);
  });

  it.each(['Leave', 'provider unmount'])('%s during connect(): released once, and nothing happens when it settles', async (how) => {
    fetchMock.mockResolvedValue(OK);
    const pending = deferred<void>();
    MockRoom.setup = (room) => room.connect.mockReturnValueOnce(pending.promise);
    const user = userEvent.setup();
    const { unmount } = renderTalk();
    await connect(user);
    const room = lastRoom();
    expect(status()).toHaveTextContent(talkPage.status.connecting);
    if (how === 'Leave') await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    else unmount();
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    room.remoteParticipants.set('agent-1', { identity: 'agent-1', kind: ParticipantKind.AGENT });
    pending.resolve();
    await flush();
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    if (how === 'Leave') {
      expect(status()).toHaveTextContent(/^$/);
      expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    }
  });
});

describe('TalkSession: waiting for the agent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(OK);
  });

  it(`goes offline ${AGENT_JOIN_TIMEOUT_MS} ms after connect() resolves with no agent`, async () => {
    expect(AGENT_JOIN_TIMEOUT_MS).toBe(10_000);
    renderTalk();
    await connectWithFakeTimers();
    const room = lastRoom();
    expect(status()).toHaveTextContent(talkPage.status.waiting);
    act(() => jest.advanceTimersByTime(9_999));
    expect(status()).toHaveTextContent(talkPage.status.waiting);
    expect(room.disconnect).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expectOffline();
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(room.unregisterTextStreamHandler).toHaveBeenCalledTimes(3);
    // The agent never came, so the browser never asked for the microphone (VC5-02).
    expect(micCalls()).toEqual([]);
  });

  it('an agent joining at 3 000 ms cancels the timeout and the session is live', async () => {
    renderTalk();
    await connectWithFakeTimers();
    const room = lastRoom();
    expect(status()).toHaveTextContent(talkPage.status.waiting);
    act(() => jest.advanceTimersByTime(3_000));
    expect(micCalls()).toEqual([]);
    // Async: the arrival asks for the mic, and that answer renders too.
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    expect(micCalls()).toEqual([[true]]);
    act(() => jest.advanceTimersByTime(7_000));
    expect(status()).toHaveTextContent(talkPage.status.live);
    act(() => jest.advanceTimersByTime(60_000));
    expect(status()).toHaveTextContent(talkPage.status.live);
    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('under StrictMode, one agent timer and one listener per room event; provider unmount releases them all', async () => {
    const events = ['participantConnected', 'participantDisconnected', 'reconnected', 'disconnected', 'audioPlaybackChanged'];
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderTalk({ strict: true });
    await connectWithFakeTimers();
    const room = lastRoom();
    expect(MockRoom.instances).toHaveLength(1);
    const agentTimers = setTimeoutSpy.mock.results.filter((_, i) => setTimeoutSpy.mock.calls[i][1] === AGENT_JOIN_TIMEOUT_MS);
    expect(agentTimers).toHaveLength(1);
    for (const event of events) expect(room.listenerCount(event)).toBe(1);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(agentTimers[0].value as ReturnType<typeof setTimeout>);
    for (const event of events) expect(room.listenerCount(event)).toBe(0);
    expect(room.textHandlers.size).toBe(0);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('Leave while waiting stops the timer: nothing turns offline later', async () => {
    renderTalk();
    await connectWithFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    act(() => jest.advanceTimersByTime(20_000));
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
    expect(lastRoom().disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('TalkSession: the text streams feed the panels', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(OK);
  });

  async function liveRoom() {
    renderTalk();
    await connect();
    const room = lastRoom();
    // Async: the agent's arrival asks for the mic, and its answer must render inside act too.
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    return room;
  }

  it('a memory body renders in the Memory tab and the strip', async () => {
    const room = await liveRoom();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    const strip = screen.getByRole('list', { name: talkPage.memoryView.strip });
    expect(strip.querySelector('[data-kind="profile"] [data-count]')).toHaveTextContent('3');
    const panel = screen.getByRole('tabpanel', { name: 'Memory' });
    expect(within(panel).getByText('Talking to a new visitor · visit 2')).toBeInTheDocument();
    expect(within(panel).getByText('Lisbon')).toBeInTheDocument();
  });

  it('a metrics body renders in the Latency tab', async () => {
    const room = await liveRoom();
    await act(() => pushText(room, 'concierge.metrics', metricsFullJson));
    fireEvent.click(screen.getByRole('tab', { name: 'Latency' }));
    const panel = screen.getByRole('tabpanel', { name: 'Latency' });
    expect(within(panel).getByText('Turn 1')).toBeInTheDocument();
    expect(within(panel).getAllByText('830 ms').length).toBeGreaterThan(0);
  });

  it('a malformed body changes nothing and logs no error', async () => {
    const error = jest.spyOn(console, 'error');
    const room = await liveRoom();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    await act(() => pushText(room, 'concierge.metrics', metricsFullJson));
    const before = document.body.innerHTML;
    await act(() => pushText(room, 'concierge.memory', '{"visitor": '));
    await act(() => pushText(room, 'concierge.metrics', 'not json'));
    await act(() => pushText(room, 'concierge.memory', JSON.stringify({ visitor: { name: 'X', visits: 1 } })));
    expect(document.body.innerHTML).toBe(before);
    expect(error).not.toHaveBeenCalled();
  });

  it('two chunks of one segment make one line, with the final text', async () => {
    const room = await liveRoom();
    const attributes = { 'lk.segment_id': 'seg-1', 'lk.transcription_final': 'true' };
    await act(() => pushText(room, 'lk.transcription', 'Hello there', { attributes, chunks: ['Hello ', 'there'] }));
    const items = within(screen.getByRole('log')).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Hello there');
    expect(items[0]).toHaveAttribute('data-final', 'true');
  });

  it('an interim line still open when the call ends is settled, so the log is not left busy', async () => {
    const room = await liveRoom();
    const attributes = { 'lk.segment_id': 'seg-2', 'lk.transcription_final': 'false' };
    await act(() => pushText(room, 'lk.transcription', 'Hal', { identity: 'visitor-test', attributes }));
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'true');
    await act(async () => removeParticipant(room, 'agent-1'));
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'false');
  });

  it('a body from an earlier session never reaches the next one', async () => {
    const user = userEvent.setup();
    renderTalk();
    await connect(user);
    const first = lastRoom();
    const lateHandler = first.textHandlers.get('concierge.memory')!;
    await user.click(screen.getByRole('button', { name: talkPage.labels.leave }));
    await connect(user);
    expect(lastRoom()).not.toBe(first);
    first.textHandlers.set('concierge.memory', lateHandler);
    await act(() => pushText(first, 'concierge.memory', memoryJson));
    expect(screen.queryByText('Lisbon')).toBeNull();
  });
});
