# Quickstart: Worker-Main Thread Communication Optimization

## Overview

This optimization reduces data transfer between the Service Worker and main thread by:
1. Using Transferable objects for zero-copy ImageBitmap transfers
2. Batching multiple image responses into single messages

## Usage

No API changes - optimization is automatic and internal.

## Configuration

No new configuration options needed.

## Monitoring

Use existing DevTools:
- Debugger Panel → Cache tab shows transfer stats
- Debugger Panel → Network tab shows message count

## Testing

```bash
npm test -- --grep "worker.*transfer|batch"
```

## Performance Targets

- Image display: <100ms latency
- Transfer reduction: 60%+ (measured via DevTools)
- FPS: 60 during image loading