import { render, screen } from '@testing-library/react';
import ProjectLinks from '@/components/projects/case-study/ProjectLinks';
import type { ProjectLink } from '@/lib/data';
import { fixtureProject } from '../../fixtures/case-study-project';

const links = fixtureProject.caseStudy!.links;
const GLYPHS: Record<ProjectLink['kind'], string> = { repo: '</>', live: '●', doc: '¶', demo: '▶' };

describe('ProjectLinks', () => {
  it('renders a #links section headed Links with one link per ProjectLink', () => {
    const { container } = render(<ProjectLinks links={links} />);
    expect(container.querySelector('section#links')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Links' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(links.length);
  });

  it.each(['repo', 'live', 'doc', 'demo'] as const)(
    'renders the %s link with its visible label, an aria-hidden glyph and new-tab attributes',
    (kind) => {
      const link = links.find((l) => l.kind === kind && !l.href.startsWith('/'))!;
      render(<ProjectLinks links={links} />);
      const a = screen.getByRole('link', { name: new RegExp(link.label) });
      expect(a).toHaveAttribute('href', link.href);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a).toHaveTextContent('(opens in new tab)');
      const glyph = a.querySelector('[aria-hidden="true"]');
      expect(glyph).toHaveTextContent(GLYPHS[kind]);
    },
  );

  it('renders an internal /… href as a same-tab link without target or new-tab text', () => {
    const internal = links.find((l) => l.href.startsWith('/'))!;
    render(<ProjectLinks links={links} />);
    const a = screen.getByRole('link', { name: new RegExp(internal.label) });
    expect(a).toHaveAttribute('href', internal.href);
    expect(a).not.toHaveAttribute('target');
    expect(a).not.toHaveAttribute('rel');
    expect(a).not.toHaveTextContent('(opens in new tab)');
    expect(a.querySelector('[aria-hidden="true"]')).toHaveTextContent(GLYPHS[internal.kind]);
  });

  it.each(['//example.com/x', '/\\example.com/x'])('treats the protocol-relative href %s as external', (href) => {
    render(<ProjectLinks links={[{ label: 'Sneaky', href, kind: 'doc' }]} />);
    const a = screen.getByRole('link', { name: /Sneaky/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders two links that share an href without a duplicate-key warning', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ProjectLinks
        links={[
          { label: 'Repo', href: 'https://example.com/same', kind: 'repo' },
          { label: 'Doc', href: 'https://example.com/same', kind: 'doc' },
        ]}
      />,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('renders nothing for an empty array', () => {
    const { container } = render(<ProjectLinks links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
