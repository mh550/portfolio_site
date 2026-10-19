import Link from 'next/link';
import { profile } from '@/lib/data';
import { focusRing } from '@/components/focusRing';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[var(--color-muted)] text-sm font-mono">
          {profile.name} &copy; {new Date().getFullYear()}
        </p>
        <ul className="flex items-center gap-6">
          <li>
            <Link
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors ${focusRing}`}
            >
              GitHub
              <span className="sr-only"> (opens in new tab)</span>
            </Link>
          </li>
          <li>
            <Link
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors ${focusRing}`}
            >
              LinkedIn
              <span className="sr-only"> (opens in new tab)</span>
            </Link>
          </li>
          <li>
            <Link
              href={`mailto:${profile.email}`}
              className={`text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors ${focusRing}`}
            >
              Email
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
