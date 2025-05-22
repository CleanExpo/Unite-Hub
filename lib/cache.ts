type CacheItem<T> = {
  value: T
  expiry: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key)

    // Return undefined if item doesn't exist
    if (!item) return undefined

    // Return undefined if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return item.value
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiry })
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param key The cache key
   * @param fn Function to compute the value if not in cache
   * @param ttlSeconds Time to live in seconds
   * @returns The cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cachedValue = this.get<T>(key)
    if (cachedValue !== undefined) {
      return cachedValue
    }

    const value = await fn()
    this.set(key, value, ttlSeconds)
    return value
  }
}

// Create a singleton instance
export const cache = new MemoryCache()
