/**
 * Agent Detail Page
 * Detailed metrics, violations, and escalations for a specific agent
 *
 * Part of Project Vend Phase 2
 */

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface AgentDetail {
  health: any;
  metrics: any;
  violations: any[];
  escalations: any[];
}

export default function AgentDetailPage({ params }: { params: Promise<{ agentName: string }> }) {
  const { agentName } = use(params);
  const [data, setData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const workspaceId = 'demo-workspace'; // TODO: Get from auth context

  useEffect(() => {
    const loadData = async () => {
      try {
        const [healthRes, metricsRes, violationsRes] = await Promise.all([
          fetch(`/api/agents/health?workspaceId=${workspaceId}&agentName=${agentName}`),
          fetch(`/api/agents/metrics?workspaceId=${workspaceId}&agentName=${agentName}`),
          fetch(`/api/agents/violations?workspaceId=${workspaceId}&agentName=${agentName}`)
        ]);

        const [health, metrics, violations] = await Promise.all([
          healthRes.json(),
          metricsRes.json(),
          violationsRes.json()
        ]);

        setData({
          health: health.data,
          metrics: metrics.data.metrics,
          violations: violations.data.violations || [],
          escalations: []
        });
      } catch (err) {
        console.error('Failed to load agent details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [agentName, workspaceId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-bg-subtle rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{agentName}</h1>
          <p className="text-text-secondary mt-1">Detailed performance metrics</p>
        </div>
      </div>

      {/* Health Overview */}
      <Card className="p-6 border-border-subtle bg-bg-card">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Health Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-text-secondary text-sm">Status</div>
            <Badge className={`mt-2`}>
              {data.health.status}
            </Badge>
          </div>
          <div>
            <div className="text-text-secondary text-sm">Success Rate (24h)</div>
            <div className="text-2xl font-bold text-text-primary mt-2">
              {data.health.success_rate_24h?.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm">Avg Execution Time</div>
            <div className="text-2xl font-bold text-text-primary mt-2">
              {data.health.avg_execution_time_24h}ms
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm">24h Cost</div>
            <div className="text-2xl font-bold text-text-primary mt-2">
              ${data.health.cost_24h_usd?.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6 border-border-subtle bg-bg-card">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-text-secondary text-sm">Total Executions</div>
            <div className="text-xl font-semibold text-text-primary mt-1">
              {data.metrics.total_executions}
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm">Error Rate</div>
            <div className="text-xl font-semibold text-text-primary mt-1">
              {data.metrics.error_rate?.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Violations */}
      {data.violations.length > 0 && (
        <Card className="p-6 border-border-subtle bg-bg-card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Violations</h2>
          <div className="space-y-2">
            {data.violations.slice(0, 10).map((violation: any, idx: number) => (
              <div key={idx} className="p-3 bg-bg-subtle rounded border border-border-subtle">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">{violation.violation_type}</div>
                    <div className="text-sm text-text-secondary mt-1">
                      {JSON.stringify(violation.attempted_action)}
                    </div>
                  </div>
                  <Badge className="ml-2">{violation.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
