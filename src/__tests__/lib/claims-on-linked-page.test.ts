/** @jest-environment node */
import {
  competencies,
  education,
  evidenceIntro,
  exampleHref,
  getProjectBySlug,
  principles,
  resolvedExamples,
  resolvedItems,
  roles,
} from '@/lib/data';

// Every number in an /approach example or /evidence item must appear in the content of the page its link opens,
// so the link backs the claim. Repo links (https) are not checked.
const numbers = (s: string): string[] => s.match(/\d+(?:[.,]\d+)*/g) ?? [];

function linkedContent(href: string): string | undefined {
  const [route] = href.split('#');
  if (route === '/experience') return JSON.stringify({ roles, education });
  const slug = route.match(/^\/projects\/([^/]+)$/)?.[1];
  return slug ? JSON.stringify(getProjectBySlug(slug)) : undefined;
}

const claims = [
  ...principles.flatMap((p) =>
    resolvedExamples(p).flatMap((e) => {
      const href = exampleHref(e);
      return href ? [{ text: e.text, href }] : [];
    }),
  ),
  ...competencies.flatMap((c) => resolvedItems(c)).filter((i) => !i.href.startsWith('https://')),
];

describe('claims on /approach and /evidence', () => {
  it('checks every internal link', () => {
    expect(claims.length).toBe(17 + 20);
    for (const { href } of claims) expect(linkedContent(href)).toBeDefined();
  });

  it.each(claims.map((c) => [c.href, c.text]))('%s states every number in "%s"', (href, text) => {
    const content = linkedContent(href)!;
    const missing = numbers(text).filter((n) => !numbers(content).includes(n));
    expect(missing).toEqual([]);
  });
});

describe('M7 review: claims say what the linked page says', () => {
  const allText = [...principles.flatMap((p) => p.examples), ...competencies.flatMap((c) => c.items)].map((x) => x.text);

  it('credits the agents: no item says Michael wrote the specs or runbooks (brand.md, Voice)', () => {
    for (const text of allText) expect(text).not.toMatch(/\bwrote the (runbooks|specs)\b/i);
  });

  it('does not tell the first download as done: the download path had not run live (home-media-server D7)', () => {
    const example = principles
      .flatMap((p) => p.examples)
      .find((e) => e.projectSlug === 'home-media-server' && /first real download/.test(e.text))!;
    expect(example.text).not.toMatch(/\bwas mine\b/);
    expect(example.text).toMatch(/not run/);
  });

  it('links the Navidrome/crates ownership split to the Decide step, where the page states it', () => {
    const item = competencies.flatMap((c) => c.items).find((i) => /Navidrome owns/.test(i.text))!;
    expect(item.href).toBe('/projects/home-media-server#decide');
  });

  it('says the evidence links go to the source, not that each one proves the claim', () => {
    expect(evidenceIntro.reading).not.toMatch(/where you can check it/);
  });
});
