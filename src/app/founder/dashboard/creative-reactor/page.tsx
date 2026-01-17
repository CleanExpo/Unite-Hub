'use client';

/**
 * Founder Creative Reactor Dashboard
 * Phase 70: Deep view into reactive creative performance across clients
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Activity,
  TrendingUp,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
} from 'lucide-react';

import { CreativeHealthPanel } from '@/ui/components/CreativeHealthPanel';
import { ChannelResponseGraph } from '@/ui/components/ChannelResponseGraph';
import { VariationPerformanceTable } from '@/ui/components/VariationPerformanceTable';
import { ChannelPerformanceSnapshot } from '@/lib/visual/reactive/creativePerformanceSignals';
import { VisualABTest } from '@/lib/visual/reactive/abVisualTestingService';
import { MethodInsight } from '@/lib/visual/reactive/creativeFeedbackMapper';

// Mock data for demonstration
const mockHealthData = {
  score: 72,
  label: 'Healthy',
  factors: [
    { name: 'Engagement', score: 75, trend: 'up' as const },
    { name: 'Trends', score: 68, trend: 'stable' as const },
    { name: 'Diversity', score: 73, trend: 'up' as const },
  ],
};

const mockChannelSnapshots: ChannelPerformanceSnapshot[] = [
  { channel: 'instagram', impressions: 15420, engagement_rate: 0.042, ctr: 0.028, asset_count: 24, trend: 'improving' },
  { channel: 'linkedin', impressions: 8930, engagement_rate: 0.038, ctr: 0.032, asset_count: 12, trend: 'stable' },
  { channel: 'facebook', impressions: 12100, engagement_rate: 0.025, ctr: 0.018, asset_count: 18, trend: 'declining' },
  { channel: 'tiktok', impressions: 6800, engagement_rate: 0.058, ctr: 0.022, asset_count: 8, trend: 'improving' },
  { channel: 'youtube', impressions: 4200, engagement_rate: 0.031, ctr: 0.045, asset_count: 6, trend: 'stable' },
];

const mockMethodInsights: MethodInsight[] = [
  { method_id: 'hero_key_art', performance_tier: 'top', best_channels: ['instagram'], avoid_channels: [], recommendation: 'Increase usage' },
  { method_id: 'social_feed_single', performance_tier: 'strong', best_channels: ['linkedin'], avoid_channels: ['tiktok'], recommendation: 'Continue using' },
  { method_id: 'thumbnail_video', performance_tier: 'top', best_channels: ['youtube'], avoid_channels: [], recommendation: 'Expand to more campaigns' },
  { method_id: 'carousel_tutorial', performance_tier: 'average', best_channels: ['instagram'], avoid_channels: [], recommendation: 'Test variations' },
  { method_id: 'animation_logo_reveal', performance_tier: 'weak', best_channels: [], avoid_channels: ['linkedin'], recommendation: 'Review or retire' },
];

const mockTests: VisualABTest[] = [
  {
    test_id: 'test_001',
    campaign_id: 'camp_001',
    asset_id: 'asset_001',
    test_name: 'CTA Button Style',
    status: 'completed',
    created_at: '2024-01-15',
    started_at: '2024-01-16',
    completed_at: '2024-01-23',
    control: {
      variant_id: 'var_ctrl',
      variant_name: 'Control',
      is_control: true,
      modifications: [],
      impressions: 5240,
      engagements: 168,
      clicks: 147,
      conversions: 23,
      engagement_rate: 0.032,
      ctr: 0.028,
      conversion_rate: 0.156,
    },
    variations: [{
      variant_id: 'var_a',
      variant_name: 'Gradient Button',
      is_control: false,
      modifications: [{ type: 'cta_style', attribute: 'button_style', control_value: 'solid', variant_value: 'gradient' }],
      impressions: 5180,
      engagements: 212,
      clicks: 189,
      conversions: 31,
      engagement_rate: 0.041,
      ctr: 0.036,
      conversion_rate: 0.164,
    }],
    traffic_split: [50, 50],
    min_sample_size: 1000,
    confidence_threshold: 0.95,
    winner: 'var_a',
    lift: 0.28,
    statistical_significance: 0.96,
  },
  {
    test_id: 'test_002',
    campaign_id: 'camp_002',
    asset_id: 'asset_002',
    test_name: 'Headline Typography',
    status: 'active',
    created_at: '2024-01-20',
    started_at: '2024-01-21',
    completed_at: null,
    control: {
      variant_id: 'var_ctrl_2',
      variant_name: 'Control',
      is_control: true,
      modifications: [],
      impressions: 2100,
      engagements: 58,
      clicks: 42,
      conversions: 8,
      engagement_rate: 0.028,
      ctr: 0.02,
      conversion_rate: 0.19,
    },
    variations: [{
      variant_id: 'var_b',
      variant_name: 'Bold Headline',
      is_control: false,
      modifications: [{ type: 'typography', attribute: 'headline_weight', control_value: 'medium', variant_value: 'bold' }],
      impressions: 2050,
      engagements: 72,
      clicks: 51,
      conversions: 9,
      engagement_rate: 0.035,
      ctr: 0.025,
      conversion_rate: 0.176,
    }],
    traffic_split: [50, 50],
    min_sample_size: 1000,
    confidence_threshold: 0.95,
    winner: null,
    lift: null,
    statistical_significance: null,
  },
];

export default function CreativeReactorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-warning-500" />
            Creative Reactor
          </h1>
          <p className="text-muted-foreground">
            Reactive performance insights across all clients
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto text-info-500 mb-2" />
              <div className="text-2xl font-bold">47.2K</div>
              <div className="text-xs text-muted-foreground">Total Impressions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-success-500 mb-2" />
              <div className="text-2xl font-bold">3.8%</div>
              <div className="text-xs text-muted-foreground">Avg Engagement</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Layers className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <div className="text-2xl font-bold">68</div>
              <div className="text-xs text-muted-foreground">Active Assets</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lightbulb className="h-8 w-8 mx-auto text-warning-500 mb-2" />
              <div className="text-2xl font-bold">2</div>
              <div className="text-xs text-muted-foreground">Active Tests</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="tests">A/B Tests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health panel */}
            <CreativeHealthPanel
              score={mockHealthData.score}
              label={mockHealthData.label}
              factors={mockHealthData.factors}
              topChannel="instagram"
              bestCampaign="Product Launch Q1"
            />

            {/* Channel performance */}
            <div className="lg:col-span-2">
              <ChannelResponseGraph snapshots={mockChannelSnapshots} />
            </div>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reactive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InsightCard
                  type="opportunity"
                  title="TikTok Growth"
                  description="58% engagement rate - highest across channels"
                  action="Increase TikTok content volume"
                />
                <InsightCard
                  type="warning"
                  title="Facebook Declining"
                  description="Engagement down 15% over past 2 weeks"
                  action="Review content strategy"
                />
                <InsightCard
                  type="success"
                  title="A/B Test Winner"
                  description="Gradient buttons show 28% lift"
                  action="Apply to all campaigns"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <ChannelResponseGraph snapshots={mockChannelSnapshots} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockChannelSnapshots.map((snap) => (
                  <div
                    key={snap.channel}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium capitalize">{snap.channel}</span>
                      <div className="text-xs text-muted-foreground">
                        {snap.asset_count} assets • {snap.impressions.toLocaleString()} impressions
                      </div>
                    </div>
                    <Badge variant="outline">
                      {snap.trend === 'improving' ? 'Increase' :
                       snap.trend === 'declining' ? 'Review' : 'Maintain'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Method Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMethodInsights.map((method) => (
                  <div
                    key={method.method_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <TierBadge tier={method.performance_tier} />
                      <div>
                        <span className="font-medium text-sm">
                          {method.method_id.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {method.recommendation}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      {method.best_channels.length > 0 && (
                        <div className="text-success-500">
                          Best: {method.best_channels.join(', ')}
                        </div>
                      )}
                      {method.avoid_channels.length > 0 && (
                        <div className="text-error-500">
                          Avoid: {method.avoid_channels.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active & Completed Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <VariationPerformanceTable tests={mockTests} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightCard({
  type,
  title,
  description,
  action,
}: {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action: string;
}) {
  const config = {
    opportunity: { icon: Lightbulb, color: 'text-warning-500', bg: 'bg-warning-500/10' },
    warning: { icon: AlertTriangle, color: 'text-accent-500', bg: 'bg-accent-500/10' },
    success: { icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-500/10' },
  };

  const { icon: Icon, color, bg } = config[type];

  return (
    <div className={`p-4 rounded-lg ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="text-xs font-medium">{action}</div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const config = {
    top: 'bg-success-500 text-white',
    strong: 'bg-info-500 text-white',
    average: 'bg-warning-500 text-black',
    weak: 'bg-error-500 text-white',
    untested: 'bg-bg-hover0 text-white',
  };

  return (
    <Badge className={`text-[10px] ${config[tier as keyof typeof config]}`}>
      {tier}
    </Badge>
  );
}
