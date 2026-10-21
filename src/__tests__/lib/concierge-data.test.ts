import { introText, latencyLabels, privacyNote, talkPage, talkWidget } from '@/lib/data';

describe('talkPage', () => {
  it('has the exact offline sentence and the deep-dive link', () => {
    expect(talkPage.offlineMessage).toBe('The concierge is offline right now');
    expect(talkPage.deepDiveHref).toBe('/projects/voice-concierge');
  });

  // D62: the harness framing, no hand-written-code claim and no number.
  it('opens the intro with the harness wording, linking the agent-harness case study', () => {
    expect(introText(talkPage.intro[0])).toBe(
      'A voice agent I designed on LiveKit and built with my agent harness: specs in, verified milestones out. It remembers you between visits.',
    );
    expect(talkPage.intro[0]).toMatchObject({ link: { label: 'my agent harness', href: '/projects/agent-harness' } });
    for (const p of talkPage.intro) {
      expect(introText(p)).not.toMatch(/\d/);
      expect(introText(p)).not.toMatch(/Claude Code agents writing/);
    }
  });

  it('has a title, an intro and the button labels', () => {
    expect(talkPage.title).toBe('Talk to my concierge');
    expect(talkPage.intro.length).toBeGreaterThan(0);
    expect(talkPage.labels).toMatchObject({
      connect: 'Connect',
      leave: 'Leave',
      send: 'Send',
      forgetMe: 'Forget me',
      erase: 'Erase',
      cancel: 'Cancel',
    });
    expect(talkPage.status.forgetConfirm).toBe('Erase everything the concierge remembers about you?');
    expect(talkPage.status.micBlocked).toBe('Microphone blocked. You can still type.');
    expect(talkPage.empty.memory).toBe('Nothing remembered yet');
    expect(talkPage.empty.newVisitor).toBe('a new visitor');
  });

  it('labels every latency row', () => {
    for (const key of [
      'total_ms',
      'eou_ms',
      'stt_ms',
      'llm_ttft_ms',
      'tts_ttfb_ms',
      'memory_on_turn_path_ms',
      'cachedShare',
      'preload_ms',
      'extraction_ms',
      'compacted',
    ] as const) {
      expect(latencyLabels[key]).toEqual(expect.any(String));
    }
  });
});

describe('privacyNote', () => {
  it('has six entries, in the order spec W2 lists them', () => {
    expect(privacyNote).toHaveLength(6);
    const [what, where, howLong, id, forget, livekit] = privacyNote;
    expect(what).toMatch(/facts/);
    expect(what).toMatch(/summary/);
    expect(what).toMatch(/transcript/);
    expect(where).toMatch(/my own server/);
    expect(howLong).toMatch(/30 days after your last visit/);
    expect(id).toMatch(/this browser/);
    expect(id).toMatch(/not by a login/);
    expect(forget).toMatch(/Forget me erases everything about you on my server/);
    expect(forget).toMatch(/Anonymous timing numbers/);
    expect(forget).toMatch(/no text and no id/);
    expect(livekit).toMatch(/LiveKit's observability/);
    expect(livekit).toMatch(/transcript and timing traces/);
    expect(livekit).toMatch(/no audio/);
    expect(livekit).toMatch(/30 days/);
    expect(livekit).toMatch(/Forget me can't erase/);
  });

  it('has no links, no hostnames and no number but 30', () => {
    for (const entry of privacyNote) {
      expect(entry).not.toMatch(/http/);
      expect(entry).not.toMatch(/\.net/);
      expect(entry.replace(/\b30\b/g, '')).not.toMatch(/\d/);
    }
  });
});

// P3-06, D90: the memory view's copy and the tab names (plan § Copy).
describe('talkPage.memoryView and the tab names', () => {
  it('names the three tabs Memory, Latency, Privacy', () => {
    expect(talkPage.headings).toMatchObject({ memory: 'Memory', latency: 'Latency', privacy: 'Privacy' });
  });

  it('has the sections, the six kinds, and the exact fallback and hint lines', () => {
    const view = talkPage.memoryView;
    expect(view.aboutYou).toBe('About you');
    expect(view.aboutAgent).toBe('About the agent');
    expect(view.kinds).toEqual({
      profile: 'Profile',
      episodes: 'Episodes',
      events: 'Events',
      knowledge: 'Knowledge',
      working: 'Working',
      cache: 'Cache',
    });
    expect(view.notReported).toBe('not reported by this agent version');
    expect(view.inProgress).toBe('in progress');
    expect(view.forgetHint).toBe('Connect to erase what it remembers');
    expect(view.rejected).toBe('Not kept:');
    expect(view.heading).toBe('Memory, latency and privacy');
    expect(view.retention(30)).toBe('Kept 30 days after your last visit');
  });
});

// v3 spec § 4.4: the copy names the control only as it is labelled. Every string here that says "forget" says
// "Forget me", capital F, and nothing else ("forget your data", "Forget Me", "forget-me" all fail).
describe('the Forget me spelling', () => {
  const strings = (value: unknown): string[] =>
    typeof value === 'string'
      ? [value]
      : typeof value === 'function'
        ? []
        : value && typeof value === 'object'
          ? Object.values(value).flatMap(strings)
          : [];
  const all = [...strings(talkPage), ...strings(privacyNote), ...strings(talkWidget), ...strings(latencyLabels)];

  it('finds the strings that mention it', () => {
    expect(all.filter((s) => /forget/i.test(s)).length).toBeGreaterThanOrEqual(4);
  });

  it.each(all.filter((s) => /forget/i.test(s)))('"%s" spells it "Forget me"', (s) => {
    const mentions = s.match(/forget[\w-]*(\s+\w+)?/gi)!;
    for (const m of mentions) expect(m).toBe('Forget me');
  });
});
