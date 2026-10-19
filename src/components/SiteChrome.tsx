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
      <Navbar />
      <div className="pt-16">{children}</div>
      <Footer />
    </>
  );
}
