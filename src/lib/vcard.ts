import type { Profile } from './data/profile';

// Profile has no country field; every address on the site is in the US
const COUNTRY = 'USA';

// RFC 6350 § 3.4 text escaping: backslash first, then comma, semicolon and line breaks
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// Splits at the last occurrence of sep: [before, after]; no sep → [whole, '']
function splitLast(value: string, sep: string): [string, string] {
  const i = value.lastIndexOf(sep);
  return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + sep.length)];
}

// vCard 3.0 for the "Save contact" button. No TEL (D5); no PHOTO (docs/plans/2026-10-18-M1-card.md).
export function buildVCard(profile: Profile): string {
  // Family name is after the last space; a one-word name is all family name
  const [before, after] = splitLast(profile.name, ' ');
  const [family, given] = after ? [after, before] : [before, ''];
  const [locality, region] = splitLast(profile.location, ',').map((part) => part.trim());

  return (
    [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${escapeText(family)};${escapeText(given)};;;`,
      `FN:${escapeText(profile.name)}`,
      `TITLE:${escapeText(profile.positioning)}`,
      `EMAIL;TYPE=INTERNET:${profile.email}`,
      `URL:${profile.siteUrl}`,
      `X-SOCIALPROFILE;TYPE=linkedin:${profile.linkedin}`,
      `ADR;TYPE=WORK:;;;${escapeText(locality)};${escapeText(region)};;${COUNTRY}`,
      'END:VCARD',
    ].join('\r\n') + '\r\n'
  );
}
