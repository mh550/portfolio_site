import { focusRing } from '@/components/focusRing';

/** The /evidence and /experience link look: foreground text, accent underline at 50 %, accent on hover. */
export const textLink = `text-[var(--color-foreground)] underline decoration-[var(--color-accent)]/50 underline-offset-4 hover:text-[var(--color-accent)] ${focusRing}`;
