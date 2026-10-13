import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/about/page';

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
});
