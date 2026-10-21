import { readdirSync, readFileSync } from 'fs';
import type { NavigationMock } from '@/__tests__/helpers/navigation';
import { join } from 'path';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderTalk } from '@/__tests__/helpers/concierge';
import { MockRoom, addAgent, lastRoom, resetRooms, restart } from '@/__mocks__/livekit-client';
import { talkPage } from '@/lib/data/concierge';

// P3-08: the provider calls useRouter() (the usher), so next/navigation is mocked (helpers/navigation.ts).
jest.mock('next/navigation', () => jest.requireActual<NavigationMock>('@/__tests__/helpers/navigation').mockNavigation);

// VC2-07's review fixes (plan docs/plans/2026-10-20-VC2-talk-page.md § Review): focus that survives every phase
// change, the draft and a failed send, Forget me after the call, a reconnect without the agent, and LiveKit kept out
// of the first load.

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const OK = reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' });
const realFetch = global.fetch;
const { labels, status: copy } = talkPage;

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(async () => OK) as unknown as typeof fetch;
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

const status = () => screen.getByRole('status');
const button = (name: string) => screen.getByRole('button', { name });
const messageBox = () => screen.getByRole('textbox', { name: labels.message });
const logItems = () => within(screen.getByRole('log')).queryAllByRole('listitem');

async function goLive(user: UserEvent) {
  await user.click(button(labels.connect));
  await flush();
  const room = lastRoom();
  await act(async () => {
    addAgent(room, 'agent-1');
  });
  await flush();
  return room;
}

describe('TalkSession review: focus', () => {
  it('Connect becomes Leave in place, so focus stays on it', async () => {
    const user = userEvent.setup();
    renderTalk();
    await user.click(button(labels.connect));
    await flush();
    expect(button(labels.leave)).toHaveFocus();
  });

  it('offline (503): focus is on Connect again', async () => {
    global.fetch = jest.fn(async () => reply(503, { offline: true })) as unknown as typeof fetch;
    const user = userEvent.setup();
    renderTalk();
    await user.click(button(labels.connect));
    await flush();
    expect(status()).toHaveTextContent(talkPage.offlineMessage);
    expect(button(labels.connect)).toHaveFocus();
  });

  it('Leave puts focus on Connect', async () => {
    const user = userEvent.setup();
    renderTalk();
    await goLive(user);
    await user.click(button(labels.leave));
    expect(button(labels.connect)).toHaveFocus();
  });

  it('after Erase focus stays on Forget me while the RPC runs, and moves to Connect when the agent ends the call', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    let resolveRpc: (body: string) => void = () => {};
    room.localParticipant.performRpc.mockImplementationOnce(() => new Promise<string>((resolve) => (resolveRpc = resolve)));
    await user.click(button(labels.forgetMe));
    await user.click(button(labels.erase));
    expect(button(labels.forgetMe)).toHaveFocus();
    expect(button(labels.forgetMe)).toHaveAttribute('aria-disabled', 'true');
    await act(async () => resolveRpc('{"ok":true}'));
    await act(async () => {
      room.emit('disconnected');
    });
    expect(status()).toHaveTextContent(copy.ended);
    expect(button(labels.connect)).toHaveFocus();
  });

  it('holding Enter on Connect connects and does not leave: auto-repeated keydowns are cancelled', async () => {
    // user-event never sets KeyboardEvent.repeat, so the repeats are fired by hand. fireEvent returns false when the
    // handler called preventDefault(), which is what stops the browser's click.
    const user = userEvent.setup();
    renderTalk();
    button(labels.connect).focus();
    await user.keyboard('{Enter}');
    await flush();
    expect(fireEvent.keyDown(button(labels.leave), { key: 'Enter', repeat: true })).toBe(false);
    expect(fireEvent.keyDown(button(labels.leave), { key: 'Enter', repeat: false })).toBe(true);
    expect(lastRoom().disconnect).not.toHaveBeenCalled();
  });

  it('does not take focus on page load', () => {
    renderTalk();
    expect(document.body).toHaveFocus();
  });

  it('a double click on Connect connects and does not leave', async () => {
    const user = userEvent.setup();
    renderTalk();
    await user.dblClick(button(labels.connect));
    await flush();
    expect(button(labels.leave)).toBeInTheDocument();
    expect(lastRoom().disconnect).not.toHaveBeenCalled();
  });
});

