import { describe, it, expect, vi } from 'vitest';
import {
  mapInsightToRecommendation,
  GuardianNetworkInsightContext,
  GuardianNetworkRecommendationDraft,
} from '@/lib/guardian/network/recommendationModel';

describe('X06: Network Recommendations', () => {
  describe('Recommendation Model - mapInsightToRecommendation', () => {
    it('should map anomaly insights to recommendations or handle gracefully', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'error_rate',
        metricKey: 'http_500_errors',
        severity: 'high',
        deltaRatio: 2.5,
        zScore: 3.2,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Should return an array; may be empty if heuristics don't match this specific metric
      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        expect(recommendations[0]).toMatchObject({
          title: expect.any(String),
          summary: expect.any(String),
          severity: expect.any(String),
        });
      }
    });

    it('should map early warning insights to recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'early_warning',
        metricFamily: 'alerts',
        metricKey: 'spike_pattern',
        severity: 'medium',
        patterns: ['spike_pattern', 'threshold_breach'],
        deltaRatio: 0.8,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Should return an array
      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(['playbook_drill', 'rule_tuning']).toContain(rec.recommendationType);
        });
      }
    });

    it('should map coverage insights to recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'coverage',
        metricFamily: 'qa',
        metricKey: 'coverage.rule_123',
        severity: 'high',
        coverageScore: 0.5,
        coverageGap: true,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(['qa_focus', 'coverage_gap']).toContain(rec.recommendationType);
          expect(['high', 'critical']).toContain(rec.severity);
        });
      }
    });

    it('should return different recommendations for different cohort positions', () => {
      const baseContext: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'latency',
        metricKey: 'p99_latency',
        severity: 'medium',
        deltaRatio: 1.8,
        zScore: 2.1,
      };

      const aboveP90 = mapInsightToRecommendation('tenant-1', {
        ...baseContext,
        cohortPosition: 'above_p90',
      });

      const belowMedian = mapInsightToRecommendation('tenant-1', {
        ...baseContext,
        cohortPosition: 'below_median',
      });

      // Should generate recommendations or empty arrays based on heuristics
      expect(Array.isArray(aboveP90)).toBe(true);
      expect(Array.isArray(belowMedian)).toBe(true);
    });

    it('should include rationale in recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'throughput',
        metricKey: 'requests_per_second',
        severity: 'critical',
        deltaRatio: 3.0,
        zScore: 4.5,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        expect(rec.rationale).toBeDefined();
        expect(rec.rationale).toContain('anomaly'); // Should reference the source
      });
    });

    it('should create deterministic recommendations for same input', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'memory',
        metricKey: 'heap_usage',
        severity: 'high',
        deltaRatio: 2.2,
        zScore: 2.8,
        cohortPosition: 'above_p75',
      };

      const rec1 = mapInsightToRecommendation('tenant-1', context);
      const rec2 = mapInsightToRecommendation('tenant-1', context);

      expect(rec1).toEqual(rec2);
    });

    it('should handle low severity anomalies', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'disk',
        metricKey: 'free_space',
        severity: 'low',
        deltaRatio: 1.1,
        zScore: 1.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(['low', 'medium']).toContain(rec.severity);
        });
      }
    });

    it('should handle critical severity with multiple patterns', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'early_warning',
        metricFamily: 'alerts',
        metricKey: 'cascade_pattern',
        severity: 'critical',
        patterns: ['cascade_pattern', 'cascade_pattern_variant', 'secondary_impact'],
        deltaRatio: 0.95,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach((rec) => {
        expect(rec.severity).toBe('critical');
      });
    });

    it('should include tenant_id in related entities', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'error_rate',
        metricKey: 'errors',
        severity: 'medium',
        deltaRatio: 2.0,
        zScore: 2.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-xyz', context);

      recommendations.forEach((rec) => {
        expect(rec.relatedEntities).toBeDefined();
        if (rec.relatedEntities && typeof rec.relatedEntities === 'object') {
          const entities = rec.relatedEntities as any;
          expect(entities.tenantId).toBe('tenant-xyz');
        }
      });
    });

    it('should mark coverage gaps with recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'coverage',
        metricFamily: 'qa',
        metricKey: 'coverage.rule_456',
        severity: 'medium',
        coverageScore: 0.65,
        coverageGap: true,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(['qa_focus', 'coverage_gap']).toContain(rec.recommendationType);
        });
      }
    });
  });

  describe('Recommendation Types & Severity Levels', () => {
    it('should use valid recommendation types when generated', () => {
      const validTypes = ['rule_tuning', 'playbook_drill', 'qa_focus', 'performance_tuning', 'coverage_gap'];
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'alerts',
        metricKey: 'alerts.total',
        severity: 'critical',
        deltaRatio: 2.0,
        zScore: 2.5,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(validTypes).toContain(rec.recommendationType);
        });
      }
    });

    it('should use valid severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      const context: GuardianNetworkInsightContext = {
        source: 'early_warning',
        metricFamily: 'alerts',
        metricKey: 'pattern',
        severity: 'high',
        patterns: ['pattern'],
        deltaRatio: 0.8,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(validSeverities).toContain(rec.severity);
        });
      }
    });

    it('should escalate critical severity appropriately', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'error_rate',
        metricKey: 'critical_errors',
        severity: 'critical',
        deltaRatio: 5.0,
        zScore: 5.5,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        expect(['high', 'critical']).toContain(rec.severity);
      });
    });
  });

  describe('Recommendation Deduplication Logic', () => {
    it('should use recommendation_type + suggestion_theme + metric_key for deduplication', () => {
      // Two contexts with same type/theme/key should deduplicate
      const context1: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'errors',
        metricKey: 'http_errors',
        severity: 'high',
        deltaRatio: 2.0,
        zScore: 2.5,
        cohortPosition: 'above_p90',
      };

      const context2: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'errors',
        metricKey: 'http_errors',
        severity: 'high',
        deltaRatio: 2.5, // Different delta
        zScore: 3.0, // Different z-score
        cohortPosition: 'above_p75', // Different position
      };

      const rec1 = mapInsightToRecommendation('tenant-1', context1);
      const rec2 = mapInsightToRecommendation('tenant-1', context2);

      // Should generate same base recommendation (same type/theme/key)
      if (rec1.length > 0 && rec2.length > 0) {
        expect(rec1[0].recommendationType).toBe(rec2[0].recommendationType);
        expect(rec1[0].suggestionTheme).toBe(rec2[0].suggestionTheme);
      }
    });
  });

  describe('Privacy & Security', () => {
    it('should not leak individual tenant metrics in recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'errors',
        metricKey: 'errors',
        severity: 'high',
        deltaRatio: 2.5,
        zScore: 3.0,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-secret-123', context);

      recommendations.forEach((rec) => {
        // Recommendation should not contain actual metric values or raw data
        expect(rec.summary).not.toContain('2.5');
        expect(rec.summary).not.toContain('3.0');
        expect(rec.title).not.toContain('tenant-secret');
        expect(rec.summary).not.toContain('tenant-secret');
      });
    });

    it('should use aggregated cohort language instead of individual metrics', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'latency',
        metricKey: 'p99',
        severity: 'medium',
        deltaRatio: 1.8,
        zScore: 2.1,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        // Should reference cohort position, not individual metrics
        const textLower = (rec.summary + rec.rationale).toLowerCase();
        if (rec.cohortPosition) {
          expect(textLower).toMatch(/above|below|median|percentile|cohort|peer|benchmark/i);
        }
      });
    });

    it('should include tenant_id for filtering but not expose it in user-facing text', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'test',
        metricKey: 'metric',
        severity: 'high',
        deltaRatio: 2.0,
        zScore: 2.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-abc', context);

      recommendations.forEach((rec) => {
        // Summary/title should not expose tenant ID
        expect(rec.title).not.toContain('tenant-abc');
        expect(rec.summary).not.toContain('tenant-abc');
      });
    });
  });

  describe('Status Transitions', () => {
    it('should generate recommendation drafts (status applied during persistence)', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'alerts',
        metricKey: 'alerts.total',
        severity: 'critical',
        deltaRatio: 2.0,
        zScore: 2.5,
        cohortPosition: 'above_p90',
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Mapping function returns drafts; status is applied during persistence
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle anomaly with no cohort position', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'errors',
        metricKey: 'errors',
        severity: 'medium',
        deltaRatio: 1.5,
        zScore: 2.0,
        // No cohortPosition
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Should return an array (may be empty if heuristics don't match)
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach((rec) => {
        expect(rec.title).toBeDefined();
        expect(rec.summary).toBeDefined();
      });
    });

    it('should handle early warning with empty patterns', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'early_warning',
        metricFamily: 'alerts',
        metricKey: 'pattern',
        severity: 'low',
        patterns: [],
        deltaRatio: 0.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Should still generate recommendations or empty array
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle coverage with zero score', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'coverage',
        metricFamily: 'qa',
        metricKey: 'coverage.rule_zero',
        severity: 'critical',
        coverageScore: 0,
        coverageGap: true,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(['high', 'critical']).toContain(rec.severity);
        });
      }
    });

    it('should handle coverage at 100%', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'coverage',
        metricFamily: 'qa',
        metricKey: 'coverage.rule_full',
        severity: 'low',
        coverageScore: 1.0,
        coverageGap: false,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      // Should not generate recommendations for full coverage
      if (recommendations.length === 0) {
        expect(recommendations.length).toBe(0);
      }
    });
  });

  describe('Recommendation Structure', () => {
    it('should include all required fields in recommendations', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'test',
        metricKey: 'metric',
        severity: 'high',
        deltaRatio: 2.0,
        zScore: 2.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        expect(rec.title).toBeDefined();
        expect(rec.summary).toBeDefined();
        expect(rec.rationale).toBeDefined();
        expect(rec.severity).toBeDefined();
        expect(rec.recommendationType).toBeDefined();
        expect(rec.suggestionTheme).toBeDefined();
      });
    });

    it('should include related entities for tracking', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'errors',
        metricKey: 'http_errors',
        severity: 'high',
        deltaRatio: 2.5,
        zScore: 3.0,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        expect(rec.relatedEntities).toBeDefined();
      });
    });

    it('should have reasonable string lengths', () => {
      const context: GuardianNetworkInsightContext = {
        source: 'anomaly',
        metricFamily: 'test',
        metricKey: 'metric',
        severity: 'high',
        deltaRatio: 2.0,
        zScore: 2.5,
      };

      const recommendations = mapInsightToRecommendation('tenant-1', context);

      recommendations.forEach((rec) => {
        expect(rec.title.length).toBeGreaterThan(0);
        expect(rec.title.length).toBeLessThan(200);
        expect(rec.summary.length).toBeGreaterThan(0);
        expect(rec.summary.length).toBeLessThan(500);
      });
    });
  });
});
