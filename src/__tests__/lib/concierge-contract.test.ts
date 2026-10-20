import {
  MAX_BODY_BYTES,
  RPC_FORGET_ME,
  TOPIC,
  isForgotten,
  parseMemory,
  parseMetrics,
} from '@/lib/concierge/contract';
import {
  emptyMemory,
  emptyMemoryJson,
  memoryBody,
  memoryJson,
  metricsFull,
  metricsFullJson,
  metricsNulls,
  metricsNullsJson,
} from '../fixtures/concierge';

const withFacts = (facts: unknown) => JSON.stringify({ ...memoryBody, facts });
const withMetric = (patch: Record<string, unknown>) => JSON.stringify({ ...metricsFull, ...patch });
const omit = <T extends object>(obj: T, key: keyof T): Partial<T> => {
  const copy: Partial<T> = { ...obj };
  delete copy[key];
  return copy;
};

describe('contract constants', () => {
  it('names the topics and the RPC as §4 does', () => {
    expect(TOPIC).toEqual({
      memory: 'concierge.memory',
      metrics: 'concierge.metrics',
      transcription: 'lk.transcription',
      chat: 'lk.chat',
    });
    expect(RPC_FORGET_ME).toBe('concierge.forget_me');
    expect(MAX_BODY_BYTES).toBe(15 * 1024);
  });
});

describe('parseMemory', () => {
  it('reads the §4 fixture: 3 facts over voice and text, a null name and a summary', () => {
    const parsed = parseMemory(memoryJson);
    expect(parsed).toEqual(memoryBody);
    expect(parsed?.visitor.name).toBeNull();
    expect(parsed?.facts.map((f) => f.channel)).toEqual(['voice', 'voice', 'text']);
    expect(parsed?.summary).toBe('Asked how the concierge keeps memory off the turn path.');
  });

  it('reads the empty memory sent after Forget me', () => {
    expect(parseMemory(emptyMemoryJson)).toEqual(emptyMemory);
  });

  it('returns null, never throws, on non-JSON', () => {
    for (const text of ['', 'not json', '{', 'null', '42', '"a string"', '[]']) {
      expect(() => parseMemory(text)).not.toThrow();
      expect(parseMemory(text)).toBeNull();
    }
  });

  it('returns null for a body over 15 KiB, counted in UTF-8 bytes', () => {
    const pad = (n: number, ch: string) =>
      JSON.stringify({ ...memoryBody, summary: '' }).replace('"summary":""', `"summary":"${ch.repeat(n)}"`);
    const base = JSON.stringify({ ...memoryBody, summary: '' }).length;
    expect(parseMemory(pad(MAX_BODY_BYTES - base, 'a'))).not.toBeNull(); // exactly 15 KiB
    expect(parseMemory(pad(MAX_BODY_BYTES - base + 1, 'a'))).toBeNull(); // one byte over
    // 'é' is one UTF-16 unit but two UTF-8 bytes: the string is under the limit in length, over it in bytes.
    const twoByte = pad(Math.ceil((MAX_BODY_BYTES - base) / 2) + 1, 'é');
    expect(twoByte.length).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(parseMemory(twoByte)).toBeNull();
  });

  it('counts three-byte characters, surrogate pairs and lone surrogates as UTF-8 does', () => {
    // Spliced in raw: JSON.stringify would escape a lone surrogate as six ASCII characters.
    const body = (summary: string) =>
      JSON.stringify({ ...memoryBody, summary: '' }).replace('"summary":""', `"summary":"${summary}"`);
    const room = MAX_BODY_BYTES - body('').length;
    // '€' is 3 bytes, '🙂' is 4 (two UTF-16 units), a lone surrogate goes out as U+FFFD (3 bytes).
    expect(parseMemory(body('€'.repeat(Math.floor(room / 3))))).not.toBeNull();
    expect(parseMemory(body('€'.repeat(Math.floor(room / 3) + 1)))).toBeNull();
    expect(parseMemory(body('🙂'.repeat(Math.floor(room / 4))))).not.toBeNull();
    expect(parseMemory(body('🙂'.repeat(Math.floor(room / 4) + 1)))).toBeNull();
    const lone = body('\uD83D'.repeat(Math.floor(room / 3) + 1));
    expect(lone.length).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(parseMemory(lone)).toBeNull();
  });

  it('returns null when the facts array is missing or not an array', () => {
    expect(parseMemory(JSON.stringify(omit(memoryBody, 'facts')))).toBeNull();
    expect(parseMemory(withFacts('none'))).toBeNull();
    expect(parseMemory(withFacts(null))).toBeNull();
  });

  it('returns null when a fact has no id or no slot', () => {
    const [first, ...rest] = memoryBody.facts;
    expect(parseMemory(withFacts([omit(first, 'id'), ...rest]))).toBeNull();
    expect(parseMemory(withFacts([omit(first, 'slot'), ...rest]))).toBeNull();
    expect(parseMemory(withFacts([{ ...first, id: '' }, ...rest]))).toBeNull();
    expect(parseMemory(withFacts([{ ...first, slot: 7 }, ...rest]))).toBeNull();
    expect(parseMemory(withFacts(['f-role']))).toBeNull();
  });

  it('returns null when a fact has no string value', () => {
    const [first] = memoryBody.facts;
    expect(parseMemory(withFacts([{ ...first, value: null }]))).toBeNull();
  });

  it('reads an odd optional field as null instead of dropping the body', () => {
    const [first] = memoryBody.facts;
    const parsed = parseMemory(
      JSON.stringify({
        visitor: { name: 3, visits: 'two' },
        facts: [{ id: 'f1', slot: 'role', value: 'x', channel: 5, confidence: 'high' }],
        summary: {},
        updated_at: 12,
        extra: 'ignored',
      }),
    );
    expect(parsed).toEqual({
      visitor: { name: null, visits: 0 },
      facts: [{ id: 'f1', slot: 'role', value: 'x', channel: null, source: null, learned_at: null, confidence: null }],
      summary: null,
      updated_at: null,
    });
    expect(first.channel).toBe('voice'); // the fixture is untouched
  });
});

