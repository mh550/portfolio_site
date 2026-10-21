import { fireEvent, render, screen, within } from '@testing-library/react';
import MemoryView from '@/components/concierge/MemoryView';
import { LEARNED_AT_FORMAT } from '@/components/talk/format';
import { emptyMemory, memoryBody, memoryV2, memoryV2NoAgent } from '@/__tests__/fixtures/concierge';
import type { MemoryBody, MemoryEvent } from '@/lib/concierge/contract';
import { talkPage } from '@/lib/data/concierge';

// P3-06, D90: the Memory tab (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Memory view). Replaces VC2's
// MemoryPanel: About you (Profile, Episodes, Events) and About the agent (Knowledge, Working, Cache), from a v2 body,
// with the v1 fallback, and Forget me always at its foot.
const view = talkPage.memoryView;
const { labels } = talkPage;
const local = (iso: string) => new Intl.DateTimeFormat(undefined, LEARNED_AT_FORMAT).format(new Date(iso));

type Props = Partial<Parameters<typeof MemoryView>[0]>;
const renderView = (props: Props = {}) =>
  render(<MemoryView memory={memoryV2} live={false} forget="idle" forgetLine="" onForget={jest.fn()} {...props} />);

const section = (name: string) => screen.getByRole('region', { name });
const kind = (name: string) => screen.getByRole('group', { name });

