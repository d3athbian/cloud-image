const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp|jfif|heic|heif)$/i;

export const url = {
  isValid: (urlStr: string): boolean => {
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  },
  
  isImage: (urlStr: string): boolean => {
    try {
      const urlObj = new URL(urlStr);
      const pathname = urlObj.pathname;
      return IMAGE_EXTENSIONS.test(pathname);
    } catch {
      return false;
    }
  },
  
  isAbsolute: (urlStr: string): boolean => {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },
  
  normalize: (urlStr: string): string => {
    try {
      const urlObj = new URL(urlStr);
      urlObj.hash = '';
      return urlObj.toString();
    } catch {
      return urlStr;
    }
  },
  
  getExtension: (urlStr: string): string => {
    try {
      const urlObj = new URL(urlStr);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([^./]+)$/);
      return match ? match[1].toLowerCase() : '';
    } catch {
      return '';
    }
  },
  
  stripQueryParams: (urlStr: string): string => {
    try {
      const urlObj = new URL(urlStr);
      urlObj.search = '';
      urlObj.hash = '';
      return urlObj.toString();
    } catch {
      return urlStr;
    }
  },
};