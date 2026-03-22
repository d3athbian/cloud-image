const CACHE_NAME = 'carbon-image-cache-v1';
const FETCH_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000;

let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
let circuitBreakerOpen = false;

const cacheManager = {
  cache: new Map(),
  totalSize: 0,
  hits: 0,
  misses: 0,
  evictionCount: 0,
  maxSize: 100 * 1024 * 1024,
  defaultTTL: 7 * 24 * 60 * 60 * 1000,

  async get(url) {
    const entry = this.cache.get(url);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      await this.delete(url);
      this.misses++;
      return null;
    }

    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;
    this.hits++;
    return entry;
  },

  isExpired(entry) {
    if (entry.expiresAt) {
      return entry.expiresAt < Date.now();
    }
    return Date.now() - entry.metadata.cachedAt > this.defaultTTL;
  },

  async set(entry) {
    const existing = this.cache.get(entry.url);
    const existingSize = existing?.metadata.size || 0;
    
    const projectedSize = this.totalSize - existingSize + entry.metadata.size;
    
    if (projectedSize > this.maxSize * 0.9) {
      await this.evict(entry.metadata.size);
    }

    const newEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: entry.metadata.accessCount || 1,
      },
    };

    this.cache.set(entry.url, newEntry);
    this.totalSize = this.totalSize - existingSize + entry.metadata.size;
  },

  async delete(url) {
    const entry = this.cache.get(url);
    if (!entry) return false;
    this.cache.delete(url);
    this.totalSize -= entry.metadata.size;
    return true;
  },

  async evict(incomingSize) {
    const targetSize = this.maxSize * 0.8;
    
    const expiredEntries = Array.from(this.cache.values())
      .filter(e => this.isExpired(e))
      .sort((a, b) => a.metadata.cachedAt - b.metadata.cachedAt);

    for (const entry of expiredEntries) {
      if (this.totalSize - entry.metadata.size <= targetSize) break;
      await this.delete(entry.url);
      this.evictionCount++;
    }

    if (this.totalSize + incomingSize <= this.maxSize * 0.9) return;

    const nonExpired = Array.from(this.cache.values())
      .filter(e => !this.isExpired(e))
      .map(e => ({
        entry: e,
        score: this.calculateScore(e),
      }))
      .sort((a, b) => a.score - b.score);

    const batchSize = this.maxSize * 0.2;
    let evictedSize = 0;

    for (const { entry } of nonExpired) {
      if (evictedSize >= batchSize && this.totalSize - evictedSize <= targetSize) break;
      if (await this.delete(entry.url)) {
        evictedSize += entry.metadata.size;
        this.evictionCount++;
      }
    }
  },

  calculateScore(entry) {
    const recencyFactor = 1 - (Date.now() - entry.metadata.accessedAt) / this.defaultTTL;
    const normalizedAccess = Math.min(entry.metadata.accessCount / 100, 1);
    return normalizedAccess * 0.6 + Math.max(0, recencyFactor) * 0.4;
  },

  getStats() {
    const total = this.hits + this.misses;
    return {
      itemCount: this.cache.size,
      totalSize: this.totalSize,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      evictionCount: this.evictionCount,
    };
  }
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (!url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  const url = request.url;

  if (circuitBreakerOpen) {
    if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreakerOpen = false;
      circuitBreakerFailures = 0;
    } else {
      const cached = await cacheManager.get(url);
      if (cached) {
        return createCachedResponse(cached, true);
      }
      return new Response('Service unavailable', { status: 503 });
    }
  }

  const cached = await cacheManager.get(url);
  if (cached) {
    return createCachedResponse(cached, true);
  }

  if (!navigator.onLine) {
    return new Response('Offline', { status: 503 });
  }

  try {
    const response = await fetchWithRetry(url);
    return processAndCache(response, url);
  } catch (error) {
    recordFailure();
    return new Response('Fetch failed', { status: 500 });
  }
}

async function fetchWithRetry(url, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeout);
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

async function processAndCache(response, url) {
  if (!response.ok) {
    recordFailure();
    return response;
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const entry = {
    url,
    data: arrayBuffer,
    metadata: {
      size: arrayBuffer.byteLength,
      mimeType: blob.type,
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
    },
    qualityTier: 'high',
    upgradeable: false,
  };

  try {
    await cacheManager.set(entry);
  } catch (error) {
    console.warn('[SW] Cache set failed:', error);
  }

  circuitBreakerFailures = 0;
  return new Response(arrayBuffer, {
    headers: { 'Content-Type': blob.type },
  });
}

function createCachedResponse(entry, fromCache) {
  const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
  return new Response(blob, {
    headers: {
      'Content-Type': entry.metadata.mimeType,
      'X-From-Cache': fromCache.toString(),
    },
  });
}

function recordFailure() {
  circuitBreakerFailures++;
  circuitBreakerLastFailure = Date.now();
  
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpen = true;
  }
}

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;
  
  try {
    let response;
    
    switch (type) {
      case 'cache-get': {
        const entry = await cacheManager.get(payload.url);
        response = entry ? { found: true, data: entry.data, metadata: entry.metadata } : { found: false };
        break;
      }
      case 'cache-set': {
        const entry = {
          url: payload.url,
          data: payload.data,
          metadata: payload.metadata,
          qualityTier: 'high',
          upgradeable: false,
        };
        await cacheManager.set(entry);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        const result = await cacheManager.delete(payload.url);
        response = { deleted: result };
        break;
      }
      case 'cache-clear': {
        cacheManager.cache.clear();
        cacheManager.totalSize = 0;
        response = { cleared: true };
        break;
      }
      case 'stats': {
        response = cacheManager.getStats();
        break;
      }
      case 'ping': {
        response = { alive: true };
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ id, type: 'success', payload: response });
      });
    });
  } catch (error) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          id, 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });
    });
  }
});