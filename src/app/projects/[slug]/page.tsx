import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { projects, getProjectBySlug } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: 'Project Not Found' };
  return {
    title: `${project.title} — Michael Herron`,
    description: project.shortDescription,
  };
}

const sections = [
  { key: 'problem', heading: 'The Problem' },
  { key: 'approach', heading: 'The Approach' },
  { key: 'challenges', heading: 'Challenges' },
  { key: 'outcome', heading: 'Outcome' },
] as const;

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      {/* Back */}
      <ScrollReveal>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-10 font-mono tracking-wide"
        >
          ← Projects
        </Link>

        {/* Header */}
        <p className="font-mono text-[var(--color-accent)] text-xs tracking-[0.3em] uppercase mb-3">
          {project.company}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          {project.title}
        </h1>
        <p className="text-[var(--color-muted)] text-lg leading-relaxed mb-8">
          {project.shortDescription}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 text-[var(--color-accent)] text-xs font-medium"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        {(project.githubUrl || project.demoUrl) && (
          <div className="flex gap-4 mt-4">
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                GitHub →
              </Link>
            )}
            {project.demoUrl && (
              <Link
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Live Demo →
              </Link>
            )}
          </div>
        )}
      </ScrollReveal>

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-12 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {/* Deep dive sections */}
      <div className="space-y-12">
        {sections.map(({ key, heading }, i) => (
          <ScrollReveal key={key} delay={0.05 + i * 0.05}>
            <h2 className="text-2xl font-bold mb-4">{heading}</h2>
            <p className="text-[var(--color-muted)] text-base leading-relaxed">
              {project.detail[key]}
            </p>
          </ScrollReveal>
        ))}
      </div>

      {/* Back footer */}
      <ScrollReveal delay={0.1}>
        <div className="mt-16 pt-8 border-t border-white/5">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors font-mono tracking-wide"
          >
            ← Back to all projects
          </Link>
        </div>
      </ScrollReveal>
    </main>
  );
}
