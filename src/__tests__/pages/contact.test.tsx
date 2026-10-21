import fs from 'fs';
import { render, screen, within } from '@testing-library/react';
import ContactPage, { metadata } from '@/app/contact/page';
import { profile } from '@/lib/data';

// P4-01, D97: one screen: the h1, one line, three tiles that are each one link
describe('ContactPage', () => {
  it('renders the heading', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Let's Talk");
  });

  it('has exactly one paragraph: the location and availability line', () => {
    const { container } = render(<ContactPage />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent('Durham, NC · open to remote, hybrid or relocation.');
    expect(paragraphs[0].textContent).toBe(`${profile.location} · ${profile.availability}.`);
  });

  it('renders three links and nothing else to click', () => {
    render(<ContactPage />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it.each([
    ['Email: mherron734@gmail.com', `mailto:${profile.email}`],
    ['LinkedIn: linkedin.com/in/mherron734 (opens in new tab)', profile.linkedin],
    ['GitHub: github.com/mh550 (opens in new tab)', profile.github],
  ])('links %s to %s', (name, href) => {
    render(<ContactPage />);
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it('opens LinkedIn and GitHub in a new tab with noopener noreferrer, mail in place', () => {
    render(<ContactPage />);
    for (const name of [/^LinkedIn/, /^GitHub/]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    const mail = screen.getByRole('link', { name: /^Email/ });
    expect(mail).not.toHaveAttribute('target');
    expect(mail).not.toHaveAttribute('rel');
  });

  it('puts one decorative svg glyph, the label and the value in each tile', () => {
    render(<ContactPage />);
    const tiles: [RegExp, string, string][] = [
      [/^Email/, 'Email', 'mherron734@gmail.com'],
      [/^LinkedIn/, 'LinkedIn', 'linkedin.com/in/mherron734'],
      [/^GitHub/, 'GitHub', 'github.com/mh550'],
    ];
    for (const [name, label, value] of tiles) {
      const link = screen.getByRole('link', { name });
      const svgs = link.querySelectorAll('svg');
      expect(svgs).toHaveLength(1);
      expect(svgs[0]).toHaveAttribute('aria-hidden', 'true');
      expect(within(link).getByText(label)).toBeInTheDocument();
      expect(within(link).getByText(value)).toBeInTheDocument();
    }
  });

  it('lays the tiles out as a grid, three columns from sm', () => {
    render(<ContactPage />);
    const grid = screen.getByRole('link', { name: /^Email/ }).parentElement!;
    expect(grid).toHaveClass('grid', 'sm:grid-cols-3');
    expect(grid.children).toHaveLength(3);
  });

  it('drops the subheader and the closing note', () => {
    const { container } = render(<ContactPage />);
    for (const gone of ['Whether you have', 'Currently based', 'always up for', 'Best way to reach me']) {
      expect(container).not.toHaveTextContent(gone);
    }
    const source = fs.readFileSync('src/app/contact/page.tsx', 'utf8');
    expect(source).not.toMatch(/Whether you have|Currently based|always up for/);
  });

  it('describes the page for the agentic-systems angle', () => {
    expect(metadata.description).toBe(
      'Reach Michael Herron, agentic systems engineer in Durham, NC: email, LinkedIn or GitHub.'
    );
  });
});
