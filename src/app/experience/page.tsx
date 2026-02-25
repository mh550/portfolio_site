import type { Metadata } from 'next';
import { roles, education } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';
import TimelineLine from '@/components/TimelineLine';

export const metadata: Metadata = {
  title: 'Experience — Michael Herron',
  description: 'Professional history and education — full-stack and integration engineering.',
};

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

                <p className="font-mono text-[var(--color-muted)] text-xs tracking-widest uppercase mb-1">
                  {role.period}
                </p>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-0.5">
                  {role.title}
                </h2>
                <p className="text-[var(--color-accent)] text-sm font-medium mb-4">
                  {role.company}
                </p>
                <ul className="space-y-2">
                  {role.bullets.map((bullet, j) => (
                    <li key={j} className="flex gap-3 text-sm text-[var(--color-muted)] leading-relaxed">
                      <span aria-hidden="true" className="text-[var(--color-accent)]/50 mt-0.5 shrink-0">
                        —
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Education */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-8">Education</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="p-6 rounded-xl border border-white/8 bg-[var(--color-surface)]">
          <p className="font-mono text-[var(--color-muted)] text-xs tracking-widest uppercase mb-1">
            {education.period}
          </p>
          <h3 className="text-xl font-bold mb-1">{education.institution}</h3>
          <p className="text-[var(--color-accent)] text-sm font-medium mb-1">{education.degree}</p>
          <p className="text-[var(--color-muted)] text-sm mb-5">GPA: {education.gpa}</p>

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
    </main>
  );
}
