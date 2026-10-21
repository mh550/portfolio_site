import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderTalk } from '@/__tests__/helpers/concierge';
import { BUSY_RETRY_LIMIT_MS, BUSY_RETRY_MS } from '@/components/concierge/ConciergeProvider';
import { MockRoom, ParticipantKind, addAgent, lastRoom, pushText, resetRooms, restart } from '@/__mocks__/livekit-client';
import { audioRenderer } from '@/__mocks__/livekit-components-react';
import { talkPage } from '@/lib/data';
import { memoryJson, metricsFullJson } from '@/__tests__/fixtures/concierge';

// VC2-05: a live session (plan docs/plans/2026-10-20-VC2-talk-page.md § State machine): the mic, the text box, the
// transcript, Forget me's RPC, the agent's audio and Leave. The connect and offline paths are TalkSession.test.tsx.

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const OK = reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' });
const realFetch = global.fetch;
const { labels, status: copy } = talkPage;

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(async () => OK) as unknown as typeof fetch;
  audioRenderer.room = undefined;
});

afterEach(() => {
  global.fetch = realFetch;
  resetRooms();
  jest.restoreAllMocks();
});

// Drains the fetch → res.json() → connect() chain (and the agent's setMicrophoneEnabled()) inside one act scope.
const flush = () =>
  act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });

const status = () => screen.getByRole('status');
const button = (name: string) => screen.getByRole('button', { name });
const messageBox = () => screen.getByRole('textbox', { name: labels.message });
const logItems = () => within(screen.getByRole('log')).queryAllByRole('listitem');

// Connect, then the agent joins: the session is live.
async function goLive(user: UserEvent = userEvent.setup()) {
  renderTalk();
  await user.click(button(labels.connect));
  await flush();
  const room = lastRoom();
  await act(async () => {
    addAgent(room, 'agent-1');
  });
  await flush();
  return { room, user };
}

