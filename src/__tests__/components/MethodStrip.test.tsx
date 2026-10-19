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

  it('hides the lines below md by default (sr-only)', () => {
    render(<MethodStrip />);
    for (const step of methodSteps) expect(screen.getByText(step.line)).toHaveClass('sr-only');
  });

  it('with showLines, shows the lines at every width (D31)', () => {
    render(<MethodStrip showLines />);
    for (const step of methodSteps) {
      const line = screen.getByText(step.line);
      expect(line).not.toHaveClass('sr-only');
      expect(line.className).not.toMatch(/not-sr-only/);
    }
  });

  it('with showLines, stacks the steps left-aligned below md and shows the arrows only from md up', () => {
    const { container } = render(<MethodStrip showLines />);
    expect(screen.getByRole('list', { name: 'How I work' })).toHaveClass('grid', 'md:grid-cols-5');
    for (const item of screen.getAllByRole('listitem')) expect(item).toHaveClass('text-left', 'md:text-center');
    const arrows = Array.from(container.querySelectorAll('span')).filter((s) => s.textContent === '→');
    expect(arrows).toHaveLength(4);
    for (const a of arrows) expect(a).toHaveClass('hidden', 'md:inline');
  });

  it('takes a label, so a page whose h1 is "How I work" can name it differently', () => {
    render(<MethodStrip showLines label="The five steps" />);
    expect(screen.getByRole('list', { name: 'The five steps' })).toBeInTheDocument();
  });

  it('appends className', () => {
    render(<MethodStrip className="mb-8" />);
    expect(screen.getByRole('list', { name: 'How I work' })).toHaveClass('mb-8');
  });
});
