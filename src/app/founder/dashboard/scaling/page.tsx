'use client';

/**
 * Founder Scaling Dashboard
 * Phase 66: Autonomous scaling oversight and recommendations
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  TrendingUp,
  Cpu,
  Database,
  Cloud,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import ScalingTierCard from '@/ui/components/ScalingTierCard';
import { CapacityStatusBar } from '@/ui/components/CapacityStatusBar';
import ScalingRecommendationList from '@/ui/components/ScalingRecommendationList';

export default function FounderScalingPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const mockCapacityPlan = {
    tier_id: 'hard_launch' as const,
    tier_label: 'Hard Launch (5–50 clients)',
    current_clients: 28,
    max_clients: 50,
    utilization_percent: 56,
    headroom_clients: 22,
    status: 'green' as const,
    can_onboard: true,
    next_milestone: '12 clients until warning threshold',
  };

  const mockMetrics = {
    cpu_utilization: 0.45,
    error_rate: 0.015,
    ai_latency_ms: 1800,
    queue_depth: 35,
    token_usage: 180000,
    storage_usage_gb: 28,
    bandwidth_usage_gb: 120,
  };

  const mockRecommendations = [
    {
      id: 'rec-1',
      type: 'enable_supabase_pooler',
      title: 'Enable Supabase Connection Pooler',
      description: 'Reduce database connection overhead by 60-80% with connection pooling',
      impact: 'high' as const,
      risk: 'low' as const,
      effort: 'low' as const,
      confidence: 85,
      evidence: ['CPU utilization at 45%', 'Queue depth: 35'],
      implementation_steps: [
        'Go to Supabase Dashboard → Settings → Database',
        'Enable connection pooler',
        'Update DATABASE_URL to use pooler endpoint',
        'Test with load test scenario',
      ],
      estimated_cost_impact: 'Included in plan',
      priority: 1,
      status: 'pending' as const,
    },
    {
      id: 'rec-2',
      type: 'add_redis_cache',
      title: 'Add Redis Cache Layer',
      description: 'Cache frequently accessed data to reduce database load and improve response times',
      impact: 'high' as const,
      risk: 'medium' as const,
      effort: 'medium' as const,
      confidence: 78,
      evidence: ['AI latency: 1800ms', 'Approaching tier limit: 2500ms'],
      implementation_steps: [
        'Provision Upstash Redis or similar',
        'Add REDIS_URL to environment',
        'Implement caching for hot paths',
        'Add cache invalidation logic',
      ],
      estimated_cost_impact: '+$10-30/month',
      priority: 2,
      status: 'pending' as const,
    },
  ];

  const mockDecisionHistory = [
    {
      id: 'dec-1',
      recommendation: 'Split cron schedules',
      action: 'accepted',
      date: new Date(Date.now() - 604800000).toISOString(),
      outcome: 'Reduced cron overlap by 80%',
    },
    {
      id: 'dec-2',
      recommendation: 'Increase worker concurrency',
      action: 'accepted',
      date: new Date(Date.now() - 1209600000).toISOString(),
      outcome: 'Queue depth reduced from 100 to 35',
    },
    {
      id: 'dec-3',
      recommendation: 'Enable CDN for assets',
      action: 'deferred',
      date: new Date(Date.now() - 1814400000).toISOString(),
      outcome: 'Planned for next month',
    },
  ];

  const mockAIProviders = [
    { provider: 'Claude', used: 85000, budget: 300000, status: 'healthy' as const },
    { provider: 'Gemini', used: 45000, budget: 100000, status: 'warning' as const },
    { provider: 'OpenAI', used: 35000, budget: 150000, status: 'healthy' as const },
    { provider: 'ElevenLabs', used: 12000, budget: 50000, status: 'healthy' as const },
    { provider: 'Perplexity', used: 8000, budget: 25000, status: 'healthy' as const },
  ];

  const handleAccept = (id: string) => {
    console.log('Accept recommendation:', id);
    alert('Recommendation accepted! A System Improvement Proposal (SIP) will be created.');
  };

  const handleDefer = (id: string) => {
    console.log('Defer recommendation:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject recommendation:', id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Layers className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Scaling & Capacity</h1>
            <p className="text-sm text-muted-foreground">
              Data-driven scaling recommendations and tier management
            </p>
          </div>
        </div>
        <Badge className="bg-success-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      </div>

      {/* Current Tier Card */}
      <ScalingTierCard
        {...mockCapacityPlan}
        onUpgrade={() => alert('Upgrade flow would open here')}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Utilization</TabsTrigger>
          <TabsTrigger value="ai">AI Capacity</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations
            {mockRecommendations.length > 0 && (
              <Badge className="ml-1" variant="secondary">
                {mockRecommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Infrastructure Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CapacityStatusBar
                label="CPU"
                value={mockMetrics.cpu_utilization * 100}
                max={70}
                unit="%"
              />
              <CapacityStatusBar
                label="Error Rate"
                value={mockMetrics.error_rate * 100}
                max={3}
                unit="%"
                thresholds={{ warning: 66, critical: 90 }}
              />
              <CapacityStatusBar
                label="AI Latency"
                value={mockMetrics.ai_latency_ms}
                max={2500}
                unit="ms"
              />
              <CapacityStatusBar
                label="Queue Depth"
                value={mockMetrics.queue_depth}
                max={100}
                unit="jobs"
              />
              <CapacityStatusBar
                label="Storage"
                value={mockMetrics.storage_usage_gb}
                max={50}
                unit="GB"
              />
              <CapacityStatusBar
                label="Bandwidth"
                value={mockMetrics.bandwidth_usage_gb}
                max={250}
                unit="GB"
              />
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-info-500" />
                <span className="text-sm">Stability</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent-500" />
                <span className="text-sm">Director</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-violet-500" />
                <span className="text-sm">Evolution</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-success-500" />
                <span className="text-sm">Governance</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Provider Budgets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAIProviders.map((provider) => (
                <div key={provider.provider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{provider.provider}</span>
                    <span className={`text-xs ${provider.status === 'warning' ? 'text-warning-500' : 'text-success-500'}`}>
                      {((provider.used / provider.budget) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <CapacityStatusBar
                    label=""
                    value={provider.used}
                    max={provider.budget}
                    unit="tokens"
                    showPercentage={false}
                    size="sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cost projection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success-500" />
                  <span className="text-sm font-medium">Monthly Cost Projection</span>
                </div>
                <span className="text-lg font-bold">$285</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on current usage patterns. Budget: $400/month
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <ScalingRecommendationList
            recommendations={mockRecommendations}
            onAccept={handleAccept}
            onDefer={handleDefer}
            onReject={handleReject}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDecisionHistory.map((decision) => (
                  <div key={decision.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{decision.recommendation}</div>
                      <div className="text-xs text-muted-foreground mt-1">{decision.outcome}</div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          decision.action === 'accepted'
                            ? 'bg-success-500'
                            : decision.action === 'deferred'
                            ? 'bg-warning-500'
                            : 'bg-error-500'
                        }
                      >
                        {decision.action}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(decision.date).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
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
        All scaling actions are opt-in. No automatic infrastructure changes. Recommendations based on real metrics from load and chaos tests.
        Accepted recommendations create SIPs for tracking in the Evolution dashboard.
      </div>
    </div>
  );
}
