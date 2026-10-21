import { Fragment } from 'react';
import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal';
import Logo from '@/components/logos/Logo';
import { focusRing } from '@/components/focusRing';
import { profile } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Contact — Michael Herron',
  description: 'Reach Michael Herron, agentic systems engineer in Durham, NC: email, LinkedIn or GitHub.',
};

// 'https://www.linkedin.com/in/x/' → 'linkedin.com/in/x'
const display = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

// A line break after each @ and /, so a narrow tile (three columns at sm) wraps 'mherron734@' 'gmail.com', not mid-word
const breakable = (value: string) =>
  value.split(/(?<=[@/])/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {part}
    </Fragment>
  ));

const tiles = [
  { label: 'Email', glyph: 'mail', value: profile.email, href: `mailto:${profile.email}`, external: false },
  { label: 'LinkedIn', glyph: 'linkedin', value: display(profile.linkedin), href: profile.linkedin, external: true },
  { label: 'GitHub', glyph: 'github', value: display(profile.github), href: profile.github, external: true },
] as const;

// One screen at 390 × 844 and 1280 × 800 with the Navbar and Footer (D97; height budget in
// docs/plans/2026-10-21-P4-contact.md § Layout): the h1, one line, three tiles that are each one link.
export default function ContactPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8 sm:py-16">
      <ScrollReveal>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-3 sm:mb-4">Let&apos;s Talk</h1>
        <p className="text-[var(--color-muted)] sm:text-lg mb-8 sm:mb-10">
          {profile.location} · {profile.availability}.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {tiles.map(({ label, glyph, value, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`group flex sm:flex-col items-center sm:items-start gap-4 p-4 sm:p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-alt)] transition-colors ${focusRing}`}
            >
              <Logo
                name={glyph}
                decorative
                className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-focus-visible:text-[var(--color-accent)] transition-colors"
              />
              <span className="min-w-0">
                <span className="block font-mono text-xs text-[var(--color-muted)] tracking-widest uppercase">
                  {label}{' '}
                </span>
                <span className="block mt-1 font-medium text-[var(--color-foreground)] wrap-anywhere">
                  {breakable(value)}
                </span>
                {external && <span className="sr-only"> (opens in new tab)</span>}
              </span>
            </a>
          ))}
        </div>
      </ScrollReveal>
    </main>
  );
}
