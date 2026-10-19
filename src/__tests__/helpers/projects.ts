import { getProjectBySlug, projects } from '@/lib/data';

// Tests take a project out of the real `projects` array and put it back in `finally`: a jest.mock of
// @/lib/data/projects with requireActual recurses through the approach.ts ↔ projects.ts import cycle.

/** Runs `fn` with `slug` taken out of `projects`, then puts it back where it was. */
export function withoutProject<T>(slug: string, fn: () => T): T {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) throw new Error(`no project ${slug}`);
  const [removed] = projects.splice(i, 1);
  try {
    return fn();
  } finally {
    projects.splice(i, 0, removed);
  }
}

/** Runs `fn` with `slug`'s caseStudy removed, then restores it. */
export function withoutCaseStudy<T>(slug: string, fn: () => T): T {
  const project = getProjectBySlug(slug);
  if (!project) throw new Error(`no project ${slug}`);
  const saved = project.caseStudy;
  project.caseStudy = undefined;
  try {
    return fn();
  } finally {
    project.caseStudy = saved;
  }
}
