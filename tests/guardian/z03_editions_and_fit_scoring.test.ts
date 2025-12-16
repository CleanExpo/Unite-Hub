import { describe, it, expect, vi } from 'vitest';
import { createMockSupabaseServer } from '../__mocks__/guardianSupabase.mock';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => createMockSupabaseServer()),
}));

import {
  GUARDIAN_EDITIONS,
  upsertEditionProfiles,
} from '@/lib/guardian/meta/editionProfileService';
import {
  computeEditionFitForTenant,
  GuardianEditionFitInput,
} from '@/lib/guardian/meta/editionFitService';

describe('Z03: Guardian Editions & Fit Scoring', () => {
  describe('Edition Profiles', () => {
    it('should have valid edition definitions', () => {
      expect(GUARDIAN_EDITIONS.length).toBeGreaterThan(0);
    });

    it('should have at least Core, Pro, Network-Intelligent editions', () => {
      const keys = GUARDIAN_EDITIONS.map((e) => e.key);
      expect(keys).toContain('guardian_core');
      expect(keys).toContain('guardian_pro');
      expect(keys).toContain('guardian_network_intelligent');
    });

    it('should have unique keys', () => {
      const keys = GUARDIAN_EDITIONS.map((e) => e.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have exactly one default edition', () => {
      const defaults = GUARDIAN_EDITIONS.filter((e) => e.isDefault);
      expect(defaults.length).toBe(1);
    });

    it('should have valid tiers', () => {
      const validTiers = ['core', 'pro', 'elite', 'custom'];
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(validTiers).toContain(e.tier);
      });
    });

    it('should have descending recommended scores', () => {
      // Core < Pro < Network-Intelligent
      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core');
      const pro = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_pro');
      const elite = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_network_intelligent');

      expect(core?.recommendedOverallScore).toBeLessThan(pro?.recommendedOverallScore || 100);
      expect(pro?.recommendedOverallScore).toBeLessThan(elite?.recommendedOverallScore || 100);
    });

    it('should require core capabilities for Core edition', () => {
      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core');
      const coreCapRequired = core?.capabilitiesRequired || [];

      expect(coreCapRequired).toContain('guardian.core.rules');
      expect(coreCapRequired).toContain('guardian.core.alerts');
      expect(coreCapRequired).toContain('guardian.core.incidents');
    });

    it('should include X-series for Network-Intelligent edition', () => {
      const elite = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_network_intelligent');
      const eliteCapRequired = elite?.capabilitiesRequired || [];

      expect(eliteCapRequired.some((c) => c.startsWith('guardian.network.'))).toBe(true);
    });
  });

  describe('Edition Fit Computation', () => {
    it('should compute fit score from readiness snapshot', () => {
      const input: GuardianEditionFitInput = {
        tenantId: 'test-tenant',
        readinessSnapshot: {
          overallScore: 50,
          overallStatus: 'operational',
          capabilities: [
            { capabilityKey: 'guardian.core.rules', score: 50, status: 'partial', details: {} },
            { capabilityKey: 'guardian.core.alerts', score: 50, status: 'partial', details: {} },
            { capabilityKey: 'guardian.core.incidents', score: 50, status: 'partial', details: {} },
          ],
        },
        edition: GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!,
      };

      const result = computeEditionFitForTenant(input);

      expect(result.overallFitScore).toBeGreaterThanOrEqual(0);
      expect(result.overallFitScore).toBeLessThanOrEqual(100);
      expect(['not_started', 'emerging', 'aligned', 'exceeds']).toContain(result.status);
    });

    it('should identify missing capabilities as gaps', () => {
      const input: GuardianEditionFitInput = {
        tenantId: 'test-tenant',
        readinessSnapshot: {
          overallScore: 20,
          overallStatus: 'baseline',
          capabilities: [
            // Only alerts configured; missing rules and incidents
            { capabilityKey: 'guardian.core.alerts', score: 50, status: 'partial', details: {} },
          ],
        },
        edition: GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!,
      };

      const result = computeEditionFitForTenant(input);

      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.gaps.some((g) => g.gapType === 'missing')).toBe(true);
    });

    it('should identify low-scoring capabilities as gaps', () => {
      const input: GuardianEditionFitInput = {
        tenantId: 'test-tenant',
        readinessSnapshot: {
          overallScore: 30,
          overallStatus: 'baseline',
          capabilities: [
            { capabilityKey: 'guardian.core.rules', score: 20, status: 'not_configured', details: {} },
            { capabilityKey: 'guardian.core.alerts', score: 25, status: 'not_configured', details: {} },
            { capabilityKey: 'guardian.core.incidents', score: 30, status: 'not_configured', details: {} },
          ],
        },
        edition: GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!,
      };

      const result = computeEditionFitForTenant(input);

      expect(result.gaps.some((g) => g.gapType === 'low_score')).toBe(true);
    });

    it('should map fit scores to status buckets', () => {
      const testCases = [
        { score: 15, expectedStatus: 'not_started' },
        { score: 40, expectedStatus: 'emerging' },
        { score: 70, expectedStatus: 'aligned' },
        { score: 95, expectedStatus: 'exceeds' },
      ];

      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!;

      testCases.forEach(({ score, expectedStatus }) => {
        const input: GuardianEditionFitInput = {
          tenantId: 'test-tenant',
          readinessSnapshot: {
            overallScore: score,
            overallStatus: 'operational',
            capabilities: [
              {
                capabilityKey: 'guardian.core.rules',
                score,
                status: 'partial',
                details: {},
              },
              { capabilityKey: 'guardian.core.alerts', score, status: 'partial', details: {} },
              { capabilityKey: 'guardian.core.incidents', score, status: 'partial', details: {} },
            ],
          },
          edition: core,
        };

        const result = computeEditionFitForTenant(input);
        expect(result.status).toBe(expectedStatus);
      });
    });

    it('should respect edition tier for low-score thresholds', () => {
      // Pro edition has stricter threshold than Core
      const readiness = {
        tenantId: 'test-tenant',
        overallScore: 50,
        overallStatus: 'operational',
        capabilities: [
          { capabilityKey: 'guardian.core.rules', score: 50, status: 'partial', details: {} },
          { capabilityKey: 'guardian.core.alerts', score: 50, status: 'partial', details: {} },
          { capabilityKey: 'guardian.core.incidents', score: 50, status: 'partial', details: {} },
          { capabilityKey: 'guardian.core.risk', score: 50, status: 'partial', details: {} },
          { capabilityKey: 'guardian.qa.i_series.simulation', score: 50, status: 'partial', details: {} },
        ],
      };

      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!;
      const pro = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_pro')!;

      const coreResult = computeEditionFitForTenant({
        tenantId: 'test-tenant',
        readinessSnapshot: readiness,
        edition: core,
      });

      const proResult = computeEditionFitForTenant({
        tenantId: 'test-tenant',
        readinessSnapshot: readiness,
        edition: pro,
      });

      // Pro should have more gaps due to stricter threshold
      expect(proResult.gaps.length).toBeGreaterThanOrEqual(coreResult.gaps.length);
    });
  });

  describe('Edition Packaging', () => {
    it('should have non-empty descriptions', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.description.length).toBeGreaterThan(10);
      });
    });

    it('should have category "packaging"', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.category).toBe('packaging');
      });
    });

    it('should have recommended scores >= min scores', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.recommendedOverallScore).toBeGreaterThanOrEqual(e.minOverallScore);
      });
    });

    it('should not have conflicting capability requirements', () => {
      // Custom edition should have empty requirements
      const custom = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_custom');
      expect(custom?.capabilitiesRequired.length).toBe(0);
    });
  });

  describe('Edition Advisory-Only Pattern', () => {
    it('should not suggest automatic configuration changes', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.label).not.toMatch(/auto-enable|auto-activate|automatic/i);
        expect(e.description).not.toMatch(/will|must enable|must configure/i);
      });
    });

    it('should frame editions as guidance', () => {
      // Check that descriptions use advisory language
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.description).toMatch(/ideal for|designed for|helps|enables|provides/i);
      });
    });
  });

  describe('Edition Privacy', () => {
    it('should not expose PII in edition definitions', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        expect(e.label).not.toMatch(/[\w\.-]+@[\w\.-]+/); // No emails
        expect(e.description).not.toMatch(/[\w\.-]+@[\w\.-]+/);
      });
    });

    it('should use generic capability keys', () => {
      GUARDIAN_EDITIONS.forEach((e) => {
        e.capabilitiesRequired.forEach((cap) => {
          expect(cap).toMatch(/^guardian\./);
        });
      });
    });
  });

  describe('Fit Score Validation', () => {
    it('should ensure fit scores are in valid range', () => {
      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!;

      const input: GuardianEditionFitInput = {
        tenantId: 'test-tenant',
        readinessSnapshot: {
          overallScore: 80,
          overallStatus: 'mature',
          capabilities: [
            { capabilityKey: 'guardian.core.rules', score: 80, status: 'ready', details: {} },
            { capabilityKey: 'guardian.core.alerts', score: 80, status: 'ready', details: {} },
            { capabilityKey: 'guardian.core.incidents', score: 80, status: 'ready', details: {} },
          ],
        },
        edition: core,
      };

      const result = computeEditionFitForTenant(input);

      expect(result.overallFitScore).toBeGreaterThanOrEqual(0);
      expect(result.overallFitScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty capability snapshots', () => {
      const core = GUARDIAN_EDITIONS.find((e) => e.key === 'guardian_core')!;

      const input: GuardianEditionFitInput = {
        tenantId: 'test-tenant',
        readinessSnapshot: {
          overallScore: 0,
          overallStatus: 'baseline',
          capabilities: [],
        },
        edition: core,
      };

      const result = computeEditionFitForTenant(input);

      expect(result.overallFitScore).toBe(0);
      expect(result.status).toBe('not_started');
      expect(result.gaps.length).toBe(core.capabilitiesRequired.length);
    });
  });
});
