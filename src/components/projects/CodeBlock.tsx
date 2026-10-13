import type { CodeSnippet } from '@/lib/data';

/** A titled, monospace code excerpt. Intentionally dependency-free — no syntax highlighter. */
export default function CodeBlock({ snippet }: { snippet: CodeSnippet }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[var(--color-surface)]">
      <figcaption className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <span className="text-sm font-medium text-[var(--color-foreground)]">{snippet.title}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          {snippet.language}
        </span>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
        <code className="font-mono text-[var(--color-foreground)]/90">{snippet.code}</code>
      </pre>
    </figure>
  );
}
