// Copy for /talk, the voice concierge page (spec docs/specs/2026-10-19-voice-concierge-page.md W2, plan
// docs/plans/2026-10-20-VC2-talk-page.md § Copy). First person, plain; no number but 30.

export const talkPage = {
  eyebrow: 'Voice concierge',
  title: 'Talk to my concierge',
  description: 'A voice agent that remembers you between visits, and shows you exactly what it remembers.',
  intro: [
    'This is a voice agent I designed and built on LiveKit, with Claude Code agents writing much of the code. It remembers you between visits.',
    'This page shows what it remembers, where it learned each thing, and how long each turn took. Talk or type.',
  ],
  // Exact, with no full stop: the tests and the spec match it word for word.
  offlineMessage: 'The concierge is offline right now',
  deepDiveHref: '/projects/voice-concierge',
  deepDiveLabel: 'Read how it works',
  labels: {
    connect: 'Connect',
    leave: 'Leave',
    send: 'Send',
    forgetMe: 'Forget me',
    erase: 'Erase',
    cancel: 'Cancel',
    micOn: 'Mute microphone',
    micOff: 'Unmute microphone',
    message: 'Message',
    messagePlaceholder: 'Type a message',
    startAudio: 'Turn on sound',
  },
  status: {
    connecting: 'Connecting…',
    waiting: 'Waiting for the concierge to join…',
    live: 'Connected. Say hello, or type below.',
    ended: 'The call ended.',
    micBlocked: 'Microphone blocked. You can still type.',
    forgetConfirm: 'Erase everything the concierge remembers about you?',
    forgotten: 'Forgotten',
    forgetFailed: "Forget me didn't go through. Try again.",
    forgetFailedEnded: "Forget me didn't go through. Connect again to retry.",
  },
  headings: { transcript: 'Transcript', memory: 'What it remembers', latency: 'Latency', privacy: 'Privacy' },
  empty: {
    transcript: 'Nothing said yet.',
    memory: 'Nothing remembered yet',
    latency: 'No turns yet.',
    newVisitor: 'a new visitor',
  },
  // The memory panel: "Talking to {name} · visit {visits}", then one row per fact.
  memory: {
    talkingTo: 'Talking to',
    visit: 'visit',
    summary: 'Summary',
    fact: { channel: 'Channel', source: 'Source', learnedAt: 'Learned', confidence: 'Confidence' },
  },
  speakers: { visitor: 'You', agent: 'Concierge' },
};

// Spec W2, in its order: what, where, how long, the id, Forget me, LiveKit's own retention.
export const privacyNote: string[] = [
  'It stores the facts it learns about you, a short summary of each visit, and the transcript events.',
  'They are kept on my own server.',
  'They are deleted 30 days after your last visit.',
  'It knows you by a random id kept in this browser, not by a login. Another browser starts fresh.',
  'Forget me erases everything about you on my server. Anonymous timing numbers, with no text and no id, are kept.',
  "LiveKit's observability keeps the conversation's transcript and timing traces, but no audio, for 30 days. Forget me can't erase those.",
];

export const latencyLabels = {
  total_ms: 'Whole turn',
  eou_ms: 'End of turn detected',
  stt_ms: 'Speech to text',
  llm_ttft_ms: 'First token from the model',
  tts_ttfb_ms: 'First audio from speech',
  memory_on_turn_path_ms: 'Memory on the turn path',
  cachedShare: 'Prompt tokens from cache',
  preload_ms: 'Memory preload at connect',
  extraction_ms: 'Background extraction',
  compacted: 'History compacted',
  turn: 'Turn',
  yes: 'Yes',
  no: 'No',
  columns: { label: 'Step', last: 'This turn', median: 'Median' },
};
