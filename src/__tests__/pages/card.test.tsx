import { render, screen, within } from '@testing-library/react';
import CardPage, { metadata } from '@/app/card/page';
import { getTopProjects, profile, projects } from '@/lib/data';

describe('CardPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the name as h1 and the positioning', () => {
    render(<CardPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.name);
    expect(screen.getByText(profile.positioning)).toBeInTheDocument();
  });

  it('renders the subline', () => {
    render(<CardPage />);
    expect(screen.getByText(profile.subline)).toBeInTheDocument();
  });

  it('Save contact links to /michael-herron.vcf', () => {
    render(<CardPage />);
    expect(screen.getByRole('link', { name: 'Save contact' })).toHaveAttribute(
      'href',
      '/michael-herron.vcf'
    );
  });

  it('LinkedIn, Email and GitHub hrefs come from profile', () => {
    render(<CardPage />);
    expect(screen.getByRole('link', { name: 'LinkedIn (opens in new tab)' })).toHaveAttribute(
      'href',
      profile.linkedin
    );
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`
    );
    expect(screen.getByRole('link', { name: 'GitHub (opens in new tab)' })).toHaveAttribute(
      'href',
      profile.github
    );
  });

  it('links that open a new tab say so to screen readers', () => {
    const { container } = render(<CardPage />);
    const blank = Array.from(container.querySelectorAll('a[target="_blank"]'));
    expect(blank).toHaveLength(2);
    blank.forEach((a) => {
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a.querySelector('.sr-only')).toHaveTextContent('(opens in new tab)');
    });
  });

  it('shows exactly 3 selected-work links, equal to getTopProjects(3) in order', () => {
    const { container } = render(<CardPage />);
    const hrefs = Array.from(container.querySelectorAll('a'))
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => /^\/projects\//.test(href));
    expect(hrefs).toHaveLength(3);
    const slugs = hrefs.map((href) => href.replace(/^\/projects\//, ''));
    const known = new Set(projects.map((p) => p.slug));
    slugs.forEach((slug) => expect(known.has(slug)).toBe(true));
    expect(slugs).toEqual(getTopProjects(3).map((p) => p.slug));
  });

  it('each selected-work link shows the title and shortDescription', () => {
    render(<CardPage />);
    const section = screen.getByRole('heading', { level: 2, name: 'Selected work' }).parentElement!;
    const links = within(section).getAllByRole('link');
    getTopProjects(3).forEach((p, i) => {
      expect(links[i]).toHaveAttribute('href', `/projects/${p.slug}`);
      expect(links[i]).toHaveTextContent(p.title);
      expect(links[i]).toHaveTextContent(p.shortDescription);
    });
  });

  it('Talk to my concierge links to /talk in the same tab, directly under the LinkedIn / Email / GitHub row (D48)', () => {
    render(<CardPage />);
    const talk = screen.getByRole('link', { name: 'Talk to my concierge' });
    expect(talk).toHaveAttribute('href', '/talk');
    expect(talk).not.toHaveAttribute('target');
    expect(talk).toHaveClass('w-full');
    const row = screen.getByRole('link', { name: 'Email' }).parentElement!;
    expect(row.nextElementSibling).toBe(talk);
  });

  it('Full portfolio links to / and Show QR links to /card/qr', () => {
    render(<CardPage />);
    expect(screen.getByRole('link', { name: 'Full portfolio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Show QR' })).toHaveAttribute('href', '/card/qr');
  });

  const buttonNames = [
    'Save contact',
    'LinkedIn (opens in new tab)',
    'Email',
    'GitHub (opens in new tab)',
    'Talk to my concierge',
    'Full portfolio',
    'Show QR',
  ];

  it('every link styled as a button has min-h-[44px]', () => {
    render(<CardPage />);
    buttonNames.forEach((name) => {
      expect(screen.getByRole('link', { name })).toHaveClass('min-h-[44px]');
    });
  });

  it('every link has a visible focus outline', () => {
    const { container } = render(<CardPage />);
    const links = Array.from(container.querySelectorAll('a'));
    expect(links).toHaveLength(buttonNames.length + 3);
    links.forEach((a) => expect(a).toHaveClass('focus-visible:outline-2'));
  });

  it('headshot image uses profile.headshot with alt text', () => {
    render(<CardPage />);
    const img = screen.getByAltText(`${profile.name} headshot`);
    expect(img.getAttribute('src')).toContain(encodeURIComponent(profile.headshot));
    expect(img).toHaveAttribute('width', '112');
    expect(img).toHaveClass('rounded-full');
  });

  it('metadata title and description', () => {
    expect(metadata.title).toBe('Michael Herron — Systems & Process Engineer');
    expect(metadata.description).toBe(profile.subline);
    // No openGraph/twitter of its own: Next replaces (not merges) these per segment, so the card inherits the root
    // block (siteName, type, headshot, summary card) and fills og:title/description from its own title/description
    expect(metadata).not.toHaveProperty('openGraph');
    expect(metadata).not.toHaveProperty('twitter');
  });

  it('renders no conference note when profile.conferenceNote is empty', () => {
    jest.replaceProperty(profile, 'conferenceNote', '');
    render(<CardPage />);
    const section = screen.getByRole('heading', { level: 2, name: 'Selected work' }).parentElement!;
    expect(section.querySelector('p')).toBeNull();
    expect(section.firstElementChild).toHaveTextContent('Selected work');
  });

  it('renders a filled-in conference note above the Selected work heading', () => {
    jest.replaceProperty(profile, 'conferenceNote', 'Met me at a conference? Say hi.');
    render(<CardPage />);
    const note = screen.getByText('Met me at a conference? Say hi.');
    const heading = screen.getByRole('heading', { level: 2, name: 'Selected work' });
    expect(note.tagName).toBe('P');
    expect(heading.parentElement!.contains(note)).toBe(true);
    expect(note.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no <nav>', () => {
    const { container } = render(<CardPage />);
    expect(container.querySelector('nav')).toBeNull();
  });
});
