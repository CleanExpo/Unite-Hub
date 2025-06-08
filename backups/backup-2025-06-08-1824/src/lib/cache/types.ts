/**
 * Cache item interface representing an individual cached object
 */
export interface CacheItem<T> {
  value: T;
  expiresAt: number | null; // Unix timestamp in milliseconds, null means no expiration
  createdAt: number; // Unix timestamp in milliseconds
}

/**
 * Cache options for storing items
 */
export interface CacheOptions {
  /** 
   * Time-to-live in milliseconds. If not specified, the item won't expire.
   * Example: 60000 (1 minute)
   */
  ttl?: number;
  
  /**
   * Cache tags for batch invalidation
   * Example: ['users', 'user:123']
   */
  tags?: string[];
}

/**
 * Cache driver interface for different caching mechanisms
 */
export interface CacheDriver {
  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param options Cache options
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  delete(key: string): Promise<void>;
  
  /**
   * Remove all values from the cache
   */
  clear(): Promise<void>;
  
  /**
   * Remove all values with the specified tags
   * @param tags The tags to invalidate
   */
  invalidateTags(tags: string[]): Promise<void>;
}

/**
 * Cache stats for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keyCount: number;
  tagCount?: number;
}
