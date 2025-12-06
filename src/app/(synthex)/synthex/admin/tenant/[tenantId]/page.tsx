'use client';

/**
 * Synthex Admin Tenant Detail
 * Tenant-specific health, metrics, and admin actions
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Users,
  Mail,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Play,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TenantHealthSnapshot {
  tenant_id: string;
  business_name: string;
  health_score: number;
  subscription_status: string | null;
  last_activity_at: string;
  issues: string[];
  recommendations: string[];
  metrics: {
    contacts: number;
    campaigns: number;
    emails_sent: number;
    ai_calls: number;
    team_members: number;
  };
}

interface PageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default function AdminTenantDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { tenantId } = resolvedParams;

  const [health, setHealth] = useState<TenantHealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
  }, [tenantId]);

  async function loadHealth() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/synthex/admin/tenants/${tenantId}/health`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch health snapshot');
      }
      const data = await res.json();
      setHealth(data.data);
    } catch (err) {
      console.error('[Admin Tenant Detail] Error loading health:', err);
      setError(err instanceof Error ? err.message : 'Failed to load health snapshot');
    } finally {
      setLoading(false);
    }
  }

  async function runHealthCheck() {
    setActionLoading(true);
    setActionResult(null);

    try {
      const res = await fetch(`/api/synthex/admin/tenants/${tenantId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_HEALTH_CHECK' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Health check failed');
      }

      setActionResult('Health check completed successfully');
      await loadHealth(); // Refresh data
    } catch (err) {
      setActionResult(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setActionLoading(false);
    }
  }

  function getHealthColor(score: number) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  function getHealthBg(score: number) {
    if (score >= 80) return 'bg-green-900/20 border-green-800';
    if (score >= 60) return 'bg-yellow-900/20 border-yellow-800';
    if (score >= 40) return 'bg-orange-900/20 border-orange-800';
    return 'bg-red-900/20 border-red-800';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <h1 className="text-3xl font-bold text-gray-100">{health.business_name}</h1>
          <p className="text-gray-400 mt-1">Tenant ID: {health.tenant_id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadHealth} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={runHealthCheck}
            variant="default"
            size="sm"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Health Check
          </Button>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <Alert className={actionResult.includes('success') ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}>
          <AlertDescription className="text-gray-100">
            {actionResult}
          </AlertDescription>
        </Alert>
      )}

      {/* Health Score Card */}
      <Card className={getHealthBg(health.health_score)}>
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getHealthColor(health.health_score)}`}>
              {health.health_score}
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    health.health_score >= 80
                      ? 'bg-green-500'
                      : health.health_score >= 60
                      ? 'bg-yellow-500'
                      : health.health_score >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${health.health_score}%` }}
                />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-gray-300">
                  {health.subscription_status || 'No subscription'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {health.metrics.contacts.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {health.metrics.campaigns.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {health.metrics.emails_sent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {health.metrics.ai_calls.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {health.metrics.team_members}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Issues Detected
            </CardTitle>
            <CardDescription>
              {health.issues.length === 0 ? 'No issues detected' : `${health.issues.length} issue(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {health.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>All systems healthy</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {health.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Recommendations
            </CardTitle>
            <CardDescription>
              {health.recommendations.length === 0 ? 'No recommendations' : `${health.recommendations.length} suggestion(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {health.recommendations.length === 0 ? (
              <p className="text-gray-400">No action needed at this time</p>
            ) : (
              <ul className="space-y-2">
                {health.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">
            Last activity:{' '}
            <span className="font-semibold text-gray-100">
              {new Date(health.last_activity_at).toLocaleString()}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
