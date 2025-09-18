#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "== Test All: starting unified test runner =="

# Start server if not running
SERVER_STARTED=0
if ! pgrep -f "node server.js" >/dev/null; then
  echo "Starting server in background..."
  nohup node server.js > .test-server.log 2>&1 &
  SERVER_PID=$!
  SERVER_STARTED=1
  echo "Server started (pid=$SERVER_PID), waiting for readiness..."
  for i in {1..30}; do
    if curl -sSf "http://localhost:3000/" >/dev/null 2>&1; then
      echo "Server is ready"
      break
    fi
    sleep 0.5
  done
else
  echo "Server already running"
fi

EXIT_CODE=0

echo "Running comprehensive CLI tests..."
if ./scripts/test-benefits-comprehensive.sh; then
  echo "Comprehensive tests passed"
else
  echo "Comprehensive tests failed" >&2
  EXIT_CODE=2
fi

echo "Running Puppeteer smoke test..."
if ./scripts/test-benefits-pw.sh; then
  echo "Puppeteer smoke test passed"
else
  echo "Puppeteer smoke test failed" >&2
  EXIT_CODE=3
fi

# If we started the server, leave it running but notify log location
if [ "$SERVER_STARTED" -eq 1 ]; then
  echo "Server was started by this runner. Logs: .test-server.log"
fi

exit $EXIT_CODE
