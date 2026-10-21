import { focusRing } from '@/components/focusRing';

// The call's button looks, shared by /talk and (from P3-04) the drawer.
const button = `rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const primary = `${button} bg-[var(--color-accent)] text-[var(--color-background)] hover:opacity-90`;
export const quiet = `${button} border border-white/20 text-white hover:border-white/40`;

// Forget me and its confirm step (ForgetMeButton), and the disabled Forget me the Memory tab shows before a call
// (MemoryView), so the two look the same.
const small = `rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${focusRing}`;
export const quietSmall = `${small} border border-white/20 text-white hover:border-white/40`;
export const danger = `${small} bg-red-700 text-white hover:bg-red-800`;