describe('TalkSession live: the microphone', () => {
  // VC5-02 (D65): nothing asks for the microphone until the agent has joined, so an offline Connect never prompts.
  it('asks for the mic only once the agent joins: none after connect() alone, one [true] after addAgent', async () => {
    const user = userEvent.setup();
    renderTalk();
    await user.click(button(labels.connect));
    await flush();
    const room = lastRoom();
    const mic = room.localParticipant.setMicrophoneEnabled;
    expect(room.connect).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent(copy.waiting);
    expect(mic).not.toHaveBeenCalled();
    await act(async () => {
      addAgent(room, 'agent-1');
    });
    await flush();
    expect(mic.mock.calls).toEqual([[true]]);
  });

  it('asks once for an agent already in the room when connect() resolves', async () => {
    MockRoom.setup = (room) => room.remoteParticipants.set('agent-1', { identity: 'agent-1', kind: ParticipantKind.AGENT });
    renderTalk();
    await userEvent.setup().click(button(labels.connect));
    await flush();
    expect(status()).toHaveTextContent(copy.live);
    expect(lastRoom().localParticipant.setMicrophoneEnabled.mock.calls).toEqual([[true]]);
  });

  it('a second agent joining, or a reconnect, does not ask again', async () => {
    const { room } = await goLive();
    await act(async () => {
      addAgent(room, 'agent-2');
    });
    await act(async () => {
      restart(room);
    });
    // A full reconnect announces the agent again (ParticipantConnected) before Reconnected.
    await act(async () => {
      room.state = 'connected';
      addAgent(room, 'agent-1');
      room.emit('reconnected');
    });
    await flush();
    expect(status()).toHaveTextContent(copy.live);
    expect(room.localParticipant.setMicrophoneEnabled.mock.calls).toEqual([[true]]);
  });

  it('Leave, Connect, agent again: one [true] on each Room', async () => {
    const { room: first, user } = await goLive();
    await user.click(button(labels.leave));
    await user.click(button(labels.connect));
    await flush();
    const second = lastRoom();
    expect(second).not.toBe(first);
    expect(second.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
    await act(async () => {
      addAgent(second, 'agent-1');
    });
    await flush();
    expect(first.localParticipant.setMicrophoneEnabled.mock.calls).toEqual([[true]]);
    expect(second.localParticipant.setMicrophoneEnabled.mock.calls).toEqual([[true]]);
  });

  it('the toggle shows only once the agent has joined (D65), not while waiting', async () => {
    const user = userEvent.setup();
    renderTalk();
    await user.click(button(labels.connect));
    await flush();
    expect(status()).toHaveTextContent(copy.waiting);
    expect(screen.queryByRole('button', { name: labels.micOn })).toBeNull();
    expect(screen.queryByRole('button', { name: labels.micOff })).toBeNull();
    await act(async () => {
      addAgent(lastRoom(), 'agent-1');
    });
    await flush();
    expect(screen.getAllByRole('button', { name: new RegExp(`^(${labels.micOn}|${labels.micOff})$`) })).toHaveLength(1);
  });

  it('turns the mic on once the agent joins, and the toggle mutes and unmutes it', async () => {
    const { room, user } = await goLive();
    const mic = room.localParticipant.setMicrophoneEnabled;
    expect(mic.mock.calls).toEqual([[true]]);
    await user.click(button(labels.micOn));
    expect(mic).toHaveBeenLastCalledWith(false);
    await user.click(button(labels.micOff));
    expect(mic).toHaveBeenLastCalledWith(true);
    expect(button(labels.micOn)).toBeInTheDocument();
  });

  it('a blocked mic (NotAllowedError) says so and keeps the session live, with typing still on', async () => {
    MockRoom.setup = (room) =>
      room.localParticipant.setMicrophoneEnabled.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    const { room } = await goLive();
    expect(status()).toHaveTextContent(copy.micBlocked);
    expect(button(labels.leave)).toBeInTheDocument();
    expect(button(labels.micOff)).toBeInTheDocument();
    expect(messageBox()).toBeEnabled();
    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('a blocked toggle press says so too, and a later press that works clears the message', async () => {
    const { room, user } = await goLive();
    const mic = room.localParticipant.setMicrophoneEnabled;
    await user.click(button(labels.micOn));
    mic.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));
    await user.click(button(labels.micOff));
    await flush();
    expect(status()).toHaveTextContent(copy.micBlocked);
    await user.click(button(labels.micOff));
    await flush();
    expect(status()).toHaveTextContent(copy.live);
    expect(button(labels.micOn)).toBeInTheDocument();
  });

  it('two presses before the first settles: the second still flips it, and the last answer wins', async () => {
    const { room, user } = await goLive();
    const mic = room.localParticipant.setMicrophoneEnabled;
    const pending: ((v: undefined) => void)[] = [];
    mic.mockImplementation(() => new Promise<undefined>((resolve) => pending.push(resolve)));
    await user.click(button(labels.micOn));
    await user.click(button(labels.micOn)); // the label hasn't caught up yet
    expect(mic.mock.calls.slice(1)).toEqual([[false], [true]]);
    await act(async () => pending[1](undefined)); // the unmute settles first
    await act(async () => pending[0](undefined));
    expect(button(labels.micOn)).toBeInTheDocument();
  });

  it('the toggle is not shown before Connect', () => {
    renderTalk();
    expect(screen.queryByRole('button', { name: labels.micOn })).toBeNull();
    expect(screen.queryByRole('button', { name: labels.micOff })).toBeNull();
  });
});

describe('TalkSession live: typing', () => {
  it('Enter sends on lk.chat, appends the line as the visitor and clears the box', async () => {
    const { room, user } = await goLive();
    await user.type(messageBox(), 'Hi, I am Sam{Enter}');
    expect(room.localParticipant.sendText).toHaveBeenCalledTimes(1);
    expect(room.localParticipant.sendText).toHaveBeenCalledWith('Hi, I am Sam', { topic: 'lk.chat' });
    const items = logItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(`${talkPage.speakers.visitor} Hi, I am Sam`);
    expect(items[0]).toHaveAttribute('data-final', 'true');
    expect(messageBox()).toHaveValue('');
  });

  it('the Send button sends the trimmed text', async () => {
    const { room, user } = await goLive();
    await user.type(messageBox(), '  What do you remember?  ');
    await user.click(button(labels.send));
    expect(room.localParticipant.sendText).toHaveBeenCalledWith('What do you remember?', { topic: 'lk.chat' });
    expect(logItems()).toHaveLength(1);
  });

  it('ignores whitespace-only input', async () => {
    const { room, user } = await goLive();
    await user.type(messageBox(), '   {Enter}');
    await user.click(button(labels.send));
    expect(room.localParticipant.sendText).not.toHaveBeenCalled();
    expect(logItems()).toHaveLength(0);
  });

  it('two messages make two lines, in order', async () => {
    const { user } = await goLive();
    await user.type(messageBox(), 'one{Enter}');
    await user.type(messageBox(), 'two{Enter}');
    expect(logItems().map((item) => item.textContent)).toEqual([
      expect.stringContaining('one'),
      expect.stringContaining('two'),
    ]);
  });

  it('a send that fails leaves no error in the console', async () => {
    const error = jest.spyOn(console, 'error');
    const { room, user } = await goLive();
    room.localParticipant.sendText.mockRejectedValueOnce(new Error('not connected'));
    await user.type(messageBox(), 'hello{Enter}');
    await flush();
    expect(error).not.toHaveBeenCalled();
  });

  it('the box is disabled until the agent is in the room', async () => {
    const user = userEvent.setup();
    renderTalk();
    expect(messageBox()).toBeDisabled();
    await user.click(button(labels.connect));
    await flush();
    expect(messageBox()).toBeDisabled();
    await act(async () => {
      addAgent(lastRoom());
    });
    expect(messageBox()).toBeEnabled();
  });
});

describe('TalkSession live: the transcript', () => {
  it('the sender identity decides who spoke', async () => {
    const { room } = await goLive();
    await act(() => pushText(room, 'lk.transcription', 'My name is Sam', { identity: 'visitor-test' }));
    await act(() => pushText(room, 'lk.transcription', 'Nice to meet you, Sam', { identity: 'agent-1' }));
    const [visitor, agent] = logItems();
    expect(visitor).toHaveTextContent(`${talkPage.speakers.visitor} My name is Sam`);
    expect(agent).toHaveTextContent(`${talkPage.speakers.agent} Nice to meet you, Sam`);
  });

  it('two streams with one lk.segment_id update one line, and lk.transcription_final marks it final', async () => {
    const { room } = await goLive();
    const segment = (final: string) => ({ identity: 'visitor-test', attributes: { 'lk.segment_id': 'seg-9', 'lk.transcription_final': final } });
    await act(() => pushText(room, 'lk.transcription', 'I work on', segment('false')));
    expect(logItems()).toHaveLength(1);
    expect(logItems()[0]).toHaveAttribute('data-final', 'false');
    await act(() => pushText(room, 'lk.transcription', 'I work on boats', segment('true')));
    const items = logItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('I work on boats');
    expect(items[0]).toHaveAttribute('data-final', 'true');
  });

  it('two chunks of one segment make exactly one line with the final text', async () => {
    const { room } = await goLive();
    const attributes = { 'lk.segment_id': 'seg-3', 'lk.transcription_final': 'true' };
    await act(() => pushText(room, 'lk.transcription', 'Welcome back', { attributes, chunks: ['Welcome ', 'back'] }));
    const items = logItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Welcome back');
    expect(items[0]).toHaveAttribute('data-final', 'true');
  });
});

describe('TalkSession live: Forget me', () => {
  async function erase(user: UserEvent) {
    await user.click(button(labels.forgetMe));
    await user.click(button(labels.erase));
    await flush();
  }

  // P3-06 (v3 spec § 4.4): always in the Memory tab, enabled only while live.
  it('is always shown, but enabled only while live', async () => {
    const user = userEvent.setup();
    renderTalk();
    expect(button(labels.forgetMe)).toBeDisabled();
    expect(button(labels.forgetMe)).toHaveAccessibleDescription(talkPage.memoryView.forgetHint);
    await user.click(button(labels.connect));
    await flush();
    expect(button(labels.forgetMe)).toBeDisabled();
    await act(async () => {
      addAgent(lastRoom());
    });
    expect(button(labels.forgetMe)).toBeEnabled();
    expect(screen.queryByText(talkPage.memoryView.forgetHint)).toBeNull();
  });

  it('once confirmed, calls the RPC on the agent exactly once', async () => {
    const { room, user } = await goLive();
    await erase(user);
    expect(room.localParticipant.performRpc).toHaveBeenCalledTimes(1);
    expect(room.localParticipant.performRpc).toHaveBeenCalledWith({
      destinationIdentity: 'agent-1',
      method: 'concierge.forget_me',
      payload: '',
      responseTimeout: 10000,
    });
  });

  it('Cancel calls nothing', async () => {
    const { room, user } = await goLive();
    await user.click(button(labels.forgetMe));
    await user.click(button(labels.cancel));
    expect(room.localParticipant.performRpc).not.toHaveBeenCalled();
  });

  it('on {ok: true} the memory panel clears and "Forgotten" replaces it', async () => {
    const { room, user } = await goLive();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    const panel = screen.getByRole('tabpanel', { name: 'Memory' });
    expect(within(panel).getByText('Lisbon')).toBeInTheDocument();
    await erase(user);
    expect(within(panel).queryByText('Lisbon')).toBeNull();
    // "Forgotten" replaces the view (D91): no "Nothing remembered yet" above it.
    expect(within(panel).queryByText(talkPage.empty.memory)).toBeNull();
    expect(screen.getByText(copy.forgotten)).toBeInTheDocument();
  });

  it('"Forgotten" stays when the agent then ends the session', async () => {
    const { room, user } = await goLive();
    await erase(user);
    await act(async () => {
      room.emit('disconnected');
    });
    expect(status()).toHaveTextContent(copy.ended);
    expect(screen.getByText(copy.forgotten)).toBeInTheDocument();
  });

  it('a rejected RPC re-enables the button and shows the error line', async () => {
    const { room, user } = await goLive();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    let rejectRpc: (reason: Error) => void = () => {};
    room.localParticipant.performRpc.mockImplementationOnce(
      () => new Promise<string>((_resolve, reject) => (rejectRpc = reject))
    );
    await erase(user);
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'true');
    await act(async () => rejectRpc(new Error('Response timeout')));
    await flush();
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByText(copy.forgetFailed)).toBeInTheDocument();
    expect(screen.queryByText(copy.forgotten)).toBeNull();
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
  });

  it.each([['{"ok":false}'], ['not json'], ['']])('a reply of %p reads as failed', async (body) => {
    const { room, user } = await goLive();
    room.localParticipant.performRpc.mockResolvedValueOnce(body);
    await erase(user);
    expect(screen.getByText(copy.forgetFailed)).toBeInTheDocument();
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'false');
  });

  it("a reply from an earlier session never marks the next one's Forget me done", async () => {
    const user = userEvent.setup();
    const { room: first } = await goLive(user);
    let resolveFirst: (body: string) => void = () => {};
    first.localParticipant.performRpc.mockImplementationOnce(() => new Promise<string>((resolve) => (resolveFirst = resolve)));
    await erase(user);
    await user.click(button(labels.leave));
    await user.click(button(labels.connect));
    await flush();
    const second = lastRoom();
    await act(async () => {
      addAgent(second, 'agent-2');
    });
    second.localParticipant.performRpc.mockImplementationOnce(() => new Promise<string>(() => {}));
    await erase(user);
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'true');
    await act(async () => resolveFirst('{"ok":true}'));
    await flush();
    expect(screen.queryByText(copy.forgotten)).toBeNull();
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'true');
  });

  it('a reply that lands after Leave changes nothing', async () => {
    const { room, user } = await goLive();
    let resolveRpc: (body: string) => void = () => {};
    room.localParticipant.performRpc.mockImplementationOnce(() => new Promise<string>((resolve) => (resolveRpc = resolve)));
    await erase(user);
    await user.click(button(labels.leave));
    await act(async () => resolveRpc('{"ok":true}'));
    await flush();
    expect(screen.queryByText(copy.forgotten)).toBeNull();
  });
});

