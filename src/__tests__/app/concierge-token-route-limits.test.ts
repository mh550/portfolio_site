/** @jest-environment node */
// The token route's room limits (plan docs/plans/2026-10-20-VC5-mic-limits-server-only.md § Route behaviour) and the
// VC1 200 cases. Mocks only the room list, with a factory (an automock would load the real module and its
// network client, D69); the real livekit-server-sdk signs every token.
import { createHmac, randomUUID } from 'node:crypto';
import { TokenVerifier } from 'livekit-server-sdk';
import { POST } from '@/app/api/concierge/token/route';
import { listLiveRooms } from '@/lib/concierge/rooms';

jest.mock('@/lib/concierge/rooms', () => ({ listLiveRooms: jest.fn() }));

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'CONCIERGE_MAX_ROOMS'] as const;
const URL_VALUE = 'wss://example.livekit.cloud';
const KEY_VALUE = 'k'.repeat(12);
const SECRET_VALUE = 'x'.repeat(32);
const VISITOR = '123e4567-e89b-42d3-a456-426614174000';
const ADDRESS = '203.0.113.9';
const FORWARDED = `${ADDRESS}, 10.0.0.1`;
const ROOM = /^concierge-([0-9a-f]{10})-[0-9a-f]{12}$/;

const bucketOf = (address: string) =>
  createHmac('sha256', SECRET_VALUE).update(address).digest('hex').slice(0, 10);
const BUCKET = bucketOf(ADDRESS);
const OTHER_A = 'a'.repeat(10);
const OTHER_B = 'b'.repeat(10);
const OTHER_C = 'c'.repeat(10);
const roomOf = (bucket: string) => ({ name: `concierge-${bucket}-${'0'.repeat(12)}` });

const listRooms = jest.mocked(listLiveRooms);
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  delete process.env.CONCIERGE_MAX_ROOMS;
  process.env.LIVEKIT_URL = URL_VALUE;
  process.env.LIVEKIT_API_KEY = KEY_VALUE;
  process.env.LIVEKIT_API_SECRET = SECRET_VALUE;
  listRooms.mockReset();
  listRooms.mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

// `forwarded: null` sends no x-forwarded-for header.
function post(body: string, forwarded: string | null = FORWARDED) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: 'https://michael-herron.vercel.app',
  };
  if (forwarded !== null) headers['x-forwarded-for'] = forwarded;
  return POST(new Request('http://localhost/api/concierge/token', { method: 'POST', headers, body }));
}

const postId = (visitor_id: unknown, forwarded?: string | null) => post(JSON.stringify({ visitor_id }), forwarded);

function decodePayload(jwt: string) {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
}

