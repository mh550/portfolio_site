// A visitor id is a UUID v4: version nibble 4, RFC 4122 variant (8, 9, a or b), either case.
// The token route and the /talk client both use this, so they agree on what an id is.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(s: unknown): s is string {
  return typeof s === 'string' && UUID_V4.test(s);
}

export const VISITOR_ID_KEY = 'concierge.visitor_id';

// crypto.randomUUID exists only in secure contexts (https, localhost), so a page served over plain http
// gets the getRandomValues fallback: 16 random bytes with the version and variant bits set per RFC 4122.
export function newUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// The visitor id is this browser's: kept in localStorage so the concierge knows a returning visitor. Storage that
// is missing or throws (private mode, blocked cookies, a full quota) never breaks the page: each visit is new.
export function getOrCreateVisitorId(storage?: Pick<Storage, 'getItem' | 'setItem'>): string {
  try {
    const stored = storage?.getItem(VISITOR_ID_KEY);
    if (isUuidV4(stored)) return stored;
  } catch {
    // fall through to a fresh id
  }
  const id = newUuidV4();
  try {
    storage?.setItem(VISITOR_ID_KEY, id);
  } catch {
    // not kept: the next visit starts fresh
  }
  return id;
}

// The stored id, lower-cased, or null; never writes. For reading what belongs to this browser's id (the memory
// cache) before Connect without making one: D45's "no id stored before Connect" holds.
export function readVisitorId(storage?: Pick<Storage, 'getItem'>): string | null {
  try {
    const stored = storage?.getItem(VISITOR_ID_KEY);
    return isUuidV4(stored) ? stored.toLowerCase() : null;
  } catch {
    return null;
  }
}

// Reading window.localStorage itself throws (SecurityError) when the browser blocks site storage, before
// getOrCreateVisitorId's own try/catch could help, so callers pass browserStorage() instead.
export function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
