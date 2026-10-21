import { parseMemory, type MemoryBody } from './contract';
import { isUuidV4 } from './visitorId';

// The last concierge.memory body per visitor id, so the Memory tab has something to show before a call (plan
// docs/plans/2026-10-21-P3-concierge-in-site.md § Cache, D91). The raw text the agent sent is stored, not the parsed
// object, and re-parsed on load, so an old cache can never hand the page a shape parseMemory wouldn't produce.
// Every storage call is in try/catch: a storage that is missing or throws (private mode, a full quota) just
// doesn't cache.

export type MemoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface CachedMemory {
  body: MemoryBody;
  savedAt: string;
}

// The format of the stored value, not the contract version of the body inside it.
const CACHE_FORMAT = 1;

// The id is lower-cased: isUuidV4 accepts either case, and the token route lower-cases it too (D43).
export function memoryCacheKey(visitorId: string): string {
  return `concierge.memory.${visitorId.toLowerCase()}`;
}

// A body parseMemory rejects is not saved, so it can never replace a good one.
export function saveMemory(storage: MemoryStorage | undefined, visitorId: string, bodyText: string, savedAt: string): void {
  if (!isUuidV4(visitorId) || !parseMemory(bodyText)) return;
  try {
    storage?.setItem(memoryCacheKey(visitorId), JSON.stringify({ v: CACHE_FORMAT, savedAt, body: bodyText }));
  } catch {
    // not cached
  }
}

export function loadMemory(storage: MemoryStorage | undefined, visitorId: string): CachedMemory | null {
  if (!isUuidV4(visitorId)) return null;
  let stored: unknown;
  try {
    const text = storage?.getItem(memoryCacheKey(visitorId));
    if (typeof text !== 'string') return null;
    stored = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof stored !== 'object' || stored === null) return null;
  const { v, savedAt, body } = stored as Record<string, unknown>;
  if (v !== CACHE_FORMAT || typeof savedAt !== 'string' || typeof body !== 'string') return null;
  const parsed = parseMemory(body);
  return parsed ? { body: parsed, savedAt } : null;
}

// The server deletes a visitor's memory retention_days after their last visit (30 when a v1 body doesn't say); the
// browser's copy goes no later (D96). An unreadable time counts as expired.
const DEFAULT_RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;

export function memoryExpired({ body, savedAt }: CachedMemory, now: number): boolean {
  const saved = Date.parse(savedAt);
  if (Number.isNaN(saved)) return true;
  return now - saved > (body.retention_days ?? DEFAULT_RETENTION_DAYS) * DAY_MS;
}

export function clearMemory(storage: MemoryStorage | undefined, visitorId: string): void {
  if (!isUuidV4(visitorId)) return;
  try {
    storage?.removeItem(memoryCacheKey(visitorId));
  } catch {
    // nothing to clear we can reach
  }
}
