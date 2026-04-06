// Service Worker para CLOUD Image Cache
// Usa IndexedDB para persistencia con gestión proactiva de quota

const DB_NAME = 'carbon-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 2; // Bumped: added 'cachedAt' index for LRU eviction by cursor

// Umbrales de gestión proactiva de quota
const QUOTA_WARN_THRESHOLD = 0.80;  // Empezar a evictar al 80% de uso
const QUOTA_EVICT_TO = 0.60;        // Evictar hasta dejar libre el 40%
const MAX_CACHE_ITEMS = 200;        // Límite duro de items (protección de RAM al leer todo)
const EVICT_BATCH_PERCENT = 0.25;   // Evictar el 25% más viejo cuando hay presión

let db = null;
let dbOpenPromise = null;

// ─── IndexedDB: Apertura resiliente ──────────────────────────────────────────

/**
 * Abre la DB con protecciones completas:
 * - Singleton de apertura (evita carreras paralelas)
 * - Validación de handle existente
 * - onversionchange: reacciona al borrado externo (DevTools, browser storage pressure)
 * - onclose: respaldo si el browser cierra la conexión por presión de RAM
 */
async function openDB() {
  if (db) {
    if (db.objectStoreNames.contains(STORE_NAME)) {
      return db;
    }
    console.warn('[SW] DB handle stale, resetting...');
    try { db.close(); } catch (_) {}
    db = null;
  }

  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      db = null;
      dbOpenPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      dbOpenPromise = null;

      // El browser disparará este evento cuando:
      // 1. Se borre la DB desde DevTools
      // 2. El browser elimine la DB por presión de storage (best-effort policy)
      // 3. Otra pestaña intente abrir una versión mayor (actualización de app)
      db.onversionchange = () => {
        console.warn('[SW] DB deleted or version changed externally. Closing connection.');
        db.close();
        db = null;
      };

      // Respaldo: si el browser cierra la conexión por presión de RAM
      db.onclose = () => {
        console.warn('[SW] DB connection closed (likely memory pressure). Will reopen on next access.');
        db = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        // keyPath: 'url' para lookup rápido por URL
        // El índice 'cachedAt' permite evictar los más viejos eficientemente
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });

  return dbOpenPromise;
}

/**
 * Wrapper con retry automático ante handle corrupto.
 * Cubre el caso donde la DB fue borrada externamente y el onversionchange
 * aún no fue procesado cuando llega la próxima operación.
 */
async function withDB(operation) {
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
      console.warn('[SW] Stale DB handle detected, reinitializing:', error.message);
      try { db.close(); } catch (_) {}
      db = null;
      dbOpenPromise = null;
      const freshDb = await openDB();
      return await operation(freshDb);
    }

    throw error;
  }
}

// ─── IndexedDB: Operaciones CRUD ─────────────────────────────────────────────

async function getFromIDB(url) {
  return withDB((database) =>
    new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    })
  );
}

/**
 * Guarda en IDB con gestión completa de quota:
 * 1. Chequeo proactivo de quota (Storage Quota API)
 * 2. Si falla con QuotaExceededError → evictar entradas viejas → reintentar
 * 3. Si falla de nuevo → descartar silenciosamente (el fetch devuelve la imagen igual)
 */
async function saveToIDB(url, data, metadata) {
  // 1. Chequeo proactivo ANTES de escribir
  await checkAndEvictIfNeeded(data.byteLength);

  // 2. Intento de escritura
  try {
    await _saveToIDB(url, data, metadata);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn('[SW] QuotaExceededError on save. Running emergency eviction...');
      // 3. Evicción de emergencia: borrar el 25% más viejo
      await evictOldestEntries(EVICT_BATCH_PERCENT);
      // 4. Reintentar
      try {
        await _saveToIDB(url, data, metadata);
        console.log('[SW] Save succeeded after emergency eviction.');
      } catch (retryError) {
        // 5. Descarte silencioso: la imagen igual se sirvió, solo no quedó cacheada
        console.warn('[SW] Save failed even after eviction (quota too tight). Skipping cache for:', url);
      }
    } else {
      throw error;
    }
  }
}

