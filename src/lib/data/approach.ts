import { profile } from './profile';
// Import cycle (projects.ts imports methodSteps): use these only inside functions, never at module load.
import { resolveProjectLink } from './projects';

export type MethodStepId = 'diagnose' | 'decide' | 'build' | 'verify' | 'simplify';

export interface MethodStep {
  id: MethodStepId;
  label: string;
  line: string;
}

// The method every case study follows (docs/notes/brand.md): the case-study anchors and /evidence read it (D77).
export const methodSteps: MethodStep[] = [
  { id: 'diagnose', label: 'Diagnose', line: 'I find where the work actually breaks down before I build anything.' },
  { id: 'decide', label: 'Decide', line: 'I write down what I chose, what I passed on, and why.' },
  { id: 'build', label: 'Build', line: 'I build the smallest system that fixes the real problem.' },
  { id: 'verify', label: 'Verify', line: 'I check the result the way the people using it will see it.' },
  { id: 'simplify', label: 'Simplify', line: 'Once it runs, I cut what nobody needs.' },
];

export type LoopStepId = 'spec' | 'context' | 'build' | 'verify' | 'learn';

export interface LoopStep {
  id: LoopStepId;
  label: string;
  line: string;
  /** The principle whose first linkable example is this step's one link on /about (D77). */
  principle: Principle['id'];
}

// The loop the harness runs, which is also how I work (v3 spec § 2, D77): the hero strip and /about read it.
export const loopSteps: LoopStep[] = [
  {
    id: 'spec',
    label: 'Spec',
    line: 'I write down what done means before anything is built.',
    principle: 'decisions-explicit',
  },
  {
    id: 'context',
    label: 'Context',
    line: 'Every session starts fresh, from state kept on disk, not from memory.',
    principle: 'automate-bookkeeping',
  },
  {
    id: 'build',
    label: 'Build',
    line: 'Test first, one feature at a time, the smallest system that fixes the real problem.',
    principle: 'simplify-after-use',
  },
  {
    id: 'verify',
    label: 'Verify',
    line: 'An independent check, with evidence per step, before anything merges.',
    principle: 'verify-what-the-human-sees',
  },
  {
    id: 'learn',
    label: 'Learn',
    line: 'Every run is measured and written down, and the next plan reads it.',
    principle: 'fakes-mirror-reality',
  },
];

// The About page's "What I do" intro (D13, D32, D77): the subline, the loop, the supporting phrase (brand.md).
export const aboutIntro: string[] = [
  profile.subline,
  `I work the way my harness runs: ${loopSteps.map((s) => s.label).join(', ')}.`,
  'I own delivery from requirements to release.',
];

export type ProjectSlug =
  | 'agent-harness'
  | 'home-media-server'
  | 'hit-list'
  | 'linear-ai-workflow'
  | 'ghl-jobtread-integration';
/** The ids a case study renders that an example may link to (`getCaseStudyAnchors`). */
export type CaseStudyAnchor = MethodStepId | 'decisions' | 'iterations' | 'lessons';

export interface PrincipleExample {
  /** Absent only for the D14 example, which has no page to link (D34). */
  projectSlug?: ProjectSlug;
  anchor?: CaseStudyAnchor;
  text: string;
}

export interface Principle {
  id:
    | 'diagnose-first'
    | 'decisions-explicit'
    | 'fakes-mirror-reality'
    | 'verify-what-the-human-sees'
    | 'simplify-after-use'
    | 'automate-bookkeeping';
  title: string;
  summary: string;
  examples: PrincipleExample[];
}

// /approach (M7). Copy and sources: docs/plans/2026-10-18-M7-approach-evidence.md § Principles, Approach page.
export const approachIntro: string[] = [
  'I work in five steps, at work and at home.',
  'Most examples below link to the place in a case study where it happened, including the times it went wrong.',
];