describe('MemoryView: About you, from a v2 body', () => {
  it('has the two h3 sections, About you then About the agent', () => {
    renderView();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      view.aboutYou,
      view.aboutAgent,
    ]);
  });

  it('says who it is talking to and which visit', () => {
    renderView();
    expect(screen.getByText('Talking to a new visitor · visit 2')).toBeInTheDocument();
  });

  it('uses the name once the agent has it, and treats an empty name as unknown', () => {
    const { rerender } = renderView({ memory: { ...memoryV2, visitor: { name: 'Ana', visits: 3 } } });
    expect(screen.getByText('Talking to Ana · visit 3')).toBeInTheDocument();
    rerender(
      <MemoryView
        memory={{ ...memoryV2, visitor: { name: '', visits: 1 } }}
        live={false}
        forget="idle"
        forgetLine=""
        onForget={jest.fn()}
      />,
    );
    expect(screen.getByText('Talking to a new visitor · visit 1')).toBeInTheDocument();
  });

  it('Profile: one chip per fact with slot, value, the channel and learned-at in the title', () => {
    renderView();
    const chips = within(kind(view.kinds.profile)).getAllByRole('listitem');
    expect(chips).toHaveLength(3);
    memoryV2.about_visitor!.profile!.forEach((fact, i) => {
      const chip = within(chips[i]);
      expect(chip.getByText(fact.slot)).toBeInTheDocument();
      expect(chip.getByText(fact.value)).toBeInTheDocument();
      expect(chip.getByText(`(${fact.channel})`)).toHaveClass('sr-only');
      expect(chip.getByText(fact.source!)).toBeInTheDocument();
      expect(chips[i]).toHaveAttribute('title', `${talkPage.memory.fact.learnedAt} ${local(fact.learned_at!)}`);
      expect(chips[i].className).toContain('--color-mem-profile');
    });
  });

  it('Profile: a glyph for voice and for text, none for another channel; every glyph hidden from AT', () => {
    const profile = [
      { ...memoryBody.facts[0], channel: 'voice' },
      { ...memoryBody.facts[1], channel: 'text' },
      { ...memoryBody.facts[2], channel: 'email' },
    ];
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, profile } } });
    const chips = within(kind(view.kinds.profile)).getAllByRole('listitem');
    expect(chips.map((c) => c.querySelector('svg')?.getAttribute('data-channel') ?? null)).toEqual([
      'voice',
      'text',
      null,
    ]);
    for (const svg of document.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('Profile: the channel reads as its own words after the value', () => {
    renderView();
    const chip = within(kind(view.kinds.profile)).getAllByRole('listitem')[2];
    expect(chip.querySelector('p')!.textContent).toBe('city Lisbon (text)');
  });

  it('long unbroken text wraps: the name line, the summary', () => {
    const long = 'x'.repeat(200);
    renderView({ memory: { ...memoryBody, visitor: { name: long, visits: 1 }, summary: long } });
    expect(screen.getByText(`Talking to ${long} · visit 1`)).toHaveClass('break-words');
    expect(screen.getByText(long)).toHaveClass('break-words');
  });

  it('Profile: separates the slot from the value in the text', () => {
    renderView();
    const chip = within(kind(view.kinds.profile)).getAllByRole('listitem')[2];
    expect(chip.textContent).toMatch(/^city Lisbon/);
  });

  it('Profile: a fact without learned_at has no title, a fact with a bad date neither', () => {
    const profile = [
      { ...memoryBody.facts[0], learned_at: null },
      { ...memoryBody.facts[1], learned_at: 'yesterday' },
    ];
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, profile } } });
    for (const chip of within(kind(view.kinds.profile)).getAllByRole('listitem')) expect(chip).not.toHaveAttribute('title');
  });

  it('Profile: falls back to facts when the v2 profile is null', () => {
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, profile: null } } });
    expect(within(kind(view.kinds.profile)).getAllByRole('listitem')).toHaveLength(3);
  });

  it('Profile: keeps facts that share an id', () => {
    const fact = memoryBody.facts[0];
    renderView({
      memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, profile: [fact, { ...fact, value: 'Founder' }] } },
    });
    expect(within(kind(view.kinds.profile)).getAllByRole('listitem')).toHaveLength(2);
  });

  it('Episodes: "visit n · date · summary", the open visit "in progress", newest first as sent', () => {
    renderView();
    const rows = within(kind(view.kinds.episodes)).getAllByRole('listitem');
    const day = (iso: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
    expect(rows.map((r) => r.textContent)).toEqual([
      `visit 2 · ${day('2026-10-20T08:10:00Z')} · in progress`,
      `visit 1 · ${day('2026-10-19T21:02:00Z')} · Asked how the concierge keeps memory off the turn path.`,
    ]);
    expect(rows[0]).toHaveAttribute('data-current', 'true');
    expect(rows[1]).not.toHaveAttribute('data-current');
    expect(rows[0].querySelector('[data-dot]')!.className).toContain('--color-mem-episode');
  });

  it('Episodes: only the first (newest) open visit is "in progress"; an older open one reads its summary', () => {
    const episodes = [
      { visit: 3, started_at: null, ended_at: null, summary: null },
      { visit: 2, started_at: null, ended_at: null, summary: 'Asked about the harness.' },
    ];
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, episodes } } });
    const rows = within(kind(view.kinds.episodes)).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual(['visit 3 · – · in progress', 'visit 2 · – · Asked about the harness.']);
  });

  it('Episodes: an ended visit without a summary or a date reads a dash', () => {
    const episodes = [{ visit: 4, started_at: null, ended_at: '2026-10-19T21:09:00Z', summary: null }];
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, episodes } } });
    expect(within(kind(view.kinds.episodes)).getByRole('listitem')).toHaveTextContent('visit 4 · – · –');
  });

  it('Events: newest first as sent, one sentence each, gate_rejected in the rejected colour', () => {
    renderView();
    const rows = within(kind(view.kinds.events)).getAllByRole('listitem');
    const visible = (r: HTMLElement) =>
      [...r.childNodes].filter((n) => !(n as HTMLElement).classList?.contains('sr-only')).map((n) => n.textContent).join('');
    expect(rows.map(visible)).toEqual(memoryV2.about_visitor!.events!.map((e) => e.detail));
    const dot = (i: number) => rows[i].querySelector('[data-dot]')!.className;
    expect(dot(2)).toContain('--color-mem-event-rejected');
    expect(rows[2]).toHaveAttribute('data-type', 'gate_rejected');
    for (const i of [0, 1, 3, 4]) {
      expect(dot(i)).toContain('--color-mem-event)');
      expect(dot(i)).not.toContain('rejected');
    }
    expect(rows[0]).toHaveAttribute('title', local('2026-10-20T08:12:05Z'));
  });

  it('Events: a gate_rejected row says so in words too, and every time is there for screen readers', () => {
    renderView();
    const rows = within(kind(view.kinds.events)).getAllByRole('listitem');
    const rejected = within(rows[2]).getByText(view.rejected);
    expect(rejected).toHaveClass('sr-only');
    expect(within(rows[0]).getByText(local('2026-10-20T08:12:05Z'))).toHaveClass('sr-only');
  });

  it('Events: at most 12', () => {
    const events: MemoryEvent[] = Array.from({ length: 15 }, (_, i) => ({
      ts: null,
      type: 'fact_added',
      detail: `Event ${i}`,
    }));
    renderView({ memory: { ...memoryV2, about_visitor: { ...memoryV2.about_visitor!, events } } });
    const rows = within(kind(view.kinds.events)).getAllByRole('listitem');
    expect(rows).toHaveLength(12);
    expect(rows[0]).toHaveTextContent(/^Event 0$/);
  });

  it('a null Episodes or Events list reads "not reported by this agent version"', () => {
    renderView({
      memory: { ...memoryV2, about_visitor: { profile: memoryBody.facts, episodes: null, events: null } },
    });
    expect(within(kind(view.kinds.episodes)).getByText(view.notReported)).toBeInTheDocument();
    expect(within(kind(view.kinds.events)).getByText(view.notReported)).toBeInTheDocument();
  });

  it('an empty list reads a dash, not "not reported"', () => {
    renderView({ memory: { ...memoryV2, about_visitor: { profile: [], episodes: [], events: [] } } });
    expect(within(kind(view.kinds.profile)).getByText(talkPage.empty.memory)).toBeInTheDocument();
    expect(within(kind(view.kinds.episodes)).getByText('–')).toBeInTheDocument();
    expect(within(kind(view.kinds.events)).getByText('–')).toBeInTheDocument();
    expect(screen.queryByText(view.notReported)).toBeNull();
  });

  it('the v2 body does not repeat the summary (its episodes carry it)', () => {
    renderView();
    expect(screen.queryByText(talkPage.memory.summary)).toBeNull();
  });
});

