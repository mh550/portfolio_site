import { render, screen } from '@testing-library/react';
import MediaGallery from '@/components/projects/MediaGallery';
import type { ProjectMedia } from '@/lib/data';

const portrait = (n: number): ProjectMedia => ({
  type: 'image',
  src: `/shot-${n}.png`,
  alt: `shot ${n}`,
  caption: `caption ${n}`,
  width: 840,
  height: 1720,
});

const unsized: ProjectMedia = { type: 'image', src: '/wide.png', alt: 'wide shot' };

describe('MediaGallery', () => {
  it('renders nothing without media', () => {
    const { container } = render(<MediaGallery media={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a sized image at its own aspect ratio, uncropped (D29)', () => {
    render(<MediaGallery media={[portrait(1)]} />);
    const img = screen.getByAltText('shot 1');
    expect(img).toHaveAttribute('width', '840');
    expect(img).toHaveAttribute('height', '1720');
    expect(img).toHaveClass('h-auto', 'w-full');
    expect(img).not.toHaveClass('object-cover');
    expect(img.parentElement).not.toHaveClass('aspect-[4/3]');
    expect(screen.getByText('caption 1').tagName).toBe('FIGCAPTION');
  });

  it('puts an all-portrait list in one column on phones and three from sm', () => {
    const { container } = render(<MediaGallery media={[portrait(1), portrait(2), portrait(3)]} />);
    expect(container.firstElementChild).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    expect(container.firstElementChild).not.toHaveClass('sm:grid-cols-2');
  });

  it('renders an item without width/height as before: 4:3 box, object-cover, two columns from sm', () => {
    const { container } = render(<MediaGallery media={[unsized]} />);
    const img = screen.getByAltText('wide shot');
    expect(img).toHaveClass('object-cover');
    expect(img.parentElement).toHaveClass('aspect-[4/3]');
    expect(container.firstElementChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  it('keeps two columns when the list mixes portrait and unsized items', () => {
    const { container } = render(<MediaGallery media={[portrait(1), unsized]} />);
    expect(container.firstElementChild).toHaveClass('sm:grid-cols-2');
  });

  // M5-05: only images are shown uncropped, so a sized video must not turn on the narrow three-column grid.
  it('keeps two columns and the 4:3 box for a sized portrait video', () => {
    const video: ProjectMedia = { type: 'video', src: '/clip.mp4', alt: 'clip', width: 840, height: 1720 };
    const { container } = render(<MediaGallery media={[portrait(1), video]} />);
    expect(container.firstElementChild).toHaveClass('sm:grid-cols-2');
    expect(container.querySelector('video')!.parentElement).toHaveClass('aspect-[4/3]');
  });
});
