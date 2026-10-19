# Michael Herron: portfolio site

Personal portfolio for Michael Herron, Systems & Process Engineer. Next.js (App Router), TypeScript, Tailwind CSS 4
and Framer Motion, deployed on Vercel. Pages: home, about, skills, projects (with a case study per project),
approach, experience, contact, and `/card`, a conference contact card with a QR code and vCard.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Jest + React Testing Library
npm run lint
npm run build   # type check and prerender every page (not a static export)
```

## Content is data

No copy lives in components. Projects, skills, experience, the profile, the approach principles and the evidence
competencies are in `src/lib/data/`; pages render them. A jest content guard fails the suite if anything that must
not be public (private hostnames, IPs, phone numbers, tokens, TODOs) lands in `src/` or `public/`. Voice and rules
are in `docs/notes/brand.md`.

## How v2 was built

The v2 update was built overnight by a coding-agent harness: one fresh session per feature, an independent session
verifying each milestone, one pull request per verified milestone, and me merging. The case study is on the site at
[/projects/agent-harness](https://michael-herron.vercel.app/projects/agent-harness). The spec is
`docs/specs/2026-10-18-portfolio-v2.md` and the per-milestone plans are in `docs/plans/`.
