// Copy for /talk, the voice concierge page (spec docs/specs/2026-10-19-voice-concierge-page.md W2, plan
// docs/plans/2026-10-20-VC2-talk-page.md § Copy; the intro is D62's). First person, plain; no number but 30.

// An intro paragraph: plain text, or text with one link in it (D62: "my agent harness" links its case study; the
// wording is D93's).
export type IntroParagraph = string | { before: string; link: { label: string; href: string }; after: string };

/** A paragraph's full text, link label included: what a reader sees. */
export const introText = (p: IntroParagraph): string => (typeof p === 'string' ? p : p.before + p.link.label + p.after);

export const talkPage = {
  eyebrow: 'Voice concierge',
  title: 'Talk to my concierge',
  description: 'A voice agent that remembers you between visits, and shows you exactly what it remembers.',
  intro: [
    {
      before: 'A voice agent I designed on LiveKit and built with ',
      link: { label: 'my agent harness', href: '/projects/agent-harness' },
      after:
        ". It remembers you between visits, shows you what it remembers and where each thing came from, and can take you to the work it's talking about.",
    },
    'Talk or type. The Latency tab shows how long each turn took, and Forget me on the Memory tab erases what it knows about you.',
  ] satisfies IntroParagraph[],
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
    busyVisitor: 'You already have a conversation open in another tab.',
    busySite: 'The concierge is busy right now. Try again in a few minutes.',
    // D92: a 429 for this visitor while their earlier room closes; the page asks again for a minute, then busyVisitor
    closing: 'Closing your earlier conversation…',
    micBlocked: 'Microphone blocked. You can still type.',
    forgetConfirm: 'Erase everything the concierge remembers about you?',
    forgotten: 'Forgotten',
    forgetFailed: "Forget me didn't go through. Try again.",
    forgetFailedEnded: "Forget me didn't go through. Connect again to retry.",
  },
  // memory, latency and privacy name the three tabs under the memory strip (D90); /talk's own privacy h2 keeps "Privacy"
  headings: { transcript: 'Transcript', memory: 'Memory', latency: 'Latency', privacy: 'Privacy' },
  empty: {
    transcript: 'Nothing said yet.',
    memory: 'Nothing remembered yet',
    latency: 'No turns yet.',
    newVisitor: 'a new visitor',
  },
  // The Memory tab's first line, "Talking to {name} · visit {visits}", and its labels.
  memory: {
    talkingTo: 'Talking to',
    visit: 'visit',
    summary: 'Summary',
    fact: { channel: 'Channel', source: 'Source', learnedAt: 'Learned', confidence: 'Confidence' },
  },
  // The Memory tab and the strip (D90, plan § Memory view): the v2 body's six kinds of memory in two sections.
  memoryView: {
    // The strip and the tabs' section: a visually hidden h2, so heading navigation reaches them
    heading: 'Memory, latency and privacy',
    strip: 'What it remembers, by kind',
    tabs: 'Memory, latency and privacy',
    aboutYou: 'About you',
    aboutAgent: 'About the agent',
    kinds: {
      profile: 'Profile',
      episodes: 'Episodes',
      events: 'Events',
      knowledge: 'Knowledge',
      working: 'Working',
      cache: 'Cache',
    },
    notReported: 'not reported by this agent version',
    inProgress: 'in progress',
    // Before the cached body's time (D91): what the site kept from the last call, shown greyed before a new one
    asOf: 'as of',
    // Before a gate_rejected event's sentence, for screen readers: the row's red marks it for everyone else
    rejected: 'Not kept:',
    forgetHint: 'Connect to erase what it remembers',
    retention: (days: number) => `Kept ${days} days after your last visit`,
    knowledge: { words: 'Words', estTokens: 'Est. tokens', sections: 'Sections', source: 'Source' },
    working: { items: 'Items', estTokens: 'Est. tokens', compacted: 'Compacted', compactions: 'Compactions' },
    cachedShare: 'Prompt tokens from cache',
  },
  speakers: { visitor: 'You', agent: 'Concierge' },
};

// Spec W2, in its order: what, where, how long, the id, Forget me, LiveKit's own retention.
export const privacyNote: string[] = [
  'It stores the facts it learns about you, a short summary of each visit, and the transcript events.',
  'They are kept on my own server.',
  'They are deleted 30 days after your last visit.',
  'It knows you by a random id kept in this browser, not by a login. Another browser starts fresh.',
  // D96: the memory cache (D91)
  "This browser keeps a copy of what it last showed you, so the Memory tab has something before you connect. It goes when the server's copy does, or when Forget me runs.",
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

// The "Ask my site" pill on every chrome page but /talk (D87, VoiceWidget): `label` is its visible text and, idle, its
// accessible name; while a call is live the name says whether the agent is listening or speaking. It opens the
// concierge panel (D86); `href` is the page SiteChrome leaves both off. `callout` is the first-visit bubble (D88).
// `guideMe` is the panel's switch for the usher (D94); its transcript notice is `notice` and the destination's name: a
// page's from `pageNames`, a project's short title.
export const talkWidget = {
  label: 'Ask my site',
  listening: 'Ask my site: listening',
  speaking: 'Ask my site: speaking',
  callout: 'This site talks. Ask it about my work, by voice or text.',
  close: 'Close',
  panelTitle: 'Ask my site',
  minimize: 'Minimize',
  guideMe: 'Guide me',
  guideMeHint: 'Lets the concierge open the pages it talks about',
  notice: 'Taking you to',
  pageNames: { '/': 'Home', '/about': 'About', '/skills': 'Skills', '/experience': 'Experience', '/contact': 'Contact' },
  href: '/talk',
};
