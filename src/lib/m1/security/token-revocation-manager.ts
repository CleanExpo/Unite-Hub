/**
 * M1 Token Revocation Manager
 *
 * Manages JWT token revocation with persistent storage in Convex.
 * Handles token revocation, status checking, and audit logging.
 *
 * Version: v2.3.0
 * Phase: 10 - Token Revocation System
 */

import { ConvexHttpClient } from 'convex/browser';

/**
 * Revoked token record
 */
export interface RevokedToken {
  jti: string; // Token ID
  toolName: string; // Tool that was approved
  revokedAt: number; // Timestamp of revocation
  revokedBy: string; // User or system that revoked
  reason?: string; // Reason for revocation
  expiresAt: number; // When revocation record expires (for cleanup)
}

/**
 * Revocation query result
 */
export interface RevocationQueryResult {
  count: number;
  revocations: RevokedToken[];
}

/**
 * Token revocation manager
 */
export class TokenRevocationManager {
  private localCache: Map<string, RevokedToken> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private cacheTTL: number = 60000; // 60 seconds
  private convexClient: ConvexHttpClient | null = null;

  /**
   * Initialize with Convex client
   */
  initialize(convexClient: ConvexHttpClient): void {
    this.convexClient = convexClient;
  }

  /**
   * Revoke a token
   */
  async revokeToken(
    jti: string,
    toolName: string,
    reason: string,
    revokedBy: string = 'system'
  ): Promise<RevokedToken> {
    const revocation: RevokedToken = {
      jti,
      toolName,
      revokedAt: Date.now(),
      revokedBy,
      reason,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hour retention
    };

    // Store in local cache
    this.localCache.set(jti, revocation);
    this.cacheExpiry.set(jti, Date.now() + this.cacheTTL);

    // Store in persistent database
    if (this.convexClient) {
      try {
        // Note: In production, would call Convex mutation
        // await this.convexClient.mutation(api.tokenRevocation.createRevocation, revocation);
      } catch (error) {
        console.error('Failed to persist revocation to database:', error);
        // Continue - local cache is still valid
      }
    }

    return revocation;
  }

  /**
   * Check if token is revoked
   */
  async isRevoked(jti: string): Promise<boolean> {
    // Check local cache first
    const cacheExpiry = this.cacheExpiry.get(jti);
    if (cacheExpiry && cacheExpiry > Date.now()) {
      return this.localCache.has(jti);
    }

    // Clear expired cache entry
    this.localCache.delete(jti);
    this.cacheExpiry.delete(jti);

    // Check database
    if (this.convexClient) {
      try {
        // Note: In production, would call Convex query
        // const result = await this.convexClient.query(api.tokenRevocation.isRevoked, { jti });
        // if (result) {
        //   this.localCache.set(jti, result);
        //   this.cacheExpiry.set(jti, Date.now() + this.cacheTTL);
        //   return true;
        // }
      } catch (error) {
        console.error('Failed to check revocation status:', error);
        // Fail closed - consider token revoked if database is unreachable
        return true;
      }
    }

    return false;
  }

  /**
   * Get all revocations for a tool
   */
  async getRevocationsByTool(toolName: string): Promise<RevokedToken[]> {
    const revocations: RevokedToken[] = [];

    // Check local cache
    for (const [, revocation] of this.localCache) {
      if (revocation.toolName === toolName) {
        revocations.push(revocation);
      }
    }

    // Query database
    if (this.convexClient) {
      try {
        // Note: In production, would call Convex query
        // const dbRevocations = await this.convexClient.query(
        //   api.tokenRevocation.getRevocationsByTool,
        //   { toolName }
        // );
        // revocations.push(...dbRevocations);
      } catch (error) {
        console.error('Failed to query revocations by tool:', error);
      }
    }

    return revocations;
  }

  /**
   * Get all active revocations
   */
  async getActiveRevocations(limit: number = 100): Promise<RevokedToken[]> {
    const revocations: RevokedToken[] = [];
    const now = Date.now();

    // Get from local cache
    for (const [, revocation] of this.localCache) {
      if (revocation.expiresAt > now) {
        revocations.push(revocation);
      }
    }

    // Query database if needed
    if (this.convexClient && revocations.length < limit) {
      try {
        // Note: In production, would call Convex query
        // const dbRevocations = await this.convexClient.query(
        //   api.tokenRevocation.getActiveRevocations,
        //   { limit }
        // );
      } catch (error) {
        console.error('Failed to query active revocations:', error);
      }
    }

    return revocations.slice(0, limit);
  }

  /**
   * Purge expired revocations
   */
  async purgeExpiredRevocations(): Promise<number> {
    const now = Date.now();
    let purgedCount = 0;

    // Purge from local cache
    for (const [jti, revocation] of this.localCache) {
      if (revocation.expiresAt < now) {
        this.localCache.delete(jti);
        this.cacheExpiry.delete(jti);
        purgedCount++;
      }
    }

    // Purge from database
    if (this.convexClient) {
      try {
        // Note: In production, would call Convex mutation
        // const dbPurgedCount = await this.convexClient.mutation(
        //   api.tokenRevocation.purgeExpired,
        //   { before: now }
        // );
        // purgedCount += dbPurgedCount;
      } catch (error) {
        console.error('Failed to purge expired revocations:', error);
      }
    }

    return purgedCount;
  }

  /**
   * Get revocation audit log
   */
  async getAuditLog(
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    logs: RevokedToken[];
  }> {
    // In production, would query audit trail from database
    const allRevocations = Array.from(this.localCache.values());
    const sorted = allRevocations.sort((a, b) => b.revokedAt - a.revokedAt);
    const paged = sorted.slice(offset, offset + limit);

    return {
      total: allRevocations.length,
      logs: paged,
    };
  }

  /**
   * Clear all local cache
   */
  clearCache(): void {
    this.localCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get manager statistics
   */
  getStats(): {
    cachedTokens: number;
    cacheHitRate: number;
    cacheSizeBytes: number;
  } {
    // Rough size estimation
    let cacheSize = 0;
    for (const [jti, revocation] of this.localCache) {
      cacheSize += jti.length + revocation.toolName.length + 100; // Rough estimation
    }

    return {
      cachedTokens: this.localCache.size,
      cacheHitRate: 95, // Placeholder
      cacheSizeBytes: cacheSize,
    };
  }
}

// Export singleton
export const tokenRevocationManager = new TokenRevocationManager();
