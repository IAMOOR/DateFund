interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'datefund_ai_cache_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function buildScopedKey(key: string, userUid?: string | null): string {
  const scope = userUid ? userUid : 'anonymous';
  return `${CACHE_PREFIX}${scope}_${key}`;
}

export function getCachedAI<T>(key: string, userUid?: string | null, maxAgeMs: number = DEFAULT_TTL_MS): T | null {
  try {
    const scopedKey = buildScopedKey(key, userUid);
    const raw = localStorage.getItem(scopedKey);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAgeMs) {
      localStorage.removeItem(scopedKey);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedAI<T>(key: string, data: T, userUid?: string | null): void {
  try {
    const scopedKey = buildScopedKey(key, userUid);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(scopedKey, JSON.stringify(entry));
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

/**
 * Purges cached AI data for the specified user or all users upon logout or account switch.
 */
export function clearUserAICache(userUid?: string | null): void {
  try {
    const prefixToClear = userUid ? `${CACHE_PREFIX}${userUid}_` : CACHE_PREFIX;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefixToClear)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn("[Cache] Error clearing user AI cache:", e);
  }
}
