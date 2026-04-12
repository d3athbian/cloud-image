"use strict";
(() => {
  // src/service-worker/sw.ts
  var FETCH_TIMEOUT = 1e4;
  var MAX_RETRIES = 3;
  var CIRCUIT_BREAKER_THRESHOLD = 3;
  var CIRCUIT_BREAKER_TIMEOUT = 3e4;
  var DB_NAME = "cloud-image-cache";
  var STORE_NAME = "images";
  var DB_VERSION = 2;
  var QUOTA_WARN_THRESHOLD = 0.8;
  var QUOTA_EVICT_TO = 0.6;
  var EVICT_BATCH_PERCENT = 0.25;
  var db = null;
  var dbOpenPromise = null;
  var circuitBreakerFailures = 0;
  var circuitBreakerLastFailure = 0;
  var circuitBreakerOpen = false;
  var stats = { hits: 0, misses: 0 };
  async function openDB() {
    if (db) {
      if (db.objectStoreNames.contains(STORE_NAME)) {
        return db;
      }
      console.warn("[SW] DB handle stale, resetting...");
      try {
        db.close();
      } catch (_) {
      }
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
        db.onversionchange = () => {
          console.warn("[SW] DB version changed or deleted externally. Closing to allow deletion.");
          db.close();
          db = null;
        };
        db.onclose = () => {
          console.warn("[SW] DB connection closed (memory pressure?). Will reopen on next access.");
          db = null;
        };
        resolve(db);
      };
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: "url" });
          store.createIndex("cachedAt", "cachedAt", { unique: false });
        } else {
          const transaction = event.target.transaction;
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains("cachedAt")) {
            store.createIndex("cachedAt", "cachedAt", { unique: false });
          }
        }
      };
    });
    return dbOpenPromise;
  }
  async function withDB(operation) {
    let database = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        database = await openDB();
        if (!database || database.closed) {
          if (db) {
            try {
              db.close();
            } catch (_) {
            }
          }
          db = null;
          dbOpenPromise = null;
          continue;
        }
        return await operation(database);
      } catch (error) {
        const isStaleHandleError = error instanceof DOMException && (error.name === "InvalidStateError" || error.name === "TransactionInactiveError" || error.name === "AbortError" || error.message?.includes("closing") || error.message?.includes("database connection is closing"));
        if (isStaleHandleError && attempt === 0) {
          console.warn("[SW] Stale DB handle, retrying:", error.message);
          if (db) {
            try {
              db.close();
            } catch (_) {
            }
          }
          db = null;
          dbOpenPromise = null;
          continue;
        }
        throw error;
      }
    }
    throw new Error("[SW] Failed to get DB connection after retries");
  }
  async function getFromIDB(url) {
    try {
      return await withDB(
        (database) => new Promise((resolve, reject) => {
          const transaction = database.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(url);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        })
      );
    } catch (error) {
      console.warn("[SW] getFromIDB failed, returning null:", error);
      return null;
    }
  }
  async function saveToIDB(entry) {
    await checkAndEvictIfNeeded(entry.data.byteLength);
    try {
      await _writeToIDB(entry);
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn("[SW] QuotaExceededError on save. Running emergency eviction...");
        await evictOldestEntries(EVICT_BATCH_PERCENT);
        try {
          await _writeToIDB(entry);
          console.log("[SW] Save succeeded after emergency eviction.");
        } catch (retryError) {
          if (isQuotaError(retryError)) {
            console.warn("[SW] Quota still exceeded after eviction. Skipping cache for:", entry.url);
          } else {
            throw retryError;
          }
        }
      } else {
        throw error;
      }
    }
  }
  async function _writeToIDB(entry) {
    return withDB(
      (database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );
  }
  function isQuotaError(error) {
    return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22 || error.message.toLowerCase().includes("quota"));
  }
  async function deleteFromIDB(url) {
    return withDB(
      (database) => new Promise((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(url);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      })
    );
  }
  async function clearIDB() {
    return withDB(
      (database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );
  }
  async function checkAndEvictIfNeeded(incomingBytes = 0) {
    if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? Infinity;
      if (quota === Infinity) return;
      const projectedUsage = usage + incomingBytes;
      const usageRatio = projectedUsage / quota;
      if (usageRatio >= QUOTA_WARN_THRESHOLD) {
        const toFreeMB = ((usage - quota * QUOTA_EVICT_TO + incomingBytes) / 1024 / 1024).toFixed(1);
        console.warn(
          `[SW] Storage at ${(usageRatio * 100).toFixed(1)}%. Proactive eviction to free ~${toFreeMB}MB.`
        );
        const bytesToFree = usage - quota * QUOTA_EVICT_TO + incomingBytes;
        await evictBySize(bytesToFree);
      }
    } catch (error) {
      console.warn("[SW] Storage estimate failed (non-fatal):", error);
    }
  }
  async function evictBySize(bytesToFree) {
    if (bytesToFree <= 0) return;
    return withDB(
      (database) => new Promise((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("cachedAt");
        const cursorRequest = index.openCursor();
        let freedBytes = 0;
        let deletedCount = 0;
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor || freedBytes >= bytesToFree) {
            console.log(`[SW] Evicted ${deletedCount} entries (~${(freedBytes / 1024 / 1024).toFixed(2)}MB).`);
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
        cursorRequest.onerror = () => resolve();
        transaction.onerror = () => resolve();
      })
    );
  }
  async function evictOldestEntries(fraction) {
    return withDB(
      (database) => new Promise((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();
        countRequest.onsuccess = () => {
          const total = countRequest.result;
          const toDelete = Math.max(1, Math.ceil(total * fraction));
          const index = store.index("cachedAt");
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
    const idbStats = await withDB(
      (database) => new Promise((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const entries = request.result ?? [];
          const totalSize = entries.reduce((sum, e) => sum + (e.metadata?.size || 0), 0);
          const total = stats.hits + stats.misses;
          resolve({
            itemCount: entries.length,
            totalSize,
            hitRate: total > 0 ? stats.hits / total : 0,
            missRate: total > 0 ? stats.misses / total : 0,
            evictionCount: 0
          });
        };
        request.onerror = () => resolve({ itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 });
      })
    );
    const storageInfo = await getStorageInfo();
    return { ...idbStats, storageInfo };
  }
  async function getStorageInfo() {
    if (!("storage" in navigator) || !("estimate" in navigator.storage)) return null;
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
        usageRatio: estimate.quota ? (estimate.usage ?? 0) / estimate.quota : 0
      };
    } catch {
      return null;
    }
  }
  function isImageURL(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"];
      const hasImageExtension = imageExtensions.some((ext) => pathname.endsWith(ext));
      const isPicsum = urlObj.hostname.includes("picsum");
      return hasImageExtension || isPicsum;
    } catch {
      return false;
    }
  }
  self.addEventListener("install", () => {
    console.log("[SW] Installing...");
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");
    event.waitUntil(self.clients.claim());
  });
  self.addEventListener("fetch", (event) => {
    const url = event.request.url;
    if (!isImageURL(url)) return;
    if (event.request.mode === "navigate") return;
    event.respondWith(handleFetch(url));
  });
  async function handleFetch(url) {
    try {
      if (circuitBreakerOpen) {
        if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
          circuitBreakerOpen = false;
          circuitBreakerFailures = 0;
        } else {
          const cached2 = await getFromIDB(url);
          if (cached2) {
            stats.hits++;
            return createCachedResponse(cached2);
          }
          return new Response("Service unavailable (circuit open)", { status: 503 });
        }
      }
      const cached = await getFromIDB(url);
      if (cached) {
        stats.hits++;
        return createCachedResponse(cached);
      }
      stats.misses++;
      if (!navigator.onLine) {
        return new Response("Offline", { status: 503 });
      }
      const response = await fetchWithRetry(url);
      if (response.ok) {
        const responseToCache = response.clone();
        responseToCache.blob().then((blob) => {
          blob.arrayBuffer().then((arrayBuffer) => {
            const entry = {
              url,
              data: arrayBuffer,
              metadata: {
                size: arrayBuffer.byteLength,
                mimeType: blob.type,
                cachedAt: Date.now(),
                accessedAt: Date.now(),
                accessCount: 1
              },
              cachedAt: Date.now(),
              qualityTier: "high",
              upgradeable: false
            };
            saveToIDB(entry).catch(
              (err) => console.error("[SW] Unexpected save error:", err)
            );
          });
        });
      }
      circuitBreakerFailures = 0;
      return response;
    } catch (error) {
      console.error("[SW] handleFetch error:", error);
      circuitBreakerFailures++;
      circuitBreakerLastFailure = Date.now();
      if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitBreakerOpen = true;
      }
      return fetch(url);
    }
  }
  async function fetchWithRetry(url, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 100));
        return fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }
  function createCachedResponse(entry) {
    const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
    return new Response(blob, {
      headers: { "Content-Type": entry.metadata.mimeType, "X-Cache-Status": "HIT" }
    });
  }
  self.addEventListener("message", async (event) => {
    const { id, type, payload } = event.data;
    const reply = (responsePayload) => {
      if (event.source) {
        event.source.postMessage({ id, type: "success", payload: responsePayload });
      } else {
        self.clients.matchAll().then(
          (clients) => clients.forEach((client) => client.postMessage({ id, type: "success", payload: responsePayload }))
        );
      }
    };
    const replyError = (error) => {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (event.source) {
        event.source.postMessage({ id, type: "error", error: errorMsg });
      } else {
        self.clients.matchAll().then(
          (clients) => clients.forEach((client) => client.postMessage({ id, type: "error", error: errorMsg }))
        );
      }
    };
    try {
      let response;
      switch (type) {
        case "cache-get": {
          const entry = await getFromIDB(payload["url"]);
          response = entry ? { found: true, data: entry.data, metadata: entry.metadata } : { found: false };
          break;
        }
        case "cache-set": {
          const entry = {
            url: payload["url"],
            data: payload["data"],
            metadata: payload["metadata"],
            cachedAt: Date.now(),
            qualityTier: "high",
            upgradeable: false
          };
          await saveToIDB(entry);
          response = { stored: true };
          break;
        }
        case "cache-delete": {
          response = { deleted: await deleteFromIDB(payload["url"]) };
          break;
        }
        case "cache-clear": {
          await clearIDB();
          stats.hits = 0;
          stats.misses = 0;
          response = { cleared: true };
          break;
        }
        case "stats": {
          response = await getStatsFromIDB();
          break;
        }
        case "evict": {
          const fraction = payload["fraction"] ?? EVICT_BATCH_PERCENT;
          await evictOldestEntries(fraction);
          response = { evicted: true };
          break;
        }
        case "ping": {
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
})();
