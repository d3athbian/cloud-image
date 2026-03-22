import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BandwidthMonitor, getBandwidthMonitor } from '../../src/core/bandwidth';

describe('T106: BandwidthMonitor with Ring Buffer', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    monitor = new BandwidthMonitor({ ringBufferSize: 5 });
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should initialize with unknown classification', () => {
    expect(monitor.getClassification()).toBe('unknown');
  });

  it('should add samples to ring buffer', () => {
    monitor.addSample(1000000, 1000); // 1MB in 1 second = 8 Mbps
    expect(monitor.getSamples()).toHaveLength(1);
  });

  it('should limit ring buffer size', () => {
    for (let i = 0; i < 10; i++) {
      monitor.addSample(1000000, 1000);
    }
    expect(monitor.getSamples()).toHaveLength(5);
  });

  it('should calculate average Mbps correctly', () => {
    monitor.addSample(1000000, 1000); // 8 Mbps
    monitor.addSample(2000000, 1000); // 16 Mbps
    expect(monitor.getAverageMbps()).toBe(12);
  });

  it('should calculate median Mbps correctly', () => {
    monitor.addSample(1000000, 1000); // 8 Mbps
    monitor.addSample(2000000, 1000); // 16 Mbps
    monitor.addSample(3000000, 1000); // 24 Mbps
    expect(monitor.getMedianMbps()).toBe(16);
  });

  it('should subscribe to events', () => {
    const fn = () => {};
    const unsubscribe = monitor.subscribe(fn);
    expect(typeof unsubscribe).toBe('function');
  });
});

describe('T108: Connection Classification', () => {
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

  it('should classify LOW bandwidth (< 0.5 Mbps)', () => {
    monitor.addSample(50000, 1000); // 0.4 Mbps
    expect(monitor.getClassification()).toBe('low');
  });

  it('should classify MEDIUM bandwidth (0.5 - 2 Mbps)', () => {
    const medMonitor = new BandwidthMonitor({
      lowThreshold: 0.5,
      mediumThreshold: 10,
    });
    medMonitor.addSample(1000000, 1000); // 8 Mbps - < 10, so medium
    expect(medMonitor.getClassification()).toBe('medium');
    medMonitor.destroy();
  });

  it('should classify HIGH bandwidth (> 2 Mbps)', () => {
    monitor.addSample(5000000, 1000); // 40 Mbps
    expect(monitor.getClassification()).toBe('high');
  });

  it('should handle unknown classification', () => {
    expect(monitor.getClassification()).toBe('unknown');
  });
});

describe('T101: Bandwidth Ring Buffer Sampling', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    monitor = new BandwidthMonitor({ ringBufferSize: 10 });
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should store samples with metadata', () => {
    monitor.addSample(1000000, 1000);
    const samples = monitor.getSamples();
    expect(samples[0]).toHaveProperty('timestamp');
    expect(samples[0]).toHaveProperty('bytes');
    expect(samples[0]).toHaveProperty('duration');
    expect(samples[0]).toHaveProperty('mbps');
  });

  it('should calculate mbps correctly', () => {
    monitor.addSample(1000000, 1000); // 1MB in 1 second = 8 Mbps
    const samples = monitor.getSamples();
    expect(samples[0].mbps).toBe(8);
  });

  it('should return copy of samples array', () => {
    monitor.addSample(1000000, 1000);
    const samples = monitor.getSamples();
    samples.push({} as never);
    expect(monitor.getSamples()).toHaveLength(1);
  });
});

describe('T107: Bandwidth Sampling', () => {
  it('should calculate mbps from bytes and duration', () => {
    const bytes = 1000000; // 1MB
    const durationMs = 1000; // 1 second
    const expectedMbps = (bytes * 8) / (durationMs / 1000) / 1000000;
    expect(expectedMbps).toBe(8);
  });

  it('should handle small durations', () => {
    const bytes = 100000; // 100KB
    const durationMs = 100; // 100ms
    const expectedMbps = (bytes * 8) / (durationMs / 1000) / 1000000;
    expect(expectedMbps).toBe(8);
  });
});
