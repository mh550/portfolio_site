'use client';

import { useEffect, useRef } from 'react';
import { talkWidget } from '@/lib/data';
import { focusRing } from './focusRing';

/**
 * The floating widget (D61): bottom right on every chrome page but /talk; SiteChrome decides where. A button that
 * opens and closes the concierge panel (D86): `expanded` while it is open. `live` while a call is on (it outlives
 * every page, D85): the name says so and a dot shows it, so the way back to Leave is never hidden.
 */
export default function VoiceWidget({
  live = false,
  expanded = false,
  onToggle,
}: {
  live?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(expanded);

  // Minimize and Esc unmount the panel with focus inside it, which leaves focus on <body>: take it back. Focus the
  // visitor moved to the page stays where it is.
  useEffect(() => {
    const active = document.activeElement;
    if (wasExpanded.current && !expanded && (!active || active === document.body)) {
      buttonRef.current?.focus({ preventScroll: true });
    }
    wasExpanded.current = expanded;
  }, [expanded]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onToggle}
      aria-expanded={expanded}
      // The panel is in the DOM only while open
      aria-controls={expanded ? 'concierge-panel' : undefined}
      aria-label={live ? talkWidget.liveLabel : talkWidget.label}
      // The open panel covers this corner at every width: out of sight and out of the tab order until it closes
      className={`${expanded ? 'invisible ' : ''}fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-background)] shadow-lg shadow-black/40 transition-colors hover:bg-white print:hidden ${focusRing} focus-visible:outline-offset-4`}
    >
      {/* Two gentle pulses on load (4 s, under WCAG 2.2.2's 5 s), none under reduced motion */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[var(--color-accent)]/60 motion-safe:animate-pulse motion-safe:[animation-iteration-count:2]"
      />
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
        <path d="M12 18v4" />
      </svg>
      {live && (
        <span
          aria-hidden="true"
          data-live-dot
          className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-background)] bg-red-500"
        />
      )}
    </button>
  );
}
