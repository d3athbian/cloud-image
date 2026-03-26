import { useState, useEffect, useRef, useCallback } from 'react';
import { CloudProvider, useCloud, CloudImage } from '@cloudimage/cloud/react';
import type { CacheStats, NetworkStatus } from '@cloudimage/cloud';

const API_URL = 'https://picsum.photos/v2/list?page=1&limit=20';

interface PicsumImage {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

function usePicsumImages() {
  const [images, setImages] = useState<PicsumImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((data: PicsumImage[]) => {
        setImages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { images, loading };
}

function CacheStatsDisplay({ stats }: { stats: CacheStats | null }) {
  return (
    <div style={styles.stats}>
      <h2>Cache Stats</h2>
      <p>Items cached: {stats?.itemCount ?? 0}</p>
      <p>Total size: {stats ? (stats.totalSize / 1024 / 1024).toFixed(2) : 0} MB</p>
    </div>
  );
}

function NetworkStatusDisplay({ network }: { network: NetworkStatus }) {
  const bandwidthColors: Record<string, string> = {
    low: '#f87171',
    medium: '#fbbf24',
    high: '#4ade80',
    unknown: '#9ca3af',
  };

  return (
    <div style={styles.stats}>
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
}

function Controls({ onPrefetch, onClear }: { onPrefetch: () => void; onClear: () => void }) {
  return (
    <div style={styles.stats}>
      <h2>Controls</h2>
      <div style={styles.buttonGroup}>
        <button onClick={onPrefetch} style={styles.button}>
          Prefetch 10
        </button>
        <button onClick={onClear} style={styles.button}>
          Clear Cache
        </button>
      </div>
    </div>
  );
}

function ImageGrid({ images }: { images: PicsumImage[] }) {
  return (
    <div style={styles.grid}>
      {images.map((img) => (
        <div key={img.id} style={styles.imageWrapper}>
          <CloudImage
            src={`https://picsum.photos/id/${img.id}/800/600`}
            width={800}
            height={600}
            alt={`${img.author} - ${img.id}`}
          />
        </div>
      ))}
    </div>
  );
}

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
    const urls = images.slice(0, 10).map(img => `https://picsum.photos/id/${img.id}/800/600`);
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
    <CloudProvider devtools={true}>
      <AppContent />
    </CloudProvider>
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
    background: '#e94560',
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
