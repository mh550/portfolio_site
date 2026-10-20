/**
 * @jest-environment node
 */
import { isAllowedOrigin } from '@/lib/concierge/origin';
import { profile } from '@/lib/data';

const SITE = profile.siteUrl;
const prod = { siteUrl: SITE, dev: false };
const dev = { siteUrl: SITE, dev: true };

describe('isAllowedOrigin', () => {
  it('is false without an Origin header', () => {
    expect(isAllowedOrigin(null, prod)).toBe(false);
    expect(isAllowedOrigin(null, dev)).toBe(false);
  });

  it("allows the site's own origin, over https only", () => {
    expect(isAllowedOrigin('https://michael-herron.vercel.app', prod)).toBe(true);
    expect(isAllowedOrigin('http://michael-herron.vercel.app', prod)).toBe(false);
  });

  it('compares the whole origin, never a prefix or substring', () => {
    expect(isAllowedOrigin('https://michael-herron.vercel.app.evil.example', prod)).toBe(false);
    expect(isAllowedOrigin('https://evil.example', prod)).toBe(false);
    expect(isAllowedOrigin('https://michael-herron.vercel.app/', prod)).toBe(false);
    expect(isAllowedOrigin('https://michael-herron.vercel.app/talk', prod)).toBe(false);
    expect(isAllowedOrigin('https://MICHAEL-HERRON.vercel.app', prod)).toBe(false);
    expect(isAllowedOrigin('https://user@michael-herron.vercel.app', prod)).toBe(false);
    expect(isAllowedOrigin('https://michael-herron.vercel.app:8443', prod)).toBe(false);
    // Browsers never send these; URL normalises the first, the second is another host. Both fail closed.
    expect(isAllowedOrigin('https://michael-herron.vercel.app:443', prod)).toBe(false);
    expect(isAllowedOrigin('https://michael-herron.vercel.app.', prod)).toBe(false);
  });

  it('allows Vercel previews of this project and team (D64)', () => {
    expect(
      isAllowedOrigin('https://portfolio-site-git-harness-merg-e67481-mh550s-projects-e64e7e0b.vercel.app', prod),
    ).toBe(true);
    expect(isAllowedOrigin('https://portfolio-site-abc123-mh550s-projects.vercel.app', prod)).toBe(true);
  });

  it('refuses hosts that only look like a preview', () => {
    expect(isAllowedOrigin('https://evil-mh550s-projects-e64e7e0b.vercel.app', prod)).toBe(false);
    expect(isAllowedOrigin('https://portfolio-site-x-mh550s-projects.vercel.app.evil.example', prod)).toBe(false);
    expect(isAllowedOrigin('http://portfolio-site-abc123-mh550s-projects.vercel.app', prod)).toBe(false);
    expect(isAllowedOrigin('https://portfolio-site-abc123-mh550s-projects.vercel.app:8443', prod)).toBe(false);
  });

  it.each(['http://localhost:7834', 'http://127.0.0.1:3000'])('allows %s in development only', (origin) => {
    expect(isAllowedOrigin(origin, dev)).toBe(true);
    expect(isAllowedOrigin(origin, prod)).toBe(false);
  });

  it('refuses https localhost and other local names even in development', () => {
    expect(isAllowedOrigin('https://localhost:7834', dev)).toBe(false);
    expect(isAllowedOrigin('http://localhost.evil.example:7834', dev)).toBe(false);
  });

  it("is false, without throwing, for the literal 'null' and non-URL strings", () => {
    for (const origin of ['null', 'not a url', '', '://', 'michael-herron.vercel.app']) {
      expect(() => isAllowedOrigin(origin, dev)).not.toThrow();
      expect(isAllowedOrigin(origin, dev)).toBe(false);
    }
  });
});
