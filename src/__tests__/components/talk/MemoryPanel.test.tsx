import { readFileSync } from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import MemoryPanel, { LEARNED_AT_FORMAT } from '@/components/talk/MemoryPanel';
import { emptyMemory, memoryBody } from '@/__tests__/fixtures/concierge';
import type { MemoryBody } from '@/lib/concierge/contract';

// The same options the component uses, so the machine's locale and time zone don't matter.
const local = (iso: string) => new Intl.DateTimeFormat(undefined, LEARNED_AT_FORMAT).format(new Date(iso));

const factRows = () => within(screen.getByRole('list', { name: 'What it remembers' })).getAllByRole('listitem');

describe('MemoryPanel', () => {
  it('has an h2 heading', () => {
    render(<MemoryPanel memory={memoryBody} />);
    expect(screen.getByRole('heading', { level: 2, name: 'What it remembers' })).toBeInTheDocument();
  });

  it("says 'a new visitor' when the name is unknown, and the visit count", () => {
    render(<MemoryPanel memory={memoryBody} />);
    expect(screen.getByText('Talking to a new visitor · visit 2')).toBeInTheDocument();
  });

  it('uses the name once the agent has it', () => {
    render(<MemoryPanel memory={{ ...memoryBody, visitor: { name: 'Ana', visits: 3 } }} />);
    expect(screen.getByText('Talking to Ana · visit 3')).toBeInTheDocument();
  });

  it("treats an empty name as unknown", () => {
    render(<MemoryPanel memory={{ ...memoryBody, visitor: { name: '', visits: 1 } }} />);
    expect(screen.getByText('Talking to a new visitor · visit 1')).toBeInTheDocument();
  });

  it('separates the slot from the value in the text', () => {
    render(<MemoryPanel memory={memoryBody} />);
    expect(factRows()[2].querySelector('p')!.textContent).toBe('city Lisbon');
  });

  it('renders facts that share an id without dropping one', () => {
    const fact = memoryBody.facts[0];
    render(<MemoryPanel memory={{ ...memoryBody, facts: [fact, { ...fact, value: 'Founder' }] }} />);
    expect(factRows()).toHaveLength(2);
    expect(screen.getByText('Founder')).toBeInTheDocument();
  });

  it('renders one row per fact, in order, with every field', () => {
    render(<MemoryPanel memory={memoryBody} />);
    const rows = factRows();
    expect(rows).toHaveLength(3);
    memoryBody.facts.forEach((fact, i) => {
      const row = within(rows[i]);
      expect(row.getByText(fact.slot)).toBeInTheDocument();
      expect(row.getByText(fact.value)).toBeInTheDocument();
      expect(row.getByText(fact.channel!)).toBeInTheDocument();
      expect(row.getByText(fact.source!)).toBeInTheDocument();
      expect(row.getByText(local(fact.learned_at!))).toBeInTheDocument();
      expect(row.getByText(`${Math.round(fact.confidence! * 100)}%`)).toBeInTheDocument();
    });
  });

  it('formats learned_at as a local date and time, with a machine-readable datetime', () => {
    render(<MemoryPanel memory={memoryBody} />);
    const time = within(factRows()[2]).getByText(local('2026-10-20T08:12:00Z'));
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-10-20T08:12:00Z');
  });

  it('shows the summary when present', () => {
    render(<MemoryPanel memory={memoryBody} />);
    expect(screen.getByText(memoryBody.summary!)).toBeInTheDocument();
  });

  it("shows 'Nothing remembered yet' and no list or summary when facts is empty", () => {
    render(<MemoryPanel memory={emptyMemory} />);
    expect(screen.getByText('Nothing remembered yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    expect(screen.getByText('Talking to a new visitor · visit 0')).toBeInTheDocument();
  });

  it('shows the summary even when no facts are left', () => {
    render(<MemoryPanel memory={{ ...emptyMemory, summary: 'Said hello.' }} />);
    expect(screen.getByText('Nothing remembered yet')).toBeInTheDocument();
    expect(screen.getByText('Said hello.')).toBeInTheDocument();
  });

  it("shows only 'Nothing remembered yet' before any memory arrives", () => {
    render(<MemoryPanel memory={null} />);
    expect(screen.getByText('Nothing remembered yet')).toBeInTheDocument();
    expect(screen.queryByText(/Talking to/)).not.toBeInTheDocument();
  });

  it('renders null fields and a bad date as an en dash, never null or NaN', () => {
    const odd: MemoryBody = {
      ...memoryBody,
      facts: [
        { id: 'f1', slot: 'role', value: 'Designer', channel: null, source: null, learned_at: null, confidence: null },
        { id: 'f2', slot: 'city', value: 'Porto', channel: 'voice', source: 'said', learned_at: 'not a date', confidence: 0.5 },
      ],
    };
    const { container } = render(<MemoryPanel memory={odd} />);
    const [first, second] = factRows();
    expect(within(first).getAllByText('–')).toHaveLength(4);
    expect(within(second).getAllByText('–')).toHaveLength(1);
    expect(container.textContent).not.toMatch(/null|NaN|Invalid Date|undefined/);
  });

  it('has no hooks or client directive (Server-Component-safe)', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/components/talk/MemoryPanel.tsx'), 'utf8');
    expect(source).not.toMatch(/['"]use client['"]/);
    expect(source).not.toMatch(/\buse[A-Z]\w*\(/);
  });
});
