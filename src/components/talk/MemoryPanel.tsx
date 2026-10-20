import type { ReactNode } from 'react';
import type { MemoryBody, MemoryFact } from '@/lib/concierge/contract';
import { talkPage } from '@/lib/data/concierge';
import TalkPanel from './TalkPanel';
import { DASH, orDash, percent } from './format';

// Facts only arrive on the client (from a text stream), so this runs in the visitor's locale and time zone.
export const LEARNED_AT_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

function LearnedAt({ iso }: { iso: string | null }) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return <>{DASH}</>;
  return <time dateTime={iso!}>{new Intl.DateTimeFormat(undefined, LEARNED_AT_FORMAT).format(date)}</time>;
}

function FactRow({ fact }: { fact: MemoryFact }) {
  const labels = talkPage.memory.fact;
  const details: [string, ReactNode][] = [
    [labels.channel, orDash(fact.channel)],
    [labels.source, orDash(fact.source)],
    [labels.learnedAt, <LearnedAt key="learned" iso={fact.learned_at} />],
    [labels.confidence, percent(fact.confidence)],
  ];
  return (
    <li className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p className="break-words">
        <span className="mr-2 font-mono text-xs uppercase tracking-wide text-[var(--color-accent)]">{fact.slot}</span>{' '}
        <span className="text-white">{fact.value}</span>
      </p>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[var(--color-muted)]">{label}</dt>
            <dd className="break-words text-white/90">{value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

// What the concierge remembers about the visitor, as the agent last sent it on `concierge.memory` (spec §4).
export default function MemoryPanel({ memory }: { memory: MemoryBody | null }) {
  const copy = talkPage.memory;
  return (
    <TalkPanel id="talk-memory" heading={talkPage.headings.memory}>
      {memory && (
        <p className="mb-4 text-white/90">
          {`${copy.talkingTo} ${memory.visitor.name || talkPage.empty.newVisitor} · ${copy.visit} ${memory.visitor.visits}`}
        </p>
      )}
      {memory && memory.facts.length > 0 ? (
        <ul aria-labelledby="talk-memory" className="space-y-3">
          {memory.facts.map((fact, i) => (
            // §4 doesn't promise unique ids, so the index keeps keys unique.
            <FactRow key={`${fact.id}-${i}`} fact={fact} />
          ))}
        </ul>
      ) : (
        <p className="text-[var(--color-muted)]">{talkPage.empty.memory}</p>
      )}
      {memory?.summary && (
        <div className="mt-4 border-t border-white/10 pt-3 text-sm">
          <p className="text-[var(--color-muted)]">{copy.summary}</p>
          <p className="text-white/90">{memory.summary}</p>
        </div>
      )}
    </TalkPanel>
  );
}
