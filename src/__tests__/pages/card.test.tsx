import { render, screen, within } from '@testing-library/react';
import CardPage, { metadata } from '@/app/card/page';
import { getTopProjects, profile, projects } from '@/lib/data';

describe('CardPage', () => {
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
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.linkedin);
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', profile.github);
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

  it('Full portfolio links to / and Show QR links to /card/qr', () => {
    render(<CardPage />);
    expect(screen.getByRole('link', { name: 'Full portfolio →' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Show QR' })).toHaveAttribute('href', '/card/qr');
  });

  it('every link styled as a button has min-h-[44px]', () => {
    render(<CardPage />);
    ['Save contact', 'LinkedIn', 'Email', 'GitHub', 'Full portfolio →', 'Show QR'].forEach((name) => {
      expect(screen.getByRole('link', { name })).toHaveClass('min-h-[44px]');
    });
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
    expect(metadata.openGraph?.images).toContain(profile.headshot);
    expect(metadata.twitter?.images).toContain(profile.headshot);
    expect(metadata.twitter).toHaveProperty('card', 'summary');
  });

  it('renders no <nav>', () => {
    const { container } = render(<CardPage />);
    expect(container.querySelector('nav')).toBeNull();
  });
});
