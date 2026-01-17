'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Info } from 'lucide-react';
import type { GuardianMetaStackReadiness } from '@/lib/guardian/meta/metaStackReadinessService';
import type { GuardianMetaFeatureFlags } from '@/lib/guardian/meta/metaGovernanceService';
import type { GuardianMetaGovernancePrefs } from '@/lib/guardian/meta/metaGovernanceService';

interface AuditEntry {
  id: string;
  actor: string;
  source: string;
  action: string;
  summary: string;
  created_at: string;
}

export default function MetaGovernancePage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [readiness, setReadiness] = useState<GuardianMetaStackReadiness | null>(null);
  const [flags, setFlags] = useState<GuardianMetaFeatureFlags | null>(null);
  const [prefs, setPrefs] = useState<GuardianMetaGovernancePrefs | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  const loadData = async () => {
    if (!workspaceId) return;

    try {
      const [readinessRes, flagsRes, prefsRes, auditRes, adviceRes] = await Promise.all([
        fetch(`/api/guardian/meta/stack-readiness?workspaceId=${workspaceId}`),
        fetch(`/api/guardian/meta/governance/flags?workspaceId=${workspaceId}`),
        fetch(`/api/guardian/meta/governance/prefs?workspaceId=${workspaceId}`),
        fetch(`/api/guardian/meta/audit?workspaceId=${workspaceId}&limit=20`),
        fetch(`/api/guardian/meta/governance/advice?workspaceId=${workspaceId}`),
      ]);

      const [readinessData, flagsData, prefsData, auditData, adviceData] = await Promise.all([
        readinessRes.json(),
        flagsRes.json(),
        prefsRes.json(),
        auditRes.json(),
        adviceRes.json(),
      ]);

      setReadiness(readinessData.readiness);
      setFlags(flagsData.flags);
      setPrefs(prefsData.prefs);
      setAuditLog(auditData.events || []);
      setAdvice(adviceData.advice);
    } catch (error) {
      console.error('Failed to load meta governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!workspaceId) return;
    setValidationLoading(true);
    try {
      const res = await fetch(`/api/guardian/meta/z-series/validate?workspaceId=${workspaceId}`);
      const data = await res.json();
      setValidation(data.validation);
    } catch (error) {
      console.error('Failed to run validation:', error);
    } finally {
      setValidationLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />;
      case 'not_configured':
        return <XCircle className="w-4 h-4 text-error-600" />;
      default:
        return null;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'recommended':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'limited':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'experimental':
        return 'bg-error-100 text-error-800 border-error-300';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-text-secondary">Loading Meta Governance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-500" />
            <h1 className="text-3xl font-bold text-text-primary">Meta Governance & Release Gate</h1>
          </div>
          <Button
            onClick={() => {
              setRefreshing(true);
              loadData();
              setTimeout(() => setRefreshing(false), 1000);
            }}
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-text-secondary">
          Governance oversight for Z01-Z09 meta stack. Advisory-only gates and AI policy controls.
        </p>
      </div>

      {/* Meta Stack Readiness Card */}
      {readiness && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Meta Stack Readiness</CardTitle>
            <p className="text-xs text-text-secondary mt-1">
              Z01-Z09 component configuration status and advisory overall readiness
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Status Badge */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-2">Overall Status</p>
              <Badge className={`text-lg px-4 py-2 ${getOverallStatusColor(readiness.overallStatus)}`}>
                {readiness.overallStatus.toUpperCase()}
              </Badge>
              <p className="text-xs text-text-secondary mt-2">
                {readiness.readyCount} of {readiness.components.length} components ready
              </p>
            </div>

            {/* Components Grid */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Z-Series Components</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {readiness.components.map((comp) => (
                  <div
                    key={comp.key}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded border border-border"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(comp.status)}
                      <div>
                        <p className="font-medium text-text-primary text-sm">{comp.label}</p>
                        {comp.notes && <p className="text-xs text-text-secondary">{comp.notes}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {comp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockers, Warnings, Recommendations */}
            {readiness.blockers.length > 0 && (
              <div className="p-3 bg-error-50 border border-error-200 rounded">
                <p className="font-semibold text-error-800 text-sm mb-2">Blockers</p>
                <ul className="list-disc list-inside text-xs text-error-700 space-y-1">
                  {readiness.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {readiness.warnings.length > 0 && (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded">
                <p className="font-semibold text-warning-800 text-sm mb-2">Warnings</p>
                <ul className="list-disc list-inside text-xs text-warning-700 space-y-1">
                  {readiness.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {readiness.recommendations.length > 0 && (
              <div className="p-3 bg-info-50 border border-info-200 rounded">
                <p className="font-semibold text-info-800 text-sm mb-2">Recommendations</p>
                <ul className="list-disc list-inside text-xs text-info-700 space-y-1">
                  {readiness.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Z-Series Validation Gate Card */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-text-primary">Z-Series Validation Gate</CardTitle>
              <p className="text-xs text-text-secondary mt-1">
                Production readiness check for Guardian Z01-Z15 meta stack
              </p>
            </div>
            <Button onClick={runValidation} disabled={validationLoading} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 ${validationLoading ? 'animate-spin' : ''}`} />
              {validationLoading ? 'Running...' : 'Run Validation'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation ? (
            <>
              {/* Overall Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-text-primary">Overall Status</p>
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      validation.overallStatus === 'pass'
                        ? 'bg-success-100 text-success-800 border-success-300'
                        : validation.overallStatus === 'warn'
                        ? 'bg-warning-100 text-warning-800 border-warning-300'
                        : 'bg-error-100 text-error-800 border-error-300'
                    }`}
                  >
                    {validation.overallStatus === 'pass'
                      ? '✅ PASS'
                      : validation.overallStatus === 'warn'
                      ? '⚠️ WARNINGS'
                      : '❌ FAILURES'}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  {validation.summary.passed} passed · {validation.summary.warnings} warnings ·{' '}
                  {validation.summary.failed} failures
                </p>
              </div>

              {/* Recommendations */}
              {validation.recommendations.length > 0 && (
                <div className="p-3 bg-info-50 border border-info-200 rounded">
                  <p className="font-semibold text-info-800 text-sm mb-2">Recommendations</p>
                  <ul className="list-disc list-inside text-xs text-info-700 space-y-1">
                    {validation.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checks Grid */}
              <div>
                <p className="text-sm font-semibold text-text-primary mb-3">Detailed Checks</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validation.checks.map((check: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded border ${
                        check.status === 'pass'
                          ? 'bg-success-50 border-success-200'
                          : check.status === 'warn'
                          ? 'bg-warning-50 border-warning-200'
                          : 'bg-error-50 border-error-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-text-primary">{check.name}</p>
                          <p className={`text-xs mt-1 ${
                            check.status === 'pass'
                              ? 'text-success-700'
                              : check.status === 'warn'
                              ? 'text-warning-700'
                              : 'text-error-700'
                          }`}>
                            {check.message}
                          </p>
                          {check.remediation && (
                            <p className="text-xs text-text-secondary mt-2 italic">
                              💡 {check.remediation}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            check.status === 'pass'
                              ? 'default'
                              : check.status === 'warn'
                              ? 'outline'
                              : 'destructive'
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-text-secondary">
                Last validated: {new Date(validation.timestamp).toLocaleString()}
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary mb-4">
                Click "Run Validation" to check Z-series production readiness
              </p>
              <Button onClick={runValidation} disabled={validationLoading} variant="default" size="sm">
                Start Validation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Governance Settings Card */}
      {prefs && flags && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Governance Settings</CardTitle>
            <p className="text-xs text-text-secondary mt-1">Risk posture, AI policy, and feature flags</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Governance Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-bg-secondary rounded border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-1">Risk Posture</p>
                <Badge variant="outline">{prefs.riskPosture}</Badge>
              </div>
              <div className="p-3 bg-bg-secondary rounded border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-1">AI Usage Policy</p>
                <Badge variant="outline">{prefs.aiUsagePolicy}</Badge>
              </div>
              <div className="p-3 bg-bg-secondary rounded border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-1">External Sharing</p>
                <Badge variant="outline">{prefs.externalSharingPolicy}</Badge>
              </div>
            </div>

            {/* Feature Flags */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">AI Helper Flags</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded text-sm">
                  <span className="text-text-primary">Z AI Hints</span>
                  <Badge variant={flags.enableZAiHints ? 'default' : 'outline'}>
                    {flags.enableZAiHints ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded text-sm">
                  <span className="text-text-primary">Z Success Narrative</span>
                  <Badge variant={flags.enableZSuccessNarrative ? 'default' : 'outline'}>
                    {flags.enableZSuccessNarrative ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded text-sm">
                  <span className="text-text-primary">Z Playbook AI</span>
                  <Badge variant={flags.enableZPlaybookAi ? 'default' : 'outline'}>
                    {flags.enableZPlaybookAi ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded text-sm">
                  <span className="text-text-primary">Z Lifecycle AI</span>
                  <Badge variant={flags.enableZLifecycleAi ? 'default' : 'outline'}>
                    {flags.enableZLifecycleAi ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded text-sm">
                  <span className="text-text-primary">Z Goals AI</span>
                  <Badge variant={flags.enableZGoalsAi ? 'default' : 'outline'}>
                    {flags.enableZGoalsAi ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary italic">
              <Info className="w-3 h-3 inline mr-1" />
              Settings management coming soon. Use API routes to update flags and preferences.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Governance Advisor Card */}
      {advice && (
        <Card className="bg-bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">AI Governance Advisor</CardTitle>
            <p className="text-xs text-text-secondary mt-1">Advisory recommendations for Z-series rollout</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-accent-50 border-accent-200 rounded">
              <p className="font-semibold text-accent-900 text-sm">{advice.headline}</p>
            </div>

            {advice.recommendations && advice.recommendations.length > 0 && (
              <div>
                <p className="font-semibold text-text-primary text-sm mb-2">Recommendations</p>
                <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                  {advice.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {advice.cautions && advice.cautions.length > 0 && (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded">
                <p className="font-semibold text-warning-800 text-sm mb-2">Cautions</p>
                <ul className="list-disc list-inside text-xs text-warning-700 space-y-1">
                  {advice.cautions.map((caution: string, i: number) => (
                    <li key={i}>{caution}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Log Card */}
      <Card className="bg-bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Recent Configuration Changes</CardTitle>
          <p className="text-xs text-text-secondary mt-1">PII-free audit trail of Z01-Z09 changes</p>
        </CardHeader>
        <CardContent>
          {auditLog.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="p-3 bg-bg-secondary rounded border border-border text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{entry.summary}</p>
                      <p className="text-text-secondary mt-1">
                        {entry.actor} · {entry.source} · {entry.action}
                      </p>
                    </div>
                    <span className="text-text-secondary whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic text-center py-4">No audit entries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
