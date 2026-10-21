import { metadata } from '@/app/layout';
import { profile } from '@/lib/data';

describe('root metadata', () => {
  it('title is the name and positioning', () => {
    expect(metadata.title).toBe('Michael Herron — Agentic Systems Engineer');
  });

  it('description is the subline', () => {
    expect(metadata.description).toBe(profile.subline);
  });

  it('metadataBase is the site URL (D24)', () => {
    expect(String(metadata.metadataBase)).toBe('https://michael-herron.vercel.app/');
  });

  it('openGraph has the site name and the headshot', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.siteName).toBe('Michael Herron');
    expect(JSON.stringify(og.images)).toContain('/photos/headshot.png');
  });

  it('openGraph has no title, description or url, so pages keep their own', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og).not.toHaveProperty('title');
    expect(og).not.toHaveProperty('description');
    expect(og).not.toHaveProperty('url');
  });

  // twitter:image comes from og:image; root twitter images would mask a page's own og:image
  it('twitter card is summary with no images of its own', () => {
    expect(metadata.twitter).toEqual({ card: 'summary' });
  });
});

// M8-02: native scrollbars and form controls follow the dark theme; the browser bar matches the background.
describe('root viewport', () => {
  it('declares the dark colour scheme and the background as theme colour', async () => {
    const { viewport } = await import('@/app/layout');
    expect(viewport).toEqual({ colorScheme: 'dark', themeColor: '#0a0a0f' });
  });

  it('/card/qr is black on white, so it declares the light scheme', async () => {
    const { viewport } = await import('@/app/card/qr/page');
    expect(viewport).toEqual({ colorScheme: 'light', themeColor: '#ffffff' });
  });
});
