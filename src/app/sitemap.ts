import type { MetadataRoute } from 'next';
import { profile, projects } from '@/lib/data';

// /evidence (noindex) and /card/qr are left out on purpose; robots.ts disallows them
const routes = ['/', '/about', '/skills', '/projects', '/approach', '/experience', '/contact', '/card'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...routes.map((route) => ({ url: route === '/' ? profile.siteUrl : `${profile.siteUrl}${route}` })),
    ...[...projects]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ url: `${profile.siteUrl}/projects/${p.slug}` })),
  ];
}
