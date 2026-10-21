import { logoPaths } from '@/components/logos/paths';

// The twelve hero marks, in the generator's order (D78)
const KEYS = [
  'claude', 'livekit', 'python', 'typescript', 'bash', 'sqlite',
  'postgresql', 'docker', 'linux', 'nextjs', 'n8n', 'github',
];

describe('logoPaths', () => {
  it('has exactly the twelve keys', () => {
    expect(Object.keys(logoPaths)).toEqual(KEYS);
  });

  it.each(KEYS)('%s has a title and a path that starts with a moveto', (key) => {
    const { title, path } = logoPaths[key as keyof typeof logoPaths];
    expect(title.trim()).not.toBe('');
    // siClaude.path starts with a relative 'm' (valid SVG), so either case
    expect(path).toMatch(/^[Mm]/);
    expect(path.length).toBeGreaterThan(20);
  });

  it('labels the overridden marks Claude Code and Bash', () => {
    expect(logoPaths.claude.title).toBe('Claude Code');
    expect(logoPaths.bash.title).toBe('Bash');
  });
});
