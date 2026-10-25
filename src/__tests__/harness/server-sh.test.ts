/** @jest-environment node */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// init.sh's dev server: `npx next dev` forks next and next-server, so stopping it must end the whole tree, or
// next-server keeps the port and every later init starts a second one.
const SERVER_SH = path.resolve(__dirname, '../../../.harness/server.sh');

const sh = (script: string) =>
  execFileSync('bash', ['-c', `set -euo pipefail; source "${SERVER_SH}"; ${script}`], { encoding: 'utf8' });

/** Running, not a zombie waiting to be reaped. */
function alive(pid: number): boolean {
  try {
    return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1][0] !== 'Z';
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readPid(file: string): Promise<number> {
  for (let i = 0; i < 50 && !fs.existsSync(file); i++) await sleep(100);
  return Number(fs.readFileSync(file, 'utf8').trim());
}

describe('.harness/server.sh', () => {
  let dir: string;
  const started: number[] = [];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-sh-'));
  });

  afterEach(() => {
    for (const pid of started.splice(0)) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('stop_server ends the server and the children it forked', async () => {
    const pidFile = path.join(dir, 'server.pid');
    const childFile = path.join(dir, 'child.pid');
    sh(`start_server "${pidFile}" "${dir}/server.log" bash -c 'sleep 300 & echo $! > "${childFile}"; wait'`);
    const server = await readPid(pidFile);
    const child = await readPid(childFile);
    started.push(server, child);
    expect(alive(server)).toBe(true);
    expect(alive(child)).toBe(true);

    sh(`stop_server "${pidFile}"`);
    for (let i = 0; i < 20 && (alive(server) || alive(child)); i++) await sleep(100);
    expect(alive(server)).toBe(false);
    expect(alive(child)).toBe(false);
    expect(fs.existsSync(pidFile)).toBe(false);
  });

  it('stop_server without a pid file does nothing', () => {
    expect(() => sh(`stop_server "${dir}/none.pid"`)).not.toThrow();
  });
});
