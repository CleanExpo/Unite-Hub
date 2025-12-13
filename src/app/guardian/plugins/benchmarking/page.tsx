'use client';

/**
 * Cross-Industry Benchmarking Dashboard
 * Displays privacy-preserving benchmark comparisons against anonymised cohorts
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Users, Eye, Zap } from 'lucide-react';
import type { BenchmarkSnapshot } from '@/lib/guardian/plugins/cross-industry-benchmarking/types';
import { computeBenchmarks } from '@/lib/guardian/plugins/cross-industry-benchmarking/benchmarkService';
import { selectBenchmarkCohort } from '@/lib/guardian/plugins/cross-industry-benchmarking/cohortService';
import { narrativeService } from '@/lib/guardian/services/narrativeService';

export default function BenchmarkingDashboard() {
  const [snapshot, setSnapshot] = useState<BenchmarkSnapshot | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        // Select safe cohort (with k-anonymity enforcement)
        const cohortSelection = await selectBenchmarkCohort('healthcare', '30d');

        // Mock tenant metrics (in production, fetch from Guardian data warehouse)
        const tenantMetrics = {
          alerts30d: 150,
          incidents30d: 45,
          correlations30d: 8,
          riskLabelDistribution30d: {
            low: 15,
            medium: 20,
            high: 10
          },
          metricsVariance: 14.5
        };

        // Mock cohort distribution (in production, aggregated from warehouse)
        const cohortDistribution = {
          size: cohortSelection.cohort.size,
          industryLabel: cohortSelection.cohort.industryLabel,
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

        const data = await computeBenchmarks(
          'tenant-123', // Mock tenant ID
          tenantMetrics,
          cohortSelection.cohort,
          cohortDistribution
        );

        setSnapshot(data);

        // Generate AI insight (neutral language)
        const insight = await narrativeService.generateExecutiveBrief(
          'Benchmarking',
          data.metrics.length,
          'on_track',
          data.warnings
        );
        setAiInsight(insight);
      } catch (error) {
        console.error('Failed to load benchmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBenchmarks();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-text-secondary">
        Computing benchmarks...
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-6 text-center text-text-secondary">
        Unable to load benchmarking data
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Benchmarking</h1>
            <p className="text-sm text-text-secondary mt-1">
              Privacy-preserving peer comparison · Generated {new Date(snapshot.generatedAt).toLocaleString()}
            </p>
          </div>
          <Eye className="h-8 w-8 text-accent-500" />
        </div>
      </div>

      {/* Internal Use Watermark */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900 font-semibold">
          🔒 INTERNAL USE ONLY · Anonymised Data · K-Anonymity Enforced (k≥10)
        </p>
      </div>

      {/* Cohort Summary */}
      <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Benchmark Cohort</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-secondary">Cohort Type</p>
            <p className="text-lg font-bold text-text-primary mt-1">
              {snapshot.cohort.industryLabel === 'global' ? 'Global' : snapshot.cohort.industryLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Members</p>
            <p className="text-lg font-bold text-text-primary mt-1">{snapshot.cohort.size}+</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Window</p>
            <p className="text-lg font-bold text-text-primary mt-1">{snapshot.cohort.window}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Privacy</p>
            <p className="text-lg font-bold text-green-600 mt-1">✓ Verified</p>
          </div>
        </div>
      </div>

      {/* AI Insight (if available) */}
      {aiInsight && (
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Benchmark Insight</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{aiInsight}</p>
        </div>
      )}

      {/* Benchmarks Table */}
      {snapshot.metrics.length > 0 ? (
        <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border-subtle">
            <h2 className="font-semibold text-text-primary">Benchmark Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Metric</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Your Value</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Cohort Median</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.metrics.map((metric, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {metric.key.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono">
                      {typeof metric.tenantValue === 'number'
                        ? metric.tenantValue.toFixed(1)
                        : metric.tenantValue}
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono">
                      {metric.cohortMedian.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          metric.interpretation === 'elevated'
                            ? 'bg-orange-100 text-orange-800'
                            : metric.interpretation === 'below'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {metric.interpretation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                      {metric.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-subtle rounded-lg p-4 text-center text-text-secondary">
          No benchmarks available yet. Check back soon.
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-2">
            <span className="text-sm">✓ Typical</span>
          </h3>
          <p className="text-xs text-green-800">
            Within ±15% of cohort median. Operational patterns align with peer baseline.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 flex items-center gap-2 mb-2">
            <span className="text-sm">⚠ Elevated</span>
          </h3>
          <p className="text-xs text-orange-800">
            &gt;15% above median. May indicate higher operational complexity or resource needs.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
            <span className="text-sm">→ Below</span>
          </h3>
          <p className="text-xs text-blue-800">
            &lt;-15% below median. Indicates lower incident volume or higher stability.
          </p>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-xs text-text-secondary space-y-2">
        <p>
          <strong>Privacy Guarantee:</strong> {snapshot.disclaimer}
        </p>
        <p>
          <strong>No Ranking:</strong> These comparisons are neutral, informational only. Not a ranking, scorecard, or competitive benchmark.
        </p>
        <p>
          <strong>K-Anonymity:</strong> Cohort contains minimum {snapshot.cohort.size} members. Individual tenant identities are never exposed.
        </p>
      </div>
    </div>
  );
}
