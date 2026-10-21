import { render, screen } from '@testing-library/react';
import ExperiencePage, { metadata } from '@/app/experience/page';
import { bulletText, roles, education } from '@/lib/data';

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
