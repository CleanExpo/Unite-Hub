import { CacheDriver, CacheItem, CacheOptions, CacheStats } from './types';

/**
 * In-memory cache driver implementation
 * Suitable for development and small-scale production deployments
 */
export class MemoryCacheDriver implements CacheDriver {
  // Cache storage
  private cache: Map<string, CacheItem<any>> = new Map();
  
  // Tag index for quick invalidation by tag
  private tagIndex: Map<string, Set<string>> = new Map();
  
  // Stats tracking
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    keyCount: 0,
    tagCount: 0
  };
  
  // Optional max memory size in bytes
  private maxSize?: number;
  
  // Optional cleanup interval in milliseconds
  private cleanupInterval?: number;
  
  // Cleanup timer reference
  private cleanupTimer?: NodeJS.Timeout;
  
  /**
   * Create a new memory cache driver
   * @param options Configuration options
   */
  constructor(options?: {
    maxSize?: number; // Maximum cache size in bytes (approximate)
    cleanupInterval?: number; // Interval in ms to run cleanup of expired items
  }) {
    this.maxSize = options?.maxSize;
    this.cleanupInterval = options?.cleanupInterval;
    
    // Start cleanup timer if interval is provided
    if (this.cleanupInterval) {
      this.cleanupTimer = setInterval(() => {
        this.removeExpiredItems();
      }, this.cleanupInterval);
    }
  }
  
  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    // Calculate expiration time if TTL is provided
    const expiresAt = options?.ttl ? Date.now() + options.ttl : null;
    
    // Create cache item
    const item: CacheItem<T> = {
      value,
      expiresAt,
      createdAt: Date.now()
    };
    
    // Check if item already exists to update stats correctly
    const existingItem = this.cache.get(key);
    
    // Store item in cache
    this.cache.set(key, item);
    
    // Update key count if this is a new key
    if (!existingItem) {
      this.stats.keyCount++;
    }
    
    // Handle tags if provided
    if (options?.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
          this.stats.tagCount = (this.stats.tagCount || 0) + 1;
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
    
    // Update size approximation (rough estimate)
    this.updateCacheSize();
    
    // Enforce max size if configured
    if (this.maxSize && this.stats.size > this.maxSize) {
      this.evictOldest();
    }
  }
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    // Return null if item doesn't exist
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if item is expired
    if (item.expiresAt !== null && item.expiresAt < Date.now()) {
      // Remove expired item
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Item found and not expired
    this.stats.hits++;
    return item.value;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    // Return false if item doesn't exist
    if (!item) {
      return false;
    }
    
    // Check if item is expired
    if (item.expiresAt !== null && item.expiresAt < Date.now()) {
      // Remove expired item
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  async delete(key: string): Promise<void> {
    if (this.cache.has(key)) {
      // Remove from cache
      this.cache.delete(key);
      
      // Update stats
      this.stats.keyCount--;
      
      // Remove from tag index
      Array.from(this.tagIndex.entries()).forEach(([tag, keys]) => {
        if (keys.has(key)) {
          keys.delete(key);
          
          // Remove tag if it has no keys
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
            this.stats.tagCount = (this.stats.tagCount || 0) - 1;
          }
        }
      });
      
      // Update size approximation
      this.updateCacheSize();
    }
  }
  
  /**
   * Remove all values from the cache
   */
  async clear(): Promise<void> {
    // Clear cache and tag index
    this.cache.clear();
    this.tagIndex.clear();
    
    // Reset stats
    this.stats.keyCount = 0;
    this.stats.size = 0;
    this.stats.tagCount = 0;
  }
  
  /**
   * Remove all values with the specified tags
   * @param tags The tags to invalidate
   */
  async invalidateTags(tags: string[]): Promise<void> {
    // Collect all keys to delete
    const keysToDelete = new Set<string>();
    
    for (const tag of tags) {
      const taggedKeys = this.tagIndex.get(tag);
      if (taggedKeys) {
        // Add all keys with this tag to the delete set
        Array.from(taggedKeys).forEach(key => {
          keysToDelete.add(key);
        });
        
        // Remove the tag
        this.tagIndex.delete(tag);
        this.stats.tagCount = (this.stats.tagCount || 0) - 1;
      }
    }
    
    // Delete all collected keys
    Array.from(keysToDelete).forEach(key => {
      this.cache.delete(key);
    });
    
    // Update stats
    this.stats.keyCount -= keysToDelete.size;
    this.updateCacheSize();
  }
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Remove all expired items from the cache
   * @returns Number of items removed
   */
  removeExpiredItems(): number {
    const now = Date.now();
    let removedCount = 0;
    
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (item.expiresAt !== null && item.expiresAt < now) {
        this.delete(key);
        removedCount++;
      }
    });
    
    return removedCount;
  }
  
  /**
   * Clean up resources when cache is no longer needed
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  /**
   * Evict the oldest items until the cache size is under the max size
   * @private
   */
  private evictOldest(): void {
    // If max size is not set, do nothing
    if (!this.maxSize) return;
    
    // Sort cache items by creation time (oldest first)
    const sortedItems = Array.from(this.cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    // Remove oldest items until we're under the max size
    while (this.stats.size > this.maxSize && sortedItems.length > 0) {
      const [key] = sortedItems.shift()!;
      this.delete(key);
    }
  }
  
  /**
   * Update the cache size approximation
   * @private
   */
  private updateCacheSize(): void {
    // Calculate approximate size of all cache items
    // This is a rough estimation
    let totalSize = 0;
    
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      // Approximate size of the key
      totalSize += key.length * 2; // String characters are 2 bytes in JavaScript
      
      // Approximate size of the value
      totalSize += this.approximateSize(item.value);
      
      // Add overhead for the cache item itself
      totalSize += 24; // Approximate overhead for timestamps, etc.
    });
    
    this.stats.size = totalSize;
  }
  
  /**
   * Calculate an approximate size of a value in bytes
   * @param value The value to measure
   * @returns Approximate size in bytes
   * @private
   */
  private approximateSize(value: any): number {
    const type = typeof value;
    
    if (value === null || value === undefined) {
      return 4;
    }
    
    if (type === 'boolean') {
      return 4;
    }
    
    if (type === 'number') {
      return 8;
    }
    
    if (type === 'string') {
      return value.length * 2; // String characters are 2 bytes in JavaScript
    }
    
    if (value instanceof Date) {
      return 8;
    }
    
    if (Array.isArray(value)) {
      let size = 0;
      for (const item of value) {
        size += this.approximateSize(item);
      }
      return size + 4; // Array overhead
    }
    
    if (type === 'object') {
      let size = 0;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          size += key.length * 2; // Key size
          size += this.approximateSize(value[key]); // Value size
        }
      }
      return size + 8; // Object overhead
    }
    
    return 8; // Default size for unknown types
  }
}
