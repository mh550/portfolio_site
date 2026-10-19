'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Link from 'next/link';
import MethodStrip from '@/components/MethodStrip';
import { profile } from '@/lib/data';
import NodeGraph from './NodeGraph';
import FloatingLogos from './FloatingLogos';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const, delay },
  }),
};

// Reduced motion: same elements and initial state (the server can't know the preference, see ScrollReveal), shown at
// once. The transition must live in the variant: a variant's transition wins over the `transition` prop.
const instant: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

export default function HeroSection() {
  const variants = useReducedMotion() ? instant : fadeUp;

  return (
    // min-h-svh, not h-screen: on short phones the content is taller than the screen, so the hero grows
    <section className="relative -mt-16 min-h-svh pt-24 pb-16 flex items-center justify-center overflow-hidden">
      {/* Animated node graph background */}
      <NodeGraph />

      {/* Floating skill logos */}
      <FloatingLogos />

      {/* Radial gradient overlay for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, var(--color-background) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pb-4 pointer-events-none">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
        >
          {profile.positioning}
        </motion.p>

        <motion.h1
          custom={0.15}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="text-6xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tight mb-4 sm:mb-6"
        >
          Michael{' '}
          <span className="text-[var(--color-accent)]">Herron</span>
        </motion.h1>

        <motion.p
          custom={0.3}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="text-xl sm:text-2xl text-[var(--color-muted)] font-light tracking-wide mb-4"
        >
          {profile.tagline}
        </motion.p>

        <motion.p
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="text-base sm:text-lg text-[var(--color-foreground)]/80 max-w-2xl mx-auto mb-8"
        >
          {profile.subline}
        </motion.p>

        <motion.div custom={0.5} initial="hidden" animate="visible" variants={variants}>
          <MethodStrip className="mb-8 sm:mb-10" />
        </motion.div>

        <motion.div
          custom={0.6}
          initial="hidden"
          animate="visible"
          variants={variants}
          className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto"
        >
          <Link
            href="/projects"
            className="px-8 py-3 bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm tracking-wider uppercase rounded hover:bg-[var(--color-accent-dim)] transition-colors"
          >
            View Projects
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 border border-[var(--color-accent)]/40 text-[var(--color-foreground)] font-semibold text-sm tracking-wider uppercase rounded hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            About Me
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
