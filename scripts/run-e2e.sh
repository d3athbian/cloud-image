# E2E Test Scripts
# These scripts use Playwright CLI to run E2E tests against the demo

## Usage
# 1. Start the demo server in one terminal:
#    cd demos/cloud-demo && npm run dev
#
# 2. Run these tests:
#    playwright-cli run-e2e.sh

## Tests to run
# T024: Cache Hit
# T025: CLS Prevention
# T057: Offline Cache
# T058: Network Reconnection
# T065: Provider Context
# T066: Zero-Config
# T076: Auto-Eviction
# T086: Retry Behavior
# T087: Circuit Breaker
# T095: Memory Pressure
# T104: Bandwidth Triggers
# T105: Silent Upgrade
# T119: Progressive Loading