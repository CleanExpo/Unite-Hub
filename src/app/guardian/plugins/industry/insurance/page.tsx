'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { deriveInsuranceSignals } from '@/lib/guardian/plugins/industry-insurance-pack/signalService';
import { collectAggregateData } from '@/lib/guardian/plugins/industry-insurance-pack/signalService';
import type { InsuranceOpsSnapshot } from '@/lib/guardian/plugins/industry-insurance-pack/types';
import { generateNarrative, formatNarrativeForUI } from '@/lib/guardian/plugins/narrativeService';
import type { NarrativeResponse } from '@/lib/guardian/plugins/narrativeService';

/**
 * Insurance & Claims Oversight Dashboard
 * Displays heuristic operational signals for claims processing
 * Read-only UI, aggregate-only data, PII-safe
 */
export default function InsuranceOpsPage({
  searchParams
}: {
  searchParams: Promise<{ workspaceId?: string; allowExternal?: string }>;
}) {
  const [snapshot, setSnapshot] = useState<InsuranceOpsSnapshot | null>(null);
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

        // Collect aggregate data (in production, would query Guardian API)
        const aggregateData = await collectAggregateData();

        // Derive signals
        const result = await deriveInsuranceSignals(aggregateData);
// Generate AI narrative brief        const narrativeResult = await generateNarrative({          workspaceId: params.workspaceId || "mock-workspace",          pluginKey: "industry_insurance_pack",          pluginName: "Insurance & Claims Oversight",          signals: result.signals,          riskLabel: result.totals.riskLabel,          totals: result.totals,          allowExternal: external        });        setNarrative(narrativeResult);
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-800">
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
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityBadgeIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle size={16} />;
      case 'medium':
        return <AlertCircle size={16} />;
      case 'low':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') {
return <TrendingUp size={16} className="text-red-600" />;
}
    if (trend === 'down') {
return <TrendingDown size={16} className="text-green-600" />;
}
    return null;
  };

  const getRiskBadgeColor = (label: string) => {
    switch (label) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="w-full min-h-screen bg-bg-primary p-6">
      {/* Header with governance watermark */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Shield size={32} className="text-accent-500" />
            Insurance Ops Dashboard
          </h1>
          {!allowExternal && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded border border-amber-300 flex items-center gap-2">
              <Lock size={14} />
              INTERNAL
            </div>
          )}
        </div>
        <p className="text-text-secondary">Heuristic operational intelligence for claims processing</p>
      </div>

      {/* Executive Narrative Brief */}
      {narrative && (
        <div className="bg-bg-card rounded-lg border border-border-light p-6 mb-8">
          <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary">
            {formatNarrativeForUI(narrative)
              .split('\n')
              .map((line, idx) => {
                if (line.startsWith('🔴')) {
                  return (
                    <div key={idx} className="font-bold text-red-600 mb-2">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith('🟠')) {
                  return (
                    <div key={idx} className="font-bold text-orange-600 mb-2">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith('🟡')) {
                  return (
                    <div key={idx} className="font-bold text-yellow-600 mb-2">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith('🟢')) {
                  return (
                    <div key={idx} className="font-bold text-green-600 mb-2">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith('**')) {
                  return (
                    <div key={idx} className="font-bold text-text-primary mt-2 mb-1">
                      {line.replace(/\*\*/g, '')}
                    </div>
                  );
                }
                if (line.startsWith('-')) {
                  return (
                    <div key={idx} className="ml-4 mb-1">
                      {line}
                    </div>
                  );
                }
                if (line.startsWith('⚠️')) {
                  return (
                    <div key={idx} className="text-amber-700 italic mt-3 pt-3 border-t border-border-light">
                      {line}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="mb-2">
                    {line}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-card rounded-lg border border-border-light p-4 hover:border-accent-500 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-orange-500" />
            <span className="text-text-secondary text-sm font-medium">Alerts (24h)</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{snapshot.totals.alerts}</div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border-light p-4 hover:border-accent-500 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-blue-500" />
            <span className="text-text-secondary text-sm font-medium">Incidents (24h)</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{snapshot.totals.incidents}</div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border-light p-4 hover:border-accent-500 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-green-500" />
            <span className="text-text-secondary text-sm font-medium">Correlations (24h)</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{snapshot.totals.correlations}</div>
        </div>

        <div className={`rounded-lg border p-4 transition-colors ${getRiskBadgeColor(snapshot.totals.riskLabel)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} />
            <span className="text-sm font-medium">Risk Level</span>
          </div>
          <div className="text-2xl font-bold capitalize">{snapshot.totals.riskLabel}</div>
        </div>
      </div>

      {/* High Severity Alert */}
      {snapshot.totals.riskLabel === 'high' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 mb-1">High Risk Detected</h3>
              <p className="text-red-700 text-sm">
                One or more high-severity signals detected. Review operations dashboard and related features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signals Table */}
      <div className="bg-bg-card rounded-lg border border-border-light mb-8">
        <div className="p-6 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <TrendingUp size={20} className="text-accent-500" />
            Detected Signals
          </h2>
        </div>

        {snapshot.signals.length === 0 ? (
          <div className="p-6 text-center text-text-secondary">
            <CheckCircle size={24} className="mx-auto mb-2 text-green-600" />
            <p>No high-priority signals detected. Operations appear normal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary border-b border-border-light">
                <tr>
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
                  <tr key={idx} className="border-b border-border-light hover:bg-bg-secondary transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary capitalize">
                      {signal.key.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(signal.severity)}`}>
                        {getSeverityBadgeIcon(signal.severity)}
                        {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{signal.window}</td>
                    <td className="px-6 py-4 text-sm">
                      {signal.trend ? getTrendIcon(signal.trend) : <span className="text-text-secondary">–</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{signal.rationale}</td>
                    <td className="px-6 py-4 text-sm">
                      {signal.suggestedAction ? (
                        <span className="text-accent-600 font-medium cursor-pointer hover:text-accent-700">
                          {signal.suggestedAction}
                          <ArrowRight size={14} className="inline ml-1" />
                        </span>
                      ) : (
                        <span className="text-text-secondary">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warnings */}
      {snapshot.warnings && snapshot.warnings.length > 0 && (
        <div className="bg-bg-card rounded-lg border border-border-light mb-8">
          <div className="p-6 border-b border-border-light">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-600" />
              Data Quality Notes
            </h3>
          </div>
          <ul className="p-6 space-y-2">
            {snapshot.warnings.map((w, idx) => (
              <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Resources */}
      <div className="bg-bg-card rounded-lg border border-border-light mb-8">
        <div className="p-6 border-b border-border-light">
          <h3 className="font-bold text-text-primary">Related Resources</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/guardian/h06-intelligence-dashboard"
            className="p-4 rounded border border-border-light hover:bg-bg-secondary transition-colors"
          >
            <div className="text-sm font-medium text-accent-600 hover:text-accent-700">Intelligence Dashboard</div>
            <div className="text-xs text-text-secondary mt-1">View full analytics</div>
          </a>
          <a
            href="/guardian/h02-anomalies"
            className="p-4 rounded border border-border-light hover:bg-bg-secondary transition-colors"
          >
            <div className="text-sm font-medium text-accent-600 hover:text-accent-700">Anomalies</div>
            <div className="text-xs text-text-secondary mt-1">H02 detection signals</div>
          </a>
          <a
            href="/guardian/h04-triage"
            className="p-4 rounded border border-border-light hover:bg-bg-secondary transition-colors"
          >
            <div className="text-sm font-medium text-accent-600 hover:text-accent-700">Triage Queue</div>
            <div className="text-xs text-text-secondary mt-1">H04 pending items</div>
          </a>
          <a
            href="/guardian/h01-risk-scoring"
            className="p-4 rounded border border-border-light hover:bg-bg-secondary transition-colors"
          >
            <div className="text-sm font-medium text-accent-600 hover:text-accent-700">Risk Scoring</div>
            <div className="text-xs text-text-secondary mt-1">H01 score trends</div>
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>⚠️ Important Disclaimer:</strong> {snapshot.disclaimer}
        </p>
      </div>
    </div>
  );
}

// Lock icon fallback
const Lock = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
