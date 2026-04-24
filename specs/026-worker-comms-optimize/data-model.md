# Data Model: Worker-Main Thread Communication Optimization

## Entities

### 1. WorkerMessage
Existing type in `core/types.ts`

| Field | Type | Description |
|------|------|-------------|
| id | string | Unique message identifier |
| type | WorkerMessageType | "get" \| "set" \| "delete" \| "clear" \| "stats" \| "init" \| "destroy" |
| payload | T (optional) | Message payload |
| timestamp | number | Unix timestamp |

### 2. WorkerResponse
Existing type in `core/types.ts`

| Field | Type | Description |
|------|------|-------------|
| id | string | Corresponds to request id |
| type | "success" \| "error" | Response type |
| payload | T (optional) | Response data |
| error | string (optional) | Error message |
| timestamp | number | Unix timestamp |

### 3. TransferBatch (NEW)

| Field | Type | Description |
|------|------|-------------|
| batchId | string | Unique batch identifier |
| items | WorkerResponse[] | Array of responses |
| size | number | Total items in batch |
| timestamp | number | When batch was created |

### 4. CompressionMetadata (NEW)

| Field | Type | Description |
|------|------|-------------|
| originalSize | number | Bytes before compression |
| compressedSize | number | Bytes after compression |
| ratio | number | compression ratio (0-1) |
| algorithm | string | "none" \| "lz4" \| "gzip" |

---

## Validation Rules

- WorkerMessage.id MUST be unique per request
- WorkerResponse.id MUST match request id
- TransferBatch.size MUST be > 0
- CompressionMetadata.ratio = compressedSize / originalSize