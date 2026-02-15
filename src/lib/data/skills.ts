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
    skills: ['Pipedream', 'n8n', 'Zapier', 'RESTful APIs', 'OAuth', 'Webhooks'],
  },
  {
    id: 'languages',
    name: 'Languages',
    featured: false,
    skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C/C++', 'Ruby', 'R'],
  },
  {
    id: 'frontend',
    name: 'Frontend',
    featured: false,
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    id: 'backend',
    name: 'Backend',
    featured: false,
    skills: ['Node.js', 'Flask', 'Ruby on Rails', 'PostgreSQL', 'MongoDB'],
  },
  {
    id: 'tools',
    name: 'Tools & Platforms',
    featured: false,
    skills: ['Supabase', 'Vercel', 'Git', 'Linux CLI', 'Claude Code', 'Linear'],
  },
  {
    id: 'practices',
    name: 'Practices',
    featured: false,
    skills: ['AGILE/Scrum', 'User-driven design', 'AI-assisted development', 'Test-driven development'],
  },
];
