import type { MemoryBody, MetricsBody } from '@/lib/concierge/contract';
import type { TranscriptLine } from './Transcript';

// The /talk session as one pure reducer (plan docs/plans/2026-10-20-VC2-talk-page.md § State machine). No React and
// no LiveKit here: TalkSession owns the Room and dispatches what happened; this decides what the page shows.
export type Phase = 'idle' | 'connecting' | 'waiting' | 'live' | 'ended' | 'offline' | 'busy';
// Why the token route answered 429 (D66): this address already has a live room, or the site is at its cap.
export type BusyReason = 'visitor' | 'site';
export type ForgetStatus = 'idle' | 'busy' | 'done' | 'failed';

export interface SessionState {
  phase: Phase;
  memory: MemoryBody | null;
  turns: MetricsBody[]; // every metrics body this session, in arrival order
  lines: TranscriptLine[];
  micOn: boolean;
  micBlocked: boolean; // setMicrophoneEnabled rejected: the session stays live, typing still works
  audioBlocked: boolean; // the browser refused autoplay (!room.canPlaybackAudio): a tap on Turn on sound fixes it
  forget: ForgetStatus; // the Forget me RPC; 'done' outlasts the call the agent then ends
  busyReason: BusyReason | null; // set only in the busy phase
}

export type SessionAction =
  | { type: 'connect' } // Connect clicked: a fresh session
  | { type: 'connected' } // room.connect() resolved with no agent in the room yet
  | { type: 'agentJoined' } // TalkSession keeps the agent's identity (the RPC destination) on its session
  | { type: 'offline' } // 503, non-OK, fetch or connect() rejected, or no agent within 10 s
  | { type: 'busy'; reason: BusyReason } // the token route answered 429 busy: no Room was made, no retry
  | { type: 'dropped' } // the agent left or the room disconnected (not by us)
  | { type: 'leave' }
  | { type: 'memory'; body: MemoryBody }
  | { type: 'metrics'; body: MetricsBody }
  | { type: 'line'; line: TranscriptLine }
  | { type: 'mic'; on: boolean } // setMicrophoneEnabled(on) resolved
  | { type: 'micBlocked' } // setMicrophoneEnabled rejected (a NotAllowedError)
  | { type: 'audio'; blocked: boolean } // RoomEvent.AudioPlaybackStatusChanged, or the check after connect()
  | { type: 'forgetStart' } // Erase confirmed: the RPC is in flight
  | { type: 'forgotten' } // the RPC answered {ok: true}
  | { type: 'forgetFailed' }; // the RPC rejected or answered anything else

export const initialSession: SessionState = {
  phase: 'idle',
  memory: null,
  turns: [],
  lines: [],
  micOn: false,
  micBlocked: false,
  audioBlocked: false,
  forget: 'idle',
  busyReason: null,
};

// Once the call is over nothing will firm up a half-heard line: mark every line final, so the transcript log isn't
// left aria-busy.
const settle = (lines: TranscriptLine[]) =>
  lines.some((line) => !line.final) ? lines.map((line) => ({ ...line, final: true })) : lines;

// Phases in which a Room exists and its text streams may still land: the visitor is in a session.
export const inRoom = (phase: Phase) => phase === 'connecting' || phase === 'waiting' || phase === 'live';

// An event that doesn't fit the current phase (a late callback from a session already over) changes nothing.
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'connect':
      return state.phase === 'idle' || state.phase === 'offline' || state.phase === 'ended' || state.phase === 'busy'
        ? { ...initialSession, phase: 'connecting' }
        : state;
    case 'connected':
      return state.phase === 'connecting' ? { ...state, phase: 'waiting' } : state;
    case 'agentJoined':
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'live' }
        : state;
    case 'offline':
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'offline', lines: settle(state.lines) }
        : state;
    case 'busy':
      return state.phase === 'connecting' ? { ...state, phase: 'busy', busyReason: action.reason } : state;
    case 'dropped':
      // Before the agent arrived a dropped room reads as offline; after, the call ended and what was said stays.
      if (state.phase === 'live') return { ...state, phase: 'ended', lines: settle(state.lines) };
      return state.phase === 'connecting' || state.phase === 'waiting'
        ? { ...state, phase: 'offline', lines: settle(state.lines) }
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
    case 'mic':
      return inRoom(state.phase) ? { ...state, micOn: action.on, micBlocked: false } : state;
    case 'micBlocked':
      return inRoom(state.phase) ? { ...state, micOn: false, micBlocked: true } : state;
    case 'audio':
      return inRoom(state.phase) && state.audioBlocked !== action.blocked ? { ...state, audioBlocked: action.blocked } : state;
    case 'forgetStart':
      return state.phase === 'live' && state.forget !== 'busy' ? { ...state, forget: 'busy' } : state;
    // The answer may land after the agent has ended the call (it ends the session once it has erased): still shown.
    case 'forgotten':
      return state.forget === 'busy' ? { ...state, memory: null, forget: 'done' } : state;
    case 'forgetFailed':
      return state.forget === 'busy' ? { ...state, forget: 'failed' } : state;
  }
}
