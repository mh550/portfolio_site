import { readFileSync } from 'fs';
import path from 'path';

// S3-01: case-study pages print black on white, without the site chrome or the hero canvas, and with code unclipped.
const read = (rel: string) => readFileSync(path.join(process.cwd(), rel), 'utf8');

/** The body of the first `@media print { … }` block in `css` (brace-matched), or null. */
function printBlock(css: string): string | null {
  const start = css.search(/@media\s+print\s*\{/);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return null;
}

/** The declarations of the first rule in `block` whose selector list includes `selector`. */
function rule(block: string, selector: RegExp): string {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].split(',').some(s => selector.test(s.trim()))) return m[2];
  }
  return '';
}

describe('print stylesheet (globals.css)', () => {
  const block = printBlock(read('src/app/globals.css').replace(/\/\*[\s\S]*?\*\//g, ''));

  it('has an @media print block', () => {
    expect(block).not.toBeNull();
  });

  it('prints black text on a white page', () => {
    const body = rule(block!, /^(html|body)$/);
    expect(body).toMatch(/background(-color)?:\s*(#fff\b|#ffffff|white)\s*!important/i);
    expect(body).toMatch(/(^|;|\s)color:\s*(#000\b|#000000|black)/i);
    // Every element: the dark surfaces and light text of the screen theme are overridden
    const all = rule(block!, /^\*$/);
    expect(all).toMatch(/background:\s*transparent\s*!important/);
    expect(all).toMatch(/(^|;|\s)color:\s*#000\s*!important/);
  });

  it('hides the navigation and the footer', () => {
    expect(rule(block!, /^nav$/)).toMatch(/display:\s*none\s*!important/);
    expect(rule(block!, /^footer$/)).toMatch(/display:\s*none\s*!important/);
  });

  it('wraps pre blocks instead of clipping them', () => {
    const pre = rule(block!, /^pre$/);
    expect(pre).toMatch(/white-space:\s*pre-wrap/);
    expect(pre).toMatch(/max-height:\s*none/);
    expect(pre).toMatch(/overflow:\s*visible/);
  });

  it('underlines links', () => {
    expect(rule(block!, /^a$/)).toMatch(/text-decoration:\s*underline/);
  });

  it('shows scroll-revealed content that was never scrolled into view', () => {
    expect(rule(block!, /^\[data-scroll-reveal\]$/)).toMatch(/opacity:\s*1\s*!important/);
    expect(rule(block!, /^\[data-scroll-reveal\]$/)).toMatch(/transform:\s*none\s*!important/);
  });
});

// print:hidden on NodeGraph, FloatingLogos, the LoopingVideo button and the back links, and ScrollReveal's
// data-scroll-reveal, are asserted on the rendered elements in each component's own test.
