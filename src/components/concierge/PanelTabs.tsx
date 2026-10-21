'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { privacyNote, talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import LatencyPanel from '@/components/talk/LatencyPanel';
import type { SessionState } from '@/components/talk/sessionReducer';
import MemoryView from './MemoryView';
import { forgetLine, type shownMemory } from './status';

const TABS = ['memory', 'latency', 'privacy'] as const;
type Tab = (typeof TABS)[number];

// Memory · Latency · Privacy under the memory strip, in the drawer and on /talk (D90, plan § Memory view). The WAI-ARIA
// tabs pattern with automatic activation: one tab stop, the arrows move and wrap, Home and End jump. `compact` (the
// drawer) caps the panel's height (a quarter of the screen below lg, 40 vh from lg) so it scrolls on its own and the
// transcript keeps most of the sheet.
export default function PanelTabs({
  state,
  shown = { memory: state.memory, asOf: null },
  onForget,
  compact = false,
}: {
  state: SessionState;
  // What the Memory tab shows: the session's body, or the cached one with its time (status.ts shownMemory, D91).
  shown?: ReturnType<typeof shownMemory>;
  onForget: () => void;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<Tab>('memory');
  const id = useId();
  const tabs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const tabId = (tab: Tab) => `${id}-tab-${tab}`;
  const panelId = (tab: Tab) => `${id}-panel-${tab}`;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: Tab) {
    const i = TABS.indexOf(tab);
    const next = {
      ArrowRight: TABS[(i + 1) % TABS.length],
      ArrowLeft: TABS[(i - 1 + TABS.length) % TABS.length],
      Home: TABS[0],
      End: TABS[TABS.length - 1],
    }[event.key];
    if (!next) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  const content: Record<Tab, ReactNode> = {
    memory: (
      <MemoryView
        memory={shown.memory}
        asOf={shown.asOf}
        live={state.phase === 'live'}
        forget={state.forget}
        forgetLine={forgetLine(state)}
        onForget={onForget}
      />
    ),
    latency: <LatencyPanel turns={state.turns} />,
    privacy: (
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--color-muted)]">
        {privacyNote.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    ),
  };

  return (
    <div>
      <div role="tablist" aria-label={talkPage.memoryView.tabs} className="flex gap-1 border-b border-white/10">
        {TABS.map((tab) => {
          const on = tab === selected;
          return (
            <button
              key={tab}
              ref={(el) => {
                tabs.current[tab] = el;
              }}
              type="button"
              role="tab"
              id={tabId(tab)}
              aria-selected={on}
              aria-controls={panelId(tab)}
              tabIndex={on ? 0 : -1}
              onClick={() => setSelected(tab)}
              onKeyDown={(event) => onKeyDown(event, tab)}
              className={`-mb-px border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
                on
                  ? 'border-[var(--color-accent)] text-white'
                  : 'border-transparent text-[var(--color-muted)] hover:text-white'
              } ${focusRing}`}
            >
              {talkPage.headings[tab]}
            </button>
          );
        })}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={panelId(tab)}
          aria-labelledby={tabId(tab)}
          tabIndex={0}
          hidden={tab !== selected}
          className={`rounded-md pt-4 ${compact ? 'max-h-[25vh] overflow-y-auto overscroll-contain lg:max-h-[40vh]' : ''} ${focusRing}`}
        >
          {content[tab]}
        </div>
      ))}
    </div>
  );
}
