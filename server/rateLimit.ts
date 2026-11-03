import type { Request, Response, NextFunction } from "express";

/**
 * Quota storage interface for rate limiting and concurrency tracking.
 *
 * NOTE ON MULTI-INSTANCE DEPLOYMENTS:
 * The default `MemoryQuotaStore` maintains quota windows in local process memory.
 * If DateFund is scaled horizontally across multiple Cloud Run instances, requests from
 * the same user could hit different instances. For multi-container production topologies,
 * swap this store with a shared Redis, Memcached, or Firestore adapter implementing this
 * `QuotaStore` interface to ensure strict global quota coordination.
 */
export interface QuotaStore {
  incrementUserCount(uid: string, windowSeconds: number): Promise<number>;
  incrementGlobalCount(windowSeconds: number): Promise<number>;
  acquireConcurrency(uid: string, maxPerUser: number, maxGlobal: number): Promise<{ allowed: boolean; reason?: string }>;
  releaseConcurrency(uid: string): Promise<void>;
  reset(): void;
}

export class MemoryQuotaStore implements QuotaStore {
  private userWindows: Map<string, { count: number; expiresAt: number }> = new Map();
  private globalWindows: Map<string, { count: number; expiresAt: number }> = new Map();
  private activeUserRequests: Map<string, number> = new Map();
  private totalActiveRequests: number = 0;

  async incrementUserCount(uid: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const key = `${uid}_${windowSeconds}`;
    const entry = this.userWindows.get(key);

    if (!entry || now > entry.expiresAt) {
      this.userWindows.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  }

  async incrementGlobalCount(windowSeconds: number): Promise<number> {
    const now = Date.now();
    const key = `global_${windowSeconds}`;
    const entry = this.globalWindows.get(key);

    if (!entry || now > entry.expiresAt) {
      this.globalWindows.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  }

  async acquireConcurrency(uid: string, maxPerUser: number, maxGlobal: number): Promise<{ allowed: boolean; reason?: string }> {
    if (this.totalActiveRequests >= maxGlobal) {
      return { allowed: false, reason: "GLOBAL_CONCURRENCY_LIMIT" };
    }

    const current = this.activeUserRequests.get(uid) || 0;
    if (current >= maxPerUser) {
      return { allowed: false, reason: "USER_CONCURRENCY_LIMIT" };
    }

    this.activeUserRequests.set(uid, current + 1);
    this.totalActiveRequests += 1;
    return { allowed: true };
  }

  async releaseConcurrency(uid: string): Promise<void> {
    const current = this.activeUserRequests.get(uid) || 0;
    if (current <= 1) {
      this.activeUserRequests.delete(uid);
    } else {
      this.activeUserRequests.set(uid, current - 1);
    }
    this.totalActiveRequests = Math.max(0, this.totalActiveRequests - 1);
  }

  reset() {
    this.userWindows.clear();
    this.globalWindows.clear();
    this.activeUserRequests.clear();
    this.totalActiveRequests = 0;
  }
}

// Default in-memory store
export const defaultQuotaStore = new MemoryQuotaStore();
let currentStore: QuotaStore = defaultQuotaStore;

export function setCustomQuotaStoreForTesting(store: QuotaStore) {
  currentStore = store;
}

// Configurable Quota Limits
export const QUOTA_CONFIG = {
  USER_REQUESTS_PER_MINUTE: 15,
  USER_REQUESTS_PER_HOUR: 60,
  GLOBAL_REQUESTS_PER_MINUTE: 120,
  MAX_CONCURRENT_PER_USER: 1,
  MAX_CONCURRENT_GLOBAL: 10,
};

/**
 * Middleware: Enforces per-user and global quotas on AI routes.
 */
export async function rateLimitUser(req: Request, res: Response, next: NextFunction) {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Authentication required.", code: "UNAUTHENTICATED" });
  }

  try {
    // 1. Global Rate Check (1 minute window)
    const globalCount = await currentStore.incrementGlobalCount(60);
    if (globalCount > QUOTA_CONFIG.GLOBAL_REQUESTS_PER_MINUTE) {
      res.setHeader("Retry-After", "30");
      return res.status(429).json({
        error: "System capacity exceeded. Please wait a moment before retrying.",
        code: "GLOBAL_RATE_LIMIT",
        retryAfterSeconds: 30
      });
    }

    // 2. User Minute Rate Check (1 minute window)
    const userMinuteCount = await currentStore.incrementUserCount(uid, 60);
    if (userMinuteCount > QUOTA_CONFIG.USER_REQUESTS_PER_MINUTE) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({
        error: "You are making AI requests too quickly. Please wait a minute.",
        code: "USER_RATE_LIMIT",
        retryAfterSeconds: 60
      });
    }

    // 3. User Hourly Rate Check (1 hour window)
    const userHourCount = await currentStore.incrementUserCount(uid, 3600);
    if (userHourCount > QUOTA_CONFIG.USER_REQUESTS_PER_HOUR) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({
        error: "Hourly AI request quota exceeded. Please try again later.",
        code: "USER_HOURLY_QUOTA_EXCEEDED",
        retryAfterSeconds: 900
      });
    }

    next();
  } catch (err) {
    console.error("[RateLimit] Error tracking quota:", err);
    // Graceful fallback to allow request if store fails
    next();
  }
}

/**
 * Middleware: Enforces concurrency bounds to prevent request flooding.
 */
export async function concurrencyLimitUser(req: Request, res: Response, next: NextFunction) {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Authentication required.", code: "UNAUTHENTICATED" });
  }

  const { allowed, reason } = await currentStore.acquireConcurrency(
    uid,
    QUOTA_CONFIG.MAX_CONCURRENT_PER_USER,
    QUOTA_CONFIG.MAX_CONCURRENT_GLOBAL
  );

  if (!allowed) {
    const statusCode = reason === "USER_CONCURRENCY_LIMIT" ? 429 : 503;
    const message = reason === "USER_CONCURRENCY_LIMIT"
      ? "An AI request is already processing for your account. Please wait for it to complete."
      : "Server is currently experiencing high load. Please retry in a few seconds.";

    return res.status(statusCode).json({
      error: message,
      code: reason
    });
  }

  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      currentStore.releaseConcurrency(uid).catch(e => console.error("[Concurrency] Release error:", e));
    }
  };

  res.on("finish", release);
  res.on("close", release);
  res.on("error", release);

  next();
}
