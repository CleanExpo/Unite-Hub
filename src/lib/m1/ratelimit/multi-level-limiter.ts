/**
 * M1 Multi-Level Rate Limiter
 *
 * Hierarchical rate limiting with support for global, tenant, user,
 * resource, API key, and IP-level limits. Applies most-restrictive-wins logic.
 *
 * Version: v1.0.0
 * Phase: 24 - Advanced Rate Limiting & Fair Queuing
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Rate limit level type
 */
export type LimitLevel = 'global' | 'tenant' | 'user' | 'resource' | 'api_key' | 'ip';

/**
 * Rate limit configuration at a specific level
 */
export interface RateLimitConfig {
  level: LimitLevel;
  identifier: string; // e.g., tenantId, userId, ipAddress
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize?: number; // Allow temporary bursts
  priority?: number; // Lower = higher priority (for fair distribution)
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  level: LimitLevel;
  identifier: string;
  remainingRequests: number;
  resetAt: number;
  retryAfterSeconds?: number;
  reason?: string;
  limitingLevel?: LimitLevel; // Which level caused the limit
}

/**
 * Usage statistics for a specific limit level
 */
export interface LimitUsageStats {
  level: LimitLevel;
  identifier: string;
  requestsInWindow: number;
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  lastRequestAt: number;
  nextResetAt: number;
  hitCount: number;
}

/**
 * Token bucket for rate limiting
 */
interface TokenBucket {
  tokens: number;
  lastRefillAt: number;
}

/**
 * Request record for time-window tracking
 */
interface RequestRecord {
  timestamp: number;
  identifier: string;
}

/**
 * Multi-level rate limiter with hierarchical limits
 */
export class MultiLevelRateLimiter {
  private limitConfigs: Map<string, RateLimitConfig> = new Map();
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private requestRecords: Map<LimitLevel, RequestRecord[]> = new Map();
  private hitCounts: Map<string, number> = new Map();
  private rejectionReasons: Map<string, string> = new Map();

  private readonly defaultBurstSize = 1.5; // 50% burst multiplier

  constructor() {
    // Initialize request tracking for each level
    const levels: LimitLevel[] = ['global', 'tenant', 'user', 'resource', 'api_key', 'ip'];
    for (const level of levels) {
      this.requestRecords.set(level, []);
    }
  }

  /**
   * Register rate limit configuration at a specific level
   */
  registerLimit(config: RateLimitConfig): string {
    const configId = `limit_${config.level}_${config.identifier}_${generateUUID()}`;

    const limitConfig: RateLimitConfig = {
      ...config,
      burstSize: config.burstSize || this.defaultBurstSize,
      priority: config.priority ?? 100, // Default priority
    };

    this.limitConfigs.set(configId, limitConfig);

    // Initialize token bucket
    this.tokenBuckets.set(configId, {
      tokens: limitConfig.requestsPerSecond * (limitConfig.burstSize || this.defaultBurstSize),
      lastRefillAt: Date.now(),
    });

    // Initialize hit count
    this.hitCounts.set(configId, 0);

    return configId;
  }

