# Contracts: Worker-Main Thread Communication

## Public API (No external interfaces - internal optimization)

This is an internal library optimization. No public contracts needed.

## Internal Interfaces

### ServiceWorkerClient.postMessage

```typescript
interface WorkerRequest {
  type: "get" | "set" | "delete" | "clear" | "stats" | "init" | "destroy";
  payload?: unknown;
  transfer?: Transferable[];
}
```

### ServiceWorkerClient.onMessage

```typescript
interface WorkerResponse {
  type: "success" | "error";
  payload?: unknown;
  error?: string;
  transfer?: Transferable[];
}
```

---

## Testing Contracts

### Unit Test: Transferable Objects

- WorkerResponse includes ImageBitmap in transfer list
- Original buffer becomes neutered after transfer

### Unit Test: Batching

- Multiple requests batched into single WorkerResponse
- Batch interval configurable (default: 50ms)