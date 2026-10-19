import { render, within } from '@testing-library/react';
import ProjectDiagram from '@/components/projects/diagrams';
import { getProjectBySlug, type DiagramKey } from '@/lib/data';

const KEYS: DiagramKey[] = [
  'ghl-jobtread',
  'linear-flow',
  'paint-hierarchy',
  'ringcentral',
  'calendar-sync',
  'agent-harness',
  'harness-evolution',
  'media-server',
  'hit-list',
  'form-simplification',
];

describe('ProjectDiagram accessibility (D17)', () => {
  it.each(KEYS)('%s renders one role="img" with a label and a visible figcaption outside it', (key) => {
    const { container } = render(<ProjectDiagram diagram={key} />);
    const imgs = within(container).getAllByRole('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('aria-label')?.trim()).toBeTruthy();
    const caption = container.querySelector('figcaption')!;
    expect(caption.textContent?.trim()).toBeTruthy();
    expect(imgs[0].contains(caption)).toBe(false);
    expect(imgs[0].getAttribute('aria-label')).not.toBe(caption.textContent);
  });

  it('gives every diagram its own label', () => {
    const labels = KEYS.map((key) => {
      const { container, unmount } = render(<ProjectDiagram diagram={key} />);
      const label = within(container).getByRole('img').getAttribute('aria-label');
      unmount();
      return label;
    });
    expect(new Set(labels).size).toBe(KEYS.length);
  });
});

describe('agent-harness architecture diagram', () => {
  it.each(['CLI', 'driver', 'initializer', 'session', 'suite', 'verify', 'PR', 'main', 'INBOX'])(
    'names %s (acronyms in capitals, other words in any case)',
    (word) => {
      const { getByRole } = render(<ProjectDiagram diagram="agent-harness" />);
      const text = getByRole('img').textContent!;
      if (word === word.toUpperCase()) expect(text).toContain(word);
      else expect(text.toLowerCase()).toContain(word);
    },
  );

  it('stacks its panels at 390 and top-aligns them side by side from md (M4-04)', () => {
    const { getByRole } = render(<ProjectDiagram diagram="agent-harness" />);
    const panels = getByRole('img').firstElementChild!;
    expect(panels).toHaveClass('flex-col', 'md:flex-row', 'md:items-start');
    expect(panels).not.toHaveClass('md:items-stretch');
  });
});

describe('harness-evolution diagram', () => {
  const iterations = getProjectBySlug('agent-harness')!.caseStudy!.iterations!;

  it('shows the six stages in DOM order, each with its when and its short line from the data', () => {
    const { getByRole } = render(<ProjectDiagram diagram="harness-evolution" />);
    const stages = within(getByRole('img')).getAllByRole('listitem');
    expect(stages).toHaveLength(6);
    const expected = ['long sessions', 'runbook + loop', 'orchestrator + subagents', 'harness v1', 'harness v2', 'harness v3'];
    stages.forEach((stage, i) => {
      const text = stage.textContent!;
      expect(text.toLowerCase()).toContain(expected[i]);
      expect(text).toContain(iterations[i].when);
      expect(text).toContain(iterations[i].short);
    });
  });

  it('builds its aria-label from the same data, so the label and the cards cannot drift', () => {
    const { getByRole } = render(<ProjectDiagram diagram="harness-evolution" />);
    const label = getByRole('img').getAttribute('aria-label')!;
    for (const it of iterations) {
      expect(label).toContain(it.label);
      expect(label).toContain(`${it.label}. ${it.short}.`);
    }
  });

  it('stacks in one column and becomes a six-column row from md', () => {
    const { getByRole } = render(<ProjectDiagram diagram="harness-evolution" />);
    const list = within(getByRole('img')).getByRole('list');
    expect(list.className).toMatch(/\bgrid-cols-1\b/);
    expect(list.className).toMatch(/\bmd:grid-cols-6\b/);
  });
});

describe('media-server architecture diagram (M5-03)', () => {
  it.each(['Phone', 'HTTPS', 'Navidrome', 'crates service', 'worker', 'verify', 'beets', 'library', 'snapshot', 'backup'])(
    'names %s (acronyms in capitals, other words in any case)',
    (word) => {
      const { getByRole } = render(<ProjectDiagram diagram="media-server" />);
      const text = getByRole('img').textContent!;
      if (word === word.toUpperCase()) expect(text).toContain(word);
      else expect(text.toLowerCase()).toContain(word.toLowerCase());
    },
  );

  // The label is hand-written: every component the diagram draws must also be in what screen readers hear.
  it.each(['phone', 'private network', 'HTTPS', 'Navidrome', 'crates service', 'worker', 'VPN', 'verifies', 'beets', 'library', 'trash', 'snapshot', 'backup'])(
    'its aria-label names %s',
    (word) => {
      const { getByRole } = render(<ProjectDiagram diagram="media-server" />);
      expect(getByRole('img').getAttribute('aria-label')!.toLowerCase()).toContain(word.toLowerCase());
    },
  );

  // '.ts' + '.net': split so the content guard does not flag this test (as in case-study-home-media-server.test.ts).
  it.each(['.ts' + '.net', '100.', '/srv', 'http://'])('publishes no %s in its text, label or caption (D18)', (banned) => {
    const { container, getByRole } = render(<ProjectDiagram diagram="media-server" />);
    expect(container.textContent).not.toContain(banned);
    expect(getByRole('img').getAttribute('aria-label')).not.toContain(banned);
  });

  it('never names the download source: the diagram says what the worker does, not where from', () => {
    const { container, getByRole } = render(<ProjectDiagram diagram="media-server" />);
    expect(container.textContent).not.toMatch(/soulseek|slskd/i);
    expect(getByRole('img').getAttribute('aria-label')).not.toMatch(/soulseek|slskd/i);
  });

  // M5-05 review: the lock-protected nightly job and its heartbeat are built, not yet installed (DJ backup-plan.md §4).
  it('marks the locked snapshot and the heartbeat as waiting for install', () => {
    const { container, getByRole } = render(<ProjectDiagram diagram="media-server" />);
    expect(container.textContent).toContain('install pending');
    expect(container.textContent).not.toMatch(/heartbeat is green/);
    expect(getByRole('img').getAttribute('aria-label')).toMatch(/built and waiting for my install/);
  });

  it('stacks its three panels at 390 and top-aligns them side by side from md', () => {
    const { getByRole } = render(<ProjectDiagram diagram="media-server" />);
    const panels = getByRole('img').firstElementChild!;
    expect(panels).toHaveClass('flex-col', 'md:flex-row', 'md:items-start');
    expect(panels.children).toHaveLength(3);
  });
});

describe('hit-list architecture diagram (M6-03)', () => {
  it.each(['Spots', 'Quick Add', 'Import', 'zustand', 'SQLite', 'photos', 'Apple Maps', 'geocoder'])('names %s', (word) => {
    const { getByRole } = render(<ProjectDiagram diagram="hit-list" />);
    expect(getByRole('img').textContent!.toLowerCase()).toContain(word.toLowerCase());
  });

  it.each(['Spots', 'Quick Add', 'Import', 'zustand', 'SQLite', 'photos', 'Apple Maps', 'geocoder', 'camera roll'])(
    'its aria-label names %s',
    (word) => {
      const { getByRole } = render(<ProjectDiagram diagram="hit-list" />);
      expect(getByRole('img').getAttribute('aria-label')!.toLowerCase()).toContain(word.toLowerCase());
    },
  );

  it('stacks its three panels at 390 and top-aligns them side by side from md', () => {
    const { getByRole } = render(<ProjectDiagram diagram="hit-list" />);
    const panels = getByRole('img').firstElementChild!;
    expect(panels).toHaveClass('flex-col', 'md:flex-row', 'md:items-start');
    expect(panels.children).toHaveLength(3);
  });
});

describe('form-simplification diagram (M6-03)', () => {
  const SECTIONS = ['Feature', 'In-Run', 'Landing', 'Details', 'Status'];
  const FIELDS = ['Name', 'Location', 'Photos', 'Feature types', 'Skate stopped', 'Natural speed', 'Notes'];
  const SCALE = ['None', 'Little', 'Some', 'Enough', 'Too much'];

  function panels() {
    const { getByRole } = render(<ProjectDiagram diagram="form-simplification" />);
    const grid = getByRole('img').firstElementChild!;
    const [before, after] = Array.from(grid.children) as HTMLElement[];
    return { grid, before, after };
  }

  it('has a Before panel with 20+ fields and the five section names in order', () => {
    const { before } = panels();
    const text = before.textContent!;
    expect(text).toContain('Before');
    expect(text).toContain('20+ fields');
    const at = SECTIONS.map((name) => text.indexOf(name));
    at.forEach((i) => expect(i).toBeGreaterThan(-1));
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('has an After panel listing exactly seven fields, in the specified order', () => {
    const { after } = panels();
    expect(after.textContent).toContain('After');
    const items = after.querySelectorAll('li');
    expect(items).toHaveLength(7);
    items.forEach((li, i) => expect(li.textContent).toContain(FIELDS[i]));
  });

  function speedField(after: HTMLElement) {
    const speed = Array.from(after.querySelectorAll('li')).find((li) => li.textContent!.startsWith('Natural speed'));
    expect(speed).toBeDefined();
    return speed!;
  }

  it('draws the scale exactly once, in the natural-speed field (M6-05)', () => {
    const { after } = panels();
    const withScale = Array.from(after.querySelectorAll('li')).filter((li) => li.querySelector('[data-scale-step]'));
    expect(withScale).toEqual([speedField(after)]);
  });

  it('gives "Enough" room at 360 px: the scale escapes the node padding, with a narrow gap and no cell padding (M6-05)', () => {
    // Measured before the fix: at 375 the cells were 42 px and "Enough" (40 px of text) ran past its border.
    const { after } = panels();
    const row = speedField(after).querySelector('[data-scale-step]')!.parentElement!;
    expect(row.parentElement).toHaveClass('-mx-2');
    expect(row).toHaveClass('gap-0.5');
    expect(row).not.toHaveClass('gap-1');
    Array.from(row.children).forEach((s) => expect(s.className).not.toMatch(/\bpx-/));
  });

  it('draws the five-step speed scale inside the natural-speed field, words in order, Enough selected', () => {
    const { after } = panels();
    const speed = speedField(after);
    const steps = Array.from(speed.querySelectorAll('[data-scale-step]'));
    expect(steps.map((s) => s.textContent)).toEqual(SCALE);
    expect(steps.map((s) => s.getAttribute('data-selected'))).toEqual(['false', 'false', 'false', 'true', 'false']);
    expect(speed.textContent).toContain('Enough: rolls in with speed for most tricks.');
    // Readable at 390 (M6-04): a long word may wrap, never get cut off.
    steps.forEach((s) => expect(s.className).not.toMatch(/\b(truncate|whitespace-nowrap)\b/));
  });

  it('is a picture: no buttons, radios or focus stops in the scale', () => {
    const { after } = panels();
    expect(after.querySelectorAll('button, input, [role="radio"], [tabindex]')).toHaveLength(0);
  });

  it('stacks the before and after panels at 390 and puts them side by side from md', () => {
    const { grid } = panels();
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2');
    expect(grid.children).toHaveLength(2);
  });

  it('top-aligns the panels side by side, so Before is not stretched to the taller After (M6-04)', () => {
    const { grid } = panels();
    expect(grid).toHaveClass('md:items-start');
  });

  it('says in its label and caption that the simplification is specified, not yet built', () => {
    const { container, getByRole } = render(<ProjectDiagram diagram="form-simplification" />);
    const label = getByRole('img').getAttribute('aria-label')!;
    expect(label).toContain('not yet built');
    expect(label).toContain('None, Little, Some, Enough, Too much');
    expect(container.querySelector('figcaption')!.textContent).toContain('not yet built');
  });
});

describe('hit-list diagram matches the app as built (M6-05)', () => {
  function rendered() {
    const { container, getByRole } = render(<ProjectDiagram diagram="hit-list" />);
    return { text: container.textContent!, label: getByRole('img').getAttribute('aria-label')! };
  }

  it('caps only the town-name backfill at 10 per launch', () => {
    const { text, label } = rendered();
    expect(text).toContain('older ones backfilled at most 10 per launch');
    expect(label).toContain('backfilling older ones at most 10 per launch');
  });

  it('says a save writes SQLite first, then the store', () => {
    expect(rendered().label).toContain('a save writes the offline-first SQLite database first, then the store');
  });

  it("says Quick Add saves a draft, not the Oct 16 spec's tags", () => {
    const { text } = rendered();
    expect(text).not.toContain('tags');
    expect(text).toContain('saved as a draft');
  });
});

describe('hit-list diagrams publish nothing private (M6-03, D18)', () => {
  // '.ts' + '.net': split so the content guard does not flag this test.
  it.each([
    ['hit-list', '.ts' + '.net'],
    ['hit-list', '100.'],
    ['hit-list', 'http'],
    ['form-simplification', '.ts' + '.net'],
    ['form-simplification', '100.'],
    ['form-simplification', 'http'],
  ] as [DiagramKey, string][])('%s has no %s in its text, label or caption', (key, banned) => {
    const { container, getByRole } = render(<ProjectDiagram diagram={key} />);
    expect(container.textContent).not.toContain(banned);
    expect(getByRole('img').getAttribute('aria-label')).not.toContain(banned);
  });
});
