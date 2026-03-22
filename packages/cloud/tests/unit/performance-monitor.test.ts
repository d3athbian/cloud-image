import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor, getPerformanceMonitor } from '../../src/core/performance';

describe('T051: Performance Monitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should initialize with zero metrics', () => {
    const metrics = monitor.getMetrics();
    expect(metrics.messageLatency).toBe(0);
    expect(metrics.decodeTime).toBe(0);
    expect(metrics.totalBlockingTime).toBe(0);
    expect(metrics.processedCount).toBe(0);
  });

  it('should add performance samples', () => {
    monitor.addSample({
      timestamp: Date.now(),
      type: 'message',
      duration: 1.5,
      correlationId: 'test-123',
    });

    const metrics = monitor.getMetrics();
    expect(metrics.processedCount).toBe(1);
    expect(metrics.messageLatency).toBe(1.5);
  });

  it('should calculate average latency correctly', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 2, correlationId: '1' });
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 4, correlationId: '2' });

    const metrics = monitor.getMetrics();
    expect(metrics.messageLatency).toBe(3);
  });

  it('should detect 2ms blocking threshold', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 1.5, correlationId: '1' });
    expect(monitor.isBlockingThresholdMet()).toBe(true);
  });

  it('should fail 2ms threshold with high latency', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'decode', duration: 5, correlationId: '1' });
    expect(monitor.isBlockingThresholdMet()).toBe(false);
  });

  it('should generate blocking report', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 1.5, correlationId: '1' });
    
    const report = monitor.getBlockingReport();
    expect(report.meetsTarget).toBe(true);
    expect(report.avgBlocking).toBe(1.5);
    expect(report.threshold).toBe(2);
  });

  it('should reset all metrics', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 5, correlationId: '1' });
    monitor.reset();

    const metrics = monitor.getMetrics();
    expect(metrics.processedCount).toBe(0);
    expect(metrics.messageLatency).toBe(0);
  });

  it('should get recent samples', () => {
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 1, correlationId: '1' });
    monitor.addSample({ timestamp: Date.now(), type: 'decode', duration: 2, correlationId: '2' });

    const recent = monitor.getRecentSamples(1);
    expect(recent).toHaveLength(1);
  });

  it('should limit sample size to maxSamples', () => {
    const largeMonitor = new PerformanceMonitor();
    for (let i = 0; i < 1500; i++) {
      largeMonitor.addSample({
        timestamp: Date.now(),
        type: 'message',
        duration: 1,
        correlationId: `sample-${i}`,
      });
    }

    const samples = largeMonitor.getRecentSamples(2000);
    expect(samples.length).toBeLessThanOrEqual(1000);
  });
});

describe('T052: Main Thread Blocking Detection', () => {
  it('should track decode time separately', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.addSample({ timestamp: Date.now(), type: 'decode', duration: 0.8, correlationId: '1' });
    
    const metrics = monitor.getMetrics();
    expect(metrics.decodeTime).toBe(0.8);
  });

  it('should track transfer time separately', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.addSample({ timestamp: Date.now(), type: 'transfer', duration: 0.3, correlationId: '1' });
    
    const metrics = monitor.getMetrics();
    expect(metrics.transferTime).toBe(0.3);
  });

  it('should aggregate total blocking from all types', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.addSample({ timestamp: Date.now(), type: 'message', duration: 1, correlationId: '1' });
    monitor.addSample({ timestamp: Date.now(), type: 'decode', duration: 1, correlationId: '2' });
    
    const metrics = monitor.getMetrics();
    expect(metrics.totalBlockingTime).toBe(1);
  });
});
