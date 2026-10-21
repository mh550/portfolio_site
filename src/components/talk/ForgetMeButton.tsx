'use client';

import { useId, useRef, useState } from 'react';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';

const buttonBase = `rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${focusRing}`;
// Also the disabled Forget me the Memory tab shows before a call (MemoryView), so the two look the same.
export const quiet = `${buttonBase} border border-white/20 text-white hover:border-white/40`;
const danger = `${buttonBase} bg-red-700 text-white hover:bg-red-800`;

// Forget me, with one confirm step so a stray tap can't erase anything. The parent runs the RPC (`onForget`) and
// holds `busy` until it answers; Erase closes the confirm step at once, so it can only call `onForget` once.
// Focus follows the control that replaces the one clicked: Cancel on opening, Forget me on closing. While the parent
// is busy Forget me is aria-disabled, not disabled, so it can hold focus through the RPC.
export default function ForgetMeButton({ onForget, busy }: { onForget: () => void; busy: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const promptId = useId();
  const focusOnMount = useRef(false);
  const takeFocus = (el: HTMLButtonElement | null) => {
    if (el && focusOnMount.current) {
      focusOnMount.current = false;
      el.focus();
    }
  };
  const show = (next: boolean) => {
    focusOnMount.current = true;
    setConfirming(next);
  };
  const { labels, status } = talkPage;

  if (!confirming) {
    return (
      <button
        type="button"
        ref={takeFocus}
        className={quiet}
        aria-disabled={busy}
        onClick={() => {
          if (!busy) show(true);
        }}
      >
        {labels.forgetMe}
      </button>
    );
  }
  return (
    // Esc steps back out of the confirm step; preventDefault tells the drawer (ConciergePanel) the key is handled.
    <div
      role="group"
      aria-labelledby={promptId}
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
        event.preventDefault();
        show(false);
      }}
    >
      <p id={promptId} className="text-white">
        {status.forgetConfirm}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={danger}
          disabled={busy}
          onClick={() => {
            show(false);
            onForget();
          }}
        >
          {labels.erase}
        </button>
        <button type="button" ref={takeFocus} className={quiet} disabled={busy} onClick={() => show(false)}>
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
