import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { profile, projects } from '@/lib/data';

const appDir = path.join(process.cwd(), 'src/app');
const pageExists = (route: string) => fs.existsSync(path.join(appDir, route, 'page.tsx'));

describe('sitemap', () => {
  const urls = sitemap().map((e) => e.url);

  it('lists every top-level page that exists, built from profile.siteUrl', () => {
    const routes = ['/', '/about', '/skills', '/projects', '/experience', '/contact', '/approach', '/card'];
    for (const route of routes.filter(pageExists)) {
      expect(urls).toContain(route === '/' ? profile.siteUrl : `${profile.siteUrl}${route}`);
    }
    expect(routes.filter(pageExists)).toHaveLength(8);
  });

  it('lists every project page', () => {
    for (const p of projects) expect(urls).toContain(`${profile.siteUrl}/projects/${p.slug}`);
    expect(urls).toHaveLength(8 + projects.length);
  });

  it('excludes /evidence and /card/qr', () => {
    expect(urls.some((u) => u.endsWith('/evidence'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/card/qr'))).toBe(false);
  });

  it('every url starts with the site URL', () => {
    for (const u of urls) expect(u.startsWith(profile.siteUrl)).toBe(true);
  });
});

describe('robots', () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];

  it('disallows /evidence and /card/qr', () => {
    const disallow = rules.flatMap((rule) => [rule.disallow ?? []].flat());
    expect(disallow).toEqual(expect.arrayContaining(['/evidence', '/card/qr']));
  });

  it('allows everything else for every user agent', () => {
    expect(rules[0].userAgent).toBe('*');
    expect(rules[0].allow).toBe('/');
  });

  it('points to the sitemap on the site URL', () => {
    expect(r.sitemap).toBe(`${profile.siteUrl}/sitemap.xml`);
  });
});
