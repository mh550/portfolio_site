import { render, within } from '@testing-library/react';
import ProjectDiagram, { HARNESS_EVOLUTION_WHY } from '@/components/projects/diagrams';
import { getProjectBySlug, type DiagramKey } from '@/lib/data';

const KEYS: DiagramKey[] = [
  'ghl-jobtread',
  'linear-flow',
  'paint-hierarchy',
  'ringcentral',
  'calendar-sync',
  'agent-harness',
  'harness-evolution',
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

  it('has one short "why it changed" line per iteration', () => {
    expect(HARNESS_EVOLUTION_WHY).toHaveLength(iterations.length);
    expect(HARNESS_EVOLUTION_WHY).toHaveLength(6);
    for (const why of HARNESS_EVOLUTION_WHY) expect(why.split(/\s+/).length).toBeLessThanOrEqual(8);
  });

  it('shows the six stages in order, each with its when and why line', () => {
    const { getByRole } = render(<ProjectDiagram diagram="harness-evolution" />);
    const stages = within(getByRole('img')).getAllByRole('listitem');
    expect(stages).toHaveLength(6);
    const expected = ['long sessions', 'runbook + loop', 'orchestrator + subagents', 'harness v1', 'harness v2', 'harness v3'];
    stages.forEach((stage, i) => {
      const text = stage.textContent!;
      expect(text.toLowerCase()).toContain(expected[i]);
      expect(text).toContain(iterations[i].when);
      expect(text).toContain(HARNESS_EVOLUTION_WHY[i]);
    });
  });

  it('stacks in one column and becomes a six-column row from md', () => {
    const { getByRole } = render(<ProjectDiagram diagram="harness-evolution" />);
    const list = within(getByRole('img')).getByRole('list');
    expect(list.className).toMatch(/\bgrid-cols-1\b/);
    expect(list.className).toMatch(/\bmd:grid-cols-6\b/);
  });
});
