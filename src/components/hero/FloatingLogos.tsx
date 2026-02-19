'use client';

import { motion } from 'framer-motion';
import {
  siTypescript,
  siReact,
  siSupabase,
  siVercel,
  siZapier,
  siN8n,
  siClaude,
} from 'simple-icons';

interface LogoEntry {
  id: string;
  label: string;
  svgPath?: string;
  monogram?: string;
  // position as CSS values — use percentages to stay responsive
  style: React.CSSProperties;
  // unique float params to desync animations
  floatDuration: number;
  floatY: number;
}

const logos: LogoEntry[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    svgPath: siTypescript.path,
    style: { top: '18%', left: '18%' },
    floatDuration: 5.2,
    floatY: 10,
  },
  {
    id: 'react',
    label: 'React',
    svgPath: siReact.path,
    style: { top: '20%', right: '18%' },
    floatDuration: 6.8,
    floatY: 14,
  },
  {
    id: 'supabase',
    label: 'Supabase',
    svgPath: siSupabase.path,
    style: { top: '60%', left: '12%' },
    floatDuration: 5.9,
    floatY: 8,
  },
  {
    id: 'vercel',
    label: 'Vercel',
    svgPath: siVercel.path,
    style: { top: '62%', right: '12%' },
    floatDuration: 7.1,
    floatY: 12,
  },
  {
    id: 'n8n',
    label: 'n8n',
    svgPath: siN8n.path,
    style: { top: '40%', left: '8%' },
    floatDuration: 6.3,
    floatY: 10,
  },
  {
    id: 'zapier',
    label: 'Zapier',
    svgPath: siZapier.path,
    style: { top: '38%', right: '8%' },
    floatDuration: 5.5,
    floatY: 13,
  },
  {
    id: 'claude',
    label: 'Claude',
    svgPath: siClaude.path,
    style: { bottom: '25%', left: '24%' },
    floatDuration: 6.6,
    floatY: 9,
  },
  {
    id: 'pipedream',
    label: 'Pipedream',
    monogram: 'PD',
    style: { bottom: '23%', right: '24%' },
    floatDuration: 7.4,
    floatY: 11,
  },
];

export default function FloatingLogos() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {logos.map((logo) => (
        <motion.div
          key={logo.id}
          className="absolute pointer-events-auto cursor-default"
          style={{
            ...logo.style,
            color: 'rgba(255,255,255,0.4)',
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))',
          }}
          // Continuous float
          animate={{ y: [0, -logo.floatY, 0] }}
          transition={{
            duration: logo.floatDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          // Hover: scale up, switch to theme cyan, cyan glow
          whileHover={{
            scale: 1.5,
            color: '#00d4ff',
            filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.6))',
          }}
          title={logo.label}
        >
          {logo.svgPath ? (
            <svg
              role="img"
              viewBox="0 0 24 24"
              width={40}
              height={40}
              fill="currentColor"
              aria-label={logo.label}
            >
              <path d={logo.svgPath} />
            </svg>
          ) : (
            // Monogram fallback for Pipedream
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold font-mono"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {logo.monogram}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
