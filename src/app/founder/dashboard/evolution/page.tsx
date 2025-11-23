'use client';

/**
 * Founder Evolution Dashboard
 * Phase 64: System self-improvement oversight
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import EvoProposalCard from '@/ui/components/EvoProposalCard';

export default function FounderEvolutionPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockBriefing = {
    generated_at: new Date().toISOString(),
    pending_proposals: 3,
    high_priority_signals: 2,
    recent_implementations: 5,
    evolution_health_score: 78,
    action_items: [
      '📋 3 proposal(s) awaiting review',
      '⚠️ 2 high-priority signal(s) detected',
      '🔍 Run weekly evolution scan',
      '📊 Review evolution health metrics',
    ],
  };

  const mockProposals = [
    {
      id: 'sip-1',
      title: 'Critical: Optimize Token Usage Patterns',
      description: 'Token costs showing upward trend. Implement caching and prompt optimization to reduce costs by estimated 20%.',
      affected_subsystems: ['financial_director', 'production_engine'],
      urgency_score: 85,
      effort_estimate: 'medium' as const,
      founder_value_score: 90,
      risk_score: 25,
      confidence: 82,
      recommended_action: 'Immediate action recommended. Schedule for next sprint.',
      status: 'pending_review',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'sip-2',
      title: 'Important: Enhance Client Activation Flow',
      description: 'Client activation showing delays. Add proactive checkpoints and automated support triggers.',
      affected_subsystems: ['success_engine', 'agency_director'],
      urgency_score: 72,
      effort_estimate: 'high' as const,
      founder_value_score: 85,
      risk_score: 35,
      confidence: 75,
      recommended_action: 'High priority. Review and plan within one week.',
      status: 'pending_review',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'sip-3',
      title: 'Improve: Brand Consistency Monitoring',
      description: 'Add real-time brand consistency alerts and auto-fix suggestions for minor issues.',
      affected_subsystems: ['creative_director'],
      urgency_score: 55,
      effort_estimate: 'low' as const,
      founder_value_score: 70,
      risk_score: 20,
      confidence: 68,
      recommended_action: 'Medium priority. Include in monthly planning.',
      status: 'pending_review',
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  const mockReport = {
    signals_by_source: {
      cost_anomalies: 5,
      performance_slowdowns: 3,
      client_usage_patterns: 7,
      governance_audit_failures: 1,
      creative_inconsistencies: 2,
    },
    proposals_approved: 8,
    proposals_declined: 2,
    proposals_implemented: 5,
    system_health_trend: 'improving',
  };

  const handleRunScan = async () => {
    setLoading(true);
    // Simulate scan
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    alert('Scan complete! No new signals detected.');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Sparkles className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Self-Evolving System</h1>
            <p className="text-sm text-muted-foreground">
              Continuous improvement and roadmap intelligence
            </p>
          </div>
        </div>
        <button
          onClick={handleRunScan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-500">
              {mockBriefing.pending_proposals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Signals</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-orange-500">
              {mockBriefing.high_priority_signals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Implemented</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-500">
              {mockBriefing.recent_implementations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Health</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {mockBriefing.evolution_health_score}%
            </div>
            <Progress value={mockBriefing.evolution_health_score} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals
            {mockProposals.length > 0 && (
              <Badge className="ml-1" variant="secondary">
                {mockProposals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Signal Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockReport.signals_by_source).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {source.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline">{count}</Badge>
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
                  {mockBriefing.action_items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System trend */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Health Trend</span>
                <Badge className="bg-green-500">
                  {mockReport.system_health_trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProposals.map((proposal) => (
              <EvoProposalCard
                key={proposal.id}
                {...proposal}
                onApprove={() => console.log('Approve:', proposal.id)}
                onDecline={() => console.log('Decline:', proposal.id)}
              />
            ))}
          </div>

          {mockProposals.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No pending proposals</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Token usage spike detected</div>
                    <div className="text-xs text-muted-foreground">cost_anomalies • 2h ago</div>
                  </div>
                  <Badge className="bg-orange-500">High</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Client activation delay</div>
                    <div className="text-xs text-muted-foreground">client_usage_patterns • 5h ago</div>
                  </div>
                  <Badge className="bg-yellow-500">Medium</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Implementation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Governance audit optimization</div>
                    <div className="text-xs text-muted-foreground">Implemented 3 days ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Mission risk scoring enhancement</div>
                    <div className="text-xs text-muted-foreground">Implemented 1 week ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Safety constraints */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        Evolution Engine operates in read-only mode. No production changes without founder approval.
        All proposals require explicit approval. Full audit logging enabled. Rollback available.
      </div>
    </div>
  );
}
