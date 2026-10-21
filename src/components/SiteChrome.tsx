'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { talkWidget } from '@/lib/data/concierge';
import type { UsherTarget } from '@/lib/concierge/usher';
import ConciergeProvider, { useConcierge } from './concierge/ConciergeProvider';
import Navbar from './Navbar';
import Footer from './Footer';
import VoiceWidget from './VoiceWidget';
import ConciergePanel from './concierge/ConciergePanel';
import Callout from './concierge/Callout';
import { focusRing } from './focusRing';

// /card and /card/* are standalone (D6, D15): no Navbar, no 64 px offset, no Footer
function isCardPath(pathname: string) {
  return pathname === '/card' || pathname.startsWith('/card/');
}

// The pill reads the call and the panel, so it sits inside the provider SiteChrome renders. Live (listening or
// speaking, D87) only once the agent is there: before that the panel's status line says how far Connect got.
function ChromeWidget() {
  const { state, panel, agentSpeaking, openPanel, minimizePanel } = useConcierge();
  const expanded = panel === 'open';
  return (
    <VoiceWidget
      live={state.phase === 'live'}
      speaking={agentSpeaking}
      expanded={expanded}
      onToggle={expanded ? minimizePanel : openPanel}
    />
  );
}

// /talk is the full view of the call: reaching it closes the panel, so it doesn't reopen on the next page.
function ClosePanel() {
  const { panel, minimizePanel } = useConcierge();
  useEffect(() => {
    if (panel === 'open') minimizePanel();
  }, [panel, minimizePanel]);
  return null;
}

// The concierge's call lives here, around the chrome (D85), so it outlives every client-side navigation between chrome
// pages. `configured` is read on the server, in layout.tsx (D46): only a boolean crosses into this client file, and
// the usher's targets (D94) as plain data.
export default function SiteChrome({
  configured = false,
  usherTargets,
  children,
}: {
  configured?: boolean;
  usherTargets?: readonly UsherTarget[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isCardPath(pathname)) return <>{children}</>;
  return (
    <ConciergeProvider configured={configured} usherTargets={usherTargets}>
      <a
        href="#content"
        className={`${focusRing} sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-background)]`}
      >
        Skip to content
      </a>
      <Navbar />
      {/* tabIndex -1: the skip link moves focus here, not just the scroll position */}
      <div id="content" tabIndex={-1} className="pt-16 outline-none">
        {children}
      </div>
      <Footer />
      {/* Last in the DOM, so last in the tab order: the panel (open only), the first-visit callout (D88), then the pill
          it introduces (D86, D87). None of them on /talk, the full-page view of the same call (D61) */}
      {pathname !== talkWidget.href ? (
        <>
          <ConciergePanel />
          <Callout />
          <ChromeWidget />
        </>
      ) : (
        <ClosePanel />
      )}
    </ConciergeProvider>
  );
}
