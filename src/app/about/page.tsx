import type { Metadata } from 'next';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'About — Michael Herron',
  description: 'Duke CS grad, full-stack developer, and integration engineer. I build systems that connect things.',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      {/* Header */}
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          About
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-12">
          My Story
        </h1>
      </ScrollReveal>

      {/* Story — photo floated right, text wraps alongside and continues below */}
      <ScrollReveal delay={0.05}>
        <div className="mb-8">
          {/* Photo — floated right; replace /public/photos/headshot.jpg with your headshot */}
          <div className="float-right ml-8 mb-4 w-36 sm:w-44 md:w-52 lg:w-60 shrink-0">
            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[var(--color-surface-alt)]">
              <Image
                src="/photos/headshot.jpg"
                alt="Michael Herron"
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 240px"
                priority
              />
            </div>
          </div>

          {/* Text — flows alongside the float, spans full width below it */}
          <div className="space-y-8 text-lg leading-relaxed text-[var(--color-muted)]">
            <p>
              I graduated from{' '}
              <span className="text-[var(--color-foreground)] font-medium">Duke University</span>{' '}
              with a B.S. in Computer Science and a minor in Visual & Media Studies —
              a combination that shaped how I think about software: the engineering has to work,
              and the experience has to feel right.
            </p>

            <p>
              After graduating, I was hired as the{' '}
              <span className="text-[var(--color-foreground)] font-medium">first engineer</span>{' '}
              at a startup. No playbook, no senior engineers to shadow — just a real product,
              real users, and a mandate to figure it out. I built scalable multi-tenant integration
              systems from scratch, migrated platforms when they stopped serving the product,
              and learned that good engineering is relentless attention to the user&apos;s actual problem.
            </p>

            <p>
              My work centers on{' '}
              <span className="text-[var(--color-accent)] font-medium">
                transforming complex, scattered processes into reliable, intuitive systems
              </span>
              . I reject the idea of &ldquo;user error&rdquo; — if users are struggling, the system
              needs to be better. That philosophy drives every decision I make, from data mapping
              strategy to UI hierarchy.
            </p>
          </div>

          <div className="clear-both" />
        </div>
      </ScrollReveal>

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Philosophy */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-6">Philosophy</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <blockquote className="border-l-2 border-[var(--color-accent)] pl-6 text-xl text-[var(--color-foreground)] font-light leading-relaxed mb-12">
          Design for the user first. Every abstraction, every API contract, every data
          model should ultimately serve the person on the other end of the interface.
        </blockquote>
      </ScrollReveal>

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Outside the Terminal — media left, text right */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-6">Outside the Terminal</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Media column — left side
              Drop files at:
                /public/photos/mount-hood.jpg  (4:3, landscape)
                /public/videos/snowboarding-1.mp4
                /public/videos/snowboarding-2.mp4
                /public/videos/snowboarding-3.mp4 */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-2">
            {/* Main photo — 4:3 */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-[var(--color-surface-alt)]">
              <Image
                src="/photos/mount-hood.jpg"
                alt="Michael at Mount Hood"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
            </div>

            {/* 3 snowboarding clips — portrait 3:4 */}
            <div className="grid grid-cols-3 gap-2">
              {(['snowboarding-1', 'snowboarding-2', 'snowboarding-3'] as const).map((clip) => (
                <div
                  key={clip}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-[var(--color-surface-alt)]"
                >
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={`/videos/${clip}.mp4`} type="video/mp4" />
                  </video>
                </div>
              ))}
            </div>
          </div>

          {/* Text — right side
              REWRITE THIS: replace the paragraph(s) below with your own story.
              Keep the wrapping <div> and className as-is for consistent styling. */}
          <div className="flex-1 text-lg leading-relaxed text-[var(--color-muted)]">
            <p>
              {/* Your text goes here. */}
              When I&apos;m not building software, I&apos;m usually on a mountain or a skateboard.
            </p>
          </div>

        </div>
      </ScrollReveal>
    </main>
  );
}
