import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { CloudProvider, useCloud, CloudImage } from '@cloudimage/cloud/react';
import type { CacheStats, NetworkStatus } from '@cloudimage/cloud';
import { ErrorBoundary } from './components/ErrorBoundary';

interface PicsumImage {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

const STATIC_IMAGES: PicsumImage[] = [
  { id: "0", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/yC-Yzbqy7PY", download_url: "https://picsum.photos/id/0/400/300" },
  { id: "1", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/LNRyGwIJr5c", download_url: "https://picsum.photos/id/1/400/300" },
  { id: "2", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/N7XodRrbzS0", download_url: "https://picsum.photos/id/2/400/300" },
  { id: "3", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/Dl6jeyfihLk", download_url: "https://picsum.photos/id/3/400/300" },
  { id: "4", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/y83Je1OC6Wc", download_url: "https://picsum.photos/id/4/400/300" },
  { id: "5", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/LF8gK8-HGSg", download_url: "https://picsum.photos/id/5/400/300" },
  { id: "6", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/tAKXap853rY", download_url: "https://picsum.photos/id/6/400/300" },
  { id: "7", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/BbQLHCpVUqA", download_url: "https://picsum.photos/id/7/400/300" },
  { id: "8", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/xII7efH1G6o", download_url: "https://picsum.photos/id/8/400/300" },
  { id: "9", author: "Alejandro Escamilla", width: 400, height: 300, url: "https://unsplash.com/photos/ABDTiLqDhJA", download_url: "https://picsum.photos/id/9/400/300" },
  { id: "10", author: "Jerry Adney", width: 400, height: 300, url: "https://unsplash.com/photos/KMxQ4T8Jqz0", download_url: "https://picsum.photos/id/10/400/300" },
  { id: "11", author: "Michael Hull", width: 400, height: 300, url: "https://unsplash.com/photos/WjIB-J4mVfg", download_url: "https://picsum.photos/id/11/400/300" },
  { id: "12", author: "Go Wild", width: 400, height: 300, url: "https://unsplash.com/photos/sFX5t6L7x4s", download_url: "https://picsum.photos/id/12/400/300" },
  { id: "13", author: "Peter Adams", width: 400, height: 300, url: "https://unsplash.com/photos/E497z4d9w9g", download_url: "https://picsum.photos/id/13/400/300" },
  { id: "14", author: "Nathan Anderson", width: 400, height: 300, url: "https://unsplash.com/photos/XMoo7j5-r9U", download_url: "https://picsum.photos/id/14/400/300" },
  { id: "15", author: "Christopher Beckett", width: 400, height: 300, url: "https://unsplash.com/photos/O0R5gbE3Cws", download_url: "https://picsum.photos/id/15/400/300" },
  { id: "16", author: "Jonatan Pie", width: 400, height: 300, url: "https://unsplash.com/photos/3TLl_97HNJo", download_url: "https://picsum.photos/id/16/400/300" },
  { id: "17", author: "Robert Lukat", width: 400, height: 300, url: "https://unsplash.com/photos/lF0B_5F5j3Q", download_url: "https://picsum.photos/id/17/400/300" },
  { id: "18", author: "Frank McKenna", width: 400, height: 300, url: "https://unsplash.com/photos/tj3sM3kLg3A", download_url: "https://picsum.photos/id/18/400/300" },
  { id: "19", author: "David Marcu", width: 400, height: 300, url: "https://unsplash.com/photos/78A265wPiO4", download_url: "https://picsum.photos/id/19/400/300" },
];

function usePicsumImages() {
  const [images, setImages] = useState<PicsumImage[]>(STATIC_IMAGES);
  const [loading, setLoading] = useState(false);

  return { images, loading };
}

const CacheStatsDisplay = memo(function CacheStatsDisplay({ stats }: { stats: CacheStats | null }) {
  return (
    <div style={styles.stats} role="region" aria-label="Cache statistics">
      <h2>Cache Stats</h2>
      <p>Items cached: {stats?.itemCount ?? 0}</p>
      <p>Total size: {stats ? (stats.totalSize / 1024 / 1024).toFixed(2) : 0} MB</p>
      <p>Hit rate: {stats ? (stats.hitRate * 100).toFixed(1) : 0}%</p>
      <p>Miss rate: {stats ? (stats.missRate * 100).toFixed(1) : 0}%</p>
      <p>Evictions: {stats?.evictionCount ?? 0}</p>
    </div>
  );
});

const NetworkStatusDisplay = memo(function NetworkStatusDisplay({ network }: { network: NetworkStatus }) {
  const bandwidthColors = useMemo(() => ({
    low: '#f87171',
    medium: '#fbbf24',
    high: '#4ade80',
    unknown: '#9ca3af',
  }), []);

  return (
    <div style={styles.stats} role="region" aria-label="Network status">
      <h2>Network Status</h2>
      <p>
        Status:{' '}
        <span style={{ color: network.online ? '#4ade80' : '#f87171' }}>
          {network.online ? 'Online' : 'Offline'}
        </span>
      </p>
      <p>
        Bandwidth:{' '}
        <span style={{ color: bandwidthColors[network.bandwidth] }}>
          {network.bandwidth.toUpperCase()}
        </span>
      </p>
    </div>
  );
});

const Controls = memo(function Controls({ onPrefetch, onClear }: { onPrefetch: () => void; onClear: () => void }) {
  return (
    <div style={styles.stats} role="region" aria-label="Cache controls">
      <h2>Controls</h2>
      <div style={styles.buttonGroup}>
        <button onClick={onPrefetch} style={styles.button} aria-label="Prefetch 10 images">
          Prefetch 10
        </button>
        <button onClick={onClear} style={styles.button} aria-label="Clear cache">
          Clear Cache
        </button>
      </div>
    </div>
  );
});

const ImageGrid = memo(function ImageGrid({ images }: { images: PicsumImage[] }) {
  return (
    <div style={styles.grid} role="list" aria-label="Image gallery">
      {images.map((img, index) => (
        <div key={img.id} style={styles.imageWrapper} role="listitem">
          <CloudImage
            src={img.download_url}
            width={400}
            height={300}
            alt={`${img.author} - ${img.id}`}
            priority={index === 0 ? 'high' : undefined}
            loading={index < 6 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
});

function AppContent() {
  const { images, loading } = usePicsumImages();
  const { cache, network } = useCloud();
  const cacheRef = useRef(cache);
  const [stats, setStats] = useState<CacheStats | null>(null);

  cacheRef.current = cache;

  useEffect(() => {
    const updateStats = async () => {
      const s = await cacheRef.current.getStats();
      setStats(s);
    };
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePrefetch = useCallback(async () => {
    const urls = images.slice(0, 10).map(img => img.download_url);
    await cacheRef.current.prefetch(urls);
    const s = await cacheRef.current.getStats();
    setStats(s);
  }, [images]);

  const handleClear = useCallback(async () => {
    await cacheRef.current.clear();
    setStats({ itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 });
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading images...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>CLOUD Image Cache Demo</h1>
        <p>Testing with {images.length} images (picsum.photos)</p>
      </header>
      
      <div style={styles.sidebar}>
        <CacheStatsDisplay stats={stats} />
        <NetworkStatusDisplay network={network} />
        <Controls onPrefetch={handlePrefetch} onClear={handleClear} />
      </div>
      
      <main style={styles.main}>
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    padding: '1rem 2rem',
    background: '#16213e',
    borderBottom: '1px solid #0f3460',
  },
  sidebar: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem 2rem',
    background: '#16213e',
    borderBottom: '1px solid #0f3460',
    flexWrap: 'wrap',
  },
  stats: {
    background: '#0f3460',
    padding: '1rem',
    borderRadius: '8px',
    minWidth: '200px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  button: {
    padding: '0.5rem 1rem',
    background: '#c53030',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  imageWrapper: {
    background: '#0f3460',
    borderRadius: '8px',
    overflow: 'hidden',
  },
};

export default App;
