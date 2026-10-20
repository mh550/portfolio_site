'use client';

import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { RemoteParticipant, Room, TextStreamHandler, TextStreamReader } from 'livekit-client';
import { isForgotten, parseMemory, parseMetrics, RPC_FORGET_ME, TOPIC } from '@/lib/concierge/contract';
import { browserStorage, getOrCreateVisitorId } from '@/lib/concierge/visitorId';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import ForgetMeButton from './ForgetMeButton';
import LatencyPanel from './LatencyPanel';
import MemoryPanel from './MemoryPanel';
import MessageBox from './MessageBox';
import Transcript from './Transcript';
import { initialSession, inRoom, sessionReducer, type Phase, type SessionAction } from './sessionReducer';

// LiveKit (about 160 KB gzipped) loads on Connect, not with the page: livekit-client in connect(), the audio renderer
// once there is a Room. Most visits never connect.
const RoomAudio = dynamic(() => import('./RoomAudio'), { ssr: false });

// Spec W2: no agent in the room this long after connect() resolves means the concierge is offline.
export const AGENT_JOIN_TIMEOUT_MS = 10_000;
// Spec §4: the agent answers concierge.forget_me at once; the RPC gives up after 10 s.
const FORGET_TIMEOUT_MS = 10_000;
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
  sent: number; // typed messages so far: each one's transcript key
  micWanted: boolean; // what the last mic press asked for, ahead of the answer
  micSeq: number; // only the newest setMicrophoneEnabled call's answer is shown
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