describe('TalkSession live: audio', () => {
  it('renders RoomAudioRenderer inside a RoomContext.Provider for the connected room', async () => {
    await goLive();
    const renderer = screen.getByTestId('room-audio-renderer');
    expect(renderer).toHaveAttribute('data-has-room', 'true');
    expect(audioRenderer.room).toBe(lastRoom());
  });

  it('renders no audio before Connect', () => {
    renderTalk();
    expect(screen.queryByTestId('room-audio-renderer')).toBeNull();
  });

  it('calls startAudio() after connecting when the browser blocks playback', async () => {
    MockRoom.setup = (room) => {
      room.canPlaybackAudio = false;
    };
    const { room } = await goLive();
    expect(room.startAudio).toHaveBeenCalled();
    const connectOrder = room.connect.mock.invocationCallOrder[0];
    expect(room.startAudio.mock.invocationCallOrder[0]).toBeGreaterThan(connectOrder);
  });

  it('does not call startAudio() when playback is allowed', async () => {
    const { room } = await goLive();
    expect(room.startAudio).not.toHaveBeenCalled();
  });

  it('when the browser refuses playback later, a Turn on sound button calls startAudio() and goes once it plays', async () => {
    const { room, user } = await goLive();
    expect(screen.queryByRole('button', { name: labels.startAudio })).toBeNull();
    await act(async () => {
      room.canPlaybackAudio = false;
      room.emit('audioPlaybackChanged', false);
    });
    room.startAudio.mockImplementationOnce(async () => {
      room.canPlaybackAudio = true;
      room.emit('audioPlaybackChanged', true);
    });
    await user.click(button(labels.startAudio));
    expect(room.startAudio).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: labels.startAudio })).toBeNull();
  });

  it('shows Turn on sound at once when playback is blocked on connect', async () => {
    MockRoom.setup = (room) => {
      room.canPlaybackAudio = false;
    };
    await goLive();
    expect(button(labels.startAudio)).toBeInTheDocument();
  });

  it('the mic toggle, a user gesture, retries startAudio() while playback is still blocked', async () => {
    MockRoom.setup = (room) => {
      room.canPlaybackAudio = false;
      room.startAudio.mockRejectedValue(new Error('NotAllowedError'));
    };
    const { room, user } = await goLive();
    const before = room.startAudio.mock.calls.length;
    await user.click(button(labels.micOn));
    expect(room.startAudio.mock.calls.length).toBe(before + 1);
  });
});

