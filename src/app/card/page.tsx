import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTopProjects, profile } from '@/lib/data';
import { focusRing } from '@/components/focusRing';
import ConferenceNote from '@/components/card/ConferenceNote';

const title = `${profile.name} — ${profile.positioning}`;

// Open Graph and twitter come from the root layout (siteName, headshot); Next fills og:title/description from these
export const metadata: Metadata = {
  title,
  description: profile.subline,
};

const button = `min-h-[44px] inline-flex items-center justify-center rounded-lg px-4 font-medium transition-colors ${focusRing}`;
const primaryButton = `${button} w-full bg-[var(--color-accent)] text-[var(--color-background)] py-3 hover:bg-[var(--color-accent)]/85`;
const secondaryButton = `${button} border border-white/15 text-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`;
const textButton = `${button} text-[var(--color-muted)] hover:text-[var(--color-accent)]`;

// Standalone contact card for a phone at a conference (D6). No entrance animation (D28) and no
// searchParams, so the page stays static.
export default function CardPage() {
  const selected = getTopProjects(3);

  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-col items-center px-6 py-8 text-center">
      <Image
        src={profile.headshot}
        width={112}
        height={112}
        alt={`${profile.name} headshot`}
        sizes="112px"
        preload
        className="h-28 w-28 rounded-full border border-white/10 object-cover object-top"
      />
      <h1 className="mt-5 text-3xl font-bold">{profile.name}</h1>
      <p className="font-mono text-lg text-[var(--color-accent)]">{profile.positioning}</p>
      <p className="mt-3 text-base text-[var(--color-muted)]">{profile.subline}</p>

      <a href="/michael-herron.vcf" className={`${primaryButton} mt-6`}>
        Save contact
      </a>
      <div className="mt-3 grid w-full grid-cols-3 gap-3">
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
          LinkedIn
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        <a href={`mailto:${profile.email}`} className={secondaryButton}>
          Email
        </a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
          GitHub
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </div>

      <section aria-labelledby="selected-work" className="mt-10 w-full text-left">
        <ConferenceNote note={profile.conferenceNote} />
        <h2
          id="selected-work"
          className="font-mono text-sm uppercase tracking-wider text-[var(--color-muted)]"
        >
          Selected work
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {selected.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className={`block rounded-lg border border-white/10 bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)] ${focusRing}`}
              >
                <span className="block font-semibold">{project.title}</span>
                <span className="mt-1 block text-sm text-[var(--color-muted)]">
                  {project.shortDescription}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-col items-center gap-2">
        <Link href="/" className={textButton}>
          Full portfolio<span aria-hidden="true">&nbsp;→</span>
        </Link>
        <Link href="/card/qr" className={`${secondaryButton} text-[var(--color-muted)]`}>
          Show QR
        </Link>
      </div>
    </main>
  );
}
