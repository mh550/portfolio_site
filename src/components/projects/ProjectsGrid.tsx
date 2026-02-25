'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { projects, type ProjectCategory } from '@/lib/data';
import ProjectCard from './ProjectCard';
import ScrollReveal from '@/components/ScrollReveal';

const FILTERS: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Integration', value: 'integration' },
  { label: 'Full-Stack', value: 'full-stack' },
  { label: 'AI', value: 'ai' },
];

export default function ProjectsGrid() {
  const [active, setActive] = useState<ProjectCategory | 'all'>('all');

  const filtered =
    active === 'all' ? projects : projects.filter((p) => p.categories.includes(active));

  return (
    <div>
      {/* Filter bar — entrance animation on mount */}
      <motion.div
        className="flex flex-wrap gap-3 mb-10"
        role="group"
        aria-label="Filter projects by category"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActive(value)}
            aria-pressed={active === value}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              active === value
                ? 'bg-[var(--color-accent)] text-[var(--color-background)] border-[var(--color-accent)]'
                : 'text-[var(--color-muted)] border-white/10 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-foreground)]'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {filtered.map((project, i) => (
          <ScrollReveal key={project.slug} delay={i * 0.06}>
            <ProjectCard project={project} />
          </ScrollReveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[var(--color-muted)] text-center py-12">No projects in this category yet.</p>
      )}
    </div>
  );
}
