import { render, screen } from '@testing-library/react';
import Logo from '@/components/logos/Logo';
import { extraPaths } from '@/components/logos/extra';
import { logoPaths } from '@/components/logos/paths';

describe('Logo', () => {
  it('renders a 24×24 svg named by its <title>', () => {
    const { container } = render(<Logo name="python" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg.querySelector('title')).toHaveTextContent('Python');
    expect(screen.getByRole('img', { name: 'Python' })).toBe(svg);
    expect(svg.querySelector('path')).toHaveAttribute('d', logoPaths.python.path);
  });

  it('is aria-hidden with no <title> when decorative', () => {
    const { container } = render(<Logo name="bash" decorative />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg.querySelector('title')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('passes className through', () => {
    const { container } = render(<Logo name="github" className="w-6 h-6" />);
    expect(container.querySelector('svg')).toHaveClass('w-6', 'h-6');
  });
});

// P4-01, D97: the authored marks in extra.ts (simple-icons 16.9.0 has no LinkedIn) cut their holes with evenodd
describe('Logo with an authored mark', () => {
  it.each([
    ['linkedin', 'LinkedIn'],
    ['mail', 'Email'],
  ] as const)('%s renders its extra.ts path with fill-rule evenodd', (name, title) => {
    const { container } = render(<Logo name={name} />);
    const path = container.querySelector('path')!;
    expect(path).toHaveAttribute('d', extraPaths[name].path);
    expect(path).toHaveAttribute('fill-rule', 'evenodd');
    expect(screen.getByRole('img', { name: title })).toBeInTheDocument();
  });

  it('leaves a generated mark on the default fill rule', () => {
    const { container } = render(<Logo name="github" />);
    expect(container.querySelector('path')).not.toHaveAttribute('fill-rule');
  });

  it('keeps extra.ts keys apart from the generated ones', () => {
    for (const key of Object.keys(extraPaths)) expect(Object.keys(logoPaths)).not.toContain(key);
  });
});
