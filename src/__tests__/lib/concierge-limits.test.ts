/**
 * @jest-environment node
 */
import { createHmac } from 'node:crypto';
import { addressBucket, addressOf, maxRooms, roomNameFor, roomsVerdict } from '@/lib/concierge/limits';

const SECRET = 'x'.repeat(32);
const OTHER_SECRET = 'y'.repeat(32);
const ADDRESS = '203.0.113.9';
const ROOM_NAME = /^concierge-[0-9a-f]{10}-[0-9a-f]{12}$/;

const headers = (init: Record<string, string> = {}) => new Headers(init);
const rooms = (...names: string[]) => names.map((name) => ({ name }));

describe('addressOf', () => {
  it('takes the first x-forwarded-for entry, trimmed', () => {
    expect(addressOf(headers({ 'x-forwarded-for': ' 203.0.113.9 , 10.0.0.1' }))).toBe(ADDRESS);
    expect(addressOf(headers({ 'x-forwarded-for': ADDRESS }))).toBe(ADDRESS);
  });

  it("is 'unknown' without the header or with an empty first entry", () => {
    expect(addressOf(headers())).toBe('unknown');
    expect(addressOf(headers({ 'x-forwarded-for': ' , 10.0.0.1' }))).toBe('unknown');
  });
});

describe('addressBucket', () => {
  const bucket = addressBucket(ADDRESS, SECRET);

  it('is the first 10 hex characters of HMAC-SHA256(secret, address)', () => {
    expect(bucket).toMatch(/^[0-9a-f]{10}$/);
    expect(bucket).toBe(createHmac('sha256', SECRET).update(ADDRESS).digest('hex').slice(0, 10));
  });

  it('depends on the secret and does not contain the address', () => {
    expect(addressBucket(ADDRESS, OTHER_SECRET)).not.toBe(bucket);
    expect(bucket).not.toContain(ADDRESS);
    expect(addressBucket('198.51.100.7', SECRET)).not.toBe(bucket);
  });
});

describe('roomNameFor', () => {
  // D73: the address's bucket and a random part, so two people behind one NAT never share a room.
  it('is concierge-<bucket>-<12 hex>, different on every call', () => {
    const bucket = addressBucket(ADDRESS, SECRET);
    const name = roomNameFor(bucket);
    expect(name).toMatch(ROOM_NAME);
    expect(name.startsWith(`concierge-${bucket}-`)).toBe(true);
    expect(roomNameFor(bucket)).not.toBe(name);
  });
});

describe('roomsVerdict', () => {
  const b = addressBucket(ADDRESS, SECRET);
  const other = (n: number) => roomNameFor(addressBucket(`198.51.100.${n}`, SECRET));

  it('is null with no live rooms', () => {
    expect(roomsVerdict([], b, 2)).toBeNull();
  });

  it("is 'visitor' when this address already has a room", () => {
    expect(roomsVerdict(rooms(`concierge-${b}-x`), b, 2)).toBe('visitor');
    expect(roomsVerdict(rooms(roomNameFor(b)), b, 2)).toBe('visitor');
  });

  it("is 'site' when max or more concierge rooms of other addresses are live", () => {
    expect(roomsVerdict(rooms(other(1), other(2)), b, 2)).toBe('site');
    expect(roomsVerdict(rooms(other(1)), b, 2)).toBeNull();
  });

  it('is null under a higher max', () => {
    expect(roomsVerdict(rooms(other(1), other(2), other(3)), b, 5)).toBeNull();
  });

  it("prefers 'visitor' over 'site'", () => {
    expect(roomsVerdict(rooms(other(1), roomNameFor(b)), b, 2)).toBe('visitor');
  });

  it('ignores rooms that are not concierge-*', () => {
    expect(roomsVerdict(rooms('lobby', 'test-room', `x-${roomNameFor(b)}`), b, 2)).toBeNull();
  });

  it('needs concierge-<bucket>- for this address: the bare bucket or another bucket is not its room', () => {
    expect(roomsVerdict(rooms(`concierge-${b}`), b, 2)).toBeNull();
    expect(roomsVerdict(rooms(`concierge-${b}x-${'0'.repeat(12)}`), b, 2)).toBeNull();
    expect(roomsVerdict(rooms(other(1)), b, 2)).toBeNull();
  });
});

describe('maxRooms', () => {
  it('reads CONCIERGE_MAX_ROOMS when it is a whole number of at least 1', () => {
    expect(maxRooms({ CONCIERGE_MAX_ROOMS: '3' })).toBe(3);
    expect(maxRooms({ CONCIERGE_MAX_ROOMS: '1' })).toBe(1);
    expect(maxRooms({ CONCIERGE_MAX_ROOMS: '03' })).toBe(3);
  });

  // A value past Number.MAX_SAFE_INTEGER (or Infinity) would switch the site cap off.
  it.each(['0', '-1', 'abc', '2.5', '', ' 3', '99999999999999999999', '9'.repeat(400), undefined])(
    'falls back to 2 for %p',
    (value) => {
      expect(maxRooms({ CONCIERGE_MAX_ROOMS: value })).toBe(2);
    },
  );

  it('falls back to 2 without the variable', () => {
    expect(maxRooms({})).toBe(2);
  });
});
