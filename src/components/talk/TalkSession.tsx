'use client';

import { useEffect, useReducer, useRef } from 'react';
import Link from 'next/link';
import {
  ConnectionState,
  ParticipantKind,
  Room,
  RoomEvent,
  type RemoteParticipant,
  type TextStreamHandler,
  type TextStreamReader,
} from 'livekit-client';
import { parseMemory, parseMetrics, TOPIC } from '@/lib/concierge/contract';
import { browserStorage, getOrCreateVisitorId } from '@/lib/concierge/visitorId';
import { talkPage } from '@/lib/data';
import { focusRing } from '@/components/focusRing';
import LatencyPanel from './LatencyPanel';
import MemoryPanel from './MemoryPanel';
import Transcript from './Transcript';
import { initialSession, sessionReducer, type Phase, type SessionAction } from './sessionReducer';

// Spec W2: no agent in the room this long after connect() resolves means the concierge is offline.
export const AGENT_JOIN_TIMEOUT_MS = 10_000;
const TOKEN_ROUTE = '/api/concierge/token';
const STREAM_TOPICS = [TOPIC.memory, TOPIC.metrics, TOPIC.transcription];
// Attribute names on lk.transcription streams (@livekit/components-core's ParticipantAgentAttributes).
const SEGMENT_ID = 'lk.segment_id';
const TRANSCRIPTION_FINAL = 'lk.transcription_final';

// One Connect's worth of LiveKit: everything teardown has to release. `alive` turns false once, at teardown, and
// every async continuation and stream handler checks it, so a session that is over can't change the page.
interface Session {
  alive: boolean;
  room: Room | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  agentIdentity: string | null;
  removeListeners: () => void;
}

// Idempotent. Listeners come off before disconnect(), so our own disconnect doesn't read as the call dropping.
function teardown(session: Session) {
  if (!session.alive) return;
  session.alive = false;
  clearTimeout(session.timer);
  const room = session.room;
  session.room = null;
  if (!room) return;
  session.removeListeners();
  for (const topic of STREAM_TOPICS) room.unregisterTextStreamHandler(topic);
  room.disconnect().catch(() => {});
}

// The route answers 503 {offline: true} without LiveKit configured; any failure here reads as offline.
async function fetchCredentials(visitorId: string): Promise<{ url: string; token: string } | null> {
  try {
    const res = await fetch(TOKEN_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId }),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return null;
    const { url, token } = body as Record<string, unknown>;
    return typeof url === 'string' && typeof token === 'string' ? { url, token } : null;
  } catch {
    return null;
  }
}

// A §4 body: read whole, parsed, and dropped without a sound if it is malformed or the stream fails.
function readBody<T>(reader: TextStreamReader, parse: (text: string) => T | null, use: (body: T) => void) {
  reader.readAll().then(
    (text) => {
      const body = parse(text);
      if (body) use(body);
    },
    () => {}
  );
}

const isAgent = (p: Pick<RemoteParticipant, 'kind'>) => p.kind === ParticipantKind.AGENT;

const statusText: Partial<Record<Phase, string>> = {
  connecting: talkPage.status.connecting,
  waiting: talkPage.status.waiting,
  live: talkPage.status.live,
  ended: talkPage.status.ended,
};

