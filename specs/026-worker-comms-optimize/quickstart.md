# Quickstart: Worker-Main Thread Communication Optimization

## Overview

This optimization reduces data transfer between the Service Worker and main thread by:
1. Using Transferable objects for zero-copy ArrayBuffer transfers
2. Compressing payload metadata before transfer

## Usage

No API changes - optimization is automatic and internal.

## Implementation Details

- **Transferable Objects**: When `cache-get` returns image data, the ArrayBuffer is transferred using `postMessage({transfer: [buffer]})` for zero-copy performance
- **Compression**: Payload metadata is compressed when size > 1024 bytes to reduce transfer overhead

## Configuration

No new configuration options needed.

## Monitoring

Use DevTools:
- Network tab → Observe transferred bytes vs cached size
- Performance tab → Measure image display latency

## Testing

```bash
npm run typecheck  # Verify TypeScript compiles
npm run build       # Verify build passes
npm test           # Run unit tests
```

## Performance Targets

- Image display: <100ms latency (from worker response to on-screen)
- Transfer reduction: Achieved via Transferable objects (zero-copy for ArrayBuffer)
- FPS: 60 maintained during image loading