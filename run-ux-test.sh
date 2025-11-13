#!/bin/bash

# Start server in background
echo "Starting server..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run the UX test
echo "Running UX test..."
node test-benefits-ux-comprehensive.js

# Cleanup
kill $SERVER_PID 2>/dev/null