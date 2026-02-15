import { render, screen } from '@testing-library/react';
import ScrollReveal from '@/components/ScrollReveal';

// Default mock: useReducedMotion returns false (animations enabled)
describe('ScrollReveal — normal motion', () => {
  it('renders children', () => {
    render(<ScrollReveal><p>Hello</p></ScrollReveal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('passes className to wrapper', () => {
    render(<ScrollReveal className="my-class"><p>Content</p></ScrollReveal>);
    expect(screen.getByText('Content').parentElement).toHaveClass('my-class');
  });
});

// Override mock to simulate prefers-reduced-motion
describe('ScrollReveal — reduced motion', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('framer-motion', () => ({
      ...jest.requireActual('@/__mocks__/framer-motion'),
      useReducedMotion: () => true,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('renders children without motion wrapper when reduced motion is preferred', async () => {
    const { default: SR } = await import('@/components/ScrollReveal');
    render(<SR><p data-testid="child">Reduced</p></SR>);
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    // When reduced, rendered as plain div, not a motion.div
    expect(child.parentElement?.tagName).toBe('DIV');
  });
});
