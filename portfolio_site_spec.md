# Project Description

A bold, expressive portfolio website to showcase my work, skills, and professional history as a full-stack developer and automation/integration engineer. The site serves as a living portfolio for potential employers, peers, hackathon teammates, and the broader developer community.

This project doubles as a learning exercise in modern web development, built with AI-assisted development workflows and deployed on Vercel.

## Target Audience

- Potential employers & recruiters
- Peers & potential hackathon teammates
- Fellow software developers
- Anyone curious about my work

## Design Direction

- **Vibe:** Bold & expressive — strong visual identity, memorable design, purposeful animations
- **Structure:** Multi-page with dedicated routes for each major section
- **Interactions:** Scroll-triggered animations (Framer Motion) for section reveals, element transitions, and visual storytelling
- **Typography:** Strong, modern type hierarchy — large headings, clean body text
- **Color:** Dark background with an electric accent palette (electric blue, cyan, or similar high-energy tone). Should feel modern and technical without being cold.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Deployment:** Vercel
- **Dev workflow:** AI-assisted (Claude Code)

---

# Website Sections

## 1. Hero / Landing (`/`)

The first impression. Should communicate who I am in ~5 seconds.

- **Name:** Michael Herron
- **Tagline:** "I build systems that connect things." — captures the integration/automation focus while staying broad enough for full-stack work
- Bold visual hook — animated gradient, geometric shapes, or kinetic typography. Consider an abstract node/connection visual that echoes the "connecting systems" theme.
- Clear navigation to all other sections
- Subtle scroll indicator to encourage exploration

## 2. About (`/about`)

A brief, human introduction — not a resume, but a story.

- **The arc:** Duke CS grad (B.S. Computer Science, Visual & Media Studies Minor) who was hired as the first engineer at a startup and learned to build scalable systems from scratch. Driven by user-centered design — rejects the notion of "user error" in favor of better systems.
- **Philosophy:** Transforming complex, scattered processes into reliable, intuitive systems. Designing for the user first.
- **Personal touch:** Snowboarder, skateboarder, wakeboarder. Coached snowboarding at High Cascade Snowboard Camp for two summers — mentoring translates to how he approaches collaboration and communication.
- Optional: a photo
- Should feel approachable and genuine — not corporate

## 3. Skills & Tech Stack (`/skills`)

A visual, organized overview of technical capabilities.

- Grouped by domain:
  - **Languages:** Python, JavaScript, TypeScript, Java, C/C++, Ruby, R
  - **Frontend:** React, Next.js, Tailwind CSS
  - **Backend:** Node.js, Flask, Ruby on Rails, PostgreSQL, MongoDB
  - **Integration & Automation:** Pipedream, n8n, Zapier, RESTful APIs, OAuth, Webhooks
  - **Tools & Platforms:** Supabase, Vercel, Git, Linux CLI, Claude Code
  - **Practices:** AGILE/Scrum, user-driven design, AI-assisted development
- Not just a flat list — use visual grouping, icons, or interactive elements
- The "Integration & Automation" category is a differentiator — give it visual weight

## 4. Projects (`/projects`)

The centerpiece of the site. Showcases professional projects and personal builds.

- Each project gets a card with:
  - Title and short description
  - Screenshot, architecture diagram, or demo preview
  - Tech stack used (as tags/badges)
  - Links: GitHub repo, live demo (where applicable)
- Filterable or categorizable by domain (integration, full-stack, AI, etc.)
- Individual project pages (`/projects/[slug]`) for deep-dives on key projects

### Featured Projects

**GoHighLevel ↔ JobTread Integration (Builder Clarity)** — *Primary showcase*
- Multi-tenant, bidirectional integration between GoHighLevel (CRM) and JobTread (project management software for contractors)
- Designed bidirectional data mapping across hierarchical data structures
- Implemented waterfall smart record matching to prevent duplicate records
- Built with Pipedream, using custom JavaScript components for nearly every step
- Managed multi-tenant auth: Agency OAuth token for GoHighLevel (with subaccount token logic), Connected Organizations for JobTread
- Refined mapping strategy mid-milestone to meet dynamic stakeholder requirements
- Deep-dive page should walk through: the problem (contractors using disconnected tools), the architecture, the data mapping challenge, and the outcome

**RingCentral ↔ JobTread Integration (Builder Clarity)**
- Synced calls and texts from RingCentral (VoIP) into JobTread contact threads
- Smart matching: each call/text matched to one or multiple JobTread contacts
- Established a single source of truth for contractor communications
- Started on Zapier, hit platform limitations, led the migration to n8n

**Mirrored Google Calendars (Freelance)**
- Inherited a broken codebase; diagnosed architectural flaws and rebuilt from scratch
- Google Calendar sync app that mirrors events from source to destination calendars for availability blocking
- Built with Supabase + Next.js backend, Pipedream Connect API for managed auth
- Deep-dive page should cover: inheriting bad code, the redesign decisions, and the final architecture

**Cherished (Duke University)**
- Wellness-centered social media platform, built in an AGILE team
- Implemented messaging, profile management, search, and email notifications
- MongoDB + Next.js stack
- Focus on UX design and scalable backend

## 5. Experience (`/experience`)

Professional history — concise and impact-focused.

- Timeline or card-based layout showing roles, companies, and dates
- Each role emphasizes outcomes, not job descriptions

### Roles

**Founding Full-Stack Software Engineer, Builder Clarity** — *March 2025 – November 2025*
- First engineer hired. Drove strategic pivot from custom per-client automation to scalable, product-based integration solutions.
- Architected multi-tenant integrations: GoHighLevel ↔ JobTread, RingCentral ↔ JobTread
- Led technical migration from Zapier to n8n and Pipedream — reduced technical debt, enabled rapid prototyping
- Self-directed AGILE using Linear for sprint planning and stakeholder communication

**AI Workflow Engineer, Tahoma Films** — *February 2025*
- Refined AI image generation workflows using Invoke.AI (control nets, denoising, regional guidance)
- Trained LoRAs for art style and character consistency across generated images

**Snowboard Coach, High Cascade Snowboard Camp** — *Summers 2023 & 2024*
- Mentored 12–18 snowboarders per session; designed targeted drills, prioritized safe progression
- *(Include briefly — shows coaching, mentorship, and communication skills)*

### Education

**Duke University** — B.S. Computer Science, Visual & Media Studies Minor — *Graduated December 2024*
- GPA: 3.3
- George Scholar, Duke True North Leadership Program
- Relevant coursework: Algorithm Design & Analysis, Database Systems, Computer Security, Server-side Web Apps, Data Science, AGILE

## 6. Contact (`/contact`)

Clear call to action for anyone who wants to connect.

- **Email:** mherron734@gmail.com
- **LinkedIn:** linkedin.com/in/mherron734
- **GitHub:** link to GitHub profile
- Simple contact form or mailto link
- Keep it simple — no friction

---

# Future Considerations (Not in v1)

- **Blog:** Technical writing, tutorials, project retrospectives
- **Testimonials/endorsements:** Quotes from colleagues or collaborators
- **Resume download:** PDF export of a styled resume
- **Analytics:** Vercel Analytics or Plausible for visitor insights
- **CMS integration:** Headless CMS for managing project content without code changes
- **AI Agents section:** As AI agent work grows, could become its own showcase category
