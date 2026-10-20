// Display helpers shared by the /talk panels: a missing value is always an en dash, never "null" or "NaN".
export const DASH = '–';

export const orDash = (value: string | null | undefined): string => (value ? value : DASH);

export const ms = (value: number | null): string => (value === null ? DASH : `${Math.round(value)} ms`);

// A 0–1 share as a whole percentage.
export const percent = (value: number | null): string => (value === null ? DASH : `${Math.round(value * 100)}%`);
