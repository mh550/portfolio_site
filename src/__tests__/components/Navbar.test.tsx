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
    const links = ['Home', 'About', 'Skills', 'Projects', 'Talk', 'Experience', 'Contact'];
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
      Talk: '/talk',
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

  it('lists the seven links in order in the desktop list and the mobile menu (D60, D79)', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const order = ['Home', 'About', 'Skills', 'Projects', 'Talk', 'Experience', 'Contact'];
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(within(list).getAllByRole('link').map((a) => a.textContent)).toEqual(order);
      expect(within(list).getByRole('link', { name: 'Talk' })).toHaveAttribute('href', '/talk');
    }
    expect(screen.queryByRole('link', { name: /evidence|card|approach/i })).not.toBeInTheDocument();
    for (const a of screen.getAllByRole('link')) expect(a.getAttribute('href')).not.toBe('/approach');
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


// D79: /approach redirects to /about#how-i-work, so the How I work section belongs to About.
describe('Navbar on /about (D79)', () => {
  it('marks only About as the current page, in the desktop list and the mobile menu', async () => {
    mockPathname = '/about';
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['About', 'About']);
  });
});

describe('Navbar on /talk (VC4, D60)', () => {
  it('marks only Talk as the current page, in the desktop list and the mobile menu', async () => {
    mockPathname = '/talk';
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['Talk', 'Talk']);
    for (const a of current) expect(a).toHaveAttribute('href', '/talk');
  });
});

// VC4-06 review: eight links (seven since D79) make the open menu ~370 px; on a short landscape phone it must scroll, not clip Contact.
describe('Navbar mobile menu height (VC4-06)', () => {
  it('caps the open menu at the viewport below the bar and lets it scroll', async () => {
    mockPathname = '/';
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = screen.getAllByRole('link', { name: 'Contact' })[1].closest('ul')!.parentElement!;
    const classes = menu.className.split(/\s+/);
    expect(classes).toContain('max-h-[calc(100dvh-4rem)]');
    expect(classes).toContain('overflow-y-auto');
  });
});
