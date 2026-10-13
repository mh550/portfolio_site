import type { Metric } from '@/lib/data';

/** Big-number impact callouts. Renders nothing when there are no metrics. */
export default function MetricStrip({ metrics }: { metrics?: Metric[] }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-white/8 bg-[var(--color-surface)] px-4 py-5 text-center"
        >
          <dt className="sr-only">{m.label}</dt>
          <dd className="text-2xl font-bold leading-tight text-[var(--color-accent)] sm:text-3xl">
            {m.value}
          </dd>
          <p className="mt-1 text-xs leading-snug text-[var(--color-muted)]">{m.label}</p>
        </div>
      ))}
    </dl>
  );
}
