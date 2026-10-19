import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let mockReduced = false;
jest.mock('framer-motion', () => ({
  ...jest.requireActual<object>('@/__mocks__/framer-motion'),
  useReducedMotion: () => mockReduced,
}));

import LoopingVideo from '@/components/LoopingVideo';

// jsdom doesn't implement media playback. Mimic a browser: `paused` is true until autoplay starts, and pause()
// fires 'pause' only when the clip was playing (pausing before autoplay starts fires nothing)
type Media = HTMLMediaElement & { _paused?: boolean };
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get(this: Media) {
      return this._paused ?? true;
    },
  });
  HTMLMediaElement.prototype.play = function (this: Media) {
    if (this.paused) {
      this._paused = false;
      this.dispatchEvent(new Event('play'));
    }
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function (this: Media) {
    if (!this.paused) {
      this._paused = true;
      this.dispatchEvent(new Event('pause'));
    }
  };
});


beforeEach(() => {
  mockReduced = false;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('LoopingVideo', () => {
  it('renders a muted looping video with an accessible name', () => {
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('aria-label', 'A clip');
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
    expect(container.querySelector('source')).toHaveAttribute('src', '/videos/clip.mp4');
  });

  // On paper the clip is a still frame: the pause/play button would print as a stray circle (S3-01)
  it('hides the button in print, not the video', () => {
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    expect(screen.getByRole('button')).toHaveClass('print:hidden');
    expect(container.querySelector('video')).not.toHaveClass('print:hidden');
  });

  // WCAG 2.2.2: anything that moves for more than 5 s needs a way to pause it
  it('pauses and resumes from a button', async () => {
    const user = userEvent.setup();
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    const video = container.querySelector('video')!;
    await act(async () => {});
    await user.click(screen.getByRole('button', { name: 'Pause video' }));
    expect(video.paused).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Play video' }));
    expect(video.paused).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause video' })).toBeInTheDocument();
  });

  it('starts playing after hydration when motion is allowed', async () => {
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    await act(async () => {});
    expect(container.querySelector('video')!.paused).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause video' })).toBeInTheDocument();
  });

  // Low Power Mode or a browser setting can block even muted playback: no 'play' event, so the label stays honest
  it('offers Play when playback is blocked', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.reject(new Error('blocked')));
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    await act(async () => {});
    expect(container.querySelector('video')!.paused).toBe(true);
    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument();
  });

  it('has no autoplay attribute, so nothing plays before the preference is known', () => {
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    expect(container.querySelector('video')).not.toHaveAttribute('autoplay');
  });

  it('starts paused with reduced motion', async () => {
    mockReduced = true;
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    await act(async () => {});
    expect(container.querySelector('video')!.paused).toBe(true);
    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument();
  });

  // Browser check: pausing before autoplay began fired no 'pause' event, so the button kept saying "Pause video"
  it('with reduced motion, play from the button then pause again', async () => {
    mockReduced = true;
    const user = userEvent.setup();
    const { container } = render(<LoopingVideo src="/videos/clip.mp4" label="A clip" />);
    const video = container.querySelector('video')!;
    await user.click(screen.getByRole('button', { name: 'Play video' }));
    expect(video.paused).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Pause video' }));
    expect(video.paused).toBe(true);
  });
});
