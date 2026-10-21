import { parseMemory } from '@/lib/concierge/contract';
import {
  clearMemory,
  loadMemory,
  memoryCacheKey,
  memoryExpired,
  saveMemory,
  type MemoryStorage,
} from '@/lib/concierge/memoryCache';
import { memoryBody, memoryJson, memoryV2, memoryV2Json } from '../fixtures/concierge';

// The memory cache (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Cache, D91): the last concierge.memory
// body per visitor id, kept as its raw text and re-parsed on load.

function memoryStorage(initial: Record<string, string> = {}): MemoryStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: jest.fn((key: string) => void data.delete(key)),
  };
}

const ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER = '9b2f4c1e-7a3d-4e5f-8a6b-1c2d3e4f5a6b';
const AT = '2026-10-21T10:00:00.000Z';

describe('memoryCacheKey', () => {
  it('is concierge.memory.<visitor_id>, the id lower-cased', () => {
    expect(memoryCacheKey(ID)).toBe(`concierge.memory.${ID}`);
    expect(memoryCacheKey(ID.toUpperCase())).toBe(`concierge.memory.${ID}`);
  });
});

describe('saveMemory and loadMemory', () => {
  it('round-trips a v1 body through parseMemory', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    expect(loadMemory(storage, ID)).toEqual({ body: parseMemory(memoryJson), savedAt: AT });
    expect(loadMemory(storage, ID)?.body).toEqual(memoryBody);
  });

  it('round-trips a v2 body through parseMemory', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryV2Json, AT);
    expect(loadMemory(storage, ID)).toEqual({ body: memoryV2, savedAt: AT });
  });

  it('stores { v: 1, savedAt, body: <the raw text> } under the key', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    expect(JSON.parse(storage.data.get(memoryCacheKey(ID))!)).toEqual({ v: 1, savedAt: AT, body: memoryJson });
  });

  it('keeps one body per visitor id: the last one saved', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    saveMemory(storage, ID, memoryV2Json, '2026-10-21T10:05:00.000Z');
    expect(storage.data.size).toBe(1);
    expect(loadMemory(storage, ID)).toEqual({ body: memoryV2, savedAt: '2026-10-21T10:05:00.000Z' });
  });

  it('finds the body whatever the case of the id', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID.toUpperCase(), memoryJson, AT);
    expect(loadMemory(storage, ID)?.body).toEqual(memoryBody);
  });

  it('loads null for a different visitor id', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    expect(loadMemory(storage, OTHER)).toBeNull();
  });

  it('loads null when nothing is stored, or without storage', () => {
    expect(loadMemory(memoryStorage(), ID)).toBeNull();
    expect(loadMemory(undefined, ID)).toBeNull();
  });

  it.each([
    ['corrupt JSON', '{"v":1,'],
    ['not an object', '"hello"'],
    ['null', 'null'],
    ['a wrong cache format', JSON.stringify({ v: 2, savedAt: AT, body: memoryJson })],
    ['no cache format', JSON.stringify({ savedAt: AT, body: memoryJson })],
    ['a body that is not a string', JSON.stringify({ v: 1, savedAt: AT, body: memoryBody })],
    ['a savedAt that is not a string', JSON.stringify({ v: 1, savedAt: 5, body: memoryJson })],
    ['a body parseMemory rejects', JSON.stringify({ v: 1, savedAt: AT, body: '{"facts":"none"}' })],
  ])('loads null for %s', (_, stored) => {
    expect(loadMemory(memoryStorage({ [memoryCacheKey(ID)]: stored }), ID)).toBeNull();
  });

  it('never replaces a cached body with one parseMemory rejects', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    saveMemory(storage, ID, '{"facts":"none"}', '2026-10-21T10:05:00.000Z');
    saveMemory(storage, ID, 'not json', '2026-10-21T10:06:00.000Z');
    expect(loadMemory(storage, ID)).toEqual({ body: memoryBody, savedAt: AT });
  });

  it('touches nothing for an id that is not a UUID v4', () => {
    const storage = memoryStorage();
    saveMemory(storage, 'not-an-id', memoryJson, AT);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(loadMemory(storage, 'not-an-id')).toBeNull();
    expect(storage.getItem).not.toHaveBeenCalled();
    clearMemory(storage, 'not-an-id');
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});

describe('clearMemory', () => {
  it('removes this visitor id’s body and no other', () => {
    const storage = memoryStorage();
    saveMemory(storage, ID, memoryJson, AT);
    saveMemory(storage, OTHER, memoryV2Json, AT);
    clearMemory(storage, ID);
    expect(loadMemory(storage, ID)).toBeNull();
    expect(loadMemory(storage, OTHER)?.body).toEqual(memoryV2);
  });

  it('does nothing without storage', () => {
    expect(() => clearMemory(undefined, ID)).not.toThrow();
  });
});

describe('a storage whose methods throw', () => {
  const throwing: MemoryStorage = {
    getItem: () => {
      throw new DOMException('denied', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('full', 'QuotaExceededError');
    },
    removeItem: () => {
      throw new DOMException('denied', 'SecurityError');
    },
  };

  it('never throws out of save, load or clear', () => {
    expect(() => saveMemory(throwing, ID, memoryJson, AT)).not.toThrow();
    expect(() => loadMemory(throwing, ID)).not.toThrow();
    expect(loadMemory(throwing, ID)).toBeNull();
    expect(() => clearMemory(throwing, ID)).not.toThrow();
  });
});

describe('on window.localStorage', () => {
  it('saves, loads and clears', () => {
    window.localStorage.clear();
    saveMemory(window.localStorage, ID, memoryJson, AT);
    expect(loadMemory(window.localStorage, ID)?.body).toEqual(memoryBody);
    clearMemory(window.localStorage, ID);
    expect(window.localStorage.length).toBe(0);
  });
});

// P3-07 review (D96): the browser's copy lives no longer than the server's: retention_days after it was saved (30 for a
// v1 body, which doesn't say), and an unreadable time counts as expired.
describe('memoryExpired', () => {
  const DAY = 86_400_000;
  const saved = Date.parse(AT);
  const v1 = { body: parseMemory(memoryJson)!, savedAt: AT };
  const v2 = (days: number | null) => ({ body: { ...memoryV2, retention_days: days }, savedAt: AT });

  it('a v1 body keeps 30 days', () => {
    expect(memoryExpired(v1, saved + 30 * DAY)).toBe(false);
    expect(memoryExpired(v1, saved + 30 * DAY + 1)).toBe(true);
  });

  it("a v2 body keeps its own retention_days", () => {
    expect(memoryExpired(v2(7), saved + 7 * DAY)).toBe(false);
    expect(memoryExpired(v2(7), saved + 7 * DAY + 1)).toBe(true);
    expect(memoryExpired(v2(null), saved + 30 * DAY + 1)).toBe(true);
  });

  it('an unreadable savedAt is expired; a savedAt in the future is not', () => {
    expect(memoryExpired({ ...v1, savedAt: 'not a date' }, saved)).toBe(true);
    expect(memoryExpired(v1, saved - DAY)).toBe(false);
  });
});
