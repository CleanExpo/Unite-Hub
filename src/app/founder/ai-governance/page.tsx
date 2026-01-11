'use client';

/**
 * AI Governance Dashboard
 * Phase: D63 - AI Governance, Policy & Audit Center
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Activity, TrendingUp, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface AIPolicy {
  id: string;
  policy_key: string;
  name: string;
  description?: string;
  category: string;
  enforcement_level: string;
  is_active: boolean;
}

interface AIUsageLog {
  id: string;
  model_name: string;
  provider: string;
  operation: string;
  total_cost?: number;
  status: string;
  occurred_at: string;
}

interface AIViolation {
  id: string;
  violation_type: string;
  severity: string;
  description?: string;
  resolution_status: string;
  detected_at: string;
}

export default function AIGovernancePage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'usage' | 'violations' | 'review'>('policies');
  const [policies, setPolicies] = useState<AIPolicy[]>([]);
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);
  const [violations, setViolations] = useState<AIViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (activeTab === 'policies') fetchPolicies();
    else if (activeTab === 'usage') fetchUsageLogs();
    else if (activeTab === 'violations') fetchViolations();
  }, [activeTab]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/ai/policies?limit=50');
      const data = await response.json();
      if (response.ok) {
        setPolicies(data.policies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/ai/logs?limit=100');
      const data = await response.json();
      if (response.ok) {
        setUsageLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/ai/violations?resolution_status=open&limit=50');
      const data = await response.json();
      if (response.ok) {
        setViolations(data.violations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setReviewing(true);
      const response = await fetch('/api/unite/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'full' }),
      });
      const data = await response.json();
      if (response.ok) {
        setReviewData(data.review);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getEnforcementColor = (level: string) => {
    const colors: Record<string, string> = {
      blocking: 'text-red-400',
      warning: 'text-yellow-400',
      logging: 'text-blue-400',
    };
    return colors[level] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Shield className="w-10 h-10 text-accent-500" />
              AI Governance
            </h1>
            <p className="text-text-secondary">Policy enforcement, usage tracking, and compliance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'policies', label: 'Policies', icon: Shield },
            { key: 'usage', label: 'Usage Logs', icon: Activity },
            { key: 'violations', label: 'Violations', icon: AlertTriangle },
            { key: 'review', label: 'AI Review', icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Shield className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No policies configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="p-5 bg-bg-card rounded-lg border border-border-primary hover:border-accent-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{policy.name}</h3>
                        <p className="text-sm text-text-tertiary mt-1">{policy.category}</p>
                      </div>
                      {policy.is_active ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    {policy.description && (
                      <p className="text-sm text-text-secondary mb-3">{policy.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${getEnforcementColor(policy.enforcement_level)}`}>
                        {policy.enforcement_level}
                      </span>
                      <span className="text-text-tertiary">{policy.policy_key}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Usage Logs Tab */}
        {activeTab === 'usage' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading usage logs...</div>
            ) : usageLogs.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No usage logs recorded</p>
              </div>
            ) : (
              <div className="bg-bg-card rounded-lg border border-border-primary overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Model</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Provider</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Operation</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Cost</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageLogs.map((log) => (
                      <tr key={log.id} className="border-t border-border-secondary">
                        <td className="px-4 py-3 text-sm text-text-primary">{log.model_name}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{log.provider}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{log.operation}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          ${(log.total_cost || 0).toFixed(4)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              log.status === 'success'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-tertiary">
                          {new Date(log.occurred_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading violations...</div>
            ) : violations.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <p className="text-text-secondary">No open violations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="p-5 bg-bg-card rounded-lg border border-border-primary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(violation.severity)}`} />
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {violation.violation_type}
                          </h3>
                          {violation.description && (
                            <p className="text-sm text-text-secondary mt-1">{violation.description}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs rounded ${getSeverityColor(violation.severity)} text-white`}
                      >
                        {violation.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>Status: {violation.resolution_status}</span>
                      <span>{new Date(violation.detected_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Review Tab */}
        {activeTab === 'review' && (
          <div>
            <div className="mb-6 text-center">
              <Button
                onClick={handleReview}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                disabled={reviewing}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {reviewing ? 'Reviewing...' : 'Run AI Compliance Review'}
              </Button>
            </div>

            {reviewData && (
              <div className="space-y-6">
                {/* Compliance Score */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary text-center">
                  <div className="text-sm text-text-secondary mb-2">Compliance Score</div>
                  <div className="text-5xl font-bold text-accent-500 mb-2">
                    {reviewData.compliance_score}
                    <span className="text-2xl text-text-tertiary">/100</span>
                  </div>
                  <TrendingUp className="w-6 h-6 mx-auto text-green-400" />
                </div>

                {/* Findings */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Findings</h3>
                  <div className="space-y-3">
                    {reviewData.findings.map((finding: any, idx: number) => (
                      <div key={idx} className="p-4 bg-bg-tertiary rounded border border-border-secondary">
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(finding.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-text-primary">{finding.category}</span>
                              <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(finding.severity)} text-white`}>
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary">{finding.issue}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {reviewData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
