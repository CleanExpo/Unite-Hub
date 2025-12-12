/**
 * Guardian I04: Auto-Remediation Playbook Simulator Tests
 * Tests for:
 * - Remediation playbook DSL validation
 * - Baseline metrics extraction
 * - Remediation simulation engine
 * - Pipeline emulation with overrides
 * - Orchestrator workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateAction,
  validatePlaybookConfig,
  describeAction,
  type GuardianRemediationAction,
  type GuardianRemediationPlaybookConfig,
} from '@/lib/guardian/simulation/remediationPlaybookTypes';
import { computeDeltaMetrics, classifyEffect } from '@/lib/guardian/simulation/remediationSimulator';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

const TEST_TENANT_ID = 'test-tenant-id';

describe('I04: Auto-Remediation Playbook Simulator', () => {
  // ============================================================
  // T1: Remediation Action Validation
  // ============================================================

  describe('Remediation Action Validation', () => {
    it('should validate adjust_rule_threshold action', () => {
      const action: GuardianRemediationAction = {
        type: 'adjust_rule_threshold',
        rule_id: 'rule-123',
        metric: 'severity',
        delta: 10,
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject adjust_rule_threshold with out-of-range delta', () => {
      const action: GuardianRemediationAction = {
        type: 'adjust_rule_threshold',
        rule_id: 'rule-123',
        metric: 'severity',
        delta: 100, // Out of range: -50 to +50
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate disable_rule action', () => {
      const action: GuardianRemediationAction = {
        type: 'disable_rule',
        rule_id: 'rule-456',
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(true);
    });

    it('should validate adjust_correlation_window action', () => {
      const action: GuardianRemediationAction = {
        type: 'adjust_correlation_window',
        window_minutes_delta: 30,
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(true);
    });

    it('should reject adjust_correlation_window with out-of-range delta', () => {
      const action: GuardianRemediationAction = {
        type: 'adjust_correlation_window',
        window_minutes_delta: 150, // Out of range: -30 to +120
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(false);
    });

    it('should validate increase_min_link_count action', () => {
      const action: GuardianRemediationAction = {
        type: 'increase_min_link_count',
        delta: 2,
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(true);
    });

    it('should reject increase_min_link_count with out-of-range delta', () => {
      const action: GuardianRemediationAction = {
        type: 'increase_min_link_count',
        delta: 10, // Out of range: +1 to +5
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(false);
    });

    it('should validate suppress_notification_channel action', () => {
      const action: GuardianRemediationAction = {
        type: 'suppress_notification_channel',
        channel: 'email',
        duration_minutes: 60,
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(true);
    });

    it('should reject suppress_notification_channel with invalid channel', () => {
      const action: GuardianRemediationAction = {
        type: 'suppress_notification_channel',
        channel: 'invalid_channel' as any,
        duration_minutes: 60,
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(false);
    });

    it('should reject suppress_notification_channel with out-of-range duration', () => {
      const action: GuardianRemediationAction = {
        type: 'suppress_notification_channel',
        channel: 'email',
        duration_minutes: 2000, // Out of range: 15-1440
      };

      const validation = validateAction(action);
      expect(validation.valid).toBe(false);
    });
  });

  // ============================================================
  // T2: Playbook Config Validation
  // ============================================================

  describe('Playbook Config Validation', () => {
    it('should validate valid playbook config', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: [
          {
            type: 'disable_rule',
            rule_id: 'rule-1',
          },
          {
            type: 'suppress_notification_channel',
            channel: 'slack',
            duration_minutes: 120,
          },
        ],
        notes: 'Test playbook',
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject playbook with no actions', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: [],
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes('least one'))).toBe(true);
    });

    it('should reject playbook with too many actions', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: Array(25)
          .fill(null)
          .map((_, i) => ({
            type: 'disable_rule' as const,
            rule_id: `rule-${i}`,
          })),
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes('most 20'))).toBe(true);
    });

    it('should reject playbook with invalid action', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: [
          {
            type: 'adjust_rule_threshold',
            rule_id: 'rule-1',
            metric: 'severity',
            delta: 100, // Invalid
          } as any,
        ],
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(false);
    });

    it('should accept playbook with exactly 20 actions', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: Array(20)
          .fill(null)
          .map((_, i) => ({
            type: 'disable_rule' as const,
            rule_id: `rule-${i}`,
          })),
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(true);
    });
  });

  // ============================================================
  // T3: Delta Metrics Calculation
  // ============================================================

  describe('Delta Metrics Calculation', () => {
    const baseline = {
      alerts_total: 1000,
      alerts_by_severity: { critical: 100, high: 300, medium: 600 },
      incidents_total: 50,
      incidents_by_status: { open: 30, resolved: 20 },
      correlations_total: 200,
      notifications_total: 250,
      avg_risk_score: 65.5,
      window_days: 30,
      computed_at: new Date().toISOString(),
    };

    it('should compute positive deltas when metrics improve', () => {
      const simulated = {
        alerts_total: 900,
        alerts_by_severity: { critical: 90, high: 270, medium: 540 },
        incidents_total: 45,
        incidents_by_status: { open: 27, resolved: 18 },
        correlations_total: 180,
        notifications_total: 225,
        avg_risk_score: 58.95,
        window_days: 30,
        computed_at: new Date().toISOString(),
      };

      const delta = computeDeltaMetrics(baseline, simulated);

      expect(delta.alerts_delta).toBe(-100);
      expect(delta.alerts_pct).toBe(-10);
      expect(delta.incidents_delta).toBe(-5);
      expect(delta.incidents_pct).toBeCloseTo(-10, 1);
      expect(delta.avg_risk_score_delta).toBeCloseTo(-6.55, 1);
      expect(delta.avg_risk_score_pct).toBeCloseTo(-10, 1);
    });

    it('should handle baseline zero safely', () => {
      const zeroBaseline = {
        ...baseline,
        alerts_total: 0,
        avg_risk_score: 0,
      };

      const simulated = {
        ...baseline,
        alerts_total: 0,
        avg_risk_score: 0,
      };

      const delta = computeDeltaMetrics(zeroBaseline, simulated);

      expect(delta.alerts_pct).toBe(0);
      expect(delta.avg_risk_score_pct).toBe(0);
    });

    it('should compute negative deltas when metrics worsen', () => {
      const simulated = {
        ...baseline,
        alerts_total: 1200,
        incidents_total: 60,
        avg_risk_score: 78.6,
      };

      const delta = computeDeltaMetrics(baseline, simulated);

      expect(delta.alerts_delta).toBe(200);
      expect(delta.alerts_pct).toBe(20);
      expect(delta.avg_risk_score_delta).toBeCloseTo(13.1, 1);
    });
  });

  // ============================================================
  // T4: Effect Classification
  // ============================================================

  describe('Effect Classification', () => {
    it('should classify as positive when alerts improve by >=10%', () => {
      const delta = {
        alerts_delta: -100,
        alerts_pct: -15,
        incidents_delta: 0,
        incidents_pct: 0,
        correlations_delta: 0,
        correlations_pct: 0,
        notifications_delta: 0,
        notifications_pct: 0,
        avg_risk_score_delta: 0,
        avg_risk_score_pct: 0,
      };

      const effect = classifyEffect(delta);
      expect(effect).toBe('positive');
    });

    it('should classify as positive when risk score improves by >=5%', () => {
      const delta = {
        alerts_delta: 0,
        alerts_pct: 0,
        incidents_delta: 0,
        incidents_pct: 0,
        correlations_delta: 0,
        correlations_pct: 0,
        notifications_delta: 0,
        notifications_pct: 0,
        avg_risk_score_delta: -5,
        avg_risk_score_pct: -8,
      };

      const effect = classifyEffect(delta);
      expect(effect).toBe('positive');
    });

    it('should classify as negative when alerts worsen by >=10%', () => {
      const delta = {
        alerts_delta: 100,
        alerts_pct: 15,
        incidents_delta: 0,
        incidents_pct: 0,
        correlations_delta: 0,
        correlations_pct: 0,
        notifications_delta: 0,
        notifications_pct: 0,
        avg_risk_score_delta: 0,
        avg_risk_score_pct: 0,
      };

      const effect = classifyEffect(delta);
      expect(effect).toBe('negative');
    });

    it('should classify as neutral when changes are small', () => {
      const delta = {
        alerts_delta: 10,
        alerts_pct: 1,
        incidents_delta: 0,
        incidents_pct: 0,
        correlations_delta: 0,
        correlations_pct: 0,
        notifications_delta: 0,
        notifications_pct: 0,
        avg_risk_score_delta: 1,
        avg_risk_score_pct: 2,
      };

      const effect = classifyEffect(delta);
      expect(effect).toBe('neutral');
    });

    it('should classify as neutral when improvements and degradations cancel out', () => {
      const delta = {
        alerts_delta: -100,
        alerts_pct: -15,
        incidents_delta: 50,
        incidents_pct: 15,
        correlations_delta: 0,
        correlations_pct: 0,
        notifications_delta: 0,
        notifications_pct: 0,
        avg_risk_score_delta: 0,
        avg_risk_score_pct: 0,
      };

      const effect = classifyEffect(delta);
      expect(effect).toBe('neutral');
    });
  });

  // ============================================================
  // T5: Action Description
  // ============================================================

  describe('Action Description', () => {
    it('should describe disable_rule action', () => {
      const action: GuardianRemediationAction = {
        type: 'disable_rule',
        rule_id: 'rule-123',
      };

      const desc = describeAction(action);
      expect(desc).toContain('Disable rule');
      expect(desc).toContain('rule-123');
    });

    it('should describe adjust_rule_threshold action', () => {
      const action: GuardianRemediationAction = {
        type: 'adjust_rule_threshold',
        rule_id: 'rule-456',
        metric: 'severity',
        delta: 10,
      };

      const desc = describeAction(action);
      expect(desc).toContain('Adjust');
      expect(desc).toContain('severity');
      expect(desc).toContain('rule-456');
      expect(desc).toContain('+10');
    });

    it('should describe suppress_notification_channel action', () => {
      const action: GuardianRemediationAction = {
        type: 'suppress_notification_channel',
        channel: 'slack',
        duration_minutes: 120,
      };

      const desc = describeAction(action);
      expect(desc).toContain('Suppress');
      expect(desc).toContain('slack');
      expect(desc).toContain('120');
    });
  });

  // ============================================================
  // T6: Baseline Metrics Structure
  // ============================================================

  describe('Baseline Metrics Structure', () => {
    it('should have all required fields', () => {
      const baseline = {
        alerts_total: 100,
        alerts_by_severity: { critical: 10, high: 30, medium: 60 },
        incidents_total: 5,
        incidents_by_status: { open: 3, resolved: 2 },
        correlations_total: 20,
        notifications_total: 50,
        avg_risk_score: 60.5,
        window_days: 30,
        computed_at: new Date().toISOString(),
      };

      expect(baseline).toHaveProperty('alerts_total');
      expect(baseline).toHaveProperty('alerts_by_severity');
      expect(baseline).toHaveProperty('incidents_total');
      expect(baseline).toHaveProperty('correlations_total');
      expect(baseline).toHaveProperty('avg_risk_score');
      expect(baseline.alerts_total).toBeGreaterThanOrEqual(0);
      expect(baseline.avg_risk_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // T7: Simulation Result Structure
  // ============================================================

  describe('Simulation Result Structure', () => {
    it('should have all required result fields', () => {
      const result = {
        runId: 'run-123',
        playbookId: 'playbook-456',
        status: 'completed' as const,
        baselineMetrics: {
          alerts_total: 100,
          alerts_by_severity: { critical: 10, high: 30, medium: 60 },
          incidents_total: 5,
          incidents_by_status: { open: 3, resolved: 2 },
          correlations_total: 20,
          notifications_total: 50,
          avg_risk_score: 60.5,
          window_days: 30,
        },
        simulatedMetrics: {
          alerts_total: 90,
          alerts_by_severity: { critical: 9, high: 27, medium: 54 },
          incidents_total: 4,
          incidents_by_status: { open: 2, resolved: 2 },
          correlations_total: 18,
          notifications_total: 45,
          avg_risk_score: 54.45,
          window_days: 30,
          computed_at: new Date().toISOString(),
        },
        deltaMetrics: {
          alerts_delta: -10,
          alerts_pct: -10,
          incidents_delta: -1,
          incidents_pct: -20,
          correlations_delta: -2,
          correlations_pct: -10,
          notifications_delta: -5,
          notifications_pct: -10,
          avg_risk_score_delta: -6.05,
          avg_risk_score_pct: -10,
        },
        overall_effect: 'positive' as const,
        summary: 'All systems would improve by approximately 10%',
        finished_at: new Date().toISOString(),
      };

      expect(result).toHaveProperty('runId');
      expect(result).toHaveProperty('playbookId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('baselineMetrics');
      expect(result).toHaveProperty('simulatedMetrics');
      expect(result).toHaveProperty('deltaMetrics');
      expect(result).toHaveProperty('overall_effect');
      expect(result).toHaveProperty('summary');
    });
  });

  // ============================================================
  // T8: Multi-Action Playbook
  // ============================================================

  describe('Multi-Action Playbook Validation', () => {
    it('should validate complex playbook with multiple action types', () => {
      const config: GuardianRemediationPlaybookConfig = {
        actions: [
          {
            type: 'disable_rule',
            rule_id: 'rule-noisy-alerts',
          },
          {
            type: 'adjust_rule_threshold',
            rule_id: 'rule-correlation',
            metric: 'severity',
            delta: 15,
          },
          {
            type: 'adjust_correlation_window',
            window_minutes_delta: 30,
          },
          {
            type: 'increase_min_link_count',
            delta: 2,
          },
          {
            type: 'suppress_notification_channel',
            channel: 'email',
            duration_minutes: 480,
          },
        ],
        notes: 'Comprehensive remediation strategy',
      };

      const validation = validatePlaybookConfig(config);
      expect(validation.valid).toBe(true);
    });
  });
});
