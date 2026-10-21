import { useEffect } from 'react';
import type { NavigationMock } from '@/__tests__/helpers/navigation';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ConciergeProvider, { GUIDE_ME_KEY, useConcierge, type ConciergeValue } from '@/components/concierge/ConciergeProvider';
import ConciergePanel from '@/components/concierge/ConciergePanel';
import { addAgent, lastRoom, pushText, resetRooms } from '@/__mocks__/livekit-client';
import { mockRouter, navigation, resetNavigation } from '@/__tests__/helpers/navigation';
import { TOPIC } from '@/lib/concierge/contract';
import { USHER_INTERVAL_MS, usherTargets } from '@/lib/concierge/usher';
import { talkWidget } from '@/lib/data/concierge';

jest.mock('next/navigation', () => jest.requireActual<NavigationMock>('@/__tests__/helpers/navigation').mockNavigation);

// P3-08, D94 (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Usher): with Guide me on, a concierge.navigate body
// takes the visitor to an allowlisted page, with a notice in the transcript, at most once per 8 s, never from /talk.

const TARGETS = usherTargets([
  { slug: 'agent-harness', title: 'Agent Harness: overnight software delivery with verification gates' },
  { slug: 'ghl-jobtread-integration', title: 'GoHighLevel ↔ JobTread Integration' },
]);

const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const realFetch = global.fetch;
let clock = 1_000_000;

