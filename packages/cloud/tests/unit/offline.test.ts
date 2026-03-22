import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultOfflineStrategy, AggressiveOfflineStrategy, createOfflineStrategy } from '../../src/core/offline';
import type { CacheEntry } from '../../src/core/types';

function createMockEntry(url: string): CacheEntry {
  return {
    url,
    data: new ArrayBuffer(1000),
    metadata: {
      size: 1000,
      mimeType: 'image/jpeg',
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
    },
    qualityTier: 'medium',
    upgradeable: true,
  };
}

describe('T060: Offline Detection and Caching Strategy', () => {
  describe('DefaultOfflineStrategy', () => {
    let strategy: DefaultOfflineStrategy;

    beforeEach(() => {
      strategy = new DefaultOfflineStrategy();
    });

    it('should have default name', () => {
      expect(strategy.name).toBe('default');
    });

    it('should register and retrieve entries', async () => {
      const entry = createMockEntry('https://example.com/image.jpg');
      strategy.registerEntry(entry);
      
      expect(await strategy.checkAvailability(entry.url)).toBe(true);
    });

    it('should return null for unavailable entries', async () => {
      expect(await strategy.getOfflineEntry('https://example.com/nonexistent.jpg')).toBeNull();
    });

    it('should clear all entries', async () => {
      strategy.registerEntry(createMockEntry('https://example.com/1.jpg'));
      strategy.registerEntry(createMockEntry('https://example.com/2.jpg'));
      strategy.clear();
      
      expect(strategy.getCachedUrls()).toHaveLength(0);
    });

    it('should track cached URLs', async () => {
      strategy.registerEntry(createMockEntry('https://example.com/1.jpg'));
      strategy.registerEntry(createMockEntry('https://example.com/2.jpg'));
      
      const urls = strategy.getCachedUrls();
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com/1.jpg');
    });

    it('should return cache size', () => {
      strategy.registerEntry(createMockEntry('https://example.com/1.jpg'));
      expect(strategy.getCacheSize()).toBe(1);
    });
  });

  describe('AggressiveOfflineStrategy', () => {
    let strategy: AggressiveOfflineStrategy;

    beforeEach(() => {
      strategy = new AggressiveOfflineStrategy();
    });

    it('should have aggressive name', () => {
      expect(strategy.name).toBe('aggressive');
    });

    it('should register and retrieve entries', async () => {
      const entry = createMockEntry('https://example.com/image.jpg');
      strategy.registerEntry(entry);
      
      expect(await strategy.checkAvailability(entry.url)).toBe(true);
    });

    it('should evict oldest entries when full', async () => {
      for (let i = 0; i < 510; i++) {
        strategy.registerEntry(createMockEntry(`https://example.com/image${i}.jpg`));
      }
      
      const newestUrl = `https://example.com/image${509}.jpg`;
      expect(await strategy.checkAvailability(newestUrl)).toBe(true);
    });

    it('should clear all entries', async () => {
      strategy.registerEntry(createMockEntry('https://example.com/1.jpg'));
      strategy.clear();
      
      expect(await strategy.checkAvailability('https://example.com/1.jpg')).toBe(false);
    });
  });

  describe('Factory', () => {
    it('should create default strategy', () => {
      const strategy = createOfflineStrategy('default');
      expect(strategy.name).toBe('default');
    });

    it('should create aggressive strategy', () => {
      const strategy = createOfflineStrategy('aggressive');
      expect(strategy.name).toBe('aggressive');
    });

    it('should default to default strategy', () => {
      const strategy = createOfflineStrategy();
      expect(strategy.name).toBe('default');
    });
  });
});
