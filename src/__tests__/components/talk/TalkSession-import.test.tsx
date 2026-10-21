import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderTalk } from '@/__tests__/helpers/concierge';
import { talkPage } from '@/lib/data';

// Counts how often the livekit-client module is evaluated. The factory runs once per module registry, so this file
// holds only these cases: in TalkSession.test.tsx an earlier configured Connect would already have loaded it and made
// a zero meaningless (VC5-03, plan § server-only). The mock module is the file `livekit-client` maps to, so a static
// import of '@/__mocks__/livekit-client' here would run the factory too: reach it through jest.requireActual.
let mockLoads = 0;
jest.mock('livekit-client', () => {
  mockLoads++;
  return jest.requireActual('@/__mocks__/livekit-client');
});

const mockModule = () => jest.requireActual<typeof import('@/__mocks__/livekit-client')>('@/__mocks__/livekit-client');
const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  mockModule().resetRooms();
});

const flush = () =>
  act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });

async function connect() {
  await userEvent.setup().click(screen.getByRole('button', { name: talkPage.labels.connect }));
  await flush();
}

// Order matters: the unconfigured case runs first, while the registry has not loaded the module; the configured case
// then shows the same factory does count a load, so the zero is not vacuous.
describe('TalkSession loads livekit-client only on a configured Connect', () => {
  it('never evaluates livekit-client when the server has no LiveKit env', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    renderTalk({ configured: false });
    await connect();
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockLoads).toBe(0);
  });

  it('evaluates it once on a configured Connect, which creates a Room', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        url: 'wss://concierge.test.invalid',
        token: 'test-token',
      }),
    })) as unknown as typeof fetch;
    renderTalk();
    await connect();
    expect(mockLoads).toBe(1);
    expect(mockModule().MockRoom.instances).toHaveLength(1);
  });
});
