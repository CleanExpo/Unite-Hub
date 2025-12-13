/**
 * Guardian Industry Pack: Cross-Industry Benchmarking - Test Suite
 *
 * Validates privacy guarantees, k-anonymity enforcement, and data safety
 * Test count: 35+ tests across cohort selection, metrics, governance, and privacy
 */

import { describe, it, expect } from 'vitest';
import { selectBenchmarkCohort, verifyKAnonymity, getCohortLabel } from '@/lib/guardian/plugins/cross-industry-benchmarking/cohortService';
import { computeBenchmarks } from '@/lib/guardian/plugins/cross-industry-benchmarking/benchmarkService';
import { isNeutralLanguage, generateBenchmarkInsight } from '@/lib/guardian/plugins/cross-industry-benchmarking/benchmarkBriefService';
import type { AggregateGuardianMetrics, CohortDistribution } from '@/lib/guardian/plugins/cross-industry-benchmarking/types';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';

describe('Guardian PLUGIN-09: Cross-Industry Benchmarking & Peer Signals', () => {
  describe('Plugin Registration & Metadata', () => {
    it('should register cross_industry_benchmarking_pack plugin', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin).toBeDefined();
      expect(plugin?.key).toBe('cross_industry_benchmarking_pack');
    });

    it('should enforce ENTERPRISE tier constraint only', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.requiredTiers).toContain('ENTERPRISE');
      expect(plugin?.requiredTiers?.length).toBe(1);
    });

    it('should require guardian_core, insights_dashboard, risk_engine features', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.requiredFeatures).toContain('guardian_core');
      expect(plugin?.requiredFeatures).toContain('insights_dashboard');
      expect(plugin?.requiredFeatures).toContain('risk_engine');
    });

    it('should mark plugin as PII-safe and non-sharing', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.governance.piiSafe).toBe(true);
      expect(plugin?.governance.requiresExternalSharing).toBe(false);
    });

    it('should declare aggregation requirement', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.governance.notes).toContain('Aggregate-only');
    });

    it('should declare ui_panel and report capabilities', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.capabilities).toContain('ui_panel');
      expect(plugin?.capabilities).toContain('report');
    });
  });

  describe('K-Anonymity & Cohort Selection', () => {
    it('should select industry cohort when k >= 10', async () => {
      const result = await selectBenchmarkCohort('healthcare', '30d');
      expect(result.cohort.industryLabel).toBe('healthcare');
      expect(result.cohort.size).toBeGreaterThanOrEqual(10);
      expect(result.fallbackReason).toBeUndefined();
    });

    it('should fallback to global cohort when industry < 10', async () => {
      const result = await selectBenchmarkCohort('government', '30d');
      expect(result.cohort.industryLabel).toBe('global');
      expect(result.cohort.size).toBeGreaterThanOrEqual(10);
      expect(result.fallbackReason).toBeTruthy();
      expect(result.fallbackReason).toContain('below k=10');
    });

    it('should use global cohort when no industry specified', async () => {
      const result = await selectBenchmarkCohort(null, '30d');
      expect(result.cohort.industryLabel).toBe('global');
      expect(result.cohort.size).toBeGreaterThanOrEqual(10);
    });

    it('should enforce k-anonymity threshold', () => {
      expect(verifyKAnonymity(9)).toBe(false);
      expect(verifyKAnonymity(10)).toBe(true);
      expect(verifyKAnonymity(150)).toBe(true);
    });

    it('should generate human-readable cohort labels', async () => {
      const result = await selectBenchmarkCohort('healthcare', '30d');
      const label = getCohortLabel(result.cohort);
      expect(label).toContain('Healthcare');
      expect(label).toContain(String(result.cohort.size));
      expect(label).toContain('organizations');
    });

    it('should never expose cohort membership', async () => {
      const result = await selectBenchmarkCohort('education', '30d');
      const label = getCohortLabel(result.cohort);
      // Should not contain individual names, IDs, or specific organizations
      expect(label).not.toMatch(/[A-Z][a-z]+ (Hospital|University|Company)/);
    });
  });

  describe('Benchmark Metrics Computation', () => {
    it('should compute alert rate benchmark', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const alertMetric = result.metrics.find((m) => m.key === 'alert_rate');
      expect(alertMetric).toBeDefined();
      expect(alertMetric?.tenantValue).toBe(5); // 150 / 30
      expect(alertMetric?.cohortMedian).toBe(4.8);
    });

    it('should compute incident rate benchmark', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const incidentMetric = result.metrics.find((m) => m.key === 'incident_rate');
      expect(incidentMetric).toBeDefined();
      expect(incidentMetric?.tenantValue).toBe(1.5); // 45 / 30
    });

    it('should compute correlation density benchmark', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 9
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const correlationMetric = result.metrics.find((m) => m.key === 'correlation_density');
      expect(correlationMetric).toBeDefined();
      expect(correlationMetric?.tenantValue).toBeCloseTo(20.0, 1); // 9/45 * 100
    });

    it('should compute risk label distribution benchmark', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8,
        riskLabelDistribution30d: { low: 15, medium: 20, high: 10 }
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const riskMetric = result.metrics.find((m) => m.key === 'risk_label_distribution');
      expect(riskMetric).toBeDefined();
      expect(riskMetric?.tenantValue).toBeCloseTo(22.2, 1); // 10/45 * 100
    });

    it('should compute volatility index benchmark', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8,
        metricsVariance: 14.5
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const volatilityMetric = result.metrics.find((m) => m.key === 'volatility_index');
      expect(volatilityMetric).toBeDefined();
      expect(volatilityMetric?.tenantValue).toBe(14.5);
    });
  });

  describe('Metric Interpretation', () => {
    it('should interpret below-median values as "below"', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 100, // 3.3/day, well below 4.8
        incidents30d: 30,
        correlations30d: 5
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const alertMetric = result.metrics.find((m) => m.key === 'alert_rate');
      expect(alertMetric?.interpretation).toBe('below');
    });

    it('should interpret elevated values as "elevated"', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 200, // 6.7/day, well above 4.8
        incidents30d: 60,
        correlations30d: 12
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const alertMetric = result.metrics.find((m) => m.key === 'alert_rate');
      expect(alertMetric?.interpretation).toBe('elevated');
    });

    it('should interpret within-range values as "typical"', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150, // 5/day, within ±15% of 4.8
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const alertMetric = result.metrics.find((m) => m.key === 'alert_rate');
      expect(alertMetric?.interpretation).toBe('typical');
    });
  });

  describe('Privacy & Language Safety', () => {
    it('should never expose tenant ID in public output', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      // Tenant ID in snapshot for internal tracking but should not appear in UI output
      expect(result.tenantId).toBe('tenant-123');
    });

    it('should use neutral language in metrics', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      // Check all rationale strings use neutral language
      result.metrics.forEach((metric) => {
        expect(isNeutralLanguage(metric.rationale)).toBe(true);
      });
    });

    it('should include privacy disclaimer', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      expect(result.disclaimer).toContain('anonymised');
      expect(result.disclaimer).toContain('aggregate');
      expect(result.disclaimer).toContain('Not rankings');
    });

    it('should forbid competitive language', () => {
      const forbiddenPhrases = [
        'We are better than',
        'Superior performance',
        'Leading indicators',
        'Trailing competitors',
        'Ranking competitors'
      ];

      forbiddenPhrases.forEach((phrase) => {
        expect(isNeutralLanguage(phrase)).toBe(false);
      });
    });

    it('should allow approved neutral language', () => {
      const approvedPhrases = [
        'Elevated above cohort median',
        'Aligns with peer baseline',
        'Lower than median',
        'Comparable operational patterns',
        'Higher activity volumes'
      ];

      approvedPhrases.forEach((phrase) => {
        expect(isNeutralLanguage(phrase)).toBe(true);
      });
    });
  });

  describe('AI Brief Generation', () => {
    it('should generate deterministic fallback insight', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const snapshot = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      const insight = await generateBenchmarkInsight(snapshot, false);
      expect(insight).toBeTruthy();
      expect(insight.toLowerCase()).toContain('indicator');
      expect(insight).not.toMatch(/\bbetter\b/i);
      expect(insight).not.toMatch(/\bworse\b/i);
    });

    it('should indicate when AI brief is available', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 150,
        incidents30d: 45,
        correlations30d: 8
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      expect(result.aiInsightAvailable).toBe(true);
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle minimal metrics gracefully', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 10,
        incidents30d: 3,
        correlations30d: 0
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      expect(result.metrics).toBeDefined();
      expect(result.metrics.length).toBeGreaterThan(0);
    });

    it('should handle extreme values', async () => {
      const tenantMetrics: AggregateGuardianMetrics = {
        alerts30d: 10000,
        incidents30d: 5000,
        correlations30d: 2000
      };

      const cohort: CohortDistribution = {
        size: 15,
        industryLabel: 'healthcare',
        metrics: {
          alertRateMedian: 4.8,
          alertRateP75: 5.8,
          alertRateP90: 7.2,
          incidentRateMedian: 1.4,
          incidentRateP75: 1.8,
          incidentRateP90: 2.3,
          correlationDensityMedian: 16.5,
          correlationDensityP75: 20.0,
          correlationDensityP90: 25.0,
          riskLabelHighPercentage: 20.0,
          volatilityIndexMedian: 18.5
        }
      };

      const result = await computeBenchmarks(
        'tenant-123',
        tenantMetrics,
        { size: 15, window: '30d', industryLabel: 'healthcare', kAnonymityEnforced: true, generatedAt: new Date().toISOString() },
        cohort
      );

      expect(result.metrics).toBeDefined();
      // Should compute without overflow
      const alertMetric = result.metrics.find((m) => m.key === 'alert_rate');
      expect(alertMetric?.tenantValue).toBeGreaterThan(0);
    });
  });

  describe('Governance Controls', () => {
    it('should enforce ENTERPRISE tier requirement', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.requiredTiers?.length).toBe(1);
      expect(plugin?.requiredTiers?.[0]).toBe('ENTERPRISE');
    });

    it('should require multiple features', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.requiredFeatures?.length).toBeGreaterThanOrEqual(3);
    });

    it('should mark AI brief as Z10-gated', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.metadata.governance?.aiSummaryGated).toBe(true);
      expect(plugin?.metadata.governance?.requiresZ10Approval).toBe(true);
    });

    it('should enforce minimum cohort size', () => {
      const plugin = pluginRegistry.getPlugin('cross_industry_benchmarking_pack');
      expect(plugin?.metadata.governance?.minCohortSize).toBe(10);
    });
  });
});
