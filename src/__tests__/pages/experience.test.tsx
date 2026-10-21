import { render, screen, within } from '@testing-library/react';
import ExperiencePage, { metadata } from '@/app/experience/page';
import { bulletText, roles, education, resumeProjects, earlierRoles } from '@/lib/data';

describe('ExperiencePage', () => {
  it('renders the main heading', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('History');
  });

  it('renders all work roles', () => {
    render(<ExperiencePage />);
    for (const role of roles) {
      expect(screen.getByRole('heading', { name: role.title })).toBeInTheDocument();
      expect(screen.getByText(role.company)).toBeInTheDocument();
    }
  });

  it('renders role bullet points', () => {
    render(<ExperiencePage />);
    // Spot-check one bullet from Builder Clarity role
    expect(screen.getByText(/As first engineer, led the move from Zapier/)).toBeInTheDocument();
  });

  it('renders Education section', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { name: /education/i })).toBeInTheDocument();
    expect(screen.getByText(education.institution)).toBeInTheDocument();
    expect(screen.getByText(education.degree)).toBeInTheDocument();
  });

  it('renders honors', () => {
    render(<ExperiencePage />);
    for (const h of education.honors) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  it('renders coursework', () => {
    render(<ExperiencePage />);
    for (const c of education.coursework) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it('shows no GPA (D8)', () => {
    render(<ExperiencePage />);
    expect(screen.queryByText(/GPA/)).toBeNull();
  });
});

describe('Experience from the resume (P2-01; supersedes the M2-03 bullets)', () => {
  const byCompany = (company: string) => {
    const role = roles.find((r) => r.company === company);
    if (!role) throw new Error(`no role for ${company}`);
    return role;
  };
  const bulletsOf = (company: string) => byCompany(company).bullets.map(bulletText).join('\n');

  it('keeps the job titles exactly', () => {
    expect(byCompany('MAXX Potential').title).toBe('Full-Stack Software Engineer');
    expect(byCompany('Builder Clarity').title).toBe('Founding Full-Stack Software Engineer');
  });

  it('gives Builder Clarity the metrics-bank figures', () => {
    const text = bulletsOf('Builder Clarity');
    for (const s of ['3 clients', '~2 days', '~6 hours', '~8 hrs/week', '4+ sources']) {
      expect(text).toContain(s);
    }
  });

  it('gives MAXX Potential the 2× and ~80% figures', () => {
    const text = bulletsOf('MAXX Potential');
    for (const s of ['2× sprint throughput', '~80% less bug-filing time']) expect(text).toContain(s);
  });

  it('drops the overclaiming "Pioneered" bullet', () => {
    expect(roles.flatMap((r) => r.bullets.map(bulletText)).some((b) => b.includes('Pioneered'))).toBe(false);
  });

  it('renders the resume bullets on the page, links in place', () => {
    const { container } = render(<ExperiencePage />);
    for (const b of roles.flatMap((r) => r.bullets)) expect(container).toHaveTextContent(bulletText(b));
    expect(screen.getByRole('link', { name: 'agentic bug-fix workflow' })).toHaveAttribute(
      'href',
      '/projects/linear-ai-workflow',
    );
    expect(screen.getByRole('link', { name: 'unified per-job communications log' })).toHaveAttribute(
      'href',
      '/projects/ringcentral-jobtread-integration',
    );
  });

  it('describes the page without the old positioning', () => {
    expect(String(metadata.description)).not.toMatch(/full-stack and integration/i);
  });
});

describe('the resume layout (P2-02): roles, Projects, Earlier, Education', () => {
  const section = (name: string) => {
    const heading = screen.getByRole('heading', { level: 2, name });
    const el = heading.closest('section');
    if (!el) throw new Error(`no section around ${name}`);
    return el;
  };

  it('orders the h2s: the roles, then Projects, Earlier, Education', () => {
    render(<ExperiencePage />);
    const h2s = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([...roles.map((r) => r.title), 'Projects', 'Earlier', 'Education']);
  });

  it('links the four bullet phrases to their deep-dives', () => {
    render(<ExperiencePage />);
    const links: [string, string][] = [
      ['agentic bug-fix workflow', '/projects/linear-ai-workflow'],
      ['contractor estimating app', '/projects/paint-estimator'],
      ['JobTread ↔ GoHighLevel integration platform', '/projects/ghl-jobtread-integration'],
      ['unified per-job communications log', '/projects/ringcentral-jobtread-integration'],
    ];
    for (const [name, href] of links) expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it('gives each resume project a deep-dive link, a repo link, its period and its two bullets', () => {
    const { container } = render(<ExperiencePage />);
    const projects = within(section('Projects'));
    for (const p of resumeProjects) {
      const heading = projects.getByRole('heading', { level: 3, name: p.name });
      expect(within(heading).getByRole('link', { name: p.name })).toHaveAttribute('href', p.href);
      const repo = projects.getByRole('link', { name: `${p.repo.replace('https://', '')} (opens in new tab)` });
      expect(repo).toHaveAttribute('href', p.repo);
      expect(repo).toHaveAttribute('target', '_blank');
      expect(repo).toHaveAttribute('rel', 'noopener noreferrer');
      expect(projects.getByText(p.period)).toBeInTheDocument();
      expect(p.bullets).toHaveLength(2);
      for (const b of p.bullets) expect(container).toHaveTextContent(bulletText(b));
    }
    expect(projects.getAllByRole('link')).toHaveLength(2 * resumeProjects.length);
  });

  it('lists Earlier as one line per role, with no bullet list', () => {
    render(<ExperiencePage />);
    const earlier = section('Earlier');
    for (const r of earlierRoles) {
      expect(within(earlier).getByText(`${r.title} · ${r.company} · ${r.period}`)).toBeInTheDocument();
    }
    expect(earlier.querySelector('ul')).toBeNull();
  });

  it('renders the six resume coursework items under Education', () => {
    render(<ExperiencePage />);
    const educationSection = within(section('Education'));
    expect(education.coursework).toHaveLength(6);
    for (const c of education.coursework) expect(educationSection.getByText(c)).toBeInTheDocument();
  });
});