describe('TalkSession review: the message box', () => {
  it('a failed send keeps the draft and adds no line', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    room.localParticipant.sendText.mockRejectedValueOnce(new Error('engine not connected'));
    await user.type(messageBox(), 'Hello there{Enter}');
    await flush();
    expect(logItems()).toHaveLength(0);
    expect(messageBox()).toHaveValue('Hello there');
  });

  it('a send that works adds the line and clears the draft', async () => {
    const user = userEvent.setup();
    renderTalk();
    await goLive(user);
    await user.type(messageBox(), 'Hello there{Enter}');
    await flush();
    expect(logItems()).toHaveLength(1);
    expect(logItems()[0]).toHaveTextContent('Hello there');
    expect(messageBox()).toHaveValue('');
  });

  it('Enter pressed twice before the send answers sends once', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    let resolveSend: () => void = () => {};
    room.localParticipant.sendText.mockImplementationOnce(
      () => new Promise((resolve) => (resolveSend = () => resolve({ id: 'sent-1' })))
    );
    await user.type(messageBox(), 'Hello there{Enter}{Enter}');
    await act(async () => resolveSend());
    await flush();
    expect(room.localParticipant.sendText).toHaveBeenCalledTimes(1);
    expect(logItems()).toHaveLength(1);
    expect(messageBox()).toHaveValue('');
  });

  it('a draft from a call that ended is gone in the next session', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    await user.type(messageBox(), 'half a thought');
    await act(async () => {
      room.emit('disconnected');
    });
    await flush();
    expect(status()).toHaveTextContent(copy.ended);
    await goLive(user);
    expect(messageBox()).toHaveValue('');
  });

  it('a draft typed in one session is gone after Leave', async () => {
    const user = userEvent.setup();
    renderTalk();
    await goLive(user);
    await user.type(messageBox(), 'half a thought');
    await user.click(button(labels.leave));
    await goLive(user);
    expect(messageBox()).toHaveValue('');
  });
});

describe('TalkSession review: after the call', () => {
  it('a Forget me that fails once the call has ended says to connect again', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    let rejectRpc: (reason: Error) => void = () => {};
    room.localParticipant.performRpc.mockImplementationOnce(
      () => new Promise<string>((_resolve, reject) => (rejectRpc = reject))
    );
    await user.click(button(labels.forgetMe));
    await user.click(button(labels.erase));
    await act(async () => {
      room.emit('disconnected');
    });
    await act(async () => rejectRpc(new Error('Recipient disconnected')));
    await flush();
    expect(screen.getByText(copy.forgetFailedEnded)).toBeInTheDocument();
    expect(screen.queryByText(copy.forgetFailed)).toBeNull();
  });

  it('a reconnect after which the agent is gone ends the call', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    await act(async () => {
      restart(room);
    });
    expect(status()).toHaveTextContent(copy.live);
    await act(async () => {
      room.state = 'connected';
      room.emit('reconnected');
    });
    await flush();
    expect(status()).toHaveTextContent(copy.ended);
    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('a reconnect with the agent back stays live', async () => {
    const user = userEvent.setup();
    renderTalk();
    const room = await goLive(user);
    await act(async () => {
      restart(room);
    });
    await act(async () => {
      room.remoteParticipants.set('agent-1', { identity: 'agent-1', kind: 4 });
      room.state = 'connected';
      room.emit('reconnected');
    });
    await flush();
    expect(status()).toHaveTextContent(copy.live);
    expect(room.disconnect).not.toHaveBeenCalled();
    expect(MockRoom.instances).toHaveLength(1);
  });
});

describe('TalkSession review: the bundle', () => {
  // P3-03: the call moved into src/components/concierge (ConciergeProvider is in every chrome page's bundle).
  const files = ['src/components/talk', 'src/components/concierge'].flatMap((dir) =>
    readdirSync(join(process.cwd(), dir))
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => join(dir, f))
  );
  const source = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');

  it('reads both component folders, the provider included', () => {
    expect(files).toEqual(expect.arrayContaining(['src/components/concierge/ConciergeProvider.tsx']));
  });

  it('only RoomAudio.tsx imports LiveKit values statically; the rest import types, or load it on Connect', () => {
    const valueImport = /^import (?!type\b)[^;]*from '(livekit-client|@livekit\/components-react)'/m;
    const offenders = files.filter((f) => !f.endsWith('/RoomAudio.tsx') && valueImport.test(source(f)));
    expect(offenders).toEqual([]);
  });

  it('the talk components import their copy from @/lib/data/concierge, not the whole data barrel', () => {
    const offenders = files.filter((f) => /from '@\/lib\/data'/.test(source(f)));
    expect(offenders).toEqual([]);
  });
});
