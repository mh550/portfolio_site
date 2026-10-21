// The /skills graph's hand layout (P5, D99): pure functions, no React, no DOM, no data import (types only), so tests
// pass fixtures. All lengths are viewBox units; docs/plans/2026-10-21-P5-skills-graph.md § Layout has the sketches.
import type { Cluster, ClusterId, SkillEdge, SkillNode } from '@/lib/data/skills';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GraphData {
  clusters: Cluster[];
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export interface ClusterBox extends Rect {
  id: ClusterId;
  name: string;
}

export interface NodePoint {
  id: string;
  name: string;
  cluster: ClusterId;
  weight: SkillNode['weight'];
  /** the logo's centre and the edges' endpoint */
  x: number;
  y: number;
  /** the logo's side: 28 / 24 / 20 for weight 3 / 2 / 1 */
  size: number;
  lines: string[];
  /** the cell less 2 a side: what "no overlap" tests */
  box: Rect;
}

export interface GraphLayout {
  /** the drawing's bounds */
  width: number;
  height: number;
  columns: 2 | 3;
  clusters: ClusterBox[];
  /** keyed by node id, in cluster then drawing order */
  nodes: Record<string, NodePoint>;
}

export interface EdgePath {
  from: string;
  to: string;
  d: string;
  /** the ends are in different clusters */
  cross: boolean;
  label?: string;
}

export const PAD = 16;
export const GAP = 24;
export const CLUSTER_W = 324;
export const TITLE_H = 44;
export const INSET = 6;
export const CELL_W = 104;
export const CELL_H = 76;
export const CELLS = 3;
export const BOTTOM = 12;
/** CSS px of the viewport from which the drawing has three columns */
export const WIDE_MIN = 1024;
/** The label lines' baselines below a node's point (12-unit text, two lines at most) */
export const LABEL_DY = [30, 44] as const;
/** h / w of a 3-row cluster ± 12 (308 / 348): the svg's aspect below 640 px, where the first view is that cluster */
export const NARROW_ASPECT = (TITLE_H + 3 * CELL_H + BOTTOM + 24) / (CLUSTER_W + 24);

export function columnsFor(width: number): 2 | 3 {
  return width >= WIDE_MIN ? 3 : 2;
}

const SIZE: Record<SkillNode['weight'], number> = { 3: 28, 2: 24, 1: 20 };

/** One or two lines: split at the last space that keeps both within `max`; a name that can't split stays whole. */
export function labelLines(name: string, max = 16): string[] {
  if (name.length <= max) return [name];
  for (let i = name.lastIndexOf(' '); i > 0; i = name.lastIndexOf(' ', i - 1)) {
    const first = name.slice(0, i);
    const second = name.slice(i + 1);
    if (first.length <= max && second.length <= max) return [first, second];
  }
  return [name];
}

export function layoutGraph(data: GraphData, width: number): GraphLayout {
  const columns = columnsFor(width);
  const members = (id: ClusterId) => data.nodes.filter((n) => n.cluster === id);
  const heightOf = (id: ClusterId) => TITLE_H + Math.ceil(members(id).length / CELLS) * CELL_H + BOTTOM;

  const clusters: ClusterBox[] = [];
  const nodes: Record<string, NodePoint> = {};
  let y = PAD;
  for (let start = 0; start < data.clusters.length; start += columns) {
    const row = data.clusters.slice(start, start + columns);
    row.forEach(({ id, name }, col) => {
      const box: ClusterBox = { id, name, x: PAD + col * (CLUSTER_W + GAP), y, w: CLUSTER_W, h: heightOf(id) };
      clusters.push(box);
      const inCluster = members(id);
      inCluster.forEach((node, i) => {
        const c = i % CELLS;
        const r = Math.floor(i / CELLS);
        // a short last row is centred
        const inRow = Math.min(CELLS, inCluster.length - r * CELLS);
        const ox = box.x + INSET + c * CELL_W + ((CELLS - inRow) * CELL_W) / 2;
        const oy = box.y + TITLE_H + r * CELL_H;
        nodes[node.id] = {
          id: node.id,
          name: node.name,
          cluster: id,
          weight: node.weight,
          x: ox + CELL_W / 2,
          y: oy + 22,
          size: SIZE[node.weight],
          lines: labelLines(node.name),
          box: { x: ox + 2, y: oy + 2, w: CELL_W - 4, h: CELL_H - 4 },
        };
      });
    });
    y += Math.max(...row.map((c) => heightOf(c.id))) + GAP;
  }

  return {
    width: PAD * 2 + columns * CLUSTER_W + (columns - 1) * GAP,
    height: y - GAP + PAD,
    columns,
    clusters,
    nodes,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10 + 0;

/**
 * A cubic from a to b: controls at ⅓ and ⅔ of the chord, pushed `bend × length` along its normal (−dy, dx), which in
 * the svg's y-down units is to the right of a → b: a west-to-east edge bows down.
 */
export function curvePath(a: Point, b: Point, bend = 0.2): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // the normal (−dy, dx) already has the chord's length
  const nx = -dy * bend;
  const ny = dx * bend;
  const nums = [a.x, a.y, a.x + dx / 3 + nx, a.y + dy / 3 + ny, a.x + (2 * dx) / 3 + nx, a.y + (2 * dy) / 3 + ny, b.x, b.y];
  const [ax, ay, c1x, c1y, c2x, c2y, bx, by] = nums.map(round1);
  return `M ${ax} ${ay} C ${c1x} ${c1y} ${c2x} ${c2y} ${bx} ${by}`;
}

/** The node ↔ node edges whose ends are both laid out; project edges are skipped. */
export function edgePaths(layout: GraphLayout, edges: SkillEdge[]): EdgePath[] {
  return edges.flatMap(({ from, to, label }) => {
    const a = layout.nodes[from];
    const b = layout.nodes[to];
    if (!a || !b) return [];
    return [{ from, to, d: curvePath(a, b), cross: a.cluster !== b.cluster, ...(label ? { label } : {}) }];
  });
}

/** A project's nodes in cluster then drawing order, joined pairwise: k clusters cross k − 1 times. */
export function projectChain(layout: GraphLayout, nodeIds: string[]): [string, string][] {
  const order = Object.keys(layout.nodes);
  const sorted = nodeIds.filter((id) => id in layout.nodes).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.slice(1).map((id, i) => [sorted[i], id]);
}

/** The cluster whose rect holds `p`; null in a gap between clusters (then no 390 chip is pressed). */
export function clusterAt(layout: GraphLayout, p: Point): ClusterId | null {
  const hit = layout.clusters.find((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
  return hit?.id ?? null;
}
