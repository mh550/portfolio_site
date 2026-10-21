import { render, screen } from '@testing-library/react';
import Logo from '@/components/logos/Logo';
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
