/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ReactElement, ReactNode } from 'react';
import { projects } from '@/lib/data';

const rendered: { element: ReactElement; options: unknown }[] = [];

jest.mock('next/og', () => ({
  ImageResponse: class {
    constructor(element: ReactElement, options: unknown) {
      rendered.push({ element, options });
    }
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const og = require('@/app/projects/[slug]/opengraph-image');

const sourcePath = path.join(process.cwd(), 'src/app/projects/[slug]/opengraph-image.tsx');

type Props = { children?: ReactNode; style?: Record<string, unknown>; 'aria-label'?: string };

/** Function components called, as satori does. */
function expand(node: ReactNode): ReactNode {
  const el = node as ReactElement<Props>;
  return typeof el?.type === 'function' ? expand((el.type as (p: Props) => ReactNode)(el.props)) : node;
}

/** Every string in the element tree, in order; an SVG counts as its aria-label unless `fontOnly`. */
function textOf(node: ReactNode, fontOnly = false): string[] {
  node = expand(node);
  if (node === null || node === undefined || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap((n) => textOf(n, fontOnly));
  const el = node as ReactElement<Props>;
  if (el.type === 'svg') return fontOnly ? [] : [el.props['aria-label'] ?? ''];
  return textOf(el.props?.children, fontOnly);
}

/** Every style object in the element tree. */
function stylesOf(node: ReactNode): Record<string, unknown>[] {
  node = expand(node);
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(stylesOf);
  const el = node as ReactElement<Props>;
  return [...(el.props?.style ? [el.props.style] : []), ...stylesOf(el.props?.children)];
}

const squash = (s: string) => s.replace(/≈/g, '~').replace(/\s+/g, '');

/** Code points the bundled next/og font maps (TrueType cmap, format 4). */
function fontCodePoints(file: string): Set<number> {
  const b = fs.readFileSync(file);
  let cmap = 0;
  for (let i = 0; i < b.readUInt16BE(4); i++) {
    const rec = 12 + 16 * i;
    if (b.toString('ascii', rec, rec + 4) === 'cmap') cmap = b.readUInt32BE(rec + 8);
  }
  const points = new Set<number>();
  for (let i = 0; i < b.readUInt16BE(cmap + 2); i++) {
    const off = cmap + b.readUInt32BE(cmap + 8 + 8 * i);
    if (b.readUInt16BE(off) !== 4) continue;
    const segX2 = b.readUInt16BE(off + 6);
    const ends = off + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
    for (let s = 0; s < segX2 / 2; s++) {
      const end = b.readUInt16BE(ends + 2 * s), start = b.readUInt16BE(starts + 2 * s);
      const delta = b.readInt16BE(deltas + 2 * s), range = b.readUInt16BE(ranges + 2 * s);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        const glyph = range === 0 ? (c + delta) & 0xffff : b.readUInt16BE(ranges + 2 * s + range + 2 * (c - start));
        if (glyph) points.add(c);
      }
    }
  }
  return points;
}

async function render(slug: string) {
  rendered.length = 0;
  await og.default({ params: Promise.resolve({ slug }) });
  expect(rendered).toHaveLength(1);
  return rendered[0];
}

describe('projects/[slug]/opengraph-image', () => {
  it('exports a 1200×630 PNG with alt text', () => {
    expect(og.size).toEqual({ width: 1200, height: 630 });
    expect(og.contentType).toBe('image/png');
    expect(typeof og.alt).toBe('string');
    expect(typeof og.default).toBe('function');
  });

  it('alt text carries the v3 positioning (D76)', () => {
    expect(og.alt).toBe('Project case study from Michael Herron, Agentic Systems Engineer');
  });

  it('generateStaticParams returns every project slug', async () => {
    const params = await og.generateStaticParams();
    expect(params).toEqual(projects.map((p) => ({ slug: p.slug })));
  });

  it.each(projects.map((p) => [p.slug, p] as const))(
    '%s: renders the title, first metric and name on #0a0a0f at 1200×630',
    async (_slug, project) => {
      const { element, options } = await render(project.slug);
      const text = squash(textOf(element).join(''));
      expect(text).toContain(squash(project.title));
      expect(text).toContain(squash('Michael Herron'));
      const metric = project.metrics?.[0];
      if (metric) {
        expect(text).toContain(squash(metric.value));
        expect(text).toContain(squash(metric.label));
      } else {
        expect(text).toContain(squash(project.shortDescription));
      }
      expect(stylesOf(element)[0]).toMatchObject({ background: '#0a0a0f' });
      expect(options).toMatchObject({ width: 1200, height: 630 });
    },
  );

  it('draws only glyphs the bundled font has (a missing one makes next/og fetch a font)', async () => {
    const covered = fontCodePoints(
      path.join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf'),
    );
    expect(covered.has('A'.codePointAt(0)!)).toBe(true);
    expect(covered.has('→'.codePointAt(0)!)).toBe(false);
    for (const project of projects) {
      const { element } = await render(project.slug);
      const missing = [...textOf(element, true).join('')].filter((c) => !covered.has(c.codePointAt(0)!));
      expect({ slug: project.slug, missing }).toEqual({ slug: project.slug, missing: [] });
    }
  });

  it('404s an unknown slug', async () => {
    await expect(og.default({ params: Promise.resolve({ slug: 'no-such-project' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('loads no fonts (no fetch, no fonts option)', async () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/fonts\s*:/);
    const { options } = await render(projects[0].slug);
    expect(options).not.toHaveProperty('fonts');
  });
});
