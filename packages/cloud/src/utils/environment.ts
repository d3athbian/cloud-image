export const env = {
  isBrowser: typeof window !== 'undefined',
  
  isServer: typeof window === 'undefined',
  
  hasNavigator: typeof navigator !== 'undefined',
  
  hasPerformance: typeof performance !== 'undefined',
  
  hasWorker: typeof Worker !== 'undefined',
  
  isOnline: (): boolean => {
    if (!env.hasNavigator) return true;
    return navigator.onLine;
  },
  
  isServiceWorkerSupported: (): boolean => {
    if (!env.hasNavigator) return false;
    return 'serviceWorker' in navigator;
  },
  
  userAgent: (): string => {
    if (!env.hasNavigator) return '';
    return navigator.userAgent;
  },
  
  isMobile: (): boolean => {
    const ua = env.userAgent();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  },
  
  isBot: (): boolean => {
    const ua = env.userAgent();
    return /bot|crawl|spider|slurp|mediapartners/i.test(ua);
  },
};