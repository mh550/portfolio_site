// The token route's Origin allowlist (plan docs/plans/2026-10-20-VC5-mic-limits-server-only.md § Origin rules, D63,
// D64). It stops other websites spending through their visitors' browsers and turns a bare curl away; a shell can
// still forge the header, so it is not auth: the room limits and the provider caps bound cost.

// Vercel previews of project portfolio-site under team mh550s-projects: `<project>-git-<branch>-<team>` or
// `<project>-<hash>-<team>`, with a hash suffix when the name is truncated.
const PREVIEW_HOST = /^portfolio-site-[a-z0-9-]+-mh550s-projects(-[a-z0-9]+)?\.vercel\.app$/;
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

export function isAllowedOrigin(origin: string | null, opts: { siteUrl: string; dev: boolean }): boolean {
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
  if (url.origin === new URL(opts.siteUrl).origin) return true;
  if (url.protocol === 'https:' && url.port === '' && PREVIEW_HOST.test(url.hostname)) return true;
  return opts.dev && url.protocol === 'http:' && DEV_HOSTS.has(url.hostname);
}
