const FETCH_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000;

const DB_NAME = 'carbon-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 2; // Bumped: added 'cachedAt' index for efficient LRU eviction

// Umbrales de gestión proactiva de quota
const QUOTA_WARN_THRESHOLD = 0.80;
const QUOTA_EVICT_TO = 0.60;
const EVICT_BATCH_PERCENT = 0.25;

let db: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;
let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
let circuitBreakerOpen = false;

const stats = { hits: 0, misses: 0 };

interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: {
    size: number;
    mimeType: string;
    cachedAt: number;
    accessedAt: number;
    accessCount: number;
  };
  cachedAt: number; // redundant but needed for the IDB index
  qualityTier: 'low' | 'medium' | 'high';
  upgradeable: boolean;
}

interface StorageInfo {
  usage: number;
  quota: number;
  usageRatio: number;
}

// ─── IndexedDB: Apertura resiliente ──────────────────────────────────────────

async function openDB(): Promise<IDBDatabase> {
  if (db) {
    if (db.objectStoreNames.contains(STORE_NAME)) {
      return db;
    }
    console.warn('[SW] DB handle stale, resetting...');
    try { db.close(); } catch (_) { /* ignorar */ }
    db = null;
  }

  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      db = null;
      dbOpenPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      dbOpenPromise = null;

      // Disparado cuando el browser borra la DB (storage pressure, DevTools, browser clear)
      db.onversionchange = () => {
        console.warn('[SW] DB version changed or deleted externally. Closing to allow deletion.');
        db!.close();
        db = null;
      };

      // Disparado si el browser cierra la conexión por presión de RAM
      db.onclose = () => {
        console.warn('[SW] DB connection closed (memory pressure?). Will reopen on next access.');
        db = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      } else {
        // Migración desde v1: agregar índice cachedAt si no existe
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const store = transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('cachedAt')) {
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      }
    };
  });

  return dbOpenPromise;
}

async function withDB<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  try {
    const database = await openDB();
    return await operation(database);
  } catch (error) {
    const isStaleHandleError =
      error instanceof DOMException &&
      (error.name === 'InvalidStateError' ||
        error.name === 'TransactionInactiveError' ||
        error.message.includes('closing'));

    if (isStaleHandleError && db !== null) {
      console.warn('[SW] Stale DB handle, reinitializing:', (error as Error).message);
      try { db.close(); } catch (_) { /* ignorar */ }
      db = null;
      dbOpenPromise = null;
      const freshDb = await openDB();
      return await operation(freshDb);
    }

    throw error;
  }
}

// ─── IndexedDB: Operaciones CRUD ─────────────────────────────────────────────

async function getFromIDB(url: string): Promise<CacheEntry | null> {
  return withDB((database) =>
    new Promise<CacheEntry | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => resolve((request.result as CacheEntry) || null);
      request.onerror = () => reject(request.error);
    })
  );
}

/**
 * Guarda en IDB con gestión completa de quota:
 * 1. Chequeo proactivo via Storage Quota API
 * 2. Intento de escritura
 * 3. Si QuotaExceededError → evictar 25% más viejo → reintentar
 * 4. Si falla de nuevo → descarte silencioso (la imagen ya fue servida de red)
 */
async function saveToIDB(entry: CacheEntry): Promise<void> {
  await checkAndEvictIfNeeded(entry.data.byteLength);

  try {
    await _writeToIDB(entry);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('[SW] QuotaExceededError on save. Running emergency eviction...');
      await evictOldestEntries(EVICT_BATCH_PERCENT);
      try {
        await _writeToIDB(entry);
        console.log('[SW] Save succeeded after emergency eviction.');
      } catch (retryError) {
        if (isQuotaError(retryError)) {
          console.warn('[SW] Quota still exceeded after eviction. Skipping cache for:', entry.url);
        } else {
          throw retryError;
        }
      }
    } else {
      throw error;
    }
  }
}

async function _writeToIDB(entry: CacheEntry): Promise<void> {
  return withDB((database) =>
    new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.message.toLowerCase().includes('quota'))
  );
}

async function deleteFromIDB(url: string): Promise<boolean> {
  return withDB((database) =>
    new Promise<boolean>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    })
  );
}

