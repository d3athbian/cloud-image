export const time = {
  now: (): number => Date.now(),
  
  elapsed: (since: number): number => Date.now() - since,
  
  isExpired: (cachedAt: number, ttl: number): boolean => {
    if (!cachedAt || !ttl) return false;
    return Date.now() - cachedAt > ttl;
  },
  
  isExpiredOrNear: (cachedAt: number, ttl: number, threshold = 0.9): boolean => {
    if (!cachedAt || !ttl) return false;
    const age = Date.now() - cachedAt;
    return age > ttl * threshold;
  },
  
  msToSeconds: (ms: number): number => Math.floor(ms / 1000),
  
  secondsToMs: (seconds: number): number => seconds * 1000,
  
  minutesToMs: (minutes: number): number => minutes * 60 * 1000,
  
  hoursToMs: (hours: number): number => hours * 60 * 60 * 1000,
  
  daysToMs: (days: number): number => days * 24 * 60 * 60 * 1000,
};