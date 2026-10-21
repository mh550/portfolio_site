import { useId, type ReactNode } from 'react';
import type { AboutAgent, Episode, MemoryBody, MemoryEvent, MemoryFact } from '@/lib/concierge/contract';
import { latencyLabels, talkPage } from '@/lib/data/concierge';
import ForgetMeButton from '@/components/talk/ForgetMeButton';
import { quietSmall } from './buttons';
import type { ForgetStatus } from '@/components/talk/sessionReducer';
import { DASH, count, dateTime, day, percent } from '@/components/talk/format';

// The Memory tab (D90, plan docs/plans/2026-10-21-P3-concierge-in-site.md § Memory view): what the concierge remembers
// as the agent last sent it on `concierge.memory`. About you (Profile, Episodes, Events) and About the agent
// (Knowledge, Working, Cache) from a v2 body; a v1 body has only the profile and the summary, and says so. Forget me is
// always at the foot: live, its confirm step; otherwise disabled, with the hint. Before a call it shows the body the
// site cached from the last one (D91), greyed, with "as of" its time; once Forget me has gone through, only that line.

const view = talkPage.memoryView;
const EVENTS_SHOWN = 12;
// A cached body: every line in the muted grey (still 4.5:1), the kind dots dimmed; a rejected event keeps its red,
// which is what marks it for sighted readers ("Not kept:" is sr-only).
const STALE =
  '**:text-[var(--color-muted)] [&_[data-dot]]:opacity-60 [&_[data-rejected]_span]:text-[var(--color-mem-event-rejected)]';

