'use client';

import { useId } from 'react';
import { talkPage } from '@/lib/data/concierge';
import { useConcierge } from './ConciergeProvider';
import MemoryStrip from './MemoryStrip';
import PanelTabs from './PanelTabs';
import { shownMemory } from './status';

// The memory strip and the Memory · Latency · Privacy tabs (D90) in a section under a visually hidden h2, so heading
// navigation reaches them: the drawer's (`compact`) and /talk's. Before a call they show the cached body (D91).
export default function MemorySection({ compact = false, className }: { compact?: boolean; className: string }) {
  const { state, cachedMemory, forgetMe } = useConcierge();
  const headingId = useId();
  const shown = shownMemory(state, cachedMemory);

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="sr-only">
        {talkPage.memoryView.heading}
      </h2>
      <MemoryStrip memory={shown.memory} asOf={shown.asOf} />
      <PanelTabs state={state} shown={shown} onForget={() => void forgetMe()} compact={compact} />
    </section>
  );
}
