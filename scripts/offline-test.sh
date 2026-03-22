#!/bin/bash
# Offline Test - Verify cached images visible when offline
# Usage: ./scripts/offline-test.sh [BASE_URL]

set -e

BASE_URL="${1:-http://localhost:3000}"

echo "=== OFFLINE TEST ==="
echo "Base URL: $BASE_URL"
echo ""

echo "Manual test instructions:"
echo ""
echo "1. Start the demo app:"
echo "   cd demos/cloud-demo && npm install && npm run dev"
echo ""
echo "2. Open browser and load page (cache miss):"
echo "   open $BASE_URL"
echo ""
echo "3. Wait for all images to load"
echo ""
echo "4. Enable offline mode in browser:"
echo "   - Chrome DevTools > Network > Offline"
echo "   - Or: Chrome DevTools > Application > Service Workers > Offline"
echo ""
echo "5. Reload page (should still show cached images)"
echo ""
echo "Expected behavior:"
echo "  ✅ Images still visible (loaded from cache)"
echo "  ❌ Broken image icons (cache not working)"
echo ""
echo "Automated verification with playwright-cli:"
echo "  playwright screenshot --url $BASE_URL --offline"
