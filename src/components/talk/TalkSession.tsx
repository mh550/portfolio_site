'use client';

import Link from 'next/link';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import CallControls from '@/components/concierge/CallControls';
import { useConcierge } from '@/components/concierge/ConciergeProvider';
import { forgetLine } from '@/components/concierge/status';
import ForgetMeButton from './ForgetMeButton';
import LatencyPanel from './LatencyPanel';
import MemoryPanel from './MemoryPanel';
import MessageBox from './MessageBox';
import Transcript from './Transcript';

// The full-page view of the call on /talk (plan docs/plans/2026-10-20-VC2-talk-page.md). The call itself, its Room
// and every action, is ConciergeProvider's (D85), so leaving /talk for another page keeps it going.
export default function TalkSession() {
  const { state, sessionCount, sendMessage, forgetMe } = useConcierge();
  const { phase, forget } = state;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-6">
        <CallControls />
        {(phase === 'offline' || phase === 'busy') && (
          <p>
            <Link
              href={talkPage.deepDiveHref}
              className={`text-[var(--color-accent)] underline underline-offset-4 hover:decoration-2 ${focusRing}`}
            >
              {talkPage.deepDiveLabel}
            </Link>
          </p>
        )}
        <Transcript lines={state.lines}>
          <MessageBox key={sessionCount} disabled={phase !== 'live'} onSend={sendMessage} />
        </Transcript>
      </div>
      <div className="space-y-6">
        <MemoryPanel memory={state.memory} />
        <LatencyPanel turns={state.turns} />
        <div className="space-y-3">
          {phase === 'live' && <ForgetMeButton onForget={() => void forgetMe()} busy={forget === 'busy'} />}
          <p aria-live="polite" className={forget === 'failed' ? 'text-red-400' : 'text-[var(--color-muted)]'}>
            {forgetLine(state)}
          </p>
        </div>
      </div>
    </div>
  );
}
