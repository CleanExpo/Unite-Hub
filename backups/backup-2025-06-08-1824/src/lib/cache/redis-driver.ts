import { CacheDriver, CacheItem, CacheOptions, CacheStats } from './types';
import Redis from 'ioredis';

/**
 * Redis cache driver configuration
 */
export interface RedisCacheDriverConfig {
  /**
   * Redis connection string (e.g., redis://user:password@localhost:6379/0)
   * If not provided, defaults to process.env.REDIS_URL or localhost:6379
   */
  redisUrl?: string;
  
  /**
   * Redis client instance
   * If provided, will be used instead of creating a new client
   */
  redisClient?: Redis;
  
  /**
   * Prefix for all cache keys
   * Useful for namespacing keys in a shared Redis instance
   */
  keyPrefix?: string;
  
  /**
   * Default serialization function for values
   * By default, uses JSON.stringify
   */
  serialize?: (value: any) => string;
  
  /**
   * Default deserialization function for values
   * By default, uses JSON.parse
   */
  deserialize?: (serialized: string) => any;
}

/**
 * Redis cache driver implementation
 * Suitable for production environments and distributed applications
 */
export class RedisCacheDriver implements CacheDriver {
  private client: Redis;
  private keyPrefix: string;
  private serialize: (value: any) => string;
  private deserialize: (serialized: string) => any;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    keyCount: 0
  };
  private disposed = false;
  
  /**
   * Create a new Redis cache driver
   * @param config Redis cache driver configuration
   */
  constructor(config: RedisCacheDriverConfig = {}) {
    // Set up serialization/deserialization functions
    this.serialize = config.serialize || JSON.stringify;
    this.deserialize = config.deserialize || JSON.parse;
    this.keyPrefix = config.keyPrefix || 'cache:';
    
    // Use provided Redis client or create a new one
    if (config.redisClient) {
      this.client = config.redisClient;
    } else {
      const redisUrl = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl);
      
      // Handle connection errors
      this.client.on('error', (error: Error) => {
        console.error('[RedisCacheDriver] Connection error:', error);
      });
    }
  }
  
  /**
   * Format a key with the prefix
   * @param key The cache key
   * @returns The prefixed key
   * @private
   */
  private getPrefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
  
  /**
   * Format a tag key
   * @param tag The tag name
   * @returns The tag key
   * @private
   */
  private getTagKey(tag: string): string {
    return `${this.keyPrefix}tag:${tag}`;
  }
  
  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    this.ensureNotDisposed();
    
    const prefixedKey = this.getPrefixedKey(key);
    const serializedValue = this.serialize(value);
    
    // Create a pipeline for better performance
    const pipeline = this.client.pipeline();
    
    if (options?.ttl) {
      // Set with expiration
      pipeline.set(prefixedKey, serializedValue, 'PX', options.ttl);
    } else {
      // Set without expiration
      pipeline.set(prefixedKey, serializedValue);
    }
    
    // Handle tags if provided
    if (options?.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        const tagKey = this.getTagKey(tag);
        pipeline.sadd(tagKey, prefixedKey);
      }
    }
    
    await pipeline.exec();
  }
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureNotDisposed();
    
    const prefixedKey = this.getPrefixedKey(key);
    const result = await this.client.get(prefixedKey);
    
    if (result === null) {
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    
    try {
      return this.deserialize(result) as T;
    } catch (error) {
      console.error(`[RedisCacheDriver] Error deserializing value for key "${key}":`, error);
      // If deserialization fails, delete the corrupted value
      await this.delete(key);
      this.stats.misses++;
      return null;
    }
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    this.ensureNotDisposed();
    
    const prefixedKey = this.getPrefixedKey(key);
    const exists = await this.client.exists(prefixedKey);
    
    return exists === 1;
  }
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  async delete(key: string): Promise<void> {
    this.ensureNotDisposed();
    
    const prefixedKey = this.getPrefixedKey(key);
    await this.client.del(prefixedKey);
  }
  
  /**
   * Remove all values from the cache
   * Note: This will only clear keys with the configured prefix
   */
  async clear(): Promise<void> {
    this.ensureNotDisposed();
    
    // Use scan to iterate through keys with the prefix
    let cursor = '0';
    
    do {
      const result = await this.client.scan(
        cursor,
        'MATCH',
        `${this.keyPrefix}*`,
        'COUNT',
        1000
      );
      
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }
  
  /**
   * Remove all values with the specified tags
   * @param tags The tags to invalidate
   */
  async invalidateTags(tags: string[]): Promise<void> {
    this.ensureNotDisposed();
    
    // Get all keys from all tags
    const pipeline = this.client.pipeline();
    
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.smembers(tagKey);
    }
    
    const results = await pipeline.exec();
    if (!results) return;
    
    // Collect all keys to delete
    const keysToDelete = new Set<string>();
    
    for (let i = 0; i < results.length; i++) {
      const [error, keys] = results[i] as [Error | null, string[]];
      
      if (error) {
        console.error(`[RedisCacheDriver] Error getting tag members:`, error);
        continue;
      }
      
      for (const key of keys) {
        keysToDelete.add(key);
      }
      
      // Also delete the tag itself
      keysToDelete.add(this.getTagKey(tags[i]));
    }
    
    // Delete all the keys
    if (keysToDelete.size > 0) {
      await this.client.del(Array.from(keysToDelete));
    }
  }
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getStats(): Promise<CacheStats> {
    this.ensureNotDisposed();
    
    // Count keys with the prefix
    let cursor = '0';
    let keyCount = 0;
    
    do {
      const result = await this.client.scan(
        cursor,
        'MATCH',
        `${this.keyPrefix}*`,
        'COUNT',
        1000
      );
      
      cursor = result[0];
      keyCount += result[1].length;
    } while (cursor !== '0');
    
    // Update stats with key count
    this.stats.keyCount = keyCount;
    
    // Memory usage is difficult to get per prefix, return approximate stats
    return { ...this.stats };
  }
  
  /**
   * Clean up resources when cache is no longer needed
   */
  async dispose(): Promise<void> {
    if (!this.disposed) {
      this.disposed = true;
      await this.client.quit();
    }
  }
  
  /**
   * Ensure the driver hasn't been disposed
   * @private
   */
  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error('Redis cache driver has been disposed');
    }
  }
}
