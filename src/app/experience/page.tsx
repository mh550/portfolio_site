import type { Metadata } from 'next';
import Link from 'next/link';
import { roles, resumeProjects, earlierRoles, education, profile, bulletText } from '@/lib/data';
import type { Bullet } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';
import TimelineLine from '@/components/TimelineLine';
import BulletWithLinks from '@/components/experience/BulletWithLinks';
import { focusRing } from '@/components/focusRing';
import { textLink } from '@/components/textLink';

export const metadata: Metadata = {
  title: 'Experience — Michael Herron',
  description: `Work history and education of ${profile.name}.`,
};

const PERIOD = 'font-mono text-[var(--color-muted)] text-xs tracking-widest uppercase mb-1';
const SECTION_HEADING = 'text-3xl font-bold mb-8';

function Bullets({ bullets }: { bullets: Bullet[] }) {
  return (
    <ul className="space-y-2">
      {bullets.map((bullet) => (
        <li key={bulletText(bullet)} className="flex gap-3 text-sm text-[var(--color-muted)] leading-relaxed">
          <span aria-hidden="true" className="text-[var(--color-accent)]/50 mt-0.5 shrink-0">
            —
          </span>
          <BulletWithLinks bullet={bullet} />
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return (
    <ScrollReveal delay={0.05}>
      <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
    </ScrollReveal>
  );
}

export default function ExperiencePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Experience
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-16">
          History
        </h1>
      </ScrollReveal>

      {/* Work timeline */}
      <div className="relative">
        {/* Vertical line — animated */}
        <TimelineLine />

        <div className="space-y-14 pl-8">
          {roles.map((role, i) => (
            <ScrollReveal key={`${role.company}-${role.period}`} delay={i * 0.07}>
              <article className="relative">
                {/* Dot on timeline */}
                <div
                  aria-hidden="true"
                  className="absolute -left-8 top-1.5 w-3 h-3 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-background)]"
                />

                <p className={PERIOD}>{role.period}</p>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-0.5">
                  {role.title}
                </h2>
                <p className="text-[var(--color-accent)] text-sm font-medium mb-4">
                  {role.company}
                </p>
                <Bullets bullets={role.bullets} />
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <Divider />

      {/* The resume's Projects group: name → deep-dive, repo line → GitHub */}
      <section aria-labelledby="projects-heading">
        <ScrollReveal delay={0.05}>
          <h2 id="projects-heading" className={SECTION_HEADING}>
            Projects
          </h2>
        </ScrollReveal>
        <div className="space-y-12">
          {resumeProjects.map((project, i) => (
            <ScrollReveal key={project.href} delay={i * 0.07}>
              <article>
                <p className={PERIOD}>{project.period}</p>
                <h3 className="text-xl font-bold mb-0.5">
                  <Link
                    href={project.href}
                    className={textLink}
                  >
                    {project.name}
                  </Link>
                </h3>
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block font-mono text-[var(--color-accent)] text-sm mb-4 break-all underline decoration-[var(--color-accent)]/40 underline-offset-4 hover:decoration-[var(--color-accent)] ${focusRing}`}
                >
                  {project.repo.replace('https://', '')}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
                <Bullets bullets={project.bullets} />
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Divider />

      {/* Roles not on the resume: one line each (D82) */}
      <section aria-labelledby="earlier-heading">
        <ScrollReveal delay={0.05}>
          <h2 id="earlier-heading" className={SECTION_HEADING}>
            Earlier
          </h2>
          <div className="space-y-2">
            {earlierRoles.map((role) => (
              <p key={role.company} className="text-sm text-[var(--color-muted)]">
                {`${role.title} · ${role.company} · ${role.period}`}
              </p>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <Divider />

      <section aria-labelledby="education-heading">
        <ScrollReveal delay={0.05}>
          <h2 id="education-heading" className={SECTION_HEADING}>
            Education
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="p-6 rounded-xl border border-white/8 bg-[var(--color-surface)]">
            <p className={PERIOD}>{education.period}</p>
            <h3 className="text-xl font-bold mb-1">{education.institution}</h3>
            <p className="text-[var(--color-accent)] text-sm font-medium mb-5">{education.degree}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Honors */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-foreground)] uppercase tracking-wider mb-2">
                  Honors
                </p>
                <ul className="space-y-1">
                  {education.honors.map((h) => (
                    <li key={h} className="text-sm text-[var(--color-muted)]">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coursework */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-foreground)] uppercase tracking-wider mb-2">
                  Relevant Coursework
                </p>
                <ul className="space-y-1">
                  {education.coursework.map((c) => (
                    <li key={c} className="text-sm text-[var(--color-muted)]">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
