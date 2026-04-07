# Data Model: Demo Testing Infrastructure

## Entities

### TestImage

Represents a test image from picsum.photos used in the demo.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (e.g., "0", "1") |
| author | string | Image author name |
| width | number | Original image width |
| height | number | Original image height |
| url | string | Unsplash source URL |
| download_url | string | Picsum download URL with dimensions |

**Validation Rules**:
- id must be non-empty string
- download_url must be valid HTTP URL

---

### CacheScenario

Represents a testing scenario for cache behavior.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Scenario identifier (e.g., "initial-load", "refresh") |
| description | string | Human-readable description |
| steps | string[] | Manual verification steps |

**States**: N/A (static configuration)

---

### DevToolsVerification

Represents a manual verification checkpoint in DevTools.

| Field | Type | Description |
|-------|------|-------------|
| panel | string | DevTools panel name (Application, Performance, Console) |
| check | string | What to verify |
| expected | string | Expected result |

---

## Relationships

```
TestImage (used by)
  └── CloudImage component in demo UI

CacheScenario (guides)
  └── Manual testing steps

DevToolsVerification (validates)
  └── TestImage loading + Cache state
```

---

## Integration with Library Types

The demo uses these types from @cloudimage/cloud:

```typescript
import type { CacheStats, NetworkStatus } from '@cloudimage/cloud';

// CacheStats: { itemCount, totalSize, hitRate, missRate, evictionCount }
// NetworkStatus: { online, bandwidth, mbps, rtt }
```

---

## No External Contracts

This feature does not expose external interfaces. The demo is a testing tool that consumes the library's public API (CloudProvider, CloudImage, useCloud).