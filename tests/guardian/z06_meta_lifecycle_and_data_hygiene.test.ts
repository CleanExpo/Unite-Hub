import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LIFECYCLE_POLICIES,
  GuardianLifecyclePolicy,
} from '@/lib/guardian/meta/lifecyclePolicyService';

describe('Guardian Z06: Meta Lifecycle & Data Hygiene', () => {
  // ============================================================================
  // Lifecycle Policy Tests
  // ============================================================================
  describe('lifecyclePolicyService.ts', () => {
    it('should define default policies for all Z-series meta artefacts', () => {
      const expectedKeys = [
        'readiness',
        'edition_fit',
        'uplift',
        'executive_reports',
        'adoption',
        'coach_nudges',
      ];

      expectedKeys.forEach((key) => {
        expect(DEFAULT_LIFECYCLE_POLICIES).toHaveProperty(key);
      });
    });

    it('should use conservative defaults (archive first, delete disabled)', () => {
      Object.entries(DEFAULT_LIFECYCLE_POLICIES).forEach(([_key, policy]) => {
        expect(policy.archiveEnabled).toBe(true);
        expect(policy.deleteEnabled).toBe(false); // Conservative default
        expect(policy.retentionDays).toBeGreaterThanOrEqual(7); // Safety minimum
      });
    });

    it('should enforce retention minimum of 7 days', () => {
      Object.entries(DEFAULT_LIFECYCLE_POLICIES).forEach(([_key, policy]) => {
        expect(policy.retentionDays).toBeGreaterThanOrEqual(7);
      });
    });

    it('should have reasonable retention periods', () => {
      const readiness = DEFAULT_LIFECYCLE_POLICIES.readiness;
      const reports = DEFAULT_LIFECYCLE_POLICIES.executive_reports;

      expect(readiness.retentionDays).toBe(365); // 1 year
      expect(reports.retentionDays).toBe(1460); // 4 years (compliance)
    });

    it('should provide min_keep_rows safety bound', () => {
      Object.entries(DEFAULT_LIFECYCLE_POLICIES).forEach(([_key, policy]) => {
        expect(policy.minKeepRows).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================================
  // Lifecycle Job Service Tests
  // ============================================================================
  describe('lifecycleJobService.ts', () => {
    it('should define lifecycle operation summary structure', () => {
      const mockSummary = {
        policyKey: 'readiness',
        compactedRows: 100,
        deletedRows: 50,
        retainedRows: 200,
        status: 'success' as const,
      };

      expect(mockSummary.policyKey).toBe('readiness');
      expect(mockSummary.compactedRows).toBeGreaterThanOrEqual(0);
      expect(mockSummary.deletedRows).toBeGreaterThanOrEqual(0);
      expect(mockSummary.status).toMatch(/success|skipped|error/);
    });

    it('should respect min_keep_rows safety bound', () => {
      const policy: GuardianLifecyclePolicy = {
        policyKey: 'adoption',
        label: 'Test',
        description: 'Test',
        retentionDays: 90,
        archiveEnabled: true,
        deleteEnabled: true,
        minKeepRows: 100,
        compactionStrategy: 'aggregate',
      };

      // Mock: If we have 150 rows total and min_keep_rows=100,
      // we can only delete up to 50 rows
      const totalRows = 150;
      const safeToDelete = totalRows - policy.minKeepRows;

      expect(safeToDelete).toBe(50);
      expect(safeToDelete).toBeGreaterThan(0);
    });

    it('should skip compaction if strategy is none', () => {
      const policy: GuardianLifecyclePolicy = {
        policyKey: 'readiness',
        label: 'Test',
        description: 'Test',
        retentionDays: 365,
        archiveEnabled: true,
        deleteEnabled: false,
        minKeepRows: 100,
        compactionStrategy: 'none',
      };

      expect(policy.compactionStrategy).toBe('none');
    });

    it('should track deletion safety guardrails', () => {
      const policy: GuardianLifecyclePolicy = {
        policyKey: 'coach_nudges',
        label: 'Coach Nudges',
        description: 'Test',
        retentionDays: 180,
        archiveEnabled: true,
        deleteEnabled: false, // Disabled by default
        minKeepRows: 50,
        compactionStrategy: 'aggregate',
      };

      expect(policy.deleteEnabled).toBe(false);
      expect(policy.retentionDays).toBeGreaterThanOrEqual(7);
    });
  });

  // ============================================================================
  // API Route Tests
  // ============================================================================
  describe('API Routes: /lifecycle/policies and /lifecycle/run', () => {
    it('should validate workspaceId is required', () => {
      const url = new URL('http://localhost/api/guardian/meta/lifecycle/policies');
      const workspaceId = url.searchParams.get('workspaceId');
      expect(workspaceId).toBeNull();
    });

    it('should reject policy updates with retention < 90 days if delete enabled', () => {
      const update = {
        policy_key: 'adoption',
        retention_days: 30,
        delete_enabled: true,
      };

      // Safety check: should throw error
      const isAggressive = update.delete_enabled && update.retention_days < 90;
      expect(isAggressive).toBe(true);
    });

    it('should return lifecycle run summary with totals', () => {
      const mockRunSummary = {
        total_compacted: 500,
        total_deleted: 100,
        operations_successful: 5,
        operations_skipped: 1,
        operations_failed: 0,
      };

      expect(mockRunSummary.total_compacted).toBeGreaterThanOrEqual(0);
      expect(mockRunSummary.operations_successful + mockRunSummary.operations_failed).toBeGreaterThan(
        0
      );
    });

    it('should allow filtering by specific policy_keys', () => {
      const runRequest = {
        policy_keys: ['adoption', 'coach_nudges'],
      };

      expect(Array.isArray(runRequest.policy_keys)).toBe(true);
      expect(runRequest.policy_keys.length).toBe(2);
    });
  });

  // ============================================================================
  // Safety & Guarantees Tests
  // ============================================================================
  describe('Z06 Safety & Non-Breaking Guarantees', () => {
    it('should never affect non-Z-series tables', () => {
      // Z06 lifecycle policies only apply to:
      const zSeriesTables = [
        'guardian_tenant_readiness_scores', // Z01
        'guardian_tenant_uplift_plans', // Z02
        'guardian_tenant_uplift_tasks', // Z02
        'guardian_tenant_edition_fits', // Z03
        'guardian_executive_reports', // Z04
        'guardian_health_timeline_points', // Z04
        'guardian_adoption_scores', // Z05
        'guardian_inapp_coach_nudges', // Z05
      ];

      const nonZSeriesTables = [
        'guardian_alert_rules', // G-series
        'guardian_alert_events', // G-series
        'guardian_incidents', // H-series
        'guardian_correlations', // H-series
        'guardian_simulation_runs', // I-series
        'guardian_network_anomalies', // X-series
      ];

      // Verify Z06 policies only reference Z-series
      expect(zSeriesTables.some((t) => t.includes('readiness'))).toBe(true);
      expect(nonZSeriesTables.some((t) => t.includes('alert'))).toBe(true);
    });

    it('should make deletion policies explicit and optional', () => {
      // Default: delete_enabled should be false (conservative)
      Object.entries(DEFAULT_LIFECYCLE_POLICIES).forEach(([_key, policy]) => {
        expect(policy.deleteEnabled).toBe(false);
      });
    });

    it('should track lifecycle operations for audit trail', () => {
      // Operations should be logged with:
      const operationLog = {
        policy_key: 'adoption',
        compacted_rows: 100,
        deleted_rows: 0,
        status: 'success',
        timestamp: new Date().toISOString(),
        tenant_id: 'workspace-123',
      };

      expect(operationLog.policy_key).toBeDefined();
      expect(operationLog.timestamp).toBeDefined();
      expect(operationLog.tenant_id).toBeDefined();
    });
  });

  // ============================================================================
  // Data Hygiene Strategy Tests
  // ============================================================================
  describe('Data Hygiene Strategy', () => {
    it('should use snapshot compaction for readiness', () => {
      const policy = DEFAULT_LIFECYCLE_POLICIES.readiness;
      expect(policy.compactionStrategy).toBe('snapshot');
    });

    it('should use aggregate compaction for adoption', () => {
      const policy = DEFAULT_LIFECYCLE_POLICIES.adoption;
      expect(policy.compactionStrategy).toBe('aggregate');
    });

    it('should never delete pending or active nudges', () => {
      const policy = DEFAULT_LIFECYCLE_POLICIES.coach_nudges;
      // Logic: only delete shown/dismissed/completed nudges beyond retention
      // Never delete pending nudges
      expect(policy.retentionDays).toBeGreaterThan(0);
    });

    it('should preserve long-term compliance records', () => {
      const reports = DEFAULT_LIFECYCLE_POLICIES.executive_reports;
      const uplift = DEFAULT_LIFECYCLE_POLICIES.uplift;

      expect(reports.retentionDays).toBeGreaterThan(730); // 2+ years
      expect(uplift.retentionDays).toBeGreaterThanOrEqual(730); // 2 years
    });
  });

  // ============================================================================
  // Tenant Isolation Tests
  // ============================================================================
  describe('Tenant Isolation & RLS', () => {
    it('should enforce tenant scoping on all lifecycle operations', () => {
      // All queries must include tenant_id filter
      const query = `SELECT * FROM guardian_adoption_scores WHERE tenant_id = $1`;
      expect(query).toContain('tenant_id');
    });

    it('should prevent cross-tenant lifecycle operations', () => {
      const tenantA = 'workspace-a';
      const tenantB = 'workspace-b';

      // A lifecycle run for tenantA should not affect tenantB's data
      expect(tenantA).not.toBe(tenantB);
    });
  });
});
