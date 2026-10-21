export interface Profile {
  name: string;
  positioning: string;
  tagline: string;
  subline: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  siteUrl: string;
  headshot: string;
  // One line shown above Selected work on /card; '' renders nothing (docs/conference-kit.md)
  conferenceNote: string;
}

// The single source of contact and positioning facts (docs/notes/brand.md). No phone number (D5).
export const profile: Profile = {
  name: 'Michael Herron',
  positioning: 'Agentic Systems Engineer',
  tagline: 'I build simple, elegant systems that fit the humans who run them.',
  subline: 'I build the harnesses, memory and verification around AI agents, and the integrations they run on.',
  location: 'Durham, NC',
  email: 'mherron734@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mherron734/',
  github: 'https://github.com/mh550',
  siteUrl: 'https://michael-herron.vercel.app',
  headshot: '/photos/headshot.png',
  conferenceNote: '',
};