describe('MemoryView: About the agent, from a v2 body', () => {
  it('Knowledge: words, est. tokens, sections (count, names in the title), the source commit short', () => {
    renderView();
    const k = within(kind(view.kinds.knowledge));
    const value = (label: string) => k.getByText(label).nextElementSibling!;
    expect(value(view.knowledge.words)).toHaveTextContent('5,200');
    expect(value(view.knowledge.estTokens)).toHaveTextContent('7,000');
    expect(value(view.knowledge.sections)).toHaveTextContent('4');
    expect(value(view.knowledge.sections).querySelector('[title]')).toHaveAttribute(
      'title',
      'projects, experience, skills, approach',
    );
    expect(value(view.knowledge.source)).toHaveTextContent(/^3f9c2ab$/);
    expect(kind(view.kinds.knowledge).querySelector('[data-dot]')!.className).toContain('--color-mem-knowledge');
  });

  it('Knowledge: the section names are text for screen readers, not only a title', () => {
    renderView();
    expect(within(kind(view.kinds.knowledge)).getByText('projects, experience, skills, approach')).toHaveClass('sr-only');
  });

  it('Working: items, est. tokens, compacted Yes/No, compactions', () => {
    renderView();
    const w = within(kind(view.kinds.working));
    const value = (label: string) => w.getByText(label).nextElementSibling!;
    expect(value(view.working.items)).toHaveTextContent('14');
    expect(value(view.working.estTokens)).toHaveTextContent('2,100');
    expect(value(view.working.compacted)).toHaveTextContent('Yes');
    expect(value(view.working.compactions)).toHaveTextContent('1');
    expect(kind(view.kinds.working).querySelector('[data-dot]')!.className).toContain('--color-mem-working');
  });

  it('Working: compacted false reads No', () => {
    const about_agent = { ...memoryV2.about_agent!, working: { ...memoryV2.about_agent!.working!, compacted: false } };
    renderView({ memory: { ...memoryV2, about_agent } });
    expect(within(kind(view.kinds.working)).getByText(view.working.compacted).nextElementSibling).toHaveTextContent('No');
  });

  it('Cache: the cached share as a percentage', () => {
    renderView();
    expect(within(kind(view.kinds.cache)).getByText(view.cachedShare).nextElementSibling).toHaveTextContent('75%');
  });

  it('null numbers render a dash; a null Knowledge or Working object reads "not reported…"', () => {
    const about_agent = {
      knowledge: null,
      instructions_est_tokens: null,
      memory_block_chars: null,
      working: { items: null, est_tokens: null, compacted: null, compactions: null },
      cache: null,
    };
    renderView({ memory: { ...memoryV2, about_agent } });
    expect(within(kind(view.kinds.knowledge)).getByText(view.notReported)).toBeInTheDocument();
    const w = within(kind(view.kinds.working));
    for (const label of Object.values(view.working)) expect(w.getByText(label).nextElementSibling).toHaveTextContent(/^–$/);
    expect(within(kind(view.kinds.cache)).getByText(view.cachedShare).nextElementSibling).toHaveTextContent(/^–$/);
  });

  it('a v2 body without about_agent reads one line for the whole section', () => {
    renderView({ memory: memoryV2NoAgent });
    const agent = section(view.aboutAgent);
    expect(within(agent).getByText(view.notReported)).toBeInTheDocument();
    expect(within(agent).queryByRole('group')).toBeNull();
  });

  it('retention_days: the foot reads "Kept 30 days after your last visit"', () => {
    renderView();
    expect(screen.getByText('Kept 30 days after your last visit')).toBeInTheDocument();
  });
});

