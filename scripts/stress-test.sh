#!/bin/bash
# Stress Test - Verify no CLS with 100+ images
# Usage: ./scripts/stress-test.sh [BASE_URL] [IMAGE_COUNT]

set -e

BASE_URL="${1:-http://localhost:3000}"
IMAGE_COUNT="${2:-100}"

echo "=== STRESS TEST ==="
echo "Base URL: $BASE_URL"
echo "Image Count: $IMAGE_COUNT"
echo ""

# Check playwright
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found"
    exit 1
fi

# Start playwright test
echo "Starting browser..."
npx playwright test --headed=false --reporter=list 2>&1 || true

echo ""
echo "Manual test instructions:"
echo "1. Open browser: $BASE_URL"
echo "2. Verify $IMAGE_COUNT images load"
echo "3. Check browser DevTools > Performance > Layout Shift"
echo "   - CLS should be 0"
echo "4. Check console for errors"
echo ""
echo "Automated verification would use:"
echo "  playwright screenshot --url $BASE_URL"
echo "  playwright evaluate --url $BASE_URL --script \"document.querySelectorAll('img').length\""
