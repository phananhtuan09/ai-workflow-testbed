#!/bin/bash
# Installs npm dependencies in Claude Code cloud sessions so lint, tests,
# and Playwright runs work without a manual install step.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund
