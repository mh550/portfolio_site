import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import MemoryStrip, { stripCounts } from '@/components/concierge/MemoryStrip';
import { memoryBody, memoryV2, memoryV2NoAgent } from '@/__tests__/fixtures/concierge';
import type { MemoryBody } from '@/lib/concierge/contract';
import { talkPage } from '@/lib/data/concierge';

// P3-06, D90: the strip under the message box (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Memory view).
const { kinds, notReported } = talkPage.memoryView;
const PULSE = 'motion-safe:animate-pulse';

const chips = () => within(screen.getByRole('list', { name: talkPage.memoryView.strip })).getAllByRole('listitem');
const chip = (label: string) => chips().find((li) => li.textContent!.startsWith(label))!;
const count = (label: string) => chip(label).querySelector('[data-count]')!.textContent;
const pulsing = () => chips().filter((li) => li.className.includes(PULSE)).map((li) => li.getAttribute('data-kind'));

describe('stripCounts', () => {
  it('reads a v2 body: profile, episodes, events, knowledge sections, working items', () => {
    expect(stripCounts(memoryV2)).toEqual({ profile: 3, episodes: 2, events: 5, knowledge: 4, working: 14 });
  });

  it('reads a v1 body: Profile from facts, the rest not reported', () => {
    expect(stripCounts(memoryBody)).toEqual({
      profile: 3,
      episodes: null,
      events: null,
      knowledge: null,
      working: null,
    });
  });

  it('falls back to facts when the v2 profile is null', () => {
    const body: MemoryBody = { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, profile: null } };
    expect(stripCounts(body).profile).toBe(3);
  });

  it('a v2 body without about_agent reports no Knowledge or Working', () => {
    const counts = stripCounts({ ...memoryV2NoAgent, about_agent: null });
    expect(counts).toMatchObject({ episodes: 2, events: 5, knowledge: null, working: null });
  });

  it('no body: nothing to count', () => {
    expect(stripCounts(null)).toEqual({ profile: null, episodes: null, events: null, knowledge: null, working: null });
  });
});

