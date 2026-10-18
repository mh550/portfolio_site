import Link from 'next/link';
import type { ProjectLink } from '@/lib/data';
import CaseStudySection from './CaseStudySection';

// U+FE0E keeps ● and ▶ as text glyphs (iOS Safari otherwise draws them as colour emoji).
const GLYPHS: Record<ProjectLink['kind'], string> = { repo: '</>', live: '●\uFE0E', doc: '¶', demo: '▶\uFE0E' };

// A site path: one leading slash, not a protocol-relative `//host` or `/\host`.
const isInternal = (href: string) => /^\/(?![/\\])/.test(href);

const linkClass =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/8 bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 transition-colors';

/** The one link list on a case study. Site paths stay in the tab; everything else opens a new one. */
export default function ProjectLinks({ links }: { links: ProjectLink[] }) {
  if (links.length === 0) return null;

  return (
    <CaseStudySection id="links" heading="Links">
      <ul className="flex flex-wrap gap-3">
        {links.map((l, i) => {
          const glyph = (
            <span aria-hidden="true" className="font-mono text-xs">
              {GLYPHS[l.kind]}
            </span>
          );
          return (
            <li key={`${i}-${l.href}`}>
              {isInternal(l.href) ? (
                <Link href={l.href} className={linkClass}>
                  {glyph}
                  {l.label}
                </Link>
              ) : (
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {glyph}
                  {l.label}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </CaseStudySection>
  );
}
