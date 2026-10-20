import type { MetricsBody } from './contract';

// The turn-path steps, in the order the latency panel lists them.
export const TURN_PATH_FIELDS = [
  'total_ms',
  'eou_ms',
  'stt_ms',
  'llm_ttft_ms',
  'tts_ttfb_ms',
  'memory_on_turn_path_ms',
] as const;
// Every field the panel shows as last and median: the turn path, then background extraction. The preload is shown
// once and the token counts only as cachedShare, so neither is summarised.
export const LATENCY_FIELDS = [...TURN_PATH_FIELDS, 'extraction_ms'] as const;

export type LatencyField = (typeof LATENCY_FIELDS)[number];
export type LatencySummary = Record<LatencyField, { last: number | null; median: number | null }>;

// Ignores nulls; an even count gives the mean of the two middle values; nothing left gives null.
export function median(values: readonly (number | null)[]): number | null {
  const sorted = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Per field: the newest turn's value (null if that turn didn't report it) and the median over every turn so far.
export function summarise(turns: readonly MetricsBody[]): LatencySummary {
  const last = turns.at(-1);
  return Object.fromEntries(
    LATENCY_FIELDS.map((field) => [
      field,
      { last: last ? last[field] : null, median: median(turns.map((t) => t[field])) },
    ]),
  ) as LatencySummary;
}

// The share of the prompt served from the model's cache, rounded to 2 decimals.
export function cachedShare(turn: MetricsBody): number | null {
  const { prompt_tokens: prompt, cached_tokens: cached } = turn;
  if (prompt === null || cached === null || prompt === 0) return null;
  return Math.round((cached / prompt) * 100) / 100;
}
