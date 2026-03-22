export type MessageType =
  | 'fetch'
  | 'cache-get'
  | 'cache-set'
  | 'cache-delete'
  | 'cache-clear'
  | 'stats'
  | 'ping'
  | 'init'
  | 'destroy';

export interface SWRequest<T = unknown> {
  id: string;
  type: MessageType;
  payload?: T;
  timestamp: number;
}

export interface SWResponse<T = unknown> {
  id: string;
  type: 'success' | 'error';
  payload?: T;
  error?: string;
  timestamp: number;
}

export interface FetchPayload {
  url: string;
  options?: {
    preferCache?: boolean;
    timeout?: number;
  };
}

export interface FetchResponsePayload {
  blobUrl: string;
  fromCache: boolean;
  size: number;
  mimeType: string;
}

export interface StatsPayload {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

export interface CacheSetPayload {
  url: string;
  data: ArrayBuffer;
  metadata: {
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    etag?: string;
  };
}

export interface CacheSetResponsePayload {
  stored: boolean;
  evictedCount?: number;
}

export function generateMessageId(): string {
  return crypto.randomUUID();
}

export function createSWRequest<T>(
  type: MessageType,
  payload?: T
): SWRequest<T> {
  return {
    id: generateMessageId(),
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function createSWResponse<T>(
  id: string,
  type: 'success' | 'error',
  payload?: T,
  error?: string
): SWResponse<T> {
  return {
    id,
    type,
    payload,
    error,
    timestamp: Date.now(),
  };
}