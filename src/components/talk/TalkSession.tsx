'use client';

import CallControls from '@/components/concierge/CallControls';
import { useConcierge } from '@/components/concierge/ConciergeProvider';
import DeepDiveLink from '@/components/concierge/DeepDiveLink';
import MemorySection from '@/components/concierge/MemorySection';
import MessageBox from './MessageBox';
import Transcript from './Transcript';

// The full-page view of the call on /talk (plan docs/plans/2026-10-20-VC2-talk-page.md). The call itself, its Room
// and every action, is ConciergeProvider's (D85), so leaving /talk for another page keeps it going. The memory strip
// and the Memory · Latency · Privacy tabs come after the message box (D90): beside it from lg, under it below.
export default function TalkSession() {
  const { state, sessionCount, sendMessage } = useConcierge();
  const { phase } = state;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-6">
        <CallControls />
        <DeepDiveLink phase={phase} />
        <Transcript lines={state.lines}>
          <MessageBox key={sessionCount} disabled={phase !== 'live'} onSend={sendMessage} />
        </Transcript>
      </div>
      <MemorySection className="space-y-4 self-start rounded-lg border border-white/10 bg-[var(--color-surface)] p-5" />
    </div>
  );
}
