import Link from 'next/link';
import type { Project } from '@/lib/data';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="flex flex-col h-full p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30 transition-colors group">
      {/* Header */}
      <div className="mb-4">
        <p className="font-mono text-xs text-[var(--color-muted)] tracking-widest uppercase mb-2">
          {project.company}
        </p>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
          {project.title}
        </h2>
      </div>

      {/* Description */}
      <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-5 flex-1">
        {project.shortDescription}
      </p>

      {/* Tech stack tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {project.techStack.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-[var(--color-muted)] text-xs"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Footer links */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          Deep dive →
        </Link>
        {project.githubUrl && (
          <Link
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            aria-label={`${project.title} on GitHub`}
          >
            GitHub
          </Link>
        )}
        {project.demoUrl && (
          <Link
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            aria-label={`${project.title} live demo`}
          >
            Live Demo
          </Link>
        )}
      </div>
    </article>
  );
}
