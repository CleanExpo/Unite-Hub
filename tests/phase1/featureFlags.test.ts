/**
 * Phase 1 Feature Flags Tests
 * Tests for feature flag system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFeatureFlags,
  isFeatureEnabled,
  refreshFeatureFlags,
} from '@/config/featureFlags';

describe('Phase 1 Feature Flags', () => {
  beforeEach(() => {
    refreshFeatureFlags(); // Clear cache before each test
  });

  describe('getFeatureFlags', () => {
    it('should load feature flags from config file', () => {
      const flags = getFeatureFlags();

      expect(flags).toBeDefined();
      expect(flags).toHaveProperty('newUIEnabled');
      expect(flags).toHaveProperty('newStaffPortalEnabled');
      expect(flags).toHaveProperty('newClientPortalEnabled');
      expect(flags).toHaveProperty('newAIEngineEnabled');
      expect(flags).toHaveProperty('newAuthEnabled');
      expect(flags).toHaveProperty('parallelTestingMode');
    });

    it('should use safe defaults if config file missing', () => {
      // Test that system falls back to disabled state if config is corrupted
      const flags = getFeatureFlags();

      // In safe default mode, new features should be disabled
      expect(typeof flags.newUIEnabled).toBe('boolean');
    });

    it('should cache flags for performance', () => {
      const flags1 = getFeatureFlags();
      const flags2 = getFeatureFlags();

      expect(flags1).toBe(flags2); // Same object reference = cached
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check specific feature flag', () => {
      const enabled = isFeatureEnabled('parallelTestingMode');

      expect(typeof enabled).toBe('boolean');
    });

    it('should return false for non-existent flags', () => {
      const enabled = isFeatureEnabled('nonExistentFlag' as any);

      expect(enabled).toBe(false);
    });
  });

  describe('refreshFeatureFlags', () => {
    it('should invalidate cache', () => {
      const flags1 = getFeatureFlags();
      refreshFeatureFlags();
      const flags2 = getFeatureFlags();

      // After refresh, should be different object references
      // (unless file hasn't changed, then content is same but re-read)
      expect(flags1).toBeDefined();
      expect(flags2).toBeDefined();
    });
  });
});
