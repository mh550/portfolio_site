import { randomUUID } from 'node:crypto';
import {
  VISITOR_ID_KEY,
  browserStorage,
  getOrCreateVisitorId,
  isUuidV4,
  newUuidV4,
} from '@/lib/concierge/visitorId';

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

type IdStorage = Pick<Storage, 'getItem' | 'setItem'>;

function memoryStorage(initial: Record<string, string> = {}): IdStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => void data.set(key, value)),
  };
}

const STORED = '123e4567-e89b-42d3-a456-426614174000';

describe('newUuidV4', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gives a valid, fresh v4 id', () => {
    const a = newUuidV4();
    const b = newUuidV4();
    expect(isUuidV4(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('uses crypto.randomUUID when it exists', () => {
    const spy = jest.spyOn(globalThis.crypto, 'randomUUID');
    newUuidV4();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to getRandomValues without randomUUID (plain http is not a secure context)', () => {
    const original = globalThis.crypto;
    const getRandomValues = jest.fn(original.getRandomValues.bind(original));
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues },
      configurable: true,
    });
    try {
      const ids = Array.from({ length: 200 }, () => newUuidV4());
      for (const id of ids) {
        expect(isUuidV4(id)).toBe(true);
        expect(id).toBe(id.toLowerCase());
      }
      expect(new Set(ids).size).toBe(ids.length);
      expect(getRandomValues).toHaveBeenCalledTimes(200);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('getOrCreateVisitorId', () => {
  it('stores under concierge.visitor_id', () => {
    expect(VISITOR_ID_KEY).toBe('concierge.visitor_id');
  });

  it('returns the stored v4 id', () => {
    const storage = memoryStorage({ [VISITOR_ID_KEY]: STORED });
    expect(getOrCreateVisitorId(storage)).toBe(STORED);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('creates and stores a new id when none is stored, then returns the same one next time', () => {
    const storage = memoryStorage();
    const first = getOrCreateVisitorId(storage);
    expect(isUuidV4(first)).toBe(true);
    expect(storage.data.get(VISITOR_ID_KEY)).toBe(first);
    expect(getOrCreateVisitorId(storage)).toBe(first);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('persists across two calls on window.localStorage', () => {
    window.localStorage.clear();
    const first = getOrCreateVisitorId(window.localStorage);
    expect(window.localStorage.getItem(VISITOR_ID_KEY)).toBe(first);
    expect(getOrCreateVisitorId(window.localStorage)).toBe(first);
    window.localStorage.clear();
  });

  it('replaces a malformed stored value', () => {
    for (const bad of ['', 'not-a-uuid', '123e4567-e89b-12d3-a456-426614174000', `${STORED} `]) {
      const storage = memoryStorage({ [VISITOR_ID_KEY]: bad });
      const id = getOrCreateVisitorId(storage);
      expect(isUuidV4(id)).toBe(true);
      expect(id).not.toBe(bad);
      expect(storage.data.get(VISITOR_ID_KEY)).toBe(id);
    }
  });

  it('returns a fresh valid id without throwing when getItem throws', () => {
    const storage: IdStorage = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: jest.fn(),
    };
    expect(isUuidV4(getOrCreateVisitorId(storage))).toBe(true);
  });

  it('returns a fresh valid id without throwing when setItem throws', () => {
    const storage: IdStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    const a = getOrCreateVisitorId(storage);
    const b = getOrCreateVisitorId(storage);
    expect(isUuidV4(a)).toBe(true);
    expect(a).not.toBe(b); // nothing was kept, so each visit is new
  });

  it('returns a fresh valid id without storage', () => {
    expect(isUuidV4(getOrCreateVisitorId())).toBe(true);
    expect(isUuidV4(getOrCreateVisitorId(undefined))).toBe(true);
  });
});

describe('browserStorage', () => {
  it('gives window.localStorage when it can be read', () => {
    expect(browserStorage()).toBe(window.localStorage);
  });

  it('gives undefined when reading window.localStorage throws (storage blocked)', () => {
    const spy = jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    try {
      expect(browserStorage()).toBeUndefined();
      expect(isUuidV4(getOrCreateVisitorId(browserStorage()))).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
