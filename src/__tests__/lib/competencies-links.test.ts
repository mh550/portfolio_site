/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import {
  competencies,
  getCaseStudyAnchors,
  getProjectBySlug,
  resolvedItems,
  type Competency,
} from '@/lib/data';
import { withoutProject, withoutCaseStudy } from '../helpers/projects';

const ROOT = path.resolve(__dirname, '../../..');
const collapse = (s: string) => s.replace(/\s+/g, ' ');
const read = (rel: string) => collapse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const BRAND = read('docs/notes/brand.md');
const BRIEFS_AND_SPEC = [
  'docs/notes/evidence-agent-harness.md',
  'docs/notes/evidence-media-server.md',
  'docs/notes/evidence-hit-list.md',
  'docs/specs/2026-10-18-portfolio-v2.md',
].map(read);

const ROUTES = ['/', '/about', '/skills', '/projects', '/experience', '/contact', '/approach', '/card'];
const ANCHORS = ['diagnose', 'decide', 'build', 'verify', 'simplify', 'decisions', 'iterations', 'lessons'];
const REPOS = ['agent-harness', 'hit-list', 'dj-crate-streaming', 'portfolio_site'].map(
  (r) => `https://github.com/mh550/${r}`,
);

const allItems = competencies.flatMap((c) => c.items);
const allResolved = competencies.flatMap((c) => resolvedItems(c));

/** Why `href` is not allowed, or null when it is. */
function hrefProblem(href: string): string | null {
  if (href.startsWith('https://')) return REPOS.includes(href) ? null : `${href} is not a public repo root`;
  if (ROUTES.includes(href)) return null;
  const m = href.match(/^\/projects\/([a-z0-9-]+)(?:#([a-z]+))?$/);
  if (!m) return `${href} is not an allowed route`;
  const project = getProjectBySlug(m[1]);
  if (!project) return `${href}: no project ${m[1]}`;
  if (m[2] === undefined) return null;
  if (!ANCHORS.includes(m[2])) return `${href}: ${m[2]} is not a case-study anchor`;
  if (!getCaseStudyAnchors(project).includes(m[2])) return `${href}: ${m[1]} does not render #${m[2]}`;
  return null;
}

describe('competencies', () => {
  it('has the six competencies in order', () => {
    expect(competencies.map((c) => c.title)).toEqual([
      'Diagnose problems in real processes',
      'Design systems and make decisions explicit',
      'Deliver working, verified software',
      'Lead process and delivery',
      'Communicate and teach',
      'Use AI with guardrails',
    ]);
  });

  it('gives each competency 2–4 items, each with text, a context and a source', () => {
    for (const c of competencies) {
      expect(c.items.length).toBeGreaterThanOrEqual(2);
      expect(c.items.length).toBeLessThanOrEqual(4);
      for (const item of c.items) {
        expect(item.text.length).toBeGreaterThan(20);
        expect(['MAXX Potential', 'Builder Clarity', 'Personal']).toContain(item.context);
        expect(item.source.length).toBeGreaterThan(8);
      }
    }
  });

  it('has a MAXX Potential item in at least four competencies', () => {
    const withMaxx = competencies.filter((c) => c.items.some((i) => i.context === 'MAXX Potential'));
    expect(withMaxx.length).toBeGreaterThanOrEqual(4);
  });

  it('finds every MAXX Potential and Builder Clarity source in brand.md', () => {
    const missing = allItems
      .filter((i) => i.context !== 'Personal' && !BRAND.includes(collapse(i.source)))
      .map((i) => i.source);
    expect(missing).toEqual([]);
  });

  it('finds every Personal source in an evidence brief or the spec', () => {
    const missing = allItems
      .filter((i) => i.context === 'Personal' && !BRIEFS_AND_SPEC.some((doc) => doc.includes(collapse(i.source))))
      .map((i) => i.source);
    expect(missing).toEqual([]);
  });

  it('uses unique item texts (they are the link names)', () => {
    const texts = allItems.map((i) => i.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe('competency hrefs', () => {
  it('accepts only the allowed hrefs (sanity check of the checker)', () => {
    expect(hrefProblem('/experience')).toBeNull();
    expect(hrefProblem('https://github.com/mh550/hit-list')).toBeNull();
    expect(hrefProblem('/evidence')).not.toBeNull();
    expect(hrefProblem('https://github.com/mh550/hit-list/tree/main')).not.toBeNull();
    expect(hrefProblem('/projects/no-such-project')).not.toBeNull();
    expect(hrefProblem('/projects/agent-harness#problem')).not.toBeNull();
    expect(hrefProblem('/projects/linear-ai-workflow#decide')).not.toBeNull();
  });

  it('points every item at an allowed route, an existing project anchor or a public repo root', () => {
    const problems = allItems.map((i) => hrefProblem(i.href)).filter(Boolean);
    expect(problems).toEqual([]);
  });

  it('never links /evidence itself', () => {
    for (const i of allItems) expect(i.href.split('#')[0]).not.toBe('/evidence');
  });
});

describe('resolvedItems', () => {
  it('keeps every item on the current data, every href still allowed', () => {
    expect(allResolved).toHaveLength(allItems.length);
    expect(allResolved.map((i) => hrefProblem(i.href)).filter(Boolean)).toEqual([]);
  });

  const harness = (c: Competency) => c.items.filter((i) => i.href.startsWith('/projects/agent-harness'));

  it('drops the items of a project that is not on the branch', () => {
    const before = competencies.flatMap(harness);
    expect(before.length).toBeGreaterThan(0);
    withoutProject('agent-harness', () => {
      const resolved = competencies.flatMap((c) => resolvedItems(c));
      expect(resolved.filter((i) => i.href.startsWith('/projects/agent-harness'))).toEqual([]);
      expect(resolved).toHaveLength(allItems.length - before.length);
      expect(resolved.map((i) => hrefProblem(i.href)).filter(Boolean)).toEqual([]);
    });
  });

  it('drops the anchor, not the item, when the project renders no such section', () => {
    withoutCaseStudy('agent-harness', () => {
      const resolved = competencies.flatMap((c) => resolvedItems(c));
      expect(resolved).toHaveLength(allItems.length);
      const hrefs = resolved.filter((i) => i.href.startsWith('/projects/agent-harness')).map((i) => i.href);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) expect(href).toBe('/projects/agent-harness');
    });
  });

  it('leaves routes and repo links alone', () => {
    const c = competencies[0];
    const fake: Competency = {
      ...c,
      items: [
        { text: 'An item that links a route', href: '/experience', context: 'Personal', source: 'whatever source' },
        { text: 'An item that links a repo', href: REPOS[0], context: 'Personal', source: 'whatever source' },
      ],
    };
    expect(resolvedItems(fake)).toEqual(fake.items);
  });
});
