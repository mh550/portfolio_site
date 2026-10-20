/** @jest-environment node */
import { TokenVerifier } from 'livekit-server-sdk';
import { POST, runtime, dynamic } from '@/app/api/concierge/token/route';

const ENV_KEYS = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
const URL_VALUE = 'wss://example.livekit.cloud';
const KEY_VALUE = 'k'.repeat(12);
const SECRET_VALUE = 'x'.repeat(32);
const VISITOR = '123e4567-e89b-42d3-a456-426614174000';

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
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

function post(body?: string) {
  return POST(
    new Request('http://localhost/api/concierge/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  );
}

const postId = (visitor_id: unknown) => post(JSON.stringify({ visitor_id }));

function decodePayload(jwt: string) {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
}

describe('/api/concierge/token route config', () => {
  it('runs on Node and is never cached', () => {
    expect(runtime).toBe('nodejs');
    expect(dynamic).toBe('force-dynamic');
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

describe('POST /api/concierge/token success (200)', () => {
  beforeEach(setEnv);

  it('returns exactly {url, token} with url = LIVEKIT_URL', async () => {
    const res = await postId(VISITOR);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const json = await res.json();
    expect(Object.keys(json).sort()).toEqual(['token', 'url']);
    expect(json.url).toBe(URL_VALUE);
    expect(typeof json.token).toBe('string');
  });

  it('signs a token whose claims carry the identity, room, grants and agent dispatch', async () => {
    const { token } = await (await postId(VISITOR)).json();
    const p = decodePayload(token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(p.video.room).toMatch(/^concierge-[0-9a-f]{12}$/);
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
    const { token } = await (await postId(VISITOR.toUpperCase())).json();
    const p = decodePayload(token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(JSON.parse(p.roomConfig.agents[0].metadata).visitor_id).toBe(VISITOR);
  });

  it('ignores every body field but visitor_id', async () => {
    const res = await post(
      JSON.stringify({ visitor_id: VISITOR, identity: 'admin', room: 'evil', ttl: 99999, agentName: 'other' }),
    );
    const p = decodePayload((await res.json()).token);
    expect(p.sub).toBe(`visitor-${VISITOR}`);
    expect(p.video.room).toMatch(/^concierge-[0-9a-f]{12}$/);
    expect(p.exp - p.nbf).toBeLessThanOrEqual(600);
    expect(p.roomConfig.agents[0].agentName).toBe('concierge');
  });

  it('is really signed with the env secret', async () => {
    const { token } = await (await postId(VISITOR)).json();
    const claims = await new TokenVerifier(KEY_VALUE, SECRET_VALUE).verify(token);
    expect(claims.sub).toBe(`visitor-${VISITOR}`);
    await expect(new TokenVerifier(KEY_VALUE, 'y'.repeat(32)).verify(token)).rejects.toThrow();
  });

  it('gives each call its own room', async () => {
    const a = decodePayload((await (await postId(VISITOR)).json()).token);
    const b = decodePayload((await (await postId(VISITOR)).json()).token);
    expect(a.video.room).not.toBe(b.video.room);
  });

  it('contains neither the key nor the secret in the response text', async () => {
    const text = await (await postId(VISITOR)).text();
    expect(text).not.toContain(KEY_VALUE);
    expect(text).not.toContain(SECRET_VALUE);
  });
});
