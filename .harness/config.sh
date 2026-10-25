# .harness/config.sh — portfolio_site settings for the agent harness (~/projects/agent-harness).
# The run's scope is the spec + brief passed to `harness start/queue add`; this file is only what differs from defaults.
POLICY=build-only
# Pushing main deploys production on Vercel. Each verified milestone becomes a PR (with a Vercel preview URL);
# Michael merges = Michael deploys. Nothing reaches the live site overnight.
MERGE_POLICY=pr
MAIN_BRANCH=main

SPEC_FILES="docs/specs/2026-10-21-portfolio-v3.md docs/decisions.md docs/specs/2026-10-18-portfolio-v2.md docs/notes/brand.md docs/notes/evidence-agent-harness.md docs/notes/evidence-hit-list.md docs/notes/evidence-media-server.md"
CHECK_CMD=".harness/check.sh"          # lint + jest + next build (build catches type errors and broken static params)
INIT_CMD=".harness/init.sh"            # deps, Playwright, a production server on $HARNESS_PORT
SMOKE_CMD="node .harness/smoke.mjs"    # every route at 1280/390: no page errors, no horizontal scroll at 390
BASE_PORT=7831

HOURS=14                               # bounded by `--until` on the queue anyway
MAX_ATTEMPTS=2
MAX_VERIFY_ROUNDS=2
