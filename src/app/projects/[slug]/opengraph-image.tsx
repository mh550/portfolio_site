import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { profile, projects, getProjectBySlug } from '@/lib/data';

// Rendered at build time with next/og's bundled Noto Sans (Latin only); no font is loaded or fetched
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `Project case study from ${profile.name}, ${profile.positioning}`;

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

const colors = { background: '#0a0a0f', accent: '#00d4ff', text: '#f0f0f5', muted: '#8888a0' };

/** An arrow drawn as SVG: the bundled font has no →/↔, and a missing glyph makes next/og fetch one. */
function Arrow({ double, px }: { double?: boolean; px: number }) {
  return (
    <svg
      width={px}
      height={px * 0.6}
      viewBox="0 0 40 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ margin: `0 ${px * 0.25}px` }}
      aria-label={double ? '↔' : '→'}
    >
      <path d={double ? 'M4 12h32M28 4l8 8-8 8M12 4l-8 8 8 8' : 'M4 12h32M28 4l8 8-8 8'} />
    </svg>
  );
}

/** `text` as flex children, with every → and ↔ swapped for an `Arrow` and ≈ for ~. */
function withArrows(text: string, px: number): ReactNode[] {
  return text
    .replace(/≈/g, '~')
    .split(/\s*([→↔])\s*/)
    .filter(Boolean)
    .map((part, i) =>
      part === '→' || part === '↔' ? <Arrow key={i} double={part === '↔'} px={px} /> : <span key={i}>{part}</span>,
    );
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const metric = project.metrics?.[0];

  return new ImageResponse(
    (
      <div
        style={{
          background: colors.background,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: colors.text,
          borderTop: `12px solid ${colors.accent}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 26, color: colors.muted, letterSpacing: 2 }}>
            {project.company.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', fontSize: 58, lineHeight: 1.15 }}>
            {withArrows(project.title, 52)}
          </div>
        </div>

        {metric ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 104, color: colors.accent, lineHeight: 1 }}>
              {withArrows(metric.value, 88)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', fontSize: 34, color: colors.text }}>
              {withArrows(metric.label, 30)}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 32, color: colors.text, lineHeight: 1.35 }}>
            {project.shortDescription}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: colors.muted }}>
          <span style={{ color: colors.text }}>{profile.name}</span>
          <span style={{ margin: '0 16px', color: colors.accent }}>·</span>
          <span>{profile.positioning}</span>
        </div>
      </div>
    ),
    size,
  );
}
