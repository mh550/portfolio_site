/** @jest-environment node */
// The home-media-server case study (M5-02): its shape, its demo media, its verify excerpt, and proof that its
// numbers come from the brief and that nothing private is published. Copy and traceability:
// docs/plans/2026-10-18-M5-home-media-server.md. Never loosen a check to make content pass: fix the content.
import fs from 'node:fs';
import path from 'node:path';
import { getProjectBySlug, type Project } from '@/lib/data';

const ROOT = path.resolve(__dirname, '../../..');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs/notes/evidence-media-server.md'), 'utf8');
const DJ = process.env.DJ_CRATE_DIR ?? '/home/mh550/projects/dj-crate-streaming';
const MEDIA_DIR = path.join(ROOT, 'public/projects/home-media-server');
// Jest reports these as skipped (not passed) on a machine without the dj-crate-streaming checkout.
const itWithSource = fs.existsSync(DJ) ? it : it.skip;

const project = getProjectBySlug('home-media-server') as Project;
const cs = project?.caseStudy;

describe('home-media-server entry', () => {
  it('has the header fields from the plan', () => {
    expect(project).toBeDefined();
    expect(project.title).toBe('Self-hosted music library & DJ crate pipeline');
    expect(project.company).toBe('Personal · home server');
    expect(project.categories).toEqual(['systems', 'full-stack']);
    expect(project.order).toBe(3);
    expect(project.featured).toBe(true);
    expect(project.githubUrl).toBe('https://github.com/mh550/dj-crate-streaming');
  });

  it("has exactly 4 metrics carrying 831, 1,405, 1,359 and 'reversible' (D30)", () => {
    expect(project.metrics).toHaveLength(4);
    const texts = project.metrics!.map((m) => `${m.value} ${m.label}`);
    ['831', '1,405', '1,359', 'reversible'].forEach((s, i) => expect(texts[i]).toContain(s));
  });

  it('has five non-empty method steps', () => {
    const steps = Object.values(cs!.method);
    expect(steps).toHaveLength(5);
    for (const text of steps) expect(text.trim()).not.toBe('');
  });

  it('has the six decisions in order (the DJ repo ledger ids)', () => {
    expect(cs!.decisions.map((d) => d.id)).toEqual(['D7', 'D3', 'D24', 'D27', 'D18', 'D38/39']);
  });

  it('has 5 iterations, each dated Sep or Oct', () => {
    expect(cs!.iterations).toHaveLength(5);
    for (const it of cs!.iterations!) expect(it.when).toMatch(/^(Sep|Oct)/);
  });

  it("has 6–8 lessons, including '859 = 859 = 859' and the guessed fake", () => {
    expect(cs!.lessons.length).toBeGreaterThanOrEqual(6);
    expect(cs!.lessons.length).toBeLessThanOrEqual(8);
    for (const l of cs!.lessons) {
      expect(l.broke.trim()).not.toBe('');
      expect(l.rule.trim()).not.toBe('');
    }
    expect(cs!.lessons.some((l) => l.broke.includes('859 = 859 = 859'))).toBe(true);
    expect(cs!.lessons.some((l) => `${l.broke} ${l.rule}`.toLowerCase().includes('guessed fake'))).toBe(true);
  });

  it('has exactly one link, the repo', () => {
    expect(cs!.links).toEqual([
      { label: 'dj-crate-streaming on GitHub', href: 'https://github.com/mh550/dj-crate-streaming', kind: 'repo' },
    ]);
  });

  it("credits Claude Code agents and Michael's design (D10)", () => {
    expect(cs!.builtWith).toMatch(/Claude Code agents/);
    expect(cs!.builtWith).toMatch(/I designed the system/);
  });
});

