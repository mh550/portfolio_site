import type { Metadata } from 'next';
import Link from 'next/link';
import MethodStrip from '@/components/MethodStrip';
import ScrollReveal from '@/components/ScrollReveal';
import {
  approachClosing,
  approachIntro,
  exampleHref,
  getProjectBySlug,
  methodSteps,
  principles,
  profile,
  resolvedExamples,
  type CaseStudyAnchor,
  type PrincipleExample,
} from '@/lib/data';

export const metadata: Metadata = {
  title: 'Approach — Michael Herron',
  description: profile.subline,
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';

// Where a link lands, named as the case study heads it (method labels; CaseStudySection headings).
const SECTION_NAMES: Partial<Record<CaseStudyAnchor, string>> = {
  decisions: 'Key Decisions',
  iterations: 'How It Evolved',
  lessons: 'What Broke',
};

function linkName({ projectSlug, anchor }: PrincipleExample): string {
  const section = !anchor
    ? 'Project page'
    : (methodSteps.find((s) => s.id === anchor)?.label ?? SECTION_NAMES[anchor]);
  return `${getProjectBySlug(projectSlug!)!.title}: ${section}`;
}

export default function ApproachPage() {
  const hasHarness = Boolean(getProjectBySlug('agent-harness'));

  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Approach
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">How I work</h1>
        <div className="space-y-2 text-xl leading-relaxed max-w-2xl mb-12">
          {approachIntro.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <MethodStrip showLines className="mb-16" />
      </ScrollReveal>

      <div className="space-y-14">
        {principles.map((principle) => {
          const examples = resolvedExamples(principle);
          return (
            <ScrollReveal key={principle.id}>
              <section id={principle.id} aria-labelledby={`${principle.id}-heading`} className="scroll-mt-24">
                <h2 id={`${principle.id}-heading`} className="text-2xl sm:text-3xl font-bold mb-3">
                  {principle.title}
                </h2>
                <p className="text-lg leading-relaxed text-[var(--color-foreground)] mb-6">{principle.summary}</p>
                {examples.length > 0 && (
                  <ul className="space-y-5">
                    {examples.map((example) => {
                      const href = exampleHref(example);
                      return (
                        <li key={example.text} className="border-l border-[var(--color-accent)]/25 pl-4">
                          <p className="leading-relaxed text-[var(--color-muted)]">{example.text}</p>
                          {href && (
                            <Link
                              href={href}
                              className={`mt-1 inline-block text-sm text-[var(--color-accent)] underline underline-offset-4 ${FOCUS}`}
                            >
                              {linkName(example)}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </ScrollReveal>
          );
        })}
      </div>

      <ScrollReveal>
        <p className="mt-16 text-lg leading-relaxed">
          {approachClosing}{' '}
          {hasHarness ? (
            <Link href="/projects/agent-harness" className={`text-[var(--color-accent)] underline underline-offset-4 ${FOCUS}`}>
              Read the agent harness case study
            </Link>
          ) : (
            <Link href="/projects" className={`text-[var(--color-accent)] underline underline-offset-4 ${FOCUS}`}>
              See the projects
            </Link>
          )}
        </p>
      </ScrollReveal>
    </main>
  );
}
