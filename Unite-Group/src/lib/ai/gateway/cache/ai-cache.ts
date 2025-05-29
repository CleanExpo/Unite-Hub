/**
 * AI Cache Implementation
 * Unite Group AI Gateway - Intelligent Caching System
 */

import {
  AIRequest,
  AIResponse,
  AICacheConfig,
  AICacheEntry
} from '../types';

export class AICache {
  private cache: Map<string, AICacheEntry> = new Map();
  private config: AICacheConfig;
  private hitCount = 0;
  private missCount = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config?: Partial<AICacheConfig>) {
    this.config = {
      enabled: true,
      ttl: 3600, // 1 hour default
      maxSize: 10000,
      keyStrategy: 'hash',
      ...config
    };

    if (this.config.enabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get cached response for a request
   */
  async get(request: AIRequest): Promise<AIResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if entry has expired
    if (new Date() > new Date(entry.expiresAt)) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = new Date().toISOString();
    this.hitCount++;

    return entry.response;
  }

  /**
   * Cache a response for a request
   */
  async set(request: AIRequest, response: AIResponse): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check if request type should be cached
    if (this.config.excludeTypes?.includes(request.type)) {
      return;
    }

    // Check if provider should be cached
    if (this.config.includeProviders && !this.config.includeProviders.includes(request.provider)) {
      return;
    }

    const key = this.generateKey(request);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.ttl * 1000);

    const entry: AICacheEntry = {
      key,
      provider: request.provider,
      request,
      response,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
      lastAccessed: now.toISOString()
    };

    // Enforce max size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * Clear cache entries
   */
  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      // Clear entries matching pattern
      const regex = new RegExp(pattern);
      for (const [key, entry] of this.cache.entries()) {
        if (regex.test(key) || regex.test(entry.request.prompt)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all entries
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; missRate: number } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hitCount / total : 0,
      missRate: total > 0 ? this.missCount / total : 0
    };
  }

  /**
   * Get cache entries for inspection
   */
  getEntries(): AICacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get cache entry by key
   */
  getEntry(key: string): AICacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * Check if cache contains key
   */
  has(request: AIRequest): boolean {
    const key = this.generateKey(request);
    return this.cache.has(key);
  }

  /**
   * Delete specific cache entry
   */
  delete(request: AIRequest): boolean {
    const key = this.generateKey(request);
    return this.cache.delete(key);
  }

  /**
   * Generate cache key for request
   */
  private generateKey(request: AIRequest): string {
    switch (this.config.keyStrategy) {
      case 'hash':
        return this.hashRequest(request);
      case 'content':
        return this.contentKey(request);
      case 'custom':
        return this.customKey(request);
      default:
        return this.hashRequest(request);
    }
  }

  /**
   * Generate hash-based cache key
   */
  private hashRequest(request: AIRequest): string {
    const content = JSON.stringify({
      provider: request.provider,
      type: request.type,
      prompt: request.prompt,
      options: request.options
    });
    
    return this.simpleHash(content);
  }

  /**
   * Generate content-based cache key
   */
  private contentKey(request: AIRequest): string {
    const normalized = request.prompt.toLowerCase().replace(/\s+/g, '_');
    return `${request.provider}_${request.type}_${normalized.substring(0, 50)}`;
  }

  /**
   * Generate custom cache key
   */
  private customKey(request: AIRequest): string {
    // Custom key generation logic
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Hour-based
    return `${request.provider}_${request.type}_${timestamp}_${this.simpleHash(request.prompt)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evict oldest cache entries when max size is reached
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => 
      new Date(a[1].lastAccessed).getTime() - new Date(b[1].lastAccessed).getTime()
    );

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > new Date(entry.expiresAt)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup timer and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.cache.clear();
  }

  /**
   * Warm up cache with common requests
   */
  async warmUp(requests: AIRequest[]): Promise<void> {
    // This would pre-populate cache with common requests
    // For now, just log the intention
    console.log(`Warming up cache with ${requests.length} requests`);
  }

  /**
   * Export cache data for persistence
   */
  async export(): Promise<{ entries: AICacheEntry[]; stats: any }> {
    return {
      entries: this.getEntries(),
      stats: this.getStats()
    };
  }

  /**
   * Import cache data from persistence
   */
  async import(data: { entries: AICacheEntry[]; stats?: any }): Promise<void> {
    this.cache.clear();
    
    const now = new Date();
    for (const entry of data.entries) {
      // Only import non-expired entries
      if (now < new Date(entry.expiresAt)) {
        this.cache.set(entry.key, entry);
      }
    }
  }

  /**
   * Get cache usage metrics
   */
  getMetrics(): {
    size: number;
    maxSize: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const stats = this.getStats();
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2; // Rough bytes estimate
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: stats.hitRate,
      memoryUsage
    };
  }

  /**
   * Invalidate cache entries by tag or pattern
   */
  async invalidate(criteria: {
    provider?: string;
    type?: string;
    pattern?: string;
    olderThan?: Date;
  }): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      let shouldInvalidate = false;
      
      if (criteria.provider && entry.provider !== criteria.provider) {
        continue;
      }
      
      if (criteria.type && entry.request.type !== criteria.type) {
        continue;
      }
      
      if (criteria.pattern) {
        const regex = new RegExp(criteria.pattern);
        if (!regex.test(entry.request.prompt)) {
          continue;
        }
      }
      
      if (criteria.olderThan && new Date(entry.createdAt) > criteria.olderThan) {
        continue;
      }
      
      shouldInvalidate = true;
      
      if (shouldInvalidate) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Update cache configuration
   */
  updateConfig(updates: Partial<AICacheConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (!this.config.enabled && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    } else if (this.config.enabled && !this.cleanupInterval) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get cache configuration
   */
  getConfig(): AICacheConfig {
    return { ...this.config };
  }
}

export default AICache;
