'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const reduced = useReducedMotion();

  const initial = {
    opacity: 0,
    y: direction === 'up' ? 40 : 0,
    x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
  };
  const shown = { opacity: 1, y: 0, x: 0 };

  // Same element on server and client: the server can't know the preference and renders `initial`, so with reduced
  // motion the client reveals it at once instead of swapping in a plain div (which kept the server's opacity: 0).
  if (reduced) {
    return (
      <motion.div className={className} initial={initial} animate={shown} transition={{ duration: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={shown}
      viewport={{ once: true, margin: '-80px 0px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
