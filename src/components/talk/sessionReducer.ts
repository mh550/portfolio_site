import type { MemoryBody, MetricsBody } from '@/lib/concierge/contract';
import type { TranscriptLine } from './Transcript';

// The /talk session as one pure reducer (plan docs/plans/2026-10-20-VC2-talk-page.md § State machine). No React and
// no LiveKit here: TalkSession owns the Room and dispatches what happened; this decides what the page shows.
export type Phase = 'idle' | 'connecting' | 'waiting' | 'live' | 'ended' | 'offline';

export interface SessionState {
  phase: Phase;
  agentIdentity: string | null; // set on entering live: the RPC destination
  memory: MemoryBody | null;
  turns: MetricsBody[]; // every metrics body this session, in arrival order
  lines: TranscriptLine[];
}

export type SessionAction =
  | { type: 'connect' } // Connect clicked: a fresh session
  | { type: 'connected' } // room.connect() resolved with no agent in the room yet
  | { type: 'agentJoined'; identity: string }
  | { type: 'offline' } // 503, non-OK, fetch or connect() rejected, or no agent within 10 s
  | { type: 'dropped' } // the agent left or the room disconnected (not by us)
  | { type: 'leave' }
  | { type: 'memory'; body: MemoryBody }
  | { type: 'metrics'; body: MetricsBody }
  | { type: 'line'; line: TranscriptLine };

export const initialSession: SessionState = {
  phase: 'idle',
  agentIdentity: null,
  memory: null,
  turns: [],
  lines: [],
};

// Once the call is over nothing will firm up a half-heard line: mark every line final, so the transcript log isn't
// left aria-busy.
const settle = (lines: TranscriptLine[]) =>
  lines.some((line) => !line.final) ? lines.map((line) => ({ ...line, final: true })) : lines;

// Phases in which a Room exists and its text streams may still land.
const inRoom = (phase: Phase) => phase === 'connecting' || phase === 'waiting' || phase === 'live';

// An event that doesn't fit the current phase (a late callback from a session already over) changes nothing.
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'connect':
      return state.phase === 'idle' || state.phase === 'offline' || state.phase === 'ended'
        ? { ...initialSession, phase: 'connecting' }
        : state;
    case 'connected':
      return state.phase === 'connecting' ? { ...state, phase: 'waiting' } : state;
    case 'agentJoined':
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'live', agentIdentity: action.identity }
        : state;
    case 'offline':
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'offline', agentIdentity: null, lines: settle(state.lines) }
        : state;
    case 'dropped':
      // Before the agent arrived a dropped room reads as offline; after, the call ended and what was said stays.
      if (state.phase === 'live') return { ...state, phase: 'ended', agentIdentity: null, lines: settle(state.lines) };
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'offline', agentIdentity: null, lines: settle(state.lines) }
        : state;
    case 'leave':
      return initialSession;
    case 'memory':
      return inRoom(state.phase) ? { ...state, memory: action.body } : state;
    case 'metrics':
      return inRoom(state.phase) ? { ...state, turns: [...state.turns, action.body] } : state;
    case 'line': {
      if (!inRoom(state.phase)) return state;
      // One segment arrives as several updates sharing a key: replace the line in place. A new segment from the same
      // speaker means their previous one is over, even if no final result came for it.
      const { line: next } = action;
      const known = state.lines.some((line) => line.key === next.key);
      const lines = known
        ? state.lines.map((line) => (line.key === next.key ? next : line))
        : [...state.lines.map((line) => (line.who === next.who && !line.final ? { ...line, final: true } : line)), next];
      return { ...state, lines };
    }
  }
}
