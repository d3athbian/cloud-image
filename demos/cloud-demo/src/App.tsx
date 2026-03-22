import { useState, useEffect } from 'react';

const IMAGE_COUNT = 100;
const BASE_URL = 'https://picsum.photos';

const testImages = Array.from({ length: IMAGE_COUNT }, (_, i) => ({
  id: i + 1,
  src: `${BASE_URL}/800/600?random=${i + 1}`,
  width: 800,
  height: 600,
  alt: `Demo image ${i + 1}`,
}));

interface CacheStats {
  itemCount: number;
  totalSize: number;
}

interface NetworkStatus {
  online: boolean;
  bandwidth: 'low' | 'medium' | 'high' | 'unknown';
  mbps?: number;
}

// Placeholder components until library is implemented
// These will be replaced with actual CloudImage, CloudProvider, useCloud
const CloudImage = ({ src, width, height, alt, style }: {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  style?: React.CSSProperties;
}) => (
  <img
    src={src}
    width={width}
    height={height}
    alt={alt}
    style={{ width: '100%', height: 'auto', display: 'block', ...style }}
    loading="lazy"
  />
);

const CloudProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

const useCloud = () => {
  const [stats] = useState<CacheStats>({ itemCount: 0, totalSize: 0 });
  const [network, setNetwork] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    bandwidth: 'unknown',
  });

  useEffect(() => {
    const handleOnline = () => setNetwork(n => ({ ...n, online: true }));
    const handleOffline = () => setNetwork(n => ({ ...n, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // @ts-ignore - Network Information API
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const updateBandwidth = () => {
        setNetwork(n => ({ 
          ...n, 
          bandwidth: conn.effectiveType === '4g' ? 'high' : 
                     conn.effectiveType === '3g' ? 'medium' : 'low',
          mbps: conn.downlink 
        }));
      };
      updateBandwidth();
      conn.addEventListener('change', updateBandwidth);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    cache: {
      getStats: async () => stats,
      prefetch: async (_urls: string[]) => {
        console.log('Prefetch placeholder - library not implemented');
      },
      clear: async () => {
        console.log('Clear placeholder - library not implemented');
      },
      invalidate: async (_url: string) => {
        console.log('Invalidate placeholder - library not implemented');
      },
    },
    network,
  };
};

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
        {network.mbps && ` (${network.mbps} Mbps)`}
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

function ImageGrid() {
  return (
    <div style={styles.grid}>
      {testImages.map((img) => (
        <div key={img.id} style={styles.imageWrapper}>
          <CloudImage
            src={img.src}
            width={img.width}
            height={img.height}
            alt={img.alt}
          />
        </div>
      ))}
    </div>
  );
}

function App() {
  const { cache, network } = useCloud();
  const [stats, setStats] = useState<CacheStats | null>(null);

  useEffect(() => {
    const updateStats = async () => {
      const s = await cache.getStats();
      setStats(s);
    };
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [cache]);

  const handlePrefetch = () => {
    cache.prefetch(testImages.slice(0, 10).map(img => img.src));
  };

  const handleClear = () => {
    cache.clear();
    setStats({ itemCount: 0, totalSize: 0 });
  };

  return (
    <CloudProvider>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>CLOUD Image Cache Demo</h1>
          <p>Testing with {IMAGE_COUNT} images (picsum.photos)</p>
        </header>
        
        <div style={styles.sidebar}>
          <CacheStatsDisplay stats={stats} />
          <NetworkStatusDisplay network={network} />
          <Controls onPrefetch={handlePrefetch} onClear={handleClear} />
        </div>
        
        <main style={styles.main}>
          <ImageGrid />
        </main>
      </div>
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
