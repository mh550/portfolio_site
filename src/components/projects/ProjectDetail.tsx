import Link from 'next/link';
import { getCaseStudyAnchors, type CaseStudy, type Project } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';
import MetricStrip from '@/components/projects/MetricStrip';
import CodeBlock from '@/components/projects/CodeBlock';
import MediaGallery from '@/components/projects/MediaGallery';
import ProjectDiagram from '@/components/projects/diagrams';
import MethodSteps from '@/components/projects/case-study/MethodSteps';
import DecisionLog from '@/components/projects/case-study/DecisionLog';
import IterationTimeline from '@/components/projects/case-study/IterationTimeline';
import LessonList from '@/components/projects/case-study/LessonList';
import ProjectLinks from '@/components/projects/case-study/ProjectLinks';

const sections = [
  { key: 'problem', heading: 'The Problem' },
  { key: 'approach', heading: 'The Approach' },
  { key: 'challenges', heading: 'Challenges' },
  { key: 'outcome', heading: 'Outcome' },
] as const;

/** The /projects/[slug] page body. A project with a caseStudy gets the case-study order (D16, D17). */
export default function ProjectDetail({ project }: { project: Project }) {
  const caseStudy = project.caseStudy;

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
        {caseStudy && (
          <p className="-mt-4 mb-6 font-mono text-xs tracking-wide text-[var(--color-muted)]">
            {`${caseStudy.role} · ${caseStudy.timeframe}`}
          </p>
        )}

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

        {/* Links (a case study lists its links in ProjectLinks instead) */}
        {!caseStudy && (project.githubUrl || project.demoUrl) && (
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

      {/* Impact metrics */}
      {project.metrics && project.metrics.length > 0 && (
        <ScrollReveal delay={0.05}>
          <div className="mt-10">
            <MetricStrip metrics={project.metrics} />
          </div>
        </ScrollReveal>
      )}

      {/* Divider */}
      <ScrollReveal delay={0.05}>
        <div className="my-12 h-px bg-gradient-to-r from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-transparent" />
      </ScrollReveal>

      {caseStudy ? (
        <CaseStudyBody project={project} caseStudy={caseStudy} />
      ) : (
        /* Deep dive sections — visuals lead, prose supports */
        <div className="space-y-12">
          {sections.map(({ key, heading }, i) => (
            <div key={key}>
              <ProseSection heading={heading} text={project.detail[key]} delay={0.05 + i * 0.05} />

              {/* Architecture / process diagram follows "The Approach" */}
              {key === 'approach' && project.detail.architectureDiagram && (
                <ScrollReveal delay={0.1}>
                  <div className="mt-6">
                    <ProjectDiagram diagram={project.detail.architectureDiagram} />
                  </div>
                </ScrollReveal>
              )}
            </div>
          ))}

          <CodeAndMedia detail={project.detail} />
        </div>
      )}

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

/** The spec's case-study order after the header: Problem → diagram → method → … → links → builtWith. */
function CaseStudyBody({ project, caseStudy }: { project: Project; caseStudy: CaseStudy }) {
  // The same rules decide which sections render and which anchors exist, so an empty section leaves no gap.
  const anchors = new Set(getCaseStudyAnchors(project));

  return (
    <div className="space-y-12">
      <ProseSection heading="The Problem" text={project.detail.problem} delay={0.05} />

      {project.detail.architectureDiagram && (
        <ScrollReveal delay={0.1}>
          <ProjectDiagram diagram={project.detail.architectureDiagram} />
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.05}>
        <MethodSteps method={caseStudy.method} />
      </ScrollReveal>

      {anchors.has('decisions') && (
        <ScrollReveal delay={0.05}>
          <DecisionLog decisions={caseStudy.decisions} />
        </ScrollReveal>
      )}

      {anchors.has('iterations') && (
        <ScrollReveal delay={0.05}>
          <IterationTimeline iterations={caseStudy.iterations} />
        </ScrollReveal>
      )}

      {caseStudy.extraDiagrams?.map((diagram, i) => (
        <ScrollReveal key={`${i}-${diagram}`} delay={0.1}>
          <ProjectDiagram diagram={diagram} />
        </ScrollReveal>
      ))}

      {anchors.has('lessons') && (
        <ScrollReveal delay={0.05}>
          <LessonList lessons={caseStudy.lessons} />
        </ScrollReveal>
      )}

      <ProseSection heading="Outcome" text={project.detail.outcome} delay={0.05} />

      <CodeAndMedia detail={project.detail} />

      {anchors.has('links') && (
        <ScrollReveal delay={0.05}>
          <ProjectLinks links={caseStudy.links} />
        </ScrollReveal>
      )}

      {caseStudy.builtWith && (
        <ScrollReveal delay={0.05}>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            <span className="block font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-accent)] mb-1">
              How it was built
            </span>
            {caseStudy.builtWith}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}

function ProseSection({ heading, text, delay }: { heading: string; text: string; delay: number }) {
  return (
    <ScrollReveal delay={delay}>
      <h2 className="text-2xl font-bold mb-4">{heading}</h2>
      <p className="text-[var(--color-muted)] text-base leading-relaxed">{text}</p>
    </ScrollReveal>
  );
}

/** "In the Code" then "A Closer Look", each only when it has content. */
function CodeAndMedia({ detail }: { detail: Project['detail'] }) {
  return (
    <>
      {/* Code excerpts */}
      {detail.codeSnippets && detail.codeSnippets.length > 0 && (
        <ScrollReveal delay={0.05}>
          <h2 className="text-2xl font-bold mb-4">In the Code</h2>
          <div className="space-y-6">
            {detail.codeSnippets.map((snippet) => (
              <CodeBlock key={snippet.title} snippet={snippet} />
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Screenshot / recording gallery */}
      {detail.media && detail.media.length > 0 && (
        <ScrollReveal delay={0.05}>
          <h2 className="text-2xl font-bold mb-4">A Closer Look</h2>
          <MediaGallery media={detail.media} />
        </ScrollReveal>
      )}
    </>
  );
}
