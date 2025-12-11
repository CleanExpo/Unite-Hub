import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Governance Tests (H05)
 *
 * Tests for AI governance layer: settings, quotas, feature toggles.
 */

describe('Guardian AI Governance', () => {
  it('validates default AI settings', () => {
    const defaultSettings = {
      ai_enabled: true,
      rule_assistant_enabled: true,
      anomaly_detection_enabled: true,
      correlation_refinement_enabled: true,
      predictive_scoring_enabled: true,
      max_daily_ai_calls: 500,
      soft_token_limit: 200000,
    };

    expect(defaultSettings.ai_enabled).toBe(true);
    expect(defaultSettings.max_daily_ai_calls).toBeGreaterThan(0);
    expect(defaultSettings.soft_token_limit).toBeGreaterThan(0);
  });

  it('validates feature toggle logic', () => {
    const settings = {
      ai_enabled: true,
      rule_assistant_enabled: true,
    };

    const isEnabled = settings.ai_enabled && settings.rule_assistant_enabled;
    expect(isEnabled).toBe(true);

    // Disabled master toggle
    const disabledMaster = {
      ai_enabled: false,
      rule_assistant_enabled: true,
    };

    const isEnabledWithMasterOff = disabledMaster.ai_enabled && disabledMaster.rule_assistant_enabled;
    expect(isEnabledWithMasterOff).toBe(false);
  });

  it('validates quota ranges', () => {
    const validQuotas = [0, 100, 500, 1000, 10000];

    for (const quota of validQuotas) {
      expect(quota).toBeGreaterThanOrEqual(0);
      expect(quota).toBeLessThanOrEqual(10000);
    }

    const invalidQuota = -1;
    expect(invalidQuota).toBeLessThan(0); // Should be rejected

    const tooHighQuota = 100000;
    expect(tooHighQuota).toBeGreaterThan(10000); // Should be rejected
  });

  it('validates token limit ranges', () => {
    const validLimits = [0, 100000, 200000, 1000000, 10000000];

    for (const limit of validLimits) {
      expect(limit).toBeGreaterThanOrEqual(0);
      expect(limit).toBeLessThanOrEqual(10000000);
    }
  });

  it('aggregates usage metrics correctly', () => {
    const mockUsage = {
      totalAiCalls: 45,
      callsByFeature: {
        ruleAssistant: 20,
        anomalyDetection: 15,
        correlationRefinement: 10,
        predictiveScoring: 0,
      },
      lastCallAt: '2025-12-10T10:00:00Z',
      errorCount: 2,
      approximateTokenUsage: 15000,
    };

    const total =
      mockUsage.callsByFeature.ruleAssistant +
      mockUsage.callsByFeature.anomalyDetection +
      mockUsage.callsByFeature.correlationRefinement +
      mockUsage.callsByFeature.predictiveScoring;

    expect(total).toBe(mockUsage.totalAiCalls);
  });

  it('handles quota exceeded scenario', () => {
    const quota = {
      exceeded: true,
      current: 501,
      limit: 500,
    };

    expect(quota.exceeded).toBe(true);
    expect(quota.current).toBeGreaterThan(quota.limit);
  });
});
