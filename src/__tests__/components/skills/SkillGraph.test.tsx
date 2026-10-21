import { act, fireEvent, render, screen, within } from '@testing-library/react';
import SkillGraph, { type GraphProject } from '@/components/skills/SkillGraph';
import { clusters, edges, nodes } from '@/lib/data/skills';
import { projects as allProjects } from '@/lib/data/projects';
import { clusterAt, curvePath, edgePaths, layoutGraph, NARROW_ASPECT, projectChain } from '@/lib/graph/layout';
import { nodesOf } from '@/lib/graph/edges';
import {
  centerOn,
  contains,
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
import fs from 'fs';
import path from 'path';

let mockReduced = false;
// The shared mock with a switchable useReducedMotion (P5-03 step 4: the view never tweens, whatever it says)
jest.mock('framer-motion', () => ({
  ...jest.requireActual<typeof import('@/__mocks__/framer-motion')>('@/__mocks__/framer-motion'),
  useReducedMotion: () => mockReduced,
}));

const projects: GraphProject[] = allProjects.map(({ slug, title, featured, order }) => ({
  slug,
  title: title.split(':')[0].trim(),
  featured,
  order,
}));

const renderGraph = () => render(<SkillGraph clusters={clusters} nodes={nodes} edges={edges} projects={projects} />);
const svg = (c: HTMLElement) => c.querySelector('svg[role="none"]')!;
const graph = () => screen.getByRole('group', { name: /^Tech stack:/ });
const listToggle = () => screen.getByRole('button', { name: 'List view' });
const list = () => document.getElementById('skill-list')!;

const data = { clusters, nodes, edges };
const wide = layoutGraph(data, 1280);
const narrow = layoutGraph(data, 390);
const allPaths = edgePaths(wide, edges);
const intra = allPaths.filter((e) => !e.cross);
const crossOf = (id: string) => allPaths.filter((e) => e.cross && (e.from === id || e.to === id));
// a node with cross-cluster edges, for the hover tests
const hub = nodes.find((n) => crossOf(n.id).length > 0)!;

afterEach(() => {
  mockReduced = false;
  window.history.replaceState(null, '', '/');
});

describe('SkillGraph: the drawing (P5-03)', () => {
  it('is one group named by the svg <title>, which counts the data; the svg itself is role="none" (D103)', () => {
    const { container } = renderGraph();
    const title = svg(container).querySelector('title')!;
    expect(title).toHaveAttribute('id', 'skill-graph-title');
    expect(title.textContent).toBe(
      `Tech stack: ${nodes.length} skills in ${clusters.length} groups. The list view has the same data as text.`,
    );
    expect(graph()).toHaveAttribute('aria-labelledby', 'skill-graph-title');
    expect(graph()).toContainElement(svg(container) as unknown as HTMLElement);
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(0);
  });

  it('draws a <g> per cluster with a rounded rect and its title text', () => {
    const { container } = renderGraph();
    const boxes = Array.from(container.querySelectorAll('g[data-cluster-box]'));
    expect(boxes.map((g) => g.getAttribute('data-cluster-box'))).toEqual(clusters.map((c) => c.id));
    boxes.forEach((g, i) => {
      const rect = g.querySelector('rect')!;
      const box = wide.clusters[i];
      expect(rect).toHaveAttribute('rx', '16');
      expect([rect.getAttribute('x'), rect.getAttribute('y')]).toEqual([String(box.x), String(box.y)]);
      expect([rect.getAttribute('width'), rect.getAttribute('height')]).toEqual([String(box.w), String(box.h)]);
      expect(g.querySelector('text')).toHaveTextContent(clusters[i].name);
      expect(g.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('nests a group per cluster, named by it, holding a link per node in drawing order', () => {
    renderGraph();
    for (const c of clusters) {
      const group = within(graph()).getByRole('group', { name: c.name });
      expect(group).toHaveAttribute('data-cluster', c.id);
      const links = within(group).getAllByRole('link');
      const members = nodes.filter((n) => n.cluster === c.id);
      expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(members.map((n) => n.name));
      expect(links.map((a) => a.getAttribute('href'))).toEqual(members.map((n) => `#skill-${n.id}`));
    }
  });

  it('draws each node as its logo (decorative) or a dot, and its label lines', () => {
    const { container } = renderGraph();
    for (const n of nodes) {
      const a = container.querySelector(`a[data-node="${n.id}"]`)!;
      const logo = a.querySelector('svg');
      if (n.logo) {
        expect(logo).toHaveAttribute('aria-hidden', 'true');
        expect(logo).toHaveAttribute('width', String(wide.nodes[n.id].size));
        expect(a.querySelector('circle')).toBeNull();
      } else {
        expect(logo).toBeNull();
        expect(a.querySelector('circle')).toHaveAttribute('r', String(wide.nodes[n.id].size / 4));
      }
      const tspans = Array.from(a.querySelectorAll('text tspan')).map((t) => t.textContent);
      expect(tspans).toEqual(wide.nodes[n.id].lines);
    }
  });

  it("gives each node its own tooltip (<title>) and a labelled edge its label (review #9, #10)", () => {
    const { container } = renderGraph();
    for (const n of nodes) {
      expect(container.querySelector(`a[data-node="${n.id}"] > title`)).toHaveTextContent(n.name);
    }
    for (const e of intra.filter((p) => p.label)) {
      const path = Array.from(svg(container).querySelectorAll('path[data-edge]')).find((p) => p.getAttribute('d') === e.d)!;
      expect(path.querySelector('title')).toHaveTextContent(e.label!);
    }
  });

  it('draws the focus ring on the cell rect too, for browsers that skip outlines on svg (review #2)', () => {
    const { container } = renderGraph();
    const cell = container.querySelector('a[data-node="python"] > rect')!;
    expect(cell.getAttribute('class')).toMatch(/group-focus-visible:stroke-\[var\(--color-accent\)\]/);
  });

  it('draws one <path> per intra-cluster edge and no cross-cluster edge while nothing is hovered', () => {
    const { container } = renderGraph();
    const paths = Array.from(svg(container).querySelectorAll('path[data-edge]'));
    expect(paths).toHaveLength(intra.length);
    expect(paths.map((p) => p.getAttribute('d'))).toEqual(intra.map((e) => e.d));
    expect(svg(container).querySelectorAll('path[data-cross]')).toHaveLength(0);
  });

  it("hovering or focusing a node marks it data-hover and draws its cross-cluster edges; leaving removes them", () => {
    const { container } = renderGraph();
    const a = container.querySelector(`a[data-node="${hub.id}"]`)!;
    const cross = () => svg(container).querySelectorAll('path[data-cross][data-hover="true"]');

    fireEvent.mouseEnter(a);
    expect(a).toHaveAttribute('data-hover', 'true');
    expect(cross()).toHaveLength(crossOf(hub.id).length);
    fireEvent.mouseLeave(a);
    expect(a).not.toHaveAttribute('data-hover');
    expect(cross()).toHaveLength(0);

    fireEvent.focus(a);
    expect(cross()).toHaveLength(crossOf(hub.id).length);
    fireEvent.blur(a);
    expect(cross()).toHaveLength(0);
  });

  it('shows the whole 3-column drawing without matchMedia (the server snapshot and jsdom)', () => {
    const { container } = renderGraph();
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(fitAll(wide, wide.height / wide.width)));
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
  });

  it('never tweens the view: no transition class or style on the svg, even with reduced motion (D103)', () => {
    for (const reduced of [false, true]) {
      mockReduced = reduced;
      const { container, unmount } = renderGraph();
      const el = svg(container);
      expect(el.getAttribute('class') ?? '').not.toMatch(/transition/);
      expect(el.getAttribute('style') ?? '').not.toMatch(/transition/);
      // the view lives on the svg's viewBox (no tweened group); P5-04's pan and zoom keep it so
      el.querySelectorAll('g').forEach((g) => {
        expect(g.getAttribute('style') ?? '').not.toMatch(/transition/);
        expect(g.getAttribute('class') ?? '').not.toMatch(/transition/);
      });
      unmount();
    }
  });

  it('is print:hidden; the list view is the print view (print:block)', () => {
    renderGraph();
    expect(graph()).toHaveClass('print:hidden');
    expect(list()).toHaveClass('hidden', 'print:block');
  });
});

// matchMedia at a given CSS width, for the two queries SkillGraph reads; `fire` runs their change listeners
const realMatchMedia = window.matchMedia;
let width = 1280;
let mqListeners: (() => void)[] = [];
const fireViewport = (w: number) => {
  width = w;
  act(() => mqListeners.forEach((l) => l()));
};
function useViewportMock() {
  beforeEach(() => {
    mqListeners = [];
    window.matchMedia = jest.fn((query: string) => ({
      get matches() {
        if (query === '(min-width: 1024px)') return width >= 1024;
        if (query === '(max-width: 639px)') return width <= 639;
        return false;
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => mqListeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        mqListeners = mqListeners.filter((l) => l !== fn);
      },
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = realMatchMedia;
    width = 1280;
  });
}

describe('SkillGraph: columns follow the viewport (matchMedia)', () => {
  useViewportMock();

  it('draws 2 columns below 1024 px and 3 from 1024, following a change', () => {
    width = 800;
    const { container, unmount } = renderGraph();
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(fitAll(narrow, narrow.height / narrow.width)));
    expect(container.querySelector('g[data-cluster-box="web"] rect')).toHaveAttribute('x', '16');

    fireViewport(1280);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    expect(container.querySelector('g[data-cluster-box="web"] rect')).toHaveAttribute('x', '712');

    unmount();
    expect(mqListeners).toHaveLength(0);
  });
});

// jsdom has no PointerEvent: a MouseEvent with a pointerId, so fireEvent.pointer* carries clientX/Y and button
const RealPointerEvent = window.PointerEvent;
beforeAll(() => {
  class PointerEventShim extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  window.PointerEvent = PointerEventShim as unknown as typeof PointerEvent;
});
afterAll(() => {
  window.PointerEvent = RealPointerEvent;
});

const wideBounds = { w: wide.width, h: wide.height };
const narrowBounds = { w: narrow.width, h: narrow.height };
const whole: View = fitAll(wide, wide.height / wide.width);
const centre = (v: View) => ({ x: v.x + v.w / 2, y: v.y + v.h / 2 });
const viewOf = (c: HTMLElement): View => {
  const [x, y, w, h] = svg(c).getAttribute('viewBox')!.split(' ').map(Number);
  return { x, y, w, h };
};
const button = (name: string) => screen.getByRole('button', { name });
// the svg's on-screen box, which jsdom leaves at zero size (then a drag doesn't pan and a wheel zooms at the centre)
const sizeSvg = (c: HTMLElement, rect: { left: number; top: number; width: number; height: number }) =>
  jest.spyOn(svg(c), 'getBoundingClientRect').mockReturnValue({
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  } as DOMRect);

describe('SkillGraph: zoom (P5-04)', () => {
  it('Zoom in / Zoom out zoom at the view centre by ZOOM_STEP; Reset view goes back to the first view', () => {
    const { container } = renderGraph();
    const zoomedIn = zoomAt(whole, ZOOM_STEP, centre(whole), wideBounds);
    fireEvent.click(button('Zoom in'));
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(zoomedIn));
    expect(viewOf(container).w).toBeLessThan(whole.w);

    const twice = zoomAt(zoomedIn, ZOOM_STEP, centre(zoomedIn), wideBounds);
    fireEvent.click(button('Zoom in'));
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(twice));
    fireEvent.click(button('Zoom out'));
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(zoomAt(twice, 1 / ZOOM_STEP, centre(twice), wideBounds)));

    fireEvent.click(button('Reset view'));
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
  });

  it('a plain wheel over an unfocused graph changes nothing and is not prevented: the page scrolls (D100)', () => {
    const { container } = renderGraph();
    expect(fireEvent.wheel(graph(), { deltaY: -100 })).toBe(true);
    expect(fireEvent.wheel(svg(container), { deltaY: 100 })).toBe(true);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    // the listener is there: the same wheel with Ctrl zooms (review #11)
    expect(fireEvent.wheel(graph(), { deltaY: -100, ctrlKey: true })).toBe(false);
    expect(svg(container)).not.toHaveAttribute('viewBox', '0 0 1052 700');
  });

  it('leaves a wheel that zooms nothing to the page: a horizontal swipe, or one past a zoom limit (review #2)', () => {
    const { container } = renderGraph();
    graph().focus();
    expect(fireEvent.wheel(graph(), { deltaX: -120, deltaY: 0 })).toBe(true);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    // at either zoom limit, a wheel further that way is the page's scroll
    for (const deltaY of [1000, -1000]) {
      for (let i = 0; i < 30; i++) fireEvent.wheel(graph(), { deltaY });
      const v = svg(container).getAttribute('viewBox');
      expect(fireEvent.wheel(graph(), { deltaY })).toBe(true);
      expect(svg(container)).toHaveAttribute('viewBox', v);
    }
    expect(viewOf(container).w).toBe(160);
  });

  it('a wheel with Ctrl or ⌘ zooms (at the view centre while the svg has no size) and is prevented', () => {
    const { container } = renderGraph();
    expect(fireEvent.wheel(graph(), { deltaY: -100, ctrlKey: true })).toBe(false);
    const once = zoomAt(whole, wheelFactor(-100), centre(whole), wideBounds);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(once));

    expect(fireEvent.wheel(svg(container), { deltaY: -100, metaKey: true })).toBe(false);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(zoomAt(once, wheelFactor(-100), centre(once), wideBounds)));
  });

  it('a plain wheel zooms while focus is inside the graph (the container or a node link)', () => {
    const { container } = renderGraph();
    graph().focus();
    expect(fireEvent.wheel(graph(), { deltaY: -100 })).toBe(false);
    const once = zoomAt(whole, wheelFactor(-100), centre(whole), wideBounds);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(once));

    (container.querySelector('a[data-node="python"]') as HTMLElement).focus();
    expect(fireEvent.wheel(svg(container), { deltaY: -100 })).toBe(false);
    expect(viewOf(container).w).toBeLessThan(once.w);

    // focus elsewhere on the page: the wheel is the page's again
    button('List view').focus();
    const before = svg(container).getAttribute('viewBox');
    expect(fireEvent.wheel(graph(), { deltaY: -100 })).toBe(true);
    expect(svg(container)).toHaveAttribute('viewBox', before);
  });

  it('zooms at the cursor: the drawing point under it stays under it', () => {
    const { container } = renderGraph();
    sizeSvg(container, { left: 0, top: 100, width: 1052, height: 700 });
    fireEvent.wheel(graph(), { deltaY: -200, ctrlKey: true, clientX: 263, clientY: 275 });
    const p = { x: 263, y: 175 }; // the client point in drawing units at the whole view (1 unit = 1 px)
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(zoomAt(whole, wheelFactor(-200), p, wideBounds)));
    const v = viewOf(container);
    expect(v.x + (263 / 1052) * v.w).toBeCloseTo(p.x, 1);
    expect(v.y + (175 / 700) * v.h).toBeCloseTo(p.y, 1);
  });

  it('reads a line-mode wheel (Firefox) in pixels', () => {
    const { container } = renderGraph();
    fireEvent.wheel(graph(), { deltaY: -3, deltaMode: 1, ctrlKey: true });
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(zoomAt(whole, wheelFactor(-48), centre(whole), wideBounds)));
  });

  it('adds one non-passive wheel listener and removes it on unmount', () => {
    const add = jest.spyOn(HTMLDivElement.prototype, 'addEventListener');
    const remove = jest.spyOn(HTMLDivElement.prototype, 'removeEventListener');
    const { unmount } = renderGraph();
    // React's own root listeners are passive; ours is the one that may preventDefault
    const wheelAdds = add.mock.calls.filter(
      ([type, , opts]) => type === 'wheel' && (opts as AddEventListenerOptions)?.passive === false,
    );
    expect(wheelAdds).toHaveLength(1);
    expect(wheelAdds[0][0]).toBe('wheel');
    unmount();
    expect(remove.mock.calls.filter(([type, fn]) => type === 'wheel' && fn === wheelAdds[0][1])).toHaveLength(1);
    add.mockRestore();
    remove.mockRestore();
  });
});

