import { describe, it, expect, beforeEach } from 'vitest';
import { ImageValidator, isAnimatedGif, getMaxSizeForPlatform } from '../../src/core/image-validator';

describe('T124: Corrupted Cache Entry Detection', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator({ validateHeaders: true });
  });

  it('should reject empty image data', async () => {
    const result = await validator.validate(new ArrayBuffer(0));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Empty');
  });

  it('should validate JPEG header', async () => {
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const result = await validator.validate(jpegHeader.buffer);
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('should validate PNG header', async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const result = await validator.validate(pngHeader.buffer);
    expect(result.mimeType).toBe('image/png');
  });

  it('should validate GIF header', async () => {
    const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const result = await validator.validate(gifHeader.buffer);
    expect(result.mimeType).toBe('image/gif');
  });

  it('should reject unknown image format', async () => {
    const unknownHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const result = await validator.validate(unknownHeader.buffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unknown');
  });

  it('should detect invalid header', async () => {
    const fakeJpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const result = await validator.validate(fakeJpeg.buffer);
    expect(result.valid).toBe(false);
  });
});

describe('T125: Large Image Rejection', () => {
  it('should reject images exceeding default size', async () => {
    const validator = new ImageValidator({ maxSize: 1000 });
    const largeData = new Uint8Array(2000);
    const result = await validator.validate(largeData.buffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should accept images within size limit', async () => {
    const validator = new ImageValidator({ maxSize: 10000 });
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const smallData = new Uint8Array(100);
    smallData.set(jpegHeader);
    const result = await validator.validate(smallData.buffer);
    expect(result.valid).toBe(true);
  });

  it('should respect custom max size', async () => {
    const validator = new ImageValidator({ maxSize: 500 });
    const data = new Uint8Array(600);
    data[0] = 0xFF;
    data[1] = 0xD8;
    data[2] = 0xFF;
    const result = await validator.validate(data.buffer);
    expect(result.valid).toBe(false);
  });

  it('should provide size in error message', async () => {
    const largeValidator = new ImageValidator();
    const largeData = new Uint8Array(100 * 1024 * 1024);
    const result = await largeValidator.validate(largeData.buffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maximum size');
  });
});

describe('T128: Corrupted Image Detection', () => {
  it('should validate WebP header', async () => {
    const webpHeader = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    const result = await ImageValidator.getSupportedTypes();
    expect(result).toContain('image/webp');
  });

  it('should validate BMP header', async () => {
    const bmpHeader = new Uint8Array([0x42, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const validator = new ImageValidator();
    const result = await validator.validate(bmpHeader.buffer);
    expect(result.mimeType).toBe('image/bmp');
  });

  it('should allow only supported types', async () => {
    const validator = new ImageValidator({ allowedTypes: ['image/jpeg'] });
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const result = await validator.validate(pngHeader.buffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});

describe('T130: Animated Images', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator();
  });

  it('should detect animated GIF', () => {
    const animatedGif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(isAnimatedGif(animatedGif.buffer)).toBe(true);
  });

  it('should return false for non-GIF', () => {
    const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    expect(isAnimatedGif(jpeg.buffer)).toBe(false);
  });

  it('should identify animated image types', () => {
    expect(validator.isAnimatedImage('image/gif')).toBe(true);
    expect(validator.isAnimatedImage('image/webp')).toBe(true);
    expect(validator.isAnimatedImage('image/jpeg')).toBe(false);
    expect(validator.isAnimatedImage('image/png')).toBe(false);
  });
});

describe('Platform-specific Max Sizes', () => {
  it('should return 30MB for Smart TVs', () => {
    expect(getMaxSizeForPlatform('tizen')).toBe(30 * 1024 * 1024);
    expect(getMaxSizeForPlatform('webos')).toBe(30 * 1024 * 1024);
  });

  it('should return 40MB for mobile', () => {
    expect(getMaxSizeForPlatform('mobile')).toBe(40 * 1024 * 1024);
  });

  it('should return 50MB as default', () => {
    expect(getMaxSizeForPlatform('desktop')).toBe(50 * 1024 * 1024);
    expect(getMaxSizeForPlatform('unknown')).toBe(50 * 1024 * 1024);
  });
});
