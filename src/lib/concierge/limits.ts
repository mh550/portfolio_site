import { createHmac } from 'node:crypto';

// The token route's room limits (plan docs/plans/2026-10-20-VC5-mic-limits-server-only.md § Address hash): pure, so
// no env and no server-only; the secret comes in as an argument. The address and its bucket are never logged or
// returned.

export type BusyVerdict = 'visitor' | 'site';

const ROOM_PREFIX = 'concierge-';
const DEFAULT_MAX_ROOMS = 2;

// The first x-forwarded-for entry (Vercel overwrites the header with the client's address; next dev fills it from the
// socket), or one shared 'unknown' bucket without it (D64).
export function addressOf(headers: Headers): string {
  const first = headers.get('x-forwarded-for')?.split(',')[0].trim();
  return first || 'unknown';
}

// Ten hex characters of HMAC-SHA256 keyed with the LiveKit secret, so the bucket can't be reversed without it.
export function addressBucket(address: string, secret: string): string {
  return createHmac('sha256', secret).update(address).digest('hex').slice(0, 10);
}

// One room per address (D72): tokens minted from it before anyone joins all name this room, so joining them all
// starts one room and dispatches one agent (the token's roomConfig applies only when the join creates the room).
export function roomNameFor(bucket: string): string {
  return `${ROOM_PREFIX}${bucket}`;
}

// 'visitor' if this address already has a live room, else 'site' if `max` or more concierge rooms are live, else
// null. Rooms of other uses of the LiveKit project (not concierge-*) don't count.
export function roomsVerdict(rooms: { name: string }[], bucket: string, max: number): BusyVerdict | null {
  const concierge = rooms.filter((room) => room.name.startsWith(ROOM_PREFIX));
  if (concierge.some((room) => room.name === roomNameFor(bucket))) return 'visitor';
  return concierge.length >= max ? 'site' : null;
}

// CONCIERGE_MAX_ROOMS when it is a whole number of at least 1; anything else is the default, 2. A value too large to
// be a safe integer (or Infinity) would switch the site cap off, so it falls back too.
export function maxRooms(env: Record<string, string | undefined>): number {
  const value = env.CONCIERGE_MAX_ROOMS;
  if (!value || !/^\d+$/.test(value)) return DEFAULT_MAX_ROOMS;
  const max = Number(value);
  return Number.isSafeInteger(max) && max >= 1 ? max : DEFAULT_MAX_ROOMS;
}
