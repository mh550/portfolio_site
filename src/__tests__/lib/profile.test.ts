import { profile, type Profile } from '@/lib/data';

describe('profile data', () => {
  it('has the exact contact and positioning facts from brand.md', () => {
    const expected: Profile = {
      name: 'Michael Herron',
      positioning: 'Agentic Systems Engineer',
      tagline: 'I build simple, elegant systems that fit the humans who run them.',
      subline:
        'I build the harnesses, memory and verification around AI agents, and the integrations they run on.',
      location: 'Durham, NC',
      availability: 'open to remote, hybrid or relocation',
      email: 'mherron734@gmail.com',
      linkedin: 'https://www.linkedin.com/in/mherron734/',
      github: 'https://github.com/mh550',
      siteUrl: 'https://michael-herron.vercel.app',
      headshot: '/photos/headshot.png',
      conferenceNote: '',
    };
    expect(profile).toEqual(expected);
  });

  it.each([
    ['name', 'Michael Herron'],
    ['positioning', 'Agentic Systems Engineer'],
    ['tagline', 'I build simple, elegant systems that fit the humans who run them.'],
    [
      'subline',
      'I build the harnesses, memory and verification around AI agents, and the integrations they run on.',
    ],
    ['location', 'Durham, NC'],
    ['availability', 'open to remote, hybrid or relocation'],
    ['email', 'mherron734@gmail.com'],
    ['linkedin', 'https://www.linkedin.com/in/mherron734/'],
    ['github', 'https://github.com/mh550'],
    ['siteUrl', 'https://michael-herron.vercel.app'],
    ['headshot', '/photos/headshot.png'],
    ['conferenceNote', ''],
  ] as const)('%s is %p', (key, value) => {
    expect(profile[key]).toBe(value);
  });
});
