'use client';

import { motion, useReducedMotion } from 'framer-motion';

const hidden = { opacity: 0, y: 40, scaleY: 0 };
const shown = { opacity: 1, y: 0, scaleY: 1 };

// Animated vertical timeline bar — fades in, rises, and grows downward on scroll into view
export default function TimelineLine() {
  const reduced = useReducedMotion();
  const common = {
    'aria-hidden': true,
    className:
      'absolute top-2 bottom-0 w-px bg-gradient-to-b from-[var(--color-accent)]/50 via-[var(--color-accent)]/25 to-[var(--color-accent)]/5',
    style: { left: '5.5px', transformOrigin: 'top' },
    initial: hidden,
  } as const;

  // Same element and initial state either way (the server can't know the preference), so it hydrates cleanly
  if (reduced) return <motion.div {...common} animate={shown} transition={{ duration: 0 }} />;

  return (
    <motion.div
      {...common}
      whileInView={shown}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}
