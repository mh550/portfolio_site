import { randomUUID } from 'node:crypto';
import { isUuidV4 } from '@/lib/concierge/visitorId';

describe('isUuidV4', () => {
  it('accepts a random v4 id', () => {
    expect(isUuidV4(randomUUID())).toBe(true);
  });

  it('accepts lower- and upper-case v4', () => {
    expect(isUuidV4('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
    expect(isUuidV4('123E4567-E89B-42D3-A456-426614174000')).toBe(true);
  });

  it('accepts every RFC 4122 variant nibble (8, 9, a, b)', () => {
    for (const v of ['8', '9', 'a', 'b']) {
      expect(isUuidV4(`123e4567-e89b-42d3-${v}456-426614174000`)).toBe(true);
    }
  });

  it('rejects other versions (v1, v7)', () => {
    expect(isUuidV4('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    expect(isUuidV4('0192d3a4-5b6c-7d8e-9f01-23456789abcd')).toBe(false);
  });

  it('rejects a bad variant nibble', () => {
    expect(isUuidV4('123e4567-e89b-42d3-c456-426614174000')).toBe(false);
    expect(isUuidV4('123e4567-e89b-42d3-7456-426614174000')).toBe(false);
  });

  it('rejects wrong lengths and shapes', () => {
    expect(isUuidV4('')).toBe(false);
    expect(isUuidV4('not-a-uuid')).toBe(false);
    expect(isUuidV4('123e4567-e89b-42d3-a456-4266141740000')).toBe(false); // 37 chars
    expect(isUuidV4('123e4567-e89b-42d3-a456-42661417400')).toBe(false); // 35 chars
    expect(isUuidV4('123e4567e89b42d3a456426614174000')).toBe(false); // no dashes
    expect(isUuidV4(' 123e4567-e89b-42d3-a456-426614174000')).toBe(false);
    expect(isUuidV4('123e4567-e89b-42d3-a456-426614174000\n')).toBe(false);
  });

  it('rejects non-strings', () => {
    for (const v of [undefined, null, 42, {}, [], true]) {
      expect(isUuidV4(v)).toBe(false);
    }
  });
});
