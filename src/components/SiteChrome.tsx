'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

// /card and /card/* are standalone (D6, D15): no Navbar, no 64 px offset, no Footer
function isCardPath(pathname: string) {
  return pathname === '/card' || pathname.startsWith('/card/');
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isCardPath(pathname)) return <>{children}</>;
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-background)]"
      >
        Skip to content
      </a>
      <Navbar />
      {/* tabIndex -1: the skip link moves focus here, not just the scroll position */}
      <div id="content" tabIndex={-1} className="pt-16 outline-none">
        {children}
      </div>
      <Footer />
    </>
  );
}
