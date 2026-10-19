import { render } from '@testing-library/react';
import NodeGraph from '@/components/hero/NodeGraph';

function fakeContext() {
  return {
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
  };
}

let ctx: ReturnType<typeof fakeContext>;
let resizeCallback: (() => void) | undefined;
const originalMatchMedia = window.matchMedia;
const originalRO = (global as { ResizeObserver?: unknown }).ResizeObserver;

function stubMatchMedia(reduce: boolean) {
  window.matchMedia = jest.fn((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  ctx = fakeContext();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  resizeCallback = undefined;
  (global as { ResizeObserver?: unknown }).ResizeObserver = class {
    constructor(cb: () => void) {
      resizeCallback = cb;
    }
    observe() {
      resizeCallback?.();
    }
    disconnect() {}
  };
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
  (global as { ResizeObserver?: unknown }).ResizeObserver = originalRO;
});

describe('NodeGraph', () => {
  it('is hidden in print (S3-01)', () => {
    stubMatchMedia(false);
    const { container } = render(<NodeGraph />);
    expect(container.querySelector('canvas')).toHaveClass('print:hidden');
  });

  it('animates with requestAnimationFrame by default', () => {
    stubMatchMedia(false);
    render(<NodeGraph />);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('with reduced motion: no animation loop, but draws a frame after the resize callback', () => {
    stubMatchMedia(true);
    render(<NodeGraph />);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(resizeCallback).toBeDefined();
    ctx.arc.mockClear();
    ctx.clearRect.mockClear();
    resizeCallback!();
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });
});
