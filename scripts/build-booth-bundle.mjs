// Builds the booth harness bundle: public/b/h.tgz from public/b/mh_harness/ (D41, D57).
// Run by hand (`npm run booth-bundle`) after any change under public/b/mh_harness/; commit h.tgz.
// `node scripts/build-booth-bundle.mjs <out.tgz>` writes elsewhere (the jest test rebuilds into a temp dir).
// src/__tests__/lib/booth-bundle.test.ts fails if the committed tarball drifts from the folder.
// Members are the git-tracked files only (`git add` a new file first), so run output and editor junk never ship.
// Needs GNU tar (the flags below make the bytes reproducible); gzip is node's zlib so no gzip timestamp leaks in.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const publicB = fileURLToPath(new URL('../public/b/', import.meta.url));
const out = process.argv[2] ?? join(publicB, 'h.tgz');

function fail(what, result) {
  console.error(`${what} failed: ${result.error?.message ?? result.stderr.toString()}`);
  process.exit(1);
}

const lsFiles = spawnSync('git', ['ls-files', '-z', 'mh_harness'], { cwd: publicB, encoding: 'utf8' });
if (lsFiles.error || lsFiles.status !== 0) fail('git ls-files', lsFiles);
const files = lsFiles.stdout.split('\0').filter(Boolean);
// Each file's parent folders get their own entry, so they extract as 0755 on every tar.
const folders = files.flatMap((file) => file.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/')));
const members = [...new Set([...folders, ...files])].sort();

const tar = spawnSync(
  'tar',
  [
    '--no-recursion',
    '--dereference',
    '--owner=0',
    '--group=0',
    '--numeric-owner',
    '--mtime=2026-10-20 00:00Z',
    '--mode=a-x,a=rX,u+w',
    '--format=ustar',
    '-C',
    publicB,
    '-cf',
    '-',
    '--null',
    '-T',
    '-',
  ],
  {
    input: members.map((member) => `${member}\0`).join(''),
    env: { ...process.env, TAR_OPTIONS: '', LC_ALL: 'C' },
    maxBuffer: 64 * 1024 * 1024,
  },
);
if (tar.error || tar.status !== 0) fail('tar (GNU tar needed)', tar);

const tgz = gzipSync(tar.stdout, { level: 9 });
tgz[9] = 3; // gzip's OS byte: zlib writes the build platform's; pin Unix so a Mac or Windows rebuild matches.
writeFileSync(out, tgz);
console.log(`wrote ${relative(process.cwd(), out)} (${files.length} files, ${tgz.length} bytes)`);
