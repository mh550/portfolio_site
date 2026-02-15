import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'About — Michael Herron',
  description: 'Duke CS grad, full-stack developer, and integration engineer. I build systems that connect things.',
};

const traits = [
  { emoji: '🏔', label: 'Snowboarder' },
  { emoji: '🛹', label: 'Skateboarder' },
  { emoji: '🏄', label: 'Wakeboarder' },
  { emoji: '🎿', label: 'Snowboard Coach' },
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      {/* Header */}
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          About
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-12">
          The Arc
        </h1>
      </ScrollReveal>

      {/* Story */}
      <div className="space-y-8 text-lg leading-relaxed text-[var(--color-muted)]">
        <ScrollReveal delay={0.05}>
          <p>
            I graduated from{' '}
            <span className="text-[var(--color-foreground)] font-medium">Duke University</span>{' '}
            with a B.S. in Computer Science and a minor in Visual & Media Studies —
            a combination that shaped how I think about software: the engineering has to work,
            and the experience has to feel right.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p>
            After graduating, I was hired as the{' '}
            <span className="text-[var(--color-foreground)] font-medium">first engineer</span>{' '}
            at a startup. No playbook, no senior engineers to shadow — just a real product,
            real users, and a mandate to figure it out. I built scalable multi-tenant integration
            systems from scratch, migrated platforms when they stopped serving the product,
            and learned that good engineering is relentless attention to the user&apos;s actual problem.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p>
            My work centers on{' '}
            <span className="text-[var(--color-accent)] font-medium">
              transforming complex, scattered processes into reliable, intuitive systems
            </span>
            . I reject the idea of &ldquo;user error&rdquo; — if users are struggling, the system
            needs to be better. That philosophy drives every decision I make, from data mapping
            strategy to UI hierarchy.
          </p>
        </ScrollReveal>
      </div>

      {/* Divider */}
      <ScrollReveal delay={0.1}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Philosophy */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-6">Philosophy</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <blockquote className="border-l-2 border-[var(--color-accent)] pl-6 text-xl text-[var(--color-foreground)] font-light leading-relaxed mb-12">
          &ldquo;Design for the user first. Every abstraction, every API contract, every data
          model should ultimately serve the person on the other end of the interface.&rdquo;
        </blockquote>
      </ScrollReveal>

      {/* Divider */}
      <ScrollReveal delay={0.1}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Personal */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-4">Outside the Terminal</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <p className="text-lg leading-relaxed text-[var(--color-muted)] mb-8">
          When I&apos;m not building software, I&apos;m usually on a mountain or a skateboard.
          I coached snowboarding at{' '}
          <span className="text-[var(--color-foreground)] font-medium">
            High Cascade Snowboard Camp
          </span>{' '}
          for two summers — working with 12–18 athletes per session, designing drills, and
          figuring out how to explain complex movement patterns simply. That experience shaped
          how I approach collaboration and technical communication: meet people where they are,
          be patient, and break it down.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <div className="flex flex-wrap gap-4">
          {traits.map(({ emoji, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[var(--color-surface)] text-sm text-[var(--color-foreground)]"
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </span>
          ))}
        </div>
      </ScrollReveal>
    </main>
  );
}
