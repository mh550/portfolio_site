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
  title: `${profile.name} — ${profile.positioning}`,
  description: profile.subline,
  // No title, description or url here: Next fills og:/twitter: title and description from each page's own
  openGraph: {
    type: 'website',
    siteName: profile.name,
    images: [{ url: profile.headshot, alt: `${profile.name} headshot` }],
  },
  twitter: { card: 'summary', images: [profile.headshot] },
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
