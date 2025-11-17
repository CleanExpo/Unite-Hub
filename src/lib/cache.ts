import { getRedisClient } from './redis';
import { log } from './logger';

/**
 * Redis-backed caching utility with TTL support
 */
export class CacheManager {
  private redis;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      const parsed = JSON.parse(value);
      log.debug(`Cache HIT: ${key}`);
      return parsed as T;
    } catch (error) {
      log.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL (in seconds)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
      log.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      log.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      log.debug(`Cache DEL: ${key}`);
    } catch (error) {
      log.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Get all keys matching pattern
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        log.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      log.error(`Cache DEL pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Get cached value or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get cached value
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    log.debug(`Cache MISS: ${key}, executing function`);
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      log.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      log.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  // User-related
  userProfile: (userId: string) => `user:profile:${userId}`,
  userOrganizations: (userId: string) => `user:orgs:${userId}`,
  userWorkspaces: (userId: string) => `user:workspaces:${userId}`,

  // Contact-related
  contact: (contactId: string) => `contact:${contactId}`,
  contactsByWorkspace: (workspaceId: string, page: number = 1) =>
    `contacts:workspace:${workspaceId}:page:${page}`,
  contactScore: (contactId: string) => `contact:score:${contactId}`,
  hotLeads: (workspaceId: string) => `contacts:hot:${workspaceId}`,

  // Campaign-related
  campaign: (campaignId: string) => `campaign:${campaignId}`,
  campaignStats: (campaignId: string) => `campaign:stats:${campaignId}`,
  campaignsByWorkspace: (workspaceId: string) => `campaigns:workspace:${workspaceId}`,

  // Email-related
  emailThread: (threadId: string) => `email:thread:${threadId}`,
  emailsByContact: (contactId: string) => `emails:contact:${contactId}`,

  // AI-related
  aiSuggestion: (nodeId: string) => `ai:suggestion:${nodeId}`,
  aiAnalysis: (contactId: string) => `ai:analysis:${contactId}`,
  contentDraft: (draftId: string) => `content:draft:${draftId}`,

  // Mindmap-related
  mindmap: (mindmapId: string) => `mindmap:${mindmapId}`,
  mindmapNodes: (mindmapId: string) => `mindmap:nodes:${mindmapId}`,
  projectMindmap: (projectId: string) => `project:mindmap:${projectId}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
};
