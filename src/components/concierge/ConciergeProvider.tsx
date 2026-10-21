'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Participant, RemoteParticipant, Room, TextStreamHandler, TextStreamReader } from 'livekit-client';
import { isForgotten, parseMemory, parseMetrics, RPC_FORGET_ME, TOPIC } from '@/lib/concierge/contract';
import {
  clearMemory,
  loadMemory,
  memoryCacheKey,
  memoryExpired,
  saveMemory,
  type CachedMemory,
} from '@/lib/concierge/memoryCache';
import { browserStorage, getOrCreateVisitorId, readVisitorId, VISITOR_ID_KEY } from '@/lib/concierge/visitorId';
import {
  initialSession,
  sessionReducer,
  type BusyReason,
  type SessionAction,
  type SessionState,
} from '@/components/talk/sessionReducer';

// LiveKit (about 160 KB gzipped) loads on Connect, not with the page: livekit-client in connect(), the audio renderer
// once there is a Room. Most visits never connect.
const RoomAudio = dynamic(() => import('@/components/talk/RoomAudio'), { ssr: false });

// Spec W2: no agent in the room this long after connect() resolves means the concierge is offline.
export const AGENT_JOIN_TIMEOUT_MS = 10_000;
// Spec §4: the agent answers concierge.forget_me at once; the RPC gives up after 10 s.
const FORGET_TIMEOUT_MS = 10_000;
// The agent counts as speaking until it has been out of the speakers list this long: a pause between words doesn't
// flip the pill's name (a screen reader re-reads a focused button's name each time it changes) or stop the bars.
export const AGENT_QUIET_MS = 500;
// D92 (plan § Busy retry): a 429 busy/visitor means this visitor's earlier room is still closing (the agent leaves an
// empty room within about 20 s). Ask again this often, one request at a time, until this long after the first 429.
export const BUSY_RETRY_MS = 5_000;
export const BUSY_RETRY_LIMIT_MS = 60_000;
const TOKEN_ROUTE = '/api/concierge/token';
const STREAM_TOPICS = [TOPIC.memory, TOPIC.metrics, TOPIC.transcription];
// Attribute names on lk.transcription streams (@livekit/components-core's ParticipantAgentAttributes).
const SEGMENT_ID = 'lk.segment_id';
const TRANSCRIPTION_FINAL = 'lk.transcription_final';
// The first-visit callout (D88): set once the visitor closes it or opens the panel.
export const CALLOUT_KEY = 'concierge.callout_seen';

// A storage that throws (blocked, private mode) reads as a first visit; one that won't write leaves it to this page.
function readCalloutSeen(): boolean {
  try {
    return browserStorage()?.getItem(CALLOUT_KEY) != null;
  } catch {
    return false;
  }
}

function writeCalloutSeen() {
  try {
    browserStorage()?.setItem(CALLOUT_KEY, '1');
  } catch {
    // hidden for this page's life, shown again next load
  }
}

// One Connect's worth of LiveKit: everything teardown has to release. `alive` turns false once, at teardown, and
// every async continuation and stream handler checks it, so a session that is over can't change the page.
interface Session {
  alive: boolean;
  room: Room | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  quietTimer: ReturnType<typeof setTimeout> | undefined; // pending agentSpeaking → false
  agentIdentity: string | null;
  removeListeners: () => void;
  sent: number; // typed messages so far: each one's transcript key
  micWanted: boolean; // what the last mic press asked for, ahead of the answer
  micSeq: number; // only the newest setMicrophoneEnabled call's answer is shown
  forgetting: boolean; // a Forget me RPC is out: the one guard against a second
  forgotten: boolean; // Forget me went through: the agent's last, empty memory body is neither shown nor cached
  visitorId: string | null; // the id the token request sent: the memory cache's key
  requests: AbortController; // aborts a token request still out when the session ends
  wake: (() => void) | undefined; // ends the closing wait early, at teardown, so connect() settles
}

// Idempotent. Listeners come off before disconnect(), so our own disconnect doesn't read as the call dropping.
function teardown(session: Session) {
  if (!session.alive) return;
  session.alive = false;
  clearTimeout(session.timer);
  clearTimeout(session.quietTimer);
  session.requests.abort();
  session.wake?.();
  const room = session.room;
  session.room = null;
  if (!room) return;
  session.removeListeners();
  for (const topic of STREAM_TOPICS) room.unregisterTextStreamHandler(topic);
  room.disconnect().catch(() => {});
}

type Credentials = { kind: 'ok'; url: string; token: string } | { kind: 'busy'; reason: BusyReason };

const isBusyReason = (value: unknown): value is BusyReason => value === 'visitor' || value === 'site';

// This visitor's earlier room is still there: wait it out (D92). A busy site is not retried (D66).
const isClosing = (credentials: Credentials | null) => credentials?.kind === 'busy' && credentials.reason === 'visitor';

