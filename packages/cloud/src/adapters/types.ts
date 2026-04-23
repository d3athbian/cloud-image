import type { CacheEntry, PlatformType } from "../core/types";

export interface PlatformAdapter {
  readonly platform: PlatformType;
  init(): Promise<void>;
  get(url: string): Promise<CacheEntry | null>;
  set(entry: CacheEntry): Promise<void>;
  delete(url: string): Promise<boolean>;
  has(url: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  destroy(): void;
}

export interface AdapterConfig {
  platformOverride?: PlatformType;
  debug?: boolean;
}