async function clearIDB(): Promise<void> {
  return withDB((database) =>
    new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
}

// ─── Gestión proactiva de Quota ───────────────────────────────────────────────

/**
 * Consulta la Storage Quota API antes de cada escritura.
 * 
 * ¿Por qué esta API y no otra?
 * - navigator.storage.estimate() da el uso REAL del origen (IDB + Cache API + etc.)
 * - Es la única forma estándar de saber cuánto espacio queda ANTES de que falle la escritura
 * - Funciona en Chrome, Edge, Firefox (no disponible en Safari privado ni en algunos móviles)
 * 
 * ¿Qué pasa si no está disponible?
 * - Continuamos sin chequeo proactivo
 * - El QuotaExceededError handler en saveToIDB actúa como segunda línea de defensa
 */
async function checkAndEvictIfNeeded(incomingBytes = 0): Promise<void> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return; // API no disponible → depender del error handler
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? Infinity;

    if (quota === Infinity) return;

    const projectedUsage = usage + incomingBytes;
    const usageRatio = projectedUsage / quota;

    if (usageRatio >= QUOTA_WARN_THRESHOLD) {
      const toFreeMB = ((usage - (quota * QUOTA_EVICT_TO) + incomingBytes) / 1024 / 1024).toFixed(1);
      console.warn(
        `[SW] Storage at ${(usageRatio * 100).toFixed(1)}%. Proactive eviction to free ~${toFreeMB}MB.`
      );
      const bytesToFree = usage - (quota * QUOTA_EVICT_TO) + incomingBytes;
      await evictBySize(bytesToFree);
    }
  } catch (error) {
    console.warn('[SW] Storage estimate failed (non-fatal):', error);
  }
}

/**
 * Evicta los entries más viejos hasta liberar `bytesToFree` bytes.
 * Usa el índice 'cachedAt' para cursor eficiente (no carga todo en memoria).
 */
async function evictBySize(bytesToFree: number): Promise<void> {
  if (bytesToFree <= 0) return;

  return withDB((database) =>
    new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('cachedAt');
      const cursorRequest = index.openCursor(); // ASC = más viejos primero

      let freedBytes = 0;
      let deletedCount = 0;

      cursorRequest.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (!cursor || freedBytes >= bytesToFree) {
          console.log(`[SW] Evicted ${deletedCount} entries (~${(freedBytes / 1024 / 1024).toFixed(2)}MB).`);
          resolve();
          return;
        }

        const entry = cursor.value as CacheEntry;
        const entrySize = entry.metadata?.size || (entry.data as ArrayBuffer)?.byteLength || 0;

        (cursor as IDBCursor).delete();
        freedBytes += entrySize;
        deletedCount++;
        cursor.continue();
      };

      cursorRequest.onerror = () => resolve();
      transaction.onerror = () => resolve();
    })
  );
}

/**
 * Evicta el N% más viejo del caché.
 * Usada en el handler de QuotaExceededError (evicción de emergencia).
 */
async function evictOldestEntries(fraction: number): Promise<void> {
  return withDB((database) =>
    new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const countRequest = store.count();
      countRequest.onsuccess = () => {
        const total = countRequest.result;
        const toDelete = Math.max(1, Math.ceil(total * fraction));

        const index = store.index('cachedAt');
        const cursorRequest = index.openCursor();
        let deleted = 0;

        cursorRequest.onsuccess = (event: Event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (!cursor || deleted >= toDelete) {
            console.log(`[SW] Emergency eviction: deleted ${deleted}/${total} entries.`);
            resolve();
            return;
          }

          (cursor as IDBCursor).delete();
          deleted++;
          cursor.continue();
        };

        cursorRequest.onerror = () => resolve();
      };
      countRequest.onerror = () => resolve();
      transaction.onerror = () => resolve();
    })
  );
}

async function getStatsFromIDB(): Promise<Record<string, unknown>> {
  const idbStats = await withDB((database) =>
    new Promise<{ itemCount: number; totalSize: number; hitRate: number; missRate: number; evictionCount: number }>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = (request.result ?? []) as CacheEntry[];
        const totalSize = entries.reduce((sum, e) => sum + (e.metadata?.size || 0), 0);
        const total = stats.hits + stats.misses;
        resolve({
          itemCount: entries.length,
          totalSize,
          hitRate: total > 0 ? stats.hits / total : 0,
          missRate: total > 0 ? stats.misses / total : 0,
          evictionCount: 0,
        });
      };
      request.onerror = () => resolve({ itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 });
    })
  );

  const storageInfo = await getStorageInfo();
  return { ...idbStats, storageInfo };
}

async function getStorageInfo(): Promise<StorageInfo | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      usageRatio: estimate.quota ? (estimate.usage ?? 0) / estimate.quota : 0,
    };
  } catch {
    return null;
  }
}

// ─── URL detection ────────────────────────────────────────────────────────────

function isImageURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    const isPicsum = urlObj.hostname.includes('picsum');
    return hasImageExtension || isPicsum;
  } catch {
    return false;
  }
}

// ─── Service Worker lifecycle ─────────────────────────────────────────────────

self.addEventListener('install', () => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// ─── Fetch interceptor ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = event.request.url;

  if (!isImageURL(url)) return;
  if (event.request.mode === 'navigate') return;

  event.respondWith(handleFetch(url));
});

async function handleFetch(url: string): Promise<Response> {
  try {
    if (circuitBreakerOpen) {
      if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
        circuitBreakerOpen = false;
        circuitBreakerFailures = 0;
      } else {
        const cached = await getFromIDB(url);
        if (cached) {
          stats.hits++;
          return createCachedResponse(cached);
        }
        return new Response('Service unavailable (circuit open)', { status: 503 });
      }
    }

    const cached = await getFromIDB(url);
    if (cached) {
      stats.hits++;
      return createCachedResponse(cached);
    }

    stats.misses++;

    if (!navigator.onLine) {
      return new Response('Offline', { status: 503 });
    }

    const response = await fetchWithRetry(url);

    if (response.ok) {
      // Guardar en background con gestión de quota
      const responseToCache = response.clone();
      responseToCache.blob().then(blob => {
        blob.arrayBuffer().then(arrayBuffer => {
          const entry: CacheEntry = {
            url,
            data: arrayBuffer,
            metadata: {
              size: arrayBuffer.byteLength,
              mimeType: blob.type,
              cachedAt: Date.now(),
              accessedAt: Date.now(),
              accessCount: 1,
            },
            cachedAt: Date.now(),
            qualityTier: 'high',
            upgradeable: false,
          };
          saveToIDB(entry).catch(err =>
            console.error('[SW] Unexpected save error:', err)
          );
        });
      });
    }

    circuitBreakerFailures = 0;
    return response;
  } catch (error) {
    console.error('[SW] handleFetch error, falling back:', error);
    circuitBreakerFailures++;
    circuitBreakerLastFailure = Date.now();
    if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreakerOpen = true;
    }
    try {
      return await fetch(url);
    } catch {
      return new Response('Image unavailable', { status: 503 });
    }
  }
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
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

function createCachedResponse(entry: CacheEntry): Response {
  const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
  return new Response(blob, {
    headers: { 'Content-Type': entry.metadata.mimeType, 'X-Cache-Status': 'HIT' },
  });
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (event: ExtendableMessageEvent) => {
  const { id, type, payload } = event.data as { id: string; type: string; payload: Record<string, unknown> };

  const reply = (responsePayload: unknown) => {
    if (event.source) {
      (event.source as unknown as Client).postMessage({ id, type: 'success', payload: responsePayload });
    } else {
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ id, type: 'success', payload: responsePayload }))
      );
    }
  };

  const replyError = (error: unknown) => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (event.source) {
      (event.source as unknown as Client).postMessage({ id, type: 'error', error: errorMsg });
    } else {
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ id, type: 'error', error: errorMsg }))
      );
    }
  };

  try {
    let response: unknown;
    switch (type) {
      case 'cache-get': {
        const entry = await getFromIDB(payload['url'] as string);
        response = entry ? { found: true, data: entry.data, metadata: entry.metadata } : { found: false };
        break;
      }
      case 'cache-set': {
        const entry: CacheEntry = {
          url: payload['url'] as string,
          data: payload['data'] as ArrayBuffer,
          metadata: payload['metadata'] as CacheEntry['metadata'],
          cachedAt: Date.now(),
          qualityTier: 'high',
          upgradeable: false,
        };
        await saveToIDB(entry);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        response = { deleted: await deleteFromIDB(payload['url'] as string) };
        break;
      }
      case 'cache-clear': {
        await clearIDB();
        response = { cleared: true };
        break;
      }
      case 'stats': {
        response = await getStatsFromIDB();
        break;
      }
      case 'evict': {
        const fraction = (payload['fraction'] as number | undefined) ?? EVICT_BATCH_PERCENT;
        await evictOldestEntries(fraction);
        response = { evicted: true };
        break;
      }
      case 'ping': {
        response = { alive: true };
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    reply(response);
  } catch (error) {
    replyError(error);
  }
});

export interface SWRequest<T = unknown> {
  id: string;
  type: string;
  payload?: T;
  timestamp: number;
}

export interface SWResponse<T = unknown> {
  id: string;
  type: 'success' | 'error';
  payload?: T;
  error?: string;
  timestamp: number;
}