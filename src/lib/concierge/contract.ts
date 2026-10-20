// The page's half of the contract with the agent (spec docs/specs/2026-10-19-voice-concierge-page.md §4).
// The agent sends JSON bodies of at most 15 KiB on two text-stream topics; the parsers turn one into a typed
// object or null, and never throw, so a bad body from the agent changes nothing on the page.

export const TOPIC = {
  memory: 'concierge.memory',
  metrics: 'concierge.metrics',
  transcription: 'lk.transcription',
  chat: 'lk.chat',
} as const;
export const RPC_FORGET_ME = 'concierge.forget_me';
export const MAX_BODY_BYTES = 15 * 1024;

export interface MemoryFact {
  id: string;
  slot: string;
  value: string;
  channel: string | null;
  source: string | null;
  learned_at: string | null;
  confidence: number | null;
}

export interface MemoryBody {
  visitor: { name: string | null; visits: number };
  facts: MemoryFact[];
  summary: string | null;
  updated_at: string | null;
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

function parseObject(text: string): Json | null {
  if (text.length > MAX_BODY_BYTES || utf8Bytes(text) > MAX_BODY_BYTES) return null;
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
  return {
    visitor: { name: str(visitor.name), visits: visits !== null && Number.isInteger(visits) ? visits : 0 },
    facts,
    summary: str(body.summary),
    updated_at: str(body.updated_at),
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
