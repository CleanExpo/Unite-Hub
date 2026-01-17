'use client';

/**
 * Founder ORM Dashboard
 * Phase 67: Operational Reality Mode - Real-cost modelling and profitability
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Target,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import ORMProfitCard from '@/ui/components/ORMProfitCard';
import ORMROIOverview from '@/ui/components/ORMROIOverview';
import ORMSimulationCard from '@/ui/components/ORMSimulationCard';

export default function FounderORMPage() {
  const [activeTab, setActiveTab] = useState('profitability');

  // Mock data
  const mockSummary = {
    total_revenue: 65000,
    total_cost: 42000,
    total_margin: 23000,
    avg_margin_percent: 35.4,
    clients: {
      total: 28,
      profitable: 22,
      marginal: 4,
      loss_leading: 2,
    },
    health_score: 78,
  };

  const mockProfitabilities = [
    {
      client_name: 'Acme Corp',
      revenue: 3500,
      cost: 1800,
      margin: 1700,
      margin_percent: 48.6,
      status: 'profitable' as const,
      trend: 'improving' as const,
      weeks_unprofitable: 0,
      recommendations: [],
    },
    {
      client_name: 'Tech Solutions',
      revenue: 2800,
      cost: 2200,
      margin: 600,
      margin_percent: 21.4,
      status: 'profitable' as const,
      trend: 'stable' as const,
      weeks_unprofitable: 0,
      recommendations: [],
    },
    {
      client_name: 'Local Builder Co',
      revenue: 2000,
      cost: 1800,
      margin: 200,
      margin_percent: 10.0,
      status: 'marginal' as const,
      trend: 'declining' as const,
      weeks_unprofitable: 1,
      recommendations: ['Optimize workflow efficiency'],
    },
    {
      client_name: 'StartUp Inc',
      revenue: 1500,
      cost: 1900,
      margin: -400,
      margin_percent: -26.7,
      status: 'loss_leading' as const,
      trend: 'declining' as const,
      weeks_unprofitable: 3,
      recommendations: ['Review pricing structure', 'Audit high-cost activities'],
    },
  ];

  const mockROIs = [
    {
      client_name: 'Acme Corp',
      value_delivered_index: 85,
      roi_score: 78,
      cost_efficiency: 12.5,
      quality_score: 82,
      timeline_adherence: 92,
      overall_rating: 'excellent' as const,
      highlights: ['8 conversions achieved', 'Excellent timeline adherence'],
      areas_for_improvement: [],
    },
    {
      client_name: 'Tech Solutions',
      value_delivered_index: 68,
      roi_score: 62,
      cost_efficiency: 8.2,
      quality_score: 65,
      timeline_adherence: 78,
      overall_rating: 'good' as const,
      highlights: ['Strong lead generation: 12 leads'],
      areas_for_improvement: ['Focus on conversion optimization'],
    },
  ];

  const mockWorkload = {
    staff_load: { avg_utilization: 72, overloaded_count: 1, index: 72 },
    ai_load: { capacity_percent: 58, index: 58 },
    queue_load: { total_pending: 45, avg_wait_time: 35, index: 42 },
    combined_index: 58,
    status: 'moderate' as const,
  };

  const mockSimulations = [
    {
      scenario_name: 'Add 1 Client',
      new_clients: 1,
      current_clients: 28,
      projected_workload_index: 62,
      feasibility: 'safe' as const,
      confidence: 78,
      impact: {
        revenue_change: 2500,
        cost_change: 1500,
        margin_change: 1000,
        staff_utilization_change: 5,
        ai_capacity_change: 3,
        workload_index_change: 4,
      },
      recommendations: ['System health supports this growth safely'],
      required_upgrades: [],
    },
    {
      scenario_name: 'Add 5 Clients',
      new_clients: 5,
      current_clients: 28,
      projected_workload_index: 74,
      feasibility: 'caution' as const,
      confidence: 70,
      impact: {
        revenue_change: 12500,
        cost_change: 7500,
        margin_change: 5000,
        staff_utilization_change: 25,
        ai_capacity_change: 15,
        workload_index_change: 16,
      },
      recommendations: ['Monitor staff workload closely after onboarding'],
      required_upgrades: [],
    },
    {
      scenario_name: 'Add 10 Clients',
      new_clients: 10,
      current_clients: 28,
      projected_workload_index: 88,
      feasibility: 'risky' as const,
      confidence: 62,
      impact: {
        revenue_change: 25000,
        cost_change: 15000,
        margin_change: 10000,
        staff_utilization_change: 50,
        ai_capacity_change: 30,
        workload_index_change: 30,
      },
      recommendations: ['Hire additional staff before onboarding'],
      required_upgrades: ['Expand team capacity', 'Upgrade AI tier budget'],
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
            <DollarSign className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Operational Reality Mode</h1>
            <p className="text-sm text-muted-foreground">
              Real-cost modelling and profitability analysis
            </p>
          </div>
        </div>
        <Badge className={mockSummary.health_score >= 70 ? 'bg-success-500' : mockSummary.health_score >= 50 ? 'bg-warning-500' : 'bg-error-500'}>
          Health: {mockSummary.health_score}%
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success-500" />
              Revenue
            </div>
            <div className="text-2xl font-bold text-success-500 mt-1">
              {formatCurrency(mockSummary.total_revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-error-500" />
              Costs
            </div>
            <div className="text-2xl font-bold text-error-500 mt-1">
              {formatCurrency(mockSummary.total_cost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-info-500" />
              Margin
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(mockSummary.total_margin)}
            </div>
            <div className="text-xs text-muted-foreground">
              {mockSummary.avg_margin_percent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-violet-500" />
              Clients
            </div>
            <div className="text-2xl font-bold mt-1">
              {mockSummary.clients.total}
            </div>
            <div className="text-xs">
              <span className="text-success-500">{mockSummary.clients.profitable}✓</span>
              {' '}
              <span className="text-warning-500">{mockSummary.clients.marginal}~</span>
              {' '}
              <span className="text-error-500">{mockSummary.clients.loss_leading}✗</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profitability">
            Profitability
            {mockSummary.clients.loss_leading > 0 && (
              <Badge className="ml-1 bg-error-500">{mockSummary.clients.loss_leading}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roi">ROI Overview</TabsTrigger>
          <TabsTrigger value="workload">Workload Index</TabsTrigger>
          <TabsTrigger value="simulation">Simulations</TabsTrigger>
        </TabsList>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProfitabilities.map((p, i) => (
              <ORMProfitCard
                key={i}
                {...p}
                onClick={() => console.log('View client:', p.client_name)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockROIs.map((roi, i) => (
              <ORMROIOverview key={i} {...roi} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{mockWorkload.staff_load.index}%</div>
                <Progress value={mockWorkload.staff_load.index} className="h-2 mb-2" />
                <div className="text-xs text-muted-foreground">
                  Avg utilization: {mockWorkload.staff_load.avg_utilization}%
                </div>
                {mockWorkload.staff_load.overloaded_count > 0 && (
                  <div className="text-xs text-error-500 mt-1">
                    {mockWorkload.staff_load.overloaded_count} overloaded
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  AI Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{mockWorkload.ai_load.index}%</div>
                <Progress value={mockWorkload.ai_load.index} className="h-2 mb-2" />
                <div className="text-xs text-muted-foreground">
                  Capacity: {mockWorkload.ai_load.capacity_percent}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Queue Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{mockWorkload.queue_load.index}%</div>
                <Progress value={mockWorkload.queue_load.index} className="h-2 mb-2" />
                <div className="text-xs text-muted-foreground">
                  Pending: {mockWorkload.queue_load.total_pending} jobs
                </div>
                <div className="text-xs text-muted-foreground">
                  Wait: {mockWorkload.queue_load.avg_wait_time}s
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined index */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Combined Workload Index</div>
                  <div className="text-xs text-muted-foreground">Weighted average of all load factors</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{mockWorkload.combined_index}%</div>
                  <Badge className={mockWorkload.status === 'healthy' ? 'bg-success-500' : mockWorkload.status === 'moderate' ? 'bg-warning-500' : 'bg-error-500'}>
                    {mockWorkload.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockSimulations.map((sim, i) => (
              <ORMSimulationCard
                key={i}
                {...sim}
                onSelect={() => console.log('Select scenario:', sim.scenario_name)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Safety notice */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        All metrics based on real usage data. No estimates or projections. Founder approval required for actions.
        ORM data feeds into Agency Director, Governance, and Scaling dashboards.
      </div>
    </div>
  );
}
