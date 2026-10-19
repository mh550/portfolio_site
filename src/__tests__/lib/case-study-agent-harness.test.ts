/** @jest-environment node */
// The agent-harness case study (M4-02): its shape, and proof that its numbers and its code excerpt come from the
// sources. Copy and traceability: docs/plans/2026-10-18-M4-agent-harness.md. If lib/driver.sh changes, re-copy the
// excerpt from the file (and update the plan's line numbers); never loosen the verbatim check.
import fs from 'node:fs';
import path from 'node:path';
import { getProjectBySlug, type Project } from '@/lib/data';

const ROOT = path.resolve(__dirname, '../../..');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs/notes/evidence-agent-harness.md'), 'utf8');
const AGENT_HARNESS = '/home/mh550/projects/agent-harness';

const project = getProjectBySlug('agent-harness') as Project;
const cs = project?.caseStudy;

describe('agent-harness entry', () => {
  it('has the header fields from the plan', () => {
    expect(project).toBeDefined();
    expect(project.title.startsWith('Agent Harness')).toBe(true);
    expect(project.company).toBe('Personal · open source');
    expect(project.categories).toEqual(['systems', 'process', 'ai']);
    expect(project.order).toBe(1);
    expect(project.featured).toBe(true);
    expect(project.githubUrl).toBe('https://github.com/mh550/agent-harness');
  });

  it('has exactly 4 metrics carrying 55, 52, 374 and 2.53', () => {
    const values = project.metrics!.map((m) => m.value);
    expect(values).toHaveLength(4);
    ['55', '52', '374', '2.53'].forEach((n, i) => expect(values[i]).toContain(n));
  });

  it('has five non-empty method steps', () => {
    const steps = Object.values(cs!.method);
    expect(steps).toHaveLength(5);
    for (const text of steps) expect(text.trim()).not.toBe('');
  });

  it('has the six decisions in order', () => {
    expect(cs!.decisions.map((d) => d.id)).toEqual(['D-H1', 'D-H2', 'D-H4', 'D-H5', 'D-H11', 'D-H17']);
  });

  it('has 6 iterations (D27), each dated Sep or Oct', () => {
    expect(cs!.iterations).toHaveLength(6);
    for (const it of cs!.iterations!) expect(it.when).toMatch(/^(Sep|Oct)/);
  });

  it('has exactly 5 lessons, each with a broke and a rule', () => {
    expect(cs!.lessons).toHaveLength(5);
    for (const l of cs!.lessons) {
      expect(l.broke.trim()).not.toBe('');
      expect(l.rule.trim()).not.toBe('');
    }
  });

  it('links the repo and this site update', () => {
    const hrefs = cs!.links.map((l) => l.href);
    expect(hrefs).toContain('https://github.com/mh550/agent-harness');
    expect(cs!.links).toContainEqual(
      expect.objectContaining({
        label: 'This site update, built by the harness',
        href: 'https://github.com/mh550/portfolio_site/pulls?q=is%3Apr+harness',
      }),
    );
  });

  it("credits Claude Code agents and Michael's process design (D10)", () => {
    expect(cs!.builtWith).toMatch(/Claude Code agents/);
    expect(cs!.builtWith).toMatch(/I designed the process/);
  });
});

describe('agent-harness code excerpt', () => {
  const snippets = project?.detail.codeSnippets ?? [];

  it('is one snippet of at most 25 lines, titled with its repo path', () => {
    expect(snippets).toHaveLength(1);
    expect(snippets[0].code.split('\n').length).toBeLessThanOrEqual(25);
    expect(snippets[0].title).toMatch(/lib\/(driver\.sh|metrics\.mjs)/);
  });

  it('appears verbatim in its source file', () => {
    if (!fs.existsSync(AGENT_HARNESS)) {
      console.log(`skipped: ${AGENT_HARNESS} is not on this machine, the excerpt was not compared`);
      return;
    }
    const file = snippets[0].title.match(/lib\/(driver\.sh|metrics\.mjs)/)![0];
    const source = fs.readFileSync(path.join(AGENT_HARNESS, file), 'utf8');
    expect(source).toContain(snippets[0].code);
  });
});

describe('agent-harness traceability', () => {
  it('every number in every metric value appears in the evidence brief', () => {
    const runs = project.metrics!.flatMap((m) => m.value.match(/\d+(?:\.\d+)?/g) ?? []);
    expect(runs).toEqual(['55', '52', '374', '2.53']);
    for (const n of runs) expect(BRIEF).toContain(n);
  });

  it('every decision id appears in the evidence brief', () => {
    for (const { id } of cs!.decisions) expect(BRIEF).toMatch(new RegExp(`${id}(?!\\d)`));
  });

  it('publishes no hostname, notification service or raw journal path', () => {
    const text = JSON.stringify(project);
    // '.ts' + '.net' so this file doesn't trip content-guard.test.ts's own scan of src/
    for (const banned of ['.ts' + '.net', 'ntfy', 'journal/raw']) expect(text).not.toContain(banned);
  });
});
