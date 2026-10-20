'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { talkPage } from '@/lib/data/concierge';
import { focusRing } from '@/components/focusRing';

// The text box under the transcript. Client only for the draft; the parent sends it (lk.chat) and adds the line.
// Enter submits the form, as Send does; whitespace alone sends nothing. The draft clears only once `onSend` says it
// went, and only if the visitor hasn't typed on since; while a send is out, another Enter sends nothing.
export default function MessageBox({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const pending = useRef(false);
  const { labels } = talkPage;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (disabled || !text || pending.current) return;
    pending.current = true;
    const sent = draft;
    void onSend(text).then((ok) => {
      pending.current = false;
      if (ok) setDraft((current) => (current === sent ? '' : current));
    });
  };

  return (
    <form onSubmit={submit} className="mt-3 flex gap-3">
      <label htmlFor={inputId} className="sr-only">
        {labels.message}
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        placeholder={labels.messagePlaceholder}
        className={`w-full min-w-0 flex-1 rounded-md border border-white/20 bg-[var(--color-background)] px-3 py-2 text-white placeholder:text-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      />
      <button
        type="submit"
        disabled={disabled}
        className={`rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        {labels.send}
      </button>
    </form>
  );
}
