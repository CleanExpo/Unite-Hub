/**
 * Agent Performance Dashboard
 * Real-time visibility into agent health, costs, and performance
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AgentHealth {
  agent_name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'disabled';
  success_rate_24h: number;
  avg_execution_time_24h: number;
  error_rate_24h: number;
  cost_24h_usd: number;
  consecutive_failures: number;
  last_success_at: string | null;
  total_executions_24h: number;
}

interface DashboardData {
  agents: AgentHealth[];
  summary: {
    total_agents: number;
    healthy_count: number;
    degraded_count: number;
    critical_count: number;
    total_cost_24h_usd: number;
    total_executions_24h: number;
    overall_success_rate: number;
  };
}

export default function AgentsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const workspaceId = 'demo-workspace'; // TODO: Get from auth context

  const loadData = async () => {
    try {
      const res = await fetch(`/api/agents/health?workspaceId=${workspaceId}`);
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error('Failed to load agent health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetch(`/api/agents/health/refresh?workspaceId=${workspaceId}`, { method: 'POST' });
    await loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'disabled':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'critical':
        return '🚨';
      case 'disabled':
        return '⏸️';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading agent health data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Agent Performance</h1>
          <p className="text-text-secondary mt-1">Real-time health monitoring and optimization</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border-subtle bg-bg-card">
          <div className="text-text-secondary text-sm font-medium">Total Agents</div>
          <div className="text-3xl font-bold text-text-primary mt-2">{data.summary.total_agents}</div>
          <div className="flex gap-2 mt-3">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              {data.summary.healthy_count} healthy
            </Badge>
            {data.summary.degraded_count > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                {data.summary.degraded_count} degraded
              </Badge>
            )}
            {data.summary.critical_count > 0 && (
              <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                {data.summary.critical_count} critical
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-bg-card">
          <div className="text-text-secondary text-sm font-medium">24h Executions</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            {data.summary.total_executions_24h.toLocaleString()}
          </div>
          <div className="text-sm text-text-secondary mt-3">
            {(data.summary.total_executions_24h / 24).toFixed(0)} per hour avg
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-bg-card">
          <div className="text-text-secondary text-sm font-medium">Success Rate</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            {data.summary.overall_success_rate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 mt-3">
            {data.summary.overall_success_rate >= 95 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Excellent</span>
              </>
            ) : data.summary.overall_success_rate >= 85 ? (
              <>
                <Minus className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Good</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Needs attention</span>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-bg-card">
          <div className="text-text-secondary text-sm font-medium">24h AI Spend</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            ${data.summary.total_cost_24h_usd.toFixed(2)}
          </div>
          <div className="text-sm text-text-secondary mt-3">
            ${(data.summary.total_cost_24h_usd * 30).toFixed(2)} monthly projection
          </div>
        </Card>
      </div>

      {/* Agent Health Cards */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-text-primary">Agent Status</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.agents.map((agent) => (
            <Card key={agent.agent_name} className="p-5 border-border-subtle bg-bg-card hover:border-accent-500/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.agent_name}</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {agent.total_executions_24h} executions (24h)
                  </p>
                </div>
                <Badge className={getStatusColor(agent.status)}>
                  {getStatusIcon(agent.status)} {agent.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-text-secondary">Success Rate</div>
                  <div className="font-semibold text-text-primary mt-1">
                    {agent.success_rate_24h.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Avg Time</div>
                  <div className="font-semibold text-text-primary mt-1">
                    {agent.avg_execution_time_24h}ms
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Error Rate</div>
                  <div className="font-semibold text-text-primary mt-1">
                    {agent.error_rate_24h.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">24h Cost</div>
                  <div className="font-semibold text-text-primary mt-1">
                    ${agent.cost_24h_usd.toFixed(2)}
                  </div>
                </div>
              </div>

              {agent.consecutive_failures > 0 && (
                <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                  ⚠️ {agent.consecutive_failures} consecutive failures
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => window.location.href = `/agents/${agent.agent_name}`}
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-text-secondary border-t border-border-subtle pt-4">
        <p>Auto-refreshes every 30 seconds. Health checks run every 5 minutes.</p>
        <p className="mt-1">
          Part of <strong>Project Vend Phase 2</strong>: Agent Optimization Framework
        </p>
      </div>
    </div>
  );
}
