import Link from 'next/link';
import { talkWidget } from '@/lib/data';
import { focusRing } from './focusRing';

/**
 * The floating link to /talk (D61): bottom right on every chrome page but /talk; SiteChrome decides where. `live`
 * while a call is on (it outlives /talk, D85): the name says so and a dot shows it, so the way back to Leave is never
 * hidden.
 */
export default function VoiceWidget({ live = false }: { live?: boolean }) {
  return (
    <Link
      href={talkWidget.href}
      aria-label={live ? talkWidget.liveLabel : talkWidget.label}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-background)] shadow-lg shadow-black/40 transition-colors hover:bg-white print:hidden ${focusRing} focus-visible:outline-offset-4`}
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
    </Link>
  );
}
