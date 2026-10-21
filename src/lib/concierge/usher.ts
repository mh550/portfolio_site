// The usher's targets (D94, plan docs/plans/2026-10-21-P3-concierge-in-site.md § Usher): the project slugs the
// allowlist accepts and the names the transcript notice uses. layout.tsx builds them on the server from projects.ts
// and passes them down as a prop, so the client bundle never imports the projects data.

export interface UsherTarget {
  slug: string;
  title: string;
}

// The agent can't move the visitor more often than this: a follow, then at least this long before the next.
export const USHER_INTERVAL_MS = 8_000;

const PROJECT_PREFIX = '/projects/';

// Each project's slug and its title up to the first colon ("Agent Harness"); a title without one stays whole.
export function usherTargets(projects: readonly UsherTarget[]): UsherTarget[] {
  return projects.map(({ slug, title }) => ({ slug, title: title.split(':')[0].trim() }));
}

// What the notice calls an allowed href: a page's name, or the project's short title. Null for anything else.
export function usherName(
  href: string,
  targets: readonly UsherTarget[],
  pageNames: Readonly<Record<string, string>>
): string | null {
  if (Object.prototype.hasOwnProperty.call(pageNames, href)) return pageNames[href];
  if (!href.startsWith(PROJECT_PREFIX)) return null;
  const slug = href.slice(PROJECT_PREFIX.length);
  return targets.find((target) => target.slug === slug)?.title ?? null;
}
