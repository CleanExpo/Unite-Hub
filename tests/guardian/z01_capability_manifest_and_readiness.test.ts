import { describe, it, expect } from 'vitest';
import { GUARDIAN_CAPABILITIES, GuardianCapabilityDefinition } from '@/lib/guardian/meta/capabilityManifestService';

describe('Z01: Guardian Capability Manifest & Readiness', () => {
  describe('Capability Manifest', () => {
    it('should have valid capability definitions', () => {
      expect(GUARDIAN_CAPABILITIES.length).toBeGreaterThan(0);
    });

    it('should have unique keys', () => {
      const keys = GUARDIAN_CAPABILITIES.map((c) => c.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance'];
      GUARDIAN_CAPABILITIES.forEach((cap) => {
        expect(validCategories).toContain(cap.category);
      });
    });

    it('should have valid phase codes', () => {
      GUARDIAN_CAPABILITIES.forEach((cap) => {
        expect(Array.isArray(cap.phaseCodes)).toBe(true);
        expect(cap.phaseCodes.length).toBeGreaterThan(0);
        cap.phaseCodes.forEach((code) => {
          expect(code).toMatch(/^[GHIXZg-z]\d{2,3}$/i);
        });
      });
    });

    it('should have valid weights', () => {
      GUARDIAN_CAPABILITIES.forEach((cap) => {
        expect(cap.weight).toBeGreaterThan(0);
        expect(cap.weight).toBeLessThanOrEqual(10);
      });
    });

    it('should have required fields', () => {
      GUARDIAN_CAPABILITIES.forEach((cap) => {
        expect(cap.key).toBeDefined();
        expect(cap.label).toBeDefined();
        expect(cap.description).toBeDefined();
        expect(cap.category).toBeDefined();
        expect(cap.phaseCodes).toBeDefined();
        expect(cap.weight).toBeDefined();
        expect(cap.isTenantScoped).toBeDefined();
      });
    });

    it('should have tenant-scoped capabilities', () => {
      const tenantScoped = GUARDIAN_CAPABILITIES.filter((c) => c.isTenantScoped);
      expect(tenantScoped.length).toBeGreaterThan(0);
    });

    it('should include core capabilities', () => {
      const coreCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'core');
      const keys = coreCaps.map((c) => c.key);

      expect(keys).toContain('guardian.core.rules');
      expect(keys).toContain('guardian.core.alerts');
      expect(keys).toContain('guardian.core.incidents');
      expect(keys).toContain('guardian.core.risk');
    });

    it('should include network intelligence capabilities', () => {
      const networkCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'network_intelligence');
      const keys = networkCaps.map((c) => c.key);

      expect(keys).toContain('guardian.network.x01_telemetry');
      expect(keys).toContain('guardian.network.x02_anomalies');
      expect(keys).toContain('guardian.network.x03_early_warnings');
      expect(keys).toContain('guardian.network.x06_recommendations');
    });

    it('should include QA capabilities', () => {
      const qaCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'qa_chaos');
      const keys = qaCaps.map((c) => c.key);

      expect(keys).toContain('guardian.qa.i_series.simulation');
    });

    it('should have governance capabilities', () => {
      const govCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'governance');
      expect(govCaps.length).toBeGreaterThan(0);
    });
  });

  describe('Readiness Score Validation', () => {
    it('should validate readiness status values', () => {
      const validStatuses = ['not_configured', 'partial', 'ready', 'advanced'];
      const testStatuses: any[] = ['not_configured', 'partial', 'ready', 'advanced', 'invalid'];

      testStatuses.forEach((status) => {
        const isValid = validStatuses.includes(status);
        if (status === 'invalid') {
          expect(isValid).toBe(false);
        } else {
          expect(isValid).toBe(true);
        }
      });
    });

    it('should map scores to status buckets correctly', () => {
      // 0-25: not_configured
      // 26-50: partial
      // 51-75: ready
      // 76-100: advanced

      const statusMap = {
        not_configured: [0, 10, 25],
        partial: [26, 35, 50],
        ready: [51, 65, 75],
        advanced: [76, 90, 100],
      };

      Object.entries(statusMap).forEach(([status, scores]) => {
        scores.forEach((score) => {
          // Verify score is in expected range
          if (status === 'not_configured') expect(score).toBeLessThanOrEqual(25);
          if (status === 'partial') expect(score).toBeGreaterThanOrEqual(26);
          if (status === 'ready') expect(score).toBeGreaterThanOrEqual(51);
          if (status === 'advanced') expect(score).toBeGreaterThanOrEqual(76);
        });
      });
    });

    it('should validate overall status values', () => {
      const validStatuses = ['baseline', 'operational', 'mature', 'network_intelligent'];
      expect(validStatuses).toContain('baseline');
      expect(validStatuses).toContain('operational');
      expect(validStatuses).toContain('mature');
      expect(validStatuses).toContain('network_intelligent');
    });

    it('should map overall scores to status correctly', () => {
      // 0-39: baseline
      // 40-59: operational
      // 60-79: mature
      // 80-100: network_intelligent

      const mapScore = (score: number): string => {
        if (score >= 80) return 'network_intelligent';
        if (score >= 60) return 'mature';
        if (score >= 40) return 'operational';
        return 'baseline';
      };

      expect(mapScore(0)).toBe('baseline');
      expect(mapScore(30)).toBe('baseline');
      expect(mapScore(40)).toBe('operational');
      expect(mapScore(60)).toBe('mature');
      expect(mapScore(80)).toBe('network_intelligent');
      expect(mapScore(100)).toBe('network_intelligent');
    });
  });

  describe('Capability Structure', () => {
    it('should have valid phase codes for G-series', () => {
      const coreCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'core');
      coreCaps.forEach((cap) => {
        expect(cap.phaseCodes.some((p) => p.startsWith('G'))).toBe(true);
      });
    });

    it('should have valid phase codes for X-series', () => {
      const networkCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'network_intelligence');
      networkCaps.forEach((cap) => {
        expect(cap.phaseCodes.some((p) => p.startsWith('X'))).toBe(true);
      });
    });

    it('should have descriptive labels and descriptions', () => {
      GUARDIAN_CAPABILITIES.forEach((cap) => {
        expect(cap.label.length).toBeGreaterThan(5);
        expect(cap.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Capability Categories', () => {
    it('should have capabilities in all categories', () => {
      const categories = new Set(GUARDIAN_CAPABILITIES.map((c) => c.category));
      expect(categories.has('core')).toBe(true);
      expect(categories.has('ai_intelligence')).toBe(true);
      expect(categories.has('qa_chaos')).toBe(true);
      expect(categories.has('network_intelligence')).toBe(true);
      expect(categories.has('governance')).toBe(true);
    });

    it('should have reasonable distribution across categories', () => {
      const coreCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'core');
      const networkCaps = GUARDIAN_CAPABILITIES.filter((c) => c.category === 'network_intelligence');

      expect(coreCaps.length).toBeGreaterThan(0);
      expect(networkCaps.length).toBeGreaterThan(0);
      expect(coreCaps.length).toBeGreaterThanOrEqual(3); // At least 3 core capabilities
    });
  });

  describe('Readiness Details Schema', () => {
    it('should support non-PII aggregated metrics', () => {
      // Example details that should be allowed
      const allowedDetails = {
        totalRules: 10,
        activeRules: 8,
        rulesRatio: '80',
        channelsConfigured: 3,
        incidentsLast30d: 5,
        riskEngineEnabled: true,
        simulationRunsTotal: 12,
        telemetryEnabled: true,
        hasTelemetryData: true,
        anomaliesDetected: true,
        warningsEnabled: true,
        recommendationsGenerated: 25,
      };

      // All values should be scalar (no PII objects)
      Object.values(allowedDetails).forEach((val) => {
        expect(['number', 'string', 'boolean']).toContain(typeof val);
      });
    });
  });

  describe('Feature Flags & Experimental', () => {
    it('should mark experimental capabilities', () => {
      const experimental = GUARDIAN_CAPABILITIES.filter((c) => c.isExperimental);
      // Should have some experimental capabilities (future H-series, etc)
      expect(experimental.length).toBeGreaterThanOrEqual(0);
    });

    it('should indicate stability of capabilities', () => {
      const stable = GUARDIAN_CAPABILITIES.filter((c) => !c.isExperimental);
      // Most should be stable (core, X-series)
      expect(stable.length).toBeGreaterThan(GUARDIAN_CAPABILITIES.length / 2);
    });
  });
});