async function _saveToIDB(url, data, metadata) {
  return withDB((database) =>
    new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry = { url, data, metadata, cachedAt: Date.now() };
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
}

function isQuotaError(error) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      // Firefox
      error.code === 22 ||
      // Safari algunos casos
      error.message.toLowerCase().includes('quota'))
  );
}

async function deleteFromIDB(url) {
  return withDB((database) =>
    new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    })
  );
}

async function clearIDB() {
  return withDB((database) =>
    new Promise((resolve, reject) => {
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
 * Chequea la quota del origen ANTES de escribir.
 * 
 * La Storage Quota API (navigator.storage.estimate()) es la única forma
 * de saber cuánto espacio queda SIN esperar a que falle la escritura.
 * 
 * @param {number} incomingBytes - tamaño del asset que vamos a guardar
 */
async function checkAndEvictIfNeeded(incomingBytes = 0) {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    // API no disponible (Firefox privado, algunos móviles) → continuar sin chequeo
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const { usage = 0, quota = Infinity } = estimate;
    const projectedUsage = usage + incomingBytes;
    const usageRatio = projectedUsage / quota;

    if (usageRatio >= QUOTA_WARN_THRESHOLD) {
      const usageMB = (usage / 1024 / 1024).toFixed(1);
      const quotaMB = (quota / 1024 / 1024).toFixed(1);
      console.warn(
        `[SW] Storage at ${(usageRatio * 100).toFixed(1)}% (${usageMB}MB / ${quotaMB}MB). Running proactive eviction.`
      );

      // Calcular cuántos bytes liberar para llegar al umbral seguro
      const targetUsage = quota * QUOTA_EVICT_TO;
      const bytesToFree = usage - targetUsage + incomingBytes;

      await evictBySize(bytesToFree);
    }
  } catch (error) {
    // Si la API falla, continuar sin chequeo
    console.warn('[SW] Storage estimate failed (non-fatal):', error);
  }
}

/**
 * Evicta los N entries más viejos (por cachedAt) hasta liberar `bytesToFree`.
 * Usa el índice 'cachedAt' para leer ordenado → eficiente, no necesita leer todo.
 */
async function evictBySize(bytesToFree) {
  if (bytesToFree <= 0) return;

  return withDB((database) =>
    new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('cachedAt');

      // Cursor ascendente por cachedAt = los más viejos primero
      const cursorRequest = index.openCursor();
      let freedBytes = 0;
      let deletedCount = 0;

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || freedBytes >= bytesToFree) {
          console.log(`[SW] Proactive eviction: freed ~${(freedBytes / 1024 / 1024).toFixed(2)}MB, deleted ${deletedCount} entries.`);
          resolve();
          return;
        }

        const entry = cursor.value;
        const entrySize = entry.metadata?.size || entry.data?.byteLength || 0;

        cursor.delete();
        freedBytes += entrySize;
        deletedCount++;
        cursor.continue();
      };

      cursorRequest.onerror = () => resolve(); // non-fatal
      transaction.onerror = () => resolve();    // non-fatal
    })
  );
}

/**
 * Evicta el porcentaje más viejo de los items del caché.
 * Usado en el error handler de QuotaExceededError.
 * @param {number} fraction - fracción del caché a eliminar (e.g., 0.25 = 25%)
 */
async function evictOldestEntries(fraction) {
  return withDB((database) =>
    new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Primero contar cuántos hay
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        const total = countRequest.result;
        const toDelete = Math.max(1, Math.ceil(total * fraction));

        const index = store.index('cachedAt');
        const cursorRequest = index.openCursor();
        let deleted = 0;

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;

          if (!cursor || deleted >= toDelete) {
            console.log(`[SW] Emergency eviction: deleted ${deleted}/${total} entries.`);
            resolve();
            return;
          }

          cursor.delete();
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

async function getStatsFromIDB() {
  return withDB((database) =>
    new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = request.result || [];
        const totalSize = entries.reduce((sum, e) => sum + (e.metadata?.size || 0), 0);
        resolve({ itemCount: entries.length, totalSize });
      };
      request.onerror = () => resolve({ itemCount: 0, totalSize: 0 });
    })
  );
}

