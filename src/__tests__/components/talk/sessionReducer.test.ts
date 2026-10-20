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
  [{ type: 'agentJoined' }, ['connecting', 'waiting'], 'live'],
  [{ type: 'offline' }, ['connecting', 'waiting'], 'offline'],
  [{ type: 'dropped' }, ['live'], 'ended'],
  [{ type: 'dropped' }, ['connecting', 'waiting'], 'offline'],
];

describe('sessionReducer', () => {
  it('starts idle with empty panels', () => {
    expect(initialSession).toEqual({
      phase: 'idle',
      memory: null,
      turns: [],
      lines: [],
      micOn: false,
      micBlocked: false,
      audioBlocked: false,
      forget: 'idle',
    });
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

  it('clears the panels on Connect, after an ended call', () => {
    const ended = at('ended', { memory: memoryBody, turns: [metricsFull], lines: [line('s1', 'Hi')] });
    expect(sessionReducer(ended, { type: 'connect' })).toEqual({ ...initialSession, phase: 'connecting' });
  });

  it('keeps the transcript, memory and latency when the call ends', () => {
    const live = at('live', { memory: memoryBody, turns: [metricsFull], lines: [line('s1', 'Hi')] });
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

  describe('the microphone', () => {
    it.each(['connecting', 'waiting', 'live'] as Phase[])('follows setMicrophoneEnabled while %s', (phase) => {
      const on = sessionReducer(at(phase), { type: 'mic', on: true });
      expect(on).toMatchObject({ phase, micOn: true, micBlocked: false });
      expect(sessionReducer(on, { type: 'mic', on: false }).micOn).toBe(false);
    });

    it('a blocked mic keeps the session live; a later success clears the block', () => {
      const blocked = sessionReducer(at('live', { micOn: true }), { type: 'micBlocked' });
      expect(blocked).toMatchObject({ phase: 'live', micOn: false, micBlocked: true });
      expect(sessionReducer(blocked, { type: 'mic', on: true })).toMatchObject({ micOn: true, micBlocked: false });
    });

    it.each(['idle', 'ended', 'offline'] as Phase[])('a late mic answer while %s changes nothing', (phase) => {
      const state = at(phase);
      expect(sessionReducer(state, { type: 'mic', on: true })).toBe(state);
      expect(sessionReducer(state, { type: 'micBlocked' })).toBe(state);
    });
  });

  it('tracks blocked playback while in a room, and ignores it after', () => {
    const blocked = sessionReducer(at('live'), { type: 'audio', blocked: true });
    expect(blocked.audioBlocked).toBe(true);
    expect(sessionReducer(blocked, { type: 'audio', blocked: false }).audioBlocked).toBe(false);
    const ended = at('ended');
    expect(sessionReducer(ended, { type: 'audio', blocked: true })).toBe(ended);
  });

  describe('Forget me', () => {
    it('starts only while live, and only once', () => {
      const busy = sessionReducer(at('live'), { type: 'forgetStart' });
      expect(busy.forget).toBe('busy');
      expect(sessionReducer(busy, { type: 'forgetStart' })).toBe(busy);
      for (const phase of PHASES.filter((p) => p !== 'live')) {
        const state = at(phase);
        expect(sessionReducer(state, { type: 'forgetStart' })).toBe(state);
      }
    });

    it('{ok: true} clears the memory and is done, even once the call has ended', () => {
      const busy = at('live', { memory: memoryBody, forget: 'busy' });
      expect(sessionReducer(busy, { type: 'forgotten' })).toMatchObject({ memory: null, forget: 'done' });
      const ended = sessionReducer(busy, { type: 'dropped' });
      expect(sessionReducer(ended, { type: 'forgotten' })).toMatchObject({ phase: 'ended', memory: null, forget: 'done' });
    });

    it('a failure keeps the memory and can be retried', () => {
      const failed = sessionReducer(at('live', { memory: memoryBody, forget: 'busy' }), { type: 'forgetFailed' });
      expect(failed).toMatchObject({ memory: memoryBody, forget: 'failed' });
      expect(sessionReducer(failed, { type: 'forgetStart' }).forget).toBe('busy');
    });

    it.each(['forgotten', 'forgetFailed'] as const)('%s without an RPC in flight changes nothing', (type) => {
      const state = at('live', { memory: memoryBody });
      expect(sessionReducer(state, { type })).toBe(state);
    });

    it('a new Connect starts with Forget me idle', () => {
      expect(sessionReducer(at('ended', { forget: 'done' }), { type: 'connect' }).forget).toBe('idle');
    });
  });
});
