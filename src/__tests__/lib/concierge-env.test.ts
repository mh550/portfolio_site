/**
 * @jest-environment node
 */
import { conciergeEnv } from '@/lib/concierge/env';

const URL_VALUE = 'wss://concierge.test.invalid';
const KEY_VALUE = 'k'.repeat(12);
const SECRET_VALUE = 'x'.repeat(32);
const full = { LIVEKIT_URL: URL_VALUE, LIVEKIT_API_KEY: KEY_VALUE, LIVEKIT_API_SECRET: SECRET_VALUE };

describe('conciergeEnv', () => {
  it('returns the three values when all are set and the url is wss://', () => {
    expect(conciergeEnv(full)).toEqual({ url: URL_VALUE, apiKey: KEY_VALUE, apiSecret: SECRET_VALUE });
  });

  it.each(Object.keys(full))('is null without %s', (missing) => {
    expect(conciergeEnv({ ...full, [missing]: undefined })).toBeNull();
  });

  it('is null with an empty value or a url that is not wss://', () => {
    expect(conciergeEnv({ ...full, LIVEKIT_API_SECRET: '' })).toBeNull();
    expect(conciergeEnv({ ...full, LIVEKIT_URL: 'https://concierge.test.invalid' })).toBeNull();
  });

  it('reads process.env by default, at call time', () => {
    const saved = Object.fromEntries(Object.keys(full).map((k) => [k, process.env[k]]));
    try {
      for (const k of Object.keys(full)) delete process.env[k];
      expect(conciergeEnv()).toBeNull();
      Object.assign(process.env, full);
      expect(conciergeEnv()).toEqual({ url: URL_VALUE, apiKey: KEY_VALUE, apiSecret: SECRET_VALUE });
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
