#!/bin/bash
# Stress Test Runner - Configurable image count
# Usage: ./scripts/run-stress-test.sh [COUNT]
# Counts: 10, 50, 100, 500

set -e

COUNT="${1:-100}"
BASE_URL="${2:-http://localhost:3000}"

# Validate count
VALID_COUNTS=(10 50 100 500)
if [[ ! " ${VALID_COUNTS[@]} " =~ " ${COUNT} " ]]; then
    echo "Error: Invalid count '$COUNT'"
    echo "Valid counts: ${VALID_COUNTS[*]}"
    exit 1
fi

echo "=== STRESS TEST RUNNER ==="
echo "Image Count: $COUNT"
echo "Base URL: $BASE_URL"
echo ""

# Create temp HTML with specified count
TEMP_HTML="/tmp/stress-test-${COUNT}.html"
cat > "$TEMP_HTML" << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Stress Test - $COUNT Images</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #1a1a2e; color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    img { width: 100%; height: auto; border-radius: 8px; }
    .stats { position: fixed; top: 10px; right: 10px; background: #0f3460; padding: 10px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Stress Test - $COUNT Images</h1>
  <div class="stats">
    <div>Loaded: <span id="loaded">0</span> / $COUNT</div>
    <div>Time: <span id="time">0</span>ms</div>
  </div>
  <div class="grid" id="grid"></div>
  <script>
    const grid = document.getElementById('grid');
    const loaded = document.getElementById('loaded');
    const time = document.getElementById('time');
    const start = performance.now();
    
    for (let i = 0; i < $COUNT; i++) {
      const img = document.createElement('img');
      img.src = 'https://picsum.photos/400/300?random=' + i;
      img.loading = 'lazy';
      img.onload = () => { loaded.textContent = parseInt(loaded.textContent) + 1; };
      img.onerror = () => { loaded.textContent = parseInt(loaded.textContent) + 1; };
      grid.appendChild(img);
    }
    
    setInterval(() => {
      time.textContent = Math.round(performance.now() - start);
    }, 100);
  </script>
</body>
</html>
EOF

echo "Starting local server on port 8888..."
cd /tmp
python3 -m http.server 8888 &
SERVER_PID=$!

sleep 2

echo "Opening stress test..."
open "http://localhost:8888/stress-test-${COUNT}.html"

echo ""
echo "Test running. Press Ctrl+C to stop server."
echo ""

# Wait for interrupt
trap "kill $SERVER_PID 2>/dev/null; rm -f $TEMP_HTML" EXIT
wait $SERVER_PID
