import { StrictMode, type ReactNode } from 'react';
import { render } from '@testing-library/react';
import ConciergeProvider from '@/components/concierge/ConciergeProvider';
import TalkSession from '@/components/talk/TalkSession';

// P3-03 (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Tests): the call lives in ConciergeProvider, so
// TalkSession renders inside one. unmountTalk/remountTalk swap the child under the same provider, as a client-side
// navigation away from /talk and back does.
export function renderTalk({ configured = true, strict = false }: { configured?: boolean; strict?: boolean } = {}) {
  const tree = (child: ReactNode) => {
    const provider = <ConciergeProvider configured={configured}>{child}</ConciergeProvider>;
    return strict ? <StrictMode>{provider}</StrictMode> : provider;
  };
  const result = render(tree(<TalkSession />));
  return {
    ...result,
    unmountTalk: () => result.rerender(tree(null)),
    remountTalk: () => result.rerender(tree(<TalkSession />)),
  };
}
