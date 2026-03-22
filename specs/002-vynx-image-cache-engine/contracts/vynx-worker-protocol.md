# Contract: VYNX Worker Protocol

**Contract ID**: vynx-worker-protocol  
**Version**: 1.0.0  
**Feature**: 002-vynx-image-cache-engine

---

## Overview

The Worker handles all I/O operations (network fetch, storage read/write) off the main thread. Communication uses structured messages with a request-response pattern.

---

## Message Structure

### Base Message

```typescript
interface BaseMessage {
  /** Unique message ID (UUID) */
  id: string;
  
  /** Message type */
  type: MessageType;
  
  /** Payload (type-specific) */
  payload: unknown;
  
  /** Unix timestamp */
  timestamp: number;
}

type MessageType = 
  | 'get'           // Get cached entry
  | 'set'           // Store entry
  | 'delete'        // Delete entry
  | 'clear'         // Clear all
  | 'prefetch'      // Prefetch URLs
  | 'stats'         // Get statistics
  | 'config'        // Update config
  | 'ping'          // Health check
  | 'destroy';      // Cleanup
```

### Response Structure

```typescript
interface WorkerResponse {
  /** Matching message ID */
  id: string;
  
  /** Success flag */
  success: boolean;
  
  /** Response data (on success) */
  data?: unknown;
  
  /** Error message (on failure) */
  error?: string;
  
  /** Processing duration in ms */
  duration: number;
}
```

---

## Message Definitions

### 1. GET Message

Request cached entry by URL.

```typescript
interface GetPayload {
  url: string;
  options?: {
    /** Return transferable ArrayBuffer */
    transfer?: boolean;
    /** Include metadata only */
    metadataOnly?: boolean;
  };
}

// Response: CacheEntry | null
```

### 2. SET Message

Store entry in cache.

```typescript
interface SetPayload {
  url: string;
  data: ArrayBuffer;
  metadata: {
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    etag?: string;
    lastModified?: string;
  };
  options?: {
    /** Skip validation */
    skipValidation?: boolean;
  };
}

// Response: { success: true }
```

### 3. DELETE Message

Delete specific entry.

```typescript
interface DeletePayload {
  url: string;
}

// Response: { deleted: boolean }
```

### 4. CLEAR Message

Clear entire cache.

```typescript
// No payload

// Response: { cleared: number } // entries cleared
```

### 5. PREFETCH Message

Prefetch multiple URLs in background.

```typescript
interface PrefetchPayload {
  urls: string[];
  options?: {
    /** Priority 1-10 */
    priority?: number;
    /** Parallelism limit */
    concurrency?: number;
    /** Continue on error */
    ignoreErrors?: boolean;
  };
}

// Response: { started: number } // urls queued
// Updates: Progress messages as each completes
```

### 6. STATS Message

Get cache statistics.

```typescript
// No payload

interface StatsData {
  itemCount: number;
  totalSize: number;
  memorySize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  resetAt: number;
}

// Response: StatsData
```

### 7. CONFIG Message

Update runtime configuration.

```typescript
interface ConfigPayload {
  maxSize?: number;
  defaultTTL?: number;
  memoryTierSize?: number;
  debug?: boolean;
}

// Response: { updated: boolean }
```

### 8. PING Message

Health check / keepalive.

```typescript
// No payload

// Response: { pong: true, uptime: number }
```

### 9. DESTROY Message

Cleanup and terminate.

```typescript
// No payload

// Response: { destroyed: true }
// Side effects: Close connections, revoke URLs, terminate
```

---

## Progress Events

For long-running operations (prefetch), the Worker emits progress updates.

```typescript
interface ProgressEvent {
  type: 'progress';
  id: string; // Original request ID
  data: {
    completed: number;
    total: number;
    currentUrl: string;
    failed?: string[];
  };
}
```

---

## Error Handling

### Worker-Side Errors

```typescript
interface WorkerError {
  id: string;
  success: false;
  error: string;
  code: ErrorCode;
  recoverable: boolean;
}

type ErrorCode = 
  | 'STORAGE_ERROR'      // IndexedDB/FileSystem failure
  | 'NETWORK_ERROR'      // Fetch failed
  | 'VALIDATION_ERROR'   // Invalid payload
  | 'QUOTA_EXCEEDED'     // Storage full
  | 'UNKNOWN';           // Unexpected
```

### Error Recovery

| Code | Recovery Action |
|------|-----------------|
| `NETWORK_ERROR` | Retry with exponential backoff |
| `QUOTA_EXCEEDED` | Trigger eviction, retry |
| `STORAGE_ERROR` | Fall back to memory adapter |
| `VALIDATION_ERROR` | Reject immediately |
| `UNKNOWN` | Log, attempt graceful degradation |

---

## Performance Requirements

| Operation | Target | Maximum |
|-----------|--------|---------|
| GET (memory) | <1ms | <5ms |
| GET (disk) | <10ms | <50ms |
| SET | <5ms | <20ms |
| PING | <1ms | <5ms |
| Message overhead | <0.5ms | <2ms |

---

## Security Considerations

1. **CSP Compliance**: Worker code embedded via Blob URL (no eval)
2. **URL Validation**: All URLs validated before network requests
3. **Size Limits**: Individual entry size capped at 50MB
4. **Origin Validation**: Only allow same-origin or CORS-enabled images

---

## Protocol Versioning

The protocol includes a version for compatibility.

```typescript
// First message on connect
interface HandshakeMessage {
  type: 'handshake';
  payload: {
    version: string;
    capabilities: string[];
  };
}
```

---

## Example Flows

### Cache Hit Flow

```
Main Thread                    Worker
     |                            |
     | -- GET (url) ------------> |
     |                            | Check memory tier
     |                            | Check disk tier
     | <-- RESPONSE (entry) ------ |
     |                            |
```

### Prefetch Flow

```
Main Thread                    Worker
     |                            |
     | -- PREFETCH (urls) -------> |
     | <-- STARTED (3) ----------- |
     |                            | Fetch url1
     | <-- PROGRESS (1/3) -------- |
     |                            | Fetch url2
     | <-- PROGRESS (2/3) -------- |
     |                            | Fetch url3
     | <-- PROGRESS (3/3) -------- |
     |                            |
```

### Error Flow

```
Main Thread                    Worker
     |                            |
     | -- SET (large) -----------> |
     |                            | Check quota
     |                            | Quota exceeded
     | <-- ERROR (quota) --------- |
     |                            |
     | -- CONFIG (evict) --------> |
     | -- SET (retry) -----------> |
     | <-- SUCCESS --------------- |
```
