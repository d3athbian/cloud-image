#!/bin/bash
# Cache Hit Test - Verify <50ms retrieval from cache
# Usage: ./scripts/cache-hit-test.sh

set -e

BASE_URL="${1:-http://localhost:3000}"
THRESHOLD_MS="${2:-50}"

echo "=== CACHE HIT TEST ==="
echo "Base URL: $BASE_URL"
echo "Threshold: ${THRESHOLD_MS}ms"
echo ""

# Check if playwright-cli is available
if ! command -v playwright &> /dev/null; then
    echo "Warning: playwright-cli not found. Using curl for basic test."
    echo "Install playwright: npm install -g playwright"
fi

# Start time measurement
START=$(date +%s%N)

# Request page (simulates cache miss first time)
echo "1. First request (cache miss)..."
curl -s "$BASE_URL" > /dev/null

# Request again (should be cache hit)
echo "2. Second request (cache hit)..."
START_HIT=$(date +%s%N)
curl -s "$BASE_URL" > /dev/null
END_HIT=$(date +%s%N)

# Calculate duration
DURATION_MS=$(( (END_HIT - START_HIT) / 1000000 ))

echo ""
echo "Results:"
echo "  Duration: ${DURATION_MS}ms"
echo "  Threshold: ${THRESHOLD_MS}ms"

if [ "$DURATION_MS" -lt "$THRESHOLD_MS" ]; then
    echo "  Status: ✅ PASS"
    exit 0
else
    echo "  Status: ❌ FAIL"
    exit 1
fi
