#!/usr/bin/env bash
# The suite the harness gates on: lint, unit/integration tests, and a production build.
# The build matters here: it type-checks, prerenders every /projects/[slug], and fails on a bad import.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -d node_modules ]] || npm ci --no-audit --no-fund > /dev/null
npx eslint
npx jest --silent
# A separate dist dir so the build never clobbers .next that the init server is serving from
NEXT_DIST_DIR=.next-check npx next build > /tmp/harness-portfolio-build.$$.log 2>&1 \
  || { tail -40 /tmp/harness-portfolio-build.$$.log; rm -f /tmp/harness-portfolio-build.$$.log; exit 1; }
rm -f /tmp/harness-portfolio-build.$$.log
echo "check: lint ok · jest ok · build ok"
