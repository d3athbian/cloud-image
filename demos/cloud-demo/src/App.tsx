import { useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { CloudProvider, useCloud, ErrorBoundary, useCacheStats, cacheAtom, networkAtom, memoryAtom } from '@cloudimage/cloud';
import { DebuggerTool } from '@cloudimage/cloud/debugger';
import { ImageGrid } from './components/ImageGrid';
import { STATIC_IMAGES, type PicsumImage } from './types/images';
import './styles/app.css';

function usePicsumImages() {
  const [images] = useState<PicsumImage[]>(STATIC_IMAGES);
  return { images };
}

function AppContent() {
  const { images } = usePicsumImages();
  const { cache, network } = useCloud();
  const { stats, isLoading, prefetch, clear } = useCacheStats(cache, 2000);
  
  const [jotaiCache] = useAtom(cacheAtom);
  const [jotaiNetwork] = useAtom(networkAtom);
  const [jotaiMemory] = useAtom(memoryAtom);

  const handlePrefetch = useCallback(() => {
    const urls = images.slice(0, 10).map(img => img.download_url);
    prefetch(urls);
  }, [prefetch, images]);

  const handleClear = useCallback(() => {
    clear();
  }, [clear]);

  const handleUpdateNetwork = useCallback(() => {
    console.log('[Debugger] Triggering network speed test...');
  }, []);

  const debuggerProps = {
    cacheStats: stats,
    networkStatus: (network?.status ?? 'online') as 'online' | 'offline' | 'slow',
    networkDetails: {
      bandwidth: network?.bandwidth ?? 'unknown',
      bandwidthTested: network?.bandwidthTested ?? false,
      mbps: network?.mbps,
      online: network?.online ?? true,
    },
    performanceMetrics: { avgResponseTime: 150, totalRequests: 42 },
    jotaiState: {
      cache: { ...jotaiCache },
      network: { status: jotaiNetwork.status, rtt: jotaiNetwork.rtt, lastChecked: jotaiNetwork.lastChecked },
      memory: { isUnderPressure: jotaiMemory.isUnderPressure, pressureLevel: jotaiMemory.pressureLevel as 'low' | 'medium' | 'high' },
    },
    onUpdateCache: handlePrefetch,
    onUpdateNetwork: handleUpdateNetwork,
    onClearCache: handleClear,
  };

  return (
    <>
      <div className="demo-container">
        <header className="demo-header">
          <h1>CLOUD Image Cache</h1>
          <p>Intelligent image caching for modern web apps</p>
        </header>
        
        <main className="demo-main">
          <ImageGrid images={images} />
        </main>
      </div>
      
      <DebuggerTool 
        initialIsOpen={false}
        position="bottom-right"
        panelMode="fullwidth"
        {...debuggerProps}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CloudProvider devtools={true}>
        <AppContent />
      </CloudProvider>
    </ErrorBoundary>
  );
}

export default App;