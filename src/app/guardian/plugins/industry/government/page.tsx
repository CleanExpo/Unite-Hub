'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { deriveGovernmentSignals } from '@/lib/guardian/plugins/industry-government-regulatory/signalService';
import type { GovOversightSnapshot } from '@/lib/guardian/plugins/industry-government-regulatory/types';
import { generateNarrative, formatNarrativeForUI } from '@/lib/guardian/plugins/narrativeService';
import type { NarrativeResponse } from '@/lib/guardian/plugins/narrativeService';

/**
 * Government & Regulatory Oversight Dashboard
 * Displays heuristic governance and audit readiness signals
 * Read-only UI, aggregate-only data, no citizen/case/staff identifiers
 */
export default function GovernmentOversightPage({
  searchParams
}: {
  searchParams: Promise<{ workspaceId?: string; allowExternal?: string }>;
}) {
  const [snapshot, setSnapshot] = useState<GovOversightSnapshot | null>(null);
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
          alerts24h: 32,
          incidents24h: 8,
          correlations24h: 2,
          alerts30d: 250,
          incidents30d: 65,
          auditEnabled: true,
          aiAllowed: true,
          externalSharingPolicy: 'allowed_with_approval' as const,
          validationStatus: 'pass' as const,
          lastValidationAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          backupStatus: 'recent' as const,
          lastBackupAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          currentRiskLabel: 'low' as const,
          riskTrend: 'flat' as const,
          auditExportAvailable: true
        };

        // Derive signals
        const result = await deriveGovernmentSignals(aggregateData);

        // Generate AI narrative brief
        const narrativeResult = await generateNarrative({
          workspaceId: params.workspaceId || 'mock-workspace',
          pluginKey: 'industry_government_regulatory_pack',
          pluginName: 'Government & Regulatory Oversight',
          signals: result.signals,
          riskLabel: result.totals.riskLabel,
          totals: result.totals,
          allowExternal: external
        });

        setNarrative(narrativeResult);
        setSnapshot(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load oversight data');
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
    return trend === 'up' ? (
      <TrendingUp size={16} />
    ) : trend === 'down' ? (
      <TrendingDown size={16} />
    ) : null;
  };

  const getRiskLabelColor = (label: string) => {
    switch (label) {
      case 'high':
        return 'text-red-700 bg-red-50';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50';
      case 'low':
        return 'text-green-700 bg-green-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'warn':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'fail':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-bg-base p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-accent-500" />
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Government & Regulatory Oversight
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                  Governance readiness and audit posture signals
                </p>
              </div>
            </div>
            {!allowExternal && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium">
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
              Governance Summary
            </h2>
            {formatNarrativeForUI(narrative)}
          </div>
        )}

        {/* Governance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Audit Enabled */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">Audit Enabled</p>
              <FileCheck
                size={24}
                className={snapshot.governance.auditEnabled ? 'text-green-500' : 'text-gray-400'}
              />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {snapshot.governance.auditEnabled ? 'Yes' : 'No'}
            </p>
          </div>

          {/* AI Governance */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">AI Governed</p>
              <Shield
                size={24}
                className={snapshot.governance.aiAllowed ? 'text-blue-500' : 'text-gray-400'}
              />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {snapshot.governance.aiAllowed ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          {/* Validation Status */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">Validation</p>
              {getStatusIcon(snapshot.governance.validationStatus)}
            </div>
            <p className="text-2xl font-bold text-text-primary capitalize">
              {snapshot.governance.validationStatus}
            </p>
            {snapshot.governance.lastValidationAt && (
              <p className="text-xs text-text-secondary mt-2">
                {new Date(snapshot.governance.lastValidationAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* External Sharing Policy */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">Data Sharing</p>
              <Shield size={24} className="text-purple-500" />
            </div>
            <p className="text-sm font-bold text-text-primary capitalize">
              {snapshot.governance.externalSharingPolicy.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Backup Status */}
          {snapshot.governance.backupStatus && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-secondary text-sm font-medium">Backups</p>
                <Clock
                  size={24}
                  className={snapshot.governance.backupStatus === 'recent' ? 'text-green-500' : 'text-orange-500'}
                />
              </div>
              <p className="text-sm font-bold text-text-primary capitalize">
                {snapshot.governance.backupStatus}
              </p>
            </div>
          )}

          {/* Audit Export */}
          <div className="bg-bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm font-medium">Audit Export</p>
              <FileCheck
                size={24}
                className={snapshot.governance.auditExportAvailable ? 'text-green-500' : 'text-gray-400'}
              />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {snapshot.governance.auditExportAvailable ? 'Available' : 'Not Available'}
            </p>
          </div>
        </div>

        {/* Oversight Signals Table */}
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Governance Signals</h2>
          </div>

          {snapshot.signals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Signal</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Window
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Rationale
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.signals.map((signal, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border hover:bg-bg-secondary transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-text-primary capitalize">
                        {signal.key.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getSeverityColor(signal.severity)} font-medium`}
                        >
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
              <p>No critical signals detected. Governance posture appears healthy.</p>
            </div>
          )}
        </div>

        {/* Warnings Section */}
        {snapshot.warnings && snapshot.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Feature Availability Notices
            </h3>
            <ul className="space-y-2">
              {snapshot.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-amber-700">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transparency Score (Informational) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Governance Transparency Score</h3>
              <p className="text-sm text-blue-700 mb-3">
                {snapshot.signals.find((s) => s.key === 'transparency_score')?.count}% - Composite score
                based on availability of validation systems, audit capabilities, governance controls, and
                backup readiness. <strong>Informational only; not a compliance metric.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Disclaimer */}
        <div className="text-center text-text-secondary text-xs py-4 border-t border-border">
          <p className="max-w-3xl mx-auto">{snapshot.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
