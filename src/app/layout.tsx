import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';
import { profile } from '@/lib/data';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  // Resolves relative Open Graph image paths (D24)
  metadataBase: new URL(profile.siteUrl),
  title: 'Michael Herron — Full-Stack & Integration Engineer',
  description:
    'Portfolio of Michael Herron — full-stack developer and automation/integration engineer. I build systems that connect things.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
