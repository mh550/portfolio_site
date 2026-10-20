/** @jest-environment node */
// The voice-concierge case study (VC3-02): its shape, the absence of metrics (nothing is measured yet), the link to
// /talk, and proof that every sentence with a digit comes from the brief and that nothing private is published.
// Copy and traceability: docs/plans/2026-10-20-VC3-voice-concierge-deep-dive.md. Never loosen a check to make
// content pass: fix the content.
import fs from 'node:fs';
import path from 'node:path';
import { getProjectBySlug, type Project } from '@/lib/data';

const ROOT = path.resolve(__dirname, '../../..');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs/notes/evidence-voice-concierge.md'), 'utf8');
// The plan recorded `gh repo view mh550/voice-concierge --json visibility` as PUBLIC (VC3-01, again at VC3-02).
const REPO = 'https://github.com/mh550/voice-concierge';

const project = getProjectBySlug('voice-concierge') as Project;
const cs = project?.caseStudy;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('voice-concierge entry', () => {
  it('has the header fields from the plan', () => {
    expect(project).toBeDefined();
    expect(project.title).toBe('Voice Concierge: a voice agent that remembers returning visitors');
    expect(project.categories).toEqual(['ai', 'systems']);
    expect(project.order).toBe(2);
    expect(project.featured).toBe(true);
    expect(project.githubUrl).toBe(REPO);
    expect(project.demoUrl).toBeUndefined();
  });

  it('has no metrics: no number is measured yet (docs/notes/voice-concierge-todo.md says where they go)', () => {
    expect(project.metrics).toBeUndefined();
  });

  it('lists Anthropic API, not OpenRouter, in the tech stack', () => {
    expect(project.techStack).toContain('Anthropic API');
    expect(project.techStack).not.toContain('OpenRouter');
  });

  it('has five non-empty method steps', () => {
    const steps = Object.values(cs!.method);
    expect(steps).toHaveLength(5);
    for (const text of steps) expect(text.trim()).not.toBe('');
  });

  it('has six decisions VC-A to VC-F, each with chose, over, because and cost', () => {
    expect(cs!.decisions.map((d) => d.id)).toEqual(['VC-A', 'VC-B', 'VC-C', 'VC-D', 'VC-E', 'VC-F']);
    for (const d of cs!.decisions) {
      for (const field of [d.title, d.chose, d.over, d.because, d.cost]) expect(field?.trim()).toBeTruthy();
    }
  });

  it('names the six memory practices in the decision titles, in order', () => {
    const titles = cs!.decisions.map((d) => d.title.toLowerCase());
    const practices = [/preload/, /extraction.*delta/, /heard/, /gate/, /invalidate/, /thread/];
    practices.forEach((re, i) => expect(titles[i]).toMatch(re));
  });

  it('links /talk as the demo first, then the public repo', () => {
    expect(cs!.links).toEqual([
      { label: 'Talk to my concierge', href: '/talk', kind: 'demo' },
      { label: 'voice-concierge on GitHub', href: REPO, kind: 'repo' },
    ]);
  });

  it('has no lessons and no iterations yet', () => {
    expect(cs!.lessons).toEqual([]);
    expect(cs!.iterations).toBeUndefined();
  });

  it('credits Claude Code agents under the harness (D10)', () => {
    expect(cs!.builtWith).toMatch(/Claude Code agents/);
    expect(cs!.builtWith).toMatch(/harness/);
  });

  it('says plainly that no latency numbers are measured and that 1.8 only maps onto 2.0', () => {
    expect(project.detail.outcome).toContain('No latency numbers are measured yet.');
    expect(project.detail.outcome).toContain('only maps onto Agents 2.0');
  });
});

// VC3-05 fact-check: at review the agent repo's main was at C3 of C8 (store, fence, preload and worker skeleton; no
// extraction, write gate, session timer or live run) and its README said "Being built". The page states the agent
// as a design being built; only this site's own /talk page and token route are stated as built.
describe('voice-concierge claims match what is built', () => {
  it('does not say the agent was built or that a demo happened', () => {
    const text = strings(project).join(' ');
    expect(text).not.toMatch(/agent and this page were built/i);
    expect(text).not.toMatch(/for a demo on/i);
    expect(text).not.toMatch(/wrote the code for both/i);
    expect(project.detail.outcome).toContain('The agent is still being built.');
  });

  it('states unbuilt agent behaviour as design', () => {
    expect(project.shortDescription).toMatch(/designed to remember/);
    expect(project.detail.approach).toMatch(/^The design:/);
    expect(cs!.method.build).toMatch(/meant to run on my home box/);
    expect(cs!.method.build).toMatch(/designed to end each session after 10 minutes/);
    expect(cs!.method.build).not.toMatch(/as they change/);
  });

  it('keeps the problem to what the research found: LiveKit\'s default, not every voice agent', () => {
    expect(project.detail.problem).toMatch(/^By default a LiveKit voice agent forgets you when the call ends/);
  });
});

describe('voice-concierge traceability and privacy', () => {
  it('every sentence with a digit appears verbatim in the evidence brief', () => {
    const pieces = strings(project)
      .flatMap((s) => s.split(/(?<=[.!?])\s+|\n+/))
      .filter((p) => /\d/.test(p));
    expect(pieces.length).toBeGreaterThan(0);
    for (const piece of pieces) expect({ piece, inBrief: BRIEF.includes(piece) }).toEqual({ piece, inBrief: true });
  });

  it('publishes no env path, kill switch, key name, hostname or placeholder', () => {
    const text = JSON.stringify(project);
    // Split literals so this file doesn't trip content-guard.test.ts's own scan of src/
    const banned = ['~/.', '.config/', 'CONCIERGE' + '_', 'API' + '_KEY', 'API' + '_SECRET', 'livekit' + '.cloud',
      '.ts' + '.net', 'TO' + 'DO', '[' + 'X]', 'Michael'];
    for (const b of banned) expect({ b, found: text.includes(b) }).toEqual({ b, found: false });
  });
});
