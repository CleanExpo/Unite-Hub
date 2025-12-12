'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Plus, Settings, Zap } from 'lucide-react';

interface SuccessOverview {
  readiness: {
    overall_score: number;
    band: string;
    last_computed_at?: string;
  };
  editions: Array<{
    key: string;
    label: string;
    fit_score: number;
    fit_status: string;
  }>;
  uplift: {
    active_plans: number;
    tasks_done: number;
    tasks_total: number;
    completion_percentage: number;
  };
  adoption: {
    dimensions: Array<{
      dimension: string;
      status: string;
      score: number;
    }>;
    overall_status: string;
  };
  executive: {
    reports_last_90d: number;
    last_report_date?: string;
  };
  as_of: string;
}

interface Integration {
  id: string;
  integration_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  scopes: string[];
  last_synced_at?: string;
  webhook_stats: {
    total_events: number;
    pending: number;
    delivered: number;
    failed: number;
    events_last_24h: number;
  };
}

interface IntegrationsList {
  integrations: Integration[];
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [overview, setOverview] = useState<SuccessOverview | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!workspaceId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch overview
        const overviewRes = await fetch(
          `/api/guardian/meta/success/overview?workspaceId=${workspaceId}`
        );
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data.data);
        }

        // Fetch integrations
        const integrationsRes = await fetch(
          `/api/guardian/meta/integrations?workspaceId=${workspaceId}`
        );
        if (integrationsRes.ok) {
          const data = await integrationsRes.json();
          setIntegrations(data.data.integrations || []);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceId]);

  const handleTestWebhook = async (integrationId?: string) => {
    if (!workspaceId) return;

    try {
      setTesting(true);
      const url = integrationId
        ? `/api/guardian/meta/integrations/test?workspaceId=${workspaceId}&integrationId=${integrationId}`
        : `/api/guardian/meta/integrations/test?workspaceId=${workspaceId}`;

      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Test failed');

      const data = await res.json();
      alert(`✅ ${data.data.test_events_created} test event(s) queued for delivery`);

      // Refresh integrations to see new stats
      const integrationsRes = await fetch(
        `/api/guardian/meta/integrations?workspaceId=${workspaceId}`
      );
      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.data.integrations || []);
      }
    } catch (err) {
      alert(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async (integration: Integration) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/guardian/meta/integrations?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ id: integration.id, is_enabled: !integration.is_enabled }],
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setIntegrations(
        integrations.map((i) => (i.id === integration.id ? data.data.updated[0] : i))
      );
    } catch (err) {
      alert(`❌ Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading integrations and success data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations & Success Toolkit</h1>
          <p className="text-gray-600 mt-2">
            Configure external integrations for Guardian meta data, view customer success metrics, and manage webhook
            delivery to BI/CS tools.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Overview Section */}
        {overview && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Guardian Success Overview (CS-Friendly Summary)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Readiness */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-2">READINESS SCORE</p>
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-blue-900">{overview.readiness.overall_score}</p>
                    <p className="text-xs text-blue-700">{overview.readiness.band || 'Unknown'}</p>
                  </div>
                  {overview.readiness.last_computed_at && (
                    <p className="text-xs text-blue-600">
                      {new Date(overview.readiness.last_computed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Adoption Overall */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-2">ADOPTION STATUS</p>
                  <p className="text-2xl font-bold text-green-900 capitalize">{overview.adoption.overall_status}</p>
                  <p className="text-xs text-green-700 mt-2">{overview.adoption.dimensions.length} dimensions tracked</p>
                </div>

                {/* Uplift */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-2">UPLIFT PROGRESS</p>
                  <p className="text-2xl font-bold text-purple-900">{overview.uplift.completion_percentage}%</p>
                  <p className="text-xs text-purple-700">
                    {overview.uplift.tasks_done}/{overview.uplift.tasks_total} tasks
                  </p>
                </div>

                {/* Editions */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold mb-2">BEST FIT EDITION</p>
                  {overview.editions.length > 0 && (
                    <>
                      <p className="text-lg font-bold text-amber-900">{overview.editions[0].label}</p>
                      <p className="text-xs text-amber-700">Score: {overview.editions[0].fit_score}</p>
                    </>
                  )}
                  {overview.editions.length === 0 && <p className="text-xs text-amber-700">No edition fit data</p>}
                </div>

                {/* Reports */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                  <p className="text-xs text-indigo-700 font-semibold mb-2">EXEC REPORTS (90D)</p>
                  <p className="text-2xl font-bold text-indigo-900">{overview.executive.reports_last_90d}</p>
                  <p className="text-xs text-indigo-700">Generated reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integrations Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meta Integrations</CardTitle>
            <Button className="bg-accent-500 hover:bg-accent-600 text-white" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Integration
            </Button>
          </CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No integrations configured yet.</p>
                <p className="text-sm text-gray-500">
                  Create an integration to send Guardian Z-series meta events to external BI/CS tools.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{integration.label}</h3>
                          <Badge variant="outline" className="text-xs">
                            {integration.integration_key}
                          </Badge>
                          {integration.is_enabled ? (
                            <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {integration.scopes.map((scope) => (
                            <Badge key={scope} className="bg-blue-50 text-blue-700 text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Webhook Stats */}
                      <div className="text-right ml-4">
                        <div className="text-sm mb-2">
                          <p className="text-xs text-gray-600">
                            {integration.webhook_stats.delivered} delivered
                          </p>
                          {integration.webhook_stats.pending > 0 && (
                            <p className="text-xs text-amber-600">
                              {integration.webhook_stats.pending} pending
                            </p>
                          )}
                          {integration.webhook_stats.failed > 0 && (
                            <p className="text-xs text-red-600">
                              {integration.webhook_stats.failed} failed
                            </p>
                          )}
                          {integration.webhook_stats.events_last_24h > 0 && (
                            <p className="text-xs text-green-600">
                              {integration.webhook_stats.events_last_24h} last 24h
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(integration)}
                        className="text-xs"
                      >
                        {integration.is_enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(integration.id)}
                        disabled={testing || !integration.is_enabled}
                        className="text-xs"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Test Webhook
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Edit Config
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Test All Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => handleTestWebhook()}
                    disabled={testing}
                    className="text-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {testing ? 'Testing...' : 'Test All Integrations'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-300 rounded-lg p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Z07 Meta Integrations</h3>
            <p className="text-sm text-blue-800">
              These integrations expose <strong>Z-series metadata only</strong> (readiness, uplift, adoption, reports,
              editions, lifecycle). Core Guardian data (alerts, incidents, rules, network intelligence) is never exposed
              and Guardian runtime behaviour is never modified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