const Dot = ({ colour }: { colour: string }) => (
  <span aria-hidden="true" data-dot className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colour}`} />
);

const Muted = ({ children }: { children: ReactNode }) => <p className="text-[var(--color-muted)]">{children}</p>;

// One kind of memory: a group named by its h4, with the kind's dot.
function Kind({ id, name, colour, children }: { id: string; name: string; colour: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="space-y-2">
      <h4 id={id} className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-white/90">
        <span aria-hidden="true" data-dot className={`h-2 w-2 rounded-full ${colour}`} />
        {name}
      </h4>
      {children}
    </div>
  );
}

function Section({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h3 id={id} className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
        {heading}
      </h3>
      {children}
    </section>
  );
}

// A small label/value table: Knowledge, Working, Cache.
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-white/90">{label}</dt>
          <dd className="whitespace-nowrap text-right tabular-nums text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const glyph = 'mt-0.5 inline h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]';

function ChannelGlyph({ channel }: { channel: string | null }) {
  if (channel === 'voice')
    return (
      <svg aria-hidden="true" focusable="false" data-channel="voice" viewBox="0 0 16 16" className={glyph} fill="currentColor">
        <rect x="2" y="6" width="2" height="4" rx="1" />
        <rect x="7" y="3" width="2" height="10" rx="1" />
        <rect x="12" y="5" width="2" height="6" rx="1" />
      </svg>
    );
  if (channel === 'text')
    return (
      <svg aria-hidden="true" focusable="false" data-channel="text" viewBox="0 0 16 16" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 2.5h4M6 13.5h4M8 2.5v11" />
      </svg>
    );
  return null;
}

function ProfileChip({ fact }: { fact: MemoryFact }) {
  const learned = dateTime(fact.learned_at);
  const learnedLine = learned ? `${talkPage.memory.fact.learnedAt} ${learned}` : undefined;
  return (
    <li
      title={learnedLine}
      className="rounded-md border-l-2 border-[var(--color-mem-profile)] bg-[var(--color-background)] px-3 py-2"
    >
      <p className="flex items-start gap-2 break-words">
        <span className="min-w-0">
          <span className="font-mono text-xs uppercase tracking-wide text-[var(--color-mem-profile)]">{fact.slot}</span>{' '}
          <span className="text-white">{fact.value}</span>
        </span>
        <ChannelGlyph channel={fact.channel} />
        {fact.channel && (
          <>
            {' '}
            <span className="sr-only">{`(${fact.channel})`}</span>
          </>
        )}
      </p>
      {fact.source && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{fact.source}</p>}
      {learnedLine && <span className="sr-only">{learnedLine}</span>}
    </li>
  );
}

function Profile({ id, facts }: { id: string; facts: MemoryFact[] }) {
  return (
    <Kind id={id} name={view.kinds.profile} colour="bg-[var(--color-mem-profile)]">
      {facts.length === 0 ? (
        <Muted>{talkPage.empty.memory}</Muted>
      ) : (
        <ul className="space-y-2">
          {facts.map((fact, i) => (
            // The contract doesn't promise unique ids, so the index keeps keys unique.
            <ProfileChip key={`${fact.id}-${i}`} fact={fact} />
          ))}
        </ul>
      )}
    </Kind>
  );
}

// null: this agent version doesn't send the list. []: it does, and there is nothing in it yet.
function Rows<T>({ items, children }: { items: T[] | null; children: (item: T, i: number) => ReactNode }) {
  if (items === null) return <Muted>{view.notReported}</Muted>;
  if (items.length === 0) return <Muted>{DASH}</Muted>;
  return <ul className="space-y-1.5">{items.map(children)}</ul>;
}

// Only the newest visit (first, as sent) can be the one in progress; an older one left open reads its summary.
function EpisodeRow({ episode, newest }: { episode: Episode; newest: boolean }) {
  const current = newest && episode.ended_at === null;
  const what = current ? view.inProgress : (episode.summary ?? DASH);
  return (
    <li data-current={current ? 'true' : undefined} className="flex gap-2 text-white/90">
      <Dot colour="bg-[var(--color-mem-episode)]" />
      <span className="min-w-0 break-words">{`${talkPage.memory.visit} ${episode.visit} · ${day(episode.started_at)} · ${what}`}</span>
    </li>
  );
}

function EventRow({ event }: { event: MemoryEvent }) {
  const rejected = event.type === 'gate_rejected';
  const at = dateTime(event.ts);
  return (
    // data-rejected, not the type: Tailwind reads `_` in an arbitrary variant as a space.
    <li data-type={event.type} data-rejected={rejected ? '' : undefined} title={at ?? undefined} className="flex gap-2 text-white/90">
      <Dot colour={rejected ? 'bg-[var(--color-mem-event-rejected)]' : 'bg-[var(--color-mem-event)]'} />
      {rejected && <span className="sr-only">{`${view.rejected} `}</span>}
      <span className={`min-w-0 break-words ${rejected ? 'text-[var(--color-mem-event-rejected)]' : ''}`}>
        {event.detail}
      </span>
      {at && <span className="sr-only">{` ${at}`}</span>}
    </li>
  );
}

function AboutYou({ id, memory }: { id: string; memory: MemoryBody }) {
  const visitor = memory.about_visitor ?? null;
  return (
    <Section id={`${id}-you`} heading={view.aboutYou}>
      <Profile id={`${id}-profile`} facts={visitor?.profile ?? memory.facts} />
      {visitor ? (
        <>
          <Kind id={`${id}-episodes`} name={view.kinds.episodes} colour="bg-[var(--color-mem-episode)]">
            <Rows items={visitor.episodes}>{(e, i) => <EpisodeRow key={`${e.visit}-${i}`} episode={e} newest={i === 0} />}</Rows>
          </Kind>
          <Kind id={`${id}-events`} name={view.kinds.events} colour="bg-[var(--color-mem-event)]">
            <Rows items={visitor.events?.slice(0, EVENTS_SHOWN) ?? null}>
              {(e, i) => <EventRow key={i} event={e} />}
            </Rows>
          </Kind>
        </>
      ) : (
        // A v1 body: the summary stands in for the visits, and the rest isn't sent.
        <>
          {memory.summary && (
            <div>
              <p className="text-[var(--color-muted)]">{talkPage.memory.summary}</p>
              <p className="break-words text-white/90">{memory.summary}</p>
            </div>
          )}
          <p className="text-[var(--color-muted)]">
            <span>{`${view.kinds.episodes} · ${view.kinds.events}: `}</span>
            <span>{view.notReported}</span>
          </p>
        </>
      )}
    </Section>
  );
}

const yesNo = (value: boolean | null) => (value === null ? DASH : value ? latencyLabels.yes : latencyLabels.no);

function AboutTheAgent({ id, agent }: { id: string; agent: AboutAgent | null }) {
  const { knowledge, working, cache } = agent ?? {};
  return (
    <Section id={`${id}-agent`} heading={view.aboutAgent}>
      {!agent ? (
        <Muted>{view.notReported}</Muted>
      ) : (
        <>
          <Kind id={`${id}-knowledge`} name={view.kinds.knowledge} colour="bg-[var(--color-mem-knowledge)]">
            {knowledge ? (
              <Facts
                rows={[
                  [view.knowledge.words, count(knowledge.words)],
                  [view.knowledge.estTokens, count(knowledge.est_tokens)],
                  [
                    view.knowledge.sections,
                    <span key="s" title={knowledge.sections.join(', ')}>
                      {knowledge.sections.length}
                      {knowledge.sections.length > 0 && (
                        <span className="sr-only">{` ${knowledge.sections.join(', ')}`}</span>
                      )}
                    </span>,
                  ],
                  [
                    view.knowledge.source,
                    <span key="c" className="font-mono">
                      {knowledge.sources_commit ? knowledge.sources_commit.slice(0, 7) : DASH}
                    </span>,
                  ],
                ]}
              />
            ) : (
              <Muted>{view.notReported}</Muted>
            )}
          </Kind>
          <Kind id={`${id}-working`} name={view.kinds.working} colour="bg-[var(--color-mem-working)]">
            {working ? (
              <Facts
                rows={[
                  [view.working.items, count(working.items)],
                  [view.working.estTokens, count(working.est_tokens)],
                  [view.working.compacted, yesNo(working.compacted)],
                  [view.working.compactions, count(working.compactions)],
                ]}
              />
            ) : (
              <Muted>{view.notReported}</Muted>
            )}
          </Kind>
          <Kind id={`${id}-cache`} name={view.kinds.cache} colour="bg-[var(--color-muted)]">
            <Facts rows={[[latencyLabels.cachedShare, percent(cache?.cached_share ?? null)]]} />
          </Kind>
        </>
      )}
    </Section>
  );
}

export default function MemoryView({
  memory,
  asOf = null,
  live,
  forget,
  forgetLine,
  onForget,
}: {
  memory: MemoryBody | null;
  // When `memory` is the cached body: the time it was saved (status.ts shownMemory). Null for a live one.
  asOf?: string | null;
  live: boolean;
  forget: ForgetStatus;
  forgetLine: string;
  onForget: () => void;
}) {
  const id = useId();
  const hintId = `${id}-forget-hint`;
  const body = memory ? (
    <>
      <p className="break-words text-white/90">
        {`${talkPage.memory.talkingTo} ${memory.visitor.name || talkPage.empty.newVisitor} · ${talkPage.memory.visit} ${memory.visitor.visits}`}
      </p>
      <AboutYou id={id} memory={memory} />
      <AboutTheAgent id={id} agent={memory.about_agent ?? null} />
      {memory.retention_days ? <Muted>{view.retention(memory.retention_days)}</Muted> : null}
    </>
  ) : forget === 'done' ? null : (
    // Forgotten: the line at the foot says so, and nothing above it contradicts it.
    <Muted>{talkPage.empty.memory}</Muted>
  );
  const savedAt = memory && asOf !== null ? dateTime(asOf) : null;
  return (
    <div className="space-y-6 text-sm">
      {memory && asOf !== null ? (
        <div data-stale="true" className={`space-y-6 ${STALE}`}>
          {savedAt && <p>{`${view.asOf} ${savedAt}`}</p>}
          {body}
        </div>
      ) : (
        body
      )}
      <div className="space-y-2 border-t border-white/10 pt-4">
        {live ? (
          <ForgetMeButton onForget={onForget} busy={forget === 'busy'} />
        ) : (
          <>
            <button type="button" disabled aria-describedby={hintId} className={quietSmall}>
              {talkPage.labels.forgetMe}
            </button>
            <p id={hintId} className="text-[var(--color-muted)]">
              {view.forgetHint}
            </p>
          </>
        )}
        <p aria-live="polite" className={forget === 'failed' ? 'text-red-400' : 'text-[var(--color-muted)]'}>
          {forgetLine}
        </p>
      </div>
    </div>
  );
}