describe('home-media-server media (D11, D29)', () => {
  const media = project?.detail.media ?? [];
  const FILES = ['01-playlists.png', '02-crate-toggled.png', '03-wanted.png'];

  it('shows the three demo screenshots in order, portrait-sized, each captioned as demo data', () => {
    expect(media.map((m) => m.src)).toEqual(FILES.map((f) => `/projects/home-media-server/${f}`));
    for (const m of media) {
      expect(m.type).toBe('image');
      expect(m.alt.trim()).not.toBe('');
      expect(m.caption?.toLowerCase()).toContain('demo data');
      expect([m.width, m.height]).toEqual([840, 1720]);
    }
  });

  it('has every media file under public/, each at most 120 KB', () => {
    for (const m of media) {
      const file = path.join(ROOT, 'public', m.src);
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.statSync(file).size).toBeLessThanOrEqual(120 * 1024);
    }
  });

  it('never ships the m6 screenshots (real library, a username)', () => {
    expect(fs.readdirSync(MEDIA_DIR).filter((f) => f.startsWith('m6'))).toEqual([]);
  });

  itWithSource('each file is byte-identical to the one in the DJ repo', () => {
    for (const f of FILES) {
      const ours = fs.readFileSync(path.join(MEDIA_DIR, f));
      const theirs = fs.readFileSync(path.join(DJ, 'docs/screenshots', f));
      expect(ours.equals(theirs)).toBe(true);
    }
  });
});

describe('home-media-server verify excerpt', () => {
  const snippets = project?.detail.codeSnippets ?? [];

  it("is one 'text' snippet titled with verify, showing BAD and the 16 kHz cutoff, with no server path", () => {
    expect(snippets).toHaveLength(1);
    const [s] = snippets;
    expect(s.language).toBe('text');
    expect(s.title).toContain('verify');
    expect(s.code).toContain('cutoff ≈16 kHz');
    expect(s.code).toContain('BAD');
    expect(s.code).not.toContain('/srv');
  });

  itWithSource("is the docs' 'Reading the result' block with only the path shortened (D18)", () => {
    const doc = fs.readFileSync(path.join(DJ, 'docs/download-validation.md'), 'utf8');
    const block = doc.match(/```\n(BAD [\s\S]*?)\n```/)![1];
    expect(snippets[0].code).toBe(block.replace('/srv/incoming/', 'incoming/'));
  });
});

describe('home-media-server traceability and privacy', () => {
  it('every number in every metric value appears in the evidence brief', () => {
    const runs = project.metrics!.flatMap((m) => m.value.match(/\d+(?:[.,]\d+)*/g) ?? []);
    expect(runs).toEqual(['831', '1,405', '1,359']);
    // Bounded, so '831' isn't satisfied by '1,831' or '8310'.
    for (const n of runs) expect(BRIEF).toMatch(new RegExp(`(?<![\\d.,])${n}(?![\\d])`));
  });

  it('every decision id appears in the evidence brief', () => {
    // 'D38/39' is the brief's "D38 / D39": each part must appear.
    const ids = cs!.decisions.flatMap(({ id }) => {
      const [first, ...rest] = id.split('/');
      return [first, ...rest.map((n) => `D${n}`)];
    });
    expect(ids).toEqual(['D7', 'D3', 'D24', 'D27', 'D18', 'D38', 'D39']);
    for (const id of ids) expect(BRIEF).toMatch(new RegExp(`\\b${id}(?!\\d)`));
  });

  it('publishes no hostname, address, server path, notification service or m6 file', () => {
    const text = JSON.stringify(project);
    // '.ts' + '.net' so this file doesn't trip content-guard.test.ts's own scan of src/
    for (const banned of ['.ts' + '.net', '100.', 'ntfy', '/srv', 'm6-']) expect(text).not.toContain(banned);
  });

  it("names the download source once, as 'a peer-to-peer network, Soulseek' (brand.md)", () => {
    const text = JSON.stringify(project);
    expect(text.match(/Soulseek/g)).toHaveLength(1);
    expect(text).toContain('a peer-to-peer network, Soulseek');
  });
});
