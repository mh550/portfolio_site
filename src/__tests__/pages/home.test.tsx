import { render, screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { getTopProjects } from '@/lib/data';

// Mock canvas for NodeGraph
HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

const top = getTopProjects(3);

function recentWork() {
  render(<HomePage />);
  const heading = screen.getByRole('heading', { level: 2, name: 'Recent work' });
  return heading.closest('section') as HTMLElement;
}

describe('Home page', () => {
  it('shows the loop strip Spec → Context → Build → Verify → Learn and no Diagnose text (D77)', () => {
    const { container } = render(<HomePage />);
    const items = within(screen.getByRole('list', { name: 'How I work' })).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    ['Spec', 'Context', 'Build', 'Verify', 'Learn'].forEach((label, i) => expect(items[i]).toHaveTextContent(label));
    expect(container.textContent).not.toMatch(/Diagnose/);
  });

  it('renders the hero, then the Recent work section', () => {
    render(<HomePage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2, name: 'Recent work' });
    expect(h1.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the getTopProjects(3) titles as h3, in order', () => {
    const section = recentWork();
    const titles = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(top.map((p) => p.title));
  });

  it('links each card to its project page, in order', () => {
    const section = recentWork();
    const hrefs = within(section)
      .getAllByRole('link', { name: /deep dive/i })
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(top.map((p) => `/projects/${p.slug}`));
    expect(hrefs[1]).toBe('/projects/voice-concierge'); // D59
  });

  it('links "See all projects" to /projects', () => {
    const section = recentWork();
    expect(within(section).getByRole('link', { name: 'See all projects' })).toHaveAttribute('href', '/projects');
  });
});
