import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import { competencies, evidenceIntro, resolvedItems, type EvidenceItem } from '@/lib/data';

const TITLE = 'Evidence of practice — Michael Herron';

// Noindex and off the Navbar (D7); M8's sitemap leaves it out too.
export const metadata: Metadata = {
  title: TITLE,
  description: evidenceIntro.reading,
  robots: { index: false },
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';
const LINK = `leading-relaxed text-[var(--color-foreground)] underline decoration-[var(--color-accent)]/50 underline-offset-4 hover:text-[var(--color-accent)] ${FOCUS}`;

function ItemLink({ item }: { item: EvidenceItem }) {
  if (item.href.startsWith('https://')) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={LINK}>
        {item.text}
        <span className="sr-only"> (opens in a new tab)</span>
        {/* U+00A0 keeps the arrow on the last word's line; U+FE0E draws it as text, not as an emoji tile. */}
        <span aria-hidden="true">{'\u00A0↗\uFE0E'}</span>
      </a>
    );
  }
  return (
    <Link href={item.href} className={LINK}>
      {item.text}
    </Link>
  );
}

export default function EvidencePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">Evidence</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">{TITLE}</h1>
        <p className="text-xl leading-relaxed max-w-2xl mb-3">{evidenceIntro.reading}</p>
        <p className="leading-relaxed max-w-2xl text-[var(--color-muted)] mb-14">{evidenceIntro.mapping}</p>
      </ScrollReveal>

      <div className="space-y-12">
        {competencies.map((competency) => {
          const items = resolvedItems(competency);
          return (
            <ScrollReveal key={competency.id}>
              <section id={competency.id} aria-labelledby={`${competency.id}-heading`} className="scroll-mt-24">
                <h2 id={`${competency.id}-heading`} className="text-2xl sm:text-3xl font-bold mb-5">
                  {competency.title}
                </h2>
                {items.length > 0 && (
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.text} className="border-l border-[var(--color-accent)]/25 pl-4">
                        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-accent)] mb-1">
                          {item.context}
                        </p>
                        <ItemLink item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </ScrollReveal>
          );
        })}
      </div>
    </main>
  );
}
