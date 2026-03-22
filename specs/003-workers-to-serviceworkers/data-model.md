# Data Model: Service Worker Image Cache

**Feature**: 003-workers-to-serviceworkers

## Entities

### 1. ImageCacheEntry

Represents a cached image in persistent storage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Unique identifier (image URL) |
| data | ArrayBuffer | Yes | Raw image bytes |
| metadata | CacheMetadata | Yes | Cache-related information |
| qualityTier | 'low' \| 'medium' \| 'high' | Yes | Image quality level |
| upgradeable | boolean | Yes | Can upgrade to higher quality |
| cachedBandwidth | number | No | Bandwidth when cached |
| expiresAt | number | No | Expiration timestamp |

### 2. CacheMetadata

Metadata for a cached entry.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| size | number | Yes | Size in bytes |
| width | number | No | Decoded image width |
| height | number | No | Decoded image height |
| mimeType | string | Yes | MIME type (image/jpeg, etc.) |
| cachedAt | number | Yes | Cache timestamp (ms) |
| accessedAt | number | Yes | Last access timestamp |
| accessCount | number | Yes | Number of times accessed |
| etag | string | No | HTTP ETag header |
| lastModified | string | No | HTTP Last-Modified header |

### 3. CacheConfig

Configuration for cache behavior.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| maxSize | number | 100MB | Maximum cache size |
| defaultTTL | number | 7 days | Default time-to-live |
| memoryTierSize | number | 20MB | Memory tier size |
| platformOverride | string | auto | Platform detection override |
| debug | boolean | false | Debug logging |
| maxRetries | number | 3 | Max retry attempts |
| requestTimeout | number | 10s | Request timeout |

### 4. CacheStats

Current cache state metrics.

| Field | Type | Description |
|-------|------|-------------|
| itemCount | number | Number of cached items |
| totalSize | number | Total bytes used |
| hitRate | number | Cache hit ratio (0-1) |
| missRate | number | Cache miss ratio (0-1) |
| evictionCount | number | Total evictions performed |

### 5. NetworkStatus

Network condition indicators.

| Field | Type | Description |
|-------|------|-------------|
| online | boolean | Network connectivity |
| bandwidth | 'low' \| 'medium' \| 'high' \| 'unknown' | Bandwidth classification |
| mbps | number | Estimated Mbps |
| rtt | number | Round-trip time in ms |

### 6. ServiceWorkerMessage

Message from main thread to Service Worker.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique message ID |
| type | MessageType | Yes | Operation type |
| payload | unknown | No | Operation payload |
| timestamp | number | Yes | Message timestamp |

### 7. ServiceWorkerResponse

Response from Service Worker to main thread.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Matching message ID |
| type | 'success' \| 'error' | Yes | Result type |
| payload | unknown | No | Response data |
| error | string | No | Error message if failed |
| timestamp | number | Yes | Response timestamp |

### 8. MessageType (Enum)

Supported Service Worker operations.

```
fetch      - Fetch image from network/cache
cache-get  - Get cached entry
cache-set  - Store image in cache  
cache-delete - Remove from cache
cache-clear - Clear all cached items
stats      - Get cache statistics
ping       - Health check
init       - Initialize cache
destroy    - Clean up resources
```

## Validation Rules

1. **CacheEntry.url**: Must be valid URL string, non-empty
2. **CacheEntry.data**: Must be valid ArrayBuffer, size > 0
3. **CacheMetadata.size**: Must be positive number
4. **CacheConfig.maxSize**: Must be >= 1MB, <= 1GB
5. **CacheConfig.defaultTTL**: Must be >= 1 minute, <= 365 days
