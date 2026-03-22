import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryAdapter } from '../../../src/adapters/memory';
import type { CacheEntry } from '../../src/core/types';

function createMockEntry(url: string, size: number = 1000): CacheEntry {
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
    upgradeable: true,
  };
}

describe('T035: MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter(10000);
  });

  it('should initialize with empty cache', async () => {
    await adapter.init();
    expect(await adapter.getSize()).toBe(0);
    expect(await adapter.keys()).toEqual([]);
  });

  it('should store and retrieve entries', async () => {
    const entry = createMockEntry('https://example.com/image.jpg');
    await adapter.set(entry);
    
    const retrieved = await adapter.get(entry.url);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.url).toBe(entry.url);
  });

  it('should update access metadata on get', async () => {
    const entry = createMockEntry('https://example.com/image.jpg');
    await adapter.set(entry);
    
    const first = await adapter.get(entry.url);
    const accessCountAfterFirst = first?.metadata.accessCount;
    
    const second = await adapter.get(entry.url);
    expect(second?.metadata.accessCount).toBe(accessCountAfterFirst! + 1);
  });

  it('should delete entries', async () => {
    const entry = createMockEntry('https://example.com/image.jpg');
    await adapter.set(entry);
    
    expect(await adapter.has(entry.url)).toBe(true);
    await adapter.delete(entry.url);
    expect(await adapter.has(entry.url)).toBe(false);
  });

  it('should clear all entries', async () => {
    await adapter.set(createMockEntry('https://example.com/1.jpg'));
    await adapter.set(createMockEntry('https://example.com/2.jpg'));
    
    await adapter.clear();
    
    expect(await adapter.getSize()).toBe(0);
    expect(await adapter.keys()).toEqual([]);
  });

  it('should track size correctly', async () => {
    const entry1 = createMockEntry('https://example.com/1.jpg', 1000);
    const entry2 = createMockEntry('https://example.com/2.jpg', 2000);
    
    await adapter.set(entry1);
    expect(await adapter.getSize()).toBe(1000);
    
    await adapter.set(entry2);
    expect(await adapter.getSize()).toBe(3000);
  });

  it('should return null for non-existent entries', async () => {
    const result = await adapter.get('https://example.com/nonexistent.jpg');
    expect(result).toBeNull();
  });

  it('should handle multiple entries', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => 
      createMockEntry(`https://example.com/image${i}.jpg`, 100)
    );
    
    for (const entry of entries) {
      await adapter.set(entry);
    }
    
    expect(await adapter.keys()).toHaveLength(10);
  });

  it('should destroy adapter', async () => {
    await adapter.set(createMockEntry('https://example.com/image.jpg'));
    adapter.destroy();
    
    const result = await adapter.get('https://example.com/image.jpg');
    expect(result).toBeNull();
  });
});
