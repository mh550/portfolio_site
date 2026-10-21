import nextConfig from '../../../next.config';

// P1-05, D79: /approach folded into /about's How I work section; the old URL answers 308 to it.
describe('/approach redirect (P1-05, D79)', () => {
  it('next.config redirects /approach permanently to /about#how-i-work', async () => {
    expect(nextConfig.redirects).toBeDefined();
    const redirects = await nextConfig.redirects!();
    const entries = Array.isArray(redirects) ? redirects : [];
    expect(entries).toContainEqual({ source: '/approach', destination: '/about#how-i-work', permanent: true });
  });
});
