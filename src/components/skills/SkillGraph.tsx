'use client';

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Logo from '@/components/logos/Logo';
import { focusRing } from '@/components/focusRing';
import { textLink } from '@/components/textLink';
import type { Cluster, SkillEdge, SkillNode, Weight } from '@/lib/data/skills';
import { projectsOf } from '@/lib/graph/edges';
import { edgePaths, layoutGraph, LABEL_DY, WIDE_MIN } from '@/lib/graph/layout';
import { fitAll, viewBoxFor } from '@/lib/graph/view';

/** A project as the graph needs it, built on the server so this bundle never imports projects.ts */
export interface GraphProject {
  slug: string;
  /** the short title (cut at its first colon) */
  title: string;
  featured: boolean;
  order: number;
}

interface SkillGraphProps {
  clusters: Cluster[];
  nodes: SkillNode[];
  edges: SkillEdge[];
  projects: GraphProject[];
}

// The viewport, as a primitive snapshot over two queries; the server and a browser without matchMedia (jsdom) read
// 'wide', so the first render is the 3-column drawing everywhere and narrower screens switch after hydration.
type Viewport = 'narrow' | 'mid' | 'wide';
const WIDE_QUERY = `(min-width: ${WIDE_MIN}px)`;
const NARROW_QUERY = '(max-width: 639px)';

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribeViewport(onChange: () => void) {
  if (!hasMatchMedia()) return () => {};
  const queries = [WIDE_QUERY, NARROW_QUERY].map((q) => window.matchMedia(q));
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => queries.forEach((q) => q.removeEventListener('change', onChange));
}

function viewportSnapshot(): Viewport {
  if (!hasMatchMedia()) return 'wide';
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide';
  return window.matchMedia(NARROW_QUERY).matches ? 'narrow' : 'mid';
}

const serverViewport = (): Viewport => 'wide';

const WEIGHT_WORD: Record<Weight, string> = { 3: 'Core', 2: 'Regular', 1: 'Occasional' };
const LABEL_CLASS: Record<Weight, string> = {
  3: 'fill-[var(--color-foreground)] font-semibold',
  2: 'fill-[var(--color-foreground)]',
  1: 'fill-[var(--color-muted)]',
};
const MARK_CLASS: Record<Weight, string> = {
  3: 'text-[var(--color-foreground)]',
  2: 'text-[var(--color-foreground)]',
  1: 'text-[var(--color-muted)]',
};

const ROW_PREFIX = '#skill-';

