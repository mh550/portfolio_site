import type { Metadata } from 'next';
import { skillCategories } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'Skills — Michael Herron',
  description: 'Technical skills across integration & automation, full-stack development, and more.',
};

export default function SkillsPage() {
  const featured = skillCategories.find((c) => c.featured);
  const rest = skillCategories.filter((c) => !c.featured);

  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Skills
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-4">
          Tech Stack
        </h1>
        <p className="text-[var(--color-muted)] text-lg mb-16 max-w-xl">
          Tools and technologies I use to build reliable systems.
        </p>
      </ScrollReveal>

      {/* Featured: Integration & Automation */}
      {featured && (
        <ScrollReveal delay={0.05}>
          <div className="relative mb-12 p-8 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-surface-alt)] glow-accent overflow-hidden">
            {/* Background accent glow */}
            <div
              aria-hidden="true"
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--color-accent)]/10 blur-3xl pointer-events-none"
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 rounded-full bg-[var(--color-accent)]" />
                <h2 className="text-2xl font-bold text-[var(--color-accent)]">
                  {featured.name}
                </h2>
                <span className="ml-auto font-mono text-xs text-[var(--color-accent)]/60 tracking-widest uppercase">
                  Differentiator
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {featured.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Other categories grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {rest.map((cat, i) => (
          <ScrollReveal key={cat.id} delay={0.05 + i * 0.05}>
            <div className="p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-white/15 transition-colors h-full">
              <h2 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">
                {cat.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-[var(--color-muted)] text-sm hover:text-[var(--color-foreground)] hover:border-white/15 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </main>
  );
}
