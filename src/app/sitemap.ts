import type { MetadataRoute } from 'next';
import { profile, sortByOrder } from '@/lib/data';

// /evidence (noindex) and /card/qr are left out on purpose; robots.ts disallows them
const routes = ['/', '/about', '/skills', '/projects', '/approach', '/experience', '/contact', '/card', '/talk'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...routes.map((route) => ({ url: route === '/' ? profile.siteUrl : `${profile.siteUrl}${route}` })),
    ...sortByOrder().map((p) => ({ url: `${profile.siteUrl}/projects/${p.slug}` })),
  ];
}
