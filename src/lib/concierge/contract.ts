// The page's half of the contract with the agent (spec docs/specs/2026-10-19-voice-concierge-page.md §4, and v2 in
// docs/specs/2026-10-21-portfolio-v3.md § 7). The agent sends JSON bodies of at most 15 KiB on its text-stream
// topics (a navigate body at most 1 KiB); the parsers turn one into a typed object or null, and never throw, so a
// bad body from the agent changes nothing on the page. v2 only adds optional fields: a v1 body parses as before.

export const TOPIC = {
  memory: 'concierge.memory',
  metrics: 'concierge.metrics',
  navigate: 'concierge.navigate',
  transcription: 'lk.transcription',
  chat: 'lk.chat',
} as const;
export const RPC_FORGET_ME = 'concierge.forget_me';
// v2: returns the memory body (parse it with parseMemory). Defined, not called in P3 (D95).
export const RPC_GET_MEMORY = 'concierge.get_memory';
export const MAX_BODY_BYTES = 15 * 1024;
export const MAX_NAVIGATE_BYTES = 1024;

export interface MemoryFact {
  id: string;
  slot: string;
  value: string;
  channel: string | null;
  source: string | null;
  learned_at: string | null;
  confidence: number | null;
}

export interface Episode {
  visit: number;
  started_at: string | null;
  // null on the visit in progress
  ended_at: string | null;
  summary: string | null;
}

// The seven event types § 7 names. An agent may send another one: the parser keeps it as its string.
export const MEMORY_EVENT_TYPES = [
  'fact_added',
  'fact_invalidated',
  'fact_deleted',
  'gate_rejected',
  'extraction_ran',
  'remember',
  'forget',
] as const;
export type MemoryEventType = (typeof MEMORY_EVENT_TYPES)[number];

export interface MemoryEvent {
  ts: string | null;
  type: string;
  detail: string;
}

// A list that isn't an array reads as null: "not reported", which the page tells apart from an empty list.
export interface AboutVisitor {
  profile: MemoryFact[] | null;
  episodes: Episode[] | null;
  events: MemoryEvent[] | null;
}

export interface AboutAgent {
  knowledge: { words: number | null; est_tokens: number | null; sources_commit: string | null; sections: string[] } | null;
  instructions_est_tokens: number | null;
  memory_block_chars: number | null;
  working: { items: number | null; est_tokens: number | null; compacted: boolean | null; compactions: number | null } | null;
  cache: { cached_share: number | null } | null;
}

// The v2 keys are absent on a v1 body's result, and all four present (each null when absent or malformed) once
// the body carries any of them.
export interface MemoryBody {
  visitor: { name: string | null; visits: number };
  facts: MemoryFact[];
  summary: string | null;
  updated_at: string | null;
  v?: number | null;
  about_visitor?: AboutVisitor | null;
  about_agent?: AboutAgent | null;
  retention_days?: number | null;
}

export interface NavigateBody {
  href: string;
  reason: string | null;
  at: string | null;
}

export interface MetricsBody {
  turn: number;
  eou_ms: number | null;
  stt_ms: number | null;
  llm_ttft_ms: number | null;
  tts_ttfb_ms: number | null;
  total_ms: number | null;
  memory_on_turn_path_ms: number | null;
  preload_ms: number | null;
  extraction_ms: number | null;
  prompt_tokens: number | null;
  cached_tokens: number | null;
  compacted: boolean | null;
}

type Json = Record<string, unknown>;

// UTF-8 length without TextEncoder (jsdom has none): < 0x80 one byte, < 0x800 two, a surrogate pair four, the
// rest three (a lone surrogate is sent as U+FFFD, also three).
function utf8Bytes(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

function parseObject(text: string, maxBytes = MAX_BODY_BYTES): Json | null {
  if (text.length > maxBytes || utf8Bytes(text) > maxBytes) return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  return isObject(value) ? value : null;
}

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v !== '';
const int = (v: unknown): number | null => (Number.isInteger(v) ? (v as number) : null);
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);

// A fact without an id, a slot or a value means the body is not what §4 says, so the whole body is rejected.
// The optional fields read as null when odd: one strange field should not hide what the agent remembers.
function parseFact(v: unknown): MemoryFact | null {
  if (!isObject(v) || !nonEmpty(v.id) || !nonEmpty(v.slot) || typeof v.value !== 'string') return null;
  return {
    id: v.id,
    slot: v.slot,
    value: v.value,
    channel: str(v.channel),
    source: str(v.source),
    learned_at: str(v.learned_at),
    confidence: num(v.confidence),
  };
}

// A v2 list keeps its good entries, up to `max`, and drops a bad one on its own: unlike v1's facts, one odd entry
// never rejects the body. Not an array: null.
function parseList<T>(v: unknown, parse: (raw: unknown) => T | null, max = Infinity): T[] | null {
  if (!Array.isArray(v)) return null;
  const out: T[] = [];
  for (const raw of v) {
    if (out.length >= max) break;
    const item = parse(raw);
    if (item) out.push(item);
  }
  return out;
}