// A browser that blocks autoplay keeps the agent silent until startAudio() runs inside a user gesture. LiveKit
// reports a refused play() with RoomEvent.AudioPlaybackStatusChanged, which shows Turn on sound; this also runs once
// connect() resolves and on each mic or Send click, in case one of them is enough.
function unlockAudio(room: Room) {
  if (!room.canPlaybackAudio) room.startAudio().catch(() => {});
}

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
  // The same Room as sessionRef's, for RoomContext during render (a ref can't be read in render). Set and cleared
  // with it: made in connect(), gone on Leave, offline or a dropped call.
  const [room, setRoom] = useState<Room | null>(null);
  // Counts Connects: MessageBox is keyed on it, so each session starts with an empty box.
  const [sessionCount, setSessionCount] = useState(0);
  // Connect and Leave are one button, so focus stays on it as the phase changes.
  const primaryRef = useRef<HTMLButtonElement>(null);
  const wasInSession = useRef(false);
  const { phase, micOn, micBlocked, audioBlocked, forget } = state;
  const inSession = inRoom(phase);

  // Release the room on unmount. Under StrictMode's first, simulated unmount there is none yet.
  useEffect(() => {
    return () => {
      // The ref holds data, not a DOM node: reading its latest value at unmount is the point.
      const session = sessionRef.current;
      if (session) teardown(session);
    };
  }, []);

  // When a call ends, a control that went with it (Forget me, or the message box turning disabled) leaves focus on
  // <body>: hand it to Connect. Never on page load.
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const lost = !active || active === document.body || (active as HTMLButtonElement).disabled;
    if (wasInSession.current && !inSession && lost) primaryRef.current?.focus({ preventScroll: true });
    wasInSession.current = inSession;
  }, [inSession]);

  function release(session: Session) {
    teardown(session);
    setRoom(null);
  }

  // The session stays in sessionRef after offline or a drop, so a Forget me answer that lands later is still shown.
  function endSession() {
    if (sessionRef.current) release(sessionRef.current);
    sessionRef.current = null;
  }

  // A rejection (a NotAllowedError when the visitor or the browser refuses the mic) only notes it: the session stays
  // live and typing still works. Presses can overlap; each flips what was last asked for, and only the newest call's
  // answer reaches the label.
  function setMic(session: Session, on: boolean) {
    const room = session.room;
    if (!room) return;
    session.micWanted = on;
    const seq = ++session.micSeq;
    const current = () => session.alive && seq === session.micSeq;
    room.localParticipant.setMicrophoneEnabled(on).then(
      () => current() && dispatch({ type: 'mic', on }),
      () => {
        if (!current()) return;
        session.micWanted = false;
        dispatch({ type: 'micBlocked' });
      }
    );
  }

  // The Room and the visitor id are made here, in the click handler, never in an effect (D45).
  async function connect() {
    endSession();
    const session: Session = {
      alive: true,
      room: null,
      timer: undefined,
      agentIdentity: null,
      removeListeners: () => {},
      sent: 0,
      micWanted: false,
      micSeq: 0,
    };
    sessionRef.current = session;
    setSessionCount((n) => n + 1);
    dispatch({ type: 'connect' });
    const send = (action: SessionAction) => {
      if (session.alive) dispatch(action);
    };
    const goOffline = () => {
      if (!session.alive) return;
      release(session);
      dispatch({ type: 'offline' });
    };

    // LiveKit and the audio renderer load alongside the token request; a failed load reads as offline, like a failed
    // connect(), and once loaded RoomAudio's next/dynamic can't fail later.
    const livekit = Promise.all([import('livekit-client'), import('./RoomAudio')]);
    livekit.catch(() => {});
    const credentials = await fetchCredentials(getOrCreateVisitorId(browserStorage()));
    if (!session.alive) return;
    if (!credentials) return goOffline();
    let lk: typeof import('livekit-client');
    try {
      [lk] = await livekit;
    } catch {
      return goOffline();
    }
    if (!session.alive) return;
    const { ConnectionState, ParticipantKind, RoomEvent } = lk;
    const isAgent = (p: Pick<RemoteParticipant, 'kind'>) => p.kind === ParticipantKind.AGENT;

    const room = new lk.Room();
    session.room = room;
    setRoom(room);

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
      send({ type: 'agentJoined' });
    };
    const onParticipantConnected = (p: RemoteParticipant) => {
      if (session.alive && !session.agentIdentity && isAgent(p)) agentArrived(p.identity);
    };
    const dropped = () => {
      if (!session.alive) return;
      release(session);
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
    // A reconnect emits nothing for an agent that left during the outage: look for it once the room is back.
    const onReconnected = () => {
      if (session.agentIdentity && !room.remoteParticipants.has(session.agentIdentity)) dropped();
    };
    const onPlayback = () => send({ type: 'audio', blocked: !room.canPlaybackAudio });
    room
      .on(RoomEvent.ParticipantConnected, onParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      .on(RoomEvent.Reconnected, onReconnected)
      .on(RoomEvent.Disconnected, dropped)
      .on(RoomEvent.AudioPlaybackStatusChanged, onPlayback);
    session.removeListeners = () => {
      room
        .off(RoomEvent.ParticipantConnected, onParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
        .off(RoomEvent.Reconnected, onReconnected)
        .off(RoomEvent.Disconnected, dropped)
        .off(RoomEvent.AudioPlaybackStatusChanged, onPlayback);
    };

    try {
      await room.connect(credentials.url, credentials.token);
    } catch {
      return goOffline();
    }
    if (!session.alive) return;
    // No extra tap: the morning check is "Connect, say your name".
    onPlayback();
    unlockAudio(room);
    setMic(session, true);
    if (session.agentIdentity) return;
    const present = [...room.remoteParticipants.values()].find(isAgent);
    if (present) return agentArrived(present.identity);
    send({ type: 'connected' });
    session.timer = setTimeout(goOffline, AGENT_JOIN_TIMEOUT_MS);
  }

  function leave() {
    endSession();
    dispatch({ type: 'leave' });
  }

  // Leave appears under the pointer as Connect turns into it: a double click on Connect must not end the call, nor
  // must a held Enter (its repeats are dropped in onPrimaryKeyDown).
  function onPrimaryClick(event: MouseEvent<HTMLButtonElement>) {
    if (!inSession) void connect();
    else if (event.detail <= 1) leave();
  }

  function onPrimaryKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat) event.preventDefault();
  }

  function toggleMic() {
    const session = sessionRef.current;
    if (!session?.room) return;
    unlockAudio(session.room);
    setMic(session, !session.micWanted);
  }

  // Turn on sound: the click is the user gesture the browser wants. AudioPlaybackStatusChanged hides the button.
  function startAudio() {
    sessionRef.current?.room?.startAudio().catch(() => {});
  }

  // The agent doesn't echo lk.chat back, so the typed line goes into the transcript here, as final, once it is sent.
  // A send that fails adds no line, and MessageBox keeps the draft.
  async function sendMessage(text: string): Promise<boolean> {
    const session = sessionRef.current;
    const room = session?.room;
    if (!session || !room) return false;
    unlockAudio(room);
    try {
      await room.localParticipant.sendText(text, { topic: TOPIC.chat });
    } catch {
      return false;
    }
    // Sent, even if the call ended meanwhile: the draft clears either way, so it can't go out twice.
    if (!session.alive) return true;
    dispatch({ type: 'line', line: { key: `typed-${++session.sent}`, who: 'visitor', text, final: true } });
    return true;
  }

  // After {ok: true} the agent sends one last, empty memory and ends the call (spec §4): the answer may arrive after
  // the call has dropped, so it is shown unless the visitor has since left or connected again.
  async function forgetMe() {
    const session = sessionRef.current;
    const destinationIdentity = session?.agentIdentity;
    // ForgetMeButton is aria-disabled while busy; this is the one guard against a second RPC.
    if (!session?.room || !destinationIdentity || forget === 'busy') return;
    dispatch({ type: 'forgetStart' });
    let ok = false;
    try {
      const reply = await session.room.localParticipant.performRpc({
        destinationIdentity,
        method: RPC_FORGET_ME,
        payload: '',
        responseTimeout: FORGET_TIMEOUT_MS,
      });
      ok = isForgotten(reply);
    } catch {
      // a timeout or an error from the agent: the visitor can try again
    }
    if (sessionRef.current === session) dispatch({ type: ok ? 'forgotten' : 'forgetFailed' });
  }

  const { status } = talkPage;
  // Once the call is over, "Try again" would point at a button that has gone.
  const forgetLine =
    forget === 'done'
      ? status.forgotten
      : forget === 'failed'
        ? phase === 'live'
          ? status.forgetFailed
          : status.forgetFailedEnded
        : '';

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            ref={primaryRef}
            className={inSession ? quiet : primary}
            onClick={onPrimaryClick}
            onKeyDown={onPrimaryKeyDown}
          >
            {inSession ? talkPage.labels.leave : talkPage.labels.connect}
          </button>
          {(phase === 'waiting' || phase === 'live') && (
            <button type="button" className={quiet} onClick={toggleMic}>
              {micOn ? talkPage.labels.micOn : talkPage.labels.micOff}
            </button>
          )}
          {inSession && audioBlocked && (
            <button type="button" className={primary} onClick={startAudio}>
              {talkPage.labels.startAudio}
            </button>
          )}
          <p role="status" className="text-[var(--color-muted)]">
            {phase === 'offline'
              ? talkPage.offlineMessage
              : phase === 'live' && micBlocked
                ? status.micBlocked
                : statusText[phase]}
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
        <Transcript lines={state.lines}>
          <MessageBox key={sessionCount} disabled={phase !== 'live'} onSend={sendMessage} />
        </Transcript>
      </div>
      <div className="space-y-6">
        <MemoryPanel memory={state.memory} />
        <LatencyPanel turns={state.turns} />
        <div className="space-y-3">
          {phase === 'live' && <ForgetMeButton onForget={() => void forgetMe()} busy={forget === 'busy'} />}
          <p aria-live="polite" className={forget === 'failed' ? 'text-red-400' : 'text-[var(--color-muted)]'}>
            {forgetLine}
          </p>
        </div>
      </div>
      {room && <RoomAudio room={room} />}
    </div>
  );
}
