import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebAdapter } from '../../../src/adapters/web';

const mockIDBInstance = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  getAll: vi.fn(),
  getAllKeys: vi.fn(),
  clear: vi.fn(),
  close: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockIDBInstance)),
}));

describe('T034: WebAdapter (IndexedDB)', () => {
  let adapter: WebAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new WebAdapter();
    await adapter.init();
  });

  afterEach(() => {
    adapter.destroy();
  });

  it('should have web platform type', () => {
    expect(adapter.platform).toBe('web');
  });

  it('should initialize IndexedDB connection', async () => {
    expect(mockIDBInstance.get).not.toHaveBeenCalled();
  });

  it('should get entry from IndexedDB', async () => {
    const mockEntry = {
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

    mockIDBInstance.get.mockResolvedValue(mockEntry);

    const result = await adapter.get('https://example.com/image.jpg');
    
    expect(mockIDBInstance.get).toHaveBeenCalledWith('images', 'https://example.com/image.jpg');
    expect(result?.url).toBe(mockEntry.url);
  });

  it('should return null for non-existent entry', async () => {
    mockIDBInstance.get.mockResolvedValue(undefined);

    const result = await adapter.get('https://example.com/nonexistent.jpg');
    expect(result).toBeNull();
  });

  it('should store entry in IndexedDB', async () => {
    const mockEntry = {
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

    mockIDBInstance.put.mockResolvedValue(undefined);

    await adapter.set(mockEntry);
    
    expect(mockIDBInstance.put).toHaveBeenCalledWith('images', expect.objectContaining({ url: mockEntry.url }));
  });

  it('should delete entry from IndexedDB', async () => {
    mockIDBInstance.count.mockResolvedValue(1);
    mockIDBInstance.delete.mockResolvedValue(undefined);

    const result = await adapter.delete('https://example.com/image.jpg');
    
    expect(result).toBe(true);
    expect(mockIDBInstance.delete).toHaveBeenCalledWith('images', 'https://example.com/image.jpg');
  });

  it('should return false when deleting non-existent entry', async () => {
    mockIDBInstance.count.mockResolvedValue(0);

    const result = await adapter.delete('https://example.com/nonexistent.jpg');
    expect(result).toBe(false);
  });

  it('should check if entry exists', async () => {
    mockIDBInstance.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    expect(await adapter.has('https://example.com/exists.jpg')).toBe(true);
    expect(await adapter.has('https://example.com/not-exists.jpg')).toBe(false);
  });

  it('should get all keys', async () => {
    mockIDBInstance.getAllKeys.mockResolvedValue(['url1', 'url2', 'url3']);

    const keys = await adapter.keys();
    expect(keys).toEqual(['url1', 'url2', 'url3']);
  });

  it('should clear all entries', async () => {
    mockIDBInstance.clear.mockResolvedValue(undefined);

    await adapter.clear();
    expect(mockIDBInstance.clear).toHaveBeenCalledWith('images');
  });

  it('should calculate total size', async () => {
    mockIDBInstance.getAll.mockResolvedValue([
      { metadata: { size: 1000 } },
      { metadata: { size: 2000 } },
      { metadata: { size: 3000 } },
    ]);

    const size = await adapter.getSize();
    expect(size).toBe(6000);
  });

  it('should destroy connection', () => {
    adapter.destroy();
    expect(mockIDBInstance.close).toHaveBeenCalled();
  });
});
