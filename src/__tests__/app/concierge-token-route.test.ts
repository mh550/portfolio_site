/** @jest-environment node */
// Mocks nothing (D42). The 200 cases live in concierge-token-route-limits.test.ts, which mocks the room list (D69):
// with the env set a 200 needs listRooms, which here would go to the network. Nothing in this file gets that far.
import { POST, runtime, dynamic } from '@/app/api/concierge/token/route';

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
const URL_VALUE = 'wss://example.livekit.cloud';
const KEY_VALUE = 'k'.repeat(12);
const SECRET_VALUE = 'x'.repeat(32);
const VISITOR = '123e4567-e89b-42d3-a456-426614174000';
const SITE_ORIGIN = 'https://michael-herron.vercel.app';

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function setEnv() {
  process.env.LIVEKIT_URL = URL_VALUE;
  process.env.LIVEKIT_API_KEY = KEY_VALUE;
  process.env.LIVEKIT_API_SECRET = SECRET_VALUE;
}

// `origin: null` sends no Origin header at all.
function post(body?: string, origin: string | null = SITE_ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin !== null) headers.origin = origin;
  return POST(new Request('http://localhost/api/concierge/token', { method: 'POST', headers, body }));
}

const postId = (visitor_id: unknown, origin?: string | null) => post(JSON.stringify({ visitor_id }), origin);

describe('/api/concierge/token route config', () => {
  it('runs on Node and is never cached', () => {
    expect(runtime).toBe('nodejs');
    expect(dynamic).toBe('force-dynamic');
  });
});

describe('POST /api/concierge/token foreign origins (403)', () => {
  it('answers 403 {error:forbidden} with no Origin, before the env check (no env set, D63)', async () => {
    const res = await postId(VISITOR, null);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 403 for another website with the env set', async () => {
    setEnv();
    const res = await postId(VISITOR, 'https://evil.example');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 403 before reading the body', async () => {
    setEnv();
    expect((await post('not json', 'https://evil.example')).status).toBe(403);
  });

  it('lets a localhost origin through in development (NODE_ENV test): no env, so 503', async () => {
    const res = await postId(VISITOR, 'http://localhost:7834');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ offline: true });
  });

  it('refuses a localhost origin in production (NODE_ENV read per request)', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
    const res = await postId(VISITOR, 'http://localhost:7834');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });

  it('still lets the site origin through in production', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
    expect((await postId(VISITOR)).status).toBe(503);
  });
});

describe('POST /api/concierge/token offline (503)', () => {
  it('answers 503 {offline:true} with none of the three env vars', async () => {
    const res = await postId(VISITOR);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ offline: true });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it.each(ENV_KEYS)('answers 503 when only %s is missing', async (missing) => {
    setEnv();
    delete process.env[missing];
    const res = await postId(VISITOR);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ offline: true });
  });

  it('answers 503 when a var is empty', async () => {
    setEnv();
    process.env.LIVEKIT_API_SECRET = '';
    expect((await postId(VISITOR)).status).toBe(503);
  });

  it('answers 503 when LIVEKIT_URL is not wss://', async () => {
    setEnv();
    process.env.LIVEKIT_URL = 'https://example.livekit.cloud';
    const res = await postId(VISITOR);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ offline: true });
  });

  it('answers 503 before reading the body (offline is the same for every request)', async () => {
    expect((await post('not json')).status).toBe(503);
  });
});

describe('POST /api/concierge/token bad requests (400)', () => {
  beforeEach(setEnv);

  const cases: [string, string | undefined][] = [
    ['not-a-uuid', JSON.stringify({ visitor_id: 'not-a-uuid' })],
    ['a UUID v1', JSON.stringify({ visitor_id: '123e4567-e89b-12d3-a456-426614174000' })],
    ['a 37-character string', JSON.stringify({ visitor_id: `${VISITOR}0` })],
    ['a bad variant', JSON.stringify({ visitor_id: '123e4567-e89b-42d3-c456-426614174000' })],
    ['a number', JSON.stringify({ visitor_id: 42 })],
    ['an empty object', '{}'],
    ['a JSON array', '[]'],
    ['JSON null', 'null'],
    ['a missing body', undefined],
    ['a non-JSON body', 'visitor_id=123'],
  ];

  it.each(cases)('answers 400 with a JSON error and no token on %s', async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'bad_request' });
    expect(json).not.toHaveProperty('token');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
