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

export interface ServiceWorkerConfig {
  scope?: string;
  debug?: boolean;
  timeout?: number;
}

export interface SWResponse<T = unknown> {
  id: string;
  type: 'success' | 'error';
  payload?: T;
  error?: string;
}

export interface ServiceWorkerClient {
  init(): Promise<boolean>;
  isFallbackMode(): boolean;
  get(url: string): Promise<string | null>;
  set(url: string, data: ArrayBuffer, metadata: Record<string, unknown>): Promise<void>;
  delete(url: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<Record<string, unknown>>;
}