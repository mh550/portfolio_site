import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/lib/data';

interface ProjectCardProps {
  project: Project;
}

/** Top preview band: thumbnail image when available, else a gradient that
 *  surfaces the headline metric so the card still leads with evidence. */
function PreviewBand({ project }: { project: Project }) {
  if (project.thumbnail) {
    return (
      <div className="relative -mx-6 -mt-6 mb-4 aspect-[16/9] overflow-hidden rounded-t-xl border-b border-white/8 bg-[var(--color-surface-alt)]">
        <Image
          src={project.thumbnail.src}
          alt={project.thumbnail.alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
    );
  }

  const headline = project.metrics?.[0];
  return (
    <div className="relative -mx-6 -mt-6 mb-4 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-xl border-b border-white/8 bg-gradient-to-br from-[var(--color-surface-alt)] to-[var(--color-surface)]">
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-2xl"
      />
      {headline ? (
        <div className="relative text-center">
          <p className="text-3xl font-bold text-[var(--color-accent)]">{headline.value}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{headline.label}</p>
        </div>
      ) : (
        <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {project.categories[0]}
        </p>
      )}
    </div>
  );
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="flex flex-col h-full p-6 rounded-xl border border-white/8 bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30 transition-colors group">
      {/* Preview */}
      <PreviewBand project={project} />

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
