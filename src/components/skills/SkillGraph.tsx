'use client';

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import Link from 'next/link';
import Logo from '@/components/logos/Logo';
import { focusRing } from '@/components/focusRing';
import { textLink } from '@/components/textLink';
import type { Cluster, SkillEdge, SkillNode, Weight } from '@/lib/data/skills';
import { nodesOf, projectsOf } from '@/lib/graph/edges';
import {
  clusterAt,
  curvePath,
  edgePaths,
  layoutGraph,
  LABEL_DY,
  NARROW_ASPECT,
  projectChain,
  WIDE_MIN,
  type GraphLayout,
} from '@/lib/graph/layout';
import {
  centerOn,
  clientToDrawing,
  contains,
  DRAG_SLOP,
  fitAll,
  fitCluster,
  PAN_STEP,
  panBy,
  viewBoxFor,
  wheelFactor,
  ZOOM_STEP,
  zoomAt,
  type View,
} from '@/lib/graph/view';

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

// The first view, and what Reset view goes back to: the whole drawing from 640 px, the first cluster below (D102),
// at the narrow aspect so it draws at about one px a unit.
const firstView = (layout: GraphLayout, viewport: Viewport): View =>
  viewport === 'narrow'
    ? fitCluster(layout, layout.clusters[0].id, NARROW_ASPECT)
    : fitAll(layout, layout.height / layout.width);

const centre = (v: View) => ({ x: v.x + v.w / 2, y: v.y + v.h / 2 });

// A wheel's deltaY in px: Firefox can report lines (deltaMode 1) or pages (2)
const WHEEL_LINE = 16;
const WHEEL_PAGE = 800;
const wheelPx = (e: WheelEvent) => e.deltaY * (e.deltaMode === 1 ? WHEEL_LINE : e.deltaMode === 2 ? WHEEL_PAGE : 1);

// Keys the graph answers while focus is inside it (with no Ctrl, ⌘ or Alt: those are the browser's)
const KEY_ACTIONS: Record<string, 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset'> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  '+': 'in',
  '=': 'in',
  '-': 'out',
  '0': 'reset',
};

interface Drag {
  pointerId: number;
  x: number;
  y: number;
  start: View;
  moving: boolean;
}

// A highlight fades only where motion is welcome; a dimmed node is back at full opacity on keyboard focus
const fade = 'motion-safe:transition-opacity';
const dimmed = 'opacity-25 focus-visible:opacity-100';

const control = `rounded-full border text-sm font-medium transition-colors ${focusRing}`;
const controlOff = 'border-white/15 text-[var(--color-foreground)] hover:border-white/30';
const controlOn = 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10';

