import { LATENCY_FIELDS, cachedShare, median, summarise } from '@/lib/concierge/latency';
import type { MetricsBody } from '@/lib/concierge/contract';
import { metricsFull, metricsNulls } from '../fixtures/concierge';

const turn = (n: number, patch: Partial<MetricsBody>): MetricsBody => ({ ...metricsNulls, turn: n, ...patch });

describe('median', () => {
  it('takes the middle of an odd count and the mean of the two middles of an even one', () => {
    expect(median([120, 80, 200])).toBe(120);
    expect(median([120, 80])).toBe(100);
    expect(median([5])).toBe(5);
  });

  it('ignores nulls, and is null when nothing is left', () => {
    expect(median([null, 120, null, 80, 200])).toBe(120);
    expect(median([null, null])).toBeNull();
    expect(median([])).toBeNull();
  });

  it('does not reorder the array it is given', () => {
    const values = [120, 80, 200];
    median(values);
    expect(values).toEqual([120, 80, 200]);
  });
});

describe('summarise', () => {
  it('covers every numeric field of the metrics body', () => {
    expect([...LATENCY_FIELDS]).toEqual([
      'total_ms',
      'eou_ms',
      'stt_ms',
      'llm_ttft_ms',
      'tts_ttfb_ms',
      'memory_on_turn_path_ms',
      'preload_ms',
      'extraction_ms',
      'prompt_tokens',
      'cached_tokens',
    ]);
    expect(Object.keys(summarise([metricsFull])).sort()).toEqual([...LATENCY_FIELDS].sort());
  });

  it('gives the last value and the running median per field, ignoring nulls', () => {
    const s = summarise([
      turn(1, { total_ms: 120, eou_ms: 10 }),
      turn(2, { total_ms: 80, eou_ms: null }),
      turn(3, { total_ms: 200, eou_ms: 30 }),
    ]);
    expect(s.total_ms).toEqual({ last: 200, median: 120 });
    expect(s.eou_ms).toEqual({ last: 30, median: 20 });
  });

  it('gives an even-count median as the mean of the two middles', () => {
    const s = summarise([turn(1, { total_ms: 120 }), turn(2, { total_ms: 80 })]);
    expect(s.total_ms).toEqual({ last: 80, median: 100 });
  });

  it('keeps a null last value while the median still uses earlier turns', () => {
    const s = summarise([turn(1, { preload_ms: 45 }), turn(2, {})]);
    expect(s.preload_ms).toEqual({ last: null, median: 45 });
  });

  it('is null everywhere for all-null turns and for no turns', () => {
    for (const s of [summarise([metricsNulls, metricsNulls]), summarise([])]) {
      for (const field of LATENCY_FIELDS) expect(s[field]).toEqual({ last: null, median: null });
    }
  });
});

describe('cachedShare', () => {
  it('is cached_tokens / prompt_tokens rounded to 2 decimals', () => {
    expect(cachedShare(metricsFull)).toBe(0.75);
    expect(cachedShare(turn(1, { prompt_tokens: 3, cached_tokens: 1 }))).toBe(0.33);
    expect(cachedShare(turn(1, { prompt_tokens: 3, cached_tokens: 2 }))).toBe(0.67);
    expect(cachedShare(turn(1, { prompt_tokens: 900, cached_tokens: 0 }))).toBe(0);
  });

  it('is null when either count is null or prompt_tokens is 0', () => {
    expect(cachedShare(metricsNulls)).toBeNull();
    expect(cachedShare(turn(1, { prompt_tokens: 1200, cached_tokens: null }))).toBeNull();
    expect(cachedShare(turn(1, { prompt_tokens: null, cached_tokens: 900 }))).toBeNull();
    expect(cachedShare(turn(1, { prompt_tokens: 0, cached_tokens: 0 }))).toBeNull();
  });
});