const button = `rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const primary = `${button} bg-[var(--color-accent)] text-[var(--color-background)] hover:opacity-90`;
const quiet = `${button} border border-white/20 text-white hover:border-white/40`;

// The live half of /talk (plan docs/plans/2026-10-20-VC2-talk-page.md): Connect, the token route, one Room, the
// agent's text streams into the panels, and the offline state. Nothing here runs before Connect is pressed, so the
// server HTML and the first client render match.
export default function TalkSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const sessionRef = useRef<Session | null>(null);

  // The only effect: release the room on unmount. Under StrictMode's first, simulated unmount there is none yet.
  useEffect(() => {
    return () => {
      // The ref holds data, not a DOM node: reading its latest value at unmount is the point.
      const session = sessionRef.current;
      if (session) teardown(session);
    };
  }, []);

  function endSession() {
    if (sessionRef.current) teardown(sessionRef.current);
    sessionRef.current = null;
  }

  // The Room and the visitor id are made here, in the click handler, never in an effect (D45).
  async function connect() {
    endSession();
    const session: Session = { alive: true, room: null, timer: undefined, agentIdentity: null, removeListeners: () => {} };
    sessionRef.current = session;
    dispatch({ type: 'connect' });
    const send = (action: SessionAction) => {
      if (session.alive) dispatch(action);
    };
    const goOffline = () => {
      if (!session.alive) return;
      teardown(session);
      dispatch({ type: 'offline' });
    };

    const credentials = await fetchCredentials(getOrCreateVisitorId(browserStorage()));
    if (!session.alive) return;
    if (!credentials) return goOffline();

    const room = new Room();
    session.room = room;

    // All three handlers before connect(): the agent sends memory as soon as it joins (spec §4).
    room.registerTextStreamHandler(TOPIC.memory, (reader) =>
      readBody(reader, parseMemory, (body) => send({ type: 'memory', body }))
    );
    room.registerTextStreamHandler(TOPIC.metrics, (reader) =>
      readBody(reader, parseMetrics, (body) => send({ type: 'metrics', body }))
    );
    const onTranscription: TextStreamHandler = (reader, { identity }) => {
      const { info } = reader;
      const key = info.attributes?.[SEGMENT_ID] ?? info.id;
      // The agent publishes the visitor's speech under the visitor's identity.
      const who = identity === room.localParticipant.identity ? 'visitor' : 'agent';
      void (async () => {
        let text = '';
        try {
          for await (const delta of reader) {
            text += delta;
            send({ type: 'line', line: { key, who, text, final: false } });
          }
        } catch {
          // a stream cut short keeps what arrived
        }
        // The trailer can update the attributes, so read them once the stream has ended. Only an explicit "false"
        // (an interim speech-to-text result) leaves a finished stream non-final: a stream without the attribute is
        // done when it closes, so the log is never left aria-busy by an agent that doesn't set it.
        send({ type: 'line', line: { key, who, text, final: info.attributes?.[TRANSCRIPTION_FINAL] !== 'false' } });
      })();
    };
    room.registerTextStreamHandler(TOPIC.transcription, onTranscription);

    const agentArrived = (identity: string) => {
      clearTimeout(session.timer);
      session.agentIdentity = identity;
      send({ type: 'agentJoined', identity });
    };
    const onParticipantConnected = (p: RemoteParticipant) => {
      if (session.alive && !session.agentIdentity && isAgent(p)) agentArrived(p.identity);
    };
    const dropped = () => {
      if (!session.alive) return;
      teardown(session);
      dispatch({ type: 'dropped' });
    };
    // A full reconnect (say Wi-Fi to cellular) first unwinds every remote participant, then sets the state to
    // Reconnecting in the same tick (Room.handleRestarting): so decide a microtask later, and leave a reconnect alone.
    // One that finally fails ends with RoomEvent.Disconnected.
    const onParticipantDisconnected = (p: RemoteParticipant) => {
      if (p.identity !== session.agentIdentity) return;
      queueMicrotask(() => {
        if (room.state !== ConnectionState.Reconnecting) dropped();
      });
    };
    room
      .on(RoomEvent.ParticipantConnected, onParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      .on(RoomEvent.Disconnected, dropped);
    session.removeListeners = () => {
      room
        .off(RoomEvent.ParticipantConnected, onParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
        .off(RoomEvent.Disconnected, dropped);
    };

    try {
      await room.connect(credentials.url, credentials.token);
    } catch {
      return goOffline();
    }
    if (!session.alive || session.agentIdentity) return;
    const present = [...room.remoteParticipants.values()].find(isAgent);
    if (present) return agentArrived(present.identity);
    send({ type: 'connected' });
    session.timer = setTimeout(goOffline, AGENT_JOIN_TIMEOUT_MS);
  }

  function leave() {
    endSession();
    dispatch({ type: 'leave' });
  }

  const { phase } = state;
  const inSession = phase === 'connecting' || phase === 'waiting' || phase === 'live';

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {inSession ? (
            <button type="button" className={quiet} onClick={leave}>
              {talkPage.labels.leave}
            </button>
          ) : (
            <button type="button" className={primary} onClick={() => void connect()}>
              {talkPage.labels.connect}
            </button>
          )}
          <p role="status" className="text-[var(--color-muted)]">
            {phase === 'offline' ? talkPage.offlineMessage : statusText[phase]}
          </p>
        </div>
        {phase === 'offline' && (
          <p>
            <Link
              href={talkPage.deepDiveHref}
              className={`text-[var(--color-accent)] underline underline-offset-4 hover:decoration-2 ${focusRing}`}
            >
              {talkPage.deepDiveLabel}
            </Link>
          </p>
        )}
        <Transcript lines={state.lines} />
      </div>
      <div className="space-y-6">
        <MemoryPanel memory={state.memory} />
        <LatencyPanel turns={state.turns} />
      </div>
    </div>
  );
}
