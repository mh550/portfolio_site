import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Bullet } from '@/lib/data';
import { textLink } from '@/components/textLink';

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
        <Link key={at} href={href} className={textLink}>
          {text}
        </Link>
      ) : (
        <a key={at} href={href} target="_blank" rel="noopener noreferrer" className={textLink}>
          {text}
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      ),
    );
    from = at + text.length;
  }
  parts.push(bullet.text.slice(from));

  return <span>{parts}</span>;
}
