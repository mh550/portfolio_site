// Builds the booth harness bundle: public/b/h.tgz from public/b/mh_harness/ (D41).
// Run by hand (`npm run booth-bundle`) after any change under public/b/mh_harness/; commit h.tgz.
// src/__tests__/lib/booth-bundle.test.ts fails if the committed tarball drifts from the folder.
// Needs GNU tar (the flags below make the bytes reproducible); gzip is node's zlib so no gzip timestamp leaks in.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const publicB = fileURLToPath(new URL('../public/b/', import.meta.url));
// Keep in sync with EXCLUDED_NAMES in src/__tests__/lib/booth-bundle.test.ts.
const excludes = ['__pycache__', '*.pyc', 'results.jsonl', 'logs', 'work'];

const tar = spawnSync(
  'tar',
  [
    '--sort=name',
    '--owner=0',
    '--group=0',
    '--numeric-owner',
    '--mtime=2026-10-20 00:00Z',
    '--mode=go-w,a+rX',
    '--format=ustar',
    '-C',
    publicB,
    ...excludes.map((pattern) => `--exclude=${pattern}`),
    '-cf',
    '-',
    'mh_harness',
  ],
  { maxBuffer: 64 * 1024 * 1024 },
);
if (tar.error || tar.status !== 0) {
  console.error(`tar failed (GNU tar needed): ${tar.error?.message ?? tar.stderr.toString()}`);
  process.exit(1);
}

const tgz = gzipSync(tar.stdout, { level: 9 });
writeFileSync(join(publicB, 'h.tgz'), tgz);

const list = spawnSync('tar', ['-tf', '-'], { input: tar.stdout, encoding: 'utf8' });
const files = list.stdout.split('\n').filter((entry) => entry && !entry.endsWith('/')).length;
console.log(`wrote public/b/h.tgz (${files} files, ${tgz.length} bytes)`);