// /skills (P5-03, plan docs/plans/2026-10-21-P5-skills-graph.md § Render): the stack as an SVG drawing laid out by
// src/lib/graph, and the same data as a definition list under the List view toggle, which is also what prints (D101).
export default function SkillGraph({ clusters, nodes, edges, projects }: SkillGraphProps) {
  const viewport = useSyncExternalStore(subscribeViewport, viewportSnapshot, serverViewport);
  const layout = useMemo(
    () => layoutGraph({ clusters, nodes, edges }, viewport === 'wide' ? WIDE_MIN : WIDE_MIN - 1),
    [clusters, nodes, edges, viewport],
  );
  const view = fitAll(layout, layout.height / layout.width);
  const paths = useMemo(() => edgePaths(layout, edges), [layout, edges]);
  const titleOf = useMemo(() => new Map(projects.map((p) => [p.slug, p.title])), [projects]);

  const [listOn, setListOn] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  // The row to focus once the list is on screen (a node click, or a #skill-<id>); `n` makes the same row twice a
  // new request. The toggle clears it, so turning the list on by hand leaves focus on the toggle.
  const [rowRequest, setRowRequest] = useState<{ id: string; n: number } | null>(null);

  const openRow = (id: string) => {
    setHover(null);
    setListOn(true);
    setRowRequest((prev) => ({ id, n: (prev?.n ?? 0) + 1 }));
  };

  // A #skill-<id> the page loads with, or that a link on the page sets, opens the list at that row. After mount,
  // never during render: the server has no location. Ids are kebab-case, so the hash is compared undecoded.
  useEffect(() => {
    const follow = () => {
      const { hash } = window.location;
      if (!hash.startsWith(ROW_PREFIX)) return;
      const id = hash.slice(ROW_PREFIX.length);
      if (!nodes.some((n) => n.id === id)) return;
      setHover(null);
      setListOn(true);
      setRowRequest((prev) => ({ id, n: (prev?.n ?? 0) + 1 }));
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => {
      window.removeEventListener('hashchange', follow);
    };
  }, [nodes]);

  useEffect(() => {
    if (rowRequest) document.getElementById(`skill-${rowRequest.id}`)?.focus();
  }, [rowRequest]);

  const hoverPaths = hover ? paths.filter((e) => e.cross && (e.from === hover || e.to === hover)) : [];
  const title = `Tech stack: ${nodes.length} skills in ${clusters.length} groups. The list view has the same data as text.`;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          aria-pressed={listOn}
          onClick={() => {
            setHover(null);
            setRowRequest(null);
            setListOn((on) => !on);
          }}
          className={`min-h-11 sm:min-h-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            listOn
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
              : 'border-white/15 text-[var(--color-foreground)] hover:border-white/30'
          } ${focusRing}`}
        >
          List view
        </button>
      </div>

      <div
        role="group"
        aria-labelledby="skill-graph-title"
        className={`${listOn ? 'hidden' : 'block'} print:hidden rounded-xl touch-pan-y touch-pinch-zoom`}
      >
        <svg
          role="none"
          viewBox={viewBoxFor(view)}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full h-auto"
          style={{ aspectRatio: `${view.w} / ${view.h}` }}
        >
          <title id="skill-graph-title">{title}</title>

          {/* Paint order: every cluster's container, then every edge, then every node, so an edge never covers a
              node and a container never covers an edge. */}
          <g aria-hidden="true">
            {layout.clusters.map((c) => (
              <g key={c.id} data-cluster-box={c.id}>
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx="16"
                  className="fill-[var(--color-surface)] stroke-white/8"
                />
                <text
                  x={c.x + 18}
                  y={c.y + 28}
                  fontSize="13"
                  letterSpacing="2"
                  className="fill-[var(--color-accent)] font-mono uppercase"
                >
                  {c.name}
                </text>
              </g>
            ))}
          </g>

          <g aria-hidden="true" fill="none" strokeWidth="1.25">
            {paths
              .filter((e) => !e.cross)
              .map((e) => (
                <path key={`${e.from}>${e.to}`} data-edge="" d={e.d} className="stroke-white/15">
                  {e.label ? <title>{e.label}</title> : null}
                </path>
              ))}
            {hoverPaths.map((e) => (
              <path
                key={`${e.from}>${e.to}`}
                data-edge=""
                data-cross=""
                data-hover="true"
                d={e.d}
                className="stroke-[var(--color-accent)]/60"
              />
            ))}
          </g>

          {layout.clusters.map((c) => (
            <g key={c.id} role="group" aria-label={c.name} data-cluster={c.id}>
              {nodes
                .filter((n) => n.cluster === c.id)
                .map((n) => {
                  const p = layout.nodes[n.id];
                  return (
                    <a
                      key={n.id}
                      href={`${ROW_PREFIX}${n.id}`}
                      aria-label={n.name}
                      data-node={n.id}
                      data-hover={hover === n.id ? 'true' : undefined}
                      className={`group ${focusRing}`}
                      onClick={(e) => {
                        // a modified click (new tab or window) is the browser's
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        window.history.replaceState(null, '', `${ROW_PREFIX}${n.id}`);
                        openRow(n.id);
                      }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(n.id)}
                      onBlur={() => setHover(null)}
                    >
                      {/* the node's own tooltip, over the svg's <title>; its name stays the aria-label */}
                      <title>{n.name}</title>
                      {/* the cell: the link's hit area, and a focus ring for browsers that draw no outline on svg */}
                      <rect
                        x={p.box.x}
                        y={p.box.y}
                        width={p.box.w}
                        height={p.box.h}
                        rx="10"
                        fill="transparent"
                        strokeWidth="2"
                        className="stroke-transparent group-focus-visible:stroke-[var(--color-accent)]"
                      />
                      {n.logo ? (
                        <Logo
                          name={n.logo}
                          decorative
                          x={p.x - p.size / 2}
                          y={p.y - p.size / 2}
                          size={p.size}
                          className={`${MARK_CLASS[n.weight]} group-hover:text-[var(--color-accent)]`}
                        />
                      ) : (
                        <circle cx={p.x} cy={p.y} r={p.size / 4} className="fill-[var(--color-accent)]" />
                      )}
                      <text aria-hidden="true" textAnchor="middle" fontSize="12" className={LABEL_CLASS[n.weight]}>
                        {p.lines.map((line, i) => (
                          <tspan key={i} x={p.x} y={p.y + LABEL_DY[i]}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </a>
                  );
                })}
            </g>
          ))}
        </svg>
      </div>

      {/* Never the hidden attribute: preflight makes [hidden] display:none !important, and print shows this list */}
      <div id="skill-list" className={listOn ? 'block' : 'hidden print:block'}>
        {clusters.map((c) => (
          <section key={c.id} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">{c.name}</h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
              {nodes
                .filter((n) => n.cluster === c.id)
                .map((n) => {
                  const used = projectsOf(edges, n.id).filter((slug) => titleOf.has(slug));
                  return (
                    <Fragment key={n.id}>
                      <dt
                        id={`skill-${n.id}`}
                        tabIndex={-1}
                        className="font-medium text-[var(--color-foreground)] scroll-mt-24 rounded-sm focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
                      >
                        {n.name}
                      </dt>
                      <dd className="text-[var(--color-muted)] text-sm sm:text-base">
                        {WEIGHT_WORD[n.weight]}
                        {n.since ? ` · since ${n.since}` : null}
                        {used.length === 0 ? (
                          ' · From my roles'
                        ) : (
                          <>
                            {' · Used in: '}
                            {used.map((slug, i) => (
                              <Fragment key={slug}>
                                {i > 0 ? ', ' : null}
                                <Link href={`/projects/${slug}`} className={textLink}>
                                  {titleOf.get(slug)}
                                </Link>
                              </Fragment>
                            ))}
                          </>
                        )}
                      </dd>
                    </Fragment>
                  );
                })}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
