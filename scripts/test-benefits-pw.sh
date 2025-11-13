#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Ensure server running
if ! pgrep -f "node server.js" >/dev/null; then
  echo "Starting server..."
  nohup node server.js > .pw-test-server.log 2>&1 &
  SERVER_PID=$!
  echo "Server started (pid=$SERVER_PID), waiting for readiness..."
  # wait for server to respond
  for i in {1..20}; do
    if curl -sSf "http://localhost:3000/" >/dev/null 2>&1; then
      echo "Server is ready"
      break
    fi
    sleep 0.5
  done
fi

# Run Playwright tests in tests/pw
echo "Running Playwright tests for tests/pw..."
# Use local Playwright CLI so this works even without .bin wrappers
node node_modules/@playwright/test/cli.js test tests/pw --project=chromium

# If we started the server, leave it running; logs are in .pw-test-server.log
exit 0
