/**
 * Phase 89 Cache Service
 * Centralized caching for all Phase 89 intelligence services
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import logger from '@/lib/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class Phase89Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

  /**
   * Generate cache key from parameters
   */
  private generateKey(service: string, clientId: string, params: Record<string, any>): string {
    const paramStr = JSON.stringify(params);
    return `phase89:${service}:${clientId}:${paramStr}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Get from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert minutes to milliseconds

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    this.stats.size = this.cache.size;

    logger.debug('[Phase89Cache] Cached', {
      key,
      ttlMinutes,
      cacheSize: this.stats.size,
    });
  }

  /**
   * Get or compute
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlMinutes: number = 60
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key);
    if (cached) {
      logger.debug('[Phase89Cache] Hit', { key });
      return cached;
    }

    // Compute if not cached
    logger.debug('[Phase89Cache] Miss, computing', { key });
    const result = await computeFn();

    // Store result
    this.set(key, result, ttlMinutes);

    return result;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;

    logger.debug('[Phase89Cache] Invalidated', {
      pattern,
      count,
      cacheSize: this.stats.size,
    });

    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };

    logger.info('[Phase89Cache] Cleared', { entriesCleared: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate),
    };
  }

  /**
   * Get cache size in bytes (approximate)
   */
  getMemoryUsage(): number {
    let bytes = 0;
    for (const [key, entry] of this.cache.entries()) {
      bytes += key.length * 2; // Rough estimate for key
      bytes += JSON.stringify(entry.data).length; // Rough estimate for data
    }
    return bytes;
  }
}

// Export singleton instance
export const phase89Cache = new Phase89Cache();

/**
 * Service-specific cache helpers
 */
export const cacheHelpers = {
  /**
   * Cache key for keyword gap analysis
   */
  keywordGapKey(clientId: string, competitors: string[]): string {
    return `keyword-gap:${clientId}:${competitors.sort().join(',')}`;
  },

  /**
   * Cache key for competitive benchmark
   */
  competitiveBenchmarkKey(clientDomain: string, competitors: string[]): string {
    return `competitive-benchmark:${clientDomain}:${competitors.sort().join(',')}`;
  },

  /**
   * Cache key for social media metrics
   */
  socialMediaKey(clientId: string, platforms?: string[]): string {
    const platformStr = platforms ? platforms.sort().join(',') : 'all';
    return `social-media:${clientId}:${platformStr}`;
  },

  /**
   * Cache key for YouTube analytics
   */
  youtubeKey(clientId: string, channelId: string): string {
    return `youtube:${clientId}:${channelId}`;
  },

  /**
   * Cache key for opportunity scoring
   */
  opportunitiesKey(clientId: string, type?: string): string {
    return `opportunities:${clientId}:${type || 'all'}`;
  },

  /**
   * Cache key for geo grid ranking
   */
  geoGridKey(clientId: string, keywords: string[], location?: string): string {
    const keywordStr = keywords.sort().join(',');
    const locationStr = location || 'default';
    return `geo-grid:${clientId}:${keywordStr}:${locationStr}`;
  },

  /**
   * Invalidate all client data
   */
  invalidateClient(clientId: string): number {
    return phase89Cache.invalidate(`${clientId}`);
  },

  /**
   * Invalidate service data
   */
  invalidateService(service: string): number {
    return phase89Cache.invalidate(service);
  },
};

/**
 * Cache TTL presets by tier and service
 */
export const cacheTTL = {
  // Starter tier - longer cache, less frequent updates
  starter: {
    keywordGap: 24 * 60, // 24 hours
    competitiveBenchmark: 24 * 60,
    socialMedia: 24 * 60,
    youtube: 24 * 60,
    opportunities: 24 * 60,
    geoGrid: 24 * 60,
  },

  // Pro tier - moderate cache, regular updates
  pro: {
    keywordGap: 12 * 60, // 12 hours
    competitiveBenchmark: 12 * 60,
    socialMedia: 6 * 60, // 6 hours (more frequent for social)
    youtube: 12 * 60,
    opportunities: 12 * 60,
    geoGrid: 6 * 60,
  },

  // Enterprise tier - short cache, frequent updates
  enterprise: {
    keywordGap: 4 * 60, // 4 hours
    competitiveBenchmark: 4 * 60,
    socialMedia: 2 * 60, // 2 hours (very fresh)
    youtube: 4 * 60,
    opportunities: 4 * 60,
    geoGrid: 2 * 60, // Hourly updates for geo grid
  },
};
