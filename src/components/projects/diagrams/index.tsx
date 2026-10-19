import { getProjectBySlug, type DiagramKey } from '@/lib/data';

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function Node({
  children,
  accent = false,
  className = '',
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        'rounded-lg border px-3 py-2 text-center text-sm leading-tight',
        accent
          ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
          : 'border-white/10 bg-[var(--color-surface)] text-[var(--color-foreground)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <span className="block font-mono text-[10px] text-[var(--color-muted)]">{children}</span>;
}

/** A small directional marker, horizontal or vertical. */
function Arrow({ dir = 'down', label }: { dir?: 'down' | 'right'; label?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-[var(--color-accent)]/70 ${
        dir === 'right' ? 'flex-row' : 'flex-col'
      }`}
      aria-hidden="true"
    >
      {label && <span className="font-mono text-[10px] tracking-wide">{label}</span>}
      <span className="text-base leading-none">{dir === 'right' ? '→' : '↓'}</span>
    </div>
  );
}

function Panel({
  title,
  tone = 'neutral',
  children,
}: {
  title: string;
  tone?: 'neutral' | 'accent' | 'muted';
  children: React.ReactNode;
}) {
  const ring =
    tone === 'accent'
      ? 'border-[var(--color-accent)]/40'
      : tone === 'muted'
        ? 'border-white/5'
        : 'border-white/10';
  return (
    <div className={`flex-1 rounded-xl border ${ring} bg-[var(--color-surface)]/40 p-4`}>
      <p
        className={`mb-3 font-mono text-[11px] uppercase tracking-[0.2em] ${
          tone === 'accent' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
        }`}
      >
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GHL ↔ JobTread — data model + waterfall match                       */
/* ------------------------------------------------------------------ */

function GhlJobtreadDiagram() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <Panel title="GoHighLevel (CRM)" tone="neutral">
          <Node>Subaccount <Sub>tenant</Sub></Node>
          <Arrow />
          <Node>Opportunity <Sub>→ pipeline stage</Sub></Node>
          <Arrow />
          <Node accent>Contact <Sub>phone · email · name</Sub></Node>
        </Panel>

        <div className="flex items-center justify-center md:px-1">
          <Arrow dir="right" label="on stage change" />
        </div>

        <Panel title="JobTread (PM)" tone="accent">
          <Node>Customer <Sub>find-or-create #1</Sub></Node>
          <Arrow />
          <Node accent>Contact <Sub>find-or-create #2</Sub></Node>
          <Arrow />
          <Node>Location <Sub>#3 · holds the contact</Sub></Node>
          <Arrow />
          <Node>Job <Sub>#4</Sub></Node>
        </Panel>
      </div>

      <div className="rounded-xl border border-white/10 bg-[var(--color-surface)]/40 p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Waterfall match — never create the same person twice
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Node accent className="min-w-[88px]">phone</Node>
          <Arrow dir="right" label="no match" />
          <Node className="min-w-[88px]">email</Node>
          <Arrow dir="right" label="no match" />
          <Node className="min-w-[88px]">name</Node>
          <Arrow dir="right" label="no match" />
          <Node className="min-w-[88px] border-dashed">create</Node>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linear adoption — before / after                                    */
/* ------------------------------------------------------------------ */

function LinearFlowDiagram() {
  return (
    <div className="flex flex-col items-stretch gap-4 md:flex-row">
      <Panel title="Before — scattered sheets" tone="muted">
        <Node className="opacity-80">Per-person Google Sheets</Node>
        <Node className="opacity-80">No status history</Node>
        <Node className="opacity-80">Manual re-test every build</Node>
        <Node className="opacity-80">Duplicates everywhere</Node>
      </Panel>

      <div className="flex items-center justify-center">
        <Arrow dir="right" label="Linear + AI agent" />
      </div>

      <Panel title="After — automated pipeline" tone="accent">
        <Node accent>File <Sub>auto-created in Linear</Sub></Node>
        <Arrow />
        <Node accent>Dedup <Sub>comment on existing issue</Sub></Node>
        <Arrow />
        <Node accent>Triage <Sub>root cause + context</Sub></Node>
        <Arrow />
        <Node>Implement <Sub>agentic via MCP</Sub></Node>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paint estimator — job hierarchy                                     */
/* ------------------------------------------------------------------ */

function PaintHierarchyDiagram() {
  const levels = [
    { label: 'Job', sub: 'the whole estimate', pad: 'ml-0' },
    { label: 'Area / Room', sub: 'kitchen, exterior, …', pad: 'ml-4 sm:ml-8' },
    { label: 'Feature', sub: 'paint, carpentry, …', pad: 'ml-8 sm:ml-16' },
    { label: 'Task', sub: 'individual priced line item', pad: 'ml-12 sm:ml-24' },
  ];
  return (
    <div className="space-y-2">
      {levels.map((lvl, i) => (
        <div key={lvl.label} className={`flex items-center gap-2 ${lvl.pad}`}>
          {i > 0 && <span className="text-[var(--color-accent)]/60" aria-hidden="true">└─</span>}
          <Node accent={i === 0} className="inline-block text-left">
            {lvl.label} <Sub>{lvl.sub}</Sub>
          </Node>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generic stepped sync flow (RingCentral, calendar mirror)            */
/* ------------------------------------------------------------------ */

function StepFlow({ steps }: { steps: { label: string; sub?: string; accent?: boolean }[] }) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-stretch gap-3 sm:flex-1 sm:flex-row sm:items-center">
          <Node accent={step.accent} className="flex-1">
            {step.label}
            {step.sub && <Sub>{step.sub}</Sub>}
          </Node>
          {i < steps.length - 1 && (
            <div className="flex justify-center sm:px-1">
              <Arrow dir="right" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RingCentralDiagram() {
  return (
    <StepFlow
      steps={[
        { label: 'Call / text', sub: 'RingCentral' },
        { label: 'Match phone #', sub: 'one or many contacts', accent: true },
        { label: 'JobTread contacts', sub: 'log to each match' },
        { label: 'Unified thread', sub: 'summary · transcript · actions', accent: true },
      ]}
    />
  );
}

function CalendarSyncDiagram() {
  return (
    <StepFlow
      steps={[
        { label: 'Source calendar', sub: 'Google Calendar' },
        { label: 'Sync engine', sub: 'idempotent · event-driven', accent: true },
        { label: 'Mirror calendar', sub: 'availability blocked' },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Agent harness — one run, and what surrounds it                      */
/* ------------------------------------------------------------------ */

function AgentHarnessDiagram() {
  // items-start: stretched to the tall "One run" column, "Around it" was mostly empty box at 1280 (M4-04).
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <Panel title="One run" tone="accent">
        <Node>harness CLI <Sub>start · status · queue</Sub></Node>
        <Arrow />
        <Node>Driver <Sub>deterministic bash, in tmux</Sub></Node>
        <Arrow />
        <Node>Initializer session <Sub>spec → feature_list.json</Sub></Node>
        <Arrow />
        <Node accent>Coding session per feature <Sub>fresh context, Opus or Sonnet</Sub></Node>
        <Arrow />
        <Node>Suite gate <Sub>red suite un-passes the feature</Sub></Node>
        <Arrow label="milestone done" />
        <Node>Verify session per milestone <Sub>one evidence row per step</Sub></Node>
        <Arrow />
        <Node>Tag + PR <Sub>run/&lt;run&gt;/&lt;milestone&gt;</Sub></Node>
        <Arrow label="tree == verified" />
        <Node accent>main <Sub>only the verified tree merges</Sub></Node>
      </Panel>

      <Panel title="Around it" tone="muted">
        <Node>INBOX.md <Sub>pause · stop · answers, from my phone</Sub></Node>
        <Node>Push notifications <Sub>verified, needs me, merged</Sub></Node>
        <Node>Usage-limit marker <Sub>one for the machine; every run waits on it</Sub></Node>
        <Node>Queue + ledger <Sub>runs go one at a time; a retro per run</Sub></Node>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Harness evolution — six stages, each changed by what broke before   */
/* ------------------------------------------------------------------ */

/** The stages are the agent-harness entry's iterations; each card shows its `when`, `label` and `short` line. */
function harnessIterations() {
  const iterations = getProjectBySlug('agent-harness')?.caseStudy?.iterations;
  if (!iterations?.length) throw new Error('harness-evolution diagram: the agent-harness entry has no iterations');
  return iterations;
}

function HarnessEvolutionDiagram() {
  const iterations = harnessIterations();
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-6">
      {iterations.map((it, i) => (
        <li key={`${it.when}-${it.label}`} className="flex flex-col gap-3">
          <Node accent={i === iterations.length - 1} className="flex-1 md:px-1.5">
            <span className="block font-mono text-[10px] text-[var(--color-muted)]">{it.when}</span>
            <span className="my-1 block font-bold md:text-[13px]">{it.label}</span>
            <Sub>{it.short}</Sub>
          </Node>
          {i < iterations.length - 1 && (
            <div className="md:hidden">
              <Arrow />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Home media server — listening, the server, every night              */
/* ------------------------------------------------------------------ */

function MediaServerDiagram() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <Panel title="Listening" tone="neutral">
        <Node>Phone <Sub>Amperfy or the web client</Sub></Node>
        <Arrow label="HTTPS" />
        <Node>Private network <Sub>HTTPS only; nothing open to the LAN or the internet</Sub></Node>
      </Panel>

      <Panel title="Home server · Docker Compose" tone="accent">
        <Node>Navidrome <Sub>library, playlists, transcoding</Sub></Node>
        <Arrow label="playlists · signed stream links" />
        <Node>crates service <Sub>crate flags, wanted queue, approvals</Sub></Node>
        <Arrow label="approved downloads" />
        <Node accent>Worker <Sub>approved rows only: VPN search → verify → beets</Sub></Node>
        <Arrow label="verified files, then a rescan" />
        <Node>Library <Sub>removals go to a trash with an undo log</Sub></Node>
      </Panel>

      <Panel title="Every night" tone="muted">
        <Node>Database snapshot <Sub>both databases, all or nothing, under the lock (install pending)</Sub></Node>
        <Arrow />
        <Node>Encrypted backup <Sub>to a second disk, every night</Sub></Node>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

const DIAGRAMS: Record<DiagramKey, () => React.ReactElement> = {
  'ghl-jobtread': GhlJobtreadDiagram,
  'linear-flow': LinearFlowDiagram,
  'paint-hierarchy': PaintHierarchyDiagram,
  ringcentral: RingCentralDiagram,
  'calendar-sync': CalendarSyncDiagram,
  'agent-harness': AgentHarnessDiagram,
  'harness-evolution': HarnessEvolutionDiagram,
  'media-server': MediaServerDiagram,
};

const CAPTIONS: Record<DiagramKey, string> = {
  'ghl-jobtread': 'Entity mapping across both platforms, and the waterfall match that prevents duplicates.',
  'linear-flow': 'From scattered per-person spreadsheets to an automated file → dedup → triage → implement pipeline.',
  'paint-hierarchy': 'How a paint job decomposes into priced line items.',
  ringcentral: 'Every call and text matched by phone number into a single per-customer thread.',
  'calendar-sync': 'Idempotent, event-driven mirroring from a source calendar to an availability calendar.',
  'agent-harness':
    'One run: fresh sessions do the judgment, the driver does the bookkeeping, and nothing reaches main unverified.',
  'harness-evolution': 'Six ways of driving agents, each changed by what broke in the one before.',
  'media-server':
    'Nothing is open to the internet, streams go straight from Navidrome to the phone, and only approved, verified downloads reach the library.',
};

// What each diagram shows, for screen readers: role="img" hides the diagram's fragmented node text (D17).
const LABELS: Record<DiagramKey, string> = {
  'ghl-jobtread':
    'A GoHighLevel opportunity changes stage and its contact flows into JobTread, where the customer, contact, location and job are each found or created in turn; a contact is matched by phone, then email, then name, and created only when nothing matches.',
  'linear-flow':
    'Before: bugs lived in per-person Google Sheets with no status history, manual re-tests and duplicates. After: each bug is filed in Linear automatically, deduplicated, triaged with its root cause, then implemented by an agent over MCP.',
  'paint-hierarchy':
    'A paint job breaks into areas or rooms, each area into features such as paint or carpentry, and each feature into individually priced tasks.',
  ringcentral:
    'A RingCentral call or text is matched by phone number to one or more JobTread contacts and logged to each, building one thread with a summary, transcript and action items.',
  'calendar-sync':
    'Events on a source Google Calendar pass through an idempotent, event-driven sync engine to a mirror calendar that blocks the same time as unavailable.',
  'agent-harness':
    'The harness CLI starts a deterministic driver. The driver runs an initializer session that turns the spec into a feature list, then one fresh coding session per feature. Every feature passes a suite gate; every finished milestone gets an independent verify session; a verified milestone is tagged and opened as a PR into main, and merges only if the merged tree is the verified tree. Around the run: an INBOX file for steering from a phone, push notifications, one usage-limit marker for the whole machine, and a queue with a ledger.',
  'harness-evolution': `Six stages, each changed by what broke in the one before. ${harnessIterations()
    .map((it) => `${it.when}, ${it.label}. ${it.short}.`)
    .join(' ')}`,
  'media-server':
    'My phone reaches the home server only through a private network, over HTTPS. On the server, Navidrome holds the library and the playlists and streams to the phone. The crates service keeps the crate flags, the wanted queue and the approvals. A worker container takes only approved downloads: it searches through a VPN, verifies each file, files it into the library with beets and asks Navidrome to rescan. Removals go to a trash with an undo log. Every night an encrypted backup goes to a second disk. A newer job, built and waiting for my install, snapshots both databases all or nothing under the lock and sends a heartbeat only when the backup is fresh.',
};

export default function ProjectDiagram({ diagram }: { diagram: DiagramKey }) {
  const Component = DIAGRAMS[diagram];
  if (!Component) return null;

  return (
    <figure className="rounded-2xl border border-white/8 bg-[var(--color-surface)]/30 p-5 sm:p-6">
      <div role="img" aria-label={LABELS[diagram]}>
        <Component />
      </div>
      <figcaption className="mt-4 text-center text-xs text-[var(--color-muted)]">
        {CAPTIONS[diagram]}
      </figcaption>
    </figure>
  );
}