describe('parseMetrics', () => {
  it('reads a body with every field set', () => {
    expect(parseMetrics(metricsFullJson)).toEqual(metricsFull);
  });

  it('reads a body with every nullable field null', () => {
    expect(parseMetrics(metricsNullsJson)).toEqual(metricsNulls);
  });

  it('reads absent fields as null (preload_ms only comes first, extraction_ms only when one ran)', () => {
    expect(parseMetrics(JSON.stringify({ turn: 3 }))).toEqual({ ...metricsNulls, turn: 3 });
  });

  it('reads a numeric field that is not a finite number as null', () => {
    const parsed = parseMetrics(withMetric({ eou_ms: '210', stt_ms: true, compacted: 'yes' }));
    expect(parsed).toMatchObject({ eou_ms: null, stt_ms: null, compacted: null, total_ms: 830 });
  });

  it('returns null, never throws, on non-JSON', () => {
    for (const text of ['', 'nope', '{"turn":', 'null', '[1]']) {
      expect(() => parseMetrics(text)).not.toThrow();
      expect(parseMetrics(text)).toBeNull();
    }
  });

  it('returns null for a body over 15 KiB', () => {
    const big = withMetric({ note: 'a'.repeat(MAX_BODY_BYTES) });
    expect(parseMetrics(big)).toBeNull();
  });

  it('returns null for a missing or non-integer turn', () => {
    expect(parseMetrics(JSON.stringify(omit(metricsFull, 'turn')))).toBeNull();
    expect(parseMetrics(withMetric({ turn: 1.5 }))).toBeNull();
    expect(parseMetrics(withMetric({ turn: '1' }))).toBeNull();
    expect(parseMetrics(withMetric({ turn: null }))).toBeNull();
  });
});

describe('isForgotten', () => {
  it('is true only for {"ok": true}', () => {
    expect(isForgotten('{"ok": true}')).toBe(true);
    expect(isForgotten('{"ok": true, "erased": 3}')).toBe(true);
  });

  it.each(['{"ok": false}', '{"ok": "true"}', '{}', '[]', 'true', 'null', '', 'not json'])('is false for %p', (reply) => {
    expect(isForgotten(reply)).toBe(false);
  });
});
