// src/lib/cache.ts
// In-memory TTL cache — single-user app (one founder), single server process.
// Redis would add infrastructure complexity with zero benefit here.
// Lazy expiry: entries are purged on read, not by background timers.

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Module-level singleton — persists across requests within the same server process
const store = new Map<string, CacheEntry<unknown>>()

/**
 * Retrieve a cached value by key.
 * Returns null on miss or if the entry has expired (and removes the stale entry).
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * Store a value with a time-to-live in milliseconds.
 * Overwrites any existing entry for the same key.
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

/**
 * Remove all cache entries whose keys contain the given substring.
 * Use to invalidate a subset of entries (e.g. all keys for a founderId).
 *
 * @example
 *   invalidateCache('founder-123') // clears gmail:founder-123, calendar:founder-123, etc.
 */
export function invalidateCache(pattern: string): void {
  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key)
    }
  }
}
