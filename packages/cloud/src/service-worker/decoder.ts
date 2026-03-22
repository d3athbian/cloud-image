export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  hasAlpha: boolean;
}

export interface DecodeResult {
  success: boolean;
  image?: DecodedImage;
  error?: string;
}

export async function decodeImage(data: ArrayBuffer, mimeType: string): Promise<DecodeResult> {
  try {
    const blob = new Blob([data], { type: mimeType });
    const bitmap = await createImageBitmap(blob);
    
    return {
      success: true,
      image: {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        hasAlpha: bitmap.width > 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode image',
    };
  }
}

export async function validateImageData(data: ArrayBuffer, mimeType: string): Promise<boolean> {
  const result = await decodeImage(data, mimeType);
  if (result.success && result.image) {
    result.image.bitmap.close();
    return true;
  }
  return false;
}

export function getImageDimensions(data: ArrayBuffer, mimeType: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: mimeType });
    const image = new Image();
    
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      image.remove();
    };
    
    image.onerror = () => {
      resolve(null);
      image.remove();
    };
    
    image.src = URL.createObjectURL(blob);
  });
}