// /skills (P5-03, plan docs/plans/2026-10-21-P5-skills-graph.md § Render): the stack as an SVG drawing laid out by
// src/lib/graph, and the same data as a definition list under the List view toggle, which is also what prints (D101).
export default function SkillGraph({ clusters, nodes, edges, projects }: SkillGraphProps) {
  const viewport = useSyncExternalStore(subscribeViewport, viewportSnapshot, serverViewport);
  const layout = useMemo(
    () => layoutGraph({ clusters, nodes, edges }, viewport === 'wide' ? WIDE_MIN : WIDE_MIN - 1),
    [clusters, nodes, edges, viewport],
  );
  const bounds = useMemo(() => ({ w: layout.width, h: layout.height }), [layout]);

  // The view is the svg's viewBox; a new viewport (columns or the narrow start) resets it, during render with the
  // previous-value pattern rather than in an effect.
  const [view, setView] = useState(() => firstView(layout, viewport));
  const [viewFor, setViewFor] = useState(viewport);
  if (viewFor !== viewport) {
    setViewFor(viewport);
    setView(firstView(layout, viewport));
  }
  const reset = () => setView(firstView(layout, viewport));
  const zoomBy = (factor: number) => setView((v) => zoomAt(v, factor, centre(v), bounds));

  // the view on screen, for event handlers that must decide before React renders again (a drag's start, the wheel)
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  // set when a drag ends, so the click that follows it (on a node, say) doesn't open the list
  const dragged = useRef(false);
  const paths = useMemo(() => edgePaths(layout, edges), [layout, edges]);
  const titleOf = useMemo(() => new Map(projects.map((p) => [p.slug, p.title])), [projects]);

  const [listOn, setListOn] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  // The project chip pressed (a slug): its nodes data-active, the rest data-dim, its chain drawn (P5-05)
  const [selected, setSelected] = useState<string | null>(null);
  // set by a clear, so the live line says so instead of going quiet
  const [cleared, setCleared] = useState(false);
  const chips = useMemo(
    () => projects.filter((p) => p.featured && nodesOf(edges, p.slug).length > 0).sort((a, b) => a.order - b.order),
    [projects, edges],
  );
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

  // The wheel zooms at the cursor only with focus inside the graph or Ctrl/⌘ held (a trackpad pinch), D100; a plain
  // wheel anywhere else is the page's scroll. React's onWheel is passive and can't preventDefault, hence this one
  // listener on the element, removed with it.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || el.contains(document.activeElement))) return;
      const rect = svgRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
      const client = { x: e.clientX, y: e.clientY };
      const factor = wheelFactor(wheelPx(e));
      const zoom = (v: View) => zoomAt(v, factor, clientToDrawing(v, rect, client), bounds);
      // a wheel that zooms nothing (a sideways swipe, or past a zoom limit) stays the page's: scroll, back-swipe
      const now = viewRef.current;
      if (viewBoxFor(zoom(now)) === viewBoxFor(now)) return;
      e.preventDefault();
      setView(zoom);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [bounds]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return;
    const action = KEY_ACTIONS[e.key];
    if (!action) return;
    e.preventDefault();
    if (action === 'reset') return reset();
    if (action === 'in' || action === 'out') return zoomBy(action === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP);
    setView((v) => {
      const dx = action === 'left' ? -PAN_STEP * v.w : action === 'right' ? PAN_STEP * v.w : 0;
      const dy = action === 'up' ? -PAN_STEP * v.h : action === 'down' ? PAN_STEP * v.h : 0;
      return panBy(v, dx, dy, bounds);
    });
  };

  // A drag pans by the pointer's delta. Pointer capture after the slop keeps the moves on this element, so there is
  // no window listener to leak; a move under DRAG_SLOP px stays a click.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (e.button !== 0) return;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, start: viewRef.current, moving: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moving) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      d.moving = true;
      // from the view on screen now, not at the press (a wheel may have zoomed since)
      d.start = viewRef.current;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    const rect = svgRef.current?.getBoundingClientRect();
    // a box with no size (jsdom, or not laid out yet) has no scale: skip, never a NaN viewBox
    if (!rect || !(rect.width > 0 && rect.height > 0)) return;
    const scale = d.start.w / rect.width;
    setView(panBy(d.start, -dx * scale, -dy * scale, bounds));
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragged.current = d.moving;
    drag.current = null;
    // the click a drag ends with comes right after pointerup; a touch drag has none, so the flag mustn't outlive it
    if (d.moving) setTimeout(() => (dragged.current = false), 0);
  };
  const cancelDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  // Tab onto a node outside the view brings it into view, so a keyboard user always sees what has focus; a press
  // (which focuses the link too) leaves the view to the pointer
  const inView = (v: View, id: string) => {
    const { box } = layout.nodes[id];
    return contains(v, { x: box.x, y: box.y }) && contains(v, { x: box.x + box.w, y: box.y + box.h });
  };
  const reveal = (id: string) => {
    if (drag.current) return;
    setView((v) => (inView(v, id) ? v : centerOn(v, layout.nodes[id], bounds)));
  };

  const pressedCluster = clusterAt(layout, centre(view));

  const active = useMemo(
    () => new Set(selected ? nodesOf(edges, selected).filter((id) => id in layout.nodes) : []),
    [selected, edges, layout],
  );
  // the selection's cross-cluster links, in cluster order: k clusters cross k − 1 times
  const chainPaths = useMemo(
    () =>
      projectChain(layout, [...active])
        .filter(([a, b]) => layout.nodes[a].cluster !== layout.nodes[b].cluster)
        .map(([a, b]) => ({ key: `${a}>${b}`, d: curvePath(layout.nodes[a], layout.nodes[b]) })),
    [layout, active],
  );
  const selectedTitle = selected ? titleOf.get(selected) : undefined;
  const skills = `${active.size} skill${active.size === 1 ? '' : 's'}`;
  const status = selectedTitle ? `${selectedTitle}: ${skills} highlighted.` : cleared ? 'Highlight cleared.' : '';
  // a node's or edge's part in the selection: null with none, else whether it is the project's
  const partOf = (...ids: string[]) => (selected ? ids.every((id) => active.has(id)) : null);
  const stateAttrs = (on: boolean | null) =>
    on === null ? {} : on ? { 'data-active': 'true' } : { 'data-dim': 'true' };

  const clear = () => {
    setSelected(null);
    setCleared(true);
  };

  // A chip toggles its project; below 640, where the view holds one cluster, a project with no node in view moves it
  // to its chain's first cluster
  const select = (slug: string) => {
    if (selected === slug) return clear();
    setSelected(slug);
    setCleared(false);
    if (viewport !== 'narrow') return;
    // layout.nodes is in cluster then drawing order, so its first match is the chain's head
    const ids = Object.keys(layout.nodes).filter((id) => nodesOf(edges, slug).includes(id));
    const [head] = ids;
    if (!head) return;
    setView((v) =>
      ids.some((id) => inView(v, id))
        ? v
        : fitCluster(layout, layout.nodes[head].cluster, v.h / v.w),
    );
  };

  // Esc in the graph's part of the section clears a selection (and the hover); with nothing selected, or from the
  // list view (where the selection isn't shown), it is someone else's
  const onSectionKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !selected || listOn) return;
    e.preventDefault();
    clear();
    setHover(null);
  };

  const hoverPaths = hover ? paths.filter((e) => e.cross && (e.from === hover || e.to === hover)) : [];
  const title = `Tech stack: ${nodes.length} skills in ${clusters.length} groups. The list view has the same data as text.`;

  return (
    <div onKeyDown={onSectionKeyDown}>
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
      {listOn ? null : (
        <div className="mb-3 print:hidden">
          <div
            role="group"
            aria-label="Highlight a project's stack"
            className="flex gap-2 overflow-x-auto sm:flex-wrap p-1"
          >
            {chips.map((p) => (
              <button
                key={p.slug}
                type="button"
                aria-pressed={selected === p.slug}
                onClick={() => select(p.slug)}
                className={`shrink-0 min-h-11 px-4 whitespace-nowrap ${control} ${
                  selected === p.slug ? controlOn : controlOff
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
          {selected ? (
            <p className="mt-2 px-1 text-sm text-[var(--color-muted)]">
              <span>{`${selectedTitle} · ${skills}`}</span>
              {' · '}
              <Link href={`/projects/${selected}`} className={textLink}>
                Open case study
              </Link>
            </p>
          ) : null}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {listOn ? null : (
          <>
            {/* below 640 the view starts on one cluster: these jump to the others (D102); they scroll in their row */}
            <div
              role="group"
              aria-label="Jump to a group"
              className="flex sm:hidden w-full gap-2 overflow-x-auto p-1 print:hidden"
            >
              {layout.clusters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={pressedCluster === c.id}
                  onClick={() => setView((v) => fitCluster(layout, c.id, v.h / v.w))}
                  className={`shrink-0 min-h-11 px-4 whitespace-nowrap ${control} ${
                    pressedCluster === c.id ? controlOn : controlOff
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomBy(ZOOM_STEP)}
                className={`size-11 text-lg ${control} ${controlOff}`}
              >
                +
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomBy(1 / ZOOM_STEP)}
                className={`size-11 text-lg ${control} ${controlOff}`}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Reset view"
                onClick={reset}
                className={`min-h-11 px-4 ${control} ${controlOff}`}
              >
                Reset
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          aria-pressed={listOn}
          onClick={() => {
            setHover(null);
            setRowRequest(null);
            setListOn((on) => !on);
          }}
          className={`ml-auto min-h-11 px-4 ${control} ${listOn ? controlOn : controlOff}`}
        >
          List view
        </button>
      </div>

      <div
        ref={containerRef}
        role="group"
        tabIndex={0}
        aria-labelledby="skill-graph-title"
        aria-describedby="skill-graph-help"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onClickCapture={(e) => {
          if (!dragged.current) return;
          dragged.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`${listOn ? 'hidden' : 'block'} print:hidden rounded-xl touch-pan-y touch-pinch-zoom select-none cursor-grab active:cursor-grabbing ${focusRing}`}
      >
        <svg
          ref={svgRef}
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
                <path
                  key={`${e.from}>${e.to}`}
                  data-edge=""
                  {...stateAttrs(partOf(e.from, e.to))}
                  d={e.d}
                  className={`${fade} ${
                    partOf(e.from, e.to) ? 'stroke-[var(--color-accent)]/60' : 'stroke-white/15'
                  } ${partOf(e.from, e.to) === false ? dimmed : ''}`}
                >
                  {e.label ? <title>{e.label}</title> : null}
                </path>
              ))}
            {chainPaths.map((e) => (
              <path
                key={`chain:${e.key}`}
                data-edge=""
                data-cross=""
                data-active="true"
                d={e.d}
                strokeWidth="1.5"
                className={`${fade} stroke-[var(--color-accent)]`}
              />
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
                  const on = partOf(n.id);
                  return (
                    <a
                      key={n.id}
                      href={`${ROW_PREFIX}${n.id}`}
                      aria-label={n.name}
                      data-node={n.id}
                      data-hover={hover === n.id ? 'true' : undefined}
                      {...stateAttrs(on)}
                      className={`group ${fade} ${on === false && hover !== n.id ? dimmed : ''} ${focusRing}`}
                      onClick={(e) => {
                        // a modified click (new tab or window) is the browser's
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        window.history.replaceState(null, '', `${ROW_PREFIX}${n.id}`);
                        openRow(n.id);
                      }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => {
                        setHover(n.id);
                        reveal(n.id);
                      }}
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

      <p
        id="skill-graph-help"
        className={`${listOn ? 'hidden' : 'block'} print:hidden mt-3 text-sm text-[var(--color-muted)]`}
      >
        Arrow keys pan, plus and minus zoom. Drag to move.
      </p>

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
