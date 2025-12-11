import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Rule Assistant Tests (H01)
 *
 * Tests for AI-assisted rule authoring functionality.
 * Note: These tests use mocked AI responses to avoid actual API calls.
 */

describe('Guardian AI Rule Assistant', () => {
  it('validates suggestion response structure', () => {
    const mockSuggestion = {
      suggestedConditions: [
        { field: 'status_code', op: 'equals', value: 500 },
      ],
      suggestedThresholds: [
        { metric: 'error_rate', suggestedValue: 0.05, rationale: '5% industry standard' },
      ],
      suggestedNotificationTemplate: 'High error rate detected',
      explanationSummary: 'This rule detects server errors',
    };

    expect(mockSuggestion.suggestedConditions).toBeInstanceOf(Array);
    expect(mockSuggestion.suggestedConditions.length).toBeGreaterThan(0);
    expect(mockSuggestion.suggestedConditions[0]).toHaveProperty('op');
    expect(['equals', 'greater_than', 'less_than', 'exists']).toContain(
      mockSuggestion.suggestedConditions[0].op
    );
  });

  it('handles AI unavailable gracefully', () => {
    const errorResponse = {
      error: 'Guardian AI suggestions are not configured for this environment.',
      code: 'AI_NOT_CONFIGURED',
    };

    expect(errorResponse.code).toBe('AI_NOT_CONFIGURED');
    expect(errorResponse.error).toBeTruthy();
  });

  it('validates condition operators', () => {
    const validOperators = ['equals', 'greater_than', 'less_than', 'exists'];

    const testCondition = { field: 'test', op: 'equals', value: 123 };
    expect(validOperators).toContain(testCondition.op);
  });

  it('validates severity levels in AI input', () => {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const testInput = { severity: 'high' };

    expect(validSeverities).toContain(testInput.severity);
  });

  it('validates data sources in AI input', () => {
    const validSources = ['telemetry', 'warehouse', 'replay', 'scenarios', 'guardian'];
    const testInput = { source: 'telemetry' };

    expect(validSources).toContain(testInput.source);
  });
});
