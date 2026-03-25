import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { ImageEngine } from '../core/engine';
import { getNetworkMonitor } from '../core/network';
import { createOfflineStrategy } from '../core/offline';
import { createAdapter } from '../adapters/factory';
import type { CacheConfig, CacheStats, BandwidthClassification, NetworkStatus } from '../core/types';

export interface CloudProviderConfig {
  cache?: Partial<CacheConfig>;
  children: ReactNode;
  LoadingComponent?: React.ComponentType;
  ErrorComponent?: React.ComponentType<{ error: Error }>;
  devtools?: boolean;
  offlineStrategy?: 'default' | 'aggressive';
}

export interface useCloudReturn {
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

const CloudContext = createContext<useCloudReturn | null>(null);

export function CloudProvider({
  cache,
  children,
  LoadingComponent,
  ErrorComponent,
  devtools = false,
  offlineStrategy: strategyType = 'default',
}: CloudProviderConfig): React.ReactElement {
  const [engine, setEngine] = useState<ImageEngine | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    bandwidth: 'unknown',
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [networkMonitor] = useState(() => getNetworkMonitor());
  const [offlineStrategy] = useState(() => createOfflineStrategy(strategyType));

  useEffect(() => {
    const initEngine = async () => {
      try {
        const imageEngine = new ImageEngine({
          maxSize: cache?.maxSize ?? 100 * 1024 * 1024,
          defaultTTL: cache?.defaultTTL ?? 7 * 24 * 60 * 60 * 1000,
          memoryTierSize: cache?.memoryTierSize ?? 20 * 1024 * 1024,
          debug: devtools,
          maxRetries: cache?.maxRetries ?? 3,
          requestTimeout: cache?.requestTimeout ?? 10000,
        });

        await imageEngine.init();
        setEngine(imageEngine);
        setIsReady(true);

        if (devtools && typeof window !== 'undefined') {
          (window as Window & { __CLOUD_ENGINE__?: ImageEngine }).__CLOUD_ENGINE__ = imageEngine;
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
      }
    };

    initEngine();

    const unsubscribe = networkMonitor.subscribe(setNetworkStatus);

    return () => {
      unsubscribe();
      engine?.destroy();
    };
  }, []);

  const cacheAPI = useMemo(() => ({
    get: async (url: string): Promise<string | null> => {
      if (!engine) return null;
      return engine.get(url);
    },
    prefetch: async (urls: string[]): Promise<void> => {
      if (!engine) return;
      await Promise.all(urls.map(url => engine.get(url)));
    },
    invalidate: async (url: string): Promise<void> => {
      if (!engine) return;
      await engine.delete(url);
    },
    clear: async (): Promise<void> => {
      if (!engine) return;
      await engine.clear();
    },
    getStats: async (): Promise<CacheStats> => {
      if (!engine) {
        return { itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 };
      }
      return engine.getStats();
    },
  }), [engine]);

  const value: useCloudReturn = useMemo(() => ({
    cache: cacheAPI,
    network: {
      online: networkStatus.online,
      bandwidth: networkStatus.bandwidth,
      mbps: networkStatus.mbps,
      rtt: networkStatus.rtt,
    },
    engine,
    isReady,
  }), [cacheAPI, networkStatus, engine, isReady]);

  if (error) {
    if (ErrorComponent) {
      return <ErrorComponent error={error} />;
    }
    throw error;
  }

  if (!isReady && LoadingComponent) {
    return <LoadingComponent />;
  }

  return (
    <CloudContext.Provider value={value}>
      {children}
    </CloudContext.Provider>
  );
}

export function useCloud(): useCloudReturn {
  const context = useContext(CloudContext);
  
  if (!context) {
    return {
      cache: {
        get: async () => null,
        prefetch: async () => {},
        invalidate: async () => {},
        clear: async () => {},
        getStats: async () => ({ itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 }),
      },
      network: {
        online: true,
        bandwidth: 'unknown',
      },
      engine: null,
      isReady: false,
    };
  }

  return context;
}

export function useCloudEngine(): ImageEngine | null {
  const { engine } = useCloud();
  return engine;
}

export function useNetworkStatus(): NetworkStatus {
  const { network } = useCloud();
  return network;
}
