import type { MetadataRoute } from 'next';
import { profile } from '@/lib/data';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/evidence', '/card/qr'] },
    sitemap: `${profile.siteUrl}/sitemap.xml`,
  };
}
