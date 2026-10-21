import type { LogoKey } from '@/components/logos/paths';

// The /skills graph (D98): clusters of nodes, edges between nodes and from nodes to the projects that used them.
// Sources per node, the drop list and the merges: docs/plans/2026-10-21-P5-skills-graph.md § Data.

export type ClusterId = 'agentic' | 'languages' | 'web' | 'data' | 'infra' | 'process';

/** A titled group of the drawing; array order is layout order (the first is the small-screen start). */
export interface Cluster {
  id: ClusterId;
  name: string;
}

/** 3 core · 2 regular · 1 occasional */
export type Weight = 1 | 2 | 3;

export interface SkillNode {
  /** kebab-case, unique; the list view's row is #skill-<id> */
  id: string;
  /** the accessible name and the list's <dt> */
  name: string;
  cluster: ClusterId;
  weight: Weight;
  /** a key of logoPaths (generated, D78); none draws a dot */
  logo?: LogoKey;
  /** 'YYYY', only where a resume date range gives it */
  since?: string;
}

/** A node id, or `project:<slug>` for a project in projects.ts */
export type EdgeTo = string | `project:${string}`;

/** `from` is always a node id; `label` is the drawn path's tooltip */
export interface SkillEdge {
  from: string;
  to: EdgeTo;
  label?: string;
}

export const clusters: Cluster[] = [
  { id: 'agentic', name: 'Agentic systems' },
  { id: 'languages', name: 'Languages' },
  { id: 'web', name: 'Web & mobile' },
  { id: 'data', name: 'Data & integration' },
  { id: 'infra', name: 'Infra & operations' },
  { id: 'process', name: 'Process & delivery' },
];

