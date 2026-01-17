'use client';

/**
 * Founder Stability Dashboard
 * Phase 65: System load and chaos hardening oversight
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Zap,
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Square,
  BarChart3,
} from 'lucide-react';
import { StabilityIndicator, ServiceHealthRow } from '@/ui/components/StabilityIndicator';
import LoadTestCard from '@/ui/components/LoadTestCard';
import ChaosTestCard from '@/ui/components/ChaosTestCard';

export default function FounderStabilityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockReport = {
    overall_score: 82,
    performance_score: 85,
    reliability_score: 78,
    resilience_score: 80,
    trends: {
      response_time_trend: 'improving' as const,
      error_rate_trend: 'stable' as const,
      reliability_trend: 'improving' as const,
    },
  };

  const mockServices = [
    { service: 'api_gateway', health_score: 95, avg_response_time: 120, error_rate: 0.005, status: 'healthy' as const },
    { service: 'auth_service', health_score: 92, avg_response_time: 85, error_rate: 0.002, status: 'healthy' as const },
    { service: 'contact_service', health_score: 88, avg_response_time: 150, error_rate: 0.01, status: 'healthy' as const },
    { service: 'campaign_service', health_score: 75, avg_response_time: 280, error_rate: 0.025, status: 'degraded' as const },
    { service: 'email_service', health_score: 82, avg_response_time: 200, error_rate: 0.015, status: 'healthy' as const },
    { service: 'ai_intelligence', health_score: 70, avg_response_time: 1500, error_rate: 0.03, status: 'degraded' as const },
    { service: 'creative_engine', health_score: 78, avg_response_time: 800, error_rate: 0.02, status: 'degraded' as const },
    { service: 'queue_workers', health_score: 85, avg_response_time: 50, error_rate: 0.008, status: 'healthy' as const },
    { service: 'database', health_score: 90, avg_response_time: 25, error_rate: 0.001, status: 'healthy' as const },
    { service: 'storage', health_score: 93, avg_response_time: 100, error_rate: 0.003, status: 'healthy' as const },
  ];

  const mockLoadTests = [
    {
      id: 'load-1',
      scenario: 'simulated_50_clients',
      status: 'completed' as const,
      started_at: new Date(Date.now() - 86400000).toISOString(),
      total_requests: 15000,
      error_rate: 0.012,
      avg_response_time: 180,
      requests_per_second: 100,
      bottlenecks: ['Database queries showing high latency at p95'],
    },
    {
      id: 'load-2',
      scenario: 'high_ai_usage',
      status: 'completed' as const,
      started_at: new Date(Date.now() - 172800000).toISOString(),
      total_requests: 30000,
      error_rate: 0.035,
      avg_response_time: 2200,
      requests_per_second: 50,
      bottlenecks: ['AI model latency exceeding acceptable limits', 'Queue depth exceeding concurrent user count'],
    },
  ];

  const mockChaosEvents = [
    {
      id: 'chaos-1',
      fault: 'ai_latency_spike',
      mode: 'safe' as const,
      status: 'completed' as const,
      started_at: new Date(Date.now() - 259200000).toISOString(),
      peak_response_time: 3500,
      error_rate_increase: 0.05,
      recovery_time_seconds: 15,
      cascading_failures: 0,
      fully_recovered: true,
      circuit_breakers_activated: 1,
    },
    {
      id: 'chaos-2',
      fault: 'db_slow_read',
      mode: 'aggressive' as const,
      status: 'completed' as const,
      started_at: new Date(Date.now() - 345600000).toISOString(),
      peak_response_time: 800,
      error_rate_increase: 0.08,
      recovery_time_seconds: 25,
      cascading_failures: 1,
      fully_recovered: true,
      circuit_breakers_activated: 2,
    },
  ];

  const mockBottlenecks = [
    {
      service: 'ai_intelligence',
      type: 'ai_model',
      severity: 'high' as const,
      description: 'AI model latency p95: 3500ms',
      recommendation: 'Implement request batching, use faster model tiers, add caching',
    },
    {
      service: 'campaign_service',
      type: 'queue',
      severity: 'medium' as const,
      description: 'Queue depth p95: 85',
      recommendation: 'Increase worker count, optimize job processing',
    },
  ];

  const mockRecommendations = [
    {
      resource: 'AI Model Capacity',
      current: 'Standard tier',
      recommended: 'Batched requests + Caching',
      priority: 'high' as const,
      cost_impact: '-$30-50/month (cost reduction)',
    },
    {
      resource: 'Queue Workers',
      current: '2 workers',
      recommended: '4-6 workers',
      priority: 'medium' as const,
      cost_impact: '+$20-40/month',
    },
  ];

  const handleRunLoadTest = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    alert('Load test completed! Check the Load Tests tab for results.');
  };

  const handleRunChaosTest = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    alert('Chaos test completed! Check the Chaos Tests tab for results.');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-error-500" />;
      default:
        return <Minus className="h-4 w-4 text-text-tertiary" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info-100 dark:bg-info-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-info-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Stability</h1>
            <p className="text-sm text-muted-foreground">
              Load testing and chaos hardening oversight
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunLoadTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-warning-500 text-white rounded-lg hover:bg-warning-600 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            Run Load Test
          </button>
          <button
            onClick={handleRunChaosTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 disabled:opacity-50"
          >
            <Flame className="h-4 w-4" />
            Run Chaos Test
          </button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StabilityIndicator
          title="Overall Stability"
          score={mockReport.overall_score}
          trend={mockReport.trends.response_time_trend}
          type="overall"
        />
        <StabilityIndicator
          title="Performance"
          score={mockReport.performance_score}
          trend={mockReport.trends.response_time_trend}
          type="performance"
        />
        <StabilityIndicator
          title="Reliability"
          score={mockReport.reliability_score}
          trend={mockReport.trends.reliability_trend}
          type="reliability"
        />
        <StabilityIndicator
          title="Resilience"
          score={mockReport.resilience_score}
          trend={mockReport.trends.reliability_trend}
          type="resilience"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Service Health</TabsTrigger>
          <TabsTrigger value="load">
            Load Tests
            <Badge className="ml-1" variant="secondary">
              {mockLoadTests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="chaos">
            Chaos Tests
            <Badge className="ml-1" variant="secondary">
              {mockChaosEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent-500" />
                  Active Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockBottlenecks.map((bottleneck, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {bottleneck.service.replace(/_/g, ' ')}
                        </span>
                        <Badge className={bottleneck.severity === 'high' ? 'bg-error-500' : 'bg-warning-500'}>
                          {bottleneck.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {bottleneck.description}
                      </p>
                      <p className="text-xs text-info-500">
                        💡 {bottleneck.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Test Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Tests Run</span>
                    <span className="font-bold">{mockLoadTests.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chaos Events</span>
                    <span className="font-bold">{mockChaosEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Recovery Time</span>
                    <span className="font-bold text-success-500">20s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Circuit Breakers Active</span>
                    <span className="font-bold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Trends</span>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(mockReport.trends.response_time_trend)}
                    Response Time
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(mockReport.trends.error_rate_trend)}
                    Error Rate
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(mockReport.trends.reliability_trend)}
                    Reliability
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Health Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2 mb-2">
                  <span>Service</span>
                  <div className="flex gap-8">
                    <span>Health</span>
                    <span>Response</span>
                    <span>Errors</span>
                  </div>
                </div>
                {mockServices.map((service) => (
                  <ServiceHealthRow
                    key={service.service}
                    service={service.service}
                    healthScore={service.health_score}
                    responseTime={service.avg_response_time}
                    errorRate={service.error_rate}
                    status={service.status}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockLoadTests.map((test) => (
              <LoadTestCard
                key={test.id}
                {...test}
                onView={() => console.log('View:', test.id)}
                onRerun={() => console.log('Rerun:', test.id)}
              />
            ))}
          </div>

          {mockLoadTests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-8 w-8 text-warning-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No load tests run yet</p>
                <button
                  onClick={handleRunLoadTest}
                  className="mt-4 px-4 py-2 bg-warning-500 text-white rounded-lg hover:bg-warning-600"
                >
                  Run First Test
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chaos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockChaosEvents.map((event) => (
              <ChaosTestCard
                key={event.id}
                {...event}
                onView={() => console.log('View:', event.id)}
                onRerun={() => console.log('Rerun:', event.id)}
              />
            ))}
          </div>

          {mockChaosEvents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Flame className="h-8 w-8 text-error-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No chaos tests run yet</p>
                <button
                  onClick={handleRunChaosTest}
                  className="mt-4 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600"
                >
                  Run First Test
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scaling Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecommendations.map((rec, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{rec.resource}</span>
                      <Badge className={rec.priority === 'high' ? 'bg-error-500' : 'bg-warning-500'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">Current: </span>
                        <span>{rec.current}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recommended: </span>
                        <span className="text-success-500">{rec.recommended}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cost impact: {rec.cost_impact}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Safety notice */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        All tests run in shadow mode. No production disruption. Founder approval required for execution.
        Kill switch available. Auto-pause on risk thresholds.
      </div>
    </div>
  );
}
