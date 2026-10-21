import Link from 'next/link';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';
import type { Phase } from '@/components/talk/sessionReducer';

// "Read how it works", for when there is no call to have: offline or busy. /talk and the panel both show it; the panel
// closes itself on the click (`onFollow`), so the deep-dive doesn't open under the sheet.
export default function DeepDiveLink({ phase, onFollow }: { phase: Phase; onFollow?: () => void }) {
  if (phase !== 'offline' && phase !== 'busy') return null;
  return (
    <p>
      <Link
        href={talkPage.deepDiveHref}
        onClick={onFollow}
        className={`text-[var(--color-accent)] underline underline-offset-4 hover:decoration-2 ${focusRing}`}
      >
        {talkPage.deepDiveLabel}
      </Link>
    </p>
  );
}