// The route answers 503 {offline: true} without LiveKit configured and 429 {error: 'busy', reason} when this address
// or the whole site is at its room limit (D66). Any other failure, a 429 with another body included, reads as offline.
async function fetchCredentials(visitorId: string, signal: AbortSignal): Promise<Credentials | null> {
  try {
    const res = await fetch(TOKEN_ROUTE, {
      signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId }),
    });
    if (!res.ok && res.status !== 429) return null;
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return null;
    const { url, token, error, reason } = body as Record<string, unknown>;
    if (res.status === 429) return error === 'busy' && isBusyReason(reason) ? { kind: 'busy', reason } : null;
    return typeof url === 'string' && typeof token === 'string' ? { kind: 'ok', url, token } : null;
  } catch {
    return null;
  }
}

// A §4 body: read whole, parsed, and dropped without a sound if it is malformed or the stream fails. `use` also gets
// the text as sent: the memory cache keeps that, not the parsed object (D91).
function readBody<T>(reader: TextStreamReader, parse: (text: string) => T | null, use: (body: T, text: string) => void) {
  reader.readAll().then(
    (text) => {
      const body = parse(text);
      if (body) use(body, text);
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

interface ConciergeActions {
  connect: () => Promise<void>;
  leave: () => void;
  toggleMic: () => void;
  startAudio: () => void;
  sendMessage: (text: string) => Promise<boolean>;
  forgetMe: () => Promise<void>;
}

export type PanelState = 'closed' | 'open';

export interface ConciergeValue extends ConciergeActions {
  state: SessionState;
  // The drawer (D86): 'closed' on every first render. Opening and minimizing it never touch the call.
  panel: PanelState;
  openPanel: () => void;
  minimizePanel: () => void;
  // The first-visit callout (D88): true until mount has read the key, so no server or first client render has it.
  calloutSeen: boolean;
  dismissCallout: () => void;
  // The agent is among LiveKit's active speakers: the pill's bars move (D87). False whenever there is no live call.
  agentSpeaking: boolean;
  // The same Room as the session's, for RoomAudio during render (a ref can't be read in render).
  room: Room | null;
  // Connects so far: MessageBox is keyed on it, so each session starts with an empty box.
  sessionCount: number;
  configured: boolean;
  // The last memory body this browser's visitor id received (D91): read after mount, replaced by each live body,
  // gone after Forget me. The views show it greyed while the session has none.
  cachedMemory: CachedMemory | null;
}

const ConciergeContext = createContext<ConciergeValue | null>(null);

export function useConcierge(): ConciergeValue {
  const value = useContext(ConciergeContext);
  if (!value) throw new Error('useConcierge must be used inside ConciergeProvider');
  return value;
}

// The one call, above the pages (D85, plan docs/plans/2026-10-21-P3-concierge-in-site.md § Ownership): SiteChrome
// mounts it on every chrome page, so a client-side navigation re-renders the page under it and the call goes on.
// Connect, the token route, one Room, the agent's text streams into the reducer, and the offline state. Nothing runs
// before Connect, so the server HTML and the first client render match. `configured` is false when the server has no
// LiveKit env (D46, read in layout.tsx): Connect then shows offline with no request, so the browser logs no 503.
export default function ConciergeProvider({ configured, children }: { configured: boolean; children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const sessionRef = useRef<Session | null>(null);
  // Set and cleared with sessionRef's Room: made in connect(), gone on Leave, offline or a dropped call.
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [panel, setPanel] = useState<PanelState>('closed');
  const [calloutSeen, setCalloutSeen] = useState(true);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [cachedMemory, setCachedMemory] = useState<CachedMemory | null>(null);
  // Opening the panel counts as having seen the callout (D88).
  const panelActions = useMemo(() => {
    const dismissCallout = () => {
      setCalloutSeen(true);
      writeCalloutSeen();
    };
    return {
      openPanel: () => {
        setPanel('open');
        dismissCallout();
      },
      minimizePanel: () => setPanel('closed'),
      dismissCallout,
    };
  }, []);
  const { dismissCallout } = panelActions;

  // After mount, never during render: localStorage doesn't exist on the server.
  useEffect(() => {
    if (!readCalloutSeen()) setCalloutSeen(false);
  }, []);

  // The cache is read only for an id this browser already has: reading never makes one (D45). A copy past its
  // retention is removed (D96). Another tab saving or clearing it (Forget me there) is followed here.
  useEffect(() => {
    const read = () => {
      const storage = browserStorage();
      const visitorId = readVisitorId(storage);
      const cached = visitorId ? loadMemory(storage, visitorId) : null;
      if (visitorId && cached && memoryExpired(cached, Date.now())) {
        clearMemory(storage, visitorId);
        return setCachedMemory(null);
      }
      setCachedMemory(cached);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === VISITOR_ID_KEY || event.key.startsWith(memoryCacheKey(''))) read();
    };
    read();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // The actions only touch the session ref and stable setters, so they are made once (per `configured`) and a
  // consumer that only calls them doesn't depend on the transcript.
  const actions = useMemo<ConciergeActions>(() => {
    function release(session: Session) {
      teardown(session);
      setRoom(null);
      setAgentSpeaking(false);
    }

    // The session stays in sessionRef after offline or a drop, so a Forget me answer that lands later is still shown.
    function endSession() {
      if (sessionRef.current) release(sessionRef.current);
      sessionRef.current = null;
    }

    // A rejection (a NotAllowedError when the visitor or the browser refuses the mic) only notes it: the session
    // stays live and typing still works. Presses can overlap; each flips what was last asked for, and only the newest
    // call's answer reaches the label.
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
        quietTimer: undefined,
        agentIdentity: null,
        removeListeners: () => {},
        sent: 0,
        micWanted: false,
        micSeq: 0,
        forgetting: false,
        forgotten: false,
        visitorId: null,
        requests: new AbortController(),
        wake: undefined,
      };
      sessionRef.current = session;
      setSessionCount((n) => n + 1);
      // A visitor who connects has found the concierge: the first-visit callout is done (D88).
      dismissCallout();
      dispatch({ type: 'connect' });
      const send = (action: SessionAction) => {
        if (session.alive) dispatch(action);
      };
      const goOffline = () => {
        if (!session.alive) return;
        release(session);
        dispatch({ type: 'offline' });
      };
      if (!configured) return goOffline();

      // LiveKit and the audio renderer load alongside the token request; a failed load reads as offline, like a
      // failed connect(), and once loaded RoomAudio's next/dynamic can't fail later.
      const livekit = Promise.all([import('livekit-client'), import('@/components/talk/RoomAudio')]);
      livekit.catch(() => {});
      const visitorId = getOrCreateVisitorId(browserStorage());
      session.visitorId = visitorId;
      let credentials = await fetchCredentials(visitorId, session.requests.signal);
      if (!session.alive) return;
      // D92: this visitor's earlier room is closing. Ask again BUSY_RETRY_MS after each answer, so never two requests
      // at once, until a token or BUSY_RETRY_LIMIT_MS after this first 429. Leave, pagehide or unmount clear the
      // timer (teardown), and this Connect goes no further.
      if (isClosing(credentials)) {
        send({ type: 'closing' });
        const deadline = Date.now() + BUSY_RETRY_LIMIT_MS;
        while (isClosing(credentials)) {
          await new Promise<void>((resolve) => {
            session.wake = resolve;
            session.timer = setTimeout(resolve, BUSY_RETRY_MS);
          });
          session.wake = undefined;
          if (!session.alive || Date.now() >= deadline) break;
          credentials = await fetchCredentials(visitorId, session.requests.signal);
          if (!session.alive) return;
        }
        if (!session.alive) return;
        if (credentials?.kind === 'ok') send({ type: 'closed' });
      }
      if (!credentials) return goOffline();
      // No Room yet, so nothing to disconnect; no timer and no further request: the visitor presses Connect again.
      if (credentials.kind === 'busy') {
        release(session);
        return dispatch({ type: 'busy', reason: credentials.reason });
      }
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
      // Each body is shown and kept as this visitor's cached memory (D91), until Forget me has gone through: the
      // agent's last, empty body after it is neither, so "Forgotten" stays and the cache stays empty.
      room.registerTextStreamHandler(TOPIC.memory, (reader) =>
        readBody(reader, parseMemory, (body, text) => {
          if (!session.alive || session.forgotten) return;
          dispatch({ type: 'memory', body });
          const savedAt = new Date().toISOString();
          saveMemory(browserStorage(), visitorId, text, savedAt);
          setCachedMemory({ body, savedAt });
        })
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

      // The one place the mic is asked for (D65): only once the agent is there, so an offline Connect never prompts.
      // Once per session: both callers skip it when agentIdentity is set, and a reconnect replays no arrival.
      const agentArrived = (identity: string) => {
        clearTimeout(session.timer);
        session.agentIdentity = identity;
        send({ type: 'agentJoined' });
        setMic(session, true);
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
      // Reconnecting in the same tick (Room.handleRestarting): so decide a microtask later, and leave a reconnect
      // alone. One that finally fails ends with RoomEvent.Disconnected.
      const onParticipantDisconnected = (p: RemoteParticipant) => {
        if (p.identity !== session.agentIdentity) return;
        quiet();
        queueMicrotask(() => {
          if (room.state !== ConnectionState.Reconnecting) dropped();
        });
      };
      // A reconnect emits nothing for an agent that left during the outage: look for it once the room is back.
      const onReconnected = () => {
        if (session.agentIdentity && !room.remoteParticipants.has(session.agentIdentity)) dropped();
      };
      const onPlayback = () => send({ type: 'audio', blocked: !room.canPlaybackAudio });
      // Before the agent has joined there is no identity to look for: nobody counts as the agent. Speaking starts at
      // once and ends AGENT_QUIET_MS after the agent last left the list.
      const quiet = () => {
        clearTimeout(session.quietTimer);
        session.quietTimer = undefined;
        setAgentSpeaking(false);
      };
      const onSpeakers = (speakers: Participant[]) => {
        if (!session.alive) return;
        const agent = session.agentIdentity;
        if (agent !== null && speakers.some((p) => p.identity === agent)) {
          clearTimeout(session.quietTimer);
          session.quietTimer = undefined;
          setAgentSpeaking(true);
        } else if (session.quietTimer === undefined) {
          session.quietTimer = setTimeout(quiet, AGENT_QUIET_MS);
        }
      };
      // An outage sends no speaker update: the bars stop with it.
      const onReconnecting = () => {
        if (session.alive) quiet();
      };
      room
        .on(RoomEvent.ParticipantConnected, onParticipantConnected)
        .on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
        .on(RoomEvent.Reconnected, onReconnected)
        .on(RoomEvent.Disconnected, dropped)
        .on(RoomEvent.AudioPlaybackStatusChanged, onPlayback)
        .on(RoomEvent.ActiveSpeakersChanged, onSpeakers)
        .on(RoomEvent.Reconnecting, onReconnecting);
      session.removeListeners = () => {
        room
          .off(RoomEvent.ParticipantConnected, onParticipantConnected)
          .off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
          .off(RoomEvent.Reconnected, onReconnected)
          .off(RoomEvent.Disconnected, dropped)
          .off(RoomEvent.AudioPlaybackStatusChanged, onPlayback)
          .off(RoomEvent.ActiveSpeakersChanged, onSpeakers)
          .off(RoomEvent.Reconnecting, onReconnecting);
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

    // The agent doesn't echo lk.chat back, so the typed line goes into the transcript here, as final, once it is
    // sent. A send that fails adds no line, and MessageBox keeps the draft.
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

    // After {ok: true} the agent sends one last, empty memory and ends the call (spec §4): the answer may arrive
    // after the call has dropped, so it is shown unless the visitor has since left or connected again.
    async function forgetMe() {
      const session = sessionRef.current;
      const destinationIdentity = session?.agentIdentity;
      // ForgetMeButton is aria-disabled while busy; this is the one guard against a second RPC.
      if (!session?.room || !destinationIdentity || session.forgetting) return;
      session.forgetting = true;
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
      session.forgetting = false;
      // Erased on the server, so erased here too, whatever the visitor did meanwhile.
      if (ok) {
        session.forgotten = true;
        if (session.visitorId) clearMemory(browserStorage(), session.visitorId);
        setCachedMemory(null);
      }
      if (sessionRef.current === session) dispatch({ type: ok ? 'forgotten' : 'forgetFailed' });
    }

    return { connect, leave, toggleMic, startAudio, sendMessage, forgetMe };
  }, [configured, dismissCallout]);

  // Release the room when the provider goes: leaving the chrome (/card*) or the tab closing. Under StrictMode's
  // first, simulated unmount there is none yet.
  useEffect(() => {
    return () => {
      // The ref holds data, not a DOM node: reading its latest value at unmount is the point.
      const session = sessionRef.current;
      if (session) teardown(session);
    };
  }, []);

  // A hard navigation, reload or tab close leaves the room at once (pagehide, bfcache-safe), without dispatching:
  // the page is going away. A page restored from the bfcache would still show the call pagehide ended: back to idle.
  // Only that one: an ended call, offline or "Forgotten" is restored as it was.
  const { leave } = actions;
  useEffect(() => {
    let endedOnHide = false;
    const onPageHide = () => {
      const session = sessionRef.current;
      if (!session?.alive) return;
      teardown(session);
      setAgentSpeaking(false);
      endedOnHide = true;
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !endedOnHide) return;
      endedOnHide = false;
      leave();
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [leave]);

  const value = useMemo<ConciergeValue>(
    () => ({
      state,
      room,
      sessionCount,
      configured,
      panel,
      calloutSeen,
      agentSpeaking,
      cachedMemory,
      ...actions,
      ...panelActions,
    }),
    [state, room, sessionCount, configured, panel, calloutSeen, agentSpeaking, cachedMemory, actions, panelActions]
  );

  return (
    <ConciergeContext.Provider value={value}>
      {children}
      {room && <RoomAudio room={room} />}
    </ConciergeContext.Provider>
  );
}
