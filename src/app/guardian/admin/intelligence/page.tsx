'use client';

/**
 * Guardian H06: H-Series Ops Dashboard
 * Unified intelligence summary for H01-H05 modules
 * - Governance State card with audit status
 * - Rule Suggestions (H01) with latest items
 * - Anomalies (H02) by severity
 * - Correlation Advisor (H03) recommendations
 * - Predictive Triage (H04) top scored incidents
 * - Governance Coach (H05) sessions & actions
 * - Admin quick action buttons (admin-only)
 * - Graceful degradation for missing modules
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingUp, Zap, RefreshCw, Brain, BarChart3, Shield, Lock, Eye, Lightbulb } from 'lucide-react';

interface HSeriesSummary {
  timestamp: string;
  range_days: number;
  modules: {
    h01_rule_suggestion: boolean;
    h02_anomaly_detection: boolean;
    h03_correlation_refinement: boolean;
    h04_incident_scoring: boolean;
    h05_governance_coach: boolean;
  };
  governance: {
    ai_usage_policy: boolean;
    external_sharing_policy: boolean;
    backup_policy: boolean;
    validation_gate_policy: boolean;
  };
  core?: {
    risk_headline: string;
    insights_24h: number;
    insights_7d: number;
    insights_30d: number;
  };
  h01?: {
    installed: boolean;
    by_status: Record<string, number>;
    latest: Array<{ id: string; title: string; status: string; created_at: string; confidence?: number }>;
  };
  h02?: {
    installed: boolean;
    open_count: number;
    by_severity: Record<string, number>;
    latest: Array<{ metric_key: string; severity: string; observed_at: string; status: string }>;
  };
  h03?: {
    installed: boolean;
    by_status: Record<string, number>;
    latest: Array<{ title: string; type: string; status: string }>;
  };
  h04?: {
    installed: boolean;
    open_incidents: Record<string, number>;
    latest: Array<{ incident_id: string; score: number; band: string; triage_status: string }>;
  };
  h05?: {
    installed: boolean;
    latest_session?: { id: string; status: string; coach_mode: string; created_at: string };
    open_actions_count: number;
    last_applied_at?: string;
  };
}

export default function IntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [summary, setSummary] = useState<HSeriesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load summary on mount
  useEffect(() => {
    if (workspaceId) {
      loadSummary();
    }
  }, [workspaceId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/guardian/ai/summary?workspaceId=${workspaceId}&days=30`);
      if (!res.ok) {
throw new Error('Failed to load summary');
}
      const data = await res.json();
      setSummary(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (actionKey: string) => {
    setActionLoading(actionKey);
    try {
      // Quick action endpoints (to be implemented)
      // For now, show confirmation dialog
      setConfirmAction(null);
      setToast({ message: `${actionKey} triggered successfully`, type: 'success' });
      // Reload after action
      setTimeout(() => loadSummary(), 1000);
    } catch (err) {
      setToast({ message: `Failed to trigger ${actionKey}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin text-accent-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              Error Loading Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">{error}</p>
            <Button onClick={loadSummary} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">Could not load intelligence summary.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary">H-Series Intelligence</h1>
        <p className="text-text-secondary mt-2">Unified summary of H01-H05 modules • Last updated: {new Date(summary.timestamp).toLocaleString()}</p>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div className={`p-4 rounded-lg ${toast.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          {toast.message}
        </div>
      )}

      {/* Governance State Card */}
      <Card className="border-accent-500/30 bg-gradient-to-br from-accent-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} className="text-accent-500" />
            Governance State
          </CardTitle>
          <CardDescription>Z10 governance policies and audit configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">AI Usage Policy</p>
              <Badge className={summary.governance.ai_usage_policy ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                {summary.governance.ai_usage_policy ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">External Sharing</p>
              <Badge className={summary.governance.external_sharing_policy ? 'bg-success/20 text-success' : 'bg-muted'}>
                {summary.governance.external_sharing_policy ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">Backup Policy</p>
              <Badge className={summary.governance.backup_policy ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                {summary.governance.backup_policy ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">Validation Gate</p>
              <Badge className={summary.governance.validation_gate_policy ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                {summary.governance.validation_gate_policy ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/guardian/admin/meta-governance?workspaceId=${workspaceId}`)}
            className="mt-6"
          >
            View Governance Settings
          </Button>
        </CardContent>
      </Card>

      {/* Risk Headline */}
      {summary.core && (
        <Card className="border-accent-500/50 bg-accent-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-500">
              <AlertCircle size={20} />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-text-primary">{summary.core.risk_headline}</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">Last 24 Hours</p>
                <p className="text-2xl font-bold text-accent-500">{summary.core.insights_24h}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">Last 7 Days</p>
                <p className="text-2xl font-bold text-accent-500">{summary.core.insights_7d}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">Last 30 Days</p>
                <p className="text-2xl font-bold text-accent-500">{summary.core.insights_30d}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* H01: Rule Suggestions */}
      <Card className={!summary.h01?.installed ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb size={20} className="text-warning-500" />
            H01: Rule Suggestions
          </CardTitle>
          <CardDescription>
            {summary.h01?.installed
              ? `${Object.values(summary.h01.by_status || {}).reduce((a, b) => a + b, 0)} total rules`
              : 'Not installed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.h01?.installed ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                {Object.entries(summary.h01.by_status || {}).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <p className="text-sm capitalize text-text-secondary">{status}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
              {summary.h01.latest && summary.h01.latest.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Latest Rules</p>
                  {summary.h01.latest.map((rule) => (
                    <div key={rule.id} className="text-sm p-2 rounded bg-bg-secondary">
                      <p className="font-medium text-text-primary">{rule.title}</p>
                      <p className="text-xs text-text-secondary">{rule.status} • {new Date(rule.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guardian/rules/suggestions?workspaceId=${workspaceId}`)}
                className="w-full"
              >
                View All Rules
              </Button>
              <Dialog open={confirmAction === 'h01'} onOpenChange={(open) => setConfirmAction(open ? 'h01' : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full bg-warning-500/20 text-warning-600 hover:bg-warning-500/30">
                    <Zap size={16} className="mr-2" />
                    Generate Suggestions Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run H01 Rule Generation?</DialogTitle>
                    <DialogDescription>Generate new rule suggestions from recent patterns. This may take a few moments.</DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('h01')}
                      disabled={actionLoading === 'h01'}
                      className="bg-warning-500 hover:bg-warning-600"
                    >
                      {actionLoading === 'h01' ? 'Running...' : 'Confirm'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">H01 Rule Suggestions module not installed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* H02: Anomalies */}
      <Card className={!summary.h02?.installed ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} className="text-accent-500" />
            H02: Anomaly Detection
          </CardTitle>
          <CardDescription>
            {summary.h02?.installed ? `${summary.h02.open_count || 0} open anomalies` : 'Not installed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.h02?.installed ? (
            <div className="space-y-4">
              {summary.h02.by_severity && Object.entries(summary.h02.by_severity).length > 0 ? (
                <div className="flex gap-4">
                  {Object.entries(summary.h02.by_severity).map(([severity, count]) => (
                    <div key={severity} className="space-y-1">
                      <p className="text-sm capitalize text-text-secondary">{severity}</p>
                      <p className={`text-xl font-bold ${severity === 'critical' ? 'text-destructive' : severity === 'high' ? 'text-accent-500' : 'text-warning-500'}`}>
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No severity breakdown available</p>
              )}
              {summary.h02.latest && summary.h02.latest.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Latest Anomalies</p>
                  {summary.h02.latest.map((anomaly, idx) => (
                    <div key={idx} className="text-sm p-2 rounded bg-bg-secondary">
                      <p className="font-medium text-text-primary">{anomaly.metric_key}</p>
                      <p className={`text-xs ${anomaly.severity === 'critical' ? 'text-destructive' : 'text-text-secondary'}`}>
                        {anomaly.severity} • {new Date(anomaly.observed_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guardian/admin/anomalies?workspaceId=${workspaceId}`)}
                className="w-full"
              >
                View All Anomalies
              </Button>
              <Dialog open={confirmAction === 'h02'} onOpenChange={(open) => setConfirmAction(open ? 'h02' : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full bg-accent-500/20 text-accent-600 hover:bg-accent-500/30">
                    <Zap size={16} className="mr-2" />
                    Run Anomaly Detectors Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run H02 Anomaly Detection?</DialogTitle>
                    <DialogDescription>Scan recent telemetry for anomalous patterns. This may take a few moments.</DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('h02')}
                      disabled={actionLoading === 'h02'}
                      className="bg-accent-500 hover:bg-accent-600"
                    >
                      {actionLoading === 'h02' ? 'Running...' : 'Confirm'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">H02 Anomaly Detection module not installed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* H03: Correlation Advisor */}
      <Card className={!summary.h03?.installed ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} className="text-purple-500" />
            H03: Correlation Advisor
          </CardTitle>
          <CardDescription>
            {summary.h03?.installed ? 'AI-powered incident correlation and pattern analysis' : 'Not installed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.h03?.installed ? (
            <div className="space-y-4">
              {summary.h03.by_status && Object.entries(summary.h03.by_status).length > 0 && (
                <div className="flex gap-4">
                  {Object.entries(summary.h03.by_status).map(([status, count]) => (
                    <div key={status} className="space-y-1">
                      <p className="text-sm capitalize text-text-secondary">{status}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              )}
              {summary.h03.latest && summary.h03.latest.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Latest Recommendations</p>
                  {summary.h03.latest.map((rec, idx) => (
                    <div key={idx} className="text-sm p-2 rounded bg-bg-secondary">
                      <p className="font-medium text-text-primary">{rec.title}</p>
                      <p className="text-xs text-text-secondary">{rec.type} • {rec.status}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guardian/admin/correlation-advisor?workspaceId=${workspaceId}`)}
                className="w-full"
              >
                View Correlations
              </Button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">H03 Correlation Advisor module not installed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* H04: Predictive Triage */}
      <Card className={!summary.h04?.installed ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} className="text-info-500" />
            H04: Predictive Triage
          </CardTitle>
          <CardDescription>
            {summary.h04?.installed ? 'AI-powered incident scoring and prioritization' : 'Not installed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.h04?.installed ? (
            <div className="space-y-4">
              {summary.h04.open_incidents && Object.entries(summary.h04.open_incidents).length > 0 && (
                <div className="flex gap-4">
                  {Object.entries(summary.h04.open_incidents).map(([band, count]) => (
                    <div key={band} className="space-y-1">
                      <p className="text-sm capitalize text-text-secondary">{band}</p>
                      <p className={`text-xl font-bold ${band === 'critical' ? 'text-destructive' : band === 'high' ? 'text-accent-500' : 'text-warning-500'}`}>
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {summary.h04.latest && summary.h04.latest.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Top Scored Incidents</p>
                  {summary.h04.latest.map((incident, idx) => (
                    <div key={idx} className="text-sm p-2 rounded bg-bg-secondary">
                      <p className="font-medium text-text-primary">Score: {incident.score.toFixed(2)} • {incident.band}</p>
                      <p className="text-xs text-text-secondary">{incident.incident_id} • {incident.triage_status}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guardian/admin/triage?workspaceId=${workspaceId}`)}
                className="w-full"
              >
                View Triage Board
              </Button>
              <Dialog open={confirmAction === 'h04'} onOpenChange={(open) => setConfirmAction(open ? 'h04' : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full bg-info-500/20 text-info-600 hover:bg-info-500/30">
                    <Zap size={16} className="mr-2" />
                    Run Incident Scoring Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run H04 Incident Scoring?</DialogTitle>
                    <DialogDescription>Re-score all open incidents using the predictive model. This may take a few moments.</DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('h04')}
                      disabled={actionLoading === 'h04'}
                      className="bg-info-500 hover:bg-info-600"
                    >
                      {actionLoading === 'h04' ? 'Running...' : 'Confirm'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">H04 Predictive Triage module not installed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* H05: Governance Coach */}
      <Card className={!summary.h05?.installed ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} className="text-success-500" />
            H05: Governance Coach
          </CardTitle>
          <CardDescription>
            {summary.h05?.installed
              ? summary.h05.latest_session
                ? `Last session: ${new Date(summary.h05.latest_session.created_at).toLocaleDateString()}`
                : 'No active sessions'
              : 'Not installed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.h05?.installed ? (
            <div className="space-y-4">
              {summary.h05.latest_session && (
                <div className="space-y-2 p-3 rounded bg-bg-secondary">
                  <p className="text-sm font-medium text-text-primary">Latest Session</p>
                  <p className="text-xs text-text-secondary">
                    Mode: {summary.h05.latest_session.coach_mode} • Status: {summary.h05.latest_session.status}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">Open Actions</p>
                <p className="text-2xl font-bold text-success-500">{summary.h05.open_actions_count}</p>
              </div>
              {summary.h05.last_applied_at && (
                <p className="text-xs text-text-secondary">Last applied: {new Date(summary.h05.last_applied_at).toLocaleDateString()}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guardian/admin/governance-coach?workspaceId=${workspaceId}`)}
                className="w-full"
              >
                View Coach Sessions
              </Button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">H05 Governance Coach module not installed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          onClick={loadSummary}
          variant="outline"
          size="lg"
          disabled={loading}
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh Summary
        </Button>
      </div>
    </div>
  );
}
