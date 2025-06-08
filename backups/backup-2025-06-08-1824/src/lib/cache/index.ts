/**
 * Unified caching system for Unite-Group platform
 * 
 * This module provides a flexible and scalable caching infrastructure
 * that can be used across the application for performance optimization.
 * 
 * The system supports multiple cache drivers (memory and Redis) and
 * provides a consistent API for all caching operations.
 * 
 * @example
 * // Basic usage
 * import { getCache } from '@/lib/cache';
 * 
 * // Cache a value for 5 minutes
 * await getCache().set('key', value, { ttl: 5 * 60 * 1000 });
 * 
 * // Retrieve a cached value
 * const value = await getCache().get('key');
 * 
 * @example
 * // Advanced usage with Redis
 * import { CacheService, RedisCacheDriver } from '@/lib/cache';
 * 
 * // Create a custom cache service with Redis driver
 * const redisCache = new CacheService({
 *   driver: new RedisCacheDriver({
 *     redisUrl: process.env.REDIS_URL,
 *     keyPrefix: 'app:',
 *   }),
 *   defaultTtl: 30 * 60 * 1000, // 30 minutes
 * });
 * 
 * // Get or compute a value
 * const data = await redisCache.remember('key', async () => {
 *   // This will only be executed if the key is not in the cache
 *   return await fetchDataFromDatabase();
 * }, { ttl: 60 * 60 * 1000 }); // 1 hour
 */

export * from './types';
export * from './memory-driver';
export * from './redis-driver';
export * from './cache-service';

// Re-export the default cache instance getter for convenience
import { getCache } from './cache-service';
export { getCache };

// Default export for simpler imports
export default getCache;