describe('TalkSession live: Leave', () => {
  it('disconnects, returns to idle with the panels cleared (memory greyed, as cached) and the audio gone', async () => {
    const { room, user } = await goLive();
    await act(() => pushText(room, 'concierge.memory', memoryJson));
    await act(() => pushText(room, 'concierge.metrics', metricsFullJson));
    await user.type(messageBox(), 'hello{Enter}');
    await user.click(button(labels.leave));
    expect(room.disconnect).toHaveBeenCalledTimes(1);
    expect(button(labels.connect)).toBeInTheDocument();
    expect(status()).toHaveTextContent(/^$/);
    expect(logItems()).toHaveLength(0);
    // The memory stays as the cached body (D91): greyed, "as of" when it came.
    const stale = screen.getByRole('tabpanel', { name: 'Memory' }).querySelector('[data-stale="true"]') as HTMLElement;
    expect(within(stale).getByText('Lisbon')).toBeInTheDocument();
    expect(within(stale).getByText(new RegExp(`^${talkPage.memoryView.asOf} `))).toBeInTheDocument();
    expect(screen.queryByText('Turn 1')).toBeNull();
    expect(screen.queryByTestId('room-audio-renderer')).toBeNull();
    expect(screen.queryByRole('button', { name: labels.micOn })).toBeNull();
    expect(button(labels.forgetMe)).toBeDisabled();
  });
});

