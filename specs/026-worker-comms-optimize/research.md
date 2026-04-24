# Research: Worker-Main Thread Communication Optimization

## Decision: Use Transferable Objects + Compression + Batching

### Key Technologies

1. **Transferable Objects**
   - Decision: Use for ImageBitmap transfers
   - Rationale: Zero-copy transfer, existing API in all modern browsers
   - Implementation: Add to transfer list in postMessage calls

2. **Compression**
   - Decision: Use fast serialization (structured clone is already efficient)
   - Rationale: metadata is small, compression overhead may exceed benefit
   - Alternative considered: LZ4/fflate - rejected because overhead > benefit for small payloads

3. **Batching**
   - Decision: Batch multiple images per message
   - Rationale: Reduces message overhead from N to ~N/10 messages
   - Implementation: Use queue with flush interval or size threshold

### Existing Code Analysis

- WorkerMessage/WorkerResponse types in `packages/cloud/src/core/types.ts`
- Service Worker in `packages/cloud/src/service-worker/sw.ts`
- Existing postMessage usage in ServiceWorkerClient

### Best Practices

- Transfer only what's needed (display-ready vs raw data)
- Use requestIdleCallback for non-critical batches
- Monitor with existing DevTools (already has Cache/Network tabs)

---

## Research Complete

No NEEDS CLARIFICATION needed - all technical choices determined from existing codebase.