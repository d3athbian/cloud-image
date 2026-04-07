import React, { createContext, useContext, useState, useEffect } from 'react';
import { ImageEngine } from '../core/engine';
import type { CacheConfig, CacheStats, NetworkStatus } from '../core/types';
import { logger } from '../utils/logger';

const log = logger.CloudImage;

const SW_STATE_KEY = '__CLOUD_SW_STATE__';

const swScript = `
(function() {
  'use strict';
  var KEY = '__CLOUD_SW_REGISTERED__';
  var STATE_KEY = '__CLOUD_SW_STATE__';
  var PATH = '/sw.js';
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  if (window[KEY]) return;
  window[KEY] = true;
  navigator.serviceWorker.register(PATH).then(function(reg) {
    window[STATE_KEY] = 'registered';
    console.log('[CloudImage] Service Worker registered via inline:', reg.scope);
  }).catch(function(e) {
    window[STATE_KEY] = 'failed';
    console.warn('[CloudImage] SW blocked by CSP. Use manual: <script src="register.js"></script>');
  });
})();
`;

if (typeof document !== 'undefined' && !document.getElementById('cloud-sw-register')) {
  const script = document.createElement('script');
  script.id = 'cloud-sw-register';
  script.textContent = swScript;
  if (document.head) {
    document.head.appendChild(script);
  }
}

export interface CloudContextValue {
  engine: ImageEngine | null;
  isReady: boolean;
  error: Error | null;
}

export const CloudContext = createContext<CloudContextValue | null>(null);

export interface CloudProviderProps {
  config?: Partial<CacheConfig>;
  children: React.ReactNode;
  devtools?: boolean;
}

export const CloudProvider: React.FC<CloudProviderProps> = ({
  config,
  children,
  devtools = false,
}) => {
  const [engine, setEngine] = useState<ImageEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initEngine = async () => {
      try {
        const engineConfig = {
          ...config,
          debug: devtools,
        };
        const imageEngine = new ImageEngine(engineConfig);
        await imageEngine.init();
        setEngine(imageEngine);
        setIsReady(true);

        const swState = (window as unknown as Record<string, unknown>)[SW_STATE_KEY];
        if (swState === 'registered' && devtools) {
          log.info('[CloudImage] Service Worker ready (inline registration)');
        } else if (swState === 'failed' && devtools) {
          log.warn('[CloudImage] Service Worker blocked by CSP');
          log.warn('[CloudImage] To fix: add <script src="register.js"></script> in your HTML head');
        }

        if (devtools) {
          (window as Window & { __CLOUD__?: CloudContextValue }).__CLOUD__ = {
            engine: imageEngine,
            isReady: true,
            error: null,
          };
        }
      } catch (err) {
        setError(err as Error);
        setIsReady(false);
      }
    };

    initEngine();

    return () => {
      engine?.destroy();
    };
  }, []);

  return (
    <CloudContext.Provider value={{ engine, isReady, error }}>
      {isReady ? children : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'cloudSpin 1s linear infinite', margin: '0 auto 16px' }} />
            <p>Initializing CLOUD Image Cache...</p>
          </div>
          <style>{`@keyframes cloudSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </CloudContext.Provider>
  );
};

export function useCloud(): {
  cache: {
    get: (url: string) => Promise<string | null>;
    prefetch: (urls: string[]) => Promise<void>;
    clear: () => Promise<void>;
    invalidate: (url: string) => Promise<void>;
    getStats: () => Promise<CacheStats>;
  };
  network: NetworkStatus;
} {
  const context = useContext(CloudContext);
  
  if (!context) {
    throw new Error('useCloud must be used within CloudProvider');
  }

  const { engine } = context;

  const [network, setNetwork] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    bandwidth: 'unknown',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetwork(prev => ({ ...prev, online: true }));
    };
    const handleOffline = () => {
      setNetwork(prev => ({ ...prev, online: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    cache: {
      get: async (url: string) => {
        return engine?.get(url) ?? null;
      },
      prefetch: async (urls: string[]) => {
        if (!engine) return;
        for (const url of urls) {
          await engine.get(url);
        }
      },
      clear: async () => {
        await engine?.clear();
      },
      invalidate: async (url: string) => {
        await engine?.delete(url);
      },
      getStats: async () => {
        return engine?.getStats() ?? {
          itemCount: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          evictionCount: 0,
        };
      },
    },
    network,
  };
}