// D92 (plan § Busy retry): a 429 busy/visitor means this visitor's earlier room is still closing (a reload, a tab just
// shut). The page says so and asks again every 5 s, one request at a time, for a minute; then the D66 busy line.
describe('TalkSession: closing the earlier conversation', () => {
  type Reply = ReturnType<typeof reply>;
  const BUSY_VISITOR = reply(429, { error: 'busy', reason: 'visitor' });
  let fetchMock: jest.Mock<(url: string, init: RequestInit) => Promise<Reply>>;
  const sentIds = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body as string).visitor_id);
  const closingLine = new RegExp(`^${copy.closing}$`);

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn(async () => BUSY_VISITOR);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Under fake timers React's scheduler is frozen: click synchronously and flush inside act.
  async function connectClosing() {
    renderTalk();
    fireEvent.click(button(labels.connect));
    await flush();
  }

  async function tick(ms: number) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
    await flush();
  }

  it('the exact copy and the 5 s / 60 s constants', () => {
    expect(copy.closing).toBe('Closing your earlier conversation…');
    expect(BUSY_RETRY_MS).toBe(5_000);
    expect(BUSY_RETRY_LIMIT_MS).toBe(60_000);
  });

  it('shows the closing line and Leave, makes no Room, and asks again after 5 s', async () => {
    await connectClosing();
    expect(status()).toHaveTextContent(closingLine);
    expect(button(labels.leave)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: labels.connect })).toBeNull();
    expect(screen.queryByRole('link', { name: talkPage.deepDiveLabel })).toBeNull();
    expect(MockRoom.instances).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await tick(BUSY_RETRY_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent(closingLine);
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('never has two requests in flight: the next waits 5 s after the last answer', async () => {
    await connectClosing();
    let answer: (r: Reply) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise<Reply>((resolve) => (answer = resolve)));
    await tick(BUSY_RETRY_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => answer(BUSY_VISITOR));
    await flush();
    await tick(BUSY_RETRY_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('a 200 on a retry continues the same Connect: one Room, the same visitor id, then live', async () => {
    await connectClosing();
    await tick(BUSY_RETRY_MS);
    fetchMock.mockResolvedValue(OK);
    await tick(BUSY_RETRY_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new Set(sentIds()).size).toBe(1);
    expect(MockRoom.instances).toHaveLength(1);
    expect(lastRoom().connect).toHaveBeenCalledWith('wss://concierge.test.invalid', 'test-token');
    expect(status()).toHaveTextContent(copy.waiting);
    await act(async () => {
      addAgent(lastRoom(), 'agent-1');
    });
    await flush();
    expect(status()).toHaveTextContent(copy.live);
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(status()).toHaveTextContent(copy.live);
  });

  it('after 60 s of 429s: the busy line, Connect, and no further request', async () => {
    await connectClosing();
    for (let t = 0; t < BUSY_RETRY_LIMIT_MS; t += BUSY_RETRY_MS) {
      expect(status()).toHaveTextContent(closingLine);
      await tick(BUSY_RETRY_MS);
    }
    // the first request plus one every 5 s until the 60th second, which asks nothing
    expect(fetchMock).toHaveBeenCalledTimes(BUSY_RETRY_LIMIT_MS / BUSY_RETRY_MS);
    expect(status()).toHaveTextContent(new RegExp(`^${copy.busyVisitor}$`));
    expect(button(labels.connect)).toHaveFocus();
    expect(screen.getByRole('link', { name: talkPage.deepDiveLabel })).toBeInTheDocument();
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(BUSY_RETRY_LIMIT_MS / BUSY_RETRY_MS);
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('Leave during closing cancels the timer: no further request, back to idle', async () => {
    await connectClosing();
    fireEvent.click(button(labels.leave));
    await flush();
    expect(button(labels.connect)).toBeInTheDocument();
    expect(status()).toHaveTextContent(/^$/);
    await tick(BUSY_RETRY_LIMIT_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('Leave while a retry is in flight: its 200 makes no Room', async () => {
    await connectClosing();
    let answer: (r: Reply) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise<Reply>((resolve) => (answer = resolve)));
    await tick(BUSY_RETRY_MS);
    fireEvent.click(button(labels.leave));
    await flush();
    await act(async () => answer(OK));
    await flush();
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(MockRoom.instances).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(button(labels.connect)).toBeInTheDocument();
  });

  it.each([
    ['the site filled up meanwhile', reply(429, { error: 'busy', reason: 'site' }), copy.busySite],
    ['the route went offline', reply(503, { offline: true }), talkPage.offlineMessage],
  ])('a retry that finds %s stops with that line', async (_, answer, line) => {
    await connectClosing();
    fetchMock.mockResolvedValue(answer);
    await tick(BUSY_RETRY_MS);
    expect(status()).toHaveTextContent(new RegExp(`^${line}$`));
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(MockRoom.instances).toHaveLength(0);
  });

  it('pagehide during closing stops the retries, and a bfcache restore comes back idle', async () => {
    await connectClosing();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent(closingLine);
    act(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await flush();
    expect(status()).toHaveTextContent(/^$/);
    expect(button(labels.connect)).toBeInTheDocument();
  });

  it('the provider unmounting during closing (leaving for /card) stops the retries', async () => {
    renderTalk().unmount();
    fetchMock.mockClear();
    const { unmount } = renderTalk();
    fireEvent.click(button(labels.connect));
    await flush();
    unmount();
    await tick(BUSY_RETRY_LIMIT_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Leave then Connect during closing: one cadence, from the new Connect only', async () => {
    await connectClosing();
    await tick(3_000);
    fireEvent.click(button(labels.leave));
    await flush();
    fireEvent.click(button(labels.connect));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent(closingLine);
    await tick(2_000); // the first Connect's retry would have fired here
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick(3_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('Leave aborts a retry request in flight', async () => {
    await connectClosing();
    let signal: AbortSignal | null | undefined;
    fetchMock.mockImplementationOnce((_url, init) => {
      signal = init.signal;
      return new Promise<Reply>(() => {});
    });
    await tick(BUSY_RETRY_MS);
    expect(signal?.aborted).toBe(false);
    fireEvent.click(button(labels.leave));
    await flush();
    expect(signal?.aborted).toBe(true);
  });

  it('a double click on Connect, which turns into Leave while closing, does not leave', async () => {
    renderTalk();
    fireEvent.click(button(labels.connect), { detail: 1 });
    await flush();
    fireEvent.click(button(labels.leave), { detail: 2 });
    await flush();
    expect(status()).toHaveTextContent(closingLine);
    await tick(BUSY_RETRY_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
