import { talkPage } from '@/lib/data/concierge';
import type { MemoryBody } from '@/lib/concierge/contract';
import type { CachedMemory } from '@/lib/concierge/memoryCache';
import type { Phase, SessionState } from '@/components/talk/sessionReducer';

// The session's one status line and the Forget me line, shared by /talk and (from P3-04) the drawer. Pure.

const statusText: Partial<Record<Phase, string>> = {
  connecting: talkPage.status.connecting,
  waiting: talkPage.status.waiting,
  live: talkPage.status.live,
  ended: talkPage.status.ended,
  closing: talkPage.status.closing,
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

// What the memory strip and tab show (D91): the session's body, else the cached one from the last call with its time
// (greyed, "as of"), and nothing once Forget me has gone through.
export function shownMemory(
  { memory, forget }: SessionState,
  cached: CachedMemory | null
): { memory: MemoryBody | null; asOf: string | null } {
  if (memory) return { memory, asOf: null };
  if (forget === 'done' || !cached) return { memory: null, asOf: null };
  return { memory: cached.body, asOf: cached.savedAt };
}
