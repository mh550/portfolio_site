'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import NodeGraph from './NodeGraph';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const, delay },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated node graph background */}
      <NodeGraph />

      {/* Radial gradient overlay for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-radial-gradient pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, var(--color-background) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="font-mono text-[var(--color-accent)] text-sm tracking-[0.3em] uppercase mb-6"
        >
          Full-Stack & Integration Engineer
        </motion.p>

        <motion.h1
          custom={0.15}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-6xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tight mb-6"
        >
          Michael{' '}
          <span className="text-[var(--color-accent)]">Herron</span>
        </motion.h1>

        <motion.p
          custom={0.3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-xl sm:text-2xl text-[var(--color-muted)] font-light tracking-wide mb-10"
        >
          I build systems that connect things.
        </motion.p>

        <motion.div
          custom={0.45}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
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

      {/* Scroll indicator */}
      <motion.div
        aria-label="Scroll down"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="text-[var(--color-muted)] text-xs font-mono tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          className="w-0.5 h-8 bg-gradient-to-b from-[var(--color-accent)] to-transparent"
          animate={{ scaleY: [1, 0.4, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