describe('SkillGraph: keyboard and pointer pan (P5-04)', () => {
  it('the container is focusable and described by the instructions line', () => {
    renderGraph();
    expect(graph()).toHaveAttribute('tabindex', '0');
    expect(graph()).toHaveClass('focus-visible:outline-2');
    const help = document.getElementById(graph().getAttribute('aria-describedby')!)!;
    expect(help).toHaveTextContent(/^Arrow keys pan, plus and minus zoom/);
    expect(help).toHaveClass('print:hidden');
  });

  it('arrow keys pan by PAN_STEP of the view (and are prevented); + = - zoom and 0 resets', () => {
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    fireEvent.click(button('Zoom in'));
    let v = viewOf(container);
    const steps: [string, (v: View) => View][] = [
      ['ArrowRight', (w) => panBy(w, PAN_STEP * w.w, 0, wideBounds)],
      ['ArrowDown', (w) => panBy(w, 0, PAN_STEP * w.h, wideBounds)],
      ['ArrowLeft', (w) => panBy(w, -PAN_STEP * w.w, 0, wideBounds)],
      ['ArrowUp', (w) => panBy(w, 0, -PAN_STEP * w.h, wideBounds)],
      ['+', (w) => zoomAt(w, ZOOM_STEP, centre(w), wideBounds)],
      ['-', (w) => zoomAt(w, 1 / ZOOM_STEP, centre(w), wideBounds)],
      ['=', (w) => zoomAt(w, ZOOM_STEP, centre(w), wideBounds)],
    ];
    for (const [key, next] of steps) {
      const want = next(v);
      expect(want).not.toEqual(v);
      expect(fireEvent.keyDown(graph(), { key })).toBe(false);
      expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(want));
      v = viewOf(container);
    }
    fireEvent.keyDown(graph(), { key: '0' });
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
  });

  it('arrow keys pan from a node link too; with Ctrl, ⌘ or Alt they are the browser\'s', () => {
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    const v = viewOf(container);
    const a = container.querySelector('a[data-node="python"]')!;
    for (const mod of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      expect(fireEvent.keyDown(a, { key: 'ArrowRight', ...mod })).toBe(true);
      expect(fireEvent.keyDown(a, { key: '+', ...mod })).toBe(true);
    }
    expect(viewOf(container)).toEqual(v);
    expect(fireEvent.keyDown(a, { key: 'ArrowRight' })).toBe(false);
    expect(viewOf(container).x).toBeGreaterThan(v.x);
  });

  it('other keys pass through (Tab, Enter, letters), and so does an IME composition (review #7)', () => {
    renderGraph();
    for (const key of ['Tab', 'Enter', 'a', ' ']) expect(fireEvent.keyDown(graph(), { key })).toBe(true);
    expect(fireEvent.keyDown(graph(), { key: '-', isComposing: true })).toBe(true);
  });

  it('a pointer drag pans by the pointer delta in drawing units and captures the pointer', () => {
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    fireEvent.click(button('Zoom in'));
    const v = viewOf(container);
    sizeSvg(container, { left: 0, top: 0, width: 1052, height: 700 });
    const capture = jest.fn();
    (graph() as HTMLElement & { setPointerCapture?: (id: number) => void }).setPointerCapture = capture;
    const scale = v.w / 1052;

    fireEvent.pointerDown(graph(), { pointerId: 7, button: 0, clientX: 500, clientY: 300 });
    fireEvent.pointerMove(graph(), { pointerId: 7, clientX: 540, clientY: 330 });
    expect(capture).toHaveBeenCalledWith(7);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(panBy(v, -40 * scale, -30 * scale, wideBounds)));
    fireEvent.pointerMove(graph(), { pointerId: 7, clientX: 460, clientY: 280 });
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(panBy(v, 40 * scale, 20 * scale, wideBounds)));
    fireEvent.pointerUp(graph(), { pointerId: 7, clientX: 460, clientY: 280 });

    // released: moving again changes nothing
    const after = svg(container).getAttribute('viewBox');
    fireEvent.pointerMove(graph(), { pointerId: 7, clientX: 100, clientY: 100 });
    expect(svg(container)).toHaveAttribute('viewBox', after);
  });

  it('a click after a touch drag that had no click of its own still follows the node (review #5)', () => {
    jest.useFakeTimers();
    try {
      const { container } = renderGraph();
      fireEvent.click(button('Zoom in'));
      sizeSvg(container, { left: 0, top: 0, width: 1052, height: 700 });
      fireEvent.pointerDown(graph(), { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(graph(), { pointerId: 1, clientX: 160, clientY: 100 });
      fireEvent.pointerUp(graph(), { pointerId: 1, clientX: 160, clientY: 100 });
      act(() => jest.runOnlyPendingTimers());
      fireEvent.click(container.querySelector('a[data-node="python"]')!);
      expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
    } finally {
      jest.useRealTimers();
    }
  });

  it('a move under 4 px is not a drag: the view stays and a click still opens the row', () => {
    const { container } = renderGraph();
    sizeSvg(container, { left: 0, top: 0, width: 1052, height: 700 });
    const a = container.querySelector('a[data-node="python"]')!;
    fireEvent.pointerDown(a, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(a, { pointerId: 1, clientX: 102, clientY: 102 });
    fireEvent.pointerUp(a, { pointerId: 1, clientX: 102, clientY: 102 });
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    fireEvent.click(a);
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it('a drag that ends on a node does not follow it; the next plain click does', () => {
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    sizeSvg(container, { left: 0, top: 0, width: 1052, height: 700 });
    const a = container.querySelector('a[data-node="python"]')!;
    fireEvent.pointerDown(a, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(a, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(a, { pointerId: 1, clientX: 140, clientY: 100 });
    expect(fireEvent.click(a)).toBe(false);
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
    expect(window.location.hash).toBe('');

    fireEvent.pointerDown(a, { pointerId: 1, button: 0, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(a, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.click(a);
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it('pointercancel and lostpointercapture end a drag; a secondary button never starts one', () => {
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    sizeSvg(container, { left: 0, top: 0, width: 1052, height: 700 });
    const v = svg(container).getAttribute('viewBox');
    for (const end of [fireEvent.pointerCancel, fireEvent.lostPointerCapture]) {
      fireEvent.pointerDown(graph(), { pointerId: 2, button: 0, clientX: 100, clientY: 100 });
      end(graph(), { pointerId: 2 });
      fireEvent.pointerMove(graph(), { pointerId: 2, clientX: 200, clientY: 200 });
      expect(svg(container)).toHaveAttribute('viewBox', v);
    }
    fireEvent.pointerDown(graph(), { pointerId: 3, button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(graph(), { pointerId: 3, clientX: 200, clientY: 200 });
    expect(svg(container)).toHaveAttribute('viewBox', v);
  });

  it('without a size (jsdom) a drag skips the pan: never a NaN viewBox', () => {
    const { container } = renderGraph();
    fireEvent.pointerDown(graph(), { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(graph(), { pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(graph(), { pointerId: 1, clientX: 200, clientY: 200 });
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
  });

  it('hides the zoom controls and the instructions while the list view is on', () => {
    renderGraph();
    fireEvent.click(listToggle());
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset view' })).toBeNull();
    expect(document.getElementById('skill-graph-help')).toHaveClass('hidden');
    fireEvent.click(listToggle());
    expect(button('Zoom in')).toBeInTheDocument();
  });

  it('the controls are 44 px targets at every width (review #4)', () => {
    renderGraph();
    for (const name of ['Zoom in', 'Zoom out']) expect(button(name)).toHaveClass('size-11');
    for (const name of ['Reset view', 'List view']) expect(button(name)).toHaveClass('min-h-11');
    for (const name of ['Zoom in', 'Zoom out', 'Reset view', 'List view']) {
      expect(button(name).className).not.toMatch(/sm:(size|min-h)-/);
    }
  });

  it('the zoom controls never print', () => {
    renderGraph();
    expect(button('Zoom in').closest('.print\\:hidden')).not.toBeNull();
  });
});

describe('SkillGraph: below 640 px (P5-04, D102)', () => {
  useViewportMock();
  const first = fitCluster(narrow, 'agentic', NARROW_ASPECT);
  const chips = () => screen.getByRole('group', { name: 'Jump to a group' });

  it('starts on the first cluster at the narrow aspect (4 4 348 308)', () => {
    width = 390;
    const { container } = renderGraph();
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(first));
    expect(svg(container)).toHaveAttribute('viewBox', '4 4 348 308');
    expect(svg(container).getAttribute('style')).toMatch(/aspect-ratio: 348 \/ 308/);
  });

  it('has a row of cluster chips, flex below sm and hidden from it, the one under the view centre pressed', () => {
    width = 390;
    renderGraph();
    expect(chips()).toHaveClass('flex', 'sm:hidden', 'overflow-x-auto');
    const buttons = within(chips()).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(clusters.map((c) => c.name));
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(
      clusters.map((c) => String(c.id === 'agentic')),
    );
  });

  it('a chip click fits its cluster and moves aria-pressed; Reset view goes back to the first cluster', () => {
    width = 390;
    const { container } = renderGraph();
    fireEvent.click(within(chips()).getByRole('button', { name: 'Data & integration' }));
    const data = fitCluster(narrow, 'data', NARROW_ASPECT);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(data));
    expect(clusterAt(narrow, centre(data))).toBe('data');
    expect(within(chips()).getByRole('button', { name: 'Data & integration' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(chips()).getByRole('button', { name: 'Agentic systems' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button('Reset view'));
    expect(svg(container)).toHaveAttribute('viewBox', '4 4 348 308');
  });

  it('presses no chip when the view centre is in a gap between clusters', () => {
    width = 390;
    renderGraph();
    // the agentic fit, panned down five steps: its centre sits in the 24-unit gap under the first row (y 300 to 324)
    let v = first;
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(graph(), { key: 'ArrowDown' });
      v = panBy(v, 0, PAN_STEP * v.h, narrowBounds);
    }
    expect(clusterAt(narrow, centre(v))).toBeNull();
    within(chips())
      .getAllByRole('button')
      .forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
  });

  it('Tab onto a node outside the view centres it', () => {
    width = 390;
    const { container } = renderGraph();
    const p = narrow.nodes['docker-compose'];
    fireEvent.focus(container.querySelector('a[data-node="docker-compose"]')!);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(centerOn(first, p, narrowBounds)));

    // a node already in view leaves the view where it is
    const before = svg(container).getAttribute('viewBox');
    fireEvent.focus(container.querySelector('a[data-node="git"]')!);
    expect(svg(container)).toHaveAttribute('viewBox', before);
  });

  it('the chip row leaves with the zoom controls while the list view is on; its padding keeps focus rings whole', () => {
    width = 390;
    renderGraph();
    expect(chips()).toHaveClass('p-1');
    fireEvent.click(listToggle());
    expect(screen.queryByRole('group', { name: 'Jump to a group' })).toBeNull();
  });

  it('the wheel zooms within the bounds of the layout on screen after a viewport change (review #9)', () => {
    width = 1280;
    const { container } = renderGraph();
    fireViewport(390);
    fireEvent.wheel(graph(), { deltaY: -100, ctrlKey: true });
    expect(svg(container)).toHaveAttribute(
      'viewBox',
      viewBoxFor(zoomAt(first, wheelFactor(-100), centre(first), narrowBounds)),
    );
  });

  it('a drag from a node outside the view pans from the view on screen; pointer focus does not centre it (review #1)', () => {
    width = 390;
    const { container } = renderGraph();
    sizeSvg(container, { left: 0, top: 0, width: 358, height: 317 });
    const v = viewOf(container);
    const a = container.querySelector('a[data-node="typescript"]')!; // outside the first view
    fireEvent.pointerDown(a, { pointerId: 1, button: 0, clientX: 200, clientY: 300 });
    fireEvent.focus(a); // the browser focuses a pressed link
    expect(viewOf(container)).toEqual(v);
    fireEvent.pointerMove(a, { pointerId: 1, clientX: 160, clientY: 300 });
    fireEvent.pointerUp(a, { pointerId: 1, clientX: 160, clientY: 300 });
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(panBy(v, 40 * (v.w / 358), 0, narrowBounds)));
  });

  it('a viewport change resets the view: whole drawing from 640, the first cluster below', () => {
    width = 390;
    const { container } = renderGraph();
    fireEvent.click(button('Zoom in'));
    fireViewport(800);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(fitAll(narrow, narrow.height / narrow.width)));
    fireViewport(1280);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    fireViewport(390);
    expect(svg(container)).toHaveAttribute('viewBox', '4 4 348 308');
  });
});

describe('SkillGraph: the list view (P5-03, D101)', () => {
  it('a List view toggle shows the list and hides the graph, and back; focus stays on it', () => {
    renderGraph();
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
    expect(graph()).not.toHaveClass('hidden');

    listToggle().focus();
    fireEvent.click(listToggle());
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(list()).toHaveClass('block');
    expect(list()).not.toHaveClass('hidden');
    expect(document.querySelector('[aria-labelledby="skill-graph-title"]')).toHaveClass('hidden');
    expect(listToggle()).toHaveFocus();

    fireEvent.click(listToggle());
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
    expect(list()).toHaveClass('hidden', 'print:block');
    // never the hidden attribute: preflight's [hidden] is display:none !important, and print must show the list
    expect(list()).not.toHaveAttribute('hidden');
  });

  it('lists every node under its cluster <h2> as <dt id="skill-<id>"> with weight, since and its projects', () => {
    renderGraph();
    for (const c of clusters) {
      const h2 = within(list()).getByRole('heading', { level: 2, name: c.name });
      const dl = h2.nextElementSibling!;
      expect(dl.tagName).toBe('DL');
      const dts = Array.from(dl.querySelectorAll('dt'));
      const members = nodes.filter((n) => n.cluster === c.id);
      expect(dts.map((dt) => dt.textContent)).toEqual(members.map((n) => n.name));
      expect(dts.map((dt) => dt.id)).toEqual(members.map((n) => `skill-${n.id}`));
      dts.forEach((dt) => {
        expect(dt).toHaveAttribute('tabindex', '-1');
        // focused by script after a mouse click too, where :focus-visible may not match (review #5)
        expect(dt).toHaveClass('focus:outline-2', 'focus:outline-[var(--color-accent)]');
      });
    }
  });

  it('describes a row as weight word · since · Used in (project links) or From my roles', () => {
    renderGraph();
    const dd = (id: string) => document.getElementById(`skill-${id}`)!.nextElementSibling as HTMLElement;

    // harness-engineering: core, since 2026, used by agent-harness
    expect(dd('harness-engineering').textContent).toMatch(/^Core · since 2026 · Used in: .*Agent Harness/);
    const link = within(dd('harness-engineering')).getByRole('link', { name: 'Agent Harness' });
    expect(link).toHaveAttribute('href', '/projects/agent-harness');

    const word = { 3: 'Core', 2: 'Regular', 1: 'Occasional' } as const;
    for (const n of nodes) {
      const text = dd(n.id).textContent!;
      expect(text.startsWith(word[n.weight])).toBe(true);
      expect(text.includes(`since ${n.since}`)).toBe(Boolean(n.since));
      const used = edges.filter((e) => e.from === n.id && e.to.startsWith('project:'));
      if (used.length === 0) expect(text).toMatch(/· From my roles$/);
      else expect(within(dd(n.id)).getAllByRole('link')).toHaveLength(used.length);
    }
  });

  it('a node click opens the list, focuses its row and sets the hash', () => {
    const { container } = renderGraph();
    const a = container.querySelector('a[data-node="claude-code"]')!;
    fireEvent.click(a);
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('skill-claude-code')).toHaveFocus();
    expect(window.location.hash).toBe('#skill-claude-code');
  });

  it('opens the list at the row when the page loads with #skill-<id>', () => {
    window.history.replaceState(null, '', '/skills#skill-python');
    renderGraph();
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('skill-python')).toHaveFocus();
  });

  it('opens the list when a link on the page sets #skill-<id> (hashchange)', () => {
    renderGraph();
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
    act(() => {
      window.history.replaceState(null, '', '/skills#skill-docker-compose');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(listToggle()).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('skill-docker-compose')).toHaveFocus();
  });

  it('moves focus on a hashchange while the list is open, and the toggle keeps focus afterwards (review #1)', () => {
    renderGraph();
    fireEvent.click(listToggle());
    act(() => {
      window.history.replaceState(null, '', '/skills#skill-bash');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(document.getElementById('skill-bash')).toHaveFocus();

    act(() => {
      window.history.replaceState(null, '', '/skills#skill-sql');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(document.getElementById('skill-sql')).toHaveFocus();

    // off and on again: no stale row steals focus from the toggle
    listToggle().focus();
    fireEvent.click(listToggle());
    fireEvent.click(listToggle());
    expect(listToggle()).toHaveFocus();
  });

  it('a node click clears its hover, so toggling back draws no stale cross edges (review #4)', () => {
    const { container } = renderGraph();
    const a = container.querySelector(`a[data-node="${hub.id}"]`)!;
    fireEvent.mouseEnter(a);
    fireEvent.click(a);
    fireEvent.click(listToggle());
    expect(container.querySelector(`a[data-node="${hub.id}"]`)).not.toHaveAttribute('data-hover');
    expect(svg(container).querySelectorAll('path[data-cross]')).toHaveLength(0);
  });

  it('leaves a modified click to the browser (new tab, review #11)', () => {
    const { container } = renderGraph();
    const a = container.querySelector('a[data-node="python"]')!;
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }]) {
      expect(fireEvent.click(a, init)).toBe(true); // not defaultPrevented
    }
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('survives a malformed hash (review #3)', () => {
    window.history.replaceState(null, '', '/skills#skill-%E0');
    expect(() => renderGraph()).not.toThrow();
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('ignores a hash that is not a node', () => {
    window.history.replaceState(null, '', '/skills#skill-cobol');
    renderGraph();
    expect(listToggle()).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SkillGraph: its bundle (review #12)', () => {
  it('imports no data module at runtime: only types from @/lib/data/*', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/skills/SkillGraph.tsx'), 'utf8');
    const dataImports = src.split('\n').filter((l) => /^import .*from '@\/lib\/data/.test(l));
    expect(dataImports.length).toBeGreaterThan(0);
    dataImports.forEach((l) => expect(l).toMatch(/^import type /));
  });
});

describe('SkillGraph: project chips (P5-05)', () => {
  const featured = [...projects].filter((p) => p.featured).sort((a, b) => a.order - b.order);
  const chipRow = () => screen.getByRole('group', { name: "Highlight a project's stack" });
  const chip = (name: string) => within(chipRow()).getByRole('button', { name });
  const nodeLinks = (c: HTMLElement) => Array.from(c.querySelectorAll('a[data-node]'));
  const activeIds = (c: HTMLElement) =>
    nodeLinks(c)
      .filter((a) => a.getAttribute('data-active') === 'true')
      .map((a) => a.getAttribute('data-node'));
  const harness = nodesOf(edges, 'agent-harness');
  const chainCross = (slug: string) =>
    projectChain(wide, nodesOf(edges, slug)).filter(([a, b]) => wide.nodes[a].cluster !== wide.nodes[b].cluster);
  const live = () => document.querySelector('[aria-live="polite"]')!;

  it('has a chip per featured project, in order, each aria-pressed false; the row never prints', () => {
    renderGraph();
    const chips = within(chipRow()).getAllByRole('button');
    expect(chips.map((b) => b.textContent)).toEqual(featured.map((p) => p.title));
    expect(chips[0]).toHaveTextContent('Agent Harness');
    chips.forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
    expect(chipRow()).toHaveClass('overflow-x-auto');
    expect(chipRow().parentElement).toHaveClass('print:hidden');
  });

  it('sits above the graph and the zoom controls', () => {
    renderGraph();
    const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(chipRow(), button('Zoom in'))).toBe(true);
    expect(follows(chipRow(), graph())).toBe(true);
  });

  it("selecting one marks its nodes data-active and dims every other node and edge", () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'true');
    expect(activeIds(container).sort()).toEqual([...harness].sort());
    expect(harness.length).toBeGreaterThanOrEqual(3);
    for (const a of nodeLinks(container)) {
      const on = harness.includes(a.getAttribute('data-node')!);
      expect(a.getAttribute('data-active')).toBe(on ? 'true' : null);
      expect(a.getAttribute('data-dim')).toBe(on ? null : 'true');
    }
    // an intra edge is the project's when both its ends are; every other edge is dimmed
    for (const e of intra) {
      const path = Array.from(svg(container).querySelectorAll('path[data-edge]:not([data-cross])')).find(
        (p) => p.getAttribute('d') === e.d,
      )!;
      const on = harness.includes(e.from) && harness.includes(e.to);
      expect(path.getAttribute('data-active')).toBe(on ? 'true' : null);
      expect(path.getAttribute('data-dim')).toBe(on ? null : 'true');
    }
  });

  it("draws the project's cross-cluster chain as data-active paths", () => {
    const { container } = renderGraph();
    expect(svg(container).querySelectorAll('path[data-cross]')).toHaveLength(0);
    fireEvent.click(chip('Agent Harness'));
    const drawn = Array.from(svg(container).querySelectorAll('path[data-cross][data-active="true"]'));
    const want = chainCross('agent-harness');
    expect(want.length).toBeGreaterThan(0);
    expect(drawn.map((p) => p.getAttribute('d'))).toEqual(want.map(([a, b]) => curvePath(wide.nodes[a], wide.nodes[b])));
  });

  it('shows "<title> · N skills" and an Open case study link, and announces it politely', () => {
    renderGraph();
    expect(screen.queryByRole('link', { name: 'Open case study' })).toBeNull();
    expect(live()).toHaveClass('sr-only');
    expect(live().textContent).toBe('');
    fireEvent.click(chip('Agent Harness'));
    expect(screen.getByRole('link', { name: 'Open case study' })).toHaveAttribute('href', '/projects/agent-harness');
    expect(screen.getByText(`Agent Harness · ${harness.length} skills`)).toBeInTheDocument();
    expect(live().textContent).toBe(`Agent Harness: ${harness.length} skills highlighted.`);
  });

  it('a second click on the chip clears everything; another chip switches', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    fireEvent.click(chip('Voice Concierge'));
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('Voice Concierge')).toHaveAttribute('aria-pressed', 'true');
    expect(activeIds(container).sort()).toEqual([...nodesOf(edges, 'voice-concierge')].sort());
    expect(screen.getByRole('link', { name: 'Open case study' })).toHaveAttribute('href', '/projects/voice-concierge');

    fireEvent.click(chip('Voice Concierge'));
    expect(chip('Voice Concierge')).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('[data-active], [data-dim]')).toHaveLength(0);
    expect(svg(container).querySelectorAll('path[data-cross]')).toHaveLength(0);
    expect(screen.queryByRole('link', { name: 'Open case study' })).toBeNull();
    expect(live().textContent).toBe('Highlight cleared.');
  });

  it('Esc clears the selection (prevented); with nothing selected it passes through', () => {
    const { container } = renderGraph();
    const a = container.querySelector('a[data-node="python"]')!;
    expect(fireEvent.keyDown(a, { key: 'Escape' })).toBe(true);

    fireEvent.click(chip('Agent Harness'));
    fireEvent.focus(a);
    expect(fireEvent.keyDown(a, { key: 'Escape' })).toBe(false);
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('[data-active], [data-dim], [data-hover]')).toHaveLength(0);

    // from a chip too
    fireEvent.click(chip('HitList'));
    expect(fireEvent.keyDown(chip('HitList'), { key: 'Escape' })).toBe(false);
    expect(chip('HitList')).toHaveAttribute('aria-pressed', 'false');
  });

  it('in the list view Esc is not the graph\'s: it passes through and the selection stays (review #2)', () => {
    renderGraph();
    fireEvent.click(chip('Agent Harness'));
    fireEvent.click(listToggle());
    expect(fireEvent.keyDown(document.getElementById('skill-python')!, { key: 'Escape' })).toBe(true);
    fireEvent.click(listToggle());
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'true');
  });

  it('announces a switch and a clear, not only a selection (review #3)', () => {
    renderGraph();
    fireEvent.click(chip('Agent Harness'));
    fireEvent.click(chip('Voice Concierge'));
    expect(live().textContent).toBe(`Voice Concierge: ${nodesOf(edges, 'voice-concierge').length} skills highlighted.`);
    fireEvent.keyDown(chip('Voice Concierge'), { key: 'Escape' });
    expect(live().textContent).toBe('Highlight cleared.');
    fireEvent.click(chip('Agent Harness'));
    expect(live().textContent).toBe(`Agent Harness: ${harness.length} skills highlighted.`);
  });

  it('says "1 skill" for a project with one node (review #5)', () => {
    const one = [{ slug: 'solo', title: 'Solo', featured: true, order: 1 }];
    render(
      <SkillGraph clusters={clusters} nodes={nodes} edges={[...edges, { from: 'python', to: 'project:solo' }]} projects={one} />,
    );
    fireEvent.click(chip('Solo'));
    expect(screen.getByText('Solo · 1 skill')).toBeInTheDocument();
    expect(live().textContent).toBe('Solo: 1 skill highlighted.');
  });

  it('a hover with a project selected adds the node\'s cross edges and keeps the selection', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    const before = activeIds(container);
    const a = container.querySelector(`a[data-node="${hub.id}"]`)!;
    fireEvent.mouseEnter(a);
    expect(a).toHaveAttribute('data-hover', 'true');
    expect(svg(container).querySelectorAll('path[data-cross][data-hover="true"]')).toHaveLength(crossOf(hub.id).length);
    expect(activeIds(container)).toEqual(before);
    fireEvent.mouseLeave(a);
    expect(svg(container).querySelectorAll('path[data-cross][data-hover="true"]')).toHaveLength(0);
    expect(activeIds(container)).toEqual(before);
    expect(svg(container).querySelectorAll('path[data-cross][data-active="true"]')).toHaveLength(
      chainCross('agent-harness').length,
    );
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'true');
  });

  it('a dimmed node shows at full opacity while hovered or focused', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    const dimmed = nodeLinks(container).find((a) => a.getAttribute('data-dim') === 'true')!;
    expect(dimmed.getAttribute('class')).toMatch(/(^| )opacity-25( |$)/);
    expect(dimmed.getAttribute('class')).toMatch(/focus-visible:opacity-100/);
    fireEvent.mouseEnter(dimmed);
    expect(dimmed).toHaveAttribute('data-dim', 'true');
    expect(dimmed.getAttribute('class')).not.toMatch(/(^| )opacity-25( |$)/);
    fireEvent.mouseLeave(dimmed);
    // keyboard focus sets the hover too, so the class goes the same way
    fireEvent.focus(dimmed);
    expect(dimmed).toHaveAttribute('data-dim', 'true');
    expect(dimmed.getAttribute('class')).not.toMatch(/(^| )opacity-25( |$)/);
  });

  it('fades highlight changes only under motion-safe: (no bare transition on nodes or edges)', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    const els = [...nodeLinks(container), ...Array.from(svg(container).querySelectorAll('path'))];
    for (const el of els) {
      const classes = (el.getAttribute('class') ?? '').split(/\s+/);
      expect(classes.filter((c) => /transition/.test(c) && !c.startsWith('motion-safe:'))).toEqual([]);
    }
    expect(nodeLinks(container)[0].getAttribute('class')).toMatch(/motion-safe:transition-opacity/);
  });

  it('the chips leave with the zoom controls while the list view is on, and the selection comes back', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('Agent Harness'));
    fireEvent.click(listToggle());
    expect(screen.queryByRole('group', { name: "Highlight a project's stack" })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open case study' })).toBeNull();
    fireEvent.click(listToggle());
    expect(chip('Agent Harness')).toHaveAttribute('aria-pressed', 'true');
    expect(activeIds(container).length).toBe(harness.length);
  });

  it('never moves the view from 640 px up', () => {
    const { container } = renderGraph();
    fireEvent.click(chip('React Native Paint Estimator'));
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
  });
});

describe('SkillGraph: project chips below 640 px (P5-05)', () => {
  useViewportMock();
  const first = fitCluster(narrow, 'agentic', NARROW_ASPECT);
  const chip = (name: string) =>
    within(screen.getByRole('group', { name: "Highlight a project's stack" })).getByRole('button', { name });
  const inView = (v: View, slug: string) => nodesOf(edges, slug).some((id) => contains(v, narrow.nodes[id]));

  it("moves the view to the chain's first cluster when none of the project's nodes is in view", () => {
    width = 390;
    const { container } = renderGraph();
    // home-media-server: none of its nodes is in the agentic cluster
    expect(inView(first, 'home-media-server')).toBe(false);
    fireEvent.click(chip('Self-hosted music library & DJ crate pipeline'));
    const [head] = projectChain(narrow, nodesOf(edges, 'home-media-server'))[0];
    const want = fitCluster(narrow, narrow.nodes[head].cluster, first.h / first.w);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(want));
    expect(inView(want, 'home-media-server')).toBe(true);
  });

  it('leaves the view alone when one of its nodes is already in view', () => {
    width = 390;
    const { container } = renderGraph();
    expect(inView(first, 'agent-harness')).toBe(true);
    fireEvent.click(chip('Agent Harness'));
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(first));
  });

  it('counts a node as in view only when its whole cell is, as Tab does (review #4)', () => {
    width = 390;
    const p = narrow.nodes['python'];
    const py = [{ slug: 'py', title: 'Py', featured: true, order: 1 }];
    const { container } = render(
      <SkillGraph clusters={clusters} nodes={nodes} edges={[...edges, { from: 'python', to: 'project:py' }]} projects={py} />,
    );
    // ArrowRight until python's centre is inside the view but its cell is still cut off at the right edge
    let at = first;
    while (!contains(at, p)) {
      fireEvent.keyDown(graph(), { key: 'ArrowRight' });
      at = panBy(at, PAN_STEP * at.w, 0, narrowBounds);
    }
    expect(contains(at, { x: p.box.x + p.box.w, y: p.box.y + p.box.h })).toBe(false);
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(at));
    fireEvent.click(chip('Py'));
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(fitCluster(narrow, p.cluster, at.h / at.w)));
  });
});
