import { Provider } from "jotai";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Size, Time } from "../config/constants";
import { ImageEngine } from "../core/engine";
import { getMemoryMonitor } from "../core/memory";
import { getNetworkMonitor } from "../core/network";
import { createOfflineStrategy } from "../core/offline";
import { hydrateState, setCacheAtom, setNetworkAtom, setMemoryAtom } from "../core/system-atoms";
import type {
  BandwidthClassification,
  CacheConfig,
  CacheStats,
  NetworkStatus,
} from "../core/types";

export interface CloudProviderConfig {
  cache?: Partial<CacheConfig>;
  children: ReactNode;
  LoadingComponent?: React.ComponentType;
  ErrorComponent?: React.ComponentType<{ error: Error }>;
  devtools?: boolean;
  offlineStrategy?: "default" | "aggressive";
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
  offlineStrategy: strategyType = "default",
}: CloudProviderConfig): React.ReactElement {
  const [engine, setEngine] = useState<ImageEngine | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    bandwidth: "unknown",
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [networkMonitor] = useState(() => getNetworkMonitor());
  const [memoryMonitor] = useState(() => getMemoryMonitor());
  const [_offlineStrategy] = useState(() => createOfflineStrategy(strategyType));

  useEffect(() => {
    const initEngine = async () => {
      try {
        await hydrateState(
          (data) => setCacheAtom(data),
          (data) => setNetworkAtom(data),
          (data) => setMemoryAtom(data)
        );

        const imageEngine = new ImageEngine({
          maxSize: cache?.maxSize ?? Size.DEFAULT_MAX_SIZE,
          defaultTTL: cache?.defaultTTL ?? Time.DEFAULT_TTL,
          memoryTierSize: cache?.memoryTierSize ?? Size.DEFAULT_MEMORY_TIER,
          debug: devtools,
          maxRetries: cache?.maxRetries ?? 3,
          requestTimeout: cache?.requestTimeout ?? Time.REQUEST_TIMEOUT,
        });

        await imageEngine.init();
        setEngine(imageEngine);
        setIsReady(true);

        if (devtools && typeof window !== "undefined") {
          (window as Window & { __CLOUD_ENGINE__?: ImageEngine }).__CLOUD_ENGINE__ = imageEngine;
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize"));
      }
    };

    initEngine();

    const unsubscribe = networkMonitor.subscribe(setNetworkStatus);

    memoryMonitor.startMonitoring();

    return () => {
      unsubscribe();
      memoryMonitor.stopMonitoring();
      engine?.destroy();
    };
  }, [
    devtools,
    networkMonitor.subscribe,
    cache?.requestTimeout,
    cache?.maxRetries,
    engine?.destroy,
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
          return { itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 };
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

  return (
    <Provider>
      <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
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
        }),
      },
      network: {
        online: true,
        bandwidth: "unknown",
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
