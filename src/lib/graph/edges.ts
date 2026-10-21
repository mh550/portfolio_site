// The project ends of the /skills edges: pure, no data import (types only), so the client component can use them
// without pulling src/lib/data/skills.ts's arrays into its bundle. Re-exported by skills.ts.
import type { EdgeTo, SkillEdge } from '@/lib/data/skills';

/** The slug of a `project:<slug>` edge end, or null for a node id. */
export function projectSlug(to: EdgeTo): string | null {
  return to.startsWith('project:') ? to.slice('project:'.length) : null;
}

/** The slugs of the projects a node is linked to, in edge order. */
export function projectsOf(list: SkillEdge[], nodeId: string): string[] {
  return list.flatMap((e) => (e.from === nodeId ? (projectSlug(e.to) ?? []) : []));
}

/** The node ids a project is linked to, in edge order. */
export function nodesOf(list: SkillEdge[], slug: string): string[] {
  return list.filter((e) => e.to === `project:${slug}`).map((e) => e.from);
}
