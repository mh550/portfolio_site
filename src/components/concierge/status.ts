import { talkPage } from '@/lib/data/concierge';
import type { Phase, SessionState } from '@/components/talk/sessionReducer';

// The session's one status line and the Forget me line, shared by /talk and (from P3-04) the drawer. Pure.

const statusText: Partial<Record<Phase, string>> = {
  connecting: talkPage.status.connecting,
  waiting: talkPage.status.waiting,
  live: talkPage.status.live,
  ended: talkPage.status.ended,
};

export function statusLine({ phase, busyReason, micBlocked }: SessionState): string | undefined {
  const { status } = talkPage;
  if (phase === 'offline') return talkPage.offlineMessage;
  if (phase === 'busy') return busyReason === 'visitor' ? status.busyVisitor : status.busySite;
  if (phase === 'live' && micBlocked) return status.micBlocked;
  return statusText[phase];
}

// Once the call is over, "Try again" would point at a button that has gone.
export function forgetLine({ phase, forget }: SessionState): string {
  const { status } = talkPage;
  if (forget === 'done') return status.forgotten;
  if (forget === 'failed') return phase === 'live' ? status.forgetFailed : status.forgetFailedEnded;
  return '';
}
