import type { Project } from '@/lib/data';

// A project with every case-study field filled, for the M3 template tests. Never added to `projects`.
export const fixtureProject: Project = {
  slug: 'fixture-case-study',
  title: 'Fixture Case Study',
  company: 'Fixture Co',
  shortDescription: 'A fixture project that exercises every case-study field.',
  categories: ['systems', 'process'],
  techStack: ['TypeScript', 'Next.js'],
  featured: false,
  order: 99,
  metrics: [
    { value: '3 → 1', label: 'fixture steps' },
    { value: 'Weekly', label: 'fixture cadence' },
  ],
  detail: {
    problem: 'Fixture problem.',
    approach: 'Fixture approach in one sentence.',
    challenges: 'Fixture challenges in one sentence.',
    outcome: 'Fixture outcome.',
    architectureDiagram: 'ghl-jobtread',
    codeSnippets: [{ title: 'Fixture snippet', language: 'typescript', code: 'export const fixture = true;' }],
  },
  caseStudy: {
    role: 'Fixture role',
    timeframe: 'Fixture timeframe',
    method: {
      diagnose: 'Fixture diagnose text.',
      decide: 'Fixture decide text.',
      build: 'Fixture build text.',
      verify: 'Fixture verify text.',
      simplify: 'Fixture simplify text.',
    },
    decisions: [
      {
        id: 'F1',
        title: 'Fixture decision with every field',
        chose: 'fixture option A',
        over: 'fixture option B',
        because: 'fixture reason one',
        cost: 'fixture cost',
      },
      { id: 'F2', title: 'Fixture decision without over or cost', chose: 'fixture option C', because: 'fixture reason two' },
    ],
    iterations: [
      { when: 'Fixture week 1', label: 'First cut', what: 'Fixture first change.', why: 'Fixture first reason.' },
      { when: 'Fixture week 2', label: 'Second cut', what: 'Fixture second change.', why: 'Fixture second reason.' },
    ],
    lessons: [
      { broke: 'Fixture thing one broke.', rule: 'Fixture rule one.' },
      { broke: 'Fixture thing two broke.', rule: 'Fixture rule two.' },
    ],
    links: [
      { label: 'Fixture repo', href: 'https://example.com/repo', kind: 'repo' },
      { label: 'Fixture live site', href: 'https://example.com/live', kind: 'live' },
      { label: 'Fixture doc', href: 'https://example.com/doc', kind: 'doc' },
      { label: 'Fixture demo', href: 'https://example.com/demo', kind: 'demo' },
      { label: 'Fixture related project', href: '/projects/ghl-jobtread-integration', kind: 'doc' },
    ],
    builtWith: 'Fixture built-with note.',
    extraDiagrams: ['calendar-sync'],
  },
};
