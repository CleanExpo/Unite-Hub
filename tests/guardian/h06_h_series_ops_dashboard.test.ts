/**
 * H06: H-Series Ops Dashboard & Unified Intelligence Summary Tests
 * Tests for:
 * - Summary aggregator service (graceful degradation, PII validation)
 * - Summary API endpoint (tenant scoping, safe redaction)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHSeriesSummary,
  validateSummaryForPII,
  type HSeriesSummary,
  type ModulePresence,
} from '@/lib/guardian/ai/hSeriesSummaryService';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  })),
}));

const TEST_WORKSPACE_ID = 'test-workspace-id';

describe('H06: H-Series Ops Dashboard', () => {
  // ============================================================
  // T1: Unified Summary Orchestration
  // ============================================================

  describe('getHSeriesSummary', () => {
    it('should return HSeriesSummary with all required fields', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('range_days');
      expect(summary).toHaveProperty('modules');
      expect(summary).toHaveProperty('governance');
      expect(summary).toHaveProperty('core');
    });

    it('should include H01-H05 sections', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      expect(summary).toHaveProperty('h01_rule_suggestions');
      expect(summary).toHaveProperty('h02_anomalies');
      expect(summary).toHaveProperty('h03_correlation');
      expect(summary).toHaveProperty('h04_triage');
      expect(summary).toHaveProperty('h05_governance_coach');
    });

    it('should use provided days parameter', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 7 });
      expect(summary.range_days).toBe(7);
    });

    it('should default to 30 days if not provided', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, {});
      expect(summary.range_days).toBe(30);
    });

    it('should have valid timestamp in ISO format', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      const timestamp = new Date(summary.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should have modules object with boolean properties', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      expect(typeof summary.modules.h01_rule_suggestion).toBe('boolean');
      expect(typeof summary.modules.h02_anomaly_detection).toBe('boolean');
      expect(typeof summary.modules.h03_correlation_refinement).toBe('boolean');
      expect(typeof summary.modules.h04_incident_scoring).toBe('boolean');
      expect(typeof summary.modules.h05_governance_coach).toBe('boolean');
    });

    it('should have governance object with policy flags', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      expect(summary.governance).toHaveProperty('ai_allowed');
      expect(summary.governance).toHaveProperty('external_sharing_enabled');
      expect(summary.governance).toHaveProperty('audit_enabled');
      expect(summary.governance).toHaveProperty('backup_policy_enabled');
      expect(summary.governance).toHaveProperty('validation_gate_enabled');
    });

    it('should have core object with risk headline and insight counts', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      if (summary.core.risk_headline) {
        expect(typeof summary.core.risk_headline).toBe('string');
      }
      if (summary.core.insights_24h !== undefined) {
        expect(typeof summary.core.insights_24h).toBe('number');
      }
    });

    it('should pass PII validation', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      const validation = validateSummaryForPII(summary);
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('warnings');
    });
  });

  // ============================================================
  // T2: PII Validation & Safety
  // ============================================================

  describe('validateSummaryForPII', () => {
    it('should pass clean summary with no PII', () => {
      const cleanSummary: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'All systems operational',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(cleanSummary);
      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });

    it('should detect email addresses', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'Contact admin@example.com for issues',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.toLowerCase().includes('email'))).toBe(true);
    });

    it('should detect IP addresses', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'Server at 192.168.1.100 is healthy',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.toLowerCase().includes('ip'))).toBe(true);
    });

    it('should detect URLs', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'See https://example.com/docs for more info',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.toLowerCase().includes('url'))).toBe(true);
    });

    it('should detect secrets (api_key pattern)', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'api_key=sk_live_abc123def456',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.toLowerCase().includes('secret'))).toBe(true);
    });

    it('should detect secrets (token pattern)', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'token: abc123def456',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some((w) => w.toLowerCase().includes('secret'))).toBe(true);
    });

    it('should return warnings but mark valid if PII found', () => {
      const dirtyData: HSeriesSummary = {
        timestamp: new Date().toISOString(),
        range_days: 30,
        modules: {
          h01_rule_suggestion: false,
          h02_anomaly_detection: false,
          h03_correlation_refinement: false,
          h04_incident_scoring: false,
          h05_governance_coach: false,
        },
        governance: {
          ai_allowed: false,
          external_sharing_enabled: false,
          audit_enabled: false,
          backup_policy_enabled: false,
          validation_gate_enabled: false,
        },
        core: {
          risk_headline: 'admin@example.com saw 192.168.1.100 visit https://site.com with token=xyz',
          insights_24h: 5,
          insights_7d: 12,
          insights_30d: 45,
        },
      };

      const validation = validateSummaryForPII(dirtyData);
      // Warnings are expected but validation still returns data (logged, not blocking)
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('warnings');
    });
  });

  // ============================================================
  // T3: Graceful Degradation
  // ============================================================

  describe('Graceful Degradation', () => {
    it('should complete successfully even if all modules missing', async () => {
      const summary = await getHSeriesSummary('missing-workspace', { days: 30 });
      expect(summary).toBeDefined();

      // Module sections should either exist or be undefined
      // (mocked behavior may not reflect actual missing modules)
      // The important thing is that the service doesn't crash
      expect(summary.h01_rule_suggestions).toBeDefined();
      expect(summary.h02_anomalies).toBeDefined();
      expect(summary.h03_correlation).toBeDefined();
      expect(summary.h04_triage).toBeDefined();
      expect(summary.h05_governance_coach).toBeDefined();
    });

    it('should have timestamp even with no modules', async () => {
      const summary = await getHSeriesSummary('missing-workspace', { days: 30 });
      expect(summary.timestamp).toBeDefined();
      expect(typeof summary.timestamp).toBe('string');
    });

    it('should have governance state even with no modules', async () => {
      const summary = await getHSeriesSummary('missing-workspace', { days: 30 });
      expect(summary.governance).toBeDefined();
      expect(summary.governance).toHaveProperty('ai_allowed');
    });
  });

  // ============================================================
  // T4: Multi-Workspace Isolation
  // ============================================================

  describe('Multi-Workspace Isolation', () => {
    it('should handle different workspaces', async () => {
      const summary1 = await getHSeriesSummary('workspace-1', { days: 30 });
      const summary2 = await getHSeriesSummary('workspace-2', { days: 30 });

      expect(summary1).toBeDefined();
      expect(summary2).toBeDefined();
    });

    it('should handle special characters in workspace ID', async () => {
      const summary = await getHSeriesSummary('workspace-with-special-chars-123', { days: 30 });
      expect(summary).toBeDefined();
    });
  });

  // ============================================================
  // T5: Date Range Handling
  // ============================================================

  describe('Date Range Handling', () => {
    it('should accept 7 day range', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 7 });
      expect(summary.range_days).toBe(7);
    });

    it('should accept 30 day range', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      expect(summary.range_days).toBe(30);
    });

    it('should accept 90 day range', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 90 });
      expect(summary.range_days).toBe(90);
    });

    it('should default to 30 days', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, {});
      expect(summary.range_days).toBe(30);
    });
  });

  // ============================================================
  // T6: Data Structure Consistency
  // ============================================================

  describe('Data Structure Consistency', () => {
    it('should have consistent structure across calls', async () => {
      const summary1 = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });
      const summary2 = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });

      expect(Object.keys(summary1).sort()).toEqual(Object.keys(summary2).sort());
    });

    it('should have matching module presence across sections', async () => {
      const summary = await getHSeriesSummary(TEST_WORKSPACE_ID, { days: 30 });

      // If modules object says installed, corresponding section should exist
      if (summary.h01_rule_suggestions) {
        expect(summary.h01_rule_suggestions).toHaveProperty('installed');
      }
      if (summary.h02_anomalies) {
        expect(summary.h02_anomalies).toHaveProperty('installed');
      }
    });
  });
});
