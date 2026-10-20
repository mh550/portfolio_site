/** @jest-environment node */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';

// The booth harness bundle (D41): public/b/h.tgz must be a faithful, rebuilt copy of public/b/mh_harness/.
// Mirrors the excludes in scripts/build-booth-bundle.mjs (the .mjs script can't be imported into Jest).
const EXCLUDED_NAMES = new Set(['__pycache__', 'results.jsonl', 'logs', 'work']);
const isExcluded = (name: string) => EXCLUDED_NAMES.has(name) || name.endsWith('.pyc');

const publicB = join(process.cwd(), 'public', 'b');
const tarball = join(publicB, 'h.tgz');

// Sorted relative file paths (always `/`-separated) under dir, skipping the run output the bundle leaves out.
function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !isExcluded(entry.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path, root) : [relative(root, path).split(sep).join('/')];
    })
    .sort();
}

describe('booth harness bundle (public/b/h.tgz)', () => {
  let extracted: string;

  beforeAll(() => {
    extracted = mkdtempSync(join(tmpdir(), 'booth-bundle-'));
    const tar = spawnSync('tar', ['-xzf', tarball, '-C', extracted], { encoding: 'utf8' });
    if (tar.status !== 0) throw new Error(`tar -xzf ${tarball} failed: ${tar.stderr}`);
  });

  afterAll(() => {
    rmSync(extracted, { recursive: true, force: true });
  });

  it('exists and is gzip', () => {
    const bytes = readFileSync(tarball);
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));
  });

  it('has mh_harness as its only top-level entry', () => {
    expect(readdirSync(extracted)).toEqual(['mh_harness']);
  });

  it('holds the same files as public/b/mh_harness/, minus run output', () => {
    const files = listFiles(join(extracted, 'mh_harness'));
    expect(files).toEqual(listFiles(join(publicB, 'mh_harness')));
    expect(files).toEqual(expect.arrayContaining(['PROMPTS.md', 'adapter.py', 'configs/round1.json']));
  });

  it('holds the same bytes as public/b/mh_harness/ (run `npm run booth-bundle` if this fails)', () => {
    const drifted = listFiles(join(publicB, 'mh_harness')).filter(
      (file) =>
        !readFileSync(join(publicB, 'mh_harness', file)).equals(readFileSync(join(extracted, 'mh_harness', file))),
    );
    expect(drifted).toEqual([]);
  });

  it(
    "passes the bundle's own unit tests from the extracted copy",
    () => {
      const python = process.platform === 'win32' ? 'python' : 'python3';
      if (spawnSync(python, ['--version']).error) {
        console.log(`${python} not on PATH: skipping the bundle's unit tests`);
        return;
      }
      // Without MH_HARNESS_HOME the run output lands in the extracted copy, never in public/b/mh_harness/.
      const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };
      delete env.MH_HARNESS_HOME;
      const run = spawnSync(python, ['-m', 'unittest', 'discover', '-s', 'tests'], {
        cwd: join(extracted, 'mh_harness'),
        env,
        encoding: 'utf8',
      });
      if (run.status !== 0) console.log(run.stderr.slice(-4000));
      expect(run.status).toBe(0);
    },
    180_000,
  );
});
