'use client';

import { useEffect, useRef, useState } from 'react';
import { talkWidget } from '@/lib/data/concierge';
import { focusRing } from './focusRing';

// Three bars, centred, heights 6, 10, 6 (plan § Widget). Staggered while the agent speaks.
const BARS = [
  { x: 2, height: 6, delay: '[animation-delay:0ms]' },
  { x: 7, height: 10, delay: '[animation-delay:150ms]' },
  { x: 12, height: 6, delay: '[animation-delay:300ms]' },
];
// The Callout hands focus here when it goes.
export const PILL_ID = 'concierge-pill';

const BAR_MOTION = 'motion-safe:animate-[concierge-bar_0.9s_ease-in-out_infinite] origin-center [transform-box:fill-box]';

// ≤ 390 px, once the visitor has scrolled, the pill gives the page back its corner: the glyph alone. Read after mount
// only, so the server HTML and the first client render are the full pill.
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(max-width: 390px)');
    const update = () => setCollapsed(query.matches && window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    // Safari before 14 has only the older addListener/removeListener
    const legacy = typeof query.addEventListener !== 'function';
    if (legacy) query.addListener(update);
    else query.addEventListener('change', update);
    return () => {
      window.removeEventListener('scroll', update);
      if (legacy) query.removeListener(update);
      else query.removeEventListener('change', update);
    };
  }, []);
  return collapsed;
}

/**
 * The "Ask my site" pill (D87): bottom right on every chrome page but /talk; SiteChrome decides where. A button that
 * opens and closes the concierge panel (D86): `expanded` while it is open. `live` while a call is live (it outlives
 * every page, D85): a dot shows it and the name says whether the agent is listening or, with `speaking`, speaking,
 * when the bars move too.
 */
export default function VoiceWidget({
  live = false,
  speaking = false,
  expanded = false,
  onToggle,
}: {
  live?: boolean;
  speaking?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(expanded);
  const collapsed = useCollapsed();
  const moving = live && speaking;

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
      id={PILL_ID}
      ref={buttonRef}
      onClick={onToggle}
      aria-expanded={expanded}
      // The panel is in the DOM only while open
      aria-controls={expanded ? 'concierge-panel' : undefined}
      // Idle, the visible label is the name; live, the name starts with it (WCAG 2.5.3) and adds the state
      aria-label={live ? (moving ? talkWidget.speaking : talkWidget.listening) : undefined}
      data-collapsed={collapsed ? 'true' : undefined}
      // The open panel covers this corner at every width: out of sight and out of the tab order until it closes
      className={`${expanded ? 'invisible ' : ''}${collapsed ? 'w-12 px-0 justify-center ' : 'px-4 '}fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-background)] shadow-lg shadow-black/40 transition-colors hover:bg-white print:hidden ${focusRing} focus-visible:outline-offset-4`}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="currentColor">
        {BARS.map(({ x, height, delay }) => (
          <rect
            key={x}
            x={x}
            y={(16 - height) / 2}
            width={2}
            height={height}
            rx={1}
            className={moving ? `${BAR_MOTION} ${delay}` : undefined}
          />
        ))}
      </svg>
      <span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>{talkWidget.label}</span>
      {live && (
        <span
          aria-hidden="true"
          data-live-dot
          className={`${collapsed ? 'absolute right-1.5 top-1.5 ' : ''}h-2 w-2 shrink-0 rounded-full bg-red-600 ring-2 ring-[var(--color-background)]`}
        />
      )}
    </button>
  );
}
