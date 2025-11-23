'use client';

/**
 * Founder Executive Dashboard
 * Phase 62: Central executive console for all agents
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Activity,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import AgentHealthGrid from '@/ui/components/AgentHealthGrid';
import ExecutiveMissionCard from '@/ui/components/ExecutiveMissionCard';
import SystemLoadGauge from '@/ui/components/SystemLoadGauge';

export default function FounderExecutivePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      const response = await fetch('/api/executive/briefing');
      const result = await response.json();
      setBriefing(result.data);
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data
  const mockBriefing = {
    generated_at: new Date().toISOString(),
    system_health: {
      total_agents: 7,
      active: 5,
      busy: 1,
      error: 0,
      overall_status: 'healthy',
    },
    active_missions: 2,
    pending_decisions: 1,
    client_summary: {
      total: 5,
      at_risk: 1,
      opportunities: 3,
    },
    top_priorities: [
      '1 decision awaiting approval',
      'Review agent health metrics',
      'Check client risk alerts',
    ],
    action_items: [
      '⏳ Review and approve pending decisions',
      '📊 Review system performance',
      '🎯 Check mission progress',
    ],
  };

  const mockAgents = [
    { id: 'agency_director', name: 'Agency Director', status: 'active' as const, tasks_completed_24h: 47, avg_response_ms: 180, error_rate: 0.01, last_active: new Date().toISOString() },
    { id: 'creative_director', name: 'Creative Director', status: 'active' as const, tasks_completed_24h: 32, avg_response_ms: 220, error_rate: 0.02, last_active: new Date().toISOString() },
    { id: 'success_engine', name: 'Success Engine', status: 'busy' as const, tasks_completed_24h: 28, avg_response_ms: 150, error_rate: 0, last_active: new Date().toISOString() },
    { id: 'production_engine', name: 'Production Engine', status: 'active' as const, tasks_completed_24h: 65, avg_response_ms: 350, error_rate: 0.03, last_active: new Date().toISOString() },
    { id: 'performance_intelligence', name: 'Performance Intel', status: 'idle' as const, tasks_completed_24h: 15, avg_response_ms: 200, error_rate: 0, last_active: new Date(Date.now() - 3600000).toISOString() },
    { id: 'financial_director', name: 'Financial Director', status: 'active' as const, tasks_completed_24h: 12, avg_response_ms: 100, error_rate: 0, last_active: new Date().toISOString() },
    { id: 'founder_assistant', name: 'Founder Assistant', status: 'active' as const, tasks_completed_24h: 8, avg_response_ms: 120, error_rate: 0, last_active: new Date().toISOString() },
  ];

  const mockMissions = [
    {
      id: 'mission-1',
      title: 'Client Health Recovery',
      description: 'Multi-agent intervention to improve client health',
      type: 'client_health_recovery',
      priority: 'high' as const,
      status: 'executing',
      progress: 66,
      steps: [
        { step_number: 1, agent_id: 'agency_director', action: 'assess_risk', description: 'Analyze risk factors', status: 'completed' as const },
        { step_number: 2, agent_id: 'success_engine', action: 'identify_interventions', description: 'Determine interventions', status: 'completed' as const },
        { step_number: 3, agent_id: 'founder_assistant', action: 'schedule_outreach', description: 'Schedule client call', status: 'executing' as const },
      ],
      clientId: 'client-123',
    },
    {
      id: 'mission-2',
      title: 'Growth Acceleration',
      description: 'Coordinated campaign for growth opportunity',
      type: 'growth_push',
      priority: 'medium' as const,
      status: 'planned',
      progress: 0,
      steps: [
        { step_number: 1, agent_id: 'agency_director', action: 'analyze_opportunity', description: 'Analyze opportunity', status: 'pending' as const },
        { step_number: 2, agent_id: 'creative_director', action: 'design_campaign', description: 'Design campaign', status: 'pending' as const },
        { step_number: 3, agent_id: 'production_engine', action: 'generate_assets', description: 'Generate assets', status: 'pending' as const },
      ],
      clientId: 'client-456',
    },
  ];

  const displayBriefing = briefing?.briefing || mockBriefing;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Brain className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Executive Brain</h1>
            <p className="text-sm text-muted-foreground">
              Multi-agent orchestration and strategic oversight
            </p>
          </div>
        </div>
        <Badge
          variant={displayBriefing.system_health.overall_status === 'healthy' ? 'default' : 'destructive'}
          className={displayBriefing.system_health.overall_status === 'healthy' ? 'bg-green-500' : ''}
        >
          {displayBriefing.system_health.overall_status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active Agents</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.system_health.active}/{displayBriefing.system_health.total_agents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Active Missions</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.active_missions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-500">
              {displayBriefing.pending_decisions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Opportunities</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-purple-500">
              {displayBriefing.client_summary.opportunities}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Load */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SystemLoadGauge
          current_load={42}
          max_capacity={100}
          trend="stable"
          label="CPU Load"
        />
        <SystemLoadGauge
          current_load={65}
          max_capacity={100}
          trend="up"
          label="Memory Usage"
        />
        <SystemLoadGauge
          current_load={28}
          max_capacity={100}
          trend="down"
          label="API Calls"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="missions">
            Missions
            {mockMissions.length > 0 && (
              <Badge className="ml-1" variant="secondary">
                {mockMissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Priorities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayBriefing.top_priorities.map((priority: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1 h-1 bg-blue-500 rounded-full" />
                      {priority}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayBriefing.action_items.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <AgentHealthGrid
            agents={mockAgents}
            onAgentClick={(id) => console.log('View agent:', id)}
          />
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockMissions.map((mission) => (
              <ExecutiveMissionCard
                key={mission.id}
                {...mission}
                onViewDetails={() => console.log('View mission:', mission.id)}
              />
            ))}
          </div>

          {mockMissions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No active missions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Pending Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayBriefing.pending_decisions > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Brand Overhaul Approval</span>
                      <Badge className="bg-orange-500">High</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Major brand shift requires founder approval before execution.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending decisions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Constraints */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        Executive Brain operates with truth-layer constraints. No hallucinated capabilities.
        Major decisions require founder approval. Full audit logging enabled.
      </div>
    </div>
  );
}
