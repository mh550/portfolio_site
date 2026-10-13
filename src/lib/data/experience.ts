export interface Role {
  title: string;
  company: string;
  period: string;
  bullets: string[];
  type: 'work' | 'education';
}

export const roles: Role[] = [
  {
    title: 'Full-Stack Software Engineer',
    company: 'MAXX Potential',
    period: 'February 2026 – Present',
    type: 'work',
    bullets: [
      'Diagnosed a critical QA/Engineering issue-tracking bottleneck and deployed Linear with an AI-agent workflow — doubled sprint throughput and cut bug-filing time by ~80%.',
      'Pioneered agentic coding workflows across triage, implementation, and testing via Linear\'s MCP server, automating duplicate detection and root-cause triage.',
      'Built full-stack React Native features for a paint-estimator app, establishing development paradigms and reusable modules from go-live.',
    ],
  },
  {
    title: 'Founding Full-Stack Software Engineer',
    company: 'Builder Clarity',
    period: 'March 2025 – November 2025',
    type: 'work',
    bullets: [
      'First engineer hired. Architected a multi-tenant integration platform that eliminated per-client buildouts — scaling to 3 clients and cutting onboarding from ~2 days to ~6 hours.',
      'Integrated CRM, VoIP, and internal systems via secure data pipelines (GoHighLevel ↔ JobTread, RingCentral ↔ JobTread), eliminating manual data entry and saving ~8 hrs/week per client.',
      'Built and maintained ETL pipelines ingesting and normalizing data from 7+ sources into Postgres for a previously fragmented dataset.',
      'Led the technical migration from Zapier to n8n and Pipedream, and self-directed AGILE/Scrum in Linear to improve stakeholder visibility.',
    ],
  },
  {
    title: 'AI Workflow Engineer',
    company: 'Tahoma Films',
    period: 'February 2025',
    type: 'work',
    bullets: [
      'Refined AI image generation workflows using Invoke.AI (control nets, denoising, regional guidance).',
      'Trained LoRAs for art style and character consistency across generated images.',
    ],
  },
  {
    title: 'Snowboard Coach',
    company: 'High Cascade Snowboard Camp',
    period: 'Summers 2023 & 2024',
    type: 'work',
    bullets: [
      'Mentored 12–18 snowboarders per session; designed targeted drills, prioritized safe progression.',
      'Coaching approach — clear instruction, patient feedback, tailored communication — translates directly to how I collaborate and communicate in engineering teams.',
    ],
  },
];

export interface Education {
  degree: string;
  institution: string;
  period: string;
  gpa: string;
  honors: string[];
  coursework: string[];
}

export const education: Education = {
  degree: 'B.S. Computer Science, Visual & Media Studies Minor',
  institution: 'Duke University',
  period: 'Graduated December 2024',
  gpa: '3.3',
  honors: ['George Scholar', 'Duke True North Leadership Program'],
  coursework: [
    'Algorithm Design & Analysis',
    'Database Systems',
    'Computer Security',
    'Server-side Web Apps',
    'Data Science',
    'AGILE',
  ],
};
