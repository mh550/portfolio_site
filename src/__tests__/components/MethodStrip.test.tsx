import { render, screen, within } from '@testing-library/react';
import MethodStrip from '@/components/MethodStrip';
import { methodSteps } from '@/lib/data';

describe('MethodStrip', () => {
  it('is a list named "How I work" with one item per step', () => {
    render(<MethodStrip />);
    const list = screen.getByRole('list', { name: 'How I work' });
    expect(list.tagName).toBe('OL');
    // Safari drops list semantics (and the name) from a list-style: none list without an explicit role
    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
  });

  it('shows the five labels in document order', () => {
    render(<MethodStrip />);
    const items = screen.getAllByRole('listitem');
    const labels = ['Diagnose', 'Decide', 'Build', 'Verify', 'Simplify'];
    items.forEach((item, i) => expect(item).toHaveTextContent(labels[i]));
  });

  it("renders each step's line", () => {
    render(<MethodStrip />);
    for (const step of methodSteps) expect(screen.getByText(step.line)).toBeInTheDocument();
  });

  it('puts 4 aria-hidden arrows between the steps', () => {
    const { container } = render(<MethodStrip />);
    const arrows = Array.from(container.querySelectorAll('span')).filter((s) => s.textContent === '→');
    expect(arrows).toHaveLength(4);
    for (const a of arrows) expect(a).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('listitem')[4]).not.toHaveTextContent('→');
  });

  it('has no links or buttons', () => {
    render(<MethodStrip />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('appends className', () => {
    render(<MethodStrip className="mb-8" />);
    expect(screen.getByRole('list', { name: 'How I work' })).toHaveClass('mb-8');
  });
});
