import type { Metadata } from 'next';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'About — Michael Herron',
  description: 'Duke CS grad turned full-stack and integration engineer. I build systems that are reliable and make sense to the people using them.',
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
          {/* Headshot photo — floated right */}
          <div className="float-right ml-8 mb-4 w-36 sm:w-44 md:w-52 lg:w-60 shrink-0">
            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[var(--color-surface-alt)]">
              <Image
                src="/photos/headshot.png"
                alt="Michael Herron headshot"
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 240px"
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Text — flows alongside the float, and spans full width below it */}
          <div className="space-y-8 text-lg leading-relaxed text-[var(--color-muted)]">
            <p>
              I started at{' '}
              <span className="text-[var(--color-foreground)] font-medium">Duke University</span>{' '}
              studying Engineering — understanding how things work has always driven me. Covid hit
              during my first year, and online learning wasn&apos;t it. I failed two classes, took
              a leave, moved to Colorado, worked at a coffee shop, and snowboarded. I came back,
              switched to Computer Science, and graduated with my B.S.
            </p>

            <p>
              After graduating, I joined{' '}
              <span className="text-[var(--color-foreground)] font-medium">Builder Clarity</span>{' '}
              as their{' '}
              <span className="text-[var(--color-foreground)] font-medium">first engineer</span>{' '}
              — a small consulting business helping contractors automate and integrate their
              systems. No tutorials, no senior engineers, no existing product. Just real clients
              and a directive to figure it out. I built low-code automations in Zapier, ETL
              pipelines feeding custom dashboards in Supabase and Metabase, and eventually tackled
              our most complex project: a{' '}
              <span className="text-[var(--color-accent)] font-medium">
                multi-tenant JobTread↔GoHighLevel integration
              </span>{' '}
              that connected CRM leads directly to job records, eliminating manual entry and data
              drift across client accounts. Building it taught me as much about managed auth and
              credential handling at scale as it did about what contractors actually need from
              their software.
            </p>

            <p>
              The company didn&apos;t scale fast enough, and I was let go. I&apos;m okay with
              that. It was a real engineering environment, and I learned more there than I would
              have anywhere else.
            </p>

            <p>
              I&apos;m currently an apprentice at{' '}
              <span className="text-[var(--color-foreground)] font-medium">MAXX Potential</span>
              , continuing to build my skills through structured mentorship and client-facing
              project work.
            </p>

            <p>
              I&apos;m also building projects where I&apos;m the target user. The first is a{' '}
              <span className="text-[var(--color-accent)] font-medium">skate video classifier</span>
              : submit a long session video, and the app automatically identifies and tracks each
              individual skater across clips using{' '}
              <span className="text-[var(--color-foreground)] font-medium">
                multi-object tracking and person re-identification
              </span>{' '}
              — no facial recognition required. Each skater&apos;s footage gets bucketed and
              distributed to the right person. The second is a{' '}
              <a
                href="https://github.com/mh550/hit-list"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <span className="text-[var(--color-accent)] font-medium">
                  snowboard street spot tracker
                </span>
              </a>{' '}
              — a mobile-first app for logging and organizing street spots, with structured data
              on approach speed, gear combinations, feature specs, and security risk, built for
              the way snowboarders actually scout and plan sessions.
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
          I care about building systems that are reliable and make sense to the people
          using them. If users are struggling, that&apos;s an engineering problem.
        </blockquote>
      </ScrollReveal>

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-16 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Outside the Terminal — text left, video right */}
      <ScrollReveal delay={0.05}>
        <h2 className="text-3xl font-bold mb-6">Outside the Terminal</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Text — left side */}
          <div className="flex-1 text-lg leading-relaxed text-[var(--color-muted)] space-y-4">
            <p>
              I fell in love with snowboarding when I was 16, even though I sucked at it for a while.
            </p>
            <p>
              It&apos;s taught me to let myself fail. To follow my curiousity, trust my gut, 
              and put the process over the outcome. To keep working at my weak points 
              until they become my strengths. The people who handle failure with grace are the ones who
              learn the fastest.
            </p>
          </div>

          {/* Video — right side */}
          <div className="w-full md:w-52 lg:w-60 shrink-0">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-[var(--color-surface-alt)]">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/videos/snowboarding-2.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

        </div>
      </ScrollReveal>
    </main>
  );
}
