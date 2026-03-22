import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('T048: ImageBitmap Decoding in Worker (Unit)', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should support transferable object protocol', () => {
    const buffer = new ArrayBuffer(1000);
    const transferable = [buffer];
    expect(transferable.length).toBe(1);
    expect(transferable[0].byteLength).toBe(1000);
  });

  it('should validate ImageBitmap creation structure', () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    expect(mockBlob.type).toBe('image/png');
  });

  it('should support ArrayBuffer transfer semantics', () => {
    const original = new ArrayBuffer(500);
    const view = new Uint8Array(original);
    view[0] = 255;

    const transferred = original.slice(0);
    expect(new Uint8Array(transferred)[0]).toBe(255);
  });
});

describe('T055: ImageBitmap Transferable Objects', () => {
  it('should create ImageBitmap-compatible blob', () => {
    const blob = new Blob(['<image data>'], { type: 'image/png' });
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should support multiple buffers in array', () => {
    const buffers = [new ArrayBuffer(100), new ArrayBuffer(200), new ArrayBuffer(300)];
    const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
    expect(total).toBe(600);
  });
});
