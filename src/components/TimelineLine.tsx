'use client';

import { motion } from 'framer-motion';

// Animated vertical timeline bar — fades in, rises, and grows downward on scroll into view
export default function TimelineLine() {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute top-2 bottom-0 w-px bg-gradient-to-b from-[var(--color-accent)]/50 via-[var(--color-accent)]/25 to-[var(--color-accent)]/5"
      style={{ left: '5.5px', transformOrigin: 'top' }}
      initial={{ opacity: 0, y: 40, scaleY: 0 }}
      whileInView={{ opacity: 1, y: 0, scaleY: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}
