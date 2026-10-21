import fs from 'fs';
import path from 'path';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import RootLayout from '@/app/layout';
import SiteChrome from '@/components/SiteChrome';
import { projects } from '@/lib/data/projects';
import { usherTargets } from '@/lib/concierge/usher';

// P3-03, D85 (D46 as it now stands): the root layout, a Server Component, reads the LiveKit env and hands SiteChrome
// (and so ConciergeProvider) one boolean. No client component imports env.ts.

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

// The layout returns <html><body><SiteChrome …>: walk the element tree to the SiteChrome element.
type ChromeProps = { configured?: boolean; usherTargets?: unknown };
function findSiteChrome(node: ReactNode): ReactElement<ChromeProps> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findSiteChrome(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (node.type === SiteChrome) return node as ReactElement<ChromeProps>;
  return findSiteChrome(node.props.children);
}

const configuredProp = () => findSiteChrome(RootLayout({ children: null }))?.props.configured;

describe('RootLayout tells the concierge whether LiveKit is configured', () => {
  it('without the LiveKit env: configured is false', () => {
    expect(configuredProp()).toBe(false);
  });

  it('with all three LiveKit variables: configured is true', () => {
    process.env.LIVEKIT_URL = 'wss://concierge.test.invalid';
    process.env.LIVEKIT_API_KEY = 'k'.repeat(12);
    process.env.LIVEKIT_API_SECRET = 'x'.repeat(32);
    expect(configuredProp()).toBe(true);
  });

  // P3-08, D94: the usher's targets are built here, on the server, so the client bundle never imports projects.ts.
  it("passes every project's slug and short title as usherTargets", () => {
    const targets = findSiteChrome(RootLayout({ children: null }))?.props.usherTargets;
    expect(targets).toEqual(usherTargets(projects));
    expect(targets).toEqual(expect.arrayContaining([{ slug: 'agent-harness', title: 'Agent Harness' }]));
    expect(targets).toHaveLength(projects.length);
  });

  // Review P3-08-4: followed through every import (type-only ones aside), since SiteChrome is a client file on every
  // page; the data barrel re-exports projects.ts, so it is out too.
  it('nothing SiteChrome imports, directly or not, reaches the projects data', () => {
    const resolve = (from: string, spec: string): string | null => {
      const base = spec.startsWith('@/')
        ? path.join(process.cwd(), 'src', spec.slice(2))
        : spec.startsWith('.')
          ? path.resolve(path.dirname(from), spec)
          : null;
      if (!base) return null;
      const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
      return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
    };
    const seen = new Set<string>();
    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const text = fs.readFileSync(file, 'utf8');
      for (const [, typeOnly, spec] of text.matchAll(/^\s*(?:import|export)\s+(type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/gm)) {
        const next = typeOnly ? null : resolve(file, spec);
        if (next) walk(next);
      }
    };
    walk(path.join(process.cwd(), 'src/components/SiteChrome.tsx'));
    const reached = [...seen].map((f) => path.relative(process.cwd(), f));
    expect(reached).toEqual(expect.arrayContaining(['src/components/Footer.tsx', 'src/lib/concierge/usher.ts']));
    expect(reached.filter((f) => f.startsWith('src/lib/data/') && !/(concierge|profile)\.ts$/.test(f))).toEqual([]);
  });

  // next/jest maps server-only to an empty mock, so this is the Jest-side guard; `next build` is the other.
  const sources = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sources(full);
      return /\.tsx?$/.test(entry.name) && !full.includes('__tests__') ? [full] : [];
    });
  const serverOnly = /from ['"][^'"]*concierge\/(env|rooms)['"]/;

  it('no file under src/components, and no client file anywhere in src, imports concierge/env or concierge/rooms', () => {
    const offenders = sources(path.join(process.cwd(), 'src')).filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      const client = /^['"]use client['"]/.test(text) || file.includes(`${path.sep}components${path.sep}`);
      return client && serverOnly.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it('the guard does see the server files that do import them', () => {
    const importers = sources(path.join(process.cwd(), 'src')).filter((file) => serverOnly.test(fs.readFileSync(file, 'utf8')));
    expect(importers.map((f) => path.relative(process.cwd(), f))).toEqual(
      expect.arrayContaining(['src/app/layout.tsx', 'src/app/api/concierge/token/route.ts'])
    );
  });
});
