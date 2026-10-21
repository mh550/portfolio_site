'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { talkWidget } from '@/lib/data/concierge';
import MessageBox from '@/components/talk/MessageBox';
import Transcript from '@/components/talk/Transcript';
import CallControls from './CallControls';
import { useConcierge } from './ConciergeProvider';
import DeepDiveLink from './DeepDiveLink';
import { quiet } from './buttons';

const TITLE_ID = 'concierge-panel-title';

// The concierge on every chrome page but /talk (D86, plan docs/plans/2026-10-21-P3-concierge-in-site.md § Panel): a
// non-modal drawer, 420 px on the right from lg, a bottom sheet under the Navbar below it. No focus trap, no inert, no
// scroll lock: the page stays usable while the call goes on. In the DOM only while open; Minimize and Esc close it
// and leave the call alone, and the widget takes focus back (VoiceWidget).
export default function ConciergePanel() {
  const { state, sessionCount, sendMessage, panel, minimizePanel } = useConcierge();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const open = panel === 'open';

  useEffect(() => {
    if (open) titleRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  // A control that handles Esc itself (a confirm step) calls preventDefault, and the panel stays; so does an Esc that
  // ends an IME composition in the message box.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !event.defaultPrevented && !event.nativeEvent.isComposing) minimizePanel();
  }

  return (
    <section
      id="concierge-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby={TITLE_ID}
      onKeyDown={onKeyDown}
      className="fixed inset-x-0 top-16 bottom-0 z-[45] flex max-h-dvh flex-col overflow-y-auto rounded-t-xl border-t border-white/10 bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/60 print:hidden lg:left-auto lg:right-0 lg:w-[420px] lg:rounded-none lg:border-t-0 lg:border-l"
    >
      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id={TITLE_ID}
            ref={titleRef}
            tabIndex={-1}
            className="font-mono text-sm uppercase tracking-widest text-[var(--color-accent)] outline-none"
          >
            {talkWidget.panelTitle}
          </h2>
          <button
            type="button"
            aria-label={talkWidget.minimize}
            onClick={minimizePanel}
            className={`${quiet} px-3`}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
              <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" />
            </svg>
          </button>
        </div>
        <CallControls />
        <DeepDiveLink phase={state.phase} onFollow={minimizePanel} />
      </div>
      <Transcript lines={state.lines} fill>
        <MessageBox key={sessionCount} disabled={state.phase !== 'live'} onSend={sendMessage} />
      </Transcript>
    </section>
  );
}
