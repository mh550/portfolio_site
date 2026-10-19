'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface LoopingVideoProps {
  src: string;
  label: string;
  className?: string;
}

/** A muted looping clip with a pause/play button (WCAG 2.2.2). It starts after hydration, or not at all with reduced
 *  motion. */
export default function LoopingVideo({ src, label, className }: LoopingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  // Driven only by the element's play/pause events, so a blocked play() (Low Power Mode, a browser setting) leaves
  // the button offering Play
  const [playing, setPlaying] = useState(false);

  // No autoPlay attribute: the server can't know the preference, so start once the client does
  useEffect(() => {
    if (!reduced) void ref.current?.play()?.catch(() => {});
  }, [reduced]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) void video.play()?.catch(() => {});
    else video.pause();
  }

  return (
    <>
      <video
        ref={ref}
        muted
        loop
        playsInline
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={className}
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-sm text-white transition-colors hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
      </button>
    </>
  );
}
