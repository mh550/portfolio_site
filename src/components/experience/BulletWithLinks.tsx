import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Bullet } from '@/lib/data';
import { focusRing } from '@/components/focusRing';

// The /evidence link look: foreground text, accent underline, accent on hover.
const LINK = `text-[var(--color-foreground)] underline decoration-[var(--color-accent)]/50 underline-offset-4 hover:text-[var(--color-accent)] ${focusRing}`;

/** One resume line; link spans become links in place (internal: next/link, external: a new tab). One span, so a flex `li` keeps it whole. */
export default function BulletWithLinks({ bullet }: { bullet: Bullet }) {
  if (typeof bullet === 'string') return <span>{bullet}</span>;

  const spans = bullet.links
    .map((link) => ({ ...link, at: bullet.text.indexOf(link.text) }))
    .filter((link) => link.at >= 0)
    .sort((a, b) => a.at - b.at);

  const parts: ReactNode[] = [];
  let from = 0;
  for (const { text, href, at } of spans) {
    if (at < from) continue;
    parts.push(bullet.text.slice(from, at));
    parts.push(
      href.startsWith('/') ? (
        <Link key={at} href={href} className={LINK}>
          {text}
        </Link>
      ) : (
        <a key={at} href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
          {text}
        </a>
      ),
    );
    from = at + text.length;
  }
  parts.push(bullet.text.slice(from));

  return <span>{parts}</span>;
}
