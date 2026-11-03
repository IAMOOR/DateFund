interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'datefund_ai_cache_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedAI<T>(key: string, maxAgeMs: number = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAgeMs) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedAI<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (err) {
    // If quota exceeded, clear older ai cache entries
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }
}
