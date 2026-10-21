import fs from 'fs';
import path from 'path';
import { colour, ratio } from '@/__tests__/helpers/contrast';

// P3-06, D90: the memory view's six colours (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Memory view). Each is
// a text colour on the panel's surface and on the page background, so each must pass WCAG AA (4.5:1) on both.
const MEMORY_TOKENS = [
  'mem-profile',
  'mem-episode',
  'mem-event',
  'mem-event-rejected',
  'mem-knowledge',
  'mem-working',
];

describe('memory view tokens', () => {
  it.each(MEMORY_TOKENS)('--color-%s passes AA on #12121a and #0a0a0f', (name) => {
    const hex = colour(name);
    expect(ratio(hex, '#12121a')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(hex, '#0a0a0f')).toBeGreaterThanOrEqual(4.5);
  });

  it('the surfaces they are checked on are the theme surface and background', () => {
    expect(colour('surface').toLowerCase()).toBe('#12121a');
    expect(colour('background').toLowerCase()).toBe('#0a0a0f');
  });

  it('every kind has its own colour', () => {
    expect(new Set(MEMORY_TOKENS.map((t) => colour(t).toLowerCase())).size).toBe(MEMORY_TOKENS.length);
  });

  it('CLAUDE.md § Design System lists each one', () => {
    const claude = fs.readFileSync(path.join(process.cwd(), 'CLAUDE.md'), 'utf8');
    const section = claude.slice(claude.indexOf('## Design System'), claude.indexOf('## Skills Available'));
    for (const name of MEMORY_TOKENS) expect(section).toContain(`--color-${name}`);
  });
});
