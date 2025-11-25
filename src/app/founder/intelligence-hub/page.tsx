'use client';

/**
 * Founder Intelligence Hub Dashboard
 *
 * Unified view of:
 * - Agent health and status
 * - Global insights and risks
 * - Meta reasoner recommendations
 * - System metrics and trends
 * - Collaboration activity
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
  Activity,
  TrendingUp,
  Clock,
  Users,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';

interface AgentState {
  agent: string;
  status: 'idle' | 'running' | 'degraded' | 'error';
  healthScore: number;
  activeWorkflows: number;
  lastActivityAt: string;
  errorCount?: number;
}

interface GlobalInsight {
  id: string;
  summary: string;
  severity: 'info' | 'warning' | 'critical';
  theme: string;
  confidence: number;
  sourceAgents: string[];
}

interface MetaDecision {
  systemStatus: 'healthy' | 'degraded' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  focusAreas: string[];
  recommendedActions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  nextReviewIn: number;
  confidence: number;
}

export default function IntelligenceHubPage() {
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [insights, setInsights] = useState<GlobalInsight[]>([]);
  const [meta, setMeta] = useState<MetaDecision | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo data initialization
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setAgentStates([
        { agent: 'email', status: 'running', healthScore: 95, activeWorkflows: 12, lastActivityAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
        { agent: 'research', status: 'running', healthScore: 88, activeWorkflows: 8, lastActivityAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { agent: 'content', status: 'running', healthScore: 92, activeWorkflows: 15, lastActivityAt: new Date(Date.now() - 1 * 60 * 1000).toISOString() },
        { agent: 'scheduling', status: 'idle', healthScore: 100, activeWorkflows: 0, lastActivityAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { agent: 'analysis', status: 'running', healthScore: 85, activeWorkflows: 5, lastActivityAt: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
        { agent: 'coordination', status: 'degraded', healthScore: 65, activeWorkflows: 2, lastActivityAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), errorCount: 2 },
      ]);

      setInsights([
        {
          id: '1',
          summary: 'Email engagement rate improved by 23% in the last 7 days',
          severity: 'info',
          theme: 'email_engagement',
          confidence: 0.92,
          sourceAgents: ['email', 'analysis'],
        },
        {
          id: '2',
          summary: 'Content approval workflow showing bottleneck - 8 items pending',
          severity: 'warning',
          theme: 'content_quality',
          confidence: 0.88,
          sourceAgents: ['content', 'coordination'],
        },
        {
          id: '3',
          summary: 'Scheduling agent degraded - response times increased 45%',
          severity: 'warning',
          theme: 'scheduling_efficiency',
          confidence: 0.91,
          sourceAgents: ['scheduling', 'analysis'],
        },
        {
          id: '4',
          summary: 'Staff utilization at 78% - approaching capacity threshold',
          severity: 'warning',
          theme: 'staff_utilization',
          confidence: 0.85,
          sourceAgents: ['analysis'],
        },
        {
          id: '5',
          summary: 'Strong cross-domain opportunity: combine email + content for product launch',
          severity: 'info',
          theme: 'opportunity',
          confidence: 0.79,
          sourceAgents: ['email', 'content', 'coordination'],
        },
      ]);

      setMeta({
        systemStatus: 'degraded',
        priority: 'high',
        focusAreas: ['agent_degradation', 'content_bottleneck', 'staff_capacity'],
        recommendedActions: [
          'Restart coordination agent and investigate error logs',
          'Review content approval process - consider parallel review tracks',
          'Monitor staff workload; prepare contingency staffing plan',
          'Continue monitoring email engagement improvements',
        ],
        riskLevel: 'high',
        nextReviewIn: 15,
        confidence: 0.87,
      });

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'idle':
        return <Clock className="w-5 h-5 text-gray-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'bg-green-100 text-green-800';
    if (health >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-3xl font-bold">Intelligence Hub</h1>
        <p className="text-gray-500">Loading unified intelligence view...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Founder Intelligence Hub</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Unified view of agent health, global insights, and strategic recommendations
        </p>
      </div>

      {/* Critical Alert */}
      {meta?.riskLevel === 'critical' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Critical Alert</AlertTitle>
          <AlertDescription>{meta.recommendedActions[0]}</AlertDescription>
        </Alert>
      )}

      {meta?.riskLevel === 'high' && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>High Risk Alert</AlertTitle>
          <AlertDescription>System degradation detected. Review focus areas and take recommended actions.</AlertDescription>
        </Alert>
      )}

      {/* System Status Summary */}
      {meta && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Status & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <Badge className={meta.systemStatus === 'healthy' ? 'bg-green-600' : meta.systemStatus === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'}>
                  {meta.systemStatus.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <Badge className={meta.riskLevel === 'low' ? 'bg-green-600' : meta.riskLevel === 'medium' ? 'bg-yellow-600' : meta.riskLevel === 'high' ? 'bg-orange-600' : 'bg-red-600'}>
                  {meta.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-lg font-semibold">{(meta.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Review</p>
                <p className="text-lg font-semibold">{meta.nextReviewIn}m</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {meta.focusAreas.map(area => (
                  <Badge key={area} variant="outline">
                    {area.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-3">Recommended Actions</p>
              <ul className="space-y-2">
                {meta.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agent Health</TabsTrigger>
          <TabsTrigger value="insights">Global Insights</TabsTrigger>
          <TabsTrigger value="messages">Collaboration</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Agent Health Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentStates.map(agent => (
              <Card key={agent.agent}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="capitalize flex items-center gap-2">
                      {getStatusIcon(agent.status)}
                      {agent.agent}
                    </span>
                    <Badge className={`capitalize ${agent.status === 'running' ? 'bg-green-600' : agent.status === 'idle' ? 'bg-gray-600' : agent.status === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                      {agent.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Health Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600" style={{ width: `${agent.healthScore}%` }} />
                      </div>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${getHealthColor(agent.healthScore)}`}>
                        {agent.healthScore}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Active Workflows</p>
                      <p className="font-semibold">{agent.activeWorkflows}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Activity</p>
                      <p className="font-semibold text-xs">{new Date(agent.lastActivityAt).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {agent.errorCount && agent.errorCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded p-2">
                      <p className="text-xs font-semibold text-red-700">Errors: {agent.errorCount}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Global Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-3">
            {insights.map(insight => (
              <Card key={insight.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    {getSeverityIcon(insight.severity)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{insight.summary}</p>
                        <Badge
                          className={`capitalize ${
                            insight.severity === 'critical'
                              ? 'bg-red-600'
                              : insight.severity === 'warning'
                              ? 'bg-yellow-600'
                              : 'bg-blue-600'
                          }`}
                        >
                          {insight.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded capitalize">
                          {insight.theme.replace(/_/g, ' ')}
                        </span>
                        <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                        <span>From: {insight.sourceAgents.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Agent Communication Activity
              </CardTitle>
              <CardDescription>Real-time agent-to-agent messages and coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                  <span className="text-sm">Email → Coordination: share_insight (email_engagement_trend)</span>
                  <Badge variant="outline">3m ago</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                  <span className="text-sm">Analysis → Email: feedback (campaign_performance)</span>
                  <Badge variant="outline">8m ago</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                  <span className="text-sm">Coordination → Content: request_approval (launch_workflow)</span>
                  <Badge variant="outline" className="border-yellow-300">12m ago</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                  <span className="text-sm">Research → Analysis: notify_risk (market_volatility)</span>
                  <Badge variant="outline" className="border-red-300">15m ago</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                  <span className="text-sm">Content → Coordination: acknowledge (asset_ready)</span>
                  <Badge variant="outline">22m ago</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  System Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">847</p>
                <p className="text-xs text-gray-500 mt-1">operations / hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Avg Latency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1.2s</p>
                <p className="text-xs text-gray-500 mt-1">across all agents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-gray-500 mt-1">workflows running</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </p>
          <p className="mt-2">
            Phase 6 – Unified Intelligence Layer: Shared memory, agent state store, collaboration protocol, global insights, meta-reasoner,
            and intelligence telemetry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
