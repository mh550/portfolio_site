import { render, screen } from '@testing-library/react';
import CardQrPage, { metadata } from '@/app/card/qr/page';
import { profile } from '@/lib/data';

describe('CardQrPage', () => {
  it('shows the QR image', () => {
    render(<CardQrPage />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/card/qr.svg');
    expect(img).toHaveAttribute('alt', 'QR code linking to michael-herron.vercel.app/card');
    expect(img).toHaveStyle({ width: 'min(80vw, 420px)' });
  });

  it('the QR image reserves its square before it loads', () => {
    render(<CardQrPage />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '420');
    expect(img).toHaveAttribute('height', '420');
  });

  it('shows the name (as h1) and positioning under it', () => {
    render(<CardQrPage />);
    const name = screen.getByRole('heading', { level: 1, name: profile.name });
    const positioning = screen.getByText(profile.positioning);
    const img = screen.getByRole('img');
    expect(img.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(name.compareDocumentPosition(positioning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Back links to /card', () => {
    render(<CardQrPage />);
    const back = screen.getByRole('link', { name: 'Back to card' });
    expect(back).toHaveAttribute('href', '/card');
    expect(back).toHaveClass('min-h-[44px]');
  });

  it('is a full-viewport white page', () => {
    render(<CardQrPage />);
    expect(screen.getByRole('main')).toHaveClass('bg-white', 'text-black', 'min-h-screen');
  });

  it('metadata.robots.index is false', () => {
    expect(metadata.robots).toHaveProperty('index', false);
    expect(metadata.title).toBe(`QR — ${profile.name}`);
  });

  it('renders no <nav>', () => {
    const { container } = render(<CardQrPage />);
    expect(container.querySelector('nav')).toBeNull();
  });
});