describe('POST /api/concierge/token success (200)', () => {
  it('returns exactly {url, token} with url = LIVEKIT_URL', async () => {
    const res = await postId(VISITOR);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const json = await res.json();
    expect(Object.keys(json).sort()).toEqual(['token', 'url']);
    expect(json.url).toBe(URL_VALUE);
    expect(typeof json.token).toBe('string');
  });

  it('asks for the room list once, with the env', async () => {
    await postId(VISITOR);
    expect(listRooms).toHaveBeenCalledTimes(1);
    expect(listRooms).toHaveBeenCalledWith({ url: URL_VALUE, apiKey: KEY_VALUE, apiSecret: SECRET_VALUE });
  });

  it('names the room concierge-<HMAC bucket of the first x-forwarded-for entry>-<12 hex>', async () => {
    const p = decodePayload((await (await postId(VISITOR)).json()).token);
    expect(p.video.room).toMatch(ROOM);
    expect(p.video.room.match(ROOM)[1]).toBe(BUCKET);
  });

  it('puts a request without x-forwarded-for in the unknown bucket', async () => {
    const p = decodePayload((await (await postId(VISITOR, null)).json()).token);
    expect(p.video.room.match(ROOM)[1]).toBe(bucketOf('unknown'));
  });

  it('signs a token whose claims carry the identity, grants and agent dispatch of VC1', async () => {
    const p = decodePayload((await (await postId(VISITOR)).json()).token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(p.video).toMatchObject({
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    expect(p.roomConfig.emptyTimeout).toBe(30);
    expect(p.roomConfig.agents).toHaveLength(1);
    expect(p.roomConfig.agents[0].agentName).toBe('concierge');
    expect(JSON.parse(p.roomConfig.agents[0].metadata)).toEqual({
      visitor_id: VISITOR,
      channel_hint: 'web',
    });
  });

  it('expires the token 600 s after its nbf', async () => {
    // The SDK reads the clock twice (exp, then nbf, no iat): freeze it so a second boundary between the reads
    // cannot make this 599.
    const now = Date.UTC(2026, 9, 20, 0, 0, 0, 999);
    jest.useFakeTimers({ now });
    try {
      const p = decodePayload((await (await postId(VISITOR)).json()).token);
      expect(p.nbf).toBe(Math.floor(now / 1000));
      expect(p.exp).toBe(p.nbf + 600);
    } finally {
      jest.useRealTimers();
    }
  });

  it('accepts an upper-case v4 id and lower-cases it in the identity and metadata (D43)', async () => {
    const p = decodePayload((await (await postId(VISITOR.toUpperCase())).json()).token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(JSON.parse(p.roomConfig.agents[0].metadata).visitor_id).toBe(VISITOR);
  });

  it('ignores every body field but visitor_id', async () => {
    const res = await post(
      JSON.stringify({ visitor_id: VISITOR, identity: 'admin', room: 'evil', ttl: 99999, agentName: 'other' }),
    );
    const p = decodePayload((await res.json()).token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(p.video.room).toMatch(ROOM);
    expect(p.exp - p.nbf).toBeLessThanOrEqual(600);
    expect(p.roomConfig.agents[0].agentName).toBe('concierge');
  });

  it('is really signed with the env secret', async () => {
    const { token } = await (await postId(VISITOR)).json();
    const claims = await new TokenVerifier(KEY_VALUE, SECRET_VALUE).verify(token);
    expect(claims.sub).toBe(`visitor-${VISITOR}`);
    await expect(new TokenVerifier(KEY_VALUE, 'y'.repeat(32)).verify(token)).rejects.toThrow();
  });

  // D73: two calls from one address before either joins get two rooms with the same bucket, so two people behind one
  // NAT never share a room.
  it('gives two calls from one address two rooms with the same bucket', async () => {
    const a = decodePayload((await (await postId(VISITOR)).json()).token);
    const b = decodePayload((await (await postId(randomUUID())).json()).token);
    expect(a.video.room.match(ROOM)[1]).toBe(BUCKET);
    expect(b.video.room.match(ROOM)[1]).toBe(BUCKET);
    expect(b.video.room).not.toBe(a.video.room);
    const other = decodePayload((await (await postId(VISITOR, '198.51.100.7')).json()).token);
    expect(other.video.room.match(ROOM)[1]).toBe(bucketOf('198.51.100.7'));
  });

  it('contains neither the key nor the secret in the response text', async () => {
    const text = await (await postId(VISITOR)).text();
    expect(text).not.toContain(KEY_VALUE);
    expect(text).not.toContain(SECRET_VALUE);
  });

  it('ignores rooms that are not concierge-* (other uses of the LiveKit project)', async () => {
    listRooms.mockResolvedValue([{ name: 'standup' }, { name: 'demo' }, { name: `x-concierge-${BUCKET}-1` }]);
    expect((await postId(VISITOR)).status).toBe(200);
  });
});

describe('POST /api/concierge/token busy (429)', () => {
  it('answers 429 {error:busy, reason:visitor} when this address already has a live room', async () => {
    listRooms.mockResolvedValue([roomOf(BUCKET)]);
    const res = await postId(VISITOR);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'busy', reason: 'visitor' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 429 {error:busy, reason:site} when two other addresses have live rooms (default cap 2)', async () => {
    listRooms.mockResolvedValue([roomOf(OTHER_A), roomOf(OTHER_B)]);
    const res = await postId(VISITOR);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'busy', reason: 'site' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('says visitor when both apply', async () => {
    listRooms.mockResolvedValue([roomOf(OTHER_A), roomOf(BUCKET)]);
    expect(await (await postId(VISITOR)).json()).toEqual({ error: 'busy', reason: 'visitor' });
  });

  it('answers 200 with one other live room under the default cap', async () => {
    listRooms.mockResolvedValue([roomOf(OTHER_A)]);
    expect((await postId(VISITOR)).status).toBe(200);
  });

  it('answers 200 with three other live rooms when CONCIERGE_MAX_ROOMS=4', async () => {
    process.env.CONCIERGE_MAX_ROOMS = '4';
    listRooms.mockResolvedValue([roomOf(OTHER_A), roomOf(OTHER_B), roomOf(OTHER_C)]);
    expect((await postId(VISITOR)).status).toBe(200);
  });

  it('falls back to the cap of 2 when CONCIERGE_MAX_ROOMS is not a whole number of at least 1', async () => {
    process.env.CONCIERGE_MAX_ROOMS = '0';
    listRooms.mockResolvedValue([roomOf(OTHER_A), roomOf(OTHER_B)]);
    expect(await (await postId(VISITOR)).json()).toEqual({ error: 'busy', reason: 'site' });
  });

  it('counts a room of another address against this one only by its own bucket', async () => {
    // The unknown bucket's room does not make 203.0.113.9 busy as a visitor.
    listRooms.mockResolvedValue([roomOf(bucketOf('unknown'))]);
    expect((await postId(VISITOR)).status).toBe(200);
    expect(await (await postId(VISITOR, null)).json()).toEqual({ error: 'busy', reason: 'visitor' });
  });
});

describe('POST /api/concierge/token room list unavailable (503)', () => {
  it('fails closed with 503 {offline:true} and drops the error', async () => {
    listRooms.mockRejectedValue(new Error(`boom ${URL_VALUE} ${SECRET_VALUE}`));
    const res = await postId(VISITOR);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ offline: true });
    expect(text).not.toMatch(/boom|livekit/);
  });

  it('decides a bad body (400) before asking for the room list', async () => {
    expect((await postId('not-a-uuid')).status).toBe(400);
    expect(listRooms).not.toHaveBeenCalled();
  });
});

describe('POST /api/concierge/token never shows the address or its bucket', () => {
  const METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

  it.each([
    ['200', [] as { name: string }[]],
    ['429 visitor', [roomOf(BUCKET)]],
    ['429 site', [roomOf(OTHER_A), roomOf(OTHER_B)]],
  ])('keeps them out of the %s body and every console call', async (_label, rooms) => {
    const spies = METHODS.map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
    listRooms.mockResolvedValue(rooms);
    const text = await (await postId(VISITOR)).text();
    expect(text).not.toContain(ADDRESS);
    expect(text).not.toContain(BUCKET);
    // The JWT is base64url: decode it too. The visitor's own bucket is in video.room by design (D70), the address never.
    const { token } = JSON.parse(text) as { token?: string };
    if (token) expect(JSON.stringify(decodePayload(token))).not.toContain(ADDRESS);
    for (const spy of spies) {
      const logged = JSON.stringify(spy.mock.calls);
      expect(logged).not.toContain(ADDRESS);
      expect(logged).not.toContain(BUCKET);
    }
  });

  it('keeps them out of the 503 body and every console call when the list fails', async () => {
    const spies = METHODS.map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
    listRooms.mockRejectedValue(new Error('unavailable'));
    const text = await (await postId(VISITOR)).text();
    expect(text).not.toContain(ADDRESS);
    expect(text).not.toContain(BUCKET);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
