// Display helpers shared by the /talk panels: a missing value is always an en dash, never "null" or "NaN".
export const DASH = '–';

export const orDash = (value: string | null | undefined): string => (value ? value : DASH);

export const ms = (value: number | null): string => (value === null ? DASH : `${Math.round(value)} ms`);

// Counts, grouped the English way whatever the visitor's locale ("5,200"): the copy around them is English.
export const count = (value: number | null): string => (value === null ? DASH : value.toLocaleString('en-US'));

// A 0–1 share as a whole percentage.
export const percent = (value: number | null): string => (value === null ? DASH : `${Math.round(value * 100)}%`);

// Memory arrives only on the client (from a text stream), so dates render in the visitor's locale and time zone.
export const LEARNED_AT_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
const DAY_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

const parse = (iso: string | null): Date | null => {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** An ISO time as date and time, or null when absent or unreadable. */
export const dateTime = (iso: string | null): string | null => {
  const date = parse(iso);
  return date ? new Intl.DateTimeFormat(undefined, LEARNED_AT_FORMAT).format(date) : null;
};

/** An ISO time as a date, or the dash. */
export const day = (iso: string | null): string => {
  const date = parse(iso);
  return date ? new Intl.DateTimeFormat(undefined, DAY_FORMAT).format(date) : DASH;
};
