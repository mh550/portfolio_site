import { act, fireEvent, render, screen, within } from '@testing-library/react';
import SkillGraph, { type GraphProject } from '@/components/skills/SkillGraph';
import { clusters, edges, nodes } from '@/lib/data/skills';
import { projects as allProjects } from '@/lib/data/projects';
import { edgePaths, layoutGraph } from '@/lib/graph/layout';
import { fitAll, viewBoxFor } from '@/lib/graph/view';
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

describe('SkillGraph: columns follow the viewport (matchMedia)', () => {
  const realMatchMedia = window.matchMedia;
  let width = 1280;
  let listeners: (() => void)[] = [];

  beforeEach(() => {
    listeners = [];
    window.matchMedia = jest.fn((query: string) => ({
      get matches() {
        if (query === '(min-width: 1024px)') return width >= 1024;
        if (query === '(max-width: 639px)') return width <= 639;
        return false;
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        listeners = listeners.filter((l) => l !== fn);
      },
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    width = 1280;
  });

  it('draws 2 columns below 1024 px and 3 from 1024, following a change', () => {
    width = 390;
    const { container, unmount } = renderGraph();
    expect(svg(container)).toHaveAttribute('viewBox', viewBoxFor(fitAll(narrow, narrow.height / narrow.width)));
    expect(container.querySelector('g[data-cluster-box="web"] rect')).toHaveAttribute('x', '16');

    width = 1280;
    act(() => listeners.forEach((l) => l()));
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 1052 700');
    expect(container.querySelector('g[data-cluster-box="web"] rect')).toHaveAttribute('x', '712');

    unmount();
    expect(listeners).toHaveLength(0);
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
