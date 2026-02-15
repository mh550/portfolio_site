import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal';
import ProjectsGrid from '@/components/projects/ProjectsGrid';

export const metadata: Metadata = {
  title: 'Projects — Michael Herron',
  description: 'Integration systems, full-stack apps, and automation projects.',
};

export default function ProjectsPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <ScrollReveal>
        <p className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4">
          Work
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-4">
          Projects
        </h1>
        <p className="text-[var(--color-muted)] text-lg mb-12 max-w-xl">
          A selection of professional and personal builds — integrations, full-stack apps, and tools.
        </p>
      </ScrollReveal>

      <ProjectsGrid />
    </main>
  );
}