// Inside a cluster, the order is the drawing order, row by row
export const nodes: SkillNode[] = [
  { id: 'harness-engineering', name: 'Harness engineering', cluster: 'agentic', weight: 3, since: '2026' },
  { id: 'context-engineering', name: 'Context engineering', cluster: 'agentic', weight: 3, since: '2026' },
  { id: 'agent-memory', name: 'Agent memory', cluster: 'agentic', weight: 3, since: '2026' },
  { id: 'claude-code', name: 'Claude Code', cluster: 'agentic', weight: 3, logo: 'claude' },
  { id: 'durable-state', name: 'Durable state', cluster: 'agentic', weight: 2 },
  { id: 'eval-gates', name: 'Eval gates', cluster: 'agentic', weight: 2 },
  { id: 'livekit-agents', name: 'LiveKit Agents', cluster: 'agentic', weight: 1, logo: 'livekit' },
  { id: 'mcp', name: 'MCP', cluster: 'agentic', weight: 1, logo: 'modelcontextprotocol' },
  { id: 'copilot-studio', name: 'Copilot Studio', cluster: 'agentic', weight: 1, since: '2026' },

  { id: 'typescript', name: 'TypeScript', cluster: 'languages', weight: 3, logo: 'typescript' },
  { id: 'python', name: 'Python', cluster: 'languages', weight: 3, logo: 'python' },
  { id: 'bash', name: 'Bash', cluster: 'languages', weight: 2, logo: 'bash' },
  { id: 'sql', name: 'SQL', cluster: 'languages', weight: 2 },
  { id: 'javascript', name: 'JavaScript', cluster: 'languages', weight: 2, logo: 'javascript' },
  { id: 'java', name: 'Java', cluster: 'languages', weight: 1, logo: 'openjdk' },
  { id: 'cpp', name: 'C++', cluster: 'languages', weight: 1, logo: 'cplusplus' },

  { id: 'react', name: 'React', cluster: 'web', weight: 3, logo: 'react' },
  { id: 'react-native', name: 'React Native', cluster: 'web', weight: 3, logo: 'react' },
  { id: 'nextjs', name: 'Next.js', cluster: 'web', weight: 3, logo: 'nextjs' },
  { id: 'nodejs', name: 'Node.js', cluster: 'web', weight: 2, logo: 'nodedotjs' },
  { id: 'expo', name: 'Expo', cluster: 'web', weight: 1, logo: 'expo' },
  { id: 'tailwind', name: 'Tailwind CSS', cluster: 'web', weight: 1, logo: 'tailwindcss' },
  { id: 'framer-motion', name: 'Framer Motion', cluster: 'web', weight: 1 },

  { id: 'postgresql', name: 'PostgreSQL', cluster: 'data', weight: 3, logo: 'postgresql' },
  { id: 'supabase', name: 'Supabase', cluster: 'data', weight: 3, logo: 'supabase' },
  { id: 'multi-tenant', name: 'Multi-tenant architecture', cluster: 'data', weight: 3, since: '2025' },
  { id: 'oauth', name: 'OAuth 2.0', cluster: 'data', weight: 2 },
  { id: 'rest', name: 'REST APIs', cluster: 'data', weight: 2 },
  { id: 'webhooks', name: 'Webhooks', cluster: 'data', weight: 2 },
  { id: 'etl', name: 'ETL pipelines', cluster: 'data', weight: 2 },
  { id: 'sqlite', name: 'SQLite', cluster: 'data', weight: 2, logo: 'sqlite' },
  { id: 'n8n', name: 'n8n', cluster: 'data', weight: 2, logo: 'n8n', since: '2025' },
  { id: 'pipedream', name: 'Pipedream', cluster: 'data', weight: 2, since: '2025' },
  { id: 'zapier', name: 'Zapier', cluster: 'data', weight: 1, logo: 'zapier' },

  { id: 'docker-compose', name: 'Docker Compose', cluster: 'infra', weight: 3, logo: 'docker', since: '2025' },
  { id: 'git', name: 'Git/GitHub', cluster: 'infra', weight: 3, logo: 'github' },
  { id: 'linux', name: 'Linux', cluster: 'infra', weight: 2, logo: 'linux' },
  { id: 'ci-cd', name: 'CI/CD', cluster: 'infra', weight: 2 },
  { id: 'vercel', name: 'Vercel', cluster: 'infra', weight: 2, logo: 'vercel' },
  { id: 'edge-functions', name: 'Edge functions', cluster: 'infra', weight: 2 },
  { id: 'tailscale', name: 'Tailscale', cluster: 'infra', weight: 2, logo: 'tailscale', since: '2025' },
  { id: 'self-hosting', name: 'Self-hosted infrastructure', cluster: 'infra', weight: 2, since: '2025' },
  { id: 'restic', name: 'restic', cluster: 'infra', weight: 1 },

  { id: 'specs', name: 'Specs & decision ledgers', cluster: 'process', weight: 3 },
  { id: 'tdd', name: 'Test-driven development', cluster: 'process', weight: 2 },
  { id: 'requirements', name: 'Requirements', cluster: 'process', weight: 2 },
  { id: 'linear', name: 'Linear', cluster: 'process', weight: 2, logo: 'linear', since: '2026' },
  { id: 'agile', name: 'AGILE/Scrum', cluster: 'process', weight: 1 },
  { id: 'project-management', name: 'Project management', cluster: 'process', weight: 1 },
  { id: 'team-onboarding', name: 'Team onboarding', cluster: 'process', weight: 1 },
  { id: 'user-driven-design', name: 'User-driven design', cluster: 'process', weight: 1 },
];

