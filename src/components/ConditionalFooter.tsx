'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

// Hides the footer on the home page so the hero fills the viewport without scroll
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Footer />;
}