async function getStorageInfo() {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usageRatio: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
    };
  } catch {
    return null;
  }
}

// ─── URL detection ────────────────────────────────────────────────────────────

function isImageURL(url) {
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

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// ─── Fetch interceptor ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (!isImageURL(url)) return;
  if (event.request.mode === 'navigate') return;

  event.respondWith(handleImageRequest(url));
});

/**
 * Maneja cada request de imagen:
 * 1. Cache HIT → servir desde IDB
 * 2. Cache MISS → fetch de red → guardar en IDB (con gestión de quota)
 * 3. Error total → fallback a fetch directo (la imagen igual carga)
 */
async function handleImageRequest(url) {
  try {
    // 1. Buscar en cache
    const cached = await getFromIDB(url);

    if (cached) {
      console.log('[SW] Cache HIT:', url);
      const blob = new Blob([cached.data], { type: cached.metadata.mimeType || 'image/jpeg' });
      return new Response(blob, {
        headers: {
          'Content-Type': cached.metadata.mimeType || 'image/jpeg',
          'X-Cache-Status': 'HIT',
        },
      });
    }

    console.log('[SW] Cache MISS:', url);

    if (!navigator.onLine) {
      return new Response('Offline - no cached version', { status: 503 });
    }

    // 2. Fetch de red
    const response = await fetch(url, { cache: 'no-store' });

    if (response.ok) {
      // 3. Guardar en background con gestión de quota (no bloquea la response)
      const responseToCache = response.clone();
      responseToCache.blob().then(blob => {
        blob.arrayBuffer().then(arrayBuffer => {
          saveToIDB(url, arrayBuffer, {
            size: arrayBuffer.byteLength,
            mimeType: blob.type || 'image/jpeg',
          }).catch(err => {
            // saveToIDB ya maneja QuotaExceededError internamente
            // Si llegamos aquí es un error no relacionado con quota
            console.error('[SW] Unexpected save error:', err);
          });
        });
      });
    }

    return response;
  } catch (error) {
    // Fallback: pass-through directo a la red
    // Esto garantiza que la imagen SIEMPRE intente cargar aunque la DB esté rota
    console.error('[SW] handleImageRequest error, falling back to direct fetch:', error);
    try {
      return await fetch(url);
    } catch {
      return new Response('Image unavailable', { status: 503 });
    }
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;

  const reply = (responsePayload) => {
    if (event.source) {
      event.source.postMessage({ id, type: 'success', payload: responsePayload });
    } else {
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ id, type: 'success', payload: responsePayload }))
      );
    }
  };

  const replyError = (error) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (event.source) {
      event.source.postMessage({ id, type: 'error', error: errorMsg });
    } else {
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ id, type: 'error', error: errorMsg }))
      );
    }
  };

  try {
    let response;

    switch (type) {
      case 'cache-get': {
        const entry = await getFromIDB(payload.url);
        response = entry
          ? { found: true, data: entry.data, metadata: entry.metadata }
          : { found: false };
        break;
      }
      case 'cache-set': {
        await saveToIDB(payload.url, payload.data, payload.metadata);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        response = { deleted: await deleteFromIDB(payload.url) };
        break;
      }
      case 'cache-clear': {
        await clearIDB();
        response = { cleared: true };
        break;
      }
      case 'stats': {
        const idbStats = await getStatsFromIDB();
        const storageInfo = await getStorageInfo();
        response = { ...idbStats, storageInfo };
        break;
      }
      case 'evict': {
        // Permite al main thread solicitar evicción manual
        const fraction = payload?.fraction ?? EVICT_BATCH_PERCENT;
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