describe('MemoryView: a v1 body', () => {
  it('shows Profile from facts and the summary, and one "not reported" line for the rest of About you', () => {
    renderView({ memory: memoryBody });
    const you = section(view.aboutYou);
    expect(within(kind(view.kinds.profile)).getAllByRole('listitem')).toHaveLength(3);
    expect(within(you).getByText(talkPage.memory.summary)).toBeInTheDocument();
    expect(within(you).getByText(memoryBody.summary!)).toBeInTheDocument();
    expect(within(you).getAllByText(view.notReported)).toHaveLength(1);
    expect(within(you).queryByRole('group', { name: view.kinds.episodes })).toBeNull();
    expect(within(you).queryByRole('group', { name: view.kinds.events })).toBeNull();
  });

  it('About the agent is the one line', () => {
    renderView({ memory: memoryBody });
    const agent = section(view.aboutAgent);
    expect(within(agent).getByText(view.notReported)).toBeInTheDocument();
    expect(within(agent).queryByRole('group')).toBeNull();
  });

  it('no retention line', () => {
    renderView({ memory: memoryBody });
    expect(screen.queryByText(/days after your last visit/)).toBeNull();
  });

  it('a body with no facts says "Nothing remembered yet" under Profile', () => {
    renderView({ memory: emptyMemory });
    expect(within(kind(view.kinds.profile)).getByText(talkPage.empty.memory)).toBeInTheDocument();
  });
});

describe('MemoryView: no body', () => {
  it('says "Nothing remembered yet" and nothing else but Forget me', () => {
    renderView({ memory: null });
    expect(screen.getByText(talkPage.empty.memory)).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('button', { name: labels.forgetMe })).toBeInTheDocument();
  });
});

