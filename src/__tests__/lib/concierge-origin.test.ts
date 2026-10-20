/**
 * @jest-environment node
 */
import { isAllowedOrigin, ownVercelHosts } from '@/lib/concierge/origin';
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

  it('allows the production custom domain, mherron.dev, where profile.siteUrl redirects', () => {
    expect(isAllowedOrigin('https://mherron.dev', prod)).toBe(true);
    expect(isAllowedOrigin('https://www.mherron.dev', prod)).toBe(true);
    expect(isAllowedOrigin('http://mherron.dev', prod)).toBe(false);
    expect(isAllowedOrigin('https://mherron.dev.evil.example', prod)).toBe(false);
    expect(isAllowedOrigin('https://evil.mherron.dev', prod)).toBe(false);
  });

  const PREVIEW = 'portfolio-site-git-harness-merg-e67481-mh550s-projects-e64e7e0b.vercel.app';
  const withPreview = { ...prod, vercelHosts: [PREVIEW] };

  it("allows exactly this deployment's own Vercel hosts (D64)", () => {
    expect(isAllowedOrigin(`https://${PREVIEW}`, withPreview)).toBe(true);
    expect(isAllowedOrigin(`https://${PREVIEW}`, prod)).toBe(false);
  });

  it('refuses other Vercel hosts, including look-alikes of this project and team', () => {
    expect(isAllowedOrigin('https://portfolio-site-evil-mh550s-projects.vercel.app', withPreview)).toBe(false);
    expect(isAllowedOrigin('https://portfolio-site-abc123-mh550s-projects.vercel.app', withPreview)).toBe(false);
    expect(isAllowedOrigin(`https://${PREVIEW}.evil.example`, withPreview)).toBe(false);
    expect(isAllowedOrigin(`http://${PREVIEW}`, withPreview)).toBe(false);
    expect(isAllowedOrigin(`https://${PREVIEW}:8443`, withPreview)).toBe(false);
  });

  it('reads the own hosts from VERCEL_URL and VERCEL_BRANCH_URL, skipping unset ones', () => {
    expect(ownVercelHosts({ VERCEL_URL: 'a.vercel.app', VERCEL_BRANCH_URL: 'b.vercel.app' })).toEqual([
      'a.vercel.app',
      'b.vercel.app',
    ]);
    expect(ownVercelHosts({ VERCEL_URL: '' })).toEqual([]);
    expect(ownVercelHosts({})).toEqual([]);
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
