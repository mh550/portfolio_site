import { methodSteps } from '@/lib/data';

interface MethodStripProps {
  className?: string;
  /** Show each step's line at every width (D31, /approach). Default: labels only below md (the hero). */
  showLines?: boolean;
}

/** The five method steps as one row (D23). Below md only the labels show; the lines are visible from md up and
 *  read by screen readers at every width (D31). With `showLines` the lines are visible at every width. */
export default function MethodStrip({ className, showLines = false }: MethodStripProps) {
  return (
    // role="list": Safari drops list semantics from a list-style: none list
    <ol
      role="list"
      aria-label="How I work"
      className={`${
        showLines ? 'grid gap-4' : 'flex flex-wrap items-center justify-center gap-x-2 gap-y-2 md:grid'
      } md:grid-cols-5 md:items-start md:gap-4 ${className ?? ''}`}
    >
      {methodSteps.map((step, i) => (
        <li key={step.id} className={showLines ? 'text-left md:text-center' : 'text-center'}>
          <span className="font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
            {step.label}
          </span>
          {i < methodSteps.length - 1 && (
            <span aria-hidden="true" className={`mx-2 text-[var(--color-muted)]${showLines ? ' hidden md:inline' : ''}`}>
              →
            </span>
          )}
          <p
            className={
              showLines
                ? 'mt-1 text-sm leading-snug md:mt-2 md:text-xs text-[var(--color-muted)]'
                : 'sr-only md:not-sr-only md:mt-2 md:text-xs md:leading-snug md:text-[var(--color-muted)]'
            }
          >
            {step.line}
          </p>
        </li>
      ))}
    </ol>
  );
}
