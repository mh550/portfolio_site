// The token route's Origin allowlist (plan docs/plans/2026-10-20-VC5-mic-limits-server-only.md § Origin rules, D63,
// D64). It stops other websites spending through their visitors' browsers and turns a bare curl away; a shell can
// still forge the header, so it is not auth: the room limits and the provider caps bound cost.

// The production custom domain: michael-herron.vercel.app (profile.siteUrl) redirects here with a 308, so the page's
// fetch carries this Origin in production.
const CUSTOM_ORIGINS = new Set(['https://mherron.dev', 'https://www.mherron.dev']);
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

// This deployment's own Vercel hosts (VERCEL_URL, VERCEL_BRANCH_URL; system env, no scheme), so a preview can talk
// to itself. Exact hosts, not a pattern: a pattern over `<project>-<hash>-<team>.vercel.app` also matches a project
// anyone can name `portfolio-site-evil-mh550s-projects` (D64 review).
export function ownVercelHosts(env: Record<string, string | undefined> = process.env): string[] {
  return [env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter((h): h is string => !!h);
}

export function isAllowedOrigin(origin: string | null, opts: { siteUrl: string; dev: boolean; vercelHosts?: string[] }): boolean {
  if (origin === null) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  // Only a bare origin: rejects a path, a trailing slash, userinfo or upper case, and the literal 'null' (whose
  // parse throws above anyway).
  if (url.origin !== origin) return false;
  if (url.origin === new URL(opts.siteUrl).origin || CUSTOM_ORIGINS.has(url.origin)) return true;
  if (url.protocol === 'https:' && (opts.vercelHosts ?? []).includes(url.host)) return true;
  return opts.dev && url.protocol === 'http:' && DEV_HOSTS.has(url.hostname);
}
