import { methodSteps, type CaseStudy } from '@/lib/data';
import CaseStudySection from './CaseStudySection';

/** The five method steps, labels from approach.ts, text from the project. Each step is an anchor. */
export default function MethodSteps({ method }: { method: CaseStudy['method'] }) {
  return (
    <CaseStudySection id="method" heading="The Method">
      <ol className="space-y-5">
        {methodSteps.map((step, i) => (
          <li key={step.id} id={step.id} className="scroll-mt-24 border-l border-[var(--color-accent)]/25 pl-4">
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-accent)] mb-1">
              <span aria-hidden="true">{String(i + 1).padStart(2, '0')} </span>
              {step.label}
            </h3>
            <p className="text-[var(--color-muted)] text-base leading-relaxed">{method[step.id]}</p>
          </li>
        ))}
      </ol>
    </CaseStudySection>
  );
}
