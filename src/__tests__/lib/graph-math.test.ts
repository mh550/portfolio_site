import { clusters, nodes, edges } from '@/lib/data/skills';
import type { Cluster, SkillNode } from '@/lib/data/skills';
import {
  layoutGraph,
  labelLines,
  curvePath,
  edgePaths,
  projectChain,
  clusterAt,
  columnsFor,
  LABEL_DY,
  NARROW_ASPECT,
  type Rect,
} from '@/lib/graph/layout';
import {
  viewBoxFor,
  clampView,
  zoomAt,
  panBy,
  fitCluster,
  fitAll,
  centerOn,
  clientToDrawing,
  contains,
  wheelFactor,
  type View,
} from '@/lib/graph/view';

// The pure layout and view math behind /skills (P5-02; plan § Layout, § Math)
const data = { clusters, nodes, edges };
const wide = layoutGraph(data, 1280);
const narrow = layoutGraph(data, 390);
const PHONE = 308 / 348; // the first cluster's fit, h / w (plan § Layout 390)

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('layoutGraph', () => {
  it('is deterministic', () => {
    expect(layoutGraph(data, 1280)).toEqual(wide);
    expect(layoutGraph(data, 390)).toEqual(narrow);
  });

  it('exports the column rule and the phone aspect (a 284-unit cluster ± 12)', () => {
    expect([columnsFor(1024), columnsFor(1023), columnsFor(390)]).toEqual([3, 2, 2]);
    expect(NARROW_ASPECT).toBe(PHONE);
  });

  it('lays three columns from 1024 px and two below, at the plan\'s bounds', () => {
    expect([wide.columns, wide.width, wide.height]).toEqual([3, 1052, 700]);
    expect([narrow.columns, narrow.width, narrow.height]).toEqual([2, 704, 1008]);
    expect(layoutGraph(data, 1024).columns).toBe(3);
    expect(layoutGraph(data, 1023).columns).toBe(2);
  });

  it('places the clusters at the plan\'s rects', () => {
    const rects = (l: typeof wide) => l.clusters.map(({ id, x, y, w, h }) => [id, x, y, w, h]);
    expect(rects(wide)).toEqual([
      ['agentic', 16, 16, 324, 284], ['languages', 364, 16, 324, 284], ['web', 712, 16, 324, 284],
      ['data', 16, 324, 324, 360], ['infra', 364, 324, 324, 284], ['process', 712, 324, 324, 284],
    ]);
    expect(rects(narrow)).toEqual([
      ['agentic', 16, 16, 324, 284], ['languages', 364, 16, 324, 284], ['web', 16, 324, 324, 284],
      ['data', 364, 324, 324, 360], ['infra', 16, 708, 324, 284], ['process', 364, 708, 324, 284],
    ]);
    expect(wide.clusters.map((c) => c.name)).toEqual(clusters.map((c) => c.name));
  });

  it('places every node, in cluster and drawing order', () => {
    const order = clusters.flatMap((c) => nodes.filter((n) => n.cluster === c.id).map((n) => n.id));
    expect(Object.keys(wide.nodes)).toEqual(order);
  });

  it.each([1280, 390])('keeps every node box inside its cluster and apart from its peers at %i', (width) => {
    const layout = layoutGraph(data, width);
    for (const c of layout.clusters) {
      const boxes = Object.values(layout.nodes).filter((n) => n.cluster === c.id).map((n) => n.box);
      for (const box of boxes) expect(inside(box, c)).toBe(true);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it('carries each node\'s name and weight, and label baselines under its mark inside its box', () => {
    for (const n of nodes) {
      const p = wide.nodes[n.id];
      expect([p.name, p.weight]).toEqual([n.name, n.weight]);
      expect(LABEL_DY).toEqual([30, 44]);
      for (const dy of LABEL_DY) expect(p.y + dy).toBeLessThanOrEqual(p.box.y + p.box.h);
    }
  });

  it('gives each node its weight\'s mark size and its point inside its box', () => {
    for (const n of nodes) {
      const p = wide.nodes[n.id];
      expect(p.size).toBe({ 3: 28, 2: 24, 1: 20 }[n.weight]);
      // a weight-3 mark around the point still fits the box
      expect(inside({ x: p.x - 14, y: p.y - 14, w: 28, h: 28 }, p.box)).toBe(true);
      expect(p.lines).toEqual(labelLines(n.name));
    }
  });

  it('puts the first node of a cluster in the first cell and centres a short last row', () => {
    const harness = wide.nodes['harness-engineering'];
    expect([harness.x, harness.y]).toEqual([16 + 6 + 52, 16 + 44 + 22]);
    // languages: 7 nodes, so C++ is alone in row 3, in the middle cell
    const cpp = wide.nodes.cpp;
    expect([cpp.x, cpp.y]).toEqual([364 + 6 + 104 + 52, 16 + 44 + 2 * 76 + 22]);
    // data: 11 nodes, so Pipedream and Zapier share row 4, shifted by half a cell
    expect([wide.nodes.pipedream.x, wide.nodes.zapier.x]).toEqual([16 + 6 + 52 + 52, 16 + 6 + 104 + 52 + 52]);
  });

  it('skips a node whose cluster is missing', () => {
    const stray: SkillNode = { id: 'stray', name: 'Stray', cluster: 'web', weight: 1 };
    const only: Cluster[] = clusters.filter((c) => c.id !== 'web');
    const layout = layoutGraph({ clusters: only, nodes: [...nodes, stray], edges: [] }, 1280);
    expect(layout.nodes.stray).toBeUndefined();
    expect(layout.clusters).toHaveLength(5);
  });
});

describe('labelLines', () => {
  it('keeps a short name on one line', () => {
    expect(labelLines('TypeScript')).toEqual(['TypeScript']);
    expect(labelLines('Self-hosted')).toEqual(['Self-hosted']);
  });

  it('splits at the last space that keeps both lines within 16', () => {
    expect(labelLines('Multi-tenant architecture')).toEqual(['Multi-tenant', 'architecture']);
    expect(labelLines('Specs & decision ledgers')).toEqual(['Specs & decision', 'ledgers']);
    expect(labelLines('Self-hosted infrastructure')).toEqual(['Self-hosted', 'infrastructure']);
  });

  it('honours a smaller max', () => {
    expect(labelLines('Agent memory', 6)).toEqual(['Agent', 'memory']);
  });

  it('leaves a name with no space that fits on one line, however long', () => {
    expect(labelLines('Supercalifragilistic')).toEqual(['Supercalifragilistic']);
  });
});

describe('curvePath', () => {
  it('is an M … C … path with six control numbers', () => {
    expect(curvePath({ x: 0, y: 0 }, { x: 90, y: 30 })).toMatch(/^M [\d.-]+ [\d.-]+ C( [\d.-]+){6}$/);
  });

  it('puts the controls at a third and two thirds of the chord, bent along its normal', () => {
    // chord (90, 0): normal (0, 90) × 0.2 = (0, 18)
    expect(curvePath({ x: 0, y: 0 }, { x: 90, y: 0 })).toBe('M 0 0 C 30 18 60 18 90 0');
    expect(curvePath({ x: 0, y: 0 }, { x: 90, y: 0 }, 0)).toBe('M 0 0 C 30 0 60 0 90 0');
  });

  it('rounds to 0.1', () => {
    expect(curvePath({ x: 0.04, y: 0 }, { x: 10, y: 0 }, 0)).toBe('M 0 0 C 3.4 0 6.7 0 10 0');
  });
});

describe('edgePaths', () => {
  const paths = edgePaths(wide, edges);

  it('draws every node ↔ node edge and skips the project ones', () => {
    expect(paths).toHaveLength(edges.filter((e) => !e.to.startsWith('project:')).length);
    expect(paths.every((p) => /^M /.test(p.d))).toBe(true);
  });

  it('marks the cross-cluster edges', () => {
    const cross = (from: string, to: string) => paths.find((p) => p.from === from && p.to === to)?.cross;
    expect(cross('claude-code', 'harness-engineering')).toBe(false);
    expect(cross('bash', 'harness-engineering')).toBe(true);
    expect(paths.filter((p) => !p.cross)).toHaveLength(29);
    expect(paths.filter((p) => p.cross)).toHaveLength(14);
  });

  it('carries an edge label through', () => {
    expect(paths.find((p) => p.from === 'zapier')?.label).toBe('moved from');
  });

  it('skips an edge to an unknown node', () => {
    expect(edgePaths(wide, [{ from: 'react', to: 'nowhere' }])).toEqual([]);
  });
});

describe('projectChain', () => {
  const projectNodes = (slug: string) => edges.filter((e) => e.to === `project:${slug}`).map((e) => e.from);
  const clusterOf = (id: string) => wide.nodes[id].cluster;

  it.each(['agent-harness', 'voice-concierge', 'ghl-jobtread-integration', 'home-media-server', 'hit-list'])(
    'joins %s in cluster order, crossing k − 1 times for k clusters',
    (slug) => {
      const ids = projectNodes(slug);
      const chain = projectChain(wide, ids);
      expect(chain).toHaveLength(ids.length - 1);
      const k = new Set(ids.map(clusterOf)).size;
      expect(chain.filter(([a, b]) => clusterOf(a) !== clusterOf(b))).toHaveLength(k - 1);
    },
  );

  it('orders by cluster, then drawing order, whatever the input order', () => {
    expect(projectChain(wide, ['git', 'bash', 'harness-engineering', 'claude-code'])).toEqual([
      ['harness-engineering', 'claude-code'], ['claude-code', 'bash'], ['bash', 'git'],
    ]);
  });

  it('drops unknown ids and gives nothing for fewer than two nodes', () => {
    expect(projectChain(wide, ['react', 'nowhere'])).toEqual([]);
    expect(projectChain(wide, [])).toEqual([]);
  });
});

describe('clusterAt', () => {
  // In a gap between clusters no chip is pressed (the 390 chip row, P5-04)
  it('finds the cluster under a point, or none in a gap', () => {
    expect(clusterAt(narrow, { x: 100, y: 100 })).toBe('agentic');
    expect(clusterAt(narrow, { x: 500, y: 600 })).toBe('data');
    expect(clusterAt(narrow, { x: 352, y: 100 })).toBeNull();
  });
});

describe('view math', () => {
  const bounds = { w: wide.width, h: wide.height };
  const PAD = 24;

  it('formats a viewBox rounded to 0.01', () => {
    expect(viewBoxFor({ x: 4, y: 4.004, w: 348.1234, h: 308 })).toBe('4 4 348.12 308');
  });

  describe('clampView', () => {
    // Views of every size and place, at the wide and phone aspects
    const views: View[] = [];
    for (const aspect of [700 / 1052, PHONE, 2]) {
      for (const w of [10, 160, 400, 1100, 5000]) {
        for (const x of [-900, -24, 300, 2000]) for (const y of [-900, 0, 650, 3000]) views.push({ x, y, w, h: w * aspect });
      }
    }

    it.each([[bounds], [{ w: narrow.width, h: narrow.height }]])('never shows beyond the padded drawing (%o)', (b) => {
      for (const v of views) {
        const c = clampView(v, b);
        expect(c.h / c.w).toBeCloseTo(v.h / v.w, 9);
        expect(c.w).toBeGreaterThanOrEqual(160);
        // on each axis: inside bounds ± pad, or centred when the view is larger than the padded drawing
        if (c.w <= b.w + 2 * PAD) {
          expect(c.x).toBeGreaterThanOrEqual(-PAD - 1e-9);
          expect(c.x + c.w).toBeLessThanOrEqual(b.w + PAD + 1e-9);
        } else expect(c.x + c.w / 2).toBeCloseTo(b.w / 2, 9);
        if (c.h <= b.h + 2 * PAD) {
          expect(c.y).toBeGreaterThanOrEqual(-PAD - 1e-9);
          expect(c.y + c.h).toBeLessThanOrEqual(b.h + PAD + 1e-9);
        } else expect(c.y + c.h / 2).toBeCloseTo(b.h / 2, 9);
        // one axis always fits: the drawing can be zoomed out to whole, never further
        expect(c.w <= b.w + 2 * PAD + 1e-9 || c.h <= b.h + 2 * PAD + 1e-9).toBe(true);
      }
    });

    it('lets a tall phone view zoom out until the whole drawing shows', () => {
      const c = clampView({ x: 0, y: 0, w: 99999, h: 99999 * PHONE }, { w: narrow.width, h: narrow.height });
      expect(c.h).toBeCloseTo(narrow.height + 2 * PAD, 9);
      expect(c.w).toBeGreaterThan(narrow.width + 2 * PAD);
    });

    it('leaves a view that already fits alone', () => {
      const v = { x: 100, y: 50, w: 400, h: 300 };
      expect(clampView(v, bounds)).toEqual(v);
    });
  });

  describe('zoomAt', () => {
    const v = { x: 200, y: 100, w: 400, h: 300 };

    it.each([1.25, 0.8, 2])('keeps the point under the cursor fixed (factor %d)', (factor) => {
      const p = { x: 350, y: 220 };
      const z = zoomAt(v, factor, p, bounds);
      expect(z.w).toBeCloseTo(v.w / factor, 9);
      expect(z.h).toBeCloseTo(v.h / factor, 9);
      expect((p.x - z.x) / z.w).toBeCloseTo((p.x - v.x) / v.w, 9);
      expect((p.y - z.y) / z.h).toBeCloseTo((p.y - v.y) / v.h, 9);
    });

    it('stops at the smallest and the whole view', () => {
      expect(zoomAt(v, 100, { x: 400, y: 250 }, bounds).w).toBe(160);
      expect(zoomAt(v, 0.01, { x: 400, y: 250 }, bounds).w).toBeCloseTo(1052 + 2 * PAD, 9);
    });

    it('keeps the point fixed when the zoom is capped, so a press at the limit never drifts', () => {
      const p = { x: 380, y: 280 };
      const capped = zoomAt(v, 100, p, bounds);
      expect((p.x - capped.x) / capped.w).toBeCloseTo((p.x - v.x) / v.w, 9);
      expect((p.y - capped.y) / capped.h).toBeCloseTo((p.y - v.y) / v.h, 9);
      const smallest = { x: 100, y: 100, w: 160, h: 120 };
      expect(zoomAt(smallest, 1.25, { x: 260, y: 220 }, bounds)).toEqual(smallest);
    });

    it.each([0, -1, NaN, Infinity])('leaves the view alone for a factor of %d', (factor) => {
      expect(zoomAt(v, factor, { x: 400, y: 250 }, bounds)).toEqual(v);
    });
  });

  describe('panBy', () => {
    it('moves by drawing units', () => {
      expect(panBy({ x: 100, y: 100, w: 400, h: 300 }, 30, -20, bounds)).toEqual({ x: 130, y: 80, w: 400, h: 300 });
    });

    it('stops at the padded edge', () => {
      const v = { x: 600, y: 300, w: 400, h: 300 };
      expect(panBy(v, 10000, 10000, bounds)).toEqual({ x: 1052 + PAD - 400, y: 700 + PAD - 300, w: 400, h: 300 });
      expect(panBy(v, -10000, -10000, bounds)).toEqual({ x: -PAD, y: -PAD, w: 400, h: 300 });
    });
  });

  describe('fitCluster', () => {
    it('fits the first cluster at 390 to the cluster ± 12 (the plan\'s 4 4 348 308)', () => {
      const v = fitCluster(narrow, 'agentic', PHONE);
      expect(v.w).toBeLessThanOrEqual(324 + 2 * 12 + 1e-9);
      expect(viewBoxFor(v)).toBe('4 4 348 308');
    });

    it('holds the whole of the tallest cluster at the phone aspect', () => {
      const v = fitCluster(narrow, 'data', PHONE);
      const data = narrow.clusters.find((c) => c.id === 'data')!;
      expect(v.h / v.w).toBeCloseTo(PHONE, 9);
      expect(inside(data, v)).toBe(true);
      expect(v.h).toBeCloseTo(360 + 24, 9);
    });

    it('fits every cluster at both widths', () => {
      for (const layout of [wide, narrow]) {
        for (const c of layout.clusters) expect(inside(c, fitCluster(layout, c.id, PHONE))).toBe(true);
      }
    });

    it('falls back to the whole drawing for an unknown cluster', () => {
      expect(fitCluster(narrow, 'nowhere', PHONE)).toEqual(fitAll(narrow, PHONE));
    });
  });

  describe('fitAll', () => {
    it.each([[700 / 1052], [735 / 1104], [PHONE], [1.5]])('holds the whole drawing at aspect %d', (aspect) => {
      for (const layout of [wide, narrow]) {
        const v = fitAll(layout, aspect);
        expect(v.h / v.w).toBeCloseTo(aspect, 9);
        expect(inside({ x: 0, y: 0, w: layout.width, h: layout.height }, v)).toBe(true);
      }
    });

    it.each([0, NaN, Infinity])('falls back to the drawing\'s aspect for an aspect of %d', (aspect) => {
      expect(fitAll(wide, aspect)).toEqual({ x: 0, y: 0, w: 1052, h: 700 });
      const v = fitCluster(narrow, 'agentic', aspect);
      expect([v.w, v.h].every(Number.isFinite)).toBe(true);
    });

    it('is the drawing itself at the drawing\'s aspect', () => {
      expect(fitAll(wide, 700 / 1052)).toEqual({ x: 0, y: 0, w: 1052, h: 700 });
    });
  });

  it('centres on a point, clamped', () => {
    expect(centerOn({ x: 0, y: 0, w: 400, h: 300 }, { x: 500, y: 350 }, bounds)).toEqual({ x: 300, y: 200, w: 400, h: 300 });
    expect(centerOn({ x: 300, y: 200, w: 400, h: 300 }, { x: 0, y: 0 }, bounds)).toEqual({ x: -PAD, y: -PAD, w: 400, h: 300 });
  });

  describe('clientToDrawing', () => {
    const view = { x: 100, y: 50, w: 400, h: 300 };
    const rect = { left: 20, top: 80, width: 800, height: 600 };

    it('maps the rect\'s corners to the view\'s', () => {
      expect(clientToDrawing(view, rect, { x: 20, y: 80 })).toEqual({ x: 100, y: 50 });
      expect(clientToDrawing(view, rect, { x: 820, y: 680 })).toEqual({ x: 500, y: 350 });
      expect(clientToDrawing(view, rect, { x: 420, y: 380 })).toEqual({ x: 300, y: 200 });
    });

    it('gives the view centre for a zero-size rect, never NaN', () => {
      expect(clientToDrawing(view, { left: 0, top: 0, width: 0, height: 0 }, { x: 5, y: 5 })).toEqual({ x: 300, y: 200 });
    });
  });

  it('tells whether a point is in view, less a margin', () => {
    const view = { x: 100, y: 50, w: 400, h: 300 };
    expect(contains(view, { x: 100, y: 50 })).toBe(true);
    expect(contains(view, { x: 99, y: 50 })).toBe(false);
    expect(contains(view, { x: 110, y: 60 }, 20)).toBe(false);
    expect(contains(view, { x: 300, y: 200 }, 20)).toBe(true);
  });

  it('turns a wheel delta into a zoom factor within 0.8–1.25', () => {
    expect(wheelFactor(0)).toBe(1);
    expect(wheelFactor(-50)).toBeCloseTo(Math.exp(0.1), 9);
    expect(wheelFactor(50)).toBeCloseTo(Math.exp(-0.1), 9);
    expect(wheelFactor(-1000)).toBe(1.25);
    expect(wheelFactor(1000)).toBe(0.8);
  });
});
