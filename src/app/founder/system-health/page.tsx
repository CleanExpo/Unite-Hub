"use client";

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Shield,
  AlertTriangle,
  Bug,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SelfHealingJob {
  id: string;
  route: string;
  error_signature: string;
  error_category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  occurrences: number;
  ai_summary: string | null;
  ai_recommended_actions: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

interface SelfHealingPatch {
  id: string;
  job_id: string;
  patch_type: string;
  description: string;
  files_changed: string[];
  confidence_score: number;
  status: string;
  ai_diff_proposal: string | null;
  created_at: string;
}

interface HealthSummary {
  openJobs: number;
  criticalCount: number;
  highCount: number;
  pendingPatches: number;
  recentResolutions: number;
}

// ============================================
// SEVERITY CONFIG
// ============================================

const severityConfig = {
  CRITICAL: { color: 'bg-red-500', icon: AlertCircle, label: 'Critical' },
  HIGH: { color: 'bg-orange-500', icon: AlertTriangle, label: 'High' },
  MEDIUM: { color: 'bg-yellow-500', icon: Bug, label: 'Medium' },
  LOW: { color: 'bg-blue-500', icon: Zap, label: 'Low' },
};

const categoryLabels: Record<string, string> = {
  RLS_VIOLATION: 'RLS Violation',
  AUTH_FAILURE: 'Authentication Failure',
  SSR_HYDRATION: 'SSR Hydration Error',
  API_SCHEMA: 'API Schema Error',
  PERFORMANCE: 'Performance Issue',
  UI_BUG: 'UI Bug',
  REDIRECT_LOOP: 'Redirect Loop',
  DB_ERROR: 'Database Error',
  NETWORK_ERROR: 'Network Error',
  RATE_LIMIT: 'Rate Limit',
  UNKNOWN: 'Unknown',
};

// ============================================
// COMPONENT
// ============================================

export default function SystemHealthPage() {
  const [jobs, setJobs] = useState<SelfHealingJob[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobPatches, setJobPatches] = useState<Record<string, SelfHealingPatch[]>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/self-healing/jobs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load jobs');
      }

      const body = await res.json();
      setJobs(body.jobs || []);
      setSummary(body.summary || null);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch patches for a job
  const fetchPatches = async (jobId: string) => {
    try {
      const res = await fetch(`/api/self-healing/patches?jobId=${jobId}`);
      if (res.ok) {
        const body = await res.json();
        setJobPatches((prev) => ({ ...prev, [jobId]: body.patches || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch patches:', err);
    }
  };

  // Handle job expansion
  const toggleExpand = (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      if (!jobPatches[jobId]) {
        fetchPatches(jobId);
      }
    }
  };

  // Handle patch action
  const handlePatchAction = async (
    patchId: string,
    jobId: string,
    action: 'APPROVE' | 'REJECT' | 'APPLY_SANDBOX'
  ) => {
    try {
      setActionLoading(patchId);

      const res = await fetch('/api/self-healing/patches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchId, jobId, action }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to process action');
      }

      // Refresh jobs
      await fetchJobs();
      await fetchPatches(jobId);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Format time ago
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
return `${mins}m ago`;
}
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
return `${hours}h ago`;
}
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            System Health & Self-Healing
          </h1>
          <p className="text-sm text-muted-foreground">
            AI Phill monitors production, classifies errors, and proposes self-healing patches.
            You remain the final decision-maker.
          </p>
        </div>
        <Button onClick={fetchJobs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{summary.openJobs}</div>
              <p className="text-xs text-muted-foreground">Open Issues</p>
            </CardContent>
          </Card>
          <Card className={summary.criticalCount > 0 ? 'border-red-500' : ''}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{summary.criticalCount}</div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className={summary.highCount > 0 ? 'border-orange-500' : ''}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{summary.highCount}</div>
              <p className="text-xs text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{summary.pendingPatches}</div>
              <p className="text-xs text-muted-foreground">Pending Patches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{summary.recentResolutions}</div>
              <p className="text-xs text-muted-foreground">Resolved (7d)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading self-healing jobs...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium">System is Healthy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No open self-healing jobs. All systems operational.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const config = severityConfig[job.severity] || severityConfig.MEDIUM;
            const Icon = config.icon;
            const isExpanded = expandedJob === job.id;
            const patches = jobPatches[job.id] || [];

            return (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(job.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${config.color} text-white`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="secondary">
                          {categoryLabels[job.error_category] || job.error_category}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                          {job.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-mono">{job.route}</CardTitle>
                      <CardDescription>
                        {job.ai_summary || job.error_signature}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(job.last_seen_at)}
                        </div>
                        <div className="text-xs">
                          {job.occurrences}x occurrences
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/30">
                    <div className="space-y-4 pt-4">
                      {/* Recommended Actions */}
                      {job.ai_recommended_actions && (
                        <div className="bg-card rounded-lg p-4 border">
                          <h4 className="font-medium text-sm mb-2">AI Recommended Actions</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.ai_recommended_actions}
                          </p>
                        </div>
                      )}

                      {/* Patches */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Proposed Patches</h4>
                        {patches.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No patches proposed yet. AI Phill is analyzing the issue.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {patches.map((patch) => (
                              <div
                                key={patch.id}
                                className="bg-card rounded-lg p-4 border space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Badge variant="outline">{patch.patch_type}</Badge>
                                    <Badge
                                      variant={
                                        patch.confidence_score >= 0.8
                                          ? 'default'
                                          : patch.confidence_score >= 0.6
                                            ? 'secondary'
                                            : 'outline'
                                      }
                                      className="ml-2"
                                    >
                                      {Math.round(patch.confidence_score * 100)}% confidence
                                    </Badge>
                                  </div>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {patch.status}
                                  </Badge>
                                </div>
                                <p className="text-sm">{patch.description}</p>
                                {patch.files_changed.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Files: {patch.files_changed.join(', ')}
                                  </div>
                                )}
                                {patch.ai_diff_proposal && (
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {patch.ai_diff_proposal}
                                  </pre>
                                )}
                                {patch.status === 'PROPOSED' && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handlePatchAction(patch.id, job.id, 'APPROVE')
                                      }
                                      disabled={actionLoading === patch.id}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handlePatchAction(patch.id, job.id, 'APPLY_SANDBOX')
                                      }
                                      disabled={actionLoading === patch.id}
                                    >
                                      Test in Sandbox
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handlePatchAction(patch.id, job.id, 'REJECT')
                                      }
                                      disabled={actionLoading === patch.id}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pt-2 border-t">
                        <div>First seen: {new Date(job.first_seen_at).toLocaleString()}</div>
                        <div>Last seen: {new Date(job.last_seen_at).toLocaleString()}</div>
                        <div>Job ID: {job.id}</div>
                        <div>Signature: {job.error_signature.slice(0, 50)}...</div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        <p>
          Self-Healing Mode operates in Human-Governed Mode. No changes are applied to MAIN without
          your explicit approval.
        </p>
      </div>
    </div>
  );
}
