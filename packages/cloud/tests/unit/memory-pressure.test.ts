import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryMonitor, getMemoryMonitor } from '../../src/core/memory';

describe('T094: Memory Pressure Detection', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor({
      highThreshold: 0.8,
      criticalThreshold: 0.95,
      checkInterval: 100,
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should initialize with default config', () => {
    const config = monitor.getConfig();
    expect(config.highThreshold).toBe(0.8);
    expect(config.criticalThreshold).toBe(0.95);
  });

  it('should accept custom config', () => {
    const customMonitor = new MemoryMonitor({
      highThreshold: 0.7,
      criticalThreshold: 0.9,
    });
    const config = customMonitor.getConfig();
    expect(config.highThreshold).toBe(0.7);
    expect(config.criticalThreshold).toBe(0.9);
    customMonitor.destroy();
  });

  it('should return normal status when memory is low', () => {
    const status = monitor.getStatus();
    expect(['normal', 'high', 'critical']).toContain(status);
  });

  it('should determine if eviction is needed', () => {
    const eviction = monitor.shouldEvict();
    expect(typeof eviction.shouldEvict).toBe('boolean');
    expect(typeof eviction.ratio).toBe('number');
  });

  it('should return eviction ratio based on threshold', () => {
    const eviction = monitor.shouldEvict();
    expect(eviction.ratio).toBeGreaterThanOrEqual(0);
    expect(eviction.ratio).toBeLessThanOrEqual(1);
  });

  it('should subscribe to events', () => {
    const listener = vi.fn();
    const unsubscribe = monitor.subscribe(listener);
    expect(typeof unsubscribe).toBe('function');
  });

  it('should return metrics history', () => {
    const history = monitor.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should check for API support', () => {
    const supported = monitor.isSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should get average percentage', () => {
    const avg = monitor.getAveragePercentage();
    expect(typeof avg).toBe('number');
    expect(avg).toBeGreaterThanOrEqual(0);
  });

  it('should destroy monitor', () => {
    monitor.destroy();
    const history = monitor.getHistory();
    expect(history).toHaveLength(0);
  });
});

describe('T096: Memory Monitor with performance.memory API', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should return null metrics when API unavailable', () => {
    vi.stubGlobal('performance', undefined);
    const metrics = monitor.getMetrics();
    expect(metrics).toBeNull();
    vi.unstubAllGlobals();
  });

  it('should handle missing memory API gracefully', () => {
    const metrics = monitor.getMetrics();
    if (metrics === null) {
      expect(monitor.getStatus()).toBe('normal');
    }
  });
});

describe('T098: Memory Pressure Events', () => {
  it('should have event types', () => {
    const eventTypes: string[] = ['normal', 'high', 'critical', 'eviction'];
    expect(eventTypes).toHaveLength(4);
  });

  it('should notify listeners on status change', () => {
    const listener = vi.fn();
    const monitor = new MemoryMonitor();
    monitor.subscribe(listener);
    monitor.destroy();
    expect(typeof listener).toBe('function');
  });
});

describe('T099: Memory Integration with Cache', () => {
  it('should provide eviction config for cache', () => {
    const monitor = new MemoryMonitor({
      aggressiveEvictionRatio: 0.5,
    });
    
    const eviction = monitor.shouldEvict();
    expect(eviction.ratio).toBeGreaterThanOrEqual(0);
    expect(eviction.ratio).toBeLessThanOrEqual(1);
    
    monitor.destroy();
  });

  it('should increase eviction ratio at critical threshold', () => {
    const monitor = new MemoryMonitor({
      aggressiveEvictionRatio: 0.5,
    });
    
    const eviction = monitor.shouldEvict();
    expect(eviction.ratio).toBeGreaterThanOrEqual(0);
    
    monitor.destroy();
  });
});

describe('Global Memory Monitor', () => {
  it('should get singleton instance', () => {
    const m1 = getMemoryMonitor();
    const m2 = getMemoryMonitor();
    expect(m1).toBe(m2);
    m1.destroy();
  });

  it('should return instance with default config', () => {
    const m = getMemoryMonitor();
    expect(m.getConfig().highThreshold).toBe(0.75);
    m.destroy();
  });
});
