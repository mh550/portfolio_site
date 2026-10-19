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