export const principles: Principle[] = [
  {
    id: 'diagnose-first',
    title: 'Diagnose before building',
    summary:
      'I look for where the work actually breaks and name it with a symptom or a number someone can check. Only then do I pick a fix.',
    examples: [
      {
        projectSlug: 'linear-ai-workflow',
        text: 'At MAXX Potential I traced a QA bottleneck to the tracking itself: one spreadsheet per person, with no status history. Moving the team to Linear and an AI-agent workflow brought 2× sprint throughput.',
      },
      {
        projectSlug: 'agent-harness',
        anchor: 'diagnose',
        text: 'Before the harness, every single-session approach hit one of three walls: the context limit, the usage limit or the permission classifier. One night every repo went silent from 00:12 to 07:19.',
      },
      {
        projectSlug: 'home-media-server',
        anchor: 'diagnose',
        text: 'After the first night live, the counts matched while 92 titles were still wrong on my phone and 28 files were second copies of the same audio.',
      },
    ],
  },
  {
    id: 'decisions-explicit',
    title: 'Make decisions explicit',
    summary:
      'I write each decision down: what I chose, what I passed on, and why. The next session, or the next person, reads the reasoning instead of guessing it.',
    examples: [
      {
        projectSlug: 'agent-harness',
        anchor: 'decisions',
        text: 'The harness keeps a numbered decision ledger. The first entry, D-H1: a fresh session per feature, because subagents only delay the context limit and fresh sessions force state onto disk.',
      },
      {
        projectSlug: 'home-media-server',
        anchor: 'decisions',
        text: "The crate flag first lived as a #crate tag in playlist comments. I moved it into the crates app's own database and wrote down why: the app owns the flag.",
      },
      {
        projectSlug: 'hit-list',
        anchor: 'decisions',
        text: 'When the agent put batch import on the Profile tab, I rejected it as bad UX and moved it to the Spots tab. The ledger records it as D12.',
      },
    ],
  },
  {
    id: 'fakes-mirror-reality',
    title: 'Fakes mirror reality',
    summary:
      'Tests run against fakes, so the fakes have to behave like the real thing. I build them from captured real responses, not from what I expect the system to say.',
    examples: [
      {
        projectSlug: 'agent-harness',
        anchor: 'lessons',
        text: 'The harness broke its own rule. I tested its usage-limit detector against a message I made up; the real one read differently, and 45 sessions were counted as failed attempts in 6 minutes. The fix was a fixture captured from the real CLI.',
      },
      {
        projectSlug: 'home-media-server',
        anchor: 'lessons',
        text: "A fake written from a guess at the download client's API hid 3 critical bugs. The fakes are now built from captured real responses.",
      },
      {
        projectSlug: 'hit-list',
        anchor: 'lessons',
        text: "The test database enforced foreign keys and the phone's did not. Test fakes now start the way the device starts.",
      },
    ],
  },
  {
    id: 'verify-what-the-human-sees',
    title: 'Verify what the human will see',
    summary:
      'Passing tests and matching counts are not the finish line. A milestone ends when I have looked at the screen the person will use.',
    examples: [
      {
        projectSlug: 'home-media-server',
        anchor: 'lessons',
        text: 'After the first night every count matched, 859 = 859 = 859, while 92 titles were still wrong on my phone.',
      },
      {
        projectSlug: 'hit-list',
        anchor: 'lessons',
        text: 'A spot saved without GPS showed as "7679.1 mi" away. No test failed; a table of what the screen would show, row by row, caught it.',
      },
      {
        projectSlug: 'agent-harness',
        anchor: 'verify',
        text: 'Every finished milestone gets an independent verify session that re-runs each step and writes one evidence row per step. Nothing merges unless it is the tree that was verified.',
      },
    ],
  },
  {
    id: 'simplify-after-use',
    title: 'Simplify after use',
    summary:
      'The first version carries guesses. After I have used it, I cut what nobody needs, and sometimes I decide not to build at all.',
    examples: [
      {
        projectSlug: 'home-media-server',
        anchor: 'simplify',
        text: 'I built four download-quality tiers, used them, then replaced them with one rule: lossless or 256 kbps and up.',
      },
      {
        projectSlug: 'hit-list',
        anchor: 'simplify',
        text: 'After using HitList on my phone, I wrote a spec that cuts a 20+ field form in five sections to seven fields. It is specified, not yet built.',
      },
      {
        // D14: a private spec, so no link (D34)
        text: "I spec'd an invite and gig-broadcast app over five rounds of questions, then chose not to build it. An iOS Shortcut does the job with zero code, and the spec records when building it would become worth it.",
      },
    ],
  },
  {
    id: 'automate-bookkeeping',
    title: 'Automate the bookkeeping, keep judgment human',
    summary:
      'Scripts and agents take the repetitive, checkable work. The calls that need judgment, what to build and the rules for what ships, stay with a person.',
    examples: [
      {
        projectSlug: 'agent-harness',
        anchor: 'decisions',
        text: 'In the harness a deterministic bash driver does all the git bookkeeping, because a script does that and a prompt might not. On this site every PR still waits for me to merge it.',
      },
      {
        projectSlug: 'linear-ai-workflow',
        text: 'At MAXX Potential, moving QA tracking to Linear and an AI-agent workflow cut bug-filing time by about 80%.',
      },
      {
        projectSlug: 'home-media-server',
        anchor: 'decisions',
        text: 'Nothing downloads on its own: the first real download is mine to approve, by hand. As of Oct 17 the download path had not run live.',
      },
    ],
  },
];

export const approachClosing = 'This site update was built that way, one verified milestone at a time.';

/** The examples that can link on this branch: an example whose project is missing drops out, and an anchor the
 *  project does not render (no caseStudy, or an empty section) is dropped from its example. */
export function resolvedExamples(principle: Principle): PrincipleExample[] {
  return principle.examples.flatMap((example) => {
    if (!example.projectSlug) return [example];
    const link = resolveProjectLink(example.projectSlug, example.anchor);
    if (!link) return [];
    return [link.anchor === example.anchor ? example : { projectSlug: example.projectSlug, text: example.text }];
  });
}

export function exampleHref(example: PrincipleExample): string | undefined {
  if (!example.projectSlug) return undefined;
  return `/projects/${example.projectSlug}${example.anchor ? `#${example.anchor}` : ''}`;
}
