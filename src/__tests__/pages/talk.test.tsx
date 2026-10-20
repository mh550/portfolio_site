import fs from 'fs';
import path from 'path';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TalkPage, { metadata } from '@/app/talk/page';
import { focusRing } from '@/components/focusRing';
import { introText, privacyNote, talkPage } from '@/lib/data';

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
let savedEnv: Record<string, string | undefined>;
const fetchMock = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ offline: true }) }));
const realFetch = global.fetch;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  global.fetch = realFetch;
  localStorage.clear();
});

async function pressConnect() {
  await userEvent.setup().click(screen.getByRole('button', { name: talkPage.labels.connect }));
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
}

describe('TalkPage', () => {
  it('has the title and the description from talkPage', () => {
    expect(metadata.title).toBe('Talk to my concierge — Michael Herron');
    expect(metadata.description).toBe(talkPage.description);
  });

  it('renders one h1, the eyebrow and the intro', () => {
    render(<TalkPage />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Talk to my concierge');
    expect(screen.getByText(talkPage.eyebrow)).toBeInTheDocument();
    const paragraphs = screen.getAllByRole('paragraph').map((p) => p.textContent);
    for (const p of talkPage.intro) expect(paragraphs).toContain(introText(p));
  });

  // D62: the first intro sentence credits the agent harness and links its case study.
  it('links "my agent harness" in the intro to the agent-harness case study', () => {
    render(<TalkPage />);
    const link = screen.getByRole('link', { name: 'my agent harness' });
    expect(link).toHaveAttribute('href', '/projects/agent-harness');
    expect(link.closest('p')).toHaveTextContent(
      'A voice agent I designed on LiveKit and built with my agent harness: specs in, verified milestones out. It remembers you between visits.',
    );
    expect(link.className).toContain('underline');
    for (const token of focusRing.split(' ')) expect(link.className).toContain(token);
  });

  it('renders the session in its idle state: Connect, and no offline line yet', () => {
    render(<TalkPage />);
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeInTheDocument();
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
  });

  // Without LiveKit env the token route can only answer 503, which Chromium logs as a console error: the page knows
  // that at render time and Connect goes offline without the request (D46).
  it('without the LiveKit env, Connect shows the offline line and makes no request', async () => {
    render(<TalkPage />);
    await pressConnect();
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('with the LiveKit env set, Connect asks the token route', async () => {
    process.env.LIVEKIT_URL = 'wss://concierge.test.invalid';
    process.env.LIVEKIT_API_KEY = 'k'.repeat(12);
    process.env.LIVEKIT_API_SECRET = 'x'.repeat(32);
    render(<TalkPage />);
    await pressConnect();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
  });

  it('renders the privacy note, every point, after the session', () => {
    render(<TalkPage />);
    const privacy = screen.getByRole('region', { name: talkPage.headings.privacy });
    const items = within(privacy).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(privacyNote);
    const connect = screen.getByRole('button', { name: talkPage.labels.connect });
    expect(connect.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is a Server Component that imports nothing from LiveKit', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/app/talk/page.tsx'), 'utf8');
    expect(source).not.toMatch(/['"]use client['"]/);
    expect(source).not.toMatch(/livekit/);
  });
});