function parseEpisode(v: unknown): Episode | null {
  if (!isObject(v) || int(v.visit) === null) return null;
  return { visit: v.visit as number, started_at: str(v.started_at), ended_at: str(v.ended_at), summary: str(v.summary) };
}

function parseEvent(v: unknown): MemoryEvent | null {
  if (!isObject(v) || typeof v.type !== 'string' || typeof v.detail !== 'string') return null;
  return { ts: str(v.ts), type: v.type, detail: v.detail };
}

function parseAboutVisitor(v: unknown): AboutVisitor | null {
  if (!isObject(v)) return null;
  return {
    profile: parseList(v.profile, parseFact),
    episodes: parseList(v.episodes, parseEpisode, 5),
    events: parseList(v.events, parseEvent, 12),
  };
}

function parseAboutAgent(v: unknown): AboutAgent | null {
  if (!isObject(v)) return null;
  const { knowledge: k, working: w, cache: c } = v;
  const share = isObject(c) ? num(c.cached_share) : null;
  return {
    knowledge: isObject(k)
      ? {
          words: num(k.words),
          est_tokens: num(k.est_tokens),
          sources_commit: str(k.sources_commit),
          sections: Array.isArray(k.sections) ? k.sections.filter((s): s is string => typeof s === 'string') : [],
        }
      : null,
    instructions_est_tokens: num(v.instructions_est_tokens),
    memory_block_chars: num(v.memory_block_chars),
    working: isObject(w)
      ? { items: num(w.items), est_tokens: num(w.est_tokens), compacted: bool(w.compacted), compactions: num(w.compactions) }
      : null,
    cache: isObject(c) ? { cached_share: share !== null && share >= 0 && share <= 1 ? share : null } : null,
  };
}

// A v below 2 alone (a v1 agent that stamps "v": 1) doesn't make a body v2.
const V2_ONLY_KEYS = ['about_visitor', 'about_agent', 'retention_days'] as const;

export function parseMemory(text: string): MemoryBody | null {
  const body = parseObject(text);
  if (!body || !Array.isArray(body.facts)) return null;
  const facts: MemoryFact[] = [];
  for (const raw of body.facts) {
    const fact = parseFact(raw);
    if (!fact) return null;
    facts.push(fact);
  }
  const visitor = isObject(body.visitor) ? body.visitor : {};
  const visits = num(visitor.visits);
  const v1: MemoryBody = {
    visitor: { name: str(visitor.name), visits: visits !== null && Number.isInteger(visits) ? visits : 0 },
    facts,
    summary: str(body.summary),
    updated_at: str(body.updated_at),
  };
  const v = int(body.v);
  const isV2 = (v !== null && v >= 2) || V2_ONLY_KEYS.some((key) => key in body);
  if (!isV2) return v1;
  const retention = int(body.retention_days);
  return {
    ...v1,
    v: v !== null && v >= 2 ? v : null,
    about_visitor: parseAboutVisitor(body.about_visitor),
    about_agent: parseAboutAgent(body.about_agent),
    retention_days: retention !== null && retention > 0 ? retention : null,
  };
}

// §4: any field may be null if the agent framework doesn't report it; only the turn number is required.
export function parseMetrics(text: string): MetricsBody | null {
  const body = parseObject(text);
  if (!body || !Number.isInteger(body.turn)) return null;
  return {
    turn: body.turn as number,
    eou_ms: num(body.eou_ms),
    stt_ms: num(body.stt_ms),
    llm_ttft_ms: num(body.llm_ttft_ms),
    tts_ttfb_ms: num(body.tts_ttfb_ms),
    total_ms: num(body.total_ms),
    memory_on_turn_path_ms: num(body.memory_on_turn_path_ms),
    preload_ms: num(body.preload_ms),
    extraction_ms: num(body.extraction_ms),
    prompt_tokens: num(body.prompt_tokens),
    cached_tokens: num(body.cached_tokens),
    compacted: typeof body.compacted === 'boolean' ? body.compacted : null,
  };
}

// The concierge.forget_me reply: only exactly {"ok": true} means the agent erased the thread (§4).
export function isForgotten(reply: string): boolean {
  return parseObject(reply)?.ok === true;
}

// concierge.navigate (v2, § 7): where the agent's show_page tool wants to take the visitor. Whether the page
// follows it is isAllowedHref's call (and Guide me's, and the 8 s rule's), not the parser's.
export function parseNavigate(text: string): NavigateBody | null {
  const body = parseObject(text, MAX_NAVIGATE_BYTES);
  if (!body || !nonEmpty(body.href)) return null;
  return { href: body.href, reason: str(body.reason), at: str(body.at) };
}

const USHER_PAGES: readonly string[] = ['/', '/about', '/skills', '/experience', '/contact'];
const PROJECT_PREFIX = '/projects/';

// The usher's allowlist (D94): exactly one of the five pages, or a known project's deep-dive. An exact string
// match, no decoding or normalising, so nothing with a query, a hash, a trailing slash or another origin passes.
export function isAllowedHref(href: string, slugs: readonly string[]): boolean {
  if (USHER_PAGES.includes(href)) return true;
  return href.startsWith(PROJECT_PREFIX) && slugs.includes(href.slice(PROJECT_PREFIX.length));
}
