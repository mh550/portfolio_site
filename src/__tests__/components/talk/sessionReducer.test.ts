import {
  initialSession,
  sessionReducer,
  type Phase,
  type SessionAction,
  type SessionState,
} from '@/components/talk/sessionReducer';
import { memoryBody, metricsFull, metricsNulls } from '../../fixtures/concierge';

const PHASES: Phase[] = ['idle', 'connecting', 'waiting', 'live', 'ended', 'offline'];
const at = (phase: Phase, extra: Partial<SessionState> = {}): SessionState => ({ ...initialSession, phase, ...extra });
const line = (key: string, text: string, final = true) => ({ key, who: 'agent' as const, text, final });

// Plan § State machine: [action, from, to]; every other phase leaves the state as it was.
const transitions: [SessionAction, Phase[], Phase][] = [
  [{ type: 'connect' }, ['idle', 'offline', 'ended'], 'connecting'],
  [{ type: 'connected' }, ['connecting'], 'waiting'],
  [{ type: 'agentJoined', identity: 'agent-1' }, ['connecting', 'waiting'], 'live'],
  [{ type: 'offline' }, ['connecting', 'waiting'], 'offline'],
  [{ type: 'dropped' }, ['live'], 'ended'],
  [{ type: 'dropped' }, ['connecting', 'waiting'], 'offline'],
];

describe('sessionReducer', () => {
  it('starts idle with empty panels', () => {
    expect(initialSession).toEqual({ phase: 'idle', agentIdentity: null, memory: null, turns: [], lines: [] });
  });

  describe.each(transitions)('%o', (action, from, to) => {
    it.each(from)(`moves %s to ${to}`, (phase) => {
      expect(sessionReducer(at(phase), action).phase).toBe(to);
    });

    const others = PHASES.filter((p) => !from.includes(p) && !transitions.some(([a, f]) => a.type === action.type && f.includes(p)));
    if (others.length > 0) {
      it.each(others)('leaves %s unchanged', (phase) => {
        const state = at(phase);
        expect(sessionReducer(state, action)).toBe(state);
      });
    }
  });

  it('records the agent identity on entering live and forgets it when the call ends', () => {
    const live = sessionReducer(at('waiting'), { type: 'agentJoined', identity: 'agent-7' });
    expect(live.agentIdentity).toBe('agent-7');
    expect(sessionReducer(live, { type: 'dropped' }).agentIdentity).toBeNull();
  });

  it('clears the panels on Connect, after an ended call', () => {
    const ended = at('ended', { memory: memoryBody, turns: [metricsFull], lines: [line('s1', 'Hi')] });
    expect(sessionReducer(ended, { type: 'connect' })).toEqual({ ...initialSession, phase: 'connecting' });
  });

  it('keeps the transcript, memory and latency when the call ends', () => {
    const live = at('live', { agentIdentity: 'a', memory: memoryBody, turns: [metricsFull], lines: [line('s1', 'Hi')] });
    const ended = sessionReducer(live, { type: 'dropped' });
    expect(ended).toMatchObject({ phase: 'ended', memory: memoryBody, turns: [metricsFull], lines: [line('s1', 'Hi')] });
  });

  it.each(PHASES)('Leave from %s returns to the initial state', (phase) => {
    const state = at(phase, { memory: memoryBody, turns: [metricsFull] });
    expect(sessionReducer(state, { type: 'leave' })).toBe(initialSession);
  });

  describe('stream bodies', () => {
    it.each(['connecting', 'waiting', 'live'] as Phase[])('land while %s', (phase) => {
      let state = sessionReducer(at(phase), { type: 'memory', body: memoryBody });
      state = sessionReducer(state, { type: 'metrics', body: metricsFull });
      state = sessionReducer(state, { type: 'metrics', body: metricsNulls });
      expect(state.memory).toBe(memoryBody);
      expect(state.turns).toEqual([metricsFull, metricsNulls]);
    });

    it.each(['idle', 'ended', 'offline'] as Phase[])('are dropped while %s (no room to come from)', (phase) => {
      const state = at(phase);
      expect(sessionReducer(state, { type: 'memory', body: memoryBody })).toBe(state);
      expect(sessionReducer(state, { type: 'metrics', body: metricsFull })).toBe(state);
      expect(sessionReducer(state, { type: 'line', line: line('s1', 'Hi') })).toBe(state);
    });

    it('a new segment from the same speaker settles their previous one; the other speaker is left alone', () => {
      let state = sessionReducer(at('live'), { type: 'line', line: line('a1', 'Hel', false) });
      state = sessionReducer(state, { type: 'line', line: { key: 'v1', who: 'visitor', text: 'Hi', final: false } });
      state = sessionReducer(state, { type: 'line', line: line('a2', 'Next', false) });
      expect(state.lines.map((l) => [l.key, l.final])).toEqual([
        ['a1', true],
        ['v1', false],
        ['a2', false],
      ]);
    });

    it.each([
      ['live', { type: 'dropped' }],
      ['waiting', { type: 'dropped' }],
      ['waiting', { type: 'offline' }],
    ] as [Phase, SessionAction][])('when %s ends (%o), every line is settled final', (phase, action) => {
      const state = at(phase, { lines: [line('a1', 'Hel', false), line('a2', 'Done')] });
      expect(sessionReducer(state, action).lines.every((l) => l.final)).toBe(true);
    });

    it('replaces a transcript line with the same key and appends a new one', () => {
      let state = sessionReducer(at('live'), { type: 'line', line: line('s1', 'Hel', false) });
      state = sessionReducer(state, { type: 'line', line: line('s2', 'Other') });
      state = sessionReducer(state, { type: 'line', line: line('s1', 'Hello there') });
      expect(state.lines).toEqual([line('s1', 'Hello there'), line('s2', 'Other')]);
    });
  });
});
