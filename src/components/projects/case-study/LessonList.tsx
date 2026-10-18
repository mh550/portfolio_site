import type { Lesson } from '@/lib/data';
import CaseStudySection from './CaseStudySection';

const label = 'block font-mono text-xs uppercase tracking-wide mb-1';

/** What broke, and the rule each break left behind. */
export default function LessonList({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) return null;

  return (
    <CaseStudySection id="lessons" heading="What Broke">
      <ul className="space-y-4">
        {lessons.map((l, i) => (
          <li
            key={`${i}-${l.broke}`}
            className="grid gap-3 rounded-xl border border-white/8 bg-[var(--color-surface)] p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-start"
          >
            <p className="text-[var(--color-muted)] text-base leading-relaxed">
              <span className={`${label} text-white/70`}>What broke</span>{' '}
              {l.broke}
            </p>
            <span aria-hidden="true" className="w-fit rotate-90 text-[var(--color-accent)] sm:rotate-0 sm:pt-5">
              →
            </span>
            <p className="text-base leading-relaxed">
              <span className={`${label} text-[var(--color-accent)]`}>The rule</span>{' '}
              {l.rule}
            </p>
          </li>
        ))}
      </ul>
    </CaseStudySection>
  );
}
