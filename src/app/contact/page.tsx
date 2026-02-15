import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'Contact — Michael Herron',
  description: "Get in touch with Michael Herron — let's build something.",
};

const links = [
  {
    label: 'Email',
    value: 'mherron734@gmail.com',
    href: 'mailto:mherron734@gmail.com',
    description: 'Best way to reach me',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/mherron734',
    href: 'https://linkedin.com/in/mherron734',
    description: 'Connect professionally',
  },
  {
    label: 'GitHub',
    value: 'github.com/mherron734',
    href: 'https://github.com/mherron734',
    description: 'See my code',
  },
];

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Contact
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Let&apos;s Talk
        </h1>
        <p className="text-[var(--color-muted)] text-lg leading-relaxed mb-14">
          Whether you have a project in mind, a role to fill, or just want to connect —
          I&apos;m always up for a good conversation.
        </p>
      </ScrollReveal>

      {/* Contact cards */}
      <div className="space-y-4">
        {links.map(({ label, value, href, description }, i) => (
          <ScrollReveal key={label} delay={0.05 + i * 0.06}>
            <Link
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="group flex items-center justify-between p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-alt)] transition-all"
              aria-label={`${label}: ${value}`}
            >
              <div>
                <p className="font-mono text-xs text-[var(--color-muted)] tracking-widest uppercase mb-1">
                  {label}
                </p>
                <p className="text-[var(--color-foreground)] font-medium">{value}</p>
                <p className="text-[var(--color-muted)] text-sm mt-0.5">{description}</p>
              </div>
              <span
                aria-hidden="true"
                className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors text-xl"
              >
                →
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {/* Closing note */}
      <ScrollReveal delay={0.2}>
        <div className="mt-14 pt-8 border-t border-white/5">
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            Based in the Pacific Northwest. Open to remote, hybrid, or relocation for the right opportunity.
          </p>
        </div>
      </ScrollReveal>
    </main>
  );
}
