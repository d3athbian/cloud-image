# Contracts: Main Thread ↔ Service Worker API

**Feature**: 003-workers-to-serviceworkers

## Overview

Communication between the main application thread and Service Worker uses structured messages via `postMessage` API.

## Message Flow

```
Main Thread                    Service Worker
    |                               |
    |──── fetch ──────────────────>|
    |                               |
    |<─── success/error ───────────|
    |                               |
```

## Request Message Schema

```typescript
interface SWRequest {
  id: string;           // UUID for matching response
  type: MessageType;   // Operation to perform
  payload?: unknown;   // Operation-specific data
  timestamp: number;   // Unix timestamp (ms)
}

type MessageType = 
  | 'fetch'      // Fetch image from network/cache
  | 'cache-get'  // Get cached entry by URL
  | 'cache-set'  // Store image in cache
  | 'cache-delete' // Remove image from cache
  | 'cache-clear'  // Clear entire cache
  | 'stats'     // Get cache statistics
  | 'ping'       // Health check
  | 'init'       // Initialize cache
  | 'destroy';   // Clean up resources
```

## Response Message Schema

```typescript
interface SWResponse {
  id: string;          // Matches request ID
  type: 'success';     // Result type
  payload?: unknown;   // Operation result
  timestamp: number;   // Unix timestamp (ms)
}

interface SWError {
  id: string;          // Matches request ID
  type: 'error';       // Error indicator
  error: string;       // Error message
  timestamp: number;   // Unix timestamp (ms)
}
```

## Payload Types by Operation

### fetch

**Request payload:**
```typescript
{
  url: string;           // Image URL to fetch
  options?: {
    preferCache?: boolean;  // Default: true
    timeout?: number;       // Request timeout (ms)
  };
}
```

**Success response payload:**
```typescript
{
  blobUrl: string;       // Object URL for image
  fromCache: boolean;    // Was served from cache
  size: number;          // Size in bytes
  mimeType: string;      // Image MIME type
}
```

### stats

**Request payload:** none

**Success response payload:**
```typescript
{
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}
```

### cache-set

**Request payload:**
```typescript
{
  url: string;
  data: ArrayBuffer;      // Image bytes (Transferable)
  metadata: {
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    etag?: string;
  };
}
```

**Success response payload:**
```typescript
{
  stored: boolean;
  evictedCount?: number;
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| E001 | UNSUPPORTED | Service Worker not supported |
| E002 | NETWORK_ERROR | Fetch failed |
| E003 | CACHE_ERROR | Cache operation failed |
| E004 | TIMEOUT | Request timed out |
| E005 | INVALID_URL | Invalid image URL |
| E006 | QUOTA_EXCEEDED | Storage quota exceeded |

## Transport

- Uses `navigator.serviceWorker.controller.postMessage()`
- Supports `Transferable` objects for ArrayBuffer (zero-copy)
- Messages queued if Service Worker not ready
- Timeout: 30 seconds default
