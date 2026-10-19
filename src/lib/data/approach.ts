import { profile } from './profile';

export type MethodStepId = 'diagnose' | 'decide' | 'build' | 'verify' | 'simplify';

export interface MethodStep {
  id: MethodStepId;
  label: string;
  line: string;
}

// The method every case study follows (docs/notes/brand.md). M2's hero strip and M7's /approach reuse it.
export const methodSteps: MethodStep[] = [
  { id: 'diagnose', label: 'Diagnose', line: 'I find where the work actually breaks down before I build anything.' },
  { id: 'decide', label: 'Decide', line: 'I write down what I chose, what I passed on, and why.' },
  { id: 'build', label: 'Build', line: 'I build the smallest system that fixes the real problem.' },
  { id: 'verify', label: 'Verify', line: 'I check the result the way the people using it will see it.' },
  { id: 'simplify', label: 'Simplify', line: 'Once it runs, I cut what nobody needs.' },
];

// The About page's "What I do" intro (D13, D32): the subline, the method, the supporting phrase (brand.md).
export const aboutIntro: string[] = [
  profile.subline,
  `I work in five steps: ${methodSteps.map((s) => s.label).join(', ')}.`,
  'I own delivery from requirements to release.',
];
