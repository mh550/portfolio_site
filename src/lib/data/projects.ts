import { methodSteps } from './approach';

export type ProjectCategory = 'integration' | 'full-stack' | 'ai' | 'education' | 'systems' | 'process';

/** A key that maps a project to an authored, theme-styled diagram component. */
export type DiagramKey =
  | 'ghl-jobtread'
  | 'ringcentral'
  | 'linear-flow'
  | 'paint-hierarchy'
  | 'calendar-sync';

export interface ProjectMedia {
  type: 'image' | 'video';
  src: string;
  alt: string;
  caption?: string;
}

/** A big-number impact callout, e.g. { value: '~80%', label: 'less bug-filing time' }. */
export interface Metric {
  value: string;
  label: string;
}

export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
}

/** A recorded choice in a case study: what was chosen, over what, why, and what it cost. */
export interface Decision {
  id: string;
  title: string;
  chose: string;
  over?: string;
  because: string;
  cost?: string;
}

/** One step in how a project evolved. */
export interface Iteration {
  when: string;
  label: string;
  what: string;
  why: string;
}

/** Something that broke and the rule it left behind. */
export interface Lesson {
  broke: string;
  rule: string;
}

export interface ProjectLink {
  label: string;
  href: string;
  kind: 'repo' | 'live' | 'doc' | 'demo';
}

/** The case-study body (spec M3). A project with one renders the case-study page order (D16). */
export interface CaseStudy {
  role: string;
  timeframe: string;
  method: { diagnose: string; decide: string; build: string; verify: string; simplify: string };
  decisions: Decision[];
  iterations?: Iteration[];
  lessons: Lesson[];
  links: ProjectLink[];
  /** The honest one-line "how it was built" (D10). */
  builtWith?: string;
  /** Diagrams rendered after the iteration timeline (D17). */
  extraDiagrams?: DiagramKey[];
}

export interface Project {
  slug: string;
  title: string;
  company: string;
  shortDescription: string;
  categories: ProjectCategory[];
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured: boolean;
  /** Display order across the site, lower first (spec D12). Unique per project. */
  order: number;
  /** Card preview + detail-page hero image/video. Optional until assets are captured. */
  thumbnail?: ProjectMedia;
  /** Impact callouts surfaced on the card and at the top of the detail page. */
  metrics?: Metric[];
  detail: {
    problem: string;
    approach: string;
    challenges: string;
    outcome: string;
    /** Authored architecture/process diagram rendered after "The Approach". */
    architectureDiagram?: DiagramKey;
    /** Screenshot / screen-recording gallery (filled once assets exist). */
    media?: ProjectMedia[];
    /** Inline code/config excerpts that prove the engineering is real. */
    codeSnippets?: CodeSnippet[];
  };
  caseStudy?: CaseStudy;
}

