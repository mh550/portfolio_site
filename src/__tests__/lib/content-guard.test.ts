/** @jest-environment node */
// The never-publish guard (spec M0, docs/notes/brand.md). It walks src/ and public/ and fails on any match,
// naming file:line. Never loosen a pattern to make content pass: fix the content instead.
// This file holds the patterns and their samples, so the walk skips it.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const SELF = path.join(ROOT, 'src/__tests__/lib/content-guard.test.ts');
const SCAN_DIRS = ['src', 'public'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.svg', '.txt', '.vcf', '.html', '.css']);

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'tailscale hostname', re: /\.ts\.net\b/ },
  { name: 'CGNAT address', re: /\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'ntfy topic', re: /ntfy\.sh\// },
  { name: 'US phone number', re: /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/ },
  { name: 'Spotify playlist', re: /open\.spotify\.com\/playlist/ },
  { name: 'Claude artifact link', re: /claude\.ai\/(code\/)?artifact/ },
  { name: 'private repo link', re: /github\.com\/mh550\/(pathways|projects)\b/ },
  { name: '[X] placeholder', re: /\[X\]/ },
  { name: 'TODO', re: /\bTODO\b/ },
  { name: 'lorem ipsum', re: /lorem ipsum/i },
  { name: 'secret assignment', re: /(api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i },
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
}

function scanText(text: string, file: string): Violation[] {
  const violations: Violation[] = [];
  text.split(/\r?\n/).forEach((content, i) => {
    for (const { name, re } of PATTERNS) {
      if (re.test(content)) violations.push({ file, line: i + 1, pattern: name });
    }
  });
  return violations;
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full); // follows symlinks, so a linked file is scanned too
    if (stat.isDirectory()) return listFiles(full);
    if (!stat.isFile() || full === SELF || !EXTENSIONS.has(path.extname(name).toLowerCase())) return [];
    return [full];
  });
}

const format = (v: Violation) => `${v.file}:${v.line} ${v.pattern}`;

// One or more in-memory samples per pattern; each must be caught by exactly that pattern.
const SAMPLES: [pattern: string, sample: string][] = [
  ['tailscale hostname', 'Open http://media.tail1234.ts.net/ to see it'],
  ['CGNAT address', 'The server answers on 100.101.12.7 inside the tailnet'],
  ['ntfy topic', 'curl -d done https://ntfy.sh/some-topic'],
  ['US phone number', 'Call me at (919) 555-0123'],
  ['US phone number', 'or 919.555.0123'],
  ['Spotify playlist', 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'],
  ['Claude artifact link', 'See https://claude.ai/artifact/abc123'],
  ['Claude artifact link', 'See https://claude.ai/code/artifact/abc123'],
  ['private repo link', 'Source: https://github.com/mh550/pathways'],
  ['private repo link', 'Source: https://github.com/mh550/projects'],
  ['[X] placeholder', 'Cut onboarding by [X]%'],
  ['TODO', '// TODO write the outcome'],
  ['lorem ipsum', 'Lorem Ipsum dolor sit amet'],
  ['secret assignment', "const apiKey = 'abcdef1234567890'"],
  ['secret assignment', 'GITHUB_TOKEN="ghp_abcdefghijklmnop"'],
];

describe('content guard: the guard itself', () => {
  it.each(SAMPLES)('catches a %s: %p', (pattern, sample) => {
    expect(scanText(sample, 'sample.ts')).toEqual([{ file: 'sample.ts', line: 1, pattern }]);
  });

  it('passes clean content, including near misses', () => {
    const clean = [
      "export const profile = { email: 'mherron734@gmail.com', location: 'Durham, NC' };",
      'Public repo: https://github.com/mh550/agent-harness and https://github.com/mh550/hit-list',
      'Cut onboarding from ~2 days to ~6 hours across 3 clients; 70 tests, 12 suites.',
      'Addresses like 100.63.1.1 and 100.128.0.1 sit outside the CGNAT block.',
      'A todo list app, a [x] checkbox, and a short token: "abc".',
      'Released 2026-10-18 at https://michael-herron.vercel.app/card?src=qr',
    ].join('\n');
    expect(scanText(clean, 'clean.md')).toEqual([]);
  });

  it('names the line of each match in a multi-line file', () => {
    const text = ['first line is fine', 'second has a TODO', 'third is fine', 'fourth: lorem ipsum'].join('\r\n');
    expect(scanText(text, 'page.tsx').map(format)).toEqual(['page.tsx:2 TODO', 'page.tsx:4 lorem ipsum']);
  });

  it('every pattern has at least one sample', () => {
    expect(new Set(SAMPLES.map(([pattern]) => pattern))).toEqual(new Set(PATTERNS.map((p) => p.name)));
  });

  it('walks text files in src/ and public/ and skips itself', () => {
    const files = SCAN_DIRS.flatMap((d) => listFiles(path.join(ROOT, d))).map((f) => path.relative(ROOT, f));
    expect(files).toContain('src/lib/data/profile.ts');
    expect(files).toContain('src/app/globals.css');
    expect(files).toContain('public/next.svg');
    expect(files).not.toContain('src/__tests__/lib/content-guard.test.ts');
    expect(files).not.toContain('public/photos/headshot.png');
  });
});

describe('content guard: the tree', () => {
  it('src/ and public/ contain no never-publish pattern', () => {
    const violations = SCAN_DIRS.flatMap((d) => listFiles(path.join(ROOT, d))).flatMap((file) =>
      scanText(fs.readFileSync(file, 'utf8'), path.relative(ROOT, file)),
    );
    expect(violations.map(format)).toEqual([]);
  });
});
