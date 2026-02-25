import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[var(--color-muted)] text-sm font-mono">
          Michael Herron &copy; {new Date().getFullYear()}
        </p>
        <ul className="flex items-center gap-6">
          <li>
            <Link
              href="https://github.com/mh550"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors"
            >
              GitHub
            </Link>
          </li>
          <li>
            <Link
              href="https://linkedin.com/in/mherron734"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors"
            >
              LinkedIn
            </Link>
          </li>
          <li>
            <Link
              href="mailto:mherron734@gmail.com"
              aria-label="Email"
              className="text-[var(--color-muted)] text-sm hover:text-[var(--color-accent)] transition-colors"
            >
              Email
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
