# Implementation Plan

## Milestone 0: Project Scaffolding & Infrastructure

- Initialize Next.js (App Router) with TypeScript, Tailwind CSS, ESLint
- Install dependencies: `framer-motion`
- Configure Tailwind theme: dark palette, electric blue/cyan accent colors, typography scale
- Set up project data layer: `lib/data/` with typed constants for projects, experience, skills (single source of truth for all page content)
- Create shared layout: `app/layout.tsx` with dark background, font loading, metadata
- Stub all routes with placeholder pages: `/`, `/about`, `/skills`, `/projects`, `/projects/[slug]`, `/experience`, `/contact`
- Set up test infrastructure: Jest + React Testing Library for unit/integration tests, `e2e/` directory for playwright-cli tests
- Verify: dev server starts, all routes return 200, lint passes, test runner works

**Tests:**
- Unit: data files export correct types/shapes
- E2E: every stubbed route loads without error

---

## Milestone 1: Navigation & Layout Shell

- Build responsive `Navbar` component: logo/name, links to all 6 sections, mobile hamburger menu
- Build `Footer` component: social links (GitHub, LinkedIn, email), copyright
- Wire navbar into `app/layout.tsx` so it appears on all pages
- Active link highlighting based on current route
- Mobile menu: slide-in or overlay with smooth open/close

**Tests:**
- Unit: Navbar renders all links with correct hrefs, Footer renders social links
- E2E: navigate to each route via navbar clicks, verify URL changes; open/close mobile menu

---

## Milestone 2: Hero Page (`/`)

- Full-viewport hero section with name ("Michael Herron") and tagline ("I build systems that connect things.")
- Animated visual hook: abstract node/connection graphic or animated gradient background (Framer Motion)
- Scroll-down indicator (animated chevron or similar)
- Ensure hero is responsive across breakpoints

**Tests:**
- Unit: Hero component renders name, tagline
- E2E: verify hero text visible on load, scroll indicator present, page is responsive at mobile/tablet/desktop widths

---

## Milestone 3: About Page (`/about`)

- Story-driven layout: arc, philosophy, personal touch sections from spec
- Framer Motion scroll-triggered reveals for each section block
- Placeholder for optional photo
- Approachable tone — no corporate feel

**Tests:**
- Unit: About component renders all content sections
- E2E: navigate to `/about`, verify key text present, scroll and confirm animation triggers

---

## Milestone 4: Skills Page (`/skills`)

- Visual grouped layout for 6 skill categories from spec data
- Each category rendered as a distinct card/section with category name and skill items
- "Integration & Automation" category gets visual emphasis (larger card, accent border, or icon treatment)
- Framer Motion staggered reveal animations per category

**Tests:**
- Unit: Skills component renders all 6 categories with correct items from data
- E2E: navigate to `/skills`, verify all categories visible, Integration & Automation visually distinct

---

## Milestone 5: Projects Page (`/projects`)

### 5a: Project Index

- Grid/list of project cards, each with: title, short description, tech stack tags, links (GitHub/demo)
- Category filter buttons (integration, full-stack, AI, etc.) — filter cards client-side
- Cards link to `/projects/[slug]` for featured projects

**Tests:**
- Unit: ProjectCard renders title, description, tags, links; filter logic returns correct subsets
- E2E: navigate to `/projects`, verify all 4 projects render, click filter and verify correct cards shown

### 5b: Project Detail Pages (`/projects/[slug]`)

- Dynamic route rendering project deep-dives from data
- Sections: problem, architecture/approach, challenges, outcome
- Tech stack tags, links
- Deep-dive content for GoHighLevel integration, Mirrored Google Calendars (per spec); simpler layouts for others
- 404 handling for invalid slugs

**Tests:**
- Unit: Detail page renders correct project data for each slug
- E2E: click a project card, verify detail page loads with correct content; navigate to invalid slug, verify 404

---

## Milestone 6: Experience Page (`/experience`)

- Timeline or card layout for roles: Builder Clarity, Tahoma Films, High Cascade
- Each role shows: title, company, dates, bullet points (outcomes-focused)
- Education section: Duke University with degree, GPA, honors, coursework
- Framer Motion scroll reveals per timeline entry

**Tests:**
- Unit: Experience component renders all roles and education from data
- E2E: navigate to `/experience`, verify all roles and education visible, scroll triggers animations

---

## Milestone 7: Contact Page (`/contact`)

- Email, LinkedIn, GitHub links prominently displayed
- Simple contact form (mailto link or client-side form with `mailto:` action)
- Clean, minimal layout — no friction

**Tests:**
- Unit: Contact component renders all links with correct hrefs
- E2E: navigate to `/contact`, verify email/LinkedIn/GitHub links present and clickable

---

## Milestone 8: Animations & Polish

- Audit all pages for consistent Framer Motion animations (scroll reveals, hover states, page transitions)
- Add page transition animations between routes
- Verify animation performance — no jank, respects `prefers-reduced-motion`
- Responsive audit: test all pages at mobile (375px), tablet (768px), desktop (1280px+)
- Lighthouse audit: target 90+ on Performance, Accessibility, Best Practices, SEO
- Fix any accessibility issues: focus management, color contrast, semantic HTML, alt text

**Tests:**
- E2E: full navigation flow through all pages, screenshot at each breakpoint
- E2E: verify `prefers-reduced-motion` disables animations

---

## Milestone 9: Deployment

- Configure `vercel.json` if needed
- Set up Vercel project, connect repo
- Verify production build succeeds locally (`npm run build`)
- Deploy to Vercel, verify all routes work in production
- Test OG metadata / social sharing previews

**Tests:**
- E2E: run full test suite against production URL
