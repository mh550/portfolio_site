'use client';

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { talkPage } from '@/lib/data/concierge';
import { isActive } from '@/components/talk/sessionReducer';
import { useConcierge } from './ConciergeProvider';
import { primary, quiet } from './buttons';
import { statusLine } from './status';

// The one Connect/Leave button, the mic toggle, Turn on sound and the status line, over the provider's call. Focus is
// the view's business, so it stays here: /talk uses it now, the drawer from P3-04.
export default function CallControls() {
  const { state, connect, leave, toggleMic, startAudio } = useConcierge();
  const { phase, micOn, audioBlocked } = state;
  // While the earlier conversation closes (D92) there is no Room yet, but Leave stops the retries.
  const inSession = isActive(phase);
  // Connect and Leave are one button, so focus stays on it as the phase changes.
  const primaryRef = useRef<HTMLButtonElement>(null);
  const wasInSession = useRef(false);

  // When a call ends, a control that went with it (Forget me, or the message box turning disabled) leaves focus on
  // <body>: hand it to Connect. Never on page load.
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const lost = !active || active === document.body || (active as HTMLButtonElement).disabled;
    if (wasInSession.current && !inSession && lost) primaryRef.current?.focus({ preventScroll: true });
    wasInSession.current = inSession;
  }, [inSession]);

  // Leave appears under the pointer as Connect turns into it: a double click on Connect must not end the call, nor
  // must a held Enter (its repeats are dropped in onPrimaryKeyDown).
  function onPrimaryClick(event: MouseEvent<HTMLButtonElement>) {
    if (!inSession) void connect();
    else if (event.detail <= 1) leave();
  }

  function onPrimaryKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat) event.preventDefault();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <button
        type="button"
        ref={primaryRef}
        className={inSession ? quiet : primary}
        onClick={onPrimaryClick}
        onKeyDown={onPrimaryKeyDown}
      >
        {inSession ? talkPage.labels.leave : talkPage.labels.connect}
      </button>
      {phase === 'live' && (
        <button type="button" className={quiet} onClick={toggleMic}>
          {micOn ? talkPage.labels.micOn : talkPage.labels.micOff}
        </button>
      )}
      {inSession && audioBlocked && (
        <button type="button" className={primary} onClick={startAudio}>
          {talkPage.labels.startAudio}
        </button>
      )}
      <p role="status" className="text-[var(--color-muted)]">
        {statusLine(state)}
      </p>
    </div>
  );
}
