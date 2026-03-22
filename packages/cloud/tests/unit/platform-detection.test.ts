import { describe, it, expect } from 'vitest';
import { createAdapter } from '../../src/adapters/factory';

describe('T033: Platform Detection via Factory', () => {
  it('should create memory adapter with override', () => {
    const adapter = createAdapter({ platformOverride: 'memory' });
    expect(adapter.platform).toBe('memory');
  });

  it('should create web adapter with override', () => {
    const adapter = createAdapter({ platformOverride: 'web' });
    expect(adapter.platform).toBe('web');
  });

  it('should create tizen adapter with override', () => {
    const adapter = createAdapter({ platformOverride: 'tizen' });
    expect(adapter.platform).toBe('tizen');
  });

  it('should create webos adapter with override', () => {
    const adapter = createAdapter({ platformOverride: 'webos' });
    expect(adapter.platform).toBe('webos');
  });

  it('should default to memory when window is undefined', () => {
    const originalWindow = (global as { window?: unknown }).window;
    (global as { window?: undefined }).window = undefined;
    try {
      const adapter = createAdapter();
      expect(adapter.platform).toBe('memory');
    } finally {
      (global as { window?: unknown }).window = originalWindow;
    }
  });
});
