import fs from 'fs';
import path from 'path';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TalkPage, { metadata } from '@/app/talk/page';
import ConciergeProvider from '@/components/concierge/ConciergeProvider';
import { focusRing } from '@/components/focusRing';
import { introText, privacyNote, talkPage } from '@/lib/data';

const fetchMock = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ offline: true }) }));
const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  localStorage.clear();
});

// The call is ConciergeProvider's, around the chrome (D85); `configured` reaches it from layout.tsx
// (layout-concierge.test.tsx), not from this page.
const renderPage = ({ configured = false } = {}) =>
  render(
    <ConciergeProvider configured={configured}>
      <TalkPage />
    </ConciergeProvider>
  );

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
    renderPage();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Talk to my concierge');
    expect(screen.getByText(talkPage.eyebrow)).toBeInTheDocument();
    const paragraphs = screen.getAllByRole('paragraph').map((p) => p.textContent);
    for (const p of talkPage.intro) expect(paragraphs).toContain(introText(p));
  });

  // D62: the first intro sentence credits the agent harness and links its case study.
  it('links "my agent harness" in the intro to the agent-harness case study', () => {
    renderPage();
    const link = screen.getByRole('link', { name: 'my agent harness' });
    expect(link).toHaveAttribute('href', '/projects/agent-harness');
    expect(link.closest('p')).toHaveTextContent(
      'A voice agent I designed on LiveKit and built with my agent harness: specs in, verified milestones out. It remembers you between visits.',
    );
    const classes = link.className.split(/\s+/);
    expect(classes).toContain('underline');
    for (const token of focusRing.split(' ')) expect(classes).toContain(token);
  });

  it('renders the session in its idle state: Connect, and no offline line yet', () => {
    renderPage();
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeInTheDocument();
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
  });

  // Without LiveKit env the token route can only answer 503, which Chromium logs as a console error: the layout knows
  // that at render time and Connect goes offline without the request (D46).
  it('unconfigured, Connect shows the offline line and makes no request', async () => {
    renderPage({ configured: false });
    await pressConnect();
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('configured, Connect asks the token route', async () => {
    renderPage({ configured: true });
    await pressConnect();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(talkPage.offlineMessage);
  });

  it('renders the privacy note, every point, after the session', () => {
    renderPage();
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

  // D85: the env check moved to layout.tsx; the page passes TalkSession nothing.
  it('no longer reads the LiveKit env or passes configured', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/app/talk/page.tsx'), 'utf8');
    expect(source).not.toMatch(/concierge\/env/);
    expect(source).toMatch(/<TalkSession \/>/);
  });
});
