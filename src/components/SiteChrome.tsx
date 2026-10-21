'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { talkWidget } from '@/lib/data';
import ConciergeProvider, { useConcierge } from './concierge/ConciergeProvider';
import { inRoom } from './talk/sessionReducer';
import Navbar from './Navbar';
import Footer from './Footer';
import VoiceWidget from './VoiceWidget';
import ConciergePanel from './concierge/ConciergePanel';
import { focusRing } from './focusRing';

// /card and /card/* are standalone (D6, D15): no Navbar, no 64 px offset, no Footer
function isCardPath(pathname: string) {
  return pathname === '/card' || pathname.startsWith('/card/');
}

// The widget reads the call and the panel, so it sits inside the provider SiteChrome renders.
function ChromeWidget() {
  const { state, panel, openPanel, minimizePanel } = useConcierge();
  const expanded = panel === 'open';
  return (
    <VoiceWidget
      live={inRoom(state.phase)}
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
// pages. `configured` is read on the server, in layout.tsx (D46): only a boolean crosses into this client file.
export default function SiteChrome({
  configured = false,
  children,
}: {
  configured?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isCardPath(pathname)) return <>{children}</>;
  return (
    <ConciergeProvider configured={configured}>
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
      {/* Last in the DOM, so last in the tab order: the panel (open only) then the widget (D86). Neither on /talk, the
          full-page view of the same call (D61) */}
      {pathname !== talkWidget.href ? (
        <>
          <ConciergePanel />
          <ChromeWidget />
        </>
      ) : (
        <ClosePanel />
      )}
    </ConciergeProvider>
  );
}
