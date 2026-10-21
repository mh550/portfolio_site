import { fireEvent, render, screen, within } from '@testing-library/react';
import PanelTabs from '@/components/concierge/PanelTabs';
import { initialSession, type SessionState } from '@/components/talk/sessionReducer';
import { focusRing } from '@/components/focusRing';
import { memoryV2, metricsFull } from '@/__tests__/fixtures/concierge';
import { privacyNote, talkPage } from '@/lib/data/concierge';

// P3-06: Memory · Latency · Privacy under the strip, in the panel and on /talk (plan § Memory view, PanelTabs).
const { headings } = talkPage;
const NAMES = [headings.memory, headings.latency, headings.privacy];

const renderTabs = (state: Partial<SessionState> = {}, onForget = jest.fn()) =>
  render(<PanelTabs state={{ ...initialSession, ...state }} onForget={onForget} />);
const tab = (name: string) => screen.getByRole('tab', { name });
const selected = () => screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true')!;

describe('PanelTabs', () => {
  it('is a tablist of Memory, Latency, Privacy, Memory selected first', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual(NAMES);
    expect(selected()).toBe(tab(headings.memory));
    expect(tab(headings.latency)).toHaveAttribute('aria-selected', 'false');
  });

  it('wires each tab to its panel: aria-controls ↔ id, the panel labelled by its tab', () => {
    renderTabs();
    for (const name of NAMES) {
      const t = tab(name);
      const panel = document.getElementById(t.getAttribute('aria-controls')!)!;
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', t.id);
    }
  });

  it('shows only the selected panel', () => {
    renderTabs();
    expect(screen.getByRole('tabpanel', { name: headings.memory })).toBeVisible();
    expect(screen.queryByRole('tabpanel', { name: headings.latency })).toBeNull();
    const hidden = screen.getAllByRole('tabpanel', { hidden: true });
    expect(hidden).toHaveLength(3);
    expect(hidden.filter((p) => p.hidden)).toHaveLength(2);
  });

  it('has one tab stop: the selected tab is 0, the others -1', () => {
    renderTabs();
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    fireEvent.click(tab(headings.privacy));
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('a click selects a tab and shows its panel', () => {
    renderTabs();
    fireEvent.click(tab(headings.latency));
    expect(selected()).toBe(tab(headings.latency));
    expect(screen.getByRole('tabpanel', { name: headings.latency })).toBeVisible();
    expect(screen.queryByRole('tabpanel', { name: headings.memory })).toBeNull();
  });

  it('ArrowRight and ArrowLeft move, wrap, and take focus; Home and End jump', () => {
    renderTabs();
    tab(headings.memory).focus();
    fireEvent.keyDown(tab(headings.memory), { key: 'ArrowRight' });
    expect(selected()).toBe(tab(headings.latency));
    expect(tab(headings.latency)).toHaveFocus();
    fireEvent.keyDown(tab(headings.latency), { key: 'ArrowRight' });
    fireEvent.keyDown(tab(headings.privacy), { key: 'ArrowRight' });
    expect(selected()).toBe(tab(headings.memory));
    fireEvent.keyDown(tab(headings.memory), { key: 'ArrowLeft' });
    expect(selected()).toBe(tab(headings.privacy));
    expect(tab(headings.privacy)).toHaveFocus();
    fireEvent.keyDown(tab(headings.privacy), { key: 'Home' });
    expect(selected()).toBe(tab(headings.memory));
    fireEvent.keyDown(tab(headings.memory), { key: 'End' });
    expect(selected()).toBe(tab(headings.privacy));
  });

  it('other keys do nothing, and the keys it handles do not scroll the page', () => {
    renderTabs();
    expect(fireEvent.keyDown(tab(headings.memory), { key: 'ArrowDown' })).toBe(true);
    expect(selected()).toBe(tab(headings.memory));
    expect(fireEvent.keyDown(tab(headings.memory), { key: 'End' })).toBe(false);
  });

  it('the Memory tab holds the memory view and Forget me', () => {
    renderTabs({ memory: memoryV2 });
    const panel = screen.getByRole('tabpanel', { name: headings.memory });
    expect(within(panel).getByRole('heading', { level: 3, name: talkPage.memoryView.aboutYou })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: talkPage.labels.forgetMe })).toBeDisabled();
  });

  it('with a v2 body the Memory tab outlines h3 About you, h4 kinds, h3 About the agent, h4 kinds (no skipped level)', () => {
    renderTabs({ memory: memoryV2 });
    const panel = screen.getByRole('tabpanel', { name: headings.memory });
    const levels = [...panel.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
    expect(levels).toEqual([3, 4, 4, 4, 3, 4, 4, 4]);
  });

  it('the Latency tab holds the latency table for the turns', () => {
    renderTabs({ turns: [metricsFull] });
    fireEvent.click(tab(headings.latency));
    const panel = screen.getByRole('tabpanel', { name: headings.latency });
    expect(within(panel).getByText('Turn 1')).toBeInTheDocument();
    // The tab names the panel: no second "Latency" heading inside it.
    expect(within(panel).queryByRole('heading')).toBeNull();
  });

  it('the Privacy tab holds the privacy note, every point', () => {
    renderTabs();
    fireEvent.click(tab(headings.privacy));
    const panel = screen.getByRole('tabpanel', { name: headings.privacy });
    expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual(privacyNote);
  });

  it('gives the tabs and the focusable panels the focus ring', () => {
    renderTabs();
    for (const el of [...screen.getAllByRole('tab'), ...screen.getAllByRole('tabpanel', { hidden: true })]) {
      for (const token of focusRing.split(' ')) expect(el.className.split(/\s+/)).toContain(token);
    }
    for (const panel of screen.getAllByRole('tabpanel', { hidden: true })) expect(panel).toHaveAttribute('tabindex', '0');
  });

  it('in the drawer (compact) the panels scroll on their own, so the transcript keeps its height', () => {
    render(<PanelTabs state={initialSession} onForget={jest.fn()} compact />);
    for (const panel of screen.getAllByRole('tabpanel', { hidden: true })) {
      expect(panel.className).toMatch(/max-h-\[25vh\]/);
      expect(panel.className).toMatch(/lg:max-h-\[40vh\]/);
      expect(panel).toHaveClass('overflow-y-auto');
    }
  });

  it('on /talk (not compact) the panels take the height they need', () => {
    renderTabs();
    for (const panel of screen.getAllByRole('tabpanel', { hidden: true })) expect(panel.className).not.toMatch(/max-h/);
  });

  it('two tab sets on one page never share ids', () => {
    render(
      <>
        <PanelTabs state={initialSession} onForget={jest.fn()} />
        <PanelTabs state={initialSession} onForget={jest.fn()} />
      </>,
    );
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