  /**
   * Check if request is allowed at all levels
   * Applies most-restrictive-wins logic
   */
  checkLimit(
    tenantId?: string,
    userId?: string,
    resourceId?: string,
    apiKey?: string,
    ipAddress?: string
  ): RateLimitCheckResult {
    const now = Date.now();
    const identifiers = {
      global: 'global',
      tenant: tenantId || 'unknown',
      user: userId || 'unknown',
      resource: resourceId || 'unknown',
      api_key: apiKey || 'unknown',
      ip: ipAddress || 'unknown',
    };

    // Check all applicable limits
    const results: RateLimitCheckResult[] = [];

    // Global limit
    const globalConfig = this.findConfig('global', identifiers.global);
    if (globalConfig) {
      const result = this.checkLimitAtLevel(globalConfig, now);
      results.push(result);
    }

    // Tenant limit
    if (tenantId) {
      const tenantConfig = this.findConfig('tenant', identifiers.tenant);
      if (tenantConfig) {
        const result = this.checkLimitAtLevel(tenantConfig, now);
        results.push(result);
      }
    }

    // User limit
    if (userId) {
      const userConfig = this.findConfig('user', identifiers.user);
      if (userConfig) {
        const result = this.checkLimitAtLevel(userConfig, now);
        results.push(result);
      }
    }

    // Resource limit
    if (resourceId) {
      const resourceConfig = this.findConfig('resource', identifiers.resource);
      if (resourceConfig) {
        const result = this.checkLimitAtLevel(resourceConfig, now);
        results.push(result);
      }
    }

    // API key limit
    if (apiKey) {
      const apiKeyConfig = this.findConfig('api_key', identifiers.api_key);
      if (apiKeyConfig) {
        const result = this.checkLimitAtLevel(apiKeyConfig, now);
        results.push(result);
      }
    }

    // IP limit
    if (ipAddress) {
      const ipConfig = this.findConfig('ip', identifiers.ip);
      if (ipConfig) {
        const result = this.checkLimitAtLevel(ipConfig, now);
        results.push(result);
      }
    }

    // Most-restrictive-wins: if any limit is exceeded, reject
    const deniedResult = results.find((r) => !r.allowed);
    if (deniedResult) {
      return {
        allowed: false,
        level: deniedResult.level,
        identifier: deniedResult.identifier,
        remainingRequests: 0,
        resetAt: deniedResult.resetAt,
        retryAfterSeconds: Math.ceil(deniedResult.resetAt / 1000 - now / 1000),
        reason: `${deniedResult.level} limit exceeded`,
        limitingLevel: deniedResult.level,
      };
    }

    // All limits passed - find most restrictive remaining quota
    let minRemaining = Infinity;
    let resultToReturn = results[0] || {
      allowed: true,
      level: 'global',
      identifier: identifiers.global,
      remainingRequests: 0,
      resetAt: now + 1000,
    };

    for (const result of results) {
      if (result.remainingRequests < minRemaining) {
        minRemaining = result.remainingRequests;
        resultToReturn = result;
      }
    }

    return resultToReturn;
  }

  /**
   * Check limit at a specific level
   */
  private checkLimitAtLevel(config: RateLimitConfig, now: number): RateLimitCheckResult {
    const configKey = `${config.level}:${config.identifier}`;
    let bucket = this.tokenBuckets.get(configKey);

    if (!bucket) {
      bucket = {
        tokens: config.requestsPerSecond * (config.burstSize || this.defaultBurstSize),
        lastRefillAt: now,
      };
      this.tokenBuckets.set(configKey, bucket);
    }

    // Refill tokens based on elapsed time
    const timeSinceRefill = (now - bucket.lastRefillAt) / 1000; // seconds
    const tokensToAdd = timeSinceRefill * config.requestsPerSecond;
    const maxTokens = config.requestsPerSecond * (config.burstSize || this.defaultBurstSize);

    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, maxTokens);
    bucket.lastRefillAt = now;

    // Check if request can be allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.hitCounts.set(configKey, (this.hitCounts.get(configKey) || 0) + 1);

      const records = this.requestRecords.get(config.level) || [];
      records.push({ timestamp: now, identifier: config.identifier });
      this.requestRecords.set(config.level, records);

      // Clean old records (older than 1 hour)
      const oneHourAgo = now - 60 * 60 * 1000;
      const cleanedRecords = records.filter((r) => r.timestamp > oneHourAgo);
      this.requestRecords.set(config.level, cleanedRecords);

