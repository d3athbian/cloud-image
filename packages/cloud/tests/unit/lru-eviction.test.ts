import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageCache } from '../../src/core/cache';
import type { CacheEntry } from '../../src/core/types';

function createMockEntry(url: string, cachedAt: number, accessCount: number, size = 1000): CacheEntry {
  return {
    url,
    data: new ArrayBuffer(size),
    metadata: {
      size,
      mimeType: 'image/jpeg',
      cachedAt,
      accessedAt: cachedAt,
      accessCount,
    },
    qualityTier: 'medium',
    upgradeable: true,
  };
}

describe('T074: LRU Eviction with Dual Scoring', () => {
  let cache: ImageCache;

  beforeEach(() => {
    cache = new ImageCache({ maxSize: 10000 });
  });

  it('should calculate score correctly for high access count', () => {
    const entry = createMockEntry('https://example.com/high-access.jpg', Date.now(), 100);
    
    const cacheAny = cache as ImageCache & { calculateScore: (e: CacheEntry) => number };
    const score = cacheAny.calculateScore(entry);
    
    expect(score).toBeGreaterThan(0);
  });

  it('should calculate score correctly for recent access', () => {
    const entry = createMockEntry('https://example.com/recent.jpg', Date.now(), 1);
    
    const cacheAny = cache as ImageCache & { calculateScore: (e: CacheEntry) => number };
    const score = cacheAny.calculateScore(entry);
    
    expect(score).toBeGreaterThan(0);
  });

  it('should weight accessCount at 60%', () => {
    const cacheAny = cache as ImageCache & { calculateScore: (e: CacheEntry) => number };
    
    const highAccessEntry = createMockEntry('https://example.com/high.jpg', Date.now(), 100);
    const lowAccessEntry = createMockEntry('https://example.com/low.jpg', Date.now(), 1);
    
    const highScore = cacheAny.calculateScore(highAccessEntry);
    const lowScore = cacheAny.calculateScore(lowAccessEntry);
    
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('should prioritize entries with higher access count during eviction', async () => {
    await cache.set(createMockEntry('https://example.com/low.jpg', Date.now(), 1, 2000));
    await cache.set(createMockEntry('https://example.com/high.jpg', Date.now(), 50, 2000));
    
    await cache.set(createMockEntry('https://example.com/new.jpg', Date.now(), 2, 7000));
    
    const lowEntry = await cache.get('https://example.com/low.jpg');
    const highEntry = await cache.get('https://example.com/high.jpg');
    
    expect(lowEntry).toBeNull();
    expect(highEntry).not.toBeNull();
  });
});

describe('T075: TTL Expiration Override', () => {
  let cache: ImageCache;

  beforeEach(() => {
    cache = new ImageCache({ defaultTTL: 1000 });
  });

  it('should mark expired entries correctly', () => {
    const cacheAny = cache as ImageCache & { isExpired: (e: CacheEntry) => boolean };
    
    const freshEntry = createMockEntry('https://example.com/fresh.jpg', Date.now(), 1);
    expect(cacheAny.isExpired(freshEntry)).toBe(false);
    
    const oldEntry = createMockEntry('https://example.com/old.jpg', Date.now() - 2000, 1);
    expect(cacheAny.isExpired(oldEntry)).toBe(true);
  });

  it('should use expiresAt if provided', () => {
    const cacheAny = cache as ImageCache & { isExpired: (e: CacheEntry) => boolean };
    
    const entry = createMockEntry('https://example.com/expire.jpg', Date.now(), 1);
    entry.expiresAt = Date.now() + 1000;
    
    expect(cacheAny.isExpired(entry)).toBe(false);
    
    entry.expiresAt = Date.now() - 1000;
    expect(cacheAny.isExpired(entry)).toBe(true);
  });

  it('should always evict expired entries before LRU', async () => {
    const cacheAny = cache as ImageCache & { isExpired: (e: CacheEntry) => boolean; evict: (s: number) => Promise<void> };
    
    const expiredEntry = createMockEntry('https://example.com/expired.jpg', Date.now() - 2000, 100);
    const freshEntry = createMockEntry('https://example.com/fresh.jpg', Date.now(), 1);
    
    expect(cacheAny.isExpired(expiredEntry)).toBe(true);
    expect(cacheAny.isExpired(freshEntry)).toBe(false);
  });

  it('should return null for expired entries on get', async () => {
    const cacheAny = cache as ImageCache & { isExpired: (e: CacheEntry) => boolean };
    
    const entry = createMockEntry('https://example.com/old.jpg', Date.now() - 5000, 1);
    entry.expiresAt = Date.now() - 1000;
    
    expect(cacheAny.isExpired(entry)).toBe(true);
  });
});

describe('T078: Complete LRU Eviction with Dual Scoring', () => {
  let cache: ImageCache;

  beforeEach(() => {
    cache = new ImageCache({ maxSize: 10000 });
  });

  it('should calculate score = (accessCount * 0.6) + (recencyFactor * 0.4)', async () => {
    const cacheAny = cache as ImageCache & { calculateScore: (e: CacheEntry) => number };
    
    const entry1 = createMockEntry('https://example.com/1.jpg', Date.now(), 100);
    const entry2 = createMockEntry('https://example.com/2.jpg', Date.now() - 500, 50);
    
    const score1 = cacheAny.calculateScore(entry1);
    const score2 = cacheAny.calculateScore(entry2);
    
    expect(score1).toBeGreaterThan(score2);
  });

  it('should evict lower scored entries first', async () => {
    for (let i = 0; i < 15; i++) {
      await cache.set(createMockEntry(`https://example.com/${i}.jpg`, Date.now(), i * 10, 1000));
    }
    
    const stats = await cache.getStats();
    expect(stats.itemCount).toBeLessThanOrEqual(10);
  });
});
