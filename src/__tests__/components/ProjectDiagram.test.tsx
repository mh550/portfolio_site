import { render, within } from '@testing-library/react';
import ProjectDiagram from '@/components/projects/diagrams';
import type { DiagramKey } from '@/lib/data';

const KEYS: DiagramKey[] = ['ghl-jobtread', 'linear-flow', 'paint-hierarchy', 'ringcentral', 'calendar-sync'];

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
