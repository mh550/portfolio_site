import { forgetLine, statusLine } from '@/components/concierge/status';
import { initialSession, type SessionState } from '@/components/talk/sessionReducer';
import { talkPage } from '@/lib/data/concierge';

// The status and Forget me lines /talk shows, and the drawer will (moved out of TalkSession in P3-03).
const at = (patch: Partial<SessionState>): SessionState => ({ ...initialSession, ...patch });
const { status } = talkPage;

describe('statusLine', () => {
  it.each<[string, Partial<SessionState>, string | undefined]>([
    ['idle: nothing', { phase: 'idle' }, undefined],
    ['connecting', { phase: 'connecting' }, status.connecting],
    ['waiting', { phase: 'waiting' }, status.waiting],
    ['live', { phase: 'live' }, status.live],
    ['live with the mic blocked', { phase: 'live', micBlocked: true }, status.micBlocked],
    ['ended', { phase: 'ended' }, status.ended],
    ['offline', { phase: 'offline' }, talkPage.offlineMessage],
    ['busy, this visitor', { phase: 'busy', busyReason: 'visitor' }, status.busyVisitor],
    ['busy, the site', { phase: 'busy', busyReason: 'site' }, status.busySite],
    ['closing the earlier conversation (D92)', { phase: 'closing' }, 'Closing your earlier conversation…'],
  ])('%s', (_name, patch, line) => {
    expect(statusLine(at(patch))).toBe(line);
  });

  it('a blocked mic only shows while live', () => {
    expect(statusLine(at({ phase: 'ended', micBlocked: true }))).toBe(status.ended);
  });
});

describe('forgetLine', () => {
  it.each<[string, Partial<SessionState>, string]>([
    ['no Forget me yet', { phase: 'live', forget: 'idle' }, ''],
    ['in flight', { phase: 'live', forget: 'busy' }, ''],
    ['done, call still live', { phase: 'live', forget: 'done' }, status.forgotten],
    ['done, call over', { phase: 'ended', forget: 'done' }, status.forgotten],
    ['failed while live: try again', { phase: 'live', forget: 'failed' }, status.forgetFailed],
    ['failed, call over: connect again', { phase: 'ended', forget: 'failed' }, status.forgetFailedEnded],
  ])('%s', (_name, patch, line) => {
    expect(forgetLine(at(patch))).toBe(line);
  });
});
