#!/usr/bin/env bash
# Run by the harness before every session, in the run's worktree (HARNESS_PORT, HARNESS_SCRATCH are set).
# Deps, a headless browser, and a dev server on $HARNESS_PORT. Idempotent: stops the server the last session left.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=${HARNESS_PORT:-7831}
SCRATCH=${HARNESS_SCRATCH:-/tmp/harness/portfolio_site/manual}
PW=${HARNESS_PW:-/tmp/harness/pw}          # shared by every run; Playwright stays out of package.json
mkdir -p "$SCRATCH"

# package-lock changes mid-run (a new dependency) → reinstall
if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
  npm ci --no-audit --no-fund > "$SCRATCH/npm.log" 2>&1 || { tail -20 "$SCRATCH/npm.log"; exit 1; }
fi

[[ -d $PW/node_modules/playwright ]] || npm i --prefix "$PW" --no-audit --no-fund playwright@1 > /dev/null
ls ~/.cache/ms-playwright 2>/dev/null | grep -q '^chromium' || npx --prefix "$PW" playwright install chromium

if [[ -f $SCRATCH/server.pid ]]; then kill "$(cat "$SCRATCH/server.pid")" 2>/dev/null || true; sleep 1; fi
nohup npx next dev -p "$PORT" > "$SCRATCH/server.log" 2>&1 &
echo $! > "$SCRATCH/server.pid"

for _ in $(seq 1 120); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 0.5; done
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "dev server did not start — see $SCRATCH/server.log"; tail -20 "$SCRATCH/server.log"; exit 1; }
echo "server: http://localhost:$PORT (next dev) · log $SCRATCH/server.log · smoke: node .harness/smoke.mjs"
