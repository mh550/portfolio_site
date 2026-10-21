import { clusters, nodes, edges, projects } from '@/lib/data';
import { projectSlug, projectsOf, nodesOf } from '@/lib/graph/edges';
import { logoPaths } from '@/components/logos/paths';
import { labelLines } from '@/lib/graph/layout';

// The skills graph (P5-02, D98; docs/plans/2026-10-21-P5-skills-graph.md § Data)
describe('skills graph data', () => {
  // v3 spec § 8 TECHNICAL SKILLS, one name per item ("harness & context engineering" is two nodes; "REST" and "ETL"
  // take the names the projects use). Held here so an edit to skills.ts can never drop one.
  const SECTION_8 = [
    'Harness engineering', 'Context engineering', 'Agent memory', 'Durable state', 'Eval gates', 'Claude Code',
    'TypeScript', 'Python', 'Bash', 'SQL', 'Java', 'C++', 'React', 'React Native', 'Next.js', 'Node.js',
    'PostgreSQL', 'Supabase', 'SQLite', 'REST APIs', 'Webhooks', 'OAuth 2.0', 'ETL pipelines', 'n8n', 'Pipedream',
    'Docker Compose', 'Linux', 'Git/GitHub', 'CI/CD', 'Vercel', 'Edge functions', 'Tailscale', 'Linear',
  ];
  const DROPPED = ['Ruby', 'R', 'Ruby on Rails', 'Flask', 'MongoDB', 'PowerShell', 'WSL'];

  const nodeIds = new Set(nodes.map((n) => n.id));
  const slugs = new Set(projects.map((p) => p.slug));
  const projectEdges = edges.filter((e) => e.to.startsWith('project:'));

  it('has the six clusters in layout order', () => {
    expect(clusters.map((c) => c.name)).toEqual([
      'Agentic systems', 'Languages', 'Web & mobile', 'Data & integration', 'Infra & operations', 'Process & delivery',
    ]);
    expect(clusters.map((c) => c.id)).toEqual(['agentic', 'languages', 'web', 'data', 'infra', 'process']);
  });

  it('has 51 nodes with unique kebab-case ids and unique names', () => {
    expect(nodes).toHaveLength(51);
    expect(nodeIds.size).toBe(nodes.length);
    expect(new Set(nodes.map((n) => n.name)).size).toBe(nodes.length);
    for (const n of nodes) expect(n.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("puts every node in a cluster that exists, each cluster 7–11 nodes", () => {
    const ids = new Set(clusters.map((c) => c.id));
    for (const n of nodes) expect(ids).toContain(n.cluster);
    expect(clusters.map((c) => nodes.filter((n) => n.cluster === c.id).length)).toEqual([9, 7, 7, 11, 9, 8]);
  });

  it('weighs every node 1, 2 or 3', () => {
    for (const n of nodes) expect([1, 2, 3]).toContain(n.weight);
  });

  it('uses only logo keys that logoPaths has', () => {
    const keys = Object.keys(logoPaths);
    for (const n of nodes.filter((n) => n.logo)) expect(keys).toContain(n.logo);
  });

  it('gives since as four digits when set', () => {
    for (const n of nodes.filter((n) => n.since !== undefined)) expect(n.since).toMatch(/^\d{4}$/);
  });

  it('starts every edge at a node and ends it at a node or a project on the site', () => {
    for (const e of edges) {
      expect(nodeIds).toContain(e.from);
      if (e.to.startsWith('project:')) expect(slugs).toContain(e.to.slice('project:'.length));
      else expect(nodeIds).toContain(e.to);
    }
  });

  it('has no self-loops and no edge twice', () => {
    const keys = edges.map((e) => [e.from, e.to].sort().join('|'));
    expect(new Set(keys).size).toBe(edges.length);
    for (const e of edges) expect(e.to).not.toBe(e.from);
  });

  it('links every featured project to at least two nodes, agent-harness to at least three', () => {
    for (const p of projects.filter((p) => p.featured)) {
      expect(projectEdges.filter((e) => e.to === `project:${p.slug}`).length).toBeGreaterThanOrEqual(2);
    }
    expect(projectEdges.filter((e) => e.to === 'project:agent-harness').length).toBeGreaterThanOrEqual(3);
  });

  // The plan's § Data project table, held here so a dropped or swapped edge fails
  const STACKS: Record<string, string[]> = {
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

  it.each(Object.entries(STACKS))('links %s to exactly the plan\'s nodes', (slug, ids) => {
    expect(nodesOf(edges, slug)).toEqual(ids);
  });

  it('has no project edge beyond the plan\'s table', () => {
    expect(projectEdges).toHaveLength(Object.values(STACKS).flat().length);
  });

  // The weight-3 "core" nodes (a question for Michael, D98)
  it('weighs exactly the plan\'s core nodes 3', () => {
    expect(nodes.filter((n) => n.weight === 3).map((n) => n.id)).toEqual([
      'harness-engineering', 'context-engineering', 'agent-memory', 'claude-code', 'typescript', 'python', 'react',
      'react-native', 'nextjs', 'postgresql', 'supabase', 'multi-tenant', 'docker-compose', 'git', 'specs',
    ]);
  });

  it('reads a project edge\'s slug, and a node\'s projects in table order', () => {
    expect(projectSlug('project:hit-list')).toBe('hit-list');
    expect(projectSlug('react')).toBeNull();
    expect(projectsOf(edges, 'zapier')).toEqual(['ringcentral-jobtread-integration']);
    expect(projectsOf(edges, 'claude-code')).toEqual(['agent-harness', 'voice-concierge', 'linear-ai-workflow']);
    expect(projectsOf(edges, 'sql')).toEqual([]);
  });

  it.each(SECTION_8)('has a node for the § 8 skill %s', (name) => {
    expect(nodes.map((n) => n.name)).toContain(name);
  });

  it('holds all 33 § 8 names', () => {
    expect(SECTION_8).toHaveLength(33);
  });

  it('drops Ruby, R, Rails, Flask, MongoDB, PowerShell and WSL', () => {
    const names = nodes.map((n) => n.name);
    for (const name of DROPPED) expect(names).not.toContain(name);
  });

  it('keeps Zapier at weight 1, linked to the RingCentral integration', () => {
    const zapier = nodes.find((n) => n.name === 'Zapier');
    expect(zapier?.weight).toBe(1);
    expect(edges).toContainEqual({ from: 'zapier', to: 'project:ringcentral-jobtread-integration' });
  });

  it('labels the Zapier → n8n edge "moved from" and no other', () => {
    expect(edges.filter((e) => e.label)).toEqual([{ from: 'zapier', to: 'n8n', label: 'moved from' }]);
  });

  it('fits every name in at most two lines of 16 characters', () => {
    for (const n of nodes) {
      const lines = labelLines(n.name);
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(16);
      expect(lines.join(' ')).toBe(n.name);
    }
  });
});
