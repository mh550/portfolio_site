/** @jest-environment node */
// P1-06: the old positioning (D76 supersedes it) is on no page, in no metadata and in no test. The phrases are
// built from parts so this file does not match itself.
import fs from 'node:fs';
import path from 'node:path';
import { profile } from '@/lib/data';

const ROOT = path.resolve(__dirname, '../../..');
// Any run of spaces or hyphens between words, and '&' as '&', '&amp;' or 'and'.
const GAP = '[\\s-]+';
const OLD = new RegExp(
  [
    `systems${GAP}(?:&|&amp;|and)${GAP}process`,
    `process${GAP}engineer`,
    // the 10-18 subline (D76 supersedes it)
    `find${GAP}where${GAP}work${GAP}breaks`,
  ].join('|'),
  'i',
);
const BINARY = /\.(ico|png|jpe?g|gif|webp|avif|mp4|webm|mov|woff2?|ttf|otf|pdf|zip|tgz)$/i;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return BINARY.test(entry.name) ? [] : [full];
  });
}

describe('site-wide positioning (P1-06)', () => {
  it('no file under src/ or public/ carries the old angle', () => {
    const hits = ['src', 'public']
      .flatMap((dir) => walk(path.join(ROOT, dir)))
      .flatMap((file) =>
        fs
          .readFileSync(file, 'utf8')
          .split(/\r?\n/)
          .flatMap((line, i) => (OLD.test(line) ? [`${path.relative(ROOT, file)}:${i + 1}`] : [])),
      );
    expect(hits).toEqual([]);
  });

  it('profile.positioning is the v3 headline', () => {
    expect(profile.positioning).toBe('Agentic Systems Engineer');
  });
});
