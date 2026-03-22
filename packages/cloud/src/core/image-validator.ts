export interface ImageValidationResult {
  valid: boolean;
  mimeType: string | null;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageValidationConfig {
  maxSize?: number;
  allowedTypes?: string[];
  validateHeaders?: boolean;
}

const IMAGE_SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF ... WEBP
  'image/bmp': [0x42, 0x4D],
};

const MAX_DEFAULT_SIZE = 50 * 1024 * 1024; // 50MB

export class ImageValidator {
  private config: Required<ImageValidationConfig>;

  constructor(config: ImageValidationConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? MAX_DEFAULT_SIZE,
      allowedTypes: config.allowedTypes ?? Object.keys(IMAGE_SIGNATURES),
      validateHeaders: config.validateHeaders ?? true,
    };
  }

  async validate(arrayBuffer: ArrayBuffer): Promise<ImageValidationResult> {
    if (arrayBuffer.byteLength === 0) {
      return { valid: false, mimeType: null, error: 'Empty image data' };
    }

    if (arrayBuffer.byteLength > this.config.maxSize) {
      return {
        valid: false,
        mimeType: null,
        error: `Image exceeds maximum size of ${this.config.maxSize / 1024 / 1024}MB`,
      };
    }

    const mimeType = this.detectMimeType(arrayBuffer);
    
    if (!mimeType) {
      return { valid: false, mimeType: null, error: 'Unknown image format' };
    }

    if (!this.config.allowedTypes.includes(mimeType)) {
      return { valid: false, mimeType, error: `Image type ${mimeType} not allowed` };
    }

    if (this.config.validateHeaders) {
      const headerValid = this.validateHeaders(arrayBuffer, mimeType);
      if (!headerValid) {
        return { valid: false, mimeType, error: 'Invalid image header' };
      }
    }

    return { valid: true, mimeType };
  }

  private detectMimeType(arrayBuffer: ArrayBuffer): string | null {
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));

    // JPEG
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }

    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'image/gif';
    }

    // WebP (RIFF....WEBP)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return 'image/webp';
      }
    }

    // BMP
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return 'image/bmp';
    }

    return null;
  }

  private validateHeaders(arrayBuffer: ArrayBuffer, expectedMimeType: string): boolean {
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));

    switch (expectedMimeType) {
      case 'image/jpeg':
        if (bytes[0] !== 0xFF || bytes[1] !== 0xD8 || bytes[2] !== 0xFF) return false;
        if (bytes[3] === 0x00) return false;
        return true;

      case 'image/png':
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

      case 'image/gif':
        return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;

      case 'image/webp':
        return (
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x42 &&
          bytes[11] === 0x50
        );

      case 'image/bmp':
        return bytes[0] === 0x42 && bytes[1] === 0x4D;

      default:
        return true;
    }
  }

  isAnimatedImage(mimeType: string): boolean {
    return mimeType === 'image/gif' || mimeType === 'image/webp';
  }

  getConfig(): ImageValidationConfig {
    return { ...this.config };
  }

  static getSupportedTypes(): string[] {
    return Object.keys(IMAGE_SIGNATURES);
  }
}

export function isAnimatedGif(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 6));
  if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) {
    return false;
  }
  
  const gif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && bytes[4] === 0x39 && bytes[5] === 0x61;
  return gif;
}

export function getMaxSizeForPlatform(platform: string): number {
  switch (platform) {
    case 'tizen':
    case 'webos':
      return 30 * 1024 * 1024; // 30MB for Smart TVs
    case 'mobile':
      return 40 * 1024 * 1024; // 40MB for mobile
    default:
      return 50 * 1024 * 1024; // 50MB default
  }
}
