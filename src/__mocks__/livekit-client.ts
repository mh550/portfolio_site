// Jest stand-in for livekit-client (mapped in jest.config.ts), so no test can open a connection. The surface is
// what /talk calls, as the plan quotes it from the installed types (docs/plans/2026-10-20-VC2-talk-page.md § Jest).
// Tests drive it through the helpers at the bottom; they import them from '@/__mocks__/livekit-client', the same
// module instance the component gets.

type Listener = (...args: unknown[]) => void;
type TextHandler = (reader: FakeTextReader, participantInfo: { identity: string }) => void;

export const RoomEvent = {
  Disconnected: 'disconnected',
  ParticipantConnected: 'participantConnected',
  ParticipantDisconnected: 'participantDisconnected',
  Reconnected: 'reconnected',
  AudioPlaybackStatusChanged: 'audioPlaybackChanged',
} as const;

export const ConnectionState = {
  Disconnected: 'disconnected',
  Connecting: 'connecting',
  Connected: 'connected',
  Reconnecting: 'reconnecting',
} as const;

export const ParticipantKind = { STANDARD: 0, AGENT: 4 } as const;

export interface FakeParticipant {
  identity: string;
  kind: number;
}

export interface FakeTextReader {
  info: { id: string; topic: string; timestamp: number; mimeType: string; attributes: Record<string, string> };
  readAll: () => Promise<string>;
  [Symbol.asyncIterator]: () => AsyncIterator<string>;
}

export class Room {
  static instances: Room[] = [];
  // Runs on each new Room, before the component touches it: a test sets up the room it is about to get
  // (an agent already present, a connect() that rejects).
  static setup: ((room: Room) => void) | null = null;

  state: string = ConnectionState.Disconnected;
  remoteParticipants = new Map<string, FakeParticipant>();
  localParticipant = {
    identity: 'visitor-test',
    sendText: jest.fn<(text: string, options?: { topic?: string }) => Promise<{ id: string }>>(async () => ({
      id: 'sent-1',
    })),
    performRpc: jest.fn<(params: unknown) => Promise<string>>(async () => '{"ok":true}'),
    setMicrophoneEnabled: jest.fn<(enabled: boolean) => Promise<undefined>>(async () => undefined),
  };
  canPlaybackAudio = true;
  startAudio = jest.fn(async () => {});
  textHandlers = new Map<string, TextHandler>();
  private listeners = new Map<string, Set<Listener>>();

  constructor() {
    Room.instances.push(this);
    Room.setup?.(this);
  }

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return this;
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  emit(event: string, ...args: unknown[]) {
    for (const fn of [...(this.listeners.get(event) ?? [])]) fn(...args);
    return true;
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.size ?? 0;
  }

  connect = jest.fn<(url: string, token: string) => Promise<void>>(async () => {
    this.state = ConnectionState.Connected;
  });

  // Like the real one, a room already disconnected emits nothing.
  disconnect = jest.fn(async () => {
    if (this.state === ConnectionState.Disconnected) return;
    this.state = ConnectionState.Disconnected;
    this.emit(RoomEvent.Disconnected);
  });

  // Like the real one, a second handler for the same topic throws.
  registerTextStreamHandler = jest.fn((topic: string, callback: TextHandler) => {
    if (this.textHandlers.has(topic)) throw new Error(`A text stream handler for topic "${topic}" has already been set.`);
    this.textHandlers.set(topic, callback);
  });

  unregisterTextStreamHandler = jest.fn((topic: string) => {
    this.textHandlers.delete(topic);
  });
}

export { Room as MockRoom };

export function lastRoom(): Room {
  const room = Room.instances.at(-1);
  if (!room) throw new Error('no Room was created');
  return room;
}

export function resetRooms() {
  Room.instances = [];
  Room.setup = null;
}

let streamCount = 0;

// Delivers one text stream to the handler registered for `topic`, as the agent's send_text would. Resolves once the
// handler has had time to read it, so tests wrap it in `await act(...)`. A `for await` over an async generator takes
// about three microtask turns per chunk plus a few to finish, so this waits comfortably more than that.
export async function pushText(
  room: Room,
  topic: string,
  body: string,
  {
    identity = 'agent-1',
    attributes = {},
    chunks = [body],
  }: { identity?: string; attributes?: Record<string, string>; chunks?: string[] } = {}
) {
  const handler = room.textHandlers.get(topic);
  if (!handler) throw new Error(`no handler registered for ${topic}`);
  const reader: FakeTextReader = {
    info: { id: `stream-${++streamCount}`, topic, timestamp: Date.now(), mimeType: 'text/plain', attributes },
    readAll: async () => chunks.join(''),
    [Symbol.asyncIterator]: async function* () {
      yield* chunks;
    },
  };
  handler(reader, { identity });
  for (let i = 0; i < chunks.length * 4 + 20; i++) await Promise.resolve();
}

export function addAgent(room: Room, identity = 'agent-1') {
  const participant = { identity, kind: ParticipantKind.AGENT };
  room.remoteParticipants.set(identity, participant);
  room.emit(RoomEvent.ParticipantConnected, participant);
  return participant;
}

// What Room.handleRestarting does on a full reconnect: unwind every remote participant, then go Reconnecting, in
// one tick.
export function restart(room: Room) {
  for (const identity of [...room.remoteParticipants.keys()]) removeParticipant(room, identity);
  room.state = ConnectionState.Reconnecting;
}

export function removeParticipant(room: Room, identity: string) {
  const participant = room.remoteParticipants.get(identity);
  room.remoteParticipants.delete(identity);
  room.emit(RoomEvent.ParticipantDisconnected, participant);
}
