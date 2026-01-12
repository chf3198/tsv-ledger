#!/bin/bash

echo "🔍 TSV LEDGER EXTERNAL BROWSER TESTING SCRIPT"
echo "=============================================="
echo ""
echo "This script will open the TSV Ledger app in your external browser"
echo "and guide you through testing the hamburger menu functionality."
echo ""
echo "📍 EXTERNAL DRIVE ANALYSIS:"
echo "Your repo is located at: /mnt/chromeos/removable/Drive/repos/tsv-ledger"
echo "This can cause issues with:"
echo "- File permissions and symlinks (EACCES errors)"
echo "- Browser security policies blocking external drive access"
echo "- Chrome/Chromium display issues in ChromeOS environment"
echo ""

# Check if server is running
echo "🔧 Checking server status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:3000"
else
    echo "❌ Server is not running. Please start it with: node server.js"
    exit 1
fi

echo ""
echo "🌐 Opening TSV Ledger in external browser..."
echo "If the browser doesn't open automatically, manually navigate to: http://localhost:3000"
echo ""

# Try different methods to open browser
if command -v xdg-open >/dev/null 2>&1; then
    timeout 5 xdg-open http://localhost:3000 2>/dev/null &
elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome http://localhost:3000 --new-window --no-sandbox --disable-dev-shm-usage 2>/dev/null &
elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser http://localhost:3000 --new-window --no-sandbox --disable-dev-shm-usage 2>/dev/null &
else
    echo "⚠️  No browser found. Please manually open: http://localhost:3000"
fi

echo ""
echo "📋 MANUAL TESTING INSTRUCTIONS:"
echo "================================"
echo ""
echo "1. DASHBOARD SECTION:"
echo "   ✅ Verify the page loads with 'TSV Ledger' title"
echo "   ✅ Look for hamburger menu button (☰) in top navigation"
echo "   ✅ Click the hamburger button - sidebar should slide in from left"
echo "   ✅ Verify navigation links are visible (Dashboard, Bank Reconciliation, etc.)"
echo "   ✅ Click hamburger again - sidebar should slide out"
echo ""
echo "2. NAVIGATION TEST:"
echo "   ✅ Click 'Bank Reconciliation' in the sidebar"
echo "   ✅ Page should navigate to Bank Reconciliation section"
echo "   ✅ URL should change to #bank-reconciliation"
echo ""
echo "3. HAMBURGER IN NEW SECTION:"
echo "   ✅ Click hamburger button again"
echo "   ✅ Sidebar should open (this was previously broken)"
echo "   ✅ All navigation links should be visible"
echo "   ✅ Click hamburger to close sidebar"
echo ""
echo "4. CROSS-SECTION TESTING:"
echo "   ✅ Navigate to 'Subscription Analysis' section"
echo "   ✅ Test hamburger menu there"
echo "   ✅ Navigate to 'Geographic Analysis' section"
echo "   ✅ Test hamburger menu there"
echo ""
echo "🎯 EXPECTED RESULTS:"
echo "===================="
echo "✅ Hamburger menu works in ALL sections (Dashboard, Bank Rec, Subscription, etc.)"
echo "✅ Sidebar opens/closes smoothly with animation"
echo "✅ Navigation between sections works correctly"
echo "✅ No JavaScript errors in browser console"
echo ""
echo "🔧 TECHNICAL FIX APPLIED:"
echo "========================="
echo "Fixed CSS rule in public/index.html:"
echo "- Removed: visibility: visible !important (always visible)"
echo "- Added: visibility: hidden when .show class not present"
echo "- Added: visibility: visible only when .show class is present"
echo ""
echo "This allows Bootstrap's offcanvas JavaScript to properly control sidebar visibility."
echo ""
echo "📊 TEST STATUS: Ready for manual testing"
echo "========================================="
echo "Please perform the above tests and report results!"