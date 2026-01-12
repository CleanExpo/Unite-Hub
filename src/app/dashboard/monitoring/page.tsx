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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        return 'text-success-600 bg-success-50 border-success-200';
      case 'degraded':
      case 'warn':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'critical':
      case 'fail':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-text-secondary bg-bg-hover border-border-medium';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      P0_CRITICAL: 'bg-error-600 text-text-primary',
      P1_HIGH: 'bg-accent-600 text-text-primary',
      P2_MEDIUM: 'bg-warning-600 text-text-primary',
      P3_LOW: 'bg-info-600 text-text-primary',
      P4_TRIVIAL: 'bg-bg-subtle text-text-primary',
    };

    return (
      <Badge className={colors[priority] || 'bg-bg-subtle text-text-primary'}>
        {priority.replace('_', ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      FATAL: 'bg-error-600 text-text-primary',
      ERROR: 'bg-accent-600 text-text-primary',
      WARNING: 'bg-warning-600 text-text-primary',
      INFO: 'bg-info-600 text-text-primary',
    };

    return (
      <Badge className={colors[severity] || 'bg-bg-subtle text-text-primary'}>
        {severity}
      </Badge>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-info-600" />
          <p className="text-text-secondary">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Autonomous Monitoring</h1>
          <p className="text-text-secondary mt-1">
            Self-contained system health tracking with database-backed logging
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-text-secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button onClick={fetchData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {data?.systemHealth && (
        <Card className={`border-2 ${getStatusColor(data.systemHealth.overallStatus)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">System Health</CardTitle>
                <CardDescription>
                  Last check: {new Date(data.systemHealth.lastCheckAt).toLocaleString()}
                </CardDescription>
              </div>

              {data.systemHealth.overallStatus === 'healthy' && (
                <CheckCircle className="h-12 w-12 text-success-600" />
              )}
              {data.systemHealth.overallStatus === 'degraded' && (
                <AlertCircle className="h-12 w-12 text-warning-600" />
              )}
              {data.systemHealth.overallStatus === 'critical' && (
                <XCircle className="h-12 w-12 text-error-600" />
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-success-600">
                  {data.systemHealth.passedChecks}
                </p>
                <p className="text-sm text-text-secondary">Passed</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-error-600">
                  {data.systemHealth.failedChecks}
                </p>
                <p className="text-sm text-text-secondary">Failed</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-warning-600">
                  {data.systemHealth.warnings}
                </p>
                <p className="text-sm text-text-secondary">Warnings</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-info-600">
                  {data.systemHealth.uptime}
                </p>
                <p className="text-sm text-text-secondary">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Statistics */}
      {data?.errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-text-primary">{data.errorStats.totalErrors}</p>
                <AlertCircle className="h-8 w-8 text-text-muted" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Critical Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-error-600">
                  {data.errorStats.criticalErrors}
                </p>
                <XCircle className="h-8 w-8 text-error-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-success-600">
                  {data.errorStats.resolvedErrors}
                </p>
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Unresolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-accent-600">
                  {data.errorStats.unresolvedErrors}
                </p>
                <Activity className="h-8 w-8 text-accent-400" />
              </div>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors (Last 24 Hours)</CardTitle>
              <CardDescription>
                Most recent errors tracked in the autonomous monitoring system
              </CardDescription>
            </CardHeader>

            <CardContent>
              {data?.recentErrors && data.recentErrors.length > 0 ? (
                <div className="space-y-4">
                  {data.recentErrors.map((error) => (
                    <div
                      key={error.id}
                      className="p-4 border rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(error.severity)}
                            {getPriorityBadge(error.priority)}
                            {error.resolved && (
                              <Badge className="bg-success-600 text-text-primary">Resolved</Badge>
                            )}
                          </div>

                          <p className="font-semibold text-text-primary">{error.error_type}</p>
                          <p className="text-sm text-text-secondary">{error.message}</p>

                          <div className="flex items-center gap-4 text-xs text-text-muted">
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
                <div className="text-center py-8 text-text-muted">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success-500" />
                  <p>No errors in the last 24 hours</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slow Requests Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Slow Requests (Last Hour)</CardTitle>
              <CardDescription>
                Requests exceeding performance thresholds
              </CardDescription>
            </CardHeader>

            <CardContent>
              {data?.slowRequests && data.slowRequests.length > 0 ? (
                <div className="space-y-4">
                  {data.slowRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-info-600 text-text-primary">
                              {request.metric_type}
                            </Badge>
                            <Badge variant="outline">
                              {request.duration_ms}ms (threshold: {request.threshold_ms}ms)
                            </Badge>
                          </div>

                          {request.route && (
                            <p className="text-sm font-medium text-text-primary">{request.route}</p>
                          )}

                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Zap className="h-12 w-12 mx-auto mb-2 text-success-500" />
                  <p>No slow requests detected in the last hour</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Errors by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.errorStats && (
                  <div className="space-y-3">
                    {Object.entries(data.errorStats.errorsByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        {getPriorityBadge(priority)}
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Errors by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.errorStats && (
                  <div className="space-y-3">
                    {Object.entries(data.errorStats.errorsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        {getSeverityBadge(severity)}
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Autonomous Monitoring System</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary space-y-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
