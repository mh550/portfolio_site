import { focusRing } from '@/components/focusRing';

// The call's button looks, shared by /talk and (from P3-04) the drawer.
const button = `rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const primary = `${button} bg-[var(--color-accent)] text-[var(--color-background)] hover:opacity-90`;
export const quiet = `${button} border border-white/20 text-white hover:border-white/40`;
