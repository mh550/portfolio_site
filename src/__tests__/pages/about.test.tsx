import { render, screen } from '@testing-library/react';
import AboutPage, { metadata } from '@/app/about/page';
import { aboutIntro } from '@/lib/data';

describe('AboutPage', () => {
  it('renders the heading', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Story');
  });

  it('renders Philosophy section', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { name: /philosophy/i })).toBeInTheDocument();
  });

  it('renders outside the terminal section', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { name: /outside the terminal/i })).toBeInTheDocument();
  });

  it('renders Duke University mention', () => {
    render(<AboutPage />);
    expect(screen.getByText(/Duke University/)).toBeInTheDocument();
  });

  it('renders headshot image', () => {
    render(<AboutPage />);
    expect(screen.getByAltText('Michael Herron headshot')).toBeInTheDocument();
  });

  it('no longer links to the inactive hit-list repo', () => {
    render(<AboutPage />);
    expect(screen.queryByRole('link', { name: /snowboard street spot tracker/i })).not.toBeInTheDocument();
    const links = screen.queryAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.includes('hit-list'))).toBe(false);
  });

  it('mentions current MAXX Potential role', () => {
    render(<AboutPage />);
    expect(screen.getByText(/MAXX Potential/)).toBeInTheDocument();
  });

  it('philosophy does not have surrounding quotation marks', () => {
    render(<AboutPage />);
    const blockquote = screen.getByRole('blockquote');
    expect(blockquote.textContent).not.toMatch(/^[""]/);
    expect(blockquote.textContent).not.toMatch(/["""]$/);
  });

  it('mentions Colorado in the story', () => {
    render(<AboutPage />);
    expect(screen.getByText(/moved to Colorado/)).toBeInTheDocument();
  });

  it('opens with the What I do intro before the story', () => {
    render(<AboutPage />);
    const intro = screen.getByText(aboutIntro.join(' '));
    const story = screen.getByText(/Duke University/);
    expect(intro.compareDocumentPosition(story) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('describes the page without the old positioning', () => {
    expect(String(metadata.description)).not.toMatch(/full-stack and integration engineer/i);
  });
});
