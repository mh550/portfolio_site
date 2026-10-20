import fs from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import TalkPage, { metadata } from '@/app/talk/page';
import { privacyNote, talkPage } from '@/lib/data';

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
    for (const sentence of talkPage.intro) expect(screen.getByText(sentence)).toBeInTheDocument();
  });

  it('renders the session in its idle state: Connect, and no offline line yet', () => {
    render(<TalkPage />);
    expect(screen.getByRole('button', { name: talkPage.labels.connect })).toBeInTheDocument();
    expect(screen.queryByText(talkPage.offlineMessage)).toBeNull();
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
