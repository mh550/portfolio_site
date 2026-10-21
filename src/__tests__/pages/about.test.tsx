import { render, screen, within } from '@testing-library/react';
import AboutPage, { metadata } from '@/app/about/page';
import { aboutIntro, loopSteps, resolveProjectLink } from '@/lib/data';

describe('AboutPage', () => {
  it('renders the heading', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Story');
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

  it('renders headshot image', () => {
    render(<AboutPage />);
    expect(screen.getByAltText('Michael Herron headshot')).toBeInTheDocument();
  });

  it('no longer links to the inactive hit-list repo', () => {
    render(<AboutPage />);
    expect(screen.queryByRole('link', { name: /snowboard street spot tracker/i })).not.toBeInTheDocument();
    const links = screen.queryAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.includes('hit-list'))).toBe(false);
  });

  it('mentions current MAXX Potential role', () => {
    render(<AboutPage />);
    expect(screen.getByText(/MAXX Potential/)).toBeInTheDocument();
  });

  it('philosophy does not have surrounding quotation marks', () => {
    render(<AboutPage />);
    const blockquote = screen.getByRole('blockquote');
    expect(blockquote.textContent).not.toMatch(/^[""]/);
    expect(blockquote.textContent).not.toMatch(/["""]$/);
  });

  it('mentions Colorado in the story', () => {
    render(<AboutPage />);
    expect(screen.getByText(/moved to Colorado/)).toBeInTheDocument();
  });

  it('opens with the What I do intro before the story', () => {
    render(<AboutPage />);
    const intro = screen.getByText(aboutIntro.join(' '));
    const story = screen.getByText(/Duke University/);
    expect(intro.compareDocumentPosition(story) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the intro holds the v3 subline and the five loop labels in order (D76, D77)', () => {
    render(<AboutPage />);
    const intro = screen.getByText(aboutIntro.join(' '));
    const text = intro.textContent ?? '';
    expect(text).toContain(
      'I build the harnesses, memory and verification around AI agents, and the integrations they run on.',
    );
    const at = ['Spec', 'Context', 'Build', 'Verify', 'Learn'].map((l) => text.indexOf(l));
    for (const i of at) expect(i).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < at.length; i++) expect(at[i]).toBeGreaterThan(at[i - 1]);
  });

  it('describes the page without the old positioning', () => {
    expect(String(metadata.description)).not.toMatch(/full-stack and integration engineer/i);
    expect(String(metadata.description)).not.toMatch(/I find where work breaks down/i);
  });

  it('keeps the Philosophy blockquote', () => {
    render(<AboutPage />);
    expect(screen.getByRole('blockquote').textContent).toMatch(/^\s*I build and connect things/);
  });
  // jsdom can't play media, so the button offers Play here; LoopingVideo.test.tsx covers the states
  it('the snowboarding clip is named and has a play/pause button', () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelector('video')).toHaveAttribute('aria-label', 'Michael Herron snowboarding');
    expect(screen.getByRole('button', { name: /^(Play|Pause) video$/ })).toBeInTheDocument();
  });
});

describe('AboutPage How I work (D80)', () => {
  const section = () => {
    const { container } = render(<AboutPage />);
    const el = container.querySelector<HTMLElement>('section#how-i-work');
    expect(el).not.toBeNull();
    return el!;
  };

  it('is a section named by its h2', () => {
    const el = section();
    const h2 = within(el).getByRole('heading', { level: 2, name: 'How I work' });
    expect(el).toHaveAttribute('aria-labelledby', h2.id);
    expect(h2.id).not.toBe('');
  });

  it('sits between the story and Philosophy', () => {
    const el = section();
    const story = screen.getByText(/moved to Colorado/);
    const philosophy = screen.getByRole('heading', { name: /philosophy/i });
    expect(story.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.compareDocumentPosition(philosophy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the five loop steps with their lines at every width', () => {
    const list = within(section()).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    items.forEach((item, i) => {
      expect(item).toHaveTextContent(loopSteps[i].label);
      const line = within(item).getByText(loopSteps[i].line);
      expect(line.className).not.toMatch(/\bsr-only\b/);
      expect(line.className).not.toMatch(/(^|\s)hidden\b/);
    });
  });

  it('has exactly one /projects/ link under each step, each resolving to a case study', () => {
    const items = within(within(section()).getByRole('list')).getAllByRole('listitem');
    const links = within(section()).getAllByRole('link');
    expect(links).toHaveLength(5);
    for (const item of items) {
      const [link, ...rest] = within(item).getAllByRole('link');
      expect(rest).toHaveLength(0);
      const href = link.getAttribute('href') ?? '';
      expect(href).toMatch(/^\/projects\//);
      const [, slug, anchor] = href.match(/^\/projects\/([^/#]+)(?:#(.+))?$/)!;
      expect(resolveProjectLink(slug, anchor)).toEqual(anchor ? { slug, anchor } : { slug });
    }
  });

  it('gives the five links five different names (Spec and Context share an href)', () => {
    const names = within(section()).getAllByRole('link').map((l) => l.textContent);
    expect(new Set(names).size).toBe(5);
  });
});

