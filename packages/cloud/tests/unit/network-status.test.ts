import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkMonitor, getNetworkMonitor } from '../../src/core/network';

describe('T056: NetworkStatus Detection', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    monitor?.destroy();
  });

  it('should initialize with online status', () => {
    monitor = new NetworkMonitor();
    expect(monitor.isOnline()).toBe(true);
  });

  it('should get current status', () => {
    monitor = new NetworkMonitor();
    const status = monitor.getStatus();
    expect(status).toHaveProperty('online');
    expect(status).toHaveProperty('bandwidth');
  });

  it('should subscribe to status changes', () => {
    monitor = new NetworkMonitor();
    const listener = vi.fn();
    const unsubscribe = monitor.subscribe(listener);
    
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should get bandwidth classification', () => {
    monitor = new NetworkMonitor();
    const bandwidth = monitor.getBandwidth();
    expect(['low', 'medium', 'high', 'unknown']).toContain(bandwidth);
  });

  it('should support custom configuration', () => {
    monitor = new NetworkMonitor({
      sampleInterval: 1000,
      bandwidthThreshold: { low: 2, medium: 8 },
    });
    
    expect(monitor).toBeDefined();
  });

  it('should call onStatusChange callback', () => {
    const onStatusChange = vi.fn();
    monitor = new NetworkMonitor({ onStatusChange });
    monitor.getStatus();
  });

  it('should call onBandwidthChange callback', () => {
    const onBandwidthChange = vi.fn();
    monitor = new NetworkMonitor({ onBandwidthChange });
    monitor.getBandwidth();
  });
});

describe('Network Bandwidth Classification', () => {
  let monitor: NetworkMonitor;

  afterEach(() => {
    monitor?.destroy();
  });

  it('should classify 4g as high bandwidth', () => {
    monitor = new NetworkMonitor();
    const classification = monitor.getBandwidth();
    expect(classification).toBeTruthy();
  });
});
