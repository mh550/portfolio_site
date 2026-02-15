import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/about/page';

describe('AboutPage', () => {
  it('renders the heading', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Arc');
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

  it('renders High Cascade Snowboard Camp mention', () => {
    render(<AboutPage />);
    expect(screen.getByText(/High Cascade Snowboard Camp/)).toBeInTheDocument();
  });

  it('renders trait badges', () => {
    render(<AboutPage />);
    expect(screen.getByText('Snowboarder')).toBeInTheDocument();
    expect(screen.getByText('Skateboarder')).toBeInTheDocument();
    expect(screen.getByText('Wakeboarder')).toBeInTheDocument();
    expect(screen.getByText('Snowboard Coach')).toBeInTheDocument();
  });
});
