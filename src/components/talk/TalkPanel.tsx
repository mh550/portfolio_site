import type { ReactNode } from 'react';

// The bordered section each /talk panel sits in, named by its h2 (plan docs/plans/2026-10-20-VC2-talk-page.md § Layout).
export default function TalkPanel({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-white/10 bg-[var(--color-surface)] p-5">
      <h2 id={id} className="mb-4 font-mono text-sm uppercase tracking-widest text-[var(--color-accent)]">
        {heading}
      </h2>
      {children}
    </section>
  );
}
