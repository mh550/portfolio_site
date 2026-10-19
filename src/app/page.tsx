import Link from 'next/link';
import HeroSection from '@/components/hero/HeroSection';
import ProjectCard from '@/components/projects/ProjectCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getTopProjects } from '@/lib/data';

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      <section aria-labelledby="recent-work-heading" className="max-w-5xl mx-auto px-6 py-20">
        <ScrollReveal>
          <h2 id="recent-work-heading" className="text-3xl sm:text-4xl font-bold mb-10">
            Recent work
          </h2>
        </ScrollReveal>
        <div className="grid gap-6 md:grid-cols-3">
          {getTopProjects(3).map((project, i) => (
            <ScrollReveal key={project.slug} delay={i * 0.05}>
              <ProjectCard project={project} headingAs="h3" />
            </ScrollReveal>
          ))}
        </div>
        <Link
          href="/projects"
          className="mt-10 inline-flex min-h-11 items-center gap-2 font-medium text-[var(--color-accent)] hover:underline"
        >
          See all projects <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
