import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { profile } from '@/lib/data';

export const metadata: Metadata = {
  title: `QR — ${profile.name}`,
  robots: { index: false },
};

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#ffffff' };

// Michael holds this up on his phone; black on white scans best in a dim room. The QR files come from
// scripts/make-qr.mjs (`npm run qr`), and qr.test.ts pins them to profile.siteUrl.
export default function CardQrPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-black">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG; next/image adds nothing here */}
      <img
        src="/card/qr.svg"
        width={420}
        height={420}
        alt={`QR code linking to ${new URL(profile.siteUrl).host}/card`}
        style={{ width: 'min(80vw, 420px)' }}
        className="aspect-square h-auto"
      />
      <div className="text-center">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="font-mono text-base">{profile.positioning}</p>
      </div>
      <Link
        href="/card"
        className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm text-neutral-700 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <span aria-hidden="true">←&nbsp;</span>Back<span className="sr-only"> to card</span>
      </Link>
    </main>
  );
}
