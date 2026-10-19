import type { Iteration } from '@/lib/data';
import CaseStudySection from './CaseStudySection';
import { caseStudySectionHeadings } from './sectionHeadings';

/** How the project evolved: when · label, then what changed and why. */
export default function IterationTimeline({ iterations }: { iterations?: Iteration[] }) {
  if (!iterations || iterations.length === 0) return null;

  return (
    <CaseStudySection id="iterations" heading={caseStudySectionHeadings.iterations}>
      <ol className="space-y-6 border-l border-white/10 pl-5">
        {iterations.map((it, i) => (
          <li key={`${i}-${it.when}`}>
            <p className="font-mono text-xs tracking-wide text-[var(--color-accent)] mb-1">
              {it.when} · {it.label}
            </p>
            <p className="text-base leading-relaxed">{it.what}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{it.why}</p>
          </li>
        ))}
      </ol>
    </CaseStudySection>
  );
}
