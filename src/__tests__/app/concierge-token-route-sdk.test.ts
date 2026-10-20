/** @jest-environment node */
// Spies on the real SDK, kept out of concierge-token-route.test.ts so that file mocks nothing (D42). The room list
// is mocked with a factory, as in concierge-token-route-limits.test.ts.
import { AccessToken } from 'livekit-server-sdk';
import { POST } from '@/app/api/concierge/token/route';
import { listLiveRooms } from '@/lib/concierge/rooms';

jest.mock('@/lib/concierge/rooms', () => ({ listLiveRooms: jest.fn() }));

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
const SECRET_VALUE = 'x'.repeat(32);
const VISITOR = '123e4567-e89b-42d3-a456-426614174000';

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
  process.env.LIVEKIT_API_KEY = 'k'.repeat(12);
  process.env.LIVEKIT_API_SECRET = SECRET_VALUE;
  jest.mocked(listLiveRooms).mockReset();
  jest.mocked(listLiveRooms).mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const postId = (visitor_id: unknown, origin = 'https://michael-herron.vercel.app') =>
  POST(
    new Request('http://localhost/api/concierge/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ visitor_id }),
    }),
  );

function sdkSpies() {
  return [
    jest.spyOn(AccessToken.prototype, 'addGrant'),
    jest.spyOn(AccessToken.prototype, 'toJwt'),
  ];
}

it.each([
  ['a 37-character id', `${VISITOR}0`],
  ['a 10 000-character id', 'a'.repeat(10_000)],
  ['a UUID v1', '123e4567-e89b-12d3-a456-426614174000'],
])('rejects %s before any SDK or room-list call', async (_label, id) => {
  const spies = sdkSpies();
  expect((await postId(id)).status).toBe(400);
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  expect(listLiveRooms).not.toHaveBeenCalled();
});

it.each([
  ['another website', 'https://evil.example'],
  ['the site over http', 'http://michael-herron.vercel.app'],
  ['a sandboxed frame', 'null'],
])('answers 403 for %s before any SDK or room-list call', async (_label, origin) => {
  const spies = sdkSpies();
  expect((await postId(VISITOR, origin)).status).toBe(403);
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  expect(listLiveRooms).not.toHaveBeenCalled();
});

it('reaches the room list and the SDK for a good request (the spies can see the calls)', async () => {
  const spies = sdkSpies();
  expect((await postId(VISITOR)).status).toBe(200);
  for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  expect(listLiveRooms).toHaveBeenCalledTimes(1);
});

it('answers 500 {error:token_failed} with no detail when signing throws', async () => {
  jest
    .spyOn(AccessToken.prototype, 'toJwt')
    .mockRejectedValueOnce(new Error(`boom LIVEKIT_API_SECRET=${SECRET_VALUE}`));
  const res = await postId(VISITOR);
  expect(res.status).toBe(500);
  expect(res.headers.get('cache-control')).toBe('no-store');
  const text = await res.text();
  expect(JSON.parse(text)).toEqual({ error: 'token_failed' });
  expect(text).not.toMatch(/boom|LIVEKIT|stack/);
  expect(text).not.toContain(SECRET_VALUE);
});