// Node ↔ node: drawn always inside a cluster, across clusters only on hover or in a selected project's chain
const nodeEdges: SkillEdge[] = [
  { from: 'claude-code', to: 'harness-engineering' },
  { from: 'harness-engineering', to: 'context-engineering' },
  { from: 'harness-engineering', to: 'eval-gates' },
  { from: 'context-engineering', to: 'agent-memory' },
  { from: 'agent-memory', to: 'durable-state' },
  { from: 'livekit-agents', to: 'agent-memory' },
  { from: 'mcp', to: 'claude-code' },
  { from: 'typescript', to: 'javascript' },
  { from: 'nextjs', to: 'react' },
  { from: 'react', to: 'react-native' },
  { from: 'react-native', to: 'expo' },
  { from: 'nextjs', to: 'tailwind' },
  { from: 'supabase', to: 'postgresql' },
  { from: 'etl', to: 'postgresql' },
  { from: 'oauth', to: 'multi-tenant' },
  { from: 'pipedream', to: 'multi-tenant' },
  { from: 'n8n', to: 'webhooks' },
  { from: 'rest', to: 'webhooks' },
  { from: 'zapier', to: 'n8n', label: 'moved from' },
  { from: 'docker-compose', to: 'self-hosting' },
  { from: 'tailscale', to: 'self-hosting' },
  { from: 'restic', to: 'self-hosting' },
  { from: 'linux', to: 'docker-compose' },
  { from: 'git', to: 'ci-cd' },
  { from: 'ci-cd', to: 'vercel' },
  { from: 'specs', to: 'requirements' },
  { from: 'user-driven-design', to: 'requirements' },
  { from: 'linear', to: 'project-management' },
  { from: 'agile', to: 'project-management' },
  // across clusters
  { from: 'bash', to: 'harness-engineering' },
  { from: 'git', to: 'harness-engineering' },
  { from: 'specs', to: 'harness-engineering' },
  { from: 'eval-gates', to: 'tdd' },
  { from: 'agent-memory', to: 'sqlite' },
  { from: 'python', to: 'livekit-agents' },
  { from: 'linear', to: 'mcp' },
  { from: 'typescript', to: 'nextjs' },
  { from: 'typescript', to: 'react-native' },
  { from: 'javascript', to: 'nodejs' },
  { from: 'javascript', to: 'pipedream' },
  { from: 'sql', to: 'postgresql' },
  { from: 'supabase', to: 'edge-functions' },
  { from: 'nextjs', to: 'vercel' },
];

// Node → project: from each project's techStack, the resume bullets that name it, or its deep-dive.
// The featured projects in `order`, then the two the list view alone shows.
const projectStacks: Record<string, string[]> = {
  'agent-harness': [
    'harness-engineering', 'context-engineering', 'agent-memory', 'durable-state', 'eval-gates', 'claude-code',
    'bash', 'nodejs', 'git',
  ],
  'voice-concierge': ['agent-memory', 'livekit-agents', 'claude-code', 'python', 'typescript', 'nextjs', 'sqlite'],
  'ghl-jobtread-integration': ['multi-tenant', 'oauth', 'pipedream', 'supabase', 'rest', 'webhooks', 'javascript'],
  'ringcentral-jobtread-integration': ['n8n', 'zapier', 'rest', 'webhooks', 'javascript'],
  'home-media-server': ['python', 'javascript', 'sqlite', 'docker-compose', 'tailscale', 'self-hosting', 'restic'],
  'linear-ai-workflow': ['linear', 'mcp', 'claude-code', 'git'],
  'hit-list': ['react-native', 'expo', 'typescript', 'sqlite', 'ci-cd'],
  'paint-estimator': ['react-native', 'typescript', 'nodejs'],
  'mirrored-google-calendars': ['nextjs', 'supabase', 'pipedream', 'typescript'],
  cherished: ['nextjs', 'typescript', 'agile'],
};

export const edges: SkillEdge[] = [
  ...nodeEdges,
  ...Object.entries(projectStacks).flatMap(([slug, ids]) =>
    ids.map((from): SkillEdge => ({ from, to: `project:${slug}` })),
  ),
];

// The edge helpers live with the graph math (data-free), so SkillGraph's bundle doesn't carry these arrays twice
export { projectSlug, projectsOf, nodesOf } from '@/lib/graph/edges';
