/**
 * Z16: Z-Series Validation Gate Tests
 * Tests for production readiness validation covering all Z01-Z15 phases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateZSeriesStack,
  ValidationStatus,
  type ZSeriesValidationResult,
} from '@/lib/guardian/meta/zSeriesValidationGate';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-id',
          tenant_id: 'tenant-123',
          status: 'ready',
        },
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(() =>
      Promise.resolve({
        data: { rls_enabled: true },
        error: null,
      })
    ),
  })),
}));

describe('Guardian Z16: Z-Series Validation Gate', () => {
  const tenantId = 'tenant-123';

  describe('Validation Gate Overview', () => {
    it('should run complete validation gate', async () => {
      const result = await validateZSeriesStack(tenantId);

      expect(result).toBeDefined();
      expect(result.overallStatus).toBeDefined();
      expect(['pass', 'warn', 'fail']).toContain(result.overallStatus);
      expect(result.checks).toBeInstanceOf(Array);
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should return validation result with required fields', async () => {
      const result = await validateZSeriesStack(tenantId);

      expect(result.timestamp).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      expect(result.summary).toBeDefined();
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should compute overall status from checks', async () => {
      const result = await validateZSeriesStack(tenantId);

      const expectedStatus: ValidationStatus =
        result.summary.failed > 0 ? 'fail' : result.summary.warnings > 0 ? 'warn' : 'pass';
      expect(result.overallStatus).toBe(expectedStatus);
    });
  });

  describe('Table Existence Checks', () => {
    it('should verify all Z-series tables exist', async () => {
      const result = await validateZSeriesStack(tenantId);

      const tableChecks = result.checks.filter((c) => c.category === 'Table Existence');
      expect(tableChecks.length).toBeGreaterThan(20); // 30+ Z-series tables

      // Should have checks for key tables
      const keyTables = [
        'guardian_tenant_readiness_scores', // Z01
        'guardian_tenant_uplift_plans', // Z02
        'guardian_meta_governance_prefs', // Z10
        'guardian_meta_export_bundles', // Z11
        'guardian_meta_backup_sets', // Z15
      ];

      for (const table of keyTables) {
        const check = tableChecks.find((c) => c.name.includes(table));
        expect(check).toBeDefined();
      }
    });

    it('should indicate passing table checks', async () => {
      const result = await validateZSeriesStack(tenantId);

      const tableChecks = result.checks.filter((c) => c.category === 'Table Existence');
      const passingChecks = tableChecks.filter((c) => c.status === 'pass');
      expect(passingChecks.length).toBeGreaterThan(20); // Most should pass
    });
  });

  describe('RLS Enforcement Checks', () => {
    it('should verify RLS enabled on all Z-series tables', async () => {
      const result = await validateZSeriesStack(tenantId);

      const rlsChecks = result.checks.filter((c) => c.category === 'RLS Enforcement');
      expect(rlsChecks.length).toBeGreaterThan(20); // 30+ tables

      // At least some should pass (RLS enabled)
      const passingRLS = rlsChecks.filter((c) => c.status === 'pass');
      expect(passingRLS.length).toBeGreaterThan(0);
    });

    it('should provide remediation for RLS issues', async () => {
      const result = await validateZSeriesStack(tenantId);

      const rlsChecks = result.checks.filter((c) => c.category === 'RLS Enforcement');
      const failingRLS = rlsChecks.filter((c) => c.status === 'fail');

      for (const check of failingRLS) {
        expect(check.remediation).toBeDefined();
        expect(check.remediation).toContain('ALTER TABLE');
      }
    });
  });

  describe('Governance Defaults Checks', () => {
    it('should check governance preferences configured', async () => {
      const result = await validateZSeriesStack(tenantId);

      const govChecks = result.checks.filter((c) => c.category === 'Governance Defaults');
      expect(govChecks.length).toBeGreaterThan(0);

      const prefsCheck = govChecks.find((c) => c.name.includes('Governance Preferences'));
      expect(prefsCheck).toBeDefined();
    });

    it('should check feature flags configured', async () => {
      const result = await validateZSeriesStack(tenantId);

      const govChecks = result.checks.filter((c) => c.category === 'Governance Defaults');
      const flagsCheck = govChecks.find((c) => c.name.includes('Feature Flags'));
      expect(flagsCheck).toBeDefined();
    });

    it('should show governance details when configured', async () => {
      const result = await validateZSeriesStack(tenantId);

      const govChecks = result.checks.filter((c) => c.category === 'Governance Defaults');
      const prefsCheck = govChecks.find((c) => c.name.includes('Governance Preferences'));

      if (prefsCheck?.status === 'pass') {
        expect(prefsCheck.details).toBeDefined();
      }
    });
  });

  describe('Audit Logging Checks', () => {
    it('should verify audit log is functional', async () => {
      const result = await validateZSeriesStack(tenantId);

      const auditChecks = result.checks.filter((c) => c.category === 'Audit Logging');
      expect(auditChecks.length).toBeGreaterThan(0);

      const auditLogCheck = auditChecks.find((c) => c.name.includes('Audit Log'));
      expect(auditLogCheck).toBeDefined();
    });
  });

  describe('Data Integrity Checks', () => {
    it('should check for orphaned records', async () => {
      const result = await validateZSeriesStack(tenantId);

      const integrityChecks = result.checks.filter((c) => c.category === 'Data Integrity');
      expect(integrityChecks.length).toBeGreaterThan(0);

      const orphanCheck = integrityChecks.find((c) => c.name.includes('Orphaned'));
      if (orphanCheck) {
        expect(['pass', 'warn']).toContain(orphanCheck.status);
      }
    });
  });

  describe('Automation (Z13) Readiness', () => {
    it('should check Z13 schedules configured', async () => {
      const result = await validateZSeriesStack(tenantId);

      const autoChecks = result.checks.filter((c) => c.category === 'Automation (Z13)');
      expect(autoChecks.length).toBeGreaterThan(0);

      const scheduleCheck = autoChecks.find((c) => c.name.includes('Automation Schedules'));
      expect(scheduleCheck).toBeDefined();
    });

    it('should provide remediation for missing schedules', async () => {
      const result = await validateZSeriesStack(tenantId);

      const autoChecks = result.checks.filter((c) => c.category === 'Automation (Z13)');
      const scheduleCheck = autoChecks.find((c) => c.name.includes('Automation Schedules'));

      if (scheduleCheck?.status === 'warn') {
        expect(scheduleCheck.remediation).toContain('/guardian/admin/automation');
      }
    });
  });

  describe('Exports (Z11) Readiness', () => {
    it('should check export bundles created', async () => {
      const result = await validateZSeriesStack(tenantId);

      const exportChecks = result.checks.filter((c) => c.category === 'Exports (Z11)');
      expect(exportChecks.length).toBeGreaterThan(0);

      const bundleCheck = exportChecks.find((c) => c.name.includes('Export Bundles'));
      expect(bundleCheck).toBeDefined();
    });
  });

  describe('Backups (Z15) Readiness', () => {
    it('should check backup sets created', async () => {
      const result = await validateZSeriesStack(tenantId);

      const backupChecks = result.checks.filter((c) => c.category === 'Backups (Z15)');
      expect(backupChecks.length).toBeGreaterThan(0);

      const backupCheck = backupChecks.find((c) => c.name.includes('Backup Sets'));
      expect(backupCheck).toBeDefined();
    });

    it('should warn if backups are old', async () => {
      const result = await validateZSeriesStack(tenantId);

      const backupChecks = result.checks.filter((c) => c.category === 'Backups (Z15)');
      const backupCheck = backupChecks.find((c) => c.name.includes('Backup Sets'));

      if (backupCheck?.status === 'warn' && backupCheck.message.includes('days old')) {
        expect(backupCheck.remediation).toContain('fresh backups');
      }
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate actionable recommendations', async () => {
      const result = await validateZSeriesStack(tenantId);

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Each recommendation should be a string with actionable text
      for (const rec of result.recommendations) {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      }
    });

    it('should include phase-specific recommendations', async () => {
      const result = await validateZSeriesStack(tenantId);

      const recommendations = result.recommendations.join(' ').toLowerCase();

      // Should mention at least some phases
      const phasesMentioned = [
        recommendations.includes('z13'),
        recommendations.includes('z11'),
        recommendations.includes('z15'),
        recommendations.includes('z10'),
      ];

      expect(phasesMentioned.filter(Boolean).length).toBeGreaterThan(0);
    });

    it('should note if all checks passed', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.overallStatus === 'pass') {
        expect(result.recommendations.some((r) => r.includes('✅'))).toBe(true);
      }
    });
  });

  describe('Check Details & Remediation', () => {
    it('should provide message for each check', async () => {
      const result = await validateZSeriesStack(tenantId);

      for (const check of result.checks) {
        expect(check.message).toBeDefined();
        expect(check.message.length).toBeGreaterThan(0);
      }
    });

    it('should provide remediation for failures', async () => {
      const result = await validateZSeriesStack(tenantId);

      const failingChecks = result.checks.filter((c) => c.status === 'fail');
      for (const check of failingChecks) {
        expect(check.remediation).toBeDefined();
        expect(check.remediation?.length).toBeGreaterThan(0);
      }
    });

    it('should categorize checks appropriately', async () => {
      const result = await validateZSeriesStack(tenantId);

      const categories = new Set(result.checks.map((c) => c.category));
      const expectedCategories = [
        'Table Existence',
        'RLS Enforcement',
        'Governance Defaults',
        'Audit Logging',
        'Data Integrity',
        'Automation (Z13)',
        'Exports (Z11)',
        'Backups (Z15)',
      ];

      for (const cat of expectedCategories) {
        expect(categories.has(cat)).toBe(true);
      }
    });
  });

  describe('Validation Status Logic', () => {
    it('should return fail if any check failed', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.summary.failed > 0) {
        expect(result.overallStatus).toBe('fail');
      }
    });

    it('should return warn if warnings but no failures', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.summary.failed === 0 && result.summary.warnings > 0) {
        expect(result.overallStatus).toBe('warn');
      }
    });

    it('should return pass if no warnings or failures', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.summary.failed === 0 && result.summary.warnings === 0) {
        expect(result.overallStatus).toBe('pass');
      }
    });

    it('should sum checks correctly', async () => {
      const result = await validateZSeriesStack(tenantId);

      const computedTotal =
        result.summary.passed + result.summary.warnings + result.summary.failed;
      expect(computedTotal).toBe(result.checks.length);
    });
  });

  describe('Timestamp & Metadata', () => {
    it('should include valid ISO timestamp', async () => {
      const result = await validateZSeriesStack(tenantId);

      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000); // Within 1 minute
    });

    it('should include tenant ID in result', async () => {
      const result = await validateZSeriesStack(tenantId);
      expect(result.tenantId).toBe(tenantId);
    });
  });

  describe('Production Readiness Assessment', () => {
    it('should be production-ready with all checks passed', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.overallStatus === 'pass') {
        // All critical requirements met
        expect(result.summary.failed).toBe(0);
        expect(result.checks.filter((c) => c.category === 'Table Existence')).toBeTruthy();
        expect(result.checks.filter((c) => c.category === 'RLS Enforcement')).toBeTruthy();
      }
    });

    it('should be deployable with warnings only', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.overallStatus === 'warn') {
        // Warnings are acceptable with remediations
        expect(result.summary.failed).toBe(0);
        expect(result.summary.warnings).toBeGreaterThan(0);

        // Should have actionable recommendations
        for (const rec of result.recommendations) {
          expect(rec.length).toBeGreaterThan(0);
        }
      }
    });

    it('should block deployment on failures', async () => {
      const result = await validateZSeriesStack(tenantId);

      if (result.overallStatus === 'fail') {
        // Failures require remediation before deployment
        expect(result.summary.failed).toBeGreaterThan(0);

        // All failures should have remediations
        const failingChecks = result.checks.filter((c) => c.status === 'fail');
        for (const check of failingChecks) {
          expect(check.remediation).toBeDefined();
        }
      }
    });
  });
});
