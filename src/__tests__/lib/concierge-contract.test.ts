import {
  MAX_BODY_BYTES,
  MAX_NAVIGATE_BYTES,
  MEMORY_EVENT_TYPES,
  RPC_FORGET_ME,
  RPC_GET_MEMORY,
  TOPIC,
  isAllowedHref,
  isForgotten,
  parseMemory,
  parseMetrics,
  parseNavigate,
} from '@/lib/concierge/contract';
import {
  emptyMemory,
  emptyMemoryJson,
  memoryBody,
  memoryJson,
  memoryV2,
  memoryV2Json,
  memoryV2NoAgent,
  memoryV2NoAgentJson,
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
  it('names the topics and the RPCs as §4 and v2 (§ 7) do', () => {
    expect(TOPIC).toEqual({
      memory: 'concierge.memory',
      metrics: 'concierge.metrics',
      navigate: 'concierge.navigate',
      transcription: 'lk.transcription',
      chat: 'lk.chat',
    });
    expect(RPC_FORGET_ME).toBe('concierge.forget_me');
    expect(RPC_GET_MEMORY).toBe('concierge.get_memory');
    expect(MAX_BODY_BYTES).toBe(15 * 1024);
    expect(MAX_NAVIGATE_BYTES).toBe(1024);
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

// Contract v2 (v3 spec § 7, plan docs/plans/2026-10-21-P3-concierge-in-site.md § Contract v2, D95).
const v2With = (patch: Record<string, unknown>) => JSON.stringify({ ...memoryV2, ...patch });
const visitorWith = (patch: Record<string, unknown>) => v2With({ about_visitor: { ...memoryV2.about_visitor, ...patch } });
const agentWith = (patch: Record<string, unknown>) => v2With({ about_agent: { ...memoryV2.about_agent, ...patch } });
const V2_KEYS = ['v', 'about_visitor', 'about_agent', 'retention_days'];

describe('parseMemory, contract v2', () => {
  it('leaves the v2 keys off a v1 body', () => {
    for (const json of [memoryJson, emptyMemoryJson]) {
      const parsed = parseMemory(json)!;
      for (const key of V2_KEYS) expect(parsed).not.toHaveProperty(key);
    }
  });

  it('reads the v2 fixture into its typed fields', () => {
    const parsed = parseMemory(memoryV2Json);
    expect(parsed).toEqual(memoryV2);
    expect(parsed?.v).toBe(2);
    expect(parsed?.about_visitor?.profile).toHaveLength(3);
    expect(parsed?.about_visitor?.episodes?.map((e) => e.ended_at)).toEqual([null, '2026-10-19T21:09:00Z']);
    expect(parsed?.about_visitor?.events?.map((e) => e.type)).toContain('gate_rejected');
    expect(parsed?.about_agent?.knowledge?.sections).toHaveLength(4);
    expect(parsed?.about_agent?.cache?.cached_share).toBe(0.75);
    expect(parsed?.retention_days).toBe(30);
  });

  it('keeps an events type outside the seven named ones as its string', () => {
    expect(MEMORY_EVENT_TYPES).toEqual([
      'fact_added',
      'fact_invalidated',
      'fact_deleted',
      'gate_rejected',
      'extraction_ran',
      'remember',
      'forget',
    ]);
    const types = parseMemory(memoryV2Json)?.about_visitor?.events?.map((e) => e.type) ?? [];
    expect(types).toContain('summary_refreshed');
    expect(types.filter((t) => !(MEMORY_EVENT_TYPES as readonly string[]).includes(t))).toEqual(['summary_refreshed']);
  });

  it('parses a v2 body with about_agent missing as about_agent: null', () => {
    expect(parseMemory(memoryV2NoAgentJson)).toEqual({ ...memoryV2NoAgent, about_agent: null });
  });

  it.each([['a string'], [7], [null], [[]]])('parses a v2 body with about_agent %p as about_agent: null', (bad) => {
    const parsed = parseMemory(v2With({ about_agent: bad }));
    expect(parsed).not.toBeNull();
    expect(parsed?.about_agent).toBeNull();
    expect(parsed?.about_visitor).toEqual(memoryV2.about_visitor);
  });

  it('parses a body with v: 2 but no about_visitor, the absent v2 keys null', () => {
    const parsed = parseMemory(JSON.stringify({ ...memoryBody, v: 2 }));
    expect(parsed).toEqual({ ...memoryBody, v: 2, about_visitor: null, about_agent: null, retention_days: null });
  });

  it('reads a body whose only v2 key is a v below 2 (or not a number) as v1', () => {
    for (const v of [1, null, '2', 0]) {
      const parsed = parseMemory(JSON.stringify({ ...memoryBody, v }));
      expect(parsed).toEqual(memoryBody);
      for (const key of V2_KEYS) expect(parsed).not.toHaveProperty(key);
    }
  });

  it('gives all four v2 keys once any one of them is present', () => {
    expect(parseMemory(JSON.stringify({ ...memoryBody, retention_days: 30 }))).toEqual({
      ...memoryBody,
      v: null,
      about_visitor: null,
      about_agent: null,
      retention_days: 30,
    });
  });

  it('reads a v that is not an integer ≥ 2 as null, and a bad retention_days as null', () => {
    for (const v of [1, 2.5, '2', 0, -3]) expect(parseMemory(v2With({ v }))?.v).toBeNull();
    for (const retention_days of [0, -1, 1.5, '30', null]) {
      expect(parseMemory(v2With({ retention_days }))?.retention_days).toBeNull();
    }
  });

  it('reads an about_visitor that is not an object as null', () => {
    for (const about_visitor of ['x', 3, [], null]) {
      expect(parseMemory(v2With({ about_visitor }))?.about_visitor).toBeNull();
    }
  });

  it('reads a list in about_visitor that is not an array as null, and keeps the others', () => {
    const parsed = parseMemory(visitorWith({ profile: 'none', events: {} }));
    expect(parsed?.about_visitor).toEqual({ profile: null, episodes: memoryV2.about_visitor!.episodes, events: null });
  });

  it('drops a bad profile fact on its own, where a bad v1 fact rejects the body', () => {
    const [first, ...rest] = memoryBody.facts;
    const parsed = parseMemory(visitorWith({ profile: [omit(first, 'id'), ...rest, 'junk'] }));
    expect(parsed?.about_visitor?.profile).toEqual(rest);
    expect(parsed?.facts).toEqual(memoryBody.facts);
  });

  it('keeps episodes with an integer visit, at most five, the other fields null when odd', () => {
    const episodes = [
      { visit: 9, started_at: 5, ended_at: {}, summary: 7 },
      { visit: 'eight' },
      { visit: 7.5 },
      null,
      ...[6, 5, 4, 3, 2].map((visit) => ({ visit, started_at: 's', ended_at: 'e', summary: 'x' })),
    ];
    const parsed = parseMemory(visitorWith({ episodes }))?.about_visitor?.episodes;
    expect(parsed?.map((e) => e.visit)).toEqual([9, 6, 5, 4, 3]);
    expect(parsed?.[0]).toEqual({ visit: 9, started_at: null, ended_at: null, summary: null });
  });

  it('keeps events with a string type and detail, at most twelve, ts null when odd', () => {
    const good = (i: number) => ({ ts: `2026-10-20T08:${String(i).padStart(2, '0')}:00Z`, type: 'fact_added', detail: `d${i}` });
    const events = [{ ts: 1, type: 'remember', detail: 'kept' }, { type: 3, detail: 'x' }, { type: 'forget' }, 'x'];
    const parsed = parseMemory(visitorWith({ events: [...events, ...Array.from({ length: 14 }, (_, i) => good(i))] }));
    const kept = parsed?.about_visitor?.events;
    expect(kept).toHaveLength(12);
    expect(kept?.[0]).toEqual({ ts: null, type: 'remember', detail: 'kept' });
    expect(kept?.[11]).toEqual(good(10));
  });

  it('reads each about_agent field on its own', () => {
    const parsed = parseMemory(
      agentWith({
        knowledge: { words: '5200', est_tokens: 7000, sources_commit: 12, sections: ['projects', 3, null, 'skills'] },
        instructions_est_tokens: 'many',
        memory_block_chars: null,
        working: 'busy',
      }),
    );
    expect(parsed?.about_agent).toEqual({
      knowledge: { words: null, est_tokens: 7000, sources_commit: null, sections: ['projects', 'skills'] },
      instructions_est_tokens: null,
      memory_block_chars: null,
      working: null,
      cache: { cached_share: 0.75 },
    });
  });

  it('reads absent about_agent fields as null, and a knowledge without sections as no sections', () => {
    const parsed = parseMemory(v2With({ about_agent: { knowledge: {}, working: { compacted: 'yes', items: 3 } } }));
    expect(parsed?.about_agent).toEqual({
      knowledge: { words: null, est_tokens: null, sources_commit: null, sections: [] },
      instructions_est_tokens: null,
      memory_block_chars: null,
      working: { items: 3, est_tokens: null, compacted: null, compactions: null },
      cache: null,
    });
  });

  it('keeps cached_share only in [0, 1]', () => {
    for (const [share, want] of [[0, 0], [1, 1], [0.3, 0.3], [1.2, null], [-0.1, null], ['0.5', null], [null, null]]) {
      expect(parseMemory(agentWith({ cache: { cached_share: share } }))?.about_agent?.cache).toEqual({ cached_share: want });
    }
  });

  it('never throws on any v2 shape', () => {
    for (const patch of [{ about_visitor: { episodes: [[]], events: [[]] } }, { about_agent: { knowledge: [] } }]) {
      expect(() => parseMemory(v2With(patch))).not.toThrow();
    }
  });
});

describe('parseNavigate', () => {
  const nav = (body: unknown) => JSON.stringify(body);

  it('reads href, reason and at', () => {
    expect(parseNavigate(nav({ href: '/projects/agent-harness', reason: 'You asked about the harness.', at: '2026-10-21T10:00:00Z' }))).toEqual({
      href: '/projects/agent-harness',
      reason: 'You asked about the harness.',
      at: '2026-10-21T10:00:00Z',
    });
  });

  it('reads an odd or absent reason and at as null', () => {
    expect(parseNavigate(nav({ href: '/skills', reason: 3 }))).toEqual({ href: '/skills', reason: null, at: null });
  });

  it.each([[{}], [{ href: '' }], [{ href: 7 }], [{ href: null }]])('returns null without a non-empty href: %p', (body) => {
    expect(parseNavigate(nav(body))).toBeNull();
  });

  it('returns null, never throws, on non-JSON or a non-object', () => {
    for (const text of ['', 'nope', '{', 'null', '"/about"', '["/about"]']) {
      expect(() => parseNavigate(text)).not.toThrow();
      expect(parseNavigate(text)).toBeNull();
    }
  });

  it('returns null for a body over 1 KiB, counted in UTF-8 bytes', () => {
    const body = (reason: string) => nav({ href: '/about', reason, at: null });
    const room = MAX_NAVIGATE_BYTES - body('').length;
    expect(parseNavigate(body('a'.repeat(room)))).not.toBeNull(); // exactly 1 KiB
    expect(parseNavigate(body('a'.repeat(room + 1)))).toBeNull();
    const twoByte = body('é'.repeat(Math.ceil(room / 2) + 1));
    expect(twoByte.length).toBeLessThanOrEqual(MAX_NAVIGATE_BYTES);
    expect(parseNavigate(twoByte)).toBeNull();
  });
});

describe('isAllowedHref', () => {
  const slugs = ['agent-harness', 'voice-concierge'];

  it.each(['/', '/about', '/skills', '/experience', '/contact', '/projects/agent-harness', '/projects/voice-concierge'])(
    'allows %p',
    (href) => {
      expect(isAllowedHref(href, slugs)).toBe(true);
    },
  );

  it.each([
    '//evil',
    '//evil.example/about',
    'https://evil.example/',
    'https://mherron.dev/about',
    'javascript:alert(1)',
    '/projects/unknown',
    '/projects/',
    '/projects',
    '/projects/agent-harness/',
    '/projects/agent-harness?x',
    '/projects/Agent-Harness',
    '/projects/agent%2Dharness',
    '/about?x',
    '/about#y',
    '/about/',
    '/About',
    ' /about',
    '',
    '/talk',
    '/card',
    '/evidence',
    'about',
  ])('refuses %p', (href) => {
    expect(isAllowedHref(href, slugs)).toBe(false);
  });

  it('refuses every project href when no slugs are known', () => {
    expect(isAllowedHref('/projects/agent-harness', [])).toBe(false);
  });
});
