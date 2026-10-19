import { render, screen } from '@testing-library/react';
import CodeBlock from '@/components/projects/CodeBlock';

const snippet = { title: 'driver.sh', language: 'bash', code: 'echo hi' };

// M8-02: a scrollable excerpt must be reachable by keyboard to scroll it sideways
describe('CodeBlock', () => {
  it('makes the scrollable <pre> focusable, named by the snippet title, with the focus ring', () => {
    render(<CodeBlock snippet={snippet} />);
    const pre = screen.getByRole('region', { name: 'driver.sh' });
    expect(pre.tagName).toBe('PRE');
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre.className).toMatch(/focus-visible:outline/);
  });

  it('marks the code as not to be translated', () => {
    const { container } = render(<CodeBlock snippet={snippet} />);
    expect(container.querySelector('code')).toHaveAttribute('translate', 'no');
  });
});
