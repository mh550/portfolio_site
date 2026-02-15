import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Navbar', () => {
  it('renders the logo', () => {
    render(<Navbar />);
    expect(screen.getByText('MH')).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    render(<Navbar />);
    const links = ['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'];
    for (const label of links) {
      expect(screen.getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    }
  });

  it('nav links have correct hrefs', () => {
    render(<Navbar />);
    const expectedHrefs: Record<string, string> = {
      Home: '/',
      About: '/about',
      Skills: '/skills',
      Projects: '/projects',
      Experience: '/experience',
      Contact: '/contact',
    };
    for (const [label, href] of Object.entries(expectedHrefs)) {
      const linkEls = screen.getAllByRole('link', { name: label });
      // At least one link (desktop) should have the correct href
      const found = linkEls.some((el) => el.getAttribute('href') === href);
      expect(found).toBe(true);
    }
  });

  it('shows hamburger button on mobile', () => {
    render(<Navbar />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('opens and closes mobile menu on hamburger click', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });

    await user.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });
});
