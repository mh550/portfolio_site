import Link from 'next/link';
import { focusRing } from '@/components/focusRing';
import { loopSteps, type LoopStepId } from '@/lib/data';

interface MethodStripProps {
  className?: string;
  /** The list's accessible name; /about, under its How I work h2, passes its own. */
  label?: string;
  /** Show each step's line at every width (D31, /about). Default: labels only below md (the hero).
   *  Its two users: the hero and /about's How I work section (/approach redirects there, D79). */
  showLines?: boolean;
  /** One link under a step's line (D80, /about How I work: `loopStepExample`). */
  examples?: Partial<Record<LoopStepId, { href: string; text: string }>>;
}

/** The five loop steps (`loopSteps`, D77) as one row (D23). Below md only the labels show; the lines are visible from md up and
 *  read by screen readers at every width (D31). With `showLines` the lines are visible at every width. */
export default function MethodStrip({ className, label = 'How I work', showLines = false, examples }: MethodStripProps) {
  return (
    // role="list": Safari drops list semantics from a list-style: none list
    <ol
      role="list"
      aria-label={label}
      className={`${
        showLines ? 'grid gap-4' : 'flex flex-wrap items-center justify-center gap-x-2 gap-y-2 md:grid'
      } md:grid-cols-5 md:items-start md:gap-4 ${className ?? ''}`}
    >
      {loopSteps.map((step, i) => (
        <li key={step.id} className={showLines ? 'text-left md:text-center' : 'text-center'}>
          <span className="font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
            {step.label}
          </span>
          {i < loopSteps.length - 1 && (
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
          <StepLink example={examples?.[step.id]} />
        </li>
      ))}
    </ol>
  );
}

function StepLink({ example }: { example?: { href: string; text: string } }) {
  if (!example) return null;
  return (
    <Link
      href={example.href}
      className={`mt-2 inline-block text-sm leading-snug md:text-xs text-[var(--color-accent)] underline underline-offset-4 hover:decoration-2 ${focusRing}`}
    >
      {example.text}
    </Link>
  );
}
