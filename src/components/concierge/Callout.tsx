'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { talkWidget } from '@/lib/data/concierge';
import { focusRing } from '../focusRing';
import { PILL_ID } from '../VoiceWidget';
import { useConcierge } from './ConciergeProvider';

/**
 * The first-visit callout (D88): a bubble above the pill until the visitor closes it, presses Esc, opens the panel or
 * connects, once per browser. The provider holds whether it was seen, read after mount, so the server HTML never has
 * it. A note, not a dialog and not live: static text that appears once.
 */
export default function Callout() {
  const { calloutSeen, panel, dismissCallout } = useConcierge();
  if (calloutSeen || panel === 'open') return null;
  return <Bubble onDismiss={dismissCallout} />;
}

// The bubble covers the corner where the Footer's links end up and whatever the page scrolls under it: it shows only
// at the top of a page with the Footer out of sight (WCAG 2.4.11), and comes back there until it is dismissed. Mounted
// only on the client (the provider's first render has the callout seen), so reading scrollY to start is safe.
function useOutOfTheWay() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 0);
  const [footerShows, setFooterShows] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    const footer = document.querySelector('footer');
    const observer =
      footer && typeof window.IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => setFooterShows(entry.isIntersecting))
        : undefined;
    if (footer) observer?.observe(footer);
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);
  return scrolled || footerShows;
}

function Bubble({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useOutOfTheWay();

  // Focus on Close would fall to <body> as the bubble goes: hand it to the pill, so the next Tab goes on from there.
  const dismiss = useCallback(() => {
    const hadFocus = ref.current?.contains(document.activeElement) ?? false;
    onDismiss();
    if (hadFocus) document.getElementById(PILL_ID)?.focus({ preventScroll: true });
  }, [onDismiss]);

  // Esc dismisses it from anywhere while it shows, unless a control already handled that Esc or it ends a composition.
  useEffect(() => {
    if (hidden) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing) dismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hidden, dismiss]);

  if (hidden) return null;
  return (
    <div
      ref={ref}
      role="note"
      className="fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] z-40 flex max-w-[16rem] items-start gap-2 rounded-xl border border-white/10 bg-[var(--color-surface-alt)] py-3 pr-2 pl-4 text-sm text-[var(--color-foreground)] shadow-lg shadow-black/40 print:hidden motion-safe:animate-[concierge-callout_200ms_ease-out]"
    >
      <p>{talkWidget.callout}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={talkWidget.close}
        className={`-mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] ${focusRing}`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
