import { render, screen } from '@testing-library/react';
import ExperiencePage, { metadata } from '@/app/experience/page';
import { roles, education } from '@/lib/data';

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
    expect(screen.getByText(/First engineer hired/)).toBeInTheDocument();
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

describe('Experience titles and bullets (M2-03)', () => {
  const byCompany = (company: string) => {
    const role = roles.find((r) => r.company === company);
    if (!role) throw new Error(`no role for ${company}`);
    return role;
  };
  const bulletsOf = (company: string) => byCompany(company).bullets.join('\n');

  it('keeps the job titles exactly', () => {
    expect(byCompany('MAXX Potential').title).toBe('Full-Stack Software Engineer');
    expect(byCompany('Builder Clarity').title).toBe('Founding Full-Stack Software Engineer');
    expect(byCompany('Tahoma Films').title).toBe('AI Workflow Engineer');
    expect(byCompany('High Cascade Snowboard Camp').title).toBe('Snowboard Coach');
  });

  it('corrects the High Cascade bullet to an age range (D9)', () => {
    const bullets = byCompany('High Cascade Snowboard Camp').bullets;
    expect(bullets.some((b) => b.startsWith('Mentored 12–18-year-old snowboarders'))).toBe(true);
    expect(bullets.join('\n')).not.toMatch(/per session/);
  });

  it('gives MAXX Potential the metrics-bank bullets', () => {
    const text = bulletsOf('MAXX Potential');
    for (const s of [
      'Linear',
      'AI-agent workflow',
      '2×',
      '~80%',
      'de facto project manager',
      'Foundational Capability Patterns',
      'AI-assisted rapid prototyping',
      'git-tracked database migrations',
      'onboarded the team',
    ]) {
      expect(text).toContain(s);
    }
  });

  it('gives Builder Clarity the metrics-bank bullets', () => {
    const text = bulletsOf('Builder Clarity');
    for (const s of ['3 clients', '~2 days', '~6 hours', '~8 hrs/week', '4+ sources', 'Agile/Scrum in Linear']) {
      expect(text).toContain(s);
    }
  });

  it('drops the overclaiming "Pioneered" bullet', () => {
    expect(roles.flatMap((r) => r.bullets).some((b) => b.includes('Pioneered'))).toBe(false);
  });

  it('renders the new bullets on the page', () => {
    render(<ExperiencePage />);
    expect(screen.getByText(/2× sprint throughput/)).toBeInTheDocument();
    expect(screen.getByText(/Mentored 12–18-year-old snowboarders/)).toBeInTheDocument();
  });

  it('describes the page without the old positioning', () => {
    expect(String(metadata.description)).not.toMatch(/full-stack and integration/i);
  });
});
