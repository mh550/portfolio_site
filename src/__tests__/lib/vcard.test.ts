import { buildVCard } from '@/lib/vcard';
import { profile } from '@/lib/data';

const EXPECTED =
  [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Herron;Michael;;;',
    'FN:Michael Herron',
    'TITLE:Agentic Systems Engineer',
    'EMAIL;TYPE=INTERNET:mherron734@gmail.com',
    'URL:https://michael-herron.vercel.app',
    'X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/mherron734/',
    'ADR;TYPE=WORK:;;;Durham;NC;;USA',
    'END:VCARD',
  ].join('\r\n') + '\r\n';

describe('buildVCard', () => {
  it('builds the exact vCard for the real profile', () => {
    expect(buildVCard(profile)).toBe(EXPECTED);
  });

  it('ends every line with CRLF, including the last', () => {
    const out = buildVCard(profile);
    expect(out.endsWith('\r\n')).toBe(true);
    expect(out).not.toMatch(/(^|[^\r])\n/);
  });

  it('keeps every line within 75 octets, so no folding is needed', () => {
    buildVCard(profile)
      .split('\r\n')
      .forEach((line) => expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75));
  });

  it('has no phone line (D5)', () => {
    const lines = buildVCard(profile).split('\r\n');
    expect(lines.filter((line) => line.startsWith('TEL'))).toEqual([]);
  });

  // TS literals: each backslash in the vCard text is written doubled here
  const tricky = { ...profile, name: 'Ann;Marie,Jo\nSmith Doe', location: 'Back\\slash, NC' };

  it('escapes comma, semicolon and newline in N and FN', () => {
    const lines = buildVCard(tricky).split('\r\n');
    expect(lines).toContain('N:Doe;Ann\\;Marie\\,Jo\\nSmith;;;');
    expect(lines).toContain('FN:Ann\\;Marie\\,Jo\\nSmith Doe');
  });

  it('doubles a backslash in the location', () => {
    const lines = buildVCard(tricky).split('\r\n');
    expect(lines).toContain('ADR;TYPE=WORK:;;;Back\\\\slash;NC;;USA');
  });

  it('escapes a semicolon in the location so ADR keeps its 7 components', () => {
    const lines = buildVCard({ ...profile, location: 'Suite 4; Durham, NC' }).split('\r\n');
    expect(lines).toContain('ADR;TYPE=WORK:;;;Suite 4\\; Durham;NC;;USA');
  });

  it('escapes the backslash before the comma it precedes', () => {
    // a\,b in the input (backslash, comma) must become a\\\,b, not a\\,b
    const lines = buildVCard({ ...profile, positioning: 'a\\,b' }).split('\r\n');
    expect(lines).toContain('TITLE:a\\\\\\,b');
  });

  it('takes TITLE from profile.positioning', () => {
    const lines = buildVCard({ ...profile, positioning: 'Builder, Operator' }).split('\r\n');
    expect(lines).toContain('TITLE:Builder\\, Operator');
  });

  it('puts a single-word name in the family slot and a comma-less location in locality', () => {
    const lines = buildVCard({ ...profile, name: 'Cher', location: 'Durham' }).split('\r\n');
    expect(lines).toContain('N:Cher;;;;');
    expect(lines).toContain('ADR;TYPE=WORK:;;;Durham;;;USA');
  });
});
