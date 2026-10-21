import fs from 'fs';
import path from 'path';
import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import AboutPage from '@/app/about/page';
import CardPage from '@/app/card/page';
import CardQrPage from '@/app/card/qr/page';
import EvidencePage from '@/app/evidence/page';
import ExperiencePage from '@/app/experience/page';
import TalkPage from '@/app/talk/page';
import ProjectDetail from '@/components/projects/ProjectDetail';
import SiteChrome from '@/components/SiteChrome';
import { colour, ratio } from '@/__tests__/helpers/contrast';
import ConciergeProvider from '@/components/concierge/ConciergeProvider';
import { getProjectBySlug } from '@/lib/data';

jest.mock('next/navigation', () => ({ usePathname: () => '/about' }));

// M8-02: the accessibility floor for every page v2 added (web-design-guidelines pass).
const caseStudy = (slug: string) => <ProjectDetail project={getProjectBySlug(slug)!} />;

const pages: [string, () => ReactElement][] = [
  ['/about', () => <AboutPage />],
  ['/card', () => <CardPage />],
  ['/card/qr', () => <CardQrPage />],
  ['/evidence', () => <EvidencePage />],
  ['/experience', () => <ExperiencePage />],
  [
    '/talk',
    () => (
      <ConciergeProvider configured={false}>
        <TalkPage />
      </ConciergeProvider>
    ),
  ],
  ['/projects/agent-harness', () => caseStudy('agent-harness')],
  ['/projects/home-media-server', () => caseStudy('home-media-server')],
  ['/projects/hit-list', () => caseStudy('hit-list')],
  ['/projects/voice-concierge', () => caseStudy('voice-concierge')],
];

const headingLevels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => Number(h.tagName[1]));

const interactive = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('a[href], button, summary, [tabindex="0"]'));

const accessibleName = (el: HTMLElement) =>
  (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();

describe.each(pages)('%s', (_route, page) => {
  it('has exactly one h1, first, and no skipped heading levels', () => {
    const levels = headingLevels(render(page()).container);
    expect(levels[0]).toBe(1);
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((level, i) => {
      if (i > 0) expect(level).toBeLessThanOrEqual(levels[i - 1] + 1);
    });
  });

  it('gives every link and button a focus-visible style', () => {
    const missing = interactive(render(page()).container)
      .filter((el) => !/\bfocus-visible:outline/.test(el.getAttribute('class') ?? ''))
      .map((el) => `<${el.tagName.toLowerCase()}> ${accessibleName(el)}`);
    expect(missing).toEqual([]);
  });

  it('has no link whose text is only "here", "click" or an arrow', () => {
    const vague = interactive(render(page()).container)
      .map(accessibleName)
      .filter((name) => /^(click( here)?|here|more|[→↗←↓]|)$/i.test(name));
    expect(vague).toEqual([]);
  });
});

describe('the site chrome around those pages', () => {
  it('gives the skip link, Navbar and Footer links a focus-visible style', () => {
    const { container } = render(
      <SiteChrome>
        <p>page</p>
      </SiteChrome>
    );
    const missing = interactive(container)
      .filter((el) => !/\bfocus-visible:outline/.test(el.getAttribute('class') ?? ''))
      .map((el) => `<${el.tagName.toLowerCase()}> ${accessibleName(el)}`);
    expect(missing).toEqual([]);
  });

  // VC4-03: the voice widget is one more control, not a landmark or a heading (a button since P3-04, D86)
  it('adds the voice widget without a landmark or a heading', () => {
    const { container, getByRole, queryAllByRole } = render(
      <SiteChrome>
        <p>page</p>
      </SiteChrome>
    );
    expect(getByRole('button', { name: 'Ask my site' })).toBeInTheDocument();
    expect(queryAllByRole('navigation')).toHaveLength(1);
    expect(queryAllByRole('contentinfo')).toHaveLength(1);
    expect(queryAllByRole('region')).toHaveLength(0);
    expect(queryAllByRole('complementary')).toHaveLength(0);
    expect(headingLevels(container)).toEqual([]);
  });
});

// P3-04, D86: the concierge panel, opened from the widget over a page
describe('the concierge panel, open', () => {
  const openPanel = () => {
    const result = render(
      <SiteChrome>
        <h1>page</h1>
      </SiteChrome>
    );
    fireEvent.click(result.getByRole('button', { name: 'Ask my site' }));
    return result;
  };

  it('is one dialog, named, not modal', () => {
    const { getAllByRole } = openPanel();
    const dialogs = getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]).toHaveAttribute('aria-modal', 'false');
    expect(dialogs[0]).toHaveAccessibleName('Ask my site');
  });

  it('gives every link and button, the panel\'s included, a focus-visible style', () => {
    const { container, getByRole } = openPanel();
    const panelControls = interactive(getByRole('dialog'));
    expect(panelControls.length).toBeGreaterThanOrEqual(4);
    const missing = interactive(container)
      .filter((el) => !/\bfocus-visible:outline/.test(el.getAttribute('class') ?? ''))
      .map((el) => `<${el.tagName.toLowerCase()}> ${accessibleName(el)}`);
    expect(missing).toEqual([]);
  });

  // P3-06: the strip and the tabs are in it; with a v2 body the Memory tab adds h3s and h4s under the panel's h2s.
  it('holds the memory strip and the tabs, every tab and panel with the focus style', () => {
    const { getByRole } = openPanel();
    const panel = getByRole('dialog');
    const tabs = panel.querySelectorAll('[role="tab"], [role="tabpanel"]');
    expect(tabs.length).toBe(6);
    for (const el of tabs) expect(el.getAttribute('class')).toMatch(/\bfocus-visible:outline/);
  });

  it('keeps the outline: one h1, no skipped heading level', () => {
    const levels = headingLevels(openPanel().container);
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((level, i) => {
      if (i > 0) expect(level).toBeLessThanOrEqual(levels[i - 1] + 1);
    });
  });
});

describe('dark-theme text contrast (WCAG AA, 4.5:1)', () => {
  it.each(['muted', 'foreground', 'accent', 'accent-dim'])('%s text on every dark surface', (fg) => {
    for (const bg of ['background', 'surface', 'surface-alt']) {
      expect(ratio(colour(fg), colour(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('reduced motion', () => {
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? files(p) : /\.tsx$/.test(e.name) ? [p] : [];
    });

  // A file that animates with `motion.*` itself must check the preference; the rest animate only through ScrollReveal.
  it('every component that renders a framer-motion element checks useReducedMotion', () => {
    const animated = [...files('src/components'), ...files('src/app')].filter((f) =>
      /<motion\./.test(fs.readFileSync(f, 'utf8'))
    );
    expect(animated.length).toBeGreaterThan(0);
    const unguarded = animated.filter((f) => !/useReducedMotion\(/.test(fs.readFileSync(f, 'utf8')));
    expect(unguarded).toEqual([]);
  });
});