describe('MemoryView: Forget me', () => {
  it('is always there: before a call a disabled button with the hint, linked by aria-describedby', () => {
    renderView({ memory: null, live: false });
    const button = screen.getByRole('button', { name: labels.forgetMe });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Connect to erase what it remembers');
    expect(screen.getByText('Connect to erase what it remembers')).toBeInTheDocument();
  });

  it('while live, the confirm step: Forget me → Erase calls onForget once', () => {
    const onForget = jest.fn();
    renderView({ live: true, onForget });
    const button = screen.getByRole('button', { name: labels.forgetMe });
    expect(button).toBeEnabled();
    expect(screen.queryByText(view.forgetHint)).toBeNull();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button', { name: labels.erase }));
    expect(onForget).toHaveBeenCalledTimes(1);
  });

  it('while live and busy, Forget me is aria-disabled', () => {
    renderView({ live: true, forget: 'busy' });
    expect(screen.getByRole('button', { name: labels.forgetMe })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the forget line under it, polite, red when it failed', () => {
    const { rerender } = renderView({ forgetLine: talkPage.status.forgotten, forget: 'done', memory: null });
    const line = screen.getByText(talkPage.status.forgotten);
    expect(line).toHaveAttribute('aria-live', 'polite');
    expect(line.className).toContain('text-[var(--color-muted)]');
    rerender(
      <MemoryView
        memory={null}
        live
        forget="failed"
        forgetLine={talkPage.status.forgetFailed}
        onForget={jest.fn()}
      />,
    );
    expect(screen.getByText(talkPage.status.forgetFailed).className).toContain('text-red-400');
  });

  it('comes last in the view', () => {
    const { container } = renderView();
    const button = screen.getByRole('button', { name: labels.forgetMe });
    const agent = section(view.aboutAgent);
    expect(agent.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.contains(button)).toBe(true);
  });
});

describe('MemoryView: robustness', () => {
  it('renders a body with every v2 key null without throwing', () => {
    const body: MemoryBody = { ...memoryBody, v: 2, about_visitor: null, about_agent: null, retention_days: null };
    renderView({ memory: body });
    // about_visitor null: the v1 view of About you.
    expect(within(kind(view.kinds.profile)).getAllByRole('listitem')).toHaveLength(3);
  });
});

// P3-07 (D91, plan § Cache): before a call the tab shows the cached body, greyed, with "as of" when it was saved.
describe('MemoryView: the cached body', () => {
  const SAVED_AT = '2026-10-20T09:30:00.000Z';

  it('asOf marks the body stale (muted) and says when it was saved', () => {
    renderView({ asOf: SAVED_AT });
    const stale = document.querySelector('[data-stale="true"]') as HTMLElement;
    expect(stale).not.toBeNull();
    expect(screen.getByText(`${view.asOf} ${local(SAVED_AT)}`)).toBeInTheDocument();
    expect(within(stale).getByText('Lisbon')).toBeInTheDocument();
    expect(stale.className).toContain('**:text-[var(--color-muted)]');
    // Forget me is not part of the stale body: it stays as it is.
    expect(within(stale).queryByRole('button', { name: labels.forgetMe })).toBeNull();
  });

  it('a rejected event keeps its red in the greyed view: the colour is what marks it for sighted readers', () => {
    renderView({ asOf: SAVED_AT });
    const stale = document.querySelector('[data-stale="true"]') as HTMLElement;
    expect(stale.className).toContain('[&_[data-rejected]_span]:text-[var(--color-mem-event-rejected)]');
    expect(stale.querySelectorAll('[data-rejected]')).toHaveLength(1);
    expect(stale.querySelector('[data-rejected]')).toHaveAttribute('data-type', 'gate_rejected');
  });

  it('without asOf the body is current: no data-stale, no "as of"', () => {
    renderView();
    expect(document.querySelector('[data-stale]')).toBeNull();
    expect(screen.queryByText(new RegExp(`^${view.asOf} `))).toBeNull();
  });

  it('an unreadable savedAt drops the line but keeps the body greyed', () => {
    renderView({ asOf: 'not a date' });
    expect(document.querySelector('[data-stale="true"]')).not.toBeNull();
    expect(screen.queryByText(new RegExp(`^${view.asOf}`))).toBeNull();
  });

  it('once forgotten, the view shows only "Forgotten": no body, no empty line', () => {
    renderView({ memory: null, forget: 'done', forgetLine: talkPage.status.forgotten });
    expect(screen.queryByText(talkPage.empty.memory)).toBeNull();
    expect(screen.getByText(talkPage.status.forgotten)).toBeInTheDocument();
  });
});
