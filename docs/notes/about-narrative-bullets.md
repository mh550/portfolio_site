# About: narrative bullets for Michael (P1-04)

## Duke

- B.S. Computer Science with a Visual & Media Studies minor, Duke University, Durham, NC, graduated December 2024; coursework included Database Systems, Computer Security and Computer Systems (v3 spec § 8)

## Builder Clarity

- Founding full-stack software engineer at Builder Clarity, March 2025 to November 2025, its first engineer (v3 spec § 8)
- Architected a multi-tenant JobTread ↔ GoHighLevel integration platform with managed multi-org OAuth, replacing per-client builds: 3 clients, onboarding cut from ~2 days to ~6 hours (v3 spec § 8; brand.md metrics bank)
- Integrated CRM, VoIP (RingCentral) and internal systems, including a unified per-job communications log, saving ~8 hrs/week per client; built ETL normalizing 4+ sources into Postgres (v3 spec § 8; brand.md metrics bank)
- Led the move from Zapier to n8n and Pipedream (custom JS components), replacing per-client automations with reusable multi-tenant workflows (v3 spec § 8)

## MAXX Potential

- Full-stack software engineer at MAXX Potential since February 2026: React Native, Next.js, edge-function and Postgres features for a contractor estimating app, ~8 issues/week; recurring UI fixes codified into a knowledge source agents load as procedural memory (v3 spec § 8)
- Replaced siloed spreadsheet bug tracking with Linear and an agentic bug-fix workflow (CLI tooling and custom slash commands): 2× sprint throughput, ~80% less bug-filing time, no new software costs (v3 spec § 8; brand.md metrics bank)
- Split an over-scoped Copilot Studio JD agent into a manager agent and an HR agent so each context holds only its data (v3 spec § 8)

## The harness, the music server and the concierge

- Built a deterministic Bash harness that runs Claude Code agents in isolated git worktrees, takes tests, verification and merges out of the agent's hands, and merges only byte-identical verified trees; each feature gets a fresh context rebuilt from durable on-disk state (v3 spec § 8)
- The first two harness v2 runs (Oct 17): 55 features passing, 52 verified and merged through 12 PRs, +374 tests, ≈ $2.53 per passing feature; 189 features passed in 4 days at ~$3 each (docs/notes/evidence-agent-harness.md; v3 spec § 8)
- The harness broke its own rule: its usage-limit detector was tested against a message he had made up, so 45 sessions were "spent" in 6 minutes with 5 hours of budget left; the fix was a fixture captured from real CLI output (failure story) (docs/notes/evidence-agent-harness.md)
- On the music server a guessed fake hid 3 critical bugs in the download client, and every count matched (859 = 859 = 859) while 92 titles were still wrong on his phone; the rules: fakes mirror the live API, and every milestone ends by looking at the screen, not the counts (failure story) (docs/notes/evidence-media-server.md)
- Designed a voice concierge on LiveKit Agents for this site that talks about his work, remembers returning visitors by voice or text, and shows its memory and latency on the page; memory stays off the critical path, the visitor can see and erase it, and no latency or recall number is measured yet (docs/notes/evidence-voice-concierge.md)

## What he wants next

- Agentic systems work: harness and context engineering, durable agent memory, and verification agents can't bypass, on top of production multi-tenant integrations (v3 spec § 8)
