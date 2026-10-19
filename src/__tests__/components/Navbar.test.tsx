import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/Navbar';

// Mock next/navigation; a test may set `mockPathname` to render another route
let mockPathname = '/';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));
afterEach(() => {
  mockPathname = '/';
});

describe('Navbar', () => {
  it('renders the logo', () => {
    render(<Navbar />);
    expect(screen.getByText('MH')).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    render(<Navbar />);
    const links = ['Home', 'About', 'Skills', 'Projects', 'Approach', 'Experience', 'Contact'];
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
      Approach: '/approach',
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

  it('lists the seven links in order in the desktop list and the mobile menu (M8)', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const order = ['Home', 'About', 'Skills', 'Projects', 'Approach', 'Experience', 'Contact'];
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(within(list).getAllByRole('link').map((a) => a.textContent)).toEqual(order);
      expect(within(list).getByRole('link', { name: 'Approach' })).toHaveAttribute('href', '/approach');
    }
    expect(screen.queryByRole('link', { name: /evidence|card/i })).not.toBeInTheDocument();
  });

  it('does not link to /evidence (noindex, off the nav)', () => {
    render(<Navbar />);
    for (const a of screen.getAllByRole('link')) expect(a.getAttribute('href')).not.toMatch(/^\/evidence/);
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

  // The active link was marked by colour only
  it('marks the current page with aria-current in the desktop and mobile menus', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const home = screen.getAllByRole('link', { name: 'Home' });
    expect(home).toHaveLength(2);
    for (const el of home) expect(el).toHaveAttribute('aria-current', 'page');
    for (const el of screen.getAllByRole('link', { name: 'About' })) expect(el).not.toHaveAttribute('aria-current');
  });
});


describe('Navbar on /approach (M8-02)', () => {
  it('marks only Approach as the current page, in the desktop list and the mobile menu', async () => {
    mockPathname = '/approach';
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['Approach', 'Approach']);
  });
});
