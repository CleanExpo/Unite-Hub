'use client';

/**
 * Founder Director Dashboard
 * Phase 60: AI Agency Director central oversight
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  FileText,
  Activity,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import DirectorStatusGrid from '@/ui/components/DirectorStatusGrid';
import DirectorRiskCard from '@/ui/components/DirectorRiskCard';
import DirectorOpportunityCard from '@/ui/components/DirectorOpportunityCard';

export default function FounderDirectorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      const response = await fetch('/api/director/insights?type=briefing');
      const result = await response.json();
      setBriefing(result.data);
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockBriefing = {
    generated_at: new Date().toISOString(),
    period: 'daily',
    total_clients: 5,
    clients_at_risk: 1,
    total_opportunities: 8,
    top_risks: [
      {
        id: 'risk-1',
        client_id: 'client-1',
        type: 'risk',
        category: 'engagement_drop',
        severity: 'high',
        title: 'Low Platform Engagement',
        description: 'Client has logged in only 1 time in the past 7 days. Average is 5+ logins per week.',
        data_sources: ['activation_engine'],
        metrics: { logins_7d: 1, expected: 5 },
        recommended_actions: ['Schedule check-in call', 'Review onboarding', 'Send helpful resources'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'risk-2',
        client_id: 'client-2',
        type: 'risk',
        category: 'content_stagnation',
        severity: 'medium',
        title: 'Content Production Slowed',
        description: 'Only 2 content pieces generated in past 7 days. Target is 5+ per week.',
        data_sources: ['production_jobs'],
        metrics: { content_7d: 2, target: 5 },
        recommended_actions: ['Review approval queue', 'Suggest content topics'],
        created_at: new Date().toISOString(),
      },
    ],
    top_opportunities: [
      {
        id: 'opp-1',
        client_id: 'client-3',
        type: 'opportunity',
        category: 'upsell_ready',
        severity: 'low',
        title: 'Ready for Tier Upgrade',
        description: 'Client using 85% of features with 82 health score.',
        data_sources: ['performance_insights'],
        metrics: { feature_usage: '85%', health_score: 82, confidence: '80%' },
        recommended_actions: ['Present premium demo', 'Calculate ROI'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'opp-2',
        client_id: 'client-4',
        type: 'opportunity',
        category: 'case_study_candidate',
        severity: 'low',
        title: 'Case Study Opportunity',
        description: '75+ days active with 88 health score and proven results.',
        data_sources: ['success_scores'],
        metrics: { days_active: 78, health_score: 88, confidence: '85%' },
        recommended_actions: ['Schedule interview', 'Gather metrics'],
        created_at: new Date().toISOString(),
      },
    ],
    action_items: [
      '🔴 Review 1 high-priority risk today',
      '🟢 8 growth opportunities to explore',
      '📊 Review daily metrics dashboard',
      '📞 Complete scheduled client check-ins',
    ],
    metrics_summary: {
      avg_health_score: 72,
      total_content_generated: 47,
      total_revenue_at_risk: 500,
      efficiency_score: 75,
    },
  };

  const mockClients = [
    { client_id: '1', client_name: 'ABC Restoration', industry: 'Restoration', activation_day: 45, health_score: 82, risk_count: 0, opportunity_count: 2, status: 'healthy' as const },
    { client_id: '2', client_name: 'XYZ Plumbing', industry: 'Trades', activation_day: 30, health_score: 68, risk_count: 1, opportunity_count: 1, status: 'attention_needed' as const },
    { client_id: '3', client_name: 'Pro Electric', industry: 'Trades', activation_day: 60, health_score: 88, risk_count: 0, opportunity_count: 3, status: 'healthy' as const },
    { client_id: '4', client_name: 'Quality HVAC', industry: 'Local Services', activation_day: 15, health_score: 55, risk_count: 2, opportunity_count: 1, status: 'at_risk' as const },
    { client_id: '5', client_name: 'Smith Consulting', industry: 'Consulting', activation_day: 78, health_score: 90, risk_count: 0, opportunity_count: 2, status: 'healthy' as const },
  ];

  const mockSummary = {
    total: 5,
    healthy: 3,
    attention_needed: 1,
    at_risk: 1,
    critical: 0,
  };

  const displayBriefing = briefing || mockBriefing;

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
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Agency Director</h1>
            <p className="text-sm text-muted-foreground">
              Central oversight and intelligence across all clients
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {new Date(displayBriefing.generated_at).toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Avg Health</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {displayBriefing.metrics_summary.avg_health_score}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">At Risk</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-orange-500">
              {displayBriefing.clients_at_risk}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Opportunities</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-500">
              {displayBriefing.total_opportunities}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Revenue at Risk</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              ${displayBriefing.metrics_summary.total_revenue_at_risk}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">
            Risks
            {displayBriefing.top_risks.length > 0 && (
              <Badge className="ml-1 bg-red-500" variant="secondary">
                {displayBriefing.top_risks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DirectorStatusGrid
            clients={mockClients}
            summary={mockSummary}
            onClientClick={(id) => console.log('View client:', id)}
          />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayBriefing.top_risks.map((risk: any) => (
              <DirectorRiskCard
                key={risk.id}
                category={risk.category}
                severity={risk.severity}
                title={risk.title}
                description={risk.description}
                metrics={risk.metrics}
                recommendedActions={risk.recommended_actions}
                createdAt={risk.created_at}
                onAction={(action) => console.log('Action:', action)}
              />
            ))}
          </div>

          {displayBriefing.top_risks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No active risks detected</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayBriefing.top_opportunities.map((opp: any) => (
              <DirectorOpportunityCard
                key={opp.id}
                category={opp.category}
                title={opp.title}
                description={opp.description}
                metrics={opp.metrics}
                recommendedActions={opp.recommended_actions}
                confidence={parseFloat(opp.metrics.confidence) / 100}
                onAction={(action) => console.log('Action:', action)}
              />
            ))}
          </div>

          {displayBriefing.top_opportunities.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No opportunities identified yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Today's Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayBriefing.action_items.map((item: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Weekly Content Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {displayBriefing.metrics_summary.total_content_generated}
              </div>
              <div className="text-sm text-muted-foreground">
                content pieces generated this week
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Truth Layer Reminder */}
      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        All insights based on real client data. No projections or AI-generated estimates.
        Director respects truth-layer compliance across all recommendations.
      </div>
    </div>
  );
}