beforeEach(() => {
  localStorage.clear();
  resetNavigation();
  clock = 1_000_000;
  jest.spyOn(performance, 'now').mockImplementation(() => clock);
  global.fetch = jest.fn(async () =>
    reply(200, { url: 'wss://concierge.test.invalid', token: 'test-token' })
  ) as unknown as typeof fetch;
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

let ctx: ConciergeValue;
function Probe() {
  const value = useConcierge();
  useEffect(() => {
    ctx = value;
  });
  return (
    <ol data-testid="lines">
      {value.state.lines.map((line) => (
        <li key={line.key} data-who={line.who}>
          {line.text}
        </li>
      ))}
    </ol>
  );
}

// next/link prevents the browser's own navigation and pushes; this link does the first half.
function renderUsher({ panel = false }: { panel?: boolean } = {}) {
  return render(
    <ConciergeProvider configured usherTargets={TARGETS}>
      <Probe />
      <a href="/experience" onClick={(event) => event.preventDefault()}>
        a link on the page
      </a>
      {panel && <ConciergePanel />}
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

const navigate = (
  room: ReturnType<typeof lastRoom>,
  href: string,
  extra: Record<string, unknown> = {},
  identity = 'agent-1'
) =>
  act(() =>
    pushText(room, TOPIC.navigate, JSON.stringify({ href, reason: 'asked about it', at: null, ...extra }), { identity })
  );

const notices = () => [...screen.getByTestId('lines').querySelectorAll('[data-who="notice"]')].map((li) => li.textContent);

describe('usherTargets', () => {
  it("keeps each project's slug and its title up to the first colon", () => {
    expect(TARGETS).toEqual([
      { slug: 'agent-harness', title: 'Agent Harness' },
      { slug: 'ghl-jobtread-integration', title: 'GoHighLevel ↔ JobTread Integration' },
    ]);
  });

  it('waits 8 s between follows', () => {
    expect(USHER_INTERVAL_MS).toBe(8_000);
  });
});

describe('the usher (concierge.navigate)', () => {
  it('registers the navigate handler before connect() and unregisters all four topics at teardown', async () => {
    renderUsher();
    const room = await goLive();
    expect(room.textHandlers.has(TOPIC.navigate)).toBe(true);
    const unregister = jest.spyOn(room, 'unregisterTextStreamHandler');
    act(() => ctx.leave());
    expect(unregister.mock.calls.map(([topic]) => topic).sort()).toEqual(
      [TOPIC.memory, TOPIC.metrics, TOPIC.navigate, TOPIC.transcription].sort()
    );
  });

  it('follows an allowed project href with one push and one notice naming the short title', async () => {
    renderUsher();
    const room = await goLive();
    await navigate(room, '/projects/agent-harness');
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/projects/agent-harness');
    expect(notices()).toEqual(['Taking you to Agent Harness']);
  });

  it('names a page by its page name and a title without a colon whole', async () => {
    navigation.pathname = '/contact';
    renderUsher();
    const room = await goLive();
    await navigate(room, '/skills');
    clock += USHER_INTERVAL_MS;
    await navigate(room, '/projects/ghl-jobtread-integration');
    clock += USHER_INTERVAL_MS;
    await navigate(room, '/');
    expect(mockRouter.push.mock.calls).toEqual([['/skills'], ['/projects/ghl-jobtread-integration'], ['/']]);
    expect(notices()).toEqual([
      'Taking you to Skills',
      'Taking you to GoHighLevel ↔ JobTread Integration',
      'Taking you to Home',
    ]);
  });

  it('follows at most once per 8 s, counting from the last follow', async () => {
    renderUsher();
    const room = await goLive();
    await navigate(room, '/about');
    clock += 3_000;
    await navigate(room, '/contact');
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(notices()).toHaveLength(1);
    clock += 6_000; // 9 s after the first follow: the refused body didn't restart the clock
    await navigate(room, '/contact');
    expect(mockRouter.push.mock.calls).toEqual([['/about'], ['/contact']]);
    expect(notices()).toEqual(['Taking you to About', 'Taking you to Contact']);
  });

  it.each(['/projects/unknown', 'https://x', '//evil', '/talk', '/about?x', '/projects/'])(
    'ignores %s: no push and no line',
    async (href) => {
      renderUsher();
      const room = await goLive();
      await navigate(room, href);
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(notices()).toEqual([]);
    }
  );

  // Review P3-08-2: only the agent's show_page tool may move the visitor, not any participant in the room.
  it('ignores a body from anyone but the agent', async () => {
    renderUsher();
    const room = await goLive();
    await navigate(room, '/about', {}, 'someone-else');
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
  });

  // Review P3-08-1: a link the visitor clicked wins; the agent waits 8 s after it, as after its own follow.
  it("doesn't override the visitor's own navigation for 8 s", async () => {
    renderUsher();
    const room = await goLive();
    fireEvent.click(screen.getByRole('link', { name: 'a link on the page' }));
    clock += 1_000;
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
    clock += USHER_INTERVAL_MS;
    await navigate(room, '/about');
    expect(mockRouter.push).toHaveBeenCalledWith('/about');
  });

  it('counts back and forward as the visitor navigating', async () => {
    renderUsher();
    const room = await goLive();
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('a link opened in a new tab is not a navigation away', async () => {
    renderUsher();
    const room = await goLive();
    fireEvent.click(screen.getByRole('link', { name: 'a link on the page' }), { metaKey: true });
    await navigate(room, '/about');
    expect(mockRouter.push).toHaveBeenCalledWith('/about');
  });

  it('a refused href does not start the clock', async () => {
    renderUsher();
    const room = await goLive();
    await navigate(room, '/projects/unknown');
    clock += 1_000;
    await navigate(room, '/about');
    expect(mockRouter.push).toHaveBeenCalledWith('/about');
  });

  it('ignores the page the visitor is already on, and keeps the clock for the next follow', async () => {
    navigation.pathname = '/about';
    renderUsher();
    const room = await goLive();
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
    await navigate(room, '/skills');
    expect(mockRouter.push).toHaveBeenCalledWith('/skills');
  });

  it('never navigates away from /talk', async () => {
    navigation.pathname = talkWidget.href;
    renderUsher();
    const room = await goLive();
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
  });

  it('reads the pathname at the time of the body, not at Connect', async () => {
    const view = renderUsher();
    const room = await goLive();
    navigation.pathname = talkWidget.href;
    view.rerender(
      <ConciergeProvider configured usherTargets={TARGETS}>
        <Probe />
      </ConciergeProvider>
    );
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('does nothing with Guide me off', async () => {
    renderUsher();
    const room = await goLive();
    act(() => ctx.setGuideMe(false));
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
  });

  it('drops a body over 1 KiB', async () => {
    renderUsher();
    const room = await goLive();
    await navigate(room, '/about', { reason: 'x'.repeat(1100) });
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
  });

  it('drops a malformed body', async () => {
    renderUsher();
    const room = await goLive();
    await act(() => pushText(room, TOPIC.navigate, '{"href": '));
    await act(() => pushText(room, TOPIC.navigate, '{"href": ""}'));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(notices()).toEqual([]);
  });

  it('ignores a body that lands after Leave', async () => {
    renderUsher();
    const room = await goLive();
    const handler = room.textHandlers.get(TOPIC.navigate)!;
    act(() => ctx.leave());
    room.textHandlers.set(TOPIC.navigate, handler);
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('a notice does not finalise the agent line being spoken', async () => {
    renderUsher();
    const room = await goLive();
    await act(() =>
      pushText(room, TOPIC.transcription, 'Let me show', {
        attributes: { 'lk.segment_id': 'seg-1', 'lk.transcription_final': 'false' },
      })
    );
    await navigate(room, '/about');
    expect(ctx.state.lines.find((line) => line.key === 'seg-1')?.final).toBe(false);
    expect(ctx.state.lines.at(-1)).toEqual({ key: 'notice-1', who: 'notice', text: 'Taking you to About', final: true });
  });
});

describe('the Guide me switch', () => {
  const guideMe = () => screen.getByRole('switch', { name: talkWidget.guideMe });

  it('is on by default and in the panel header', () => {
    renderUsher({ panel: true });
    act(() => ctx.openPanel());
    expect(guideMe()).toHaveAttribute('aria-checked', 'true');
  });

  it("renders unchecked when the stored value is 'off'", () => {
    localStorage.setItem(GUIDE_ME_KEY, 'off');
    renderUsher({ panel: true });
    act(() => ctx.openPanel());
    expect(guideMe()).toHaveAttribute('aria-checked', 'false');
    expect(ctx.guideMe).toBe(false);
  });

  it('flips on click and stores on/off', () => {
    renderUsher({ panel: true });
    act(() => ctx.openPanel());
    fireEvent.click(guideMe());
    expect(guideMe()).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem(GUIDE_ME_KEY)).toBe('off');
    fireEvent.click(guideMe());
    expect(guideMe()).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(GUIDE_ME_KEY)).toBe('on');
  });

  it('stays on, and still flips, when storage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderUsher({ panel: true });
    act(() => ctx.openPanel());
    expect(guideMe()).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(guideMe());
    expect(guideMe()).toHaveAttribute('aria-checked', 'false');
  });

  it('turned off in the panel stops the usher', async () => {
    renderUsher({ panel: true });
    act(() => ctx.openPanel());
    const room = await goLive();
    fireEvent.click(guideMe());
    await navigate(room, '/about');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
