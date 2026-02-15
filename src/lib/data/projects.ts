export type ProjectCategory = 'integration' | 'full-stack' | 'ai' | 'education';

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
  detail: {
    problem: string;
    approach: string;
    challenges: string;
    outcome: string;
  };
}

export const projects: Project[] = [
  {
    slug: 'ghl-jobtread-integration',
    title: 'GoHighLevel ↔ JobTread Integration',
    company: 'Builder Clarity',
    shortDescription:
      'Multi-tenant, bidirectional integration between GoHighLevel CRM and JobTread project management — purpose-built for contractors.',
    categories: ['integration'],
    techStack: ['Pipedream', 'JavaScript', 'OAuth', 'REST APIs', 'Webhooks'],
    featured: true,
    detail: {
      problem:
        'Contractors were managing jobs in JobTread and leads/clients in GoHighLevel with zero data flow between them — double entry, missed follow-ups, and no unified view of a customer journey.',
      approach:
        'Designed a bidirectional data mapping strategy across hierarchical data structures in both platforms. Implemented waterfall smart record matching to prevent duplicates. Built with Pipedream using custom JavaScript components for nearly every step. Managed multi-tenant auth: Agency OAuth token for GoHighLevel with subaccount token logic, and Connected Organizations for JobTread.',
      challenges:
        'Mapping strategy required mid-milestone refinement to meet dynamic stakeholder requirements. Handling multi-tenant auth across two platforms with different OAuth models added significant complexity. Preventing duplicate records during bidirectional sync required careful ordering and idempotency logic.',
      outcome:
        'Delivered a scalable, multi-tenant integration product that became the foundation for Builder Clarity\'s productized offering — enabling contractors to keep their CRM and project management in sync without manual data entry.',
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
    detail: {
      problem:
        'Contractors\' phone calls and texts in RingCentral were siloed from their project communication in JobTread, making it impossible to see the full picture of a client relationship.',
      approach:
        'Built smart matching logic to correlate each call/text to one or multiple JobTread contacts by phone number. Established automated logging of communication events into JobTread contact threads.',
      challenges:
        'Started on Zapier and hit platform limitations around conditional logic and API rate handling. Led the technical migration to n8n, enabling more robust workflow control and reduced operational overhead.',
      outcome:
        'Contractors gained a unified communication history per contact, eliminating the need to cross-reference two platforms when reviewing a client\'s history.',
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
    featured: true,
    detail: {
      problem:
        'A client needed a working Google Calendar mirroring tool but had inherited a codebase with fundamental architectural flaws that made it unreliable and unmaintainable.',
      approach:
        'Diagnosed the root cause of the breakage — mismatched event ownership logic and lack of idempotency. Rebuilt from scratch with a clean architecture: Next.js + Supabase backend for state management, Pipedream Connect API for managed OAuth, and event-driven sync triggers.',
      challenges:
        'Inheriting broken code without documentation required careful forensic analysis before any rebuilding could begin. Designing idempotent sync logic for Google Calendar\'s eventual-consistency model required several iterations.',
      outcome:
        'Delivered a stable, maintainable sync tool the client could rely on. The rebuild also served as a case study in diagnosing architectural failures and designing for reliability over speed.',
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
