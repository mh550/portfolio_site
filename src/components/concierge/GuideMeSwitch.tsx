'use client';

import { talkWidget } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import { useConcierge } from './ConciergeProvider';

// The usher's switch (D94), in the panel only: on /talk the usher never navigates, so it would do nothing there.
// Its name is the visible label; aria-checked carries the state, and the track and thumb only draw it. The hint says
// what it allows, for a screen reader (the label is short and it starts on).
const HINT_ID = 'concierge-guide-me-hint';

export default function GuideMeSwitch() {
  const { guideMe, setGuideMe } = useConcierge();
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={guideMe}
        aria-describedby={HINT_ID}
        onClick={() => setGuideMe(!guideMe)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-md text-sm text-white ${focusRing}`}
      >
        <span
          aria-hidden="true"
          className={`relative inline-block h-5 w-9 shrink-0 rounded-full border motion-safe:transition-colors ${
            guideMe ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/25' : 'border-white/30 bg-white/5'
          }`}
        >
          <span
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full motion-safe:transition-[left] ${
              guideMe ? 'left-[1.0625rem] bg-[var(--color-accent)]' : 'left-0.5 bg-[var(--color-muted)]'
            }`}
          />
        </span>
        {talkWidget.guideMe}
      </button>
      <span id={HINT_ID} className="sr-only">
        {talkWidget.guideMeHint}
      </span>
    </div>
  );
}
