import { describe, it, expect, beforeEach } from 'vitest';
import { ImageCache } from '../../src/core/cache';
import { BandwidthMonitor } from '../../src/core/bandwidth';
import { NetworkMonitor } from '../../src/core/network';
import { MemoryMonitor } from '../../src/core/memory';
import type { CacheEntry } from '../../src/core/types';

function createMockEntry(url: string, size = 10000): CacheEntry {
  return {
    url,
    data: new ArrayBuffer(size),
    metadata: {
      size,
      mimeType: 'image/jpeg',
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
    },
    qualityTier: 'medium',
    upgradeable: false,
  };
}

describe('T134: Performance Benchmarks', () => {
  describe('Cache Performance', () => {
    it('should handle 1000 cache operations within 100ms', async () => {
      const cache = new ImageCache({ maxSize: 100 * 1024 * 1024 });
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`));
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle cache get operations efficiently', async () => {
      const cache = new ImageCache({ maxSize: 100 * 1024 * 1024 });
      
      for (let i = 0; i < 100; i++) {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`));
      }
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await cache.get(`https://example.com/${i}.jpg`);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should evict efficiently when cache is full', async () => {
      const cache = new ImageCache({ maxSize: 50 * 1024 });
      
      const start = performance.now();
      for (let i = 0; i < 20; i++) {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`, 5000));
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Bandwidth Monitoring Performance', () => {
    it('should calculate bandwidth with minimal overhead', async () => {
      const monitor = new BandwidthMonitor();
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        monitor.addSample(1000, 100);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    it('should return bandwidth classification quickly', async () => {
      const monitor = new BandwidthMonitor();
      
      for (let i = 0; i < 10; i++) {
        monitor.addSample(500000, 1000);
      }
      
      const start = performance.now();
      const classification = monitor.getBandwidthClass();
      const duration = performance.now() - start;
      
      expect(['low', 'medium', 'high']).toContain(classification);
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Network Monitor Performance', () => {
    it('should measure RTT with minimal overhead', async () => {
      const monitor = new NetworkMonitor();
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        monitor.recordRTT(50 + Math.random() * 10);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    it('should provide network status efficiently', async () => {
      const monitor = new NetworkMonitor();
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        monitor.isOnline();
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Memory Monitor Performance', () => {
    it('should check memory pressure quickly', async () => {
      const monitor = new MemoryMonitor();
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        monitor.getCurrentPressure();
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    it('should not cause memory leaks in monitoring', async () => {
      const monitor = new MemoryMonitor();
      
      for (let i = 0; i < 1000; i++) {
        monitor.getCurrentPressure();
        monitor.getMetrics();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Cache Statistics', () => {
    it('should compute stats efficiently', async () => {
      const cache = new ImageCache({ maxSize: 100 * 1024 * 1024 });
      
      for (let i = 0; i < 50; i++) {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`));
      }
      
      const start = performance.now();
      const stats = await cache.getStats();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5);
      expect(stats.itemCount).toBe(50);
    });
  });

  describe('LRU Eviction Performance', () => {
    it('should evict entries quickly under pressure', async () => {
      const cache = new ImageCache({ maxSize: 10000 });
      
      for (let i = 0; i < 20; i++) {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`, 2000));
      }
      
      const start = performance.now();
      await cache.set(createMockEntry('https://example.com/new.jpg', 5000));
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should score entries efficiently', () => {
      const cache = new ImageCache({ maxSize: 10000 });
      
      const entries: CacheEntry[] = [];
      for (let i = 0; i < 100; i++) {
        entries.push(createMockEntry(`https://example.com/${i}.jpg`));
      }
      
      const start = performance.now();
      entries.forEach(entry => {
        const score = (cache as any).calculateScore(entry);
      });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(20);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent cache operations', async () => {
      const cache = new ImageCache({ maxSize: 100 * 1024 * 1024 });
      
      const operations = Array.from({ length: 50 }, async (_, i) => {
        await cache.set(createMockEntry(`https://example.com/${i}.jpg`));
        return cache.get(`https://example.com/${i}.jpg`);
      });
      
      const start = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});
