'use client';

import { useState } from 'react';
import type { MemoryBody } from '@/lib/concierge/contract';
import { talkPage } from '@/lib/data/concierge';
import { DASH, dateTime } from '@/components/talk/format';

export type StripKind = 'profile' | 'episodes' | 'events' | 'knowledge' | 'working';
export type StripCounts = Record<StripKind, number | null>;

// Each kind's dot, as whole class strings so Tailwind sees them (D90's tokens in globals.css).
const KINDS: { kind: StripKind; dot: string }[] = [
  { kind: 'profile', dot: 'bg-[var(--color-mem-profile)]' },
  { kind: 'episodes', dot: 'bg-[var(--color-mem-episode)]' },
  { kind: 'events', dot: 'bg-[var(--color-mem-event)]' },
  { kind: 'knowledge', dot: 'bg-[var(--color-mem-knowledge)]' },
  { kind: 'working', dot: 'bg-[var(--color-mem-working)]' },
];

// After the `animation` shorthand animate-pulse sets, so the pulse runs once.
const PULSE = 'motion-safe:animate-pulse motion-safe:[animation-iteration-count:1]';

/** What each chip counts (plan § Memory view): a v1 body reports only Profile, from `facts`; null is "not reported". */
export function stripCounts(memory: MemoryBody | null): StripCounts {
  if (!memory) return { profile: null, episodes: null, events: null, knowledge: null, working: null };
  const visitor = memory.about_visitor ?? null;
  const agent = memory.about_agent ?? null;
  return {
    profile: (visitor?.profile ?? memory.facts).length,
    episodes: visitor?.episodes?.length ?? null,
    events: visitor?.events?.length ?? null,
    knowledge: agent?.knowledge?.sections.length ?? null,
    working: agent?.working?.items ?? null,
  };
}

interface Seen {
  memory: MemoryBody | null;
  counts: StripCounts;
  changed: Set<StripKind>;
  // Bumped on each change: a chip's key, so a chip that changes twice in a row is a fresh element and pulses again.
  version: Record<StripKind, number>;
}

// The strip under the message box (D90): one chip per kind, its colour and its count. A chip whose count just
// changed pulses once, for that body. The previous counts are kept in state, set during render when the body changes
// (React's previous-props pattern), never in a ref, so StrictMode's double render can't swallow a pulse.
// `asOf`: the body is the cached one from the last call, saved then (D91): greyed, named with its time, and its arrival
// pulses nothing; the first live body after it pulses what differs from it.
export default function MemoryStrip({ memory, asOf = null }: { memory: MemoryBody | null; asOf?: string | null }) {
  const stale = asOf !== null;
  const [seen, setSeen] = useState<Seen>(() => ({
    memory,
    counts: stripCounts(memory),
    changed: new Set(),
    version: { profile: 0, episodes: 0, events: 0, knowledge: 0, working: 0 },
  }));
  let current = seen;
  if (memory !== seen.memory) {
    const counts = stripCounts(memory);
    // Only a reported count pulses: a chip going back to the dash (the call ended) stays still.
    const changed = new Set(
      stale ? [] : KINDS.map((k) => k.kind).filter((k) => counts[k] !== null && counts[k] !== seen.counts[k])
    );
    const version = { ...seen.version };
    for (const k of changed) version[k] += 1;
    current = { memory, counts, changed, version };
    setSeen(current);
  }

  const { kinds, notReported, strip } = talkPage.memoryView;
  const savedAt = stale ? dateTime(asOf) : null;
  return (
    <ul
      aria-label={savedAt ? `${strip}, ${talkPage.memoryView.asOf} ${savedAt}` : strip}
      data-stale={stale ? 'true' : undefined}
      className={`flex flex-wrap gap-2 ${stale ? '**:text-[var(--color-muted)] [&_[data-dot]]:opacity-60' : ''}`}
    >
      {KINDS.map(({ kind, dot }) => {
        const n = current.counts[kind];
        // A dash from a body is "not reported by this agent version"; with no body yet nothing has been reported.
        const unreported = n === null && memory !== null;
        return (
          <li
            key={`${kind}-${current.version[kind]}`}
            data-kind={kind}
            title={unreported ? notReported : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-[var(--color-background)] px-2.5 py-1 text-xs text-white/90 ${current.changed.has(kind) ? PULSE : ''}`}
          >
            <span aria-hidden="true" data-dot className={`h-2 w-2 rounded-full ${dot}`} />
            {kinds[kind]}{' '}
            <span data-count className="font-mono tabular-nums text-white">
              {n === null ? DASH : n}
            </span>
            {unreported && <span className="sr-only">{` ${notReported}`}</span>}
          </li>
        );
      })}
    </ul>
  );
}
