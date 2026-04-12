import { FormatDetector, type ImageFormat } from './format-detector';

export async function fetchWithFormatSupport(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const acceptHeader = FormatDetector.getAcceptHeader();
  
  const headers = new Headers(options.headers);
  headers.set('Accept', acceptHeader);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export interface FetchWithFallbackOptions extends RequestInit {
  fallbackFormats?: ImageFormat[];
  maxRetries?: number;
}

export async function fetchWithImageFallback(
  url: string,
  options: FetchWithFallbackOptions = {}
): Promise<Response> {
  const formats = options.fallbackFormats ?? ['avif', 'webp', 'jpeg'];
  const maxRetries = options.maxRetries ?? formats.length;
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    const format = formats[i];
    try {
      const acceptHeader = getAcceptHeaderForFormat(format);
      
      const headers = new Headers(options.headers);
      headers.set('Accept', acceptHeader);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (response.ok) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }
  }
  
  throw lastError || new Error('All format attempts failed');
}

function getAcceptHeaderForFormat(format: ImageFormat): string {
  switch (format) {
    case 'avif':
      return 'image/avif';
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return '*/*';
  }
}