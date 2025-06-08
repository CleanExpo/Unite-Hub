import { CacheDriver, CacheOptions, CacheStats } from './types';
import { MemoryCacheDriver } from './memory-driver';

/**
 * Cache service configuration
 */
export interface CacheServiceConfig {
  /**
   * Default TTL in milliseconds for cache items
   * Can be overridden when setting individual items
   */
  defaultTtl?: number;
  
  /**
   * Optional namespace prefix for cache keys
   * Useful when multiple applications share the same cache backend
   */
  namespace?: string;
  
  /**
   * Driver to use for caching
   * Defaults to memory driver if not specified
   */
  driver?: CacheDriver;
  
  /**
   * Options for the memory driver (only used if no custom driver is provided)
   */
  memoryDriverOptions?: {
    maxSize?: number;
    cleanupInterval?: number;
  };
}

/**
 * Cache service that provides a unified interface to different cache drivers
 */
export class CacheService {
  private driver: CacheDriver;
  private defaultTtl?: number;
  private namespace: string;
  
  /**
   * Create a new cache service
   * @param config Cache service configuration
   */
  constructor(config: CacheServiceConfig = {}) {
    this.defaultTtl = config.defaultTtl;
    this.namespace = config.namespace || 'app:';
    this.driver = config.driver || new MemoryCacheDriver(config.memoryDriverOptions);
  }
  
  /**
   * Format a key with the namespace prefix
   * @param key The cache key
   * @returns The namespaced key
   * @private
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}${key}`;
  }
  
  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const finalOptions: CacheOptions = {
      ...options,
      ttl: options?.ttl || this.defaultTtl
    };
    
    return this.driver.set(this.getNamespacedKey(key), value, finalOptions);
  }
  
  /**
   * Retrieve a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(this.getNamespacedKey(key));
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    return this.driver.has(this.getNamespacedKey(key));
  }
  
  /**
   * Remove a value from the cache
   * @param key The cache key
   */
  async delete(key: string): Promise<void> {
    return this.driver.delete(this.getNamespacedKey(key));
  }
  
  /**
   * Remove all values from the cache
   * Note: This will clear ALL cache entries, even those with different namespaces
   */
  async clear(): Promise<void> {
    return this.driver.clear();
  }
  
  /**
   * Remove all values with the specified tags
   * @param tags The tags to invalidate
   */
  async invalidateTags(tags: string[]): Promise<void> {
    return this.driver.invalidateTags(tags);
  }
  
  /**
   * Get a value from the cache, or compute and store it if not found
   * @param key The cache key
   * @param callback Function to compute the value if not in cache
   * @param options Cache options
   * @returns The cached or computed value
   */
  async remember<T>(
    key: string, 
    callback: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    const namespacedKey = this.getNamespacedKey(key);
    
    // Try to get from cache first
    const cachedValue = await this.driver.get<T>(namespacedKey);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Not in cache, compute the value
    const value = await callback();
    
    // Store in cache
    const finalOptions: CacheOptions = {
      ...options,
      ttl: options?.ttl || this.defaultTtl
    };
    
    await this.driver.set(namespacedKey, value, finalOptions);
    
    return value;
  }
  
  /**
   * Get multiple values from the cache at once
   * @param keys Array of cache keys
   * @returns Object mapping keys to values (null for missing/expired keys)
   */
  async getMany<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    const namespacedKeys = keys.map(key => this.getNamespacedKey(key));
    
    // Get all values in parallel
    const promises = namespacedKeys.map(key => this.driver.get<T>(key));
    const values = await Promise.all(promises);
    
    // Map results back to original keys
    for (let i = 0; i < keys.length; i++) {
      result[keys[i]] = values[i];
    }
    
    return result;
  }
  
  /**
   * Store multiple values in the cache at once
   * @param items Object mapping keys to values
   * @param options Cache options
   */
  async setMany<T>(items: Record<string, T>, options?: CacheOptions): Promise<void> {
    const finalOptions: CacheOptions = {
      ...options,
      ttl: options?.ttl || this.defaultTtl
    };
    
    // Set all values in parallel
    const promises = Object.entries(items).map(([key, value]) => 
      this.driver.set(this.getNamespacedKey(key), value, finalOptions)
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Remove multiple values from the cache at once
   * @param keys Array of cache keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    const namespacedKeys = keys.map(key => this.getNamespacedKey(key));
    
    // Delete all values in parallel
    const promises = namespacedKeys.map(key => this.driver.delete(key));
    await Promise.all(promises);
  }
  
  /**
   * Warm up the cache with computed values
   * @param items Object mapping keys to value generator functions
   * @param options Cache options
   */
  async warmUp<T>(
    items: Record<string, () => Promise<T>>, 
    options?: CacheOptions
  ): Promise<void> {
    const finalOptions: CacheOptions = {
      ...options,
      ttl: options?.ttl || this.defaultTtl
    };
    
    // Compute and cache all values in parallel
    const promises = Object.entries(items).map(async ([key, generator]) => {
      const value = await generator();
      return this.driver.set(this.getNamespacedKey(key), value, finalOptions);
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Get cache statistics from the driver
   * @returns Cache statistics
   */
  getStats(): CacheStats | null {
    if ('getStats' in this.driver) {
      return (this.driver as any).getStats();
    }
    
    return null;
  }
}

/**
 * Create a singleton cache service instance
 */
let defaultCacheService: CacheService | null = null;

/**
 * Get or create the default cache service instance
 * @param config Optional configuration for the cache service
 * @returns The default cache service instance
 */
export function getCache(config?: CacheServiceConfig): CacheService {
  if (!defaultCacheService) {
    defaultCacheService = new CacheService(config);
  }
  
  return defaultCacheService;
}

/**
 * Reset the default cache service instance
 * Useful for testing or when reconfiguration is needed
 * @param config Optional new configuration for the cache service
 * @returns The new default cache service instance
 */
export function resetCache(config?: CacheServiceConfig): CacheService {
  defaultCacheService = new CacheService(config);
  return defaultCacheService;
}
