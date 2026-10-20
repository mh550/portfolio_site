/** @jest-environment node */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { gunzipSync } from 'node:zlib';

// The booth harness bundle (D41, D57): public/b/h.tgz must hold exactly the git-tracked files of
// public/b/mh_harness/, byte for byte, as `npm run booth-bundle` builds it now.
const publicB = join(process.cwd(), 'public', 'b');
const tarball = join(publicB, 'h.tgz');

// Paths under mh_harness/ that git tracks: the bundle's member list, the same one the build script uses.
const tracked = spawnSync('git', ['ls-files', '-z', 'mh_harness'], { cwd: publicB, encoding: 'utf8' })
  .stdout.split('\0')
  .filter(Boolean)
  .map((path) => path.replace(/^mh_harness\//, ''))
  .sort();

// Sorted relative file paths (always `/`-separated) under dir.
function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path, root) : [relative(root, path).split(sep).join('/')];
    })
    .sort();
}

describe('booth harness bundle (public/b/h.tgz)', () => {
  let scratch: string;
  let extracted: string;

  beforeAll(() => {
    scratch = mkdtempSync(join(tmpdir(), 'booth-bundle-'));
    extracted = join(scratch, 'x');
    mkdirSync(extracted);
    const tar = spawnSync('tar', ['-xzf', tarball, '-C', extracted], { encoding: 'utf8' });
    if (tar.status !== 0) throw new Error(`tar -xzf ${tarball} failed: ${tar.error?.message ?? tar.stderr}`);
  });

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('exists and is gzip', () => {
    const bytes = readFileSync(tarball);
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));
  });

  it('has mh_harness as its only top-level entry', () => {
    expect(readdirSync(extracted)).toEqual(['mh_harness']);
  });

  it('holds exactly the git-tracked files of public/b/mh_harness/ (no run output or editor junk)', () => {
    const files = listFiles(join(extracted, 'mh_harness'));
    expect(files).toEqual(tracked);
    expect(files).toEqual(expect.arrayContaining(['PROMPTS.md', 'adapter.py', 'configs/round1.json']));
  });

  it('holds the same bytes as public/b/mh_harness/ (run `npm run booth-bundle` if this fails)', () => {
    const drifted = tracked.filter(
      (file) =>
        !readFileSync(join(publicB, 'mh_harness', file)).equals(readFileSync(join(extracted, 'mh_harness', file))),
    );
    expect(drifted).toEqual([]);
  });

  it('is the tar `npm run booth-bundle` builds now (names, order, modes, owner, mtime)', () => {
    if (!/GNU tar/.test(spawnSync('tar', ['--version'], { encoding: 'utf8' }).stdout ?? '')) {
      console.log('tar is not GNU tar: skipping the rebuild comparison');
      return;
    }
    const rebuilt = join(scratch, 'rebuilt.tgz');
    const build = spawnSync('node', ['scripts/build-booth-bundle.mjs', rebuilt], { encoding: 'utf8' });
    expect(build.stderr).toBe('');
    // Compare the tar streams, not the gzip bytes, so a different zlib in a newer node doesn't turn this red.
    expect(gunzipSync(readFileSync(rebuilt)).equals(gunzipSync(readFileSync(tarball)))).toBe(true);
  });

  it(
    "passes the bundle's own unit tests from the extracted copy",
    () => {
      const python = process.platform === 'win32' ? 'python' : 'python3';
      // status, not error: Windows' Store `python` alias starts fine and exits 9009.
      if (spawnSync(python, ['--version']).status !== 0) {
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