      return {
        allowed: true,
        level: config.level,
        identifier: config.identifier,
        remainingRequests: Math.floor(bucket.tokens),
        resetAt: now + 1000, // Next second reset
      };
    }

    // Rate limit exceeded
    const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / config.requestsPerSecond);

    return {
      allowed: false,
      level: config.level,
      identifier: config.identifier,
      remainingRequests: 0,
      resetAt: now + retryAfterSeconds * 1000,
      retryAfterSeconds,
      reason: `${config.level} limit exceeded: ${config.requestsPerSecond} requests per second`,
    };
  }

  /**
   * Find configuration for a specific level and identifier
   */
  private findConfig(level: LimitLevel, identifier: string): RateLimitConfig | null {
    for (const config of this.limitConfigs.values()) {
      if (config.level === level && config.identifier === identifier) {
        return config;
      }
    }
    return null;
  }

  /**
   * Get usage statistics for a specific level
   */
  getUsageStats(level: LimitLevel, identifier: string): LimitUsageStats | null {
    const config = this.findConfig(level, identifier);
    if (!config) {
return null;
}

    const configKey = `${level}:${identifier}`;
    const records = this.requestRecords.get(level) || [];
    const now = Date.now();

    // Count requests in various windows
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const requestsInSecond = records.filter(
      (r) => r.identifier === identifier && r.timestamp > oneSecondAgo
    ).length;

    const lastRecord = records
      .filter((r) => r.identifier === identifier)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return {
      level,
      identifier,
      requestsInWindow: requestsInSecond,
      requestsPerSecond: config.requestsPerSecond,
      requestsPerMinute: config.requestsPerMinute,
      requestsPerHour: config.requestsPerHour,
      lastRequestAt: lastRecord?.timestamp || 0,
      nextResetAt: now + 1000,
      hitCount: this.hitCounts.get(configKey) || 0,
    };
  }

  /**
   * Get all usage statistics
   */
  getAllUsageStats(): LimitUsageStats[] {
    const stats: LimitUsageStats[] = [];

    for (const config of this.limitConfigs.values()) {
      const stat = this.getUsageStats(config.level, config.identifier);
      if (stat) {
        stats.push(stat);
      }
    }

    return stats;
  }

  /**
   * Reset limit for a specific level
   */
  resetLimit(level: LimitLevel, identifier: string): boolean {
    const config = this.findConfig(level, identifier);
    if (!config) {
return false;
}

    const configKey = `${level}:${identifier}`;
    this.tokenBuckets.set(configKey, {
      tokens: config.requestsPerSecond * (config.burstSize || this.defaultBurstSize),
      lastRefillAt: Date.now(),
    });

    this.hitCounts.set(configKey, 0);

    return true;
  }

  /**
   * Reset all limits
   */
  resetAll(): void {
    const now = Date.now();

    for (const [configKey, config] of this.limitConfigs) {
      this.tokenBuckets.set(configKey, {
        tokens: config.requestsPerSecond * (config.burstSize || this.defaultBurstSize),
        lastRefillAt: now,
      });

      this.hitCounts.set(configKey, 0);
    }

    const levels: LimitLevel[] = ['global', 'tenant', 'user', 'resource', 'api_key', 'ip'];
    for (const level of levels) {
      this.requestRecords.set(level, []);
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): Record<string, unknown> {
    const allStats = this.getAllUsageStats();
    const totalRequests = allStats.reduce((sum, s) => sum + s.hitCount, 0);
    const totalLimits = this.limitConfigs.size;

    const levelBreakdown: Record<string, unknown> = {};
    for (const stat of allStats) {
      if (!levelBreakdown[stat.level]) {
        levelBreakdown[stat.level] = { count: 0, totalHits: 0 };
      }
      (levelBreakdown[stat.level] as any).count++;
      (levelBreakdown[stat.level] as any).totalHits += stat.hitCount;
    }

    return {
      totalLimits,
      totalRequests,
      levels: Object.keys(this.requestRecords).length,
      levelBreakdown,
      configuredLimitLevels: Array.from(this.limitConfigs.values()).map((c) => ({
        level: c.level,
        identifier: c.identifier,
        requestsPerSecond: c.requestsPerSecond,
      })),
    };
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.limitConfigs.clear();
    this.tokenBuckets.clear();
    this.hitCounts.clear();
    this.rejectionReasons.clear();

    const levels: LimitLevel[] = ['global', 'tenant', 'user', 'resource', 'api_key', 'ip'];
    for (const level of levels) {
      this.requestRecords.set(level, []);
    }
  }

  /**
   * Shutdown limiter
   */
  shutdown(): void {
    this.clear();
  }
}

// Export singleton
export const multiLevelRateLimiter = new MultiLevelRateLimiter();
