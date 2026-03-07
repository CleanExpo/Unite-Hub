'use client';

/**
 * Autonomous Monitoring Dashboard
 *
 * Real-time system health monitoring using internal infrastructure:
 * - Database-backed error tracking
 * - Performance metrics collection
 * - Automated health checks
 * - Email alerts (SendGrid/Gmail SMTP)
 * - No external dependencies
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  TrendingUp,
  RefreshCw,
  Database,
  Zap,
  Mail
} from 'lucide-react';

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  errorsByPriority: Record<string, number>;
  errorsBySeverity: Record<string, number>;
}

interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  lastCheckAt: string;
  uptime: string;
}

interface RecentError {
  id: string;
  created_at: string;
  severity: string;
  priority: string;
  error_type: string;
  message: string;
  route: string | null;
  resolved: boolean;
}

interface SlowRequest {
  id: string;
  created_at: string;
  metric_type: string;
  route: string | null;
  duration_ms: number;
  threshold_ms: number;
}

interface MonitoringData {
  errorStats: ErrorStats;
  systemHealth: SystemHealth;
  recentErrors: RecentError[];
  slowRequests: SlowRequest[];
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/dashboard');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch monitoring data');
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/20';
      case 'degraded':
      case 'warn':
        return 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20';
      case 'critical':
      case 'fail':
        return 'text-[#FF4444] bg-[#FF4444]/10 border-[#FF4444]/20';
      default:
        return 'text-white/50 bg-white/[0.02] border-white/[0.06]';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      P0_CRITICAL: 'bg-[#FF4444]/10 text-[#FF4444]',
      P1_HIGH: 'bg-[#FFB800]/10 text-[#FFB800]',
      P2_MEDIUM: 'bg-[#FFB800]/10 text-[#FFB800]',
      P3_LOW: 'bg-[#00F5FF]/10 text-[#00F5FF]',
      P4_TRIVIAL: 'bg-white/[0.04] text-white/50',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-medium ${colors[priority] || 'bg-white/[0.04] text-white/50'}`}>
        {priority.replace('_', ' ')}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      FATAL: 'bg-[#FF4444]/10 text-[#FF4444]',
      ERROR: 'bg-[#FFB800]/10 text-[#FFB800]',
      WARNING: 'bg-[#FFB800]/10 text-[#FFB800]',
      INFO: 'bg-[#00F5FF]/10 text-[#00F5FF]',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-medium ${colors[severity] || 'bg-white/[0.04] text-white/50'}`}>
        {severity}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00F5FF]" />
          <p className="text-white/50 font-mono">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-[#050505]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#050505]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white/90">Autonomous Monitoring</h1>
          <p className="text-white/50 mt-1">
            Self-contained system health tracking with database-backed logging
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-white/40 font-mono">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {data?.systemHealth && (
        <div className={`border-2 rounded-sm p-6 ${getStatusColor(data.systemHealth.overallStatus)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">System Health</h2>
              <p className="text-sm opacity-70">
                Last check: {new Date(data.systemHealth.lastCheckAt).toLocaleString()}
              </p>
            </div>

            {data.systemHealth.overallStatus === 'healthy' && (
              <CheckCircle className="h-12 w-12 text-[#00FF88]" />
            )}
            {data.systemHealth.overallStatus === 'degraded' && (
              <AlertCircle className="h-12 w-12 text-[#FFB800]" />
            )}
            {data.systemHealth.overallStatus === 'critical' && (
              <XCircle className="h-12 w-12 text-[#FF4444]" />
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#00FF88]">
                {data.systemHealth.passedChecks}
              </p>
              <p className="text-sm text-white/50">Passed</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-[#FF4444]">
                {data.systemHealth.failedChecks}
              </p>
              <p className="text-sm text-white/50">Failed</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-[#FFB800]">
                {data.systemHealth.warnings}
              </p>
              <p className="text-sm text-white/50">Warnings</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-[#00F5FF]">
                {data.systemHealth.uptime}
              </p>
              <p className="text-sm text-white/50">Uptime</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Statistics */}
      {data?.errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/50 mb-3">
              Total Errors
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-white/90">{data.errorStats.totalErrors}</p>
              <AlertCircle className="h-8 w-8 text-white/30" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/50 mb-3">
              Critical Errors
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-[#FF4444]">
                {data.errorStats.criticalErrors}
              </p>
              <XCircle className="h-8 w-8 text-[#FF4444]/40" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/50 mb-3">
              Resolved
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-[#00FF88]">
                {data.errorStats.resolvedErrors}
              </p>
              <CheckCircle className="h-8 w-8 text-[#00FF88]/40" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-sm font-medium text-white/50 mb-3">
              Unresolved
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-[#FFB800]">
                {data.errorStats.unresolvedErrors}
              </p>
              <Activity className="h-8 w-8 text-[#FFB800]/40" />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">
            <AlertCircle className="h-4 w-4 mr-2" />
            Recent Errors
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Slow Requests
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Recent Errors Tab */}
        <TabsContent value="errors">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="text-lg font-bold text-white/90 mb-1">Recent Errors (Last 24 Hours)</h3>
            <p className="text-sm text-white/40 mb-4">
              Most recent errors tracked in the autonomous monitoring system
            </p>

            {data?.recentErrors && data.recentErrors.length > 0 ? (
              <div className="space-y-4">
                {data.recentErrors.map((error) => (
                  <div
                    key={error.id}
                    className="p-4 border border-white/[0.06] rounded-sm hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(error.severity)}
                          {getPriorityBadge(error.priority)}
                          {error.resolved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-medium bg-[#00FF88]/10 text-[#00FF88]">Resolved</span>
                          )}
                        </div>

                        <p className="font-semibold text-white/90">{error.error_type}</p>
                        <p className="text-sm text-white/50">{error.message}</p>

                        <div className="flex items-center gap-4 text-xs text-white/30">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(error.created_at).toLocaleString()}
                          </div>

                          {error.route && (
                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {error.route}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/30">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-[#00FF88]" />
                <p>No errors in the last 24 hours</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Slow Requests Tab */}
        <TabsContent value="performance">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <h3 className="text-lg font-bold text-white/90 mb-1">Slow Requests (Last Hour)</h3>
            <p className="text-sm text-white/40 mb-4">
              Requests exceeding performance thresholds
            </p>

            {data?.slowRequests && data.slowRequests.length > 0 ? (
              <div className="space-y-4">
                {data.slowRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-white/[0.06] rounded-sm hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-medium bg-[#00F5FF]/10 text-[#00F5FF]">
                            {request.metric_type}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono border border-white/[0.06] text-white/50">
                            {request.duration_ms}ms (threshold: {request.threshold_ms}ms)
                          </span>
                        </div>

                        {request.route && (
                          <p className="text-sm font-medium text-white/90">{request.route}</p>
                        )}

                        <div className="flex items-center gap-1 text-xs text-white/30">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/30">
                <Zap className="h-12 w-12 mx-auto mb-2 text-[#00FF88]" />
                <p>No slow requests detected in the last hour</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Errors by Priority */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <h3 className="text-lg font-bold text-white/90 mb-4">Errors by Priority</h3>
              {data?.errorStats && (
                <div className="space-y-3">
                  {Object.entries(data.errorStats.errorsByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      {getPriorityBadge(priority)}
                      <span className="text-2xl font-bold text-white/90">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Errors by Severity */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <h3 className="text-lg font-bold text-white/90 mb-4">Errors by Severity</h3>
              {data?.errorStats && (
                <div className="space-y-3">
                  {Object.entries(data.errorStats.errorsBySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      {getSeverityBadge(severity)}
                      <span className="text-2xl font-bold text-white/90">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <h3 className="text-sm font-bold text-white/90 mb-3">Autonomous Monitoring System</h3>
        <div className="text-sm text-white/50 space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Database-backed error tracking with 30-day retention</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Automated health checks every 5 minutes via Vercel Cron</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email alerts for critical errors via SendGrid/Gmail SMTP</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>No external dependencies - fully self-contained system</span>
          </div>
        </div>
      </div>
    </div>
  );
}
