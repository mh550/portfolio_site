import type { Decision } from '@/lib/data';
import CaseStudySection from './CaseStudySection';
import { caseStudySectionHeadings } from './sectionHeadings';

/** The recorded choices: what was chosen, over what, why, and what it cost. */
export default function DecisionLog({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) return null;

  return (
    <CaseStudySection id="decisions" heading={caseStudySectionHeadings.decisions}>
      <ul className="space-y-4">
        {decisions.map((d) => (
          <li key={d.id} className="rounded-xl border border-white/8 bg-[var(--color-surface)] p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-2">
              <span className="rounded border border-[var(--color-accent)]/25 px-2 py-0.5 font-mono text-xs text-[var(--color-accent)]">
                {d.id}
              </span>
              <h3 className="text-lg font-semibold leading-snug">{d.title}</h3>
            </div>
            <p className="text-[var(--color-muted)] text-base leading-relaxed">
              Chose {d.chose}
              {d.over && <> over {d.over}</>} because {d.because}
            </p>
            {d.cost && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                <span className="font-mono text-xs uppercase tracking-wide text-white/70">Cost:</span> {d.cost}
              </p>
            )}
          </li>
        ))}
      </ul>
    </CaseStudySection>
  );
}
