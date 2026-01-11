'use client';

/**
 * Unite Stress Test Console
 * Phase: D71 - Unite System Stress-Test Engine
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Play,
  Pause,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface StressProfile {
  id: string;
  name: string;
  description?: string;
  target_system: string;
  load_pattern: {
    type: 'constant' | 'ramp' | 'spike';
    requests_per_second: number;
  };
  duration_seconds: number;
  concurrent_users: number;
  ramp_up_seconds?: number;
  tenant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StressRun {
  id: string;
  profile_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  metrics?: {
    requests_total: number;
    requests_per_second: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    error_rate: number;
  };
  errors?: {
    total_errors: number;
    error_types: Array<{
      type: string;
      count: number;
      sample: string;
    }>;
  };
  ai_summary?: string;
  ai_insights?: {
    bottlenecks: string[];
    recommendations: string[];
    severity: 'low' | 'medium' | 'high';
  };
  tenant_id?: string;
  created_at: string;
}

export default function StressTestsPage() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'runs' | 'results'>('profiles');
  const [profiles, setProfiles] = useState<StressProfile[]>([]);
  const [runs, setRuns] = useState<StressRun[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StressProfile | null>(null);
  const [selectedRun, setSelectedRun] = useState<StressRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'profiles') {
      fetchProfiles();
    } else if (activeTab === 'runs') {
      fetchRuns();
    }
  }, [activeTab]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/stress/profiles?limit=100');
      const data = await response.json();
      if (response.ok) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/stress/run?limit=100');
      const data = await response.json();
      if (response.ok) {
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runStressTest = async (profileId: string) => {
    try {
      const response = await fetch('/api/unite/stress/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          profile_id: profileId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedRun(data.run);
        setActiveTab('results');
        fetchRuns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityColor = (severity?: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-500/10 text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[severity || 'low'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      cancelled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };
    return colors[status] || colors.pending;
  };

  // Summary stats
  const totalProfiles = profiles.length;
  const activeProfiles = profiles.filter((p) => p.is_active).length;
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Activity className="w-10 h-10 text-accent-500" />
            Unite Stress Test Engine
          </h1>
          <p className="text-text-secondary">
            Controlled load testing with AI-powered result analysis
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Test Profiles</span>
              <Zap className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalProfiles}</div>
            <div className="text-xs text-text-tertiary mt-1">{activeProfiles} active</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Test Runs</span>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalRuns}</div>
            <div className="text-xs text-text-tertiary mt-1">{completedRuns} completed</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Avg Latency</span>
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {selectedRun?.metrics?.avg_latency_ms || 0}
              <span className="text-sm text-text-tertiary ml-1">ms</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {selectedRun ? 'selected run' : 'select a run'}
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Error Rate</span>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {selectedRun?.metrics
                ? (selectedRun.metrics.error_rate * 100).toFixed(2)
                : '0.00'}
              <span className="text-sm text-text-tertiary ml-1">%</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {selectedRun ? 'selected run' : 'select a run'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'profiles', label: 'Test Profiles', icon: Zap },
            { key: 'runs', label: 'Test Runs', icon: Activity },
            { key: 'results', label: 'Results & Insights', icon: TrendingUp },
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

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading profiles...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Zap className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No stress test profiles found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-4 bg-bg-card rounded-lg border ${
                      profile.is_active
                        ? 'border-border-primary'
                        : 'border-border-primary opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{profile.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {profile.target_system}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {profile.load_pattern.type}
                          </span>
                        </div>
                        {profile.description && (
                          <p className="text-sm text-text-secondary mb-2">
                            {profile.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-text-tertiary">
                          <span>
                            <Users className="w-3 h-3 inline mr-1" />
                            {profile.concurrent_users} users
                          </span>
                          <span>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {profile.duration_seconds}s
                          </span>
                          <span>
                            <Zap className="w-3 h-3 inline mr-1" />
                            {profile.load_pattern.requests_per_second} req/s
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runStressTest(profile.id)}
                        className="bg-accent-500 hover:bg-accent-600"
                        disabled={!profile.is_active}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading test runs...</div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No test runs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getStatusColor(
                      run.status
                    )} cursor-pointer hover:border-accent-500/50`}
                    onClick={() => {
                      setSelectedRun(run);
                      setActiveTab('results');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">
                            Run {run.id.slice(0, 8)}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {run.status}
                          </span>
                        </div>
                        {run.metrics && (
                          <div className="flex gap-4 text-xs text-text-tertiary">
                            <span>
                              Requests: {run.metrics.requests_total.toLocaleString()}
                            </span>
                            <span>Avg Latency: {run.metrics.avg_latency_ms}ms</span>
                            <span>
                              Error Rate: {(run.metrics.error_rate * 100).toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {run.ai_insights && (
                        <div
                          className={`px-3 py-1 text-xs rounded border ${getSeverityColor(
                            run.ai_insights.severity
                          )}`}
                        >
                          {run.ai_insights.severity}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {!selectedRun ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">Select a test run to view results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metrics */}
                {selectedRun.metrics && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Total Requests</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {selectedRun.metrics.requests_total.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">RPS</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {selectedRun.metrics.requests_per_second}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Avg Latency</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {selectedRun.metrics.avg_latency_ms}
                          <span className="text-sm text-text-tertiary ml-1">ms</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">P95 Latency</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {selectedRun.metrics.p95_latency_ms}
                          <span className="text-sm text-text-tertiary ml-1">ms</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">P99 Latency</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {selectedRun.metrics.p99_latency_ms}
                          <span className="text-sm text-text-tertiary ml-1">ms</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Error Rate</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {(selectedRun.metrics.error_rate * 100).toFixed(2)}
                          <span className="text-sm text-text-tertiary ml-1">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {selectedRun.ai_summary && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-medium text-text-primary mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent-500" />
                      AI Summary
                    </h3>
                    <p className="text-text-secondary">{selectedRun.ai_summary}</p>
                  </div>
                )}

                {/* AI Insights */}
                {selectedRun.ai_insights && (
                  <>
                    {selectedRun.ai_insights.bottlenecks.length > 0 && (
                      <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                        <h3 className="text-lg font-medium text-text-primary mb-3">
                          Bottlenecks Detected
                        </h3>
                        <ul className="space-y-2">
                          {selectedRun.ai_insights.bottlenecks.map((bottleneck, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                              <span className="text-text-secondary text-sm">{bottleneck}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedRun.ai_insights.recommendations.length > 0 && (
                      <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                        <h3 className="text-lg font-medium text-text-primary mb-3">
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {selectedRun.ai_insights.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2" />
                              <span className="text-text-secondary text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Errors */}
                {selectedRun.errors && selectedRun.errors.total_errors > 0 && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-medium text-text-primary mb-3">
                      Errors ({selectedRun.errors.total_errors})
                    </h3>
                    <div className="space-y-2">
                      {selectedRun.errors.error_types.map((errorType, index) => (
                        <div
                          key={index}
                          className="p-3 bg-bg-tertiary rounded border border-border-primary"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-text-primary text-sm">
                              {errorType.type}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {errorType.count} occurrences
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">{errorType.sample}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
