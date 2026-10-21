import type { MetricsBody } from '@/lib/concierge/contract';
import { TURN_PATH_FIELDS, cachedShare, median, summarise } from '@/lib/concierge/latency';
import { latencyLabels, talkPage } from '@/lib/data/concierge';
import { DASH, ms, percent } from './format';

const numberCell = 'whitespace-nowrap py-1.5 pl-3 text-right tabular-nums text-white';

function Row({ label, last, median }: { label: string; last: string; median: string }) {
  return (
    <tr className="border-t border-white/10">
      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-white/90">
        {label}
      </th>
      <td className={numberCell}>{last}</td>
      <td className={numberCell}>{median}</td>
    </tr>
  );
}

// How long each turn took, from the agent's `concierge.metrics` bodies (spec §4): the newest turn beside the running
// median of every turn this visit. The Latency tab's content (PanelTabs, P3-06): the tab names it, so no heading here.
export default function LatencyPanel({ turns }: { turns: MetricsBody[] }) {
  const last = turns.at(-1);
  if (!last) {
    return <p className="text-[var(--color-muted)]">{talkPage.empty.latency}</p>;
  }
  const summary = summarise(turns);
  // The preload runs once, at connect, so it is shown once: from the first turn that reported it.
  const preload = turns.find((t) => t.preload_ms !== null)?.preload_ms ?? null;
  // Once compacted, the history stays compacted: Yes if any turn said so, No if turns reported only false.
  const flags = turns.map((t) => t.compacted);
  const compacted = flags.includes(true) ? latencyLabels.yes : flags.includes(false) ? latencyLabels.no : DASH;
  const { columns } = latencyLabels;
  return (
    <>
      <table className="w-full text-sm">
        <caption className="mb-2 text-left text-[var(--color-muted)]">{`${latencyLabels.turn} ${last.turn}`}</caption>
        <thead>
          <tr className="text-[var(--color-muted)]">
            <th scope="col" className="pb-1.5 pr-3 text-left font-normal">
              {columns.label}
            </th>
            <th scope="col" className="whitespace-nowrap pb-1.5 pl-3 text-right font-normal">
              {columns.last}
            </th>
            <th scope="col" className="whitespace-nowrap pb-1.5 pl-3 text-right font-normal">
              {columns.median}
            </th>
          </tr>
        </thead>
        <tbody>
          {TURN_PATH_FIELDS.map((field) => (
            <Row
              key={field}
              label={latencyLabels[field]}
              last={ms(summary[field].last)}
              median={ms(summary[field].median)}
            />
          ))}
          <Row
            label={latencyLabels.cachedShare}
            last={percent(cachedShare(last))}
            median={percent(median(turns.map(cachedShare)))}
          />
          {summary.extraction_ms.median !== null && (
            <Row
              label={latencyLabels.extraction_ms}
              last={ms(summary.extraction_ms.last)}
              median={ms(summary.extraction_ms.median)}
            />
          )}
        </tbody>
      </table>
      <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-sm">
        <dt className="text-white/90">{latencyLabels.preload_ms}</dt>
        <dd className="whitespace-nowrap text-right tabular-nums text-white">{ms(preload)}</dd>
        <dt className="text-white/90">{latencyLabels.compacted}</dt>
        <dd className="whitespace-nowrap text-right text-white">{compacted}</dd>
      </dl>
    </>
  );
}
