export function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
}

export function formatTime(timestamp: number): string {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleTimeString();
}

export function getFilename(url: string): string {
  try {
    const parts = url.split('/');
    const name = parts[parts.length - 1]?.split('?')[0] ?? url;
    return name.length > 0 ? name : url;
  } catch {
    return url;
  }
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}