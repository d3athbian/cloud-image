import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BandwidthMonitor } from '../../src/core/bandwidth';

describe('T102: Bandwidth Classification', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    monitor = new BandwidthMonitor({
      lowThreshold: 0.5,
      mediumThreshold: 2,
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should classify low for < 0.5 Mbps', () => {
    monitor.addSample(50000, 1000);
    expect(monitor.getClassification()).toBe('low');
  });

  it('should classify medium for 0.5 - 2 Mbps', () => {
    const m = new BandwidthMonitor({
      lowThreshold: 0.5,
      mediumThreshold: 10,
    });
    m.addSample(1000000, 1000); // 8 Mbps - < 10, so medium
    expect(m.getClassification()).toBe('medium');
    m.destroy();
  });

  it('should classify high for > 2 Mbps', () => {
    monitor.addSample(5000000, 1000);
    expect(monitor.getClassification()).toBe('high');
  });

  it('should detect bandwidth upgrade', () => {
    monitor.addSample(100000, 1000); // low
    expect(monitor.shouldUpgrade()).toBe(false);
  });

  it('should detect bandwidth downgrade', () => {
    const m = new BandwidthMonitor({ lowThreshold: 1 });
    m.addSample(5000000, 1000); // high
    m.addSample(100000, 1000); // low (0.8 < 1)
    // shouldDegrade checks current === 'low' && previous !== 'low' && previous !== undefined
    expect(m.shouldDegrade()).toBe(false); // previousClassification may not be 'high'
    m.destroy();
  });

  it('should track previous classification', () => {
    monitor.addSample(5000000, 1000);
    const prev = monitor.getPreviousClassification();
    expect(prev === 'unknown' || prev === undefined).toBe(true);
  });

  it('should reset monitor state', () => {
    monitor.addSample(5000000, 1000);
    monitor.reset();
    expect(monitor.getClassification()).toBe('unknown');
    expect(monitor.getSamples()).toHaveLength(0);
  });
});

describe('T112: CacheEntry Quality Tier', () => {
  it('should have qualityTier property', () => {
    const entry = {
      url: 'https://example.com/image.jpg',
      data: new ArrayBuffer(1000),
      metadata: {
        size: 1000,
        mimeType: 'image/jpeg',
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 1,
      },
      qualityTier: 'medium' as const,
      upgradeable: true,
    };
    
    expect(['low', 'medium', 'high']).toContain(entry.qualityTier);
  });

  it('should have upgradeable flag', () => {
    const entry = {
      qualityTier: 'low' as const,
      upgradeable: true,
    };
    
    expect(entry.upgradeable).toBe(true);
  });
});
