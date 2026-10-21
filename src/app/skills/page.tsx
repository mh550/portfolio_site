import type { Metadata } from 'next';
import { clusters, edges, nodes, projects } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';
import SkillGraph, { type GraphProject } from '@/components/skills/SkillGraph';

export const metadata: Metadata = {
  title: 'Skills — Michael Herron',
  description:
    'The stack behind the agentic systems, integrations and apps I build, as a graph: pick a project to see what it used.',
};

// Short titles on the server, so SkillGraph's bundle never imports projects.ts
const graphProjects: GraphProject[] = projects.map(({ slug, title, featured, order }) => ({
  slug,
  title: title.split(':')[0].trim(),
  featured,
  order,
}));

// The stack as a graph (P5-03) with project chips (P5-05); the featured Differentiator block went with D98
export default function SkillsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Skills
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-4">
          Tech Stack
        </h1>
        <p className="text-[var(--color-muted)] text-lg mb-10 max-w-xl">
          What I build with, grouped by what it&apos;s for. Pick a project to see the parts it used.
        </p>
      </ScrollReveal>

      <SkillGraph clusters={clusters} nodes={nodes} edges={edges} projects={graphProjects} />
    </main>
  );
}
