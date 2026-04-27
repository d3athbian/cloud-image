import type { CompressionMetadata } from "../core/types";

export function compressPayload(payload: unknown): {
  compressed: unknown;
  metadata: CompressionMetadata;
} {
  const originalSize = estimateSize(payload);
  const algorithm: CompressionMetadata["algorithm"] = "none";
  const data = JSON.stringify(payload);
  return {
    compressed: payload,
    metadata: {
      originalSize,
      compressedSize: new Blob([data]).size,
      ratio: 1,
      algorithm,
    },
  };
}

export function decompressPayload(compressed: unknown, _metadata: CompressionMetadata): unknown {
  return compressed;
}

function estimateSize(data: unknown): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

export function shouldCompress(payload: unknown): boolean {
  const size = estimateSize(payload);
  return size > 1024;
}
