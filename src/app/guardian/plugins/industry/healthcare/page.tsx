'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Heart,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { deriveHealthcareSignals } from '@/lib/guardian/plugins/industry-healthcare-agedcare/signalService';
import type { HealthcareSnapshot } from '@/lib/guardian/plugins/industry-healthcare-agedcare/types';
import { generateNarrative, formatNarrativeForUI } from '@/lib/guardian/plugins/narrativeService';
import type { NarrativeResponse } from '@/lib/guardian/plugins/narrativeService';

/**
 * Healthcare & Aged Care Oversight Dashboard
 * Displays heuristic care environment and operational signals
 * Read-only UI, aggregate-only data, no patient/resident/staff identifiers
 */
export default function HealthcareOpsPage({
  searchParams
}: {
  searchParams: Promise<{ workspaceId?: string; allowExternal?: string }>;
}) {
  const [snapshot, setSnapshot] = useState<HealthcareSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrative, setNarrative] = useState<NarrativeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowExternal, setAllowExternal] = useState(false);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        const params = await searchParams;
        const external = params.allowExternal === 'true';
        setAllowExternal(external);

        // Mock aggregate data (in production, would query Guardian API)
        const aggregateData = {
          alerts24h: 45,
          incidents24h: 12,
          correlations24h: 8,
          alerts7d: 280,
          incidents7d: 85,
          alerts30d: 1200,
          incidents30d: 350,
          currentRiskLabel: 'medium' as const,
          riskTrend: 'up' as const,
          triageBacklogCount: 5,
          hasH04Triage: true
        };

        // Derive signals
        const result = await deriveHealthcareSignals(aggregateData);

        // Generate AI narrative brief
        const narrativeResult = await generateNarrative({
          workspaceId: params.workspaceId || 'mock-workspace',
          pluginKey: 'industry_healthcare_agedcare_pack',
          pluginName: 'Healthcare & Aged Care Oversight',
          signals: result.signals,
          riskLabel: result.totals.riskLabel,
          totals: result.totals,
          allowExternal: external
        });

        setNarrative(narrativeResult);
        setSnapshot(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load signals');
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-bg-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-bg-card p-8">
        <div className="bg-error-50 border border-error-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-error-800">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-error-100 text-error-800 border-error-300';
      case 'medium':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'low':
        return 'bg-info-100 text-info-800 border-info-300';
      default:
        return 'bg-bg-hover text-text-secondary border-border';
    }
  };

  const getSeverityBadgeIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle size={16} />;
      case 'medium':
        return <AlertTriangle size={16} />;
      case 'low':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    return trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null;
  };

  const getRiskLabelColor = (label: string) => {
    switch (label) {
      case 'high':
        return 'text-error-700 bg-error-50';
      case 'medium':
        return 'text-warning-700 bg-warning-50';
      case 'low':
        return 'text-success-700 bg-success-50';
      default:
        return 'text-text-secondary bg-bg-hover';
    }
  };

  return (
    <div className="w-full min-h-screen bg-bg-base p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={32} className="text-accent-500" />
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Healthcare & Aged Care Oversight</h1>
                <p className="text-text-secondary text-sm mt-1">Care environment risk and operational signals</p>
              </div>
            </div>
            {!allowExternal && (
              <div className="bg-warning-100 border border-warning-300 text-warning-800 px-4 py-2 rounded-lg text-sm font-medium">
                🔒 INTERNAL - Sharing Restricted
              </div>
            )}
          </div>
        </div>

        {/* Executive Narrative Brief */}
        {narrative && (
          <div className="bg-bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-accent-500" />
              Executive Briefing
            </h2>
            {formatNarrativeForUI(narrative)}
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">24h Alerts</p>
                <p className="text-2xl font-bold text-text-primary mt-2">{snapshot.totals.alerts}</p>
              </div>
              <AlertCircle size={24} className="text-info-500 opacity-40" />
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">24h Incidents</p>
                <p className="text-2xl font-bold text-text-primary mt-2">{snapshot.totals.incidents}</p>
              </div>
              <AlertTriangle size={24} className="text-warning-500 opacity-40" />
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Correlations</p>
                <p className="text-2xl font-bold text-text-primary mt-2">{snapshot.totals.correlations}</p>
              </div>
              <Users size={24} className="text-accent-500 opacity-40" />
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Risk Level</p>
                <p className={`text-2xl font-bold mt-2 capitalize ${getRiskLabelColor(snapshot.totals.riskLabel)}`}>
                  {snapshot.totals.riskLabel}
                </p>
              </div>
              <Heart size={24} className="text-error-500 opacity-40" />
            </div>
          </div>
        </div>

        {/* High-Risk Alert Banner */}
        {snapshot.totals.riskLabel === 'high' && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-8 flex items-start gap-4">
            <AlertTriangle size={20} className="text-error-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-error-800">High-Risk Care Environment</h3>
              <p className="text-error-700 text-sm mt-1">
                Multiple operational signals indicate elevated care environment risk. Review signals below and consider escalation.
              </p>
            </div>
          </div>
        )}

        {/* Signals Table */}
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Detected Signals</h2>
          </div>

          {snapshot.signals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Signal</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Window</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Trend</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Rationale</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.signals.map((signal, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-bg-secondary transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary capitalize">
                        {signal.key.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getSeverityColor(signal.severity)} font-medium`}>
                          {getSeverityBadgeIcon(signal.severity)}
                          {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">{signal.window}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {signal.trend && <div className="flex items-center gap-1">{getTrendIcon(signal.trend)}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary max-w-sm">{signal.rationale}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {signal.suggestedAction && (
                          <div className="flex items-start gap-2">
                            <span className="text-accent-500 flex-shrink-0 mt-0.5">
                              <ArrowRight size={16} />
                            </span>
                            <span>{signal.suggestedAction}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-text-secondary">
              <CheckCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p>No signals detected. Care environment appears stable.</p>
            </div>
          )}
        </div>

        {/* Warnings Section */}
        {snapshot.warnings && snapshot.warnings.length > 0 && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-semibold text-warning-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Feature Availability Notices
            </h3>
            <ul className="space-y-2">
              {snapshot.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-warning-700">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Resources */}
        <div className="bg-bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Related Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/guardian" className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-accent-100 transition-colors">
              <ArrowRight size={16} className="text-accent-500" />
              <span className="text-sm text-text-primary font-medium">Intelligence Dashboard</span>
            </a>
            <a href="/guardian" className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-accent-100 transition-colors">
              <ArrowRight size={16} className="text-accent-500" />
              <span className="text-sm text-text-primary font-medium">Care Protocols</span>
            </a>
            <a href="/guardian" className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-accent-100 transition-colors">
              <ArrowRight size={16} className="text-accent-500" />
              <span className="text-sm text-text-primary font-medium">Documentation</span>
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-text-secondary text-xs py-4 border-t border-border">
          <p className="max-w-3xl mx-auto">
            {snapshot.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
