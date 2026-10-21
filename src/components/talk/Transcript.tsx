'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import TalkPanel from './TalkPanel';

// One line of the conversation: a finished segment, or one still being spoken (`final: false`), which the agent's
// `lk.transcription` stream replaces in place as it firms up. A `notice` is the page's own line, not a speaker's: the
// usher saying where it is taking the visitor (D94), always final.
export interface TranscriptLine {
  key: string;
  who: 'visitor' | 'agent' | 'notice';
  text: string;
  final: boolean;
}

// Client only to keep the newest line in view: the log scrolls, so it is also focusable for keyboard scrolling.
// While a line is still being spoken the log is aria-busy, so a screen reader reads it once it is final, not every
// partial fragment over the agent's voice.
// `children` is the message box, which sits under the log in the same section. `fill`: in the concierge panel the log
// is the region that grows (flex-1) and scrolls, instead of /talk's fixed heights.
export default function Transcript({
  lines,
  fill = false,
  children,
}: {
  lines: TranscriptLine[];
  fill?: boolean;
  children?: ReactNode;
}) {
  const logRef = useRef<HTMLDivElement>(null);
  // Follow new lines only while the reader is at the bottom; someone who scrolled up to reread stays put.
  const atBottom = useRef(true);
  useEffect(() => {
    const log = logRef.current;
    if (log && atBottom.current) log.scrollTop = log.scrollHeight;
  }, [lines]);
  const onScroll = () => {
    const log = logRef.current;
    if (log) atBottom.current = log.scrollTop + log.clientHeight >= log.scrollHeight - 24;
  };

  return (
    <TalkPanel
      id="talk-transcript"
      heading={talkPage.headings.transcript}
      className={fill ? 'flex min-h-52 flex-1 flex-col p-4' : undefined}
    >
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-busy={lines.some((line) => !line.final)}
        onScroll={onScroll}
        aria-labelledby="talk-transcript"
        tabIndex={0}
        className={`${fill ? 'min-h-0 flex-1 overscroll-contain' : 'max-h-80 lg:h-[28rem] lg:max-h-none'} overflow-y-auto rounded-md border border-white/10 bg-[var(--color-background)] p-4 ${focusRing}`}
      >
        {lines.length === 0 ? (
          <p className="text-[var(--color-muted)]">{talkPage.empty.transcript}</p>
        ) : (
          <ol className="space-y-3">
            {lines.map((line) =>
              line.who === 'notice' ? (
                <li key={line.key} data-who="notice" data-final="true" className="break-words italic text-[var(--color-muted)]">
                  {line.text}
                </li>
              ) : (
              <li key={line.key} data-final={String(line.final)} className="break-words">
                <span
                  className={`mr-2 font-mono text-xs uppercase tracking-wide ${
                    line.who === 'agent' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                >
                  {talkPage.speakers[line.who]}
                </span>{' '}
                <span className={line.final ? 'text-white' : 'italic text-white/70'}>{line.text}</span>
                {!line.final && (
                  <span aria-hidden="true" className="ml-0.5 text-[var(--color-accent)]">
                    …
                  </span>
                )}
              </li>
              )
            )}
          </ol>
        )}
      </div>
      {children}
    </TalkPanel>
  );
}
