// The /skills graph's pan and zoom (P5): pure functions over a view (the svg's viewBox, in drawing units). Every
// function returns a new view, clamped; the svg's aspect always equals the view's, so there is no letterbox.
import type { GraphLayout, Point, Rect } from './layout';

export type View = Rect;

export interface Bounds {
  w: number;
  h: number;
}

/** Zoom factor of the buttons and + / − keys */
export const ZOOM_STEP = 1.25;
/** Arrow keys pan this share of the view's width (or height) */
export const PAN_STEP = 0.1;
/** CSS px a pointer moves before it counts as a drag */
export const DRAG_SLOP = 4;
/** The narrowest view, in drawing units */
const MIN_VIEW_W = 160;
/** How far past the drawing a view may show */
const VIEW_PAD = 24;
/** The margin around a cluster that fitCluster shows */
const FIT_PAD = 12;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const positive = (n: number) => Number.isFinite(n) && n > 0;
const round2 = (n: number) => Math.round(n * 100) / 100 + 0;

export function viewBoxFor(view: View): string {
  return [view.x, view.y, view.w, view.h].map(round2).join(' ');
}

/** A wheel's deltaY as a zoom factor, at most one button step either way. */
export function wheelFactor(deltaY: number): number {
  return clamp(Math.exp(-deltaY * 0.002), 1 / ZOOM_STEP, ZOOM_STEP);
}

/** The widest view at `aspect`: the whole padded drawing on the axis that fits last. */
function maxViewW(aspect: number, bounds: Bounds, pad: number): number {
  return Math.max(bounds.w + 2 * pad, (bounds.h + 2 * pad) / aspect);
}

/**
 * Keeps the aspect. The width stays between MIN_VIEW_W and the whole padded drawing on the axis that fits last, so a
 * tall phone view can still zoom out to all of it; each axis stays within the drawing ± pad, or is centred when the
 * view is larger than the padded drawing on it.
 */
export function clampView(view: View, bounds: Bounds, pad = VIEW_PAD): View {
  const aspect = view.h / view.w;
  const w = clamp(view.w, MIN_VIEW_W, maxViewW(aspect, bounds, pad));
  const h = w === view.w ? view.h : w * aspect;
  const axis = (pos: number, size: number, extent: number) =>
    size > extent + 2 * pad ? (extent - size) / 2 : clamp(pos, -pad, extent + pad - size);
  return { x: axis(view.x, w, bounds.w), y: axis(view.y, h, bounds.h), w, h };
}

const boundsOf = (layout: GraphLayout): Bounds => ({ w: layout.width, h: layout.height });

/**
 * Zooms by `factor` (> 1 is in) keeping `point` where it is on screen. The factor is first capped to the zoom limits,
 * so a press at a limit leaves the view where it is; a factor that is not a positive number changes nothing.
 */
export function zoomAt(view: View, factor: number, point: Point, bounds: Bounds): View {
  if (!positive(factor)) return view;
  const w = clamp(view.w / factor, MIN_VIEW_W, maxViewW(view.h / view.w, bounds, VIEW_PAD));
  const f = view.w / w;
  return clampView(
    {
      x: point.x - (point.x - view.x) / f,
      y: point.y - (point.y - view.y) / f,
      w,
      h: w === view.w ? view.h : view.h / f,
    },
    bounds,
  );
}

export function panBy(view: View, dx: number, dy: number, bounds: Bounds): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, bounds);
}

/** `rect` grown on one axis to `aspect` (h / w), centred on it; an aspect that is not a positive number is ignored. */
function fitRect(rect: Rect, aspect: number): View {
  let { w, h } = rect;
  if (!positive(aspect)) return { ...rect };
  if (h / w < aspect) h = w * aspect;
  else if (h / w > aspect) w = h / aspect;
  return { x: rect.x - (w - rect.w) / 2, y: rect.y - (h - rect.h) / 2, w, h };
}

/** The whole drawing at `aspect`. */
export function fitAll(layout: GraphLayout, aspect: number): View {
  return clampView(fitRect({ x: 0, y: 0, w: layout.width, h: layout.height }, aspect), boundsOf(layout));
}

/** One cluster ± `pad` at `aspect`; the whole drawing for an unknown id. */
export function fitCluster(layout: GraphLayout, clusterId: string, aspect: number, pad = FIT_PAD): View {
  const c = layout.clusters.find((box) => box.id === clusterId);
  if (!c) return fitAll(layout, aspect);
  return clampView(fitRect({ x: c.x - pad, y: c.y - pad, w: c.w + 2 * pad, h: c.h + 2 * pad }, aspect), boundsOf(layout));
}

/** Same size, centred on `point`. */
export function centerOn(view: View, point: Point, bounds: Bounds): View {
  return clampView({ ...view, x: point.x - view.w / 2, y: point.y - view.h / 2 }, bounds);
}

/** A client position in drawing units; the view's centre when the rect has no size (jsdom), never NaN. */
export function clientToDrawing(
  view: View,
  rect: { left: number; top: number; width: number; height: number },
  client: Point,
): Point {
  if (!(rect.width > 0 && rect.height > 0)) return { x: view.x + view.w / 2, y: view.y + view.h / 2 };
  return {
    x: view.x + ((client.x - rect.left) / rect.width) * view.w,
    y: view.y + ((client.y - rect.top) / rect.height) * view.h,
  };
}

/** Is `point` inside the view, less `margin` on every side? */
export function contains(view: View, point: Point, margin = 0): boolean {
  return (
    point.x >= view.x + margin &&
    point.x <= view.x + view.w - margin &&
    point.y >= view.y + margin &&
    point.y <= view.y + view.h - margin
  );
}
