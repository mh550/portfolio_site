'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Logo from '@/components/logos/Logo';
import { logoPaths, type LogoKey } from '@/components/logos/paths';

interface LogoEntry {
  id: LogoKey;
  style: React.CSSProperties;
  floatDuration: number;
  floatY: number;
}

// Hover state; the 1.5× growth is left out with reduced motion
const hoverColour = { color: '#00d4ff', filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.65))' };

// 25% larger at lg+ viewports (40px → 50px)
const ICON_SPAN = 'w-10 h-10 lg:w-[50px] lg:h-[50px]';

// Four staggered columns outside the hero's text column (x 216–1064 at 1280), three marks each (D78). The right
// outer column stops at 66% so the bottom-right VoiceWidget never sits on a mark. Checked by .harness/logos-check.mjs.
const logos: LogoEntry[] = [
  { id: 'claude', style: { top: '18%', left: '4%' }, floatDuration: 5.2, floatY: 10 },
  { id: 'python', style: { top: '44%', left: '4%' }, floatDuration: 6.8, floatY: 14 },
  { id: 'sqlite', style: { top: '70%', left: '4%' }, floatDuration: 5.9, floatY: 8 },
  { id: 'livekit', style: { top: '31%', left: '11%' }, floatDuration: 7.1, floatY: 12 },
  { id: 'bash', style: { top: '57%', left: '11%' }, floatDuration: 6.3, floatY: 10 },
  { id: 'docker', style: { top: '83%', left: '11%' }, floatDuration: 5.5, floatY: 13 },
  { id: 'typescript', style: { top: '24%', right: '11%' }, floatDuration: 6.6, floatY: 9 },
  { id: 'postgresql', style: { top: '50%', right: '11%' }, floatDuration: 6.0, floatY: 12 },
  { id: 'linux', style: { top: '76%', right: '11%' }, floatDuration: 7.4, floatY: 11 },
  { id: 'nextjs', style: { top: '14%', right: '4%' }, floatDuration: 5.7, floatY: 14 },
  { id: 'n8n', style: { top: '40%', right: '4%' }, floatDuration: 7.0, floatY: 9 },
  { id: 'github', style: { top: '66%', right: '4%' }, floatDuration: 6.1, floatY: 12 },
];

// Hidden below xl (1280 px), where they sat behind the hero text (D33)
export default function FloatingLogos() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden="true" className="absolute inset-0 hidden xl:block print:hidden pointer-events-none overflow-hidden">
      {logos.map((logo) => {
        const { title } = logoPaths[logo.id];
        return (
          // Outer div: continuous y float only (none with reduced motion)
          <motion.div
            key={logo.id}
            data-logo={logo.id}
            className="absolute pointer-events-auto cursor-default"
            style={logo.style}
            animate={reduced ? undefined : { y: [0, -logo.floatY, 0] }}
            transition={{
              duration: logo.floatDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Inner div: color/scale/filter tracked as motion values for hover */}
            <motion.div
              title={title}
              initial={{
                color: 'rgba(255,255,255,0.4)',
                scale: 1,
                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.1))',
              }}
              whileHover={reduced ? hoverColour : { ...hoverColour, scale: 1.5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className={`block ${ICON_SPAN}`}>
                <Logo name={logo.id} className="w-full h-full" />
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
