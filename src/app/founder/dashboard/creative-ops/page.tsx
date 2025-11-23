'use client';

/**
 * Founder Creative Ops Dashboard
 * Phase 71: Unified operations grid with full visibility
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Grid3X3,
  Activity,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { CreativeOpsCard } from '@/ui/components/CreativeOpsCard';
import { CycleSyncGraph } from '@/ui/components/CycleSyncGraph';
import { PressureOpportunityMatrix } from '@/ui/components/PressureOpportunityMatrix';
import { OpsGridState, GridZone, CreativeOpsBrief } from '@/lib/operations/creativeOpsGridEngine';
import { CycleState, CycleAlignment } from '@/lib/operations/cycleCoordinator';
import { CreativePressure } from '@/lib/operations/creativePressureEngine';
import { CreativeOpportunity } from '@/lib/operations/creativeOpportunityEngine';

// Mock data for demonstration
const mockGridState: OpsGridState = {
  workspace_id: 'ws_001',
  timestamp: new Date().toISOString(),
  zone: 'opportunity',
  zone_score: 72,
  health_score: 68,
  pressure_score: 35,
  opportunity_score: 75,
  coordination_score: 78,
};

const mockBrief: CreativeOpsBrief = {
  brief_id: 'brief_001',
  workspace_id: 'ws_001',
  generated_at: new Date().toISOString(),
  period: 'Daily',
  headline: '3 growth opportunities identified - momentum rising',
  zone: 'opportunity',
  overall_status: 'good',
  key_metrics: {
    health: 68,
    pressure: 35,
    opportunity: 75,
    coordination: 78,
  },
  critical_pressures: [],
  top_opportunities: ['Capitalize on Instagram momentum', 'Test new carousel methods', 'Expand to TikTok'],
  cycle_issues: ['Social-Content minor drift'],
  immediate_actions: ['Increase Instagram posting frequency', 'Generate 3 carousel variants'],
  this_week_priorities: ['Run A/B test on thumbnails', 'Review TikTok strategy'],
  strategic_focus: ['Brand extension opportunity', 'Audience growth campaign'],
  data_completeness: 85,
  confidence: 78,
};

const mockCycleStates: CycleState[] = [
  { cycle: 'brand', health: 75, momentum: 60, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'social', health: 82, momentum: 75, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'website', health: 65, momentum: 50, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'ads', health: 70, momentum: 55, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'content', health: 58, momentum: 45, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'seo', health: 72, momentum: 60, last_updated: new Date().toISOString(), key_metrics: [] },
  { cycle: 'visuals', health: 80, momentum: 70, last_updated: new Date().toISOString(), key_metrics: [] },
];

const mockAlignments: CycleAlignment[] = [
  { cycle_a: 'brand', cycle_b: 'social', alignment_score: 85, drift: 15, status: 'aligned', issues: [] },
  { cycle_a: 'brand', cycle_b: 'website', alignment_score: 72, drift: 28, status: 'minor_drift', issues: ['Health gap'] },
  { cycle_a: 'social', cycle_b: 'content', alignment_score: 55, drift: 45, status: 'major_drift', issues: ['Momentum gap: social trending up while content down'] },
  { cycle_a: 'website', cycle_b: 'seo', alignment_score: 80, drift: 20, status: 'aligned', issues: [] },
  { cycle_a: 'ads', cycle_b: 'visuals', alignment_score: 90, drift: 10, status: 'aligned', issues: [] },
];

const mockPressures: CreativePressure[] = [
  {
    pressure_id: 'p_001',
    type: 'engagement_decline',
    severity: 'medium',
    score: 45,
    affected_area: 'Content cycle',
    description: 'Content engagement trending down for 2 weeks',
    evidence: [{ source: 'signals', metric: 'content_momentum', value: 45, threshold: 50 }],
    interventions: [
      { intervention_id: 'i_001', type: 'quick_fix', action: 'Refresh content format mix', expected_impact: 'medium', effort: 'low', resources_needed: ['VIF'] },
    ],
    timeline: 'this_week',
  },
];

const mockOpportunities: CreativeOpportunity[] = [
  {
    opportunity_id: 'o_001',
    type: 'momentum',
    potential_value: 'high',
    confidence: 82,
    title: 'Instagram Momentum Peak',
    description: 'Social cycle at 82% health with rising momentum',
    evidence: [{ source: 'cycles', signal: 'Social health 82%', interpretation: 'Strong engagement' }],
    actions: [
      { action_id: 'a_001', step: 1, action: 'Double posting frequency', resources: ['Content calendar'], timeline: '3 days' },
    ],
    time_sensitivity: 'urgent',
    estimated_lift: '20-30% reach increase',
  },
  {
    opportunity_id: 'o_002',
    type: 'method_discovery',
    potential_value: 'medium',
    confidence: 65,
    title: 'Carousel Methods Untested',
    description: '40% of carousel methods unused',
    evidence: [{ source: 'vif', signal: '8 carousel methods', interpretation: 'Fresh content potential' }],
    actions: [
      { action_id: 'a_002', step: 1, action: 'Test top 3 carousel methods', resources: ['VIF', 'A/B testing'], timeline: '1 week' },
    ],
    time_sensitivity: 'timely',
    estimated_lift: '15% engagement on carousels',
  },
];

export default function CreativeOpsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getZoneIcon = (zone: GridZone) => {
    switch (zone) {
      case 'stability': return Shield;
      case 'pressure': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      case 'expansion': return Zap;
    }
  };

  const ZoneIcon = getZoneIcon(mockGridState.zone);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="h-6 w-6 text-purple-500" />
            Creative Operations Grid
          </h1>
          <p className="text-muted-foreground">
            Unified visibility into creative systems
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Daily Brief Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZoneIcon className={`h-5 w-5 ${mockGridState.zone === 'opportunity' ? 'text-green-500' : 'text-primary'}`} />
              <CardTitle className="text-base">Daily Brief</CardTitle>
            </div>
            <Badge variant="outline">{mockBrief.overall_status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium mb-4">{mockBrief.headline}</p>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <MetricBox label="Health" value={mockBrief.key_metrics.health} />
            <MetricBox label="Pressure" value={mockBrief.key_metrics.pressure} inverted />
            <MetricBox label="Opportunity" value={mockBrief.key_metrics.opportunity} />
            <MetricBox label="Coordination" value={mockBrief.key_metrics.coordination} />
          </div>
          {mockBrief.immediate_actions.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Immediate Actions
              </h4>
              <ul className="text-xs space-y-1">
                {mockBrief.immediate_actions.map((action, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="cycles">Cycles</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matrix */}
            <PressureOpportunityMatrix
              pressureScore={mockGridState.pressure_score}
              opportunityScore={mockGridState.opportunity_score}
              currentZone={mockGridState.zone}
            />

            {/* Cycle sync */}
            <div className="lg:col-span-2">
              <CycleSyncGraph
                cycleStates={mockCycleStates}
                alignments={mockAlignments}
              />
            </div>
          </div>

          {/* Client cards grid */}
          <div>
            <h3 className="text-sm font-medium mb-3">Client Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CreativeOpsCard
                clientName="Acme Corp"
                gridState={mockGridState}
                criticalCount={0}
                opportunityCount={3}
              />
              <CreativeOpsCard
                clientName="TechStart Inc"
                gridState={{ ...mockGridState, zone: 'pressure', pressure_score: 65, zone_score: 45 }}
                criticalCount={2}
                opportunityCount={1}
              />
              <CreativeOpsCard
                clientName="GreenLife Co"
                gridState={{ ...mockGridState, zone: 'stability', zone_score: 80 }}
                criticalCount={0}
                opportunityCount={0}
              />
              <CreativeOpsCard
                clientName="Urban Eats"
                gridState={{ ...mockGridState, zone: 'expansion', pressure_score: 55, opportunity_score: 70, zone_score: 62 }}
                criticalCount={1}
                opportunityCount={2}
              />
            </div>
          </div>
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <SignalCard dimension="Momentum" value={65} trend="rising" />
            <SignalCard dimension="Stagnation" value={35} trend="stable" inverted />
            <SignalCard dimension="Resonance" value={58} trend="rising" />
            <SignalCard dimension="Fatigue" value={28} trend="falling" inverted />
            <SignalCard dimension="Opportunity" value={72} trend="stable" />
            <SignalCard dimension="Tension" value={42} trend="stable" inverted />
          </div>
        </TabsContent>

        {/* Cycles Tab */}
        <TabsContent value="cycles" className="space-y-6">
          <CycleSyncGraph
            cycleStates={mockCycleStates}
            alignments={mockAlignments}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cycle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCycleStates.map((cycle) => (
                  <div key={cycle.cycle} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${cycle.health >= 70 ? 'bg-green-500' : cycle.health >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className="font-medium capitalize">{cycle.cycle}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Health: {cycle.health.toFixed(0)}%</span>
                      <span>Momentum: {cycle.momentum.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockOpportunities.map((opp) => (
              <Card key={opp.opportunity_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{opp.title}</CardTitle>
                    <Badge className={opp.potential_value === 'high' ? 'bg-green-500' : 'bg-blue-500'}>
                      {opp.potential_value}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{opp.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Confidence: {opp.confidence}%</span>
                    <span className="text-green-500">{opp.estimated_lift}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-medium mb-1">Next Step</h4>
                    <p className="text-xs text-muted-foreground">{opp.actions[0]?.action}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pressures */}
          {mockPressures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Active Pressures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPressures.map((pressure) => (
                    <div key={pressure.pressure_id} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{pressure.description}</span>
                        <Badge variant="outline">{pressure.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Intervention: {pressure.interventions[0]?.action}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricBox({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) {
  const color = inverted
    ? value <= 30 ? 'text-green-500' : value <= 50 ? 'text-yellow-500' : 'text-red-500'
    : value >= 70 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SignalCard({
  dimension,
  value,
  trend,
  inverted = false,
}: {
  dimension: string;
  value: number;
  trend: 'rising' | 'falling' | 'stable';
  inverted?: boolean;
}) {
  const color = inverted
    ? value <= 30 ? 'text-green-500' : value <= 50 ? 'text-yellow-500' : 'text-red-500'
    : value >= 70 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{dimension}</div>
        <div className="text-[10px] text-muted-foreground capitalize">{trend}</div>
      </CardContent>
    </Card>
  );
}
