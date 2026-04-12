import { useState, useOptimistic } from 'react';
import { CloudProvider, useCloud } from '@cloudimage/cloud/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CacheStatsDisplay } from './components/CacheStatsDisplay';
import { NetworkStatusDisplay } from './components/NetworkStatusDisplay';
import { Controls } from './components/Controls';
import { ImageGrid } from './components/ImageGrid';
import { useCacheStats } from './hooks/useCacheStats';
import { STATIC_IMAGES, type PicsumImage } from './types/images';
import styles from './styles/app.module.css';

function usePicsumImages() {
  const [images] = useState<PicsumImage[]>(STATIC_IMAGES);
  return { images };
}

function AppContent() {
  const { images } = usePicsumImages();
  const { cache, network } = useCloud();
  const { stats, isLoading, prefetch, clear } = useCacheStats(cache, 2000);
  const [optimisticStats, setOptimisticStats] = useOptimistic(
    stats,
    (state, newStats: typeof stats) => newStats ?? state
  );

  const handlePrefetch = () => {
    setOptimisticStats({
      itemCount: optimisticStats?.itemCount ?? 0,
      totalSize: (optimisticStats?.totalSize ?? 0) + 5000000,
      hitRate: optimisticStats?.hitRate ?? 0,
      missRate: optimisticStats?.missRate ?? 0,
      evictionCount: optimisticStats?.evictionCount ?? 0,
    });
    const urls = images.slice(0, 10).map(img => img.download_url);
    prefetch(urls);
  };

  const handleClear = () => {
    setOptimisticStats({
      itemCount: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: optimisticStats?.evictionCount ?? 0,
    });
    clear();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>CLOUD Image Cache Demo</h1>
        <p>Testing with {images.length} images (picsum.photos)</p>
      </header>
      
      <aside className={styles.sidebar}>
        <CacheStatsDisplay stats={optimisticStats} />
        <NetworkStatusDisplay network={network} />
        <Controls 
          onPrefetch={handlePrefetch} 
          onClear={handleClear}
          isLoading={isLoading}
        />
      </aside>
      
      <main className={styles.main}>
        <ImageGrid images={images} />
      </main>
    </div>
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