#!/bin/bash
# Monitor system resources during Playwright tests
# Usage: ./scripts/monitor-tests.sh

echo "=== System Resources Before Tests ==="
echo "Memory:"
free -h
echo ""
echo "CPU Load:"
uptime
echo ""
echo "Processes consuming most memory:"
ps aux --sort=-%mem | head -6
echo ""
echo "inotify watches (should be < max):"
cat /proc/sys/fs/inotify/max_user_watches
echo ""

# Check VS Code logs location
echo "=== VS Code Logs Location ==="
echo "~/.config/Code/logs/"
ls -la ~/.config/Code/logs/ 2>/dev/null | tail -5
echo ""

# Run tests with resource monitoring
echo "=== Running Tests ==="
echo "Starting at $(date)"

# Use timeout to prevent hanging
timeout 120 npx playwright test --reporter=line 2>&1

EXIT_CODE=$?
echo ""
echo "=== Tests completed at $(date) with exit code: $EXIT_CODE ==="
echo ""
echo "Memory after tests:"
free -h