describe('MemoryStrip', () => {
  it('renders five chips in order: Profile · Episodes · Events · Knowledge · Working', () => {
    render(<MemoryStrip memory={memoryV2} />);
    expect(chips().map((li) => li.getAttribute('data-kind'))).toEqual([
      'profile',
      'episodes',
      'events',
      'knowledge',
      'working',
    ]);
    expect(chips().map((li) => li.textContent!.startsWith(kinds[li.getAttribute('data-kind') as 'profile']))).toEqual(
      [true, true, true, true, true],
    );
  });

  it('shows the v2 counts', () => {
    render(<MemoryStrip memory={memoryV2} />);
    expect([kinds.profile, kinds.episodes, kinds.events, kinds.knowledge, kinds.working].map(count)).toEqual([
      '3',
      '2',
      '5',
      '4',
      '14',
    ]);
  });

  it("colours each chip's dot with its token", () => {
    render(<MemoryStrip memory={memoryV2} />);
    const tokens = chips().map((li) => li.querySelector('[data-dot]')!.className.match(/--color-(mem-[a-z-]+)/)![1]);
    expect(tokens).toEqual(['mem-profile', 'mem-episode', 'mem-event', 'mem-knowledge', 'mem-working']);
  });

  it('from a v1 body: Profile counts facts, the other four are dashes titled "not reported by this agent version"', () => {
    render(<MemoryStrip memory={memoryBody} />);
    expect(count(kinds.profile)).toBe('3');
    expect(chip(kinds.profile)).not.toHaveAttribute('title');
    for (const label of [kinds.episodes, kinds.events, kinds.knowledge, kinds.working]) {
      expect(count(label)).toBe('–');
      expect(chip(label)).toHaveAttribute('title', notReported);
      expect(within(chip(label)).getByText(notReported)).toHaveClass('sr-only');
    }
  });

  it('with no body every chip is a dash with no title: nothing has been reported yet', () => {
    render(<MemoryStrip memory={null} />);
    for (const li of chips()) {
      expect(li.querySelector('[data-count]')!.textContent).toBe('–');
      expect(li).not.toHaveAttribute('title');
    }
  });

  it('does not pulse on first render', () => {
    render(<MemoryStrip memory={memoryV2} />);
    expect(pulsing()).toEqual([]);
  });

  it('pulses once the chips whose count changed, and only those', () => {
    const { rerender } = render(<MemoryStrip memory={memoryV2} />);
    const more: MemoryBody = {
      ...memoryV2,
      about_visitor: {
        ...memoryV2.about_visitor!,
        events: [{ ts: null, type: 'fact_added', detail: 'Learned your team size.' }, ...memoryV2.about_visitor!.events!],
      },
    };
    rerender(<MemoryStrip memory={more} />);
    expect(pulsing()).toEqual(['events']);
    for (const li of chips().filter((c) => c.getAttribute('data-kind') === 'events')) {
      expect(li.className).toContain('motion-safe:[animation-iteration-count:1]');
    }
  });

  it('stops pulsing a chip when the next body leaves its count alone', () => {
    const { rerender } = render(<MemoryStrip memory={memoryBody} />);
    rerender(<MemoryStrip memory={memoryV2} />);
    expect(pulsing()).toEqual(['episodes', 'events', 'knowledge', 'working']);
    rerender(<MemoryStrip memory={{ ...memoryV2, summary: 'Another summary' }} />);
    expect(pulsing()).toEqual([]);
  });

  it('replays the pulse when the same chip changes twice in a row (a fresh element)', () => {
    const { rerender } = render(<MemoryStrip memory={memoryBody} />);
    const one = { ...memoryBody, facts: memoryBody.facts.slice(0, 1) };
    rerender(<MemoryStrip memory={one} />);
    const first = chip(kinds.profile);
    rerender(<MemoryStrip memory={{ ...memoryBody, facts: memoryBody.facts.slice(0, 2) }} />);
    expect(pulsing()).toEqual(['profile']);
    expect(chip(kinds.profile)).not.toBe(first);
  });

  it('never pulses a chip that goes to a dash (the call ended)', () => {
    const { rerender } = render(<MemoryStrip memory={memoryV2} />);
    rerender(<MemoryStrip memory={null} />);
    expect(pulsing()).toEqual([]);
  });

  it('pulses only through motion-safe: classes', () => {
    const { rerender } = render(<MemoryStrip memory={memoryBody} />);
    rerender(<MemoryStrip memory={memoryV2} />);
    for (const li of chips()) {
      const animated = li.className.split(/\s+/).filter((c) => /animate|animation/.test(c));
      for (const c of animated) expect(c).toMatch(/^motion-safe:/);
    }
  });

  // P3-06 review: a scroll container with nothing focusable can't be scrolled by keyboard; the chips wrap instead.
  it('wraps its chips onto a second row rather than scrolling', () => {
    render(<MemoryStrip memory={memoryV2} />);
    const list = screen.getByRole('list', { name: talkPage.memoryView.strip });
    expect(list).toHaveClass('flex-wrap');
    expect(list).not.toHaveClass('overflow-x-auto');
  });

  it('reads as separate words: "Profile 3", "Episodes – not reported…"', () => {
    render(<MemoryStrip memory={memoryBody} />);
    expect(chip(kinds.profile).textContent).toBe('Profile 3');
    expect(chip(kinds.episodes).textContent).toBe(`Episodes – ${notReported}`);
  });

  it('pulses under StrictMode too (the double render does not swallow it)', () => {
    const { rerender } = render(
      <StrictMode>
        <MemoryStrip memory={memoryBody} />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <MemoryStrip memory={memoryV2} />
      </StrictMode>,
    );
    expect(pulsing()).toEqual(['episodes', 'events', 'knowledge', 'working']);
  });
});
