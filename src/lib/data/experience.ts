export interface Role {
  title: string;
  company: string;
  period: string;
  bullets: string[];
  type: 'work' | 'education';
}

export const roles: Role[] = [
  {
    title: 'Founding Full-Stack Software Engineer',
    company: 'Builder Clarity',
    period: 'March 2025 – November 2025',
    type: 'work',
    bullets: [
      'First engineer hired. Drove strategic pivot from custom per-client automation to scalable, product-based integration solutions.',
      'Architected multi-tenant integrations: GoHighLevel ↔ JobTread, RingCentral ↔ JobTread.',
      'Led technical migration from Zapier to n8n and Pipedream — reduced technical debt, enabled rapid prototyping.',
      'Self-directed AGILE using Linear for sprint planning and stakeholder communication.',
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
