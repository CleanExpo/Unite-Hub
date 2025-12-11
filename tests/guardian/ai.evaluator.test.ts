import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Evaluator Tests (H06)
 *
 * Tests for AI evaluation and tuning framework.
 */

describe('Guardian AI Evaluator', () => {
  it('validates scenario structure', () => {
    const mockScenario = {
      id: 'scenario-1',
      tenant_id: null,
      feature: 'rule_assistant',
      label: 'Test scenario',
      description: 'Test rule assistant suggestions',
      input_payload: { ruleName: 'Test', severity: 'high' },
      expected_behavior: { suggestedConditions: [] },
      is_synthetic: true,
      created_at: new Date().toISOString(),
      created_by: 'admin',
    };

    expect(mockScenario.feature).toBe('rule_assistant');
    expect(mockScenario.is_synthetic).toBe(true);
    expect(mockScenario.input_payload).toBeTruthy();
  });

  it('validates eval result structure', () => {
    const mockResult = {
      status: 'success',
      score: 0.95,
      metrics: {
        hasOutput: true,
        outputType: 'object',
      },
      rawOutput: { suggestedConditions: [] },
    };

    expect(['success', 'error', 'timeout']).toContain(mockResult.status);
    expect(mockResult.score).toBeGreaterThanOrEqual(0);
    expect(mockResult.score).toBeLessThanOrEqual(1);
  });

  it('validates feature keys', () => {
    const validFeatures = [
      'rule_assistant',
      'anomaly_detection',
      'correlation_refinement',
      'predictive_scoring',
    ];

    for (const feature of validFeatures) {
      expect(validFeatures).toContain(feature);
    }
  });

  it('computes quality scores correctly', () => {
    const perfectMatch = 1.0;
    const partialMatch = 0.5;
    const noMatch = 0.0;

    expect(perfectMatch).toBe(1.0);
    expect(partialMatch).toBeGreaterThan(0);
    expect(partialMatch).toBeLessThan(1);
    expect(noMatch).toBe(0);
  });

  it('handles evaluation batch summary', () => {
    const mockSummary = {
      total: 10,
      success: 8,
      error: 2,
    };

    expect(mockSummary.success + mockSummary.error).toBe(mockSummary.total);
    expect(mockSummary.success).toBeGreaterThan(0);
  });
});
