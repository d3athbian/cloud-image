import { createContext } from "react";
import type { ImageEngine } from "../core/engine";
import type { BandwidthClassification, CacheStats } from "../core/types";

export interface CloudContextValue {
  cache: {
    get(url: string): Promise<string | null>;
    prefetch(urls: string[]): Promise<void>;
    invalidate(url: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise<CacheStats>;
  };
  network: {
    online: boolean;
    bandwidth: BandwidthClassification;
    mbps?: number;
    rtt?: number;
  };
  engine: ImageEngine | null;
  isReady: boolean;
}

export const CloudContext = createContext<CloudContextValue | null>(null);
