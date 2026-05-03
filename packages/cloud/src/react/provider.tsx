import { Provider, useAtom, useSetAtom } from 'jotai';
import React, { type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { getSystemSettings } from '../config/settings';
import { ImageEngine } from '../core/engine';
import { getMemoryMonitor } from '../core/memory';
import { getNetworkMonitor } from '../core/network';
import { createOfflineStrategy } from '../core/offline';
import {
  engineAtom,
  hydrateState,
  registerStateUpdater,
  setCacheAtom,
  setMemoryAtom,
  setNetworkAtom,
  updateCache,
  updateMemory,
  updateNetwork,
} from '../core/system-atoms';
import type { BandwidthClassification, CacheStats, NetworkStatus } from '../core/types';
import { CloudContext } from './context';
import { useEngineSync } from './hooks/useEngineSync';

export interface CloudProviderConfig {
  cache?: Partial<{
    maxSize: number;
    defaultTTL: number;
    memoryTierSize: number;
    maxRetries: number;
    requestTimeout: number;
    platformOverride?: string;
  }>;
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

/**
 * Inner component that lives INSIDE the Jotai Provider.
 * This ensures all useAtom/useSetAtom calls share the same Jotai store.
 */
function CloudProviderInner({
  cache,
  children,
  LoadingComponent,
  ErrorComponent,
  devtools = false,
  offlineStrategy: strategyType = 'default',
}: CloudProviderConfig): React.ReactElement {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    bandwidth: 'unknown',
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [networkMonitor] = useState(() => getNetworkMonitor());
  const [memoryMonitor] = useState(() => getMemoryMonitor());
  const [_offlineStrategy] = useState(() => createOfflineStrategy(strategyType));
  const systemSettings = getSystemSettings();
  const setCache = useSetAtom(setCacheAtom);
  const setNetwork = useSetAtom(setNetworkAtom);
  const setMemory = useSetAtom(setMemoryAtom);
  const [engine, setEngine] = useAtom(engineAtom);

  // useEngineSync must be called unconditionally (React hook rules)
  useEngineSync(engine);

  useEffect(() => {
    const initEngine = async () => {
      try {
        registerStateUpdater(setCache, setNetwork, setMemory);
        console.log('[CloudProvider] State updaters registered, hydrating...');
        await hydrateState(updateCache, updateNetwork, updateMemory);
        console.log('[CloudProvider] State hydration complete.');

        const imageEngine = new ImageEngine({
          maxSize: cache?.maxSize ?? systemSettings.cacheMaxSize,
          defaultTTL: cache?.defaultTTL ?? systemSettings.cacheDefaultTTL,
          memoryTierSize: cache?.memoryTierSize ?? systemSettings.cacheMemoryTierSize,
          debug: devtools ?? systemSettings.enableDevtools,
          maxRetries: cache?.maxRetries ?? systemSettings.maxRetries,
          requestTimeout: cache?.requestTimeout ?? systemSettings.requestTimeout,
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

    memoryMonitor.startMonitoring();

    return () => {
      unsubscribe();
      memoryMonitor.stopMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    devtools,
    systemSettings.cacheMemoryTierSize,
    systemSettings.enableDevtools,
    systemSettings.maxRetries,
    systemSettings.cacheMaxSize,
    systemSettings.requestTimeout,
    systemSettings.cacheDefaultTTL,
    setNetwork,
    setMemory,
    setEngine,
    setCache,
    memoryMonitor.startMonitoring,
    networkMonitor.subscribe,
    cache?.requestTimeout,
    cache?.maxRetries,
    memoryMonitor.stopMonitoring,
    cache?.memoryTierSize,
    cache?.maxSize,
    cache?.defaultTTL,
  ]);

  const cacheAPI = useMemo(
    () => ({
      get: async (url: string): Promise<string | null> => {
        if (!engine) return null;
        return engine.get(url);
      },
      prefetch: async (urls: string[]): Promise<void> => {
        if (!engine) return;
        await Promise.all(urls.map((url) => engine.get(url)));
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
          return {
            itemCount: 0,
            totalSize: 0,
            hitRate: 0,
            missRate: 0,
            evictionCount: 0,
            hitCount: 0,
            missCount: 0,
          };
        }
        return engine.getStats();
      },
    }),
    [engine],
  );

  const value: useCloudReturn = useMemo(
    () => ({
      cache: cacheAPI,
      network: {
        online: networkStatus.online,
        bandwidth: networkStatus.bandwidth,
        mbps: networkStatus.mbps,
        rtt: networkStatus.rtt,
      },
      engine,
      isReady,
    }),
    [cacheAPI, networkStatus, engine, isReady],
  );

  if (error) {
    if (ErrorComponent) {
      return <ErrorComponent error={error} />;
    }
    throw error;
  }

  if (!isReady && LoadingComponent) {
    return <LoadingComponent />;
  }

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

/**
 * CloudProvider wraps children in a Jotai Provider first, then the inner
 * provider. This ensures all atom reads/writes share the same store.
 */
export function CloudProvider(props: CloudProviderConfig): React.ReactElement {
  return (
    <Provider>
      <CloudProviderInner {...props} />
    </Provider>
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
        getStats: async () => ({
          itemCount: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          evictionCount: 0,
          hitCount: 0,
          missCount: 0,
        }),
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
