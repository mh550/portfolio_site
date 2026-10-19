import type { Metric } from '@/lib/data';

const ONE_ROW_MAX_VALUE_CHARS = 7;

/** Big-number impact callouts. Renders nothing when there are no metrics. */
export default function MetricStrip({ metrics }: { metrics?: Metric[] }) {
  if (!metrics || metrics.length === 0) return null;

  // Four in a three-column grid would leave the fourth alone on a row: 2×2, then one row from md,
  // where the narrower cards wrap labels to two lines (balanced, so no word sits alone). A value
  // longer than "≈ $2.53" wraps in a quarter-width card and stretches the row, so that strip stays 2×2.
  const fourUp = metrics.length === 4;
  const oneRow = fourUp && metrics.every((m) => m.value.length <= ONE_ROW_MAX_VALUE_CHARS);
  const columns = fourUp ? `sm:grid-cols-2${oneRow ? ' md:grid-cols-4' : ''}` : 'sm:grid-cols-3';

  return (
    <dl className={`grid grid-cols-1 gap-3 ${columns}`}>
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-white/8 bg-[var(--color-surface)] px-4 py-5 text-center"
        >
          <dt className="sr-only">{m.label}</dt>
          <dd className="text-2xl font-bold leading-tight text-[var(--color-accent)] sm:text-3xl">
            {m.value}
          </dd>
          <p
            className={`mt-1 text-xs leading-snug text-[var(--color-muted)]${fourUp ? ' text-balance' : ''}`}
          >
            {m.label}
          </p>
        </div>
      ))}
    </dl>
  );
}
