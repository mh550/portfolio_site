/** @jest-environment node */
// Spies on the real SDK, kept out of concierge-token-route.test.ts so that file mocks nothing (D42).
import { AccessToken } from 'livekit-server-sdk';
import { POST } from '@/app/api/concierge/token/route';

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
const SECRET_VALUE = 'x'.repeat(32);
const VISITOR = '123e4567-e89b-42d3-a456-426614174000';

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
  process.env.LIVEKIT_API_KEY = 'k'.repeat(12);
  process.env.LIVEKIT_API_SECRET = SECRET_VALUE;
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const postId = (visitor_id: unknown) =>
  POST(
    new Request('http://localhost/api/concierge/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitor_id }),
    }),
  );

it.each([
  ['a 37-character id', `${VISITOR}0`],
  ['a 10 000-character id', 'a'.repeat(10_000)],
  ['a UUID v1', '123e4567-e89b-12d3-a456-426614174000'],
])('rejects %s before any SDK call', async (_label, id) => {
  const addGrant = jest.spyOn(AccessToken.prototype, 'addGrant');
  const toJwt = jest.spyOn(AccessToken.prototype, 'toJwt');
  expect((await postId(id)).status).toBe(400);
  expect(addGrant).not.toHaveBeenCalled();
  expect(toJwt).not.toHaveBeenCalled();
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
