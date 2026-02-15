import { render, screen } from '@testing-library/react';
import ContactPage from '@/app/contact/page';

describe('ContactPage', () => {
  it('renders the heading', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Let's Talk");
  });

  it('renders email link', () => {
    render(<ContactPage />);
    const link = screen.getByRole('link', { name: /email.*mherron734@gmail\.com/i });
    expect(link).toHaveAttribute('href', 'mailto:mherron734@gmail.com');
  });

  it('renders LinkedIn link', () => {
    render(<ContactPage />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/mherron734');
  });

  it('renders GitHub link', () => {
    render(<ContactPage />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/mherron734');
  });

  it('renders email address text', () => {
    render(<ContactPage />);
    expect(screen.getByText('mherron734@gmail.com')).toBeInTheDocument();
  });

  it('renders LinkedIn handle text', () => {
    render(<ContactPage />);
    expect(screen.getByText('linkedin.com/in/mherron734')).toBeInTheDocument();
  });
});
