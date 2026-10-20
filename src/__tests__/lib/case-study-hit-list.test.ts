/** @jest-environment node */
// The hit-list case study (M6-02): its shape, the absence of media (no screenshots exist, none are faked, D11), and
// proof that its numbers come from the brief and that nothing private is published. Copy and traceability:
// docs/plans/2026-10-18-M6-hit-list.md. Never loosen a check to make content pass: fix the content.
import fs from 'node:fs';
import path from 'node:path';
import { getProjectBySlug, type Project } from '@/lib/data';

const ROOT = path.resolve(__dirname, '../../..');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs/notes/evidence-hit-list.md'), 'utf8');
const REPO = 'https://github.com/mh550/hit-list';

const project = getProjectBySlug('hit-list') as Project;
const cs = project?.caseStudy;

describe('hit-list entry', () => {
  it('has the header fields from the plan', () => {
    expect(project).toBeDefined();
    expect(project.title).toBe('HitList: offline-first street-spot scouting app');
    expect(project.company).toBe('Personal · iOS (Expo)');
    expect(project.categories).toEqual(['full-stack', 'process']);
    expect(project.order).toBe(7);
    expect(project.featured).toBe(true);
    expect(project.githubUrl).toBe(REPO);
  });

  it("has exactly 3 metrics carrying 374, 7 and 57; the second says it is specified", () => {
    expect(project.metrics).toHaveLength(3);
    const [first, second, third] = project.metrics!;
    expect(first.value).toContain('374');
    expect(second.value).toBe('20+ → 7');
    expect(third.value).toContain('57');
    expect(second.label).toContain('specified');
  });

  it('has five non-empty method steps', () => {
    const steps = Object.values(cs!.method);
    expect(steps).toHaveLength(5);
    for (const text of steps) expect(text.trim()).not.toBe('');
  });

  it("has the six decisions in order (HitList's own ledger ids)", () => {
    expect(cs!.decisions.map((d) => d.id)).toEqual(['D1', 'D2', 'D3', 'D12', 'D21', 'D22']);
  });

  it('has 6 iterations, the last saying the simplification is specified, not yet built', () => {
    expect(cs!.iterations).toHaveLength(6);
    const last = cs!.iterations![5];
    const text = `${last.what} ${last.why}`;
    expect(text).toContain('specified');
    expect(text).toContain('not yet built');
  });

  it("has 5 lessons, including '7679.1 mi', flexGrow and crypto.getRandomValues on Hermes", () => {
    expect(cs!.lessons).toHaveLength(5);
    for (const l of cs!.lessons) {
      expect(l.broke.trim()).not.toBe('');
      expect(l.rule.trim()).not.toBe('');
    }
    const texts = cs!.lessons.map((l) => `${l.broke} ${l.rule}`);
    for (const needle of ['7679.1 mi', 'flexGrow', 'crypto.getRandomValues', 'Hermes']) {
      expect(texts.some((t) => t.includes(needle))).toBe(true);
    }
  });

  it('has exactly one link, the repo root', () => {
    expect(cs!.links).toEqual([{ label: 'hit-list on GitHub', href: REPO, kind: 'repo' }]);
  });

  it('draws the architecture after The Problem and the form simplification after the iterations (M6-03)', () => {
    expect(project.detail.architectureDiagram).toBe('hit-list');
    expect(cs?.extraDiagrams).toEqual(['form-simplification']);
  });

  it('credits Claude Code agents (D10)', () => {
    expect(cs!.builtWith).toMatch(/Claude Code agents/);
  });
});

describe('hit-list media (D11)', () => {
  it('has no media, no thumbnail and no demo URL: no screenshots exist and none are faked', () => {
    // When Michael adds real phone shots (docs/asset-checklist.md, HitList), replace this test with media checks.
    expect(project.detail.media).toBeUndefined();
    expect(project.thumbnail).toBeUndefined();
    expect(project.demoUrl).toBeUndefined();
    expect(fs.existsSync(path.join(ROOT, 'public/projects/hit-list'))).toBe(false);
  });

  it('the asset checklist lists the phone shots, their destination and the media entry shape', () => {
    const checklist = fs.readFileSync(path.join(ROOT, 'docs/asset-checklist.md'), 'utf8');
    const section = checklist.split(/^## /m).find((s) => s.startsWith('HitList'));
    expect(section).toBeDefined();
    for (const needle of ['List', 'Map', 'Quick Add', 'detail', '15 s', 'public/projects/hit-list/', 'media: [']) {
      expect(section).toContain(needle);
    }
  });
});

describe('hit-list traceability and privacy', () => {
  it('every number in every metric value appears in the evidence brief', () => {
    const runs = project.metrics!.flatMap((m) => m.value.match(/\d+(?:[.,]\d+)*/g) ?? []);
    expect(runs).toEqual(['374', '20', '7', '54', '57']);
    // Bounded, so '7' isn't satisfied by '57' or '7679.1'.
    for (const n of runs) expect(BRIEF).toMatch(new RegExp(`(?<![\\d.,])${n}(?![\\d.,]?\\d)`));
  });

  it('every decision id appears in the evidence brief', () => {
    for (const { id } of cs!.decisions) expect(BRIEF).toMatch(new RegExp(`\\b${id}(?!\\d)`));
  });

  it('publishes no hostname, address, status-page link or branch link', () => {
    const text = JSON.stringify(project);
    // Split literals so this file doesn't trip content-guard.test.ts's own scan of src/
    for (const banned of ['.ts' + '.net', '100.', 'tailscale', 'claude.ai' + '/artifact', '/tree/']) {
      expect(text.toLowerCase()).not.toContain(banned);
    }
  });

  it('never presents the seven-field form as built', () => {
    const { simplify } = cs!.method;
    expect(simplify).toContain('specified, not yet built');
    for (const id of ['D21', 'D22']) {
      expect(cs!.decisions.find((d) => d.id === id)!.cost).toMatch(/^Specified, not yet built\./);
    }
    expect(project.detail.outcome).toContain('specified, not yet built');
  });
});

describe('hit-list review fixes (M6-05)', () => {
  const text = JSON.stringify(project);

  it.each([
    // The Oct 16 spec is not built: no past-tense cut.
    ['I cut ', 'the simplification is specified, not built'],
    ['Stars became', 'the simplification is specified, not built'],
    ['cut after using it', 'the simplification is specified, not built'],
    // Spec line 291: status is not archived; the gear setting is dropped, not archived.
    ['every removed field archived', 'not every removed field is archived'],
    ['the removed fields are archived', 'not every removed field is archived'],
    // The SDK hops were dependency fixes with no failing test.
    ['Every change started', 'features and fixes started as failing tests, not every change'],
    ['Michael', 'the copy is first person'],
  ])('does not say %j (%s)', (phrase) => {
    expect(text).not.toContain(phrase);
  });

  it('does not say the sprints built every screen: the Oct 13 spec lists the map view as missing', () => {
    expect(text).not.toMatch(/built every screen(?! but the map)/);
  });

  it('says the simplification is a spec in the metric label and the method', () => {
    expect(project.metrics![1].label).toMatch(/specified Oct 16.*not yet built/);
    expect(cs!.method.simplify).toMatch(/^After using it, I wrote a spec/);
  });

  it('credits keeping notes as a default in builtWith', () => {
    expect(cs!.builtWith).toContain('keeping notes');
  });
});
