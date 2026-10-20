import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal';
import TalkSession from '@/components/talk/TalkSession';
import { privacyNote, talkPage } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Talk to my concierge — Michael Herron',
  description: talkPage.description,
};

// The voice concierge (spec docs/specs/2026-10-19-voice-concierge-page.md W2). This page is server-rendered and
// imports nothing from LiveKit: TalkSession, the client half, does nothing until Connect is pressed.
export default function TalkPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <ScrollReveal className="max-w-3xl">
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          {talkPage.eyebrow}
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">{talkPage.title}</h1>
        <div className="space-y-2 text-xl leading-relaxed max-w-2xl mb-8">
          {talkPage.intro.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
      </ScrollReveal>

      <TalkSession />

      <section aria-labelledby="talk-privacy" className="mt-16 max-w-3xl text-sm text-[var(--color-muted)]">
        <h2 id="talk-privacy" className="mb-3 font-mono uppercase tracking-widest text-white">
          {talkPage.headings.privacy}
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          {privacyNote.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
