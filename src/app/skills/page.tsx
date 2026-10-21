import type { Metadata } from 'next';
import { clusters, nodes } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'Skills — Michael Herron',
  description: 'The tools and practices behind the agentic systems, integrations and apps I build, grouped by capability.',
};

// The graph's data as a list until SkillGraph draws it (P5-03); the featured Differentiator block went with D98
export default function SkillsPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Skills
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-4">
          Tech Stack
        </h1>
        <p className="text-[var(--color-muted)] text-lg mb-16 max-w-xl">
          Grouped by what I do, with the tools I use for each.
        </p>
      </ScrollReveal>

      <div className="grid gap-6">
        {clusters.map((cluster, i) => (
          <ScrollReveal key={cluster.id} delay={0.05 + i * 0.05}>
            <div className="p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-white/15 transition-colors">
              <h2 id={`skills-${cluster.id}`} className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">
                {cluster.name}
              </h2>
              <ul role="list" aria-labelledby={`skills-${cluster.id}`} className="flex flex-wrap gap-2">
                {nodes
                  .filter((node) => node.cluster === cluster.id)
                  .map((node) => (
                    <li
                      key={node.id}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-[var(--color-muted)] text-sm hover:text-[var(--color-foreground)] hover:border-white/15 transition-colors"
                    >
                      {node.name}
                    </li>
                  ))}
              </ul>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </main>
  );
}
