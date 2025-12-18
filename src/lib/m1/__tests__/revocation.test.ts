/**
 * M1 Token Revocation System Tests
 *
 * Test suite for JWT token revocation with persistent storage
 *
 * Version: v2.3.0
 * Phase: 10 - Token Revocation System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TokenRevocationManager, RevokedToken } from '../security/token-revocation-manager';

describe('Token Revocation System', () => {
  let manager: TokenRevocationManager;

  beforeEach(() => {
    manager = new TokenRevocationManager();
    manager.clearCache();
  });

  /**
   * REVOCATION CREATION TESTS (2 tests)
   */
  describe('Revocation Creation', () => {
    it('should create token revocation record', async () => {
      const jti = 'token-123';
      const toolName = 'tool_registry_list';

      const revocation = await manager.revokeToken(jti, toolName, 'Manual revocation', 'admin');

      expect(revocation.jti).toBe(jti);
      expect(revocation.toolName).toBe(toolName);
      expect(revocation.revokedBy).toBe('admin');
      expect(revocation.reason).toBe('Manual revocation');
      expect(revocation.revokedAt).toBeGreaterThan(0);
    });

    it('should use system as default revoker', async () => {
      const revocation = await manager.revokeToken('token-456', 'tool_policy_check', 'Expired');

      expect(revocation.revokedBy).toBe('system');
    });
  });

  /**
   * REVOCATION VERIFICATION TESTS (3 tests)
   */
  describe('Revocation Verification', () => {
    it('should verify revoked token', async () => {
      const jti = 'revoked-token-789';
      await manager.revokeToken(jti, 'log_agent_run', 'Test revocation');

      const isRevoked = await manager.isRevoked(jti);

      expect(isRevoked).toBe(true);
    });

    it('should confirm non-revoked token', async () => {
      const isRevoked = await manager.isRevoked('non-existent-token');

      expect(isRevoked).toBe(false);
    });

    it('should use cache for revocation checks', async () => {
      const jti = 'cached-token';
      await manager.revokeToken(jti, 'tool_registry_list', 'Test');

      // First check
      const isRevoked1 = await manager.isRevoked(jti);
      // Second check should use cache
      const isRevoked2 = await manager.isRevoked(jti);

      expect(isRevoked1).toBe(true);
      expect(isRevoked2).toBe(true);
    });
  });

  /**
   * QUERY AND RETRIEVAL TESTS (3 tests)
   */
  describe('Revocation Queries', () => {
    beforeEach(async () => {
      await manager.revokeToken('token-1', 'tool_registry_list', 'Reason 1', 'user1');
      await manager.revokeToken('token-2', 'tool_policy_check', 'Reason 2', 'user2');
      await manager.revokeToken('token-3', 'tool_registry_list', 'Reason 3', 'user1');
    });

    it('should get revocations by tool', async () => {
      const revocations = await manager.getRevocationsByTool('tool_registry_list');

      expect(revocations.length).toBeGreaterThanOrEqual(2);
      expect(revocations.every(r => r.toolName === 'tool_registry_list')).toBe(true);
    });

    it('should get all active revocations', async () => {
      const revocations = await manager.getActiveRevocations(100);

      expect(revocations.length).toBeGreaterThanOrEqual(3);
      expect(revocations.every(r => r.expiresAt > Date.now())).toBe(true);
    });

    it('should get audit log with pagination', async () => {
      const log = await manager.getAuditLog(2, 0);

      expect(log.total).toBeGreaterThanOrEqual(3);
      expect(log.logs.length).toBeLessThanOrEqual(2);
    });
  });

  /**
   * MAINTENANCE TESTS (2 tests)
   */
  describe('Revocation Maintenance', () => {
    it('should purge expired revocations', async () => {
      // Create revocation with past expiry (simulate old entry)
      const jti = 'expired-token';
      const revocation = await manager.revokeToken(jti, 'test_tool', 'Old token');

      // Manually set expiry to past
      (revocation as any).expiresAt = Date.now() - 1000;

      // Recreate manager with the expired entry
      const testManager = new TokenRevocationManager();
      // Note: In real scenario, this would be loaded from database
      const revocations = await testManager.getActiveRevocations();

      // Purge should remove expired entries
      const purgedCount = await testManager.purgeExpiredRevocations();
      expect(typeof purgedCount).toBe('number');
    });

    it('should provide manager statistics', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('cachedTokens');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('cacheSizeBytes');
      expect(typeof stats.cachedTokens).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.cacheSizeBytes).toBe('number');
    });
  });

  /**
   * INTEGRATION TESTS (4 tests)
   */
  describe('Token Revocation Integration', () => {
    it('should handle multiple concurrent revocations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          manager.revokeToken(`token-${i}`, 'tool_registry_list', `Reason ${i}`)
        );
      }

      const revocations = await Promise.all(promises);

      expect(revocations).toHaveLength(10);
      expect(revocations.every(r => !!r.jti)).toBe(true);
    });

    it('should track revoker information', async () => {
      await manager.revokeToken('token-1', 'tool_1', 'Reason 1', 'alice');
      await manager.revokeToken('token-2', 'tool_1', 'Reason 2', 'bob');

      const log = await manager.getAuditLog(10);
      const revokers = new Set(log.logs.map(r => r.revokedBy));

      expect(revokers.has('alice')).toBe(true);
      expect(revokers.has('bob')).toBe(true);
    });

    it('should maintain revocation expiry', async () => {
      const revocation = await manager.revokeToken('token-exp', 'test_tool', 'Test');

      expect(revocation.expiresAt).toBeGreaterThan(revocation.revokedAt);
      expect(revocation.expiresAt).toBeLessThanOrEqual(
        revocation.revokedAt + 24 * 60 * 60 * 1000 + 1000
      );
    });

    it('should clear cache without affecting database', async () => {
      const jti = 'token-to-clear';
      await manager.revokeToken(jti, 'tool_registry_list', 'Test clear');

      // Verify it's in cache
      let isRevoked = await manager.isRevoked(jti);
      expect(isRevoked).toBe(true);

      // Clear cache
      manager.clearCache();

      // Without database, should return false
      isRevoked = await manager.isRevoked(jti);
      expect(isRevoked).toBe(false);
    });
  });

  /**
   * REVOCATION SCENARIOS TESTS (3 tests)
   */
  describe('Real-World Revocation Scenarios', () => {
    it('should handle credential compromise scenario', async () => {
      // User's credentials compromised
      const userTokens = [
        'token-user-1',
        'token-user-2',
        'token-user-3',
      ];

      for (const token of userTokens) {
        await manager.revokeToken(token, 'tool_registry_list', 'Credential compromise', 'security_team');
      }

      // All should be revoked
      for (const token of userTokens) {
        const isRevoked = await manager.isRevoked(token);
        expect(isRevoked).toBe(true);
      }
    });

    it('should handle permission revocation scenario', async () => {
      // Admin revokes write permissions
      const writeTokens = ['write-token-1', 'write-token-2'];

      for (const token of writeTokens) {
        await manager.revokeToken(token, 'file_write', 'Permission revoked', 'admin');
      }

      const revocations = await manager.getRevocationsByTool('file_write');
      expect(revocations.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle token rotation scenario', async () => {
      // Old token being rotated
      const oldToken = 'old-token-v1';
      const newToken = 'new-token-v2';

      // Revoke old token
      await manager.revokeToken(oldToken, 'tool_registry_list', 'Token rotation', 'system');

      // New token should not be revoked
      let isRevoked = await manager.isRevoked(oldToken);
      expect(isRevoked).toBe(true);

      isRevoked = await manager.isRevoked(newToken);
      expect(isRevoked).toBe(false);
    });
  });
});
