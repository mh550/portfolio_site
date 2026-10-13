export interface SkillCategory {
  id: string;
  name: string;
  featured: boolean;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'integration',
    name: 'Integration & Automation',
    featured: true,
    skills: ['Pipedream', 'n8n', 'Zapier', 'Multi-tenant architecture', 'RESTful APIs', 'OAuth 2.0', 'Webhooks'],
  },
  {
    id: 'languages',
    name: 'Languages',
    featured: false,
    skills: ['TypeScript', 'JavaScript', 'Python', 'PowerShell', 'Java', 'C/C++', 'Ruby', 'R'],
  },
  {
    id: 'frontend',
    name: 'Frontend',
    featured: false,
    skills: ['React', 'React Native', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    id: 'backend',
    name: 'Backend',
    featured: false,
    skills: ['Node.js', 'Flask', 'Ruby on Rails', 'PostgreSQL', 'Supabase Edge Functions', 'ETL pipelines', 'MongoDB'],
  },
  {
    id: 'tools',
    name: 'Tools & Platforms',
    featured: false,
    skills: ['Supabase', 'Vercel', 'Git', 'Linear', 'Linux CLI', 'WSL', 'Claude Code'],
  },
  {
    id: 'practices',
    name: 'Practices',
    featured: false,
    skills: ['AGILE/Scrum', 'Agentic AI', 'User-driven design', 'AI-assisted development', 'Test-driven development'],
  },
];
