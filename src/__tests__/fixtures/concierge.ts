import type { MemoryBody, MetricsBody } from '@/lib/concierge/contract';

// §4 bodies as the agent sends them (spec docs/specs/2026-10-19-voice-concierge-page.md). The panels' tests
// (VC2-03) and the session tests (VC2-04) reuse these, so keep them shaped exactly like the contract.

// Three facts across the voice and text channels, a visitor whose name it has not learned, and a summary.
export const memoryBody: MemoryBody = {
  visitor: { name: null, visits: 2 },
  facts: [
    {
      id: 'f-role',
      slot: 'role',
      value: 'Engineering manager at a robotics startup',
      channel: 'voice',
      source: 'said in visit 1',
      learned_at: '2026-10-19T21:04:00Z',
      confidence: 0.9,
    },
    {
      id: 'f-interest',
      slot: 'interest',
      value: 'Memory for voice agents',
      channel: 'voice',
      source: 'said in visit 1',
      learned_at: '2026-10-19T21:05:30Z',
      confidence: 0.8,
    },
    {
      id: 'f-city',
      slot: 'city',
      value: 'Lisbon',
      channel: 'text',
      source: 'typed in visit 2',
      learned_at: '2026-10-20T08:12:00Z',
      confidence: 0.95,
    },
  ],
  summary: 'Asked how the concierge keeps memory off the turn path.',
  updated_at: '2026-10-20T08:12:05Z',
};

// A contract v2 body (v3 spec § 7): the v1 keys plus `v`, `about_visitor`, `about_agent` and `retention_days`. Three
// profile facts (the v1 facts), two episodes newest first with the current one still open, five events newest first
// with one gate_rejected and one type the page doesn't know, and every about_agent field reported.
export const memoryV2: MemoryBody = {
  ...memoryBody,
  v: 2,
  about_visitor: {
    profile: memoryBody.facts,
    episodes: [
      { visit: 2, started_at: '2026-10-20T08:10:00Z', ended_at: null, summary: null },
      {
        visit: 1,
        started_at: '2026-10-19T21:02:00Z',
        ended_at: '2026-10-19T21:09:00Z',
        summary: 'Asked how the concierge keeps memory off the turn path.',
      },
    ],
    events: [
      { ts: '2026-10-20T08:12:05Z', type: 'extraction_ran', detail: 'Read the last two turns for facts.' },
      { ts: '2026-10-20T08:12:04Z', type: 'fact_added', detail: 'Learned your city.' },
      { ts: '2026-10-20T08:11:40Z', type: 'gate_rejected', detail: 'Did not keep a guess about your employer.' },
      { ts: '2026-10-20T08:11:00Z', type: 'summary_refreshed', detail: 'Refreshed the visit summary.' },
      { ts: '2026-10-20T08:10:30Z', type: 'remember', detail: 'You asked it to remember your interest.' },
    ],
  },
  about_agent: {
    knowledge: {
      words: 5200,
      est_tokens: 7000,
      sources_commit: '3f9c2ab71d0e',
      sections: ['projects', 'experience', 'skills', 'approach'],
    },
    instructions_est_tokens: 900,
    memory_block_chars: 640,
    working: { items: 14, est_tokens: 2100, compacted: true, compactions: 1 },
    cache: { cached_share: 0.75 },
  },
  retention_days: 30,
};

// A v2 agent that doesn't report about_agent: the body as sent, without the key (it parses with about_agent: null).
export const memoryV2NoAgent: MemoryBody = {
  ...memoryBody,
  v: 2,
  about_visitor: memoryV2.about_visitor,
  retention_days: 30,
};

// What the agent sends after Forget me: no facts, no summary.
export const emptyMemory: MemoryBody = {
  visitor: { name: null, visits: 0 },
  facts: [],
  summary: null,
  updated_at: '2026-10-20T08:15:00Z',
};

// The first turn of a visit: every field reported.
export const metricsFull: MetricsBody = {
  turn: 1,
  eou_ms: 210,
  stt_ms: 95,
  llm_ttft_ms: 340,
  tts_ttfb_ms: 180,
  total_ms: 830,
  memory_on_turn_path_ms: 2,
  preload_ms: 45,
  extraction_ms: 610,
  prompt_tokens: 1200,
  cached_tokens: 900,
  compacted: false,
};

// A turn where the agent reported nothing it could leave out.
export const metricsNulls: MetricsBody = {
  turn: 2,
  eou_ms: null,
  stt_ms: null,
  llm_ttft_ms: null,
  tts_ttfb_ms: null,
  total_ms: null,
  memory_on_turn_path_ms: null,
  preload_ms: null,
  extraction_ms: null,
  prompt_tokens: null,
  cached_tokens: null,
  compacted: null,
};

// A later turn after the agent compacted the history: no background extraction reported yet, no preload (that
// happens once, at connect).
export const metricsCompacted: MetricsBody = {
  turn: 3,
  eou_ms: 190,
  stt_ms: 105,
  llm_ttft_ms: 420.6,
  tts_ttfb_ms: 200,
  total_ms: 1010,
  memory_on_turn_path_ms: 3,
  preload_ms: null,
  extraction_ms: null,
  prompt_tokens: 2000,
  cached_tokens: 1500,
  compacted: true,
};

export const memoryJson = JSON.stringify(memoryBody);
export const memoryV2Json = JSON.stringify(memoryV2);
export const memoryV2NoAgentJson = JSON.stringify(memoryV2NoAgent);
export const emptyMemoryJson = JSON.stringify(emptyMemory);
export const metricsFullJson = JSON.stringify(metricsFull);
export const metricsNullsJson = JSON.stringify(metricsNulls);
export const metricsCompactedJson = JSON.stringify(metricsCompacted);