export const projects: Project[] = [
  {
    slug: 'agent-harness',
    title: 'Agent Harness: overnight software delivery with verification gates',
    company: 'Personal · open source',
    shortDescription:
      'A driver that runs coding agents overnight, one fresh session per feature, and merges only work an independent session has verified.',
    categories: ['systems', 'process', 'ai'],
    techStack: ['Bash', 'Node.js', 'Git', 'tmux', 'jq', 'GitHub CLI', 'Claude Code'],
    githubUrl: 'https://github.com/mh550/agent-harness',
    featured: true,
    order: 1,
    metrics: [
      { value: '55', label: 'features passing in one day' },
      { value: '52', label: 'verified and merged, 12 PRs' },
      { value: '+374', label: 'tests added' },
      { value: '≈ $2.53', label: 'per passing feature' },
    ],
    detail: {
      problem:
        'I have about 10 hours a week and several personal projects. I wanted coding agents to build overnight while I slept, and to steer them from my phone. Every approach that lived inside one session hit one of three walls: the model\'s context limit, my plan\'s usage limit, or the auto-mode permission classifier.',
      approach:
        'A fresh agent session per feature with its state on disk, a deterministic driver for the bookkeeping, and independent verification before anything merges.',
      challenges:
        'Usage limits, the permission classifier and thin verification each cost a night before they became rules.',
      outcome:
        'On Oct 17 the harness ran two projects, starting overnight on v2 and finishing on v3 that day: 71 features attempted, 55 passing, 52 verified and merged through 12 PRs, and 374 tests added (1,242 → 1,616). It cost $139.34 in total, about $2.53 per passing feature, across 127 sessions and 13.9 hours of run time. The update to this site is a v3 run too: its pull requests are linked below.',
      codeSnippets: [
        {
          title: 'lib/driver.sh · the merge gate: only the verified tree lands on main',
          language: 'bash',
          code: String.raw`# Merge one verified milestone (its tag) into main through a PR. The invariant: the tree that lands on main is the
# tree that was verified. 0 = merged or proposed · 1 = needs Michael (conflict, refusal) · 3 = held: main has content
# this milestone wasn't verified with (the next milestone's verify includes it, and its merge carries this one)
merge_one() {
  local m=$1 tag=run/$RUN_ID/$1 c head url tree
  head=harness-merge/$RUN_ID-$m
  c=$(git rev-list -n1 "$tag") || return 1
  git fetch -q origin "$MAIN_BRANCH" || return 1
  if git merge-base --is-ancestor "$c" "origin/$MAIN_BRANCH"; then touch "$STATE/merged-$m"; note "$m merged into $MAIN_BRANCH (already there)"; return 0; fi
  if ! tree=$(git merge-tree --write-tree "origin/$MAIN_BRANCH" "$c" 2>/dev/null | head -1); then
    note "$m conflicts with $MAIN_BRANCH; not merged (needs Michael)"; notify "$m needs Michael: conflicts with $MAIN_BRANCH"; return 1
  fi
  [[ $tree == "$(git rev-parse "$c^{tree}")" ]] || return 3`,
        },
      ],
    },
    caseStudy: {
      role: 'Designer and operator',
      timeframe: 'Sep – Oct 2026',
      method: {
        diagnose:
          'Every single-session approach hit one of three walls: the context limit, the usage limit, or the permission classifier. One night three loops shared one plan and every repo went silent from 00:12 to 07:19; a long thread ran out of context; the classifier blocked merges.',
        decide:
          'I gave each feature a fresh session and put all state on disk: a feature list, a progress log and git. Agents do the judgment; a deterministic bash driver does the bookkeeping.',
        build:
          'Harness v1 was a ~60-line script inside one project. v2 became its own repo: a worktree per run, repair and continue, an independent verify per milestone, steering from my phone. v3 merged verified milestones itself, waited out usage limits and queued runs.',
        verify:
          'A red suite un-passes a feature. Each finished milestone gets an independent verify session that re-runs every step and writes one evidence row per step. Nothing merges unless the tree that lands on main is byte-for-byte the tree that was verified.',
        simplify:
          'I went from three parallel loops to one serial queue under one usage limit for the whole machine, and from a human tap on every merge to a gated merge. A PR-only mode stays for projects where I still merge, like this site.',
      },
      decisions: [
        {
          id: 'D-H1',
          title: 'A fresh session per feature',
          chose: 'a new headless session for every feature, with its state on disk,',
          over: 'one long loop session or an orchestrator with subagents',
          because: 'every single-session approach hit the context limit eventually; subagents only delayed it.',
          cost: 'Every piece of state has to be written down, which is also what makes it inspectable.',
        },
        {
          id: 'D-H2',
          title: 'Models by role',
          chose: 'the most capable model for the one-time initializer, Opus to build and review, and Sonnet to verify,',
          over: 'one model for everything',
          because:
            'the initializer runs once and decides the quality of the whole night, while verification can run on a cheaper model.',
        },
        {
          id: 'D-H4',
          title: 'Guard against false passes',
          chose: 'a red suite that un-passes the feature, plus an independent verify session per milestone,',
          over: 'trusting the session\'s own "passes"',
          because:
            'the expensive failure is a feature marked done that isn\'t, and a second agent re-running the steps cold is the cheapest independent check.',
          cost: 'One more session per milestone, capped at two rounds after a stub test showed the coder and verifier ping-ponging.',
        },
        {
          id: 'D-H5',
          title: 'The driver does the git bookkeeping',
          chose: 'a deterministic driver for sync, push, tag, PR and cleanup',
          over: 'letting agents merge and clean up',
          because: 'these steps must happen every time and the same way: a script does that; a prompt might not.',
        },
        {
          id: 'D-H11',
          title: 'Detect limits from structure, test against the real message',
          chose:
            'reading the structured error fields first, with a regex only as a fallback, and never counting a $0 session as an attempt,',
          over: 'a wider regex',
          because:
            'structure doesn\'t change its wording between releases, and the $0 rule catches the next unknown error too.',
        },
        {
          id: 'D-H17',
          title: 'The harness merges, under one invariant',
          chose: 'one PR per verified milestone, opened and merged by the driver in milestone order,',
          over: 'a human tap on every merge',
          because:
            'mornings shouldn\'t be a merge queue, and the tree that lands on main is byte-for-byte a tree that was verified, after its own review, an independent verify and a green suite.',
          cost: 'Human review moved from every merge to policy and permissions; a PR-only setting restores the tap, and this site\'s run uses it.',
        },
      ],
      iterations: [
        {
          when: 'Sep 2026',
          label: 'Long sessions',
          what: 'Long interactive sessions, with spec, research and decisions files for each idea.',
          why: 'It worked, but it needed me at the keyboard.',
        },
        {
          when: 'Oct 13–15',
          label: 'Runbook + loop',
          what: 'A written runbook as the agent\'s memory and an overnight loop; later one fresh thread per milestone, each ending with a handoff file.',
          why: 'Three loops ran on one plan and every repo went silent from 00:12 to 07:19 on usage limits. A long thread hit "context usage too high".',
        },
        {
          when: 'Oct 15–16',
          label: 'Orchestrator + subagents',
          what: 'One session orchestrates by role: Sonnet writes failing tests, Opus implements, Opus reviews.',
          why: 'It delivered (one app gained 154 tests in about 2.5 hours), then hit a new wall: the permission classifier blocked a rebuild as a "production deploy", and blocked merges.',
        },
        {
          when: 'Oct 16 eve',
          label: 'Harness v1',
          what: 'After Anthropic\'s "Effective harnesses for long-running agents": an initializer turns the spec into a feature list, then one fresh session per feature, from a ~60-line script.',
          why: 'It lived inside one project, ran in place, and one guard trip stopped the whole night.',
        },
        {
          when: 'Oct 16 night',
          label: 'Harness v2',
          what: 'Its own repo. "Agents do judgment; the driver does bookkeeping." A worktree per run, repair and continue, an independent verify per milestone, tag + PR, steering from my phone through INBOX.md, metrics.',
          why: 'Merges still needed a human, and each run handled usage limits on its own.',
        },
        {
          when: 'Oct 17',
          label: 'Harness v3',
          what: 'Merges verified milestones itself, waits out usage limits for the whole machine, queues runs, and writes a retro and a ledger entry per run.',
          why: 'The current version. The run that built this site update is a v3 run.',
        },
      ],
      lessons: [
        {
          broke:
            'The harness broke its own rule. I had tested the usage-limit detector against a message I made up; the real one said "You\'ve hit your session limit", so 45 sessions were spent in 6 minutes with 5 hours of budget left.',
          rule: 'Fakes mirror the live API: read the structured error first, and test against output captured from the real CLI.',
        },
        {
          broke: 'Two runs in parallel used up the 5-hour usage window in 2 h 49 min.',
          rule: 'One usage limit for the whole machine, and runs go one at a time by default.',
        },
        {
          broke: 'Verify sessions took 29–40 s, and real defects were found later by review.',
          rule: 'A verify writes one evidence row per step; with rows missing, it runs again on Opus.',
        },
        {
          broke:
            'An independent review of v3 before its first run found 2 critical and 8 important bugs, including a verify refused by a usage limit that counted as "holds" and would have merged code with zero evidence.',
          rule: 'The harness gets reviewed before it drives a real night, like any other code.',
        },
        {
          broke: 'One feature waiting on a human stopped a whole run: 14 independent features never ran behind it.',
          rule: 'Independent work has to be declared. The initializer now gives features an after list, so a blocked feature stops only what depends on it; blocking only on declared dependencies is the next proposed change.',
        },
      ],
      links: [
        { label: 'agent-harness on GitHub', href: 'https://github.com/mh550/agent-harness', kind: 'repo' },
        {
          label: 'This site update, built by the harness',
          href: 'https://github.com/mh550/portfolio_site/pulls?q=is%3Apr+harness',
          kind: 'repo',
        },
      ],
      builtWith:
        'I designed the process, the specs, the decision log and the verification gates, and I ran and reviewed every night. Claude Code agents wrote much of the harness code under that direction.',
    },
  },
  {
    slug: 'ghl-jobtread-integration',
    title: 'GoHighLevel ↔ JobTread Integration',
    company: 'Builder Clarity',
    shortDescription:
      'Multi-tenant, bidirectional integration between GoHighLevel CRM and JobTread project management — purpose-built for contractors.',
    categories: ['integration'],
    techStack: ['Pipedream', 'Supabase', 'JavaScript', 'OAuth', 'REST APIs', 'Webhooks'],
    featured: true,
    order: 5,
    metrics: [
      { value: '2 days → ~6 hrs', label: 'client onboarding time' },
      { value: 'Bidirectional', label: 'GHL ↔ JobTread sync' },
      { value: '0', label: 'manual re-entry of leads' },
    ],
    detail: {
      problem:
        'Contractors were managing jobs in JobTread and leads/clients in GoHighLevel with zero data flow between them — double entry, missed follow-ups, and no unified view of a customer journey. The core challenge was an ETL problem across two platforms paired with a deduplication problem: the same human exists in both systems, under different schemas, and must never be created twice.',
      approach:
        'I mapped the full entity model of each platform, then designed a bidirectional sync keyed on a waterfall match (phone → email → name). On a GoHighLevel pipeline-stage change, the integration finds-or-creates down JobTread\'s hierarchy in dependency order — customer, then contact, then location, then job — wiring each record to the ones above it. Built on Pipedream with custom JavaScript at nearly every step, Supabase bridging state between the platforms, and GoHighLevel\'s native automations driving the proof-of-concept triggers.',
      challenges:
        'JobTread and GoHighLevel model the same business differently — in JobTread a location belongs to a customer and carries one contact; in GoHighLevel an opportunity carries one contact and moves through tenant-specific pipeline stages. I originally matched a GHL contact to a JobTread customer, then refined mid-milestone to match contact-to-contact for robustness. Multi-tenant auth added real complexity: an Agency OAuth token with per-subaccount logic for GoHighLevel, and Connected Organizations for JobTread.',
      outcome:
        'Delivered a scalable, multi-tenant integration that became the foundation of Builder Clarity\'s productized offering — replacing per-client buildouts and cutting onboarding from roughly two days to about six hours, with leads flowing straight into job records and no manual re-entry.',
      architectureDiagram: 'ghl-jobtread',
      codeSnippets: [
        {
          title: 'Waterfall find-or-create (phone → email → name)',
          language: 'javascript',
          code: `// Match an incoming GHL contact to an existing JobTread record
// in priority order, so the same person is never created twice.
async function findOrCreateContact(ghlContact, jobtread) {
  const candidates = [
    () => jobtread.findContactByPhone(ghlContact.phone),
    () => jobtread.findContactByEmail(ghlContact.email),
    () => jobtread.findContactByName(ghlContact.name),
  ];

  for (const lookup of candidates) {
    const match = await lookup();
    if (match) return match; // first hit wins — phone is strongest
  }

  // No match anywhere in the waterfall → safe to create.
  return jobtread.createContact(ghlContact);
}`,
        },
      ],
    },
  },
  {
    slug: 'linear-ai-workflow',
    title: 'Linear Adoption + Agentic Bug Workflow',
    company: 'MAXX Potential',
    shortDescription:
      'Replaced scattered per-person QA spreadsheets with Linear and an AI-agent workflow that automates bug filing, triage, and deduplication.',
    categories: ['integration', 'ai'],
    techStack: ['Linear', 'MCP', 'Claude Code', 'AI Agents', 'Git'],
    featured: true,
    order: 2,
    metrics: [
      { value: '2×', label: 'sprint throughput' },
      { value: '~80%', label: 'less bug-filing time' },
      { value: 'Automated', label: 'triage & dedup' },
    ],
    detail: {
      problem:
        'QA ran on a patchwork of Google Sheets — each team member kept their own sheet with their own columns. Issues had no status history, no categories or tags, and no record of when anything moved between states. The lead engineer wasn\'t marking issues complete, so the team had to manually re-test each build to figure out what had actually been fixed.',
      approach:
        'I championed Linear as a single source of truth, chosen specifically for its strong API, Git integration, full issue timeline, and — critically — its MCP server and community CLI tooling. Since the lead engineer was already using Claude Code to convert spreadsheet rows into markdown for triage, I wired Linear directly into that agentic workflow so the AI could fetch and update issues in place instead of copy-pasting.',
      challenges:
        'The win wasn\'t just adopting a tool — it was redesigning the bug lifecycle around automation. Filing and triage are now hands-off: duplicates are detected automatically and appended as comments to the existing issue rather than spawning new ones, and triage surfaces a likely root cause plus the context a developer needs to decide how to approach the fix.',
      outcome:
        'The team went from fragmented sheets to an organized, automated pipeline across filing, triage, and implementation — roughly doubling sprint throughput and cutting bug-filing time by about 80%.',
      architectureDiagram: 'linear-flow',
    },
  },
  {
    slug: 'ringcentral-jobtread-integration',
    title: 'RingCentral ↔ JobTread Integration',
    company: 'Builder Clarity',
    shortDescription:
      'Synced calls and texts from RingCentral VoIP into JobTread contact threads — establishing a single source of truth for contractor communications.',
    categories: ['integration'],
    techStack: ['n8n', 'Zapier', 'REST APIs', 'Webhooks', 'JavaScript'],
    featured: true,
    order: 7,
    metrics: [
      { value: '1 thread', label: 'per customer' },
      { value: 'Zapier → n8n', label: 'platform migration' },
    ],
    detail: {
      problem:
        'Contractors\' phone calls and texts in RingCentral were siloed from their project communication in JobTread, making it impossible to see the full picture of a client relationship from one place.',
      approach:
        'I matched the phone number on every inbound and outbound call or text to JobTread contacts, logging the event to each contact that matched. Communications land in JobTread\'s comment-thread API as a single per-customer thread, with call summaries, transcriptions, and action items appended as comments.',
      challenges:
        'Started on Zapier and hit platform limits around conditional logic and API rate handling. I led the technical migration to n8n, which gave us robust workflow control and reduced operational overhead.',
      outcome:
        'Contractors gained one unified communication history per customer — no more cross-referencing two platforms to reconstruct a client\'s history.',
      architectureDiagram: 'ringcentral',
    },
  },
  {
    slug: 'paint-estimator',
    title: 'React Native Paint Estimator',
    company: 'MAXX Potential',
    shortDescription:
      'Full-stack mobile app that lets paint estimators price a job by breaking it down into areas, features, and tasks.',
    categories: ['full-stack'],
    techStack: ['React Native', 'TypeScript', 'Node.js'],
    featured: true,
    order: 6,
    metrics: [
      { value: '3 levels', label: 'job → area → feature → task' },
      { value: 'Go-live', label: 'joined at launch' },
    ],
    detail: {
      problem:
        'Estimators needed a fast, structured way to price a paint job on-site. Pricing isn\'t one number — a job is a hierarchy of areas (rooms), each with multiple features (paint, carpentry, and so on), each broken into individual tasks.',
      approach:
        'I built the estimator around that exact hierarchy — job → areas → features → tasks — so an estimator can decompose a walkthrough into priced line items quickly. I joined at go-live with limited React Native experience and established the team\'s development paradigms, consolidating overlapping features into simpler, reusable modules.',
      challenges:
        'React Native\'s cross-platform quirks were the real learning curve — concepts like KeyboardAvoidingView need different implementations on iOS and Android. Wrapping my head around those while shipping at launch pace pushed me to design for reuse instead of duplicating screen logic.',
      outcome:
        'Delivered a working estimator that turns an on-site walkthrough into a structured, itemized quote — and leveled up my React Native fluency from a single side project to production paradigms the team could build on.',
      architectureDiagram: 'paint-hierarchy',
    },
  },
  {
    slug: 'mirrored-google-calendars',
    title: 'Mirrored Google Calendars',
    company: 'Freelance',
    shortDescription:
      'Rebuilt a broken Google Calendar sync app from scratch — mirrors events across calendars for availability blocking.',
    categories: ['full-stack', 'integration'],
    techStack: ['Next.js', 'Supabase', 'Pipedream', 'Google Calendar API', 'TypeScript'],
    featured: false,
    order: 8,
    detail: {
      problem:
        'A client needed a working Google Calendar mirroring tool but had inherited a codebase with fundamental architectural flaws that made it unreliable and unmaintainable.',
      approach:
        'Diagnosed the root cause of the breakage — mismatched event ownership logic and lack of idempotency. Rebuilt from scratch with a clean architecture: Next.js + Supabase backend for state management, Pipedream Connect API for managed OAuth, and event-driven sync triggers.',
      challenges:
        'Inheriting broken code without documentation required careful forensic analysis before any rebuilding could begin. Designing idempotent sync logic for Google Calendar\'s eventual-consistency model required several iterations.',
      outcome:
        'Delivered a stable, maintainable sync tool the client could rely on. The rebuild also served as a case study in diagnosing architectural failures and designing for reliability over speed.',
      architectureDiagram: 'calendar-sync',
    },
  },
  {
    slug: 'cherished',
    title: 'Cherished',
    company: 'Duke University',
    shortDescription:
      'Wellness-centered social media platform built in an AGILE team — featuring messaging, profiles, search, and email notifications.',
    categories: ['full-stack', 'education'],
    techStack: ['Next.js', 'MongoDB', 'TypeScript', 'AGILE/Scrum'],
    featured: false,
    order: 9,
    detail: {
      problem:
        'Course project: design and build a social platform centered on positive, wellness-focused interactions rather than engagement-maximizing mechanics.',
      approach:
        'Worked in a cross-functional AGILE team with two-week sprints tracked in a shared backlog. Implemented core social features: real-time messaging, user profile management, search, and transactional email notifications.',
      challenges:
        'Coordinating feature development across multiple engineers required clear API contracts and regular integration testing. Balancing UX quality with sprint velocity was an ongoing challenge.',
      outcome:
        'Delivered a functional social platform with a polished UX, receiving strong marks for both technical execution and product design. Reinforced AGILE collaboration patterns that carried forward into professional work.',
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return projects.filter((p) => p.categories.includes(category));
}

/** The first `n` featured projects, lowest `order` first. */
export function getTopProjects(n: number): Project[] {
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, Math.max(0, n));
}

/** Every anchor id a project's case-study page renders (the five method steps first); [] without one. M7's link test uses it. */
export function getCaseStudyAnchors(project: Project): string[] {
  const cs = project.caseStudy;
  if (!cs) return [];
  return [
    'problem',
    ...methodSteps.map((step) => step.id),
    'method',
    ...(cs.decisions.length > 0 ? ['decisions'] : []),
    ...(cs.iterations && cs.iterations.length > 0 ? ['iterations'] : []),
    ...(cs.lessons.length > 0 ? ['lessons'] : []),
    'outcome',
    ...(cs.links.length > 0 ? ['links'] : []),
  ];
}
