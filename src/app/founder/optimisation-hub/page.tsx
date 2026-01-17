'use client';

/**
 * Founder Optimisation Hub Dashboard
 *
 * Provides founder-facing view of:
 * - Agent reward signals
 * - Optimization suggestions
 * - Auto-tuning with approval controls
 * - Strategy playbooks
 * - Workflow queue status
 * - Memory consolidation activity
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  Gauge,
  Lightbulb,
  Settings,
} from 'lucide-react';

interface RewardData {
  agent: string;
  dimension: string;
  average: number;
  trend: string;
}

interface OptimizationSuggestion {
  agent: string;
  area: string;
  suggestion: string;
  expectedImpact: string;
  confidence: number;
  requiresApproval: boolean;
}

interface StrategyPlay {
  id: string;
  name: string;
  theme: string;
  priority: 'low' | 'medium' | 'high';
  agents: string[];
}

export default function FounderOptimisationHubPage() {
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [strategies, setStrategies] = useState<StrategyPlay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setRewards([
        { agent: 'email', dimension: 'email_performance', average: 0.85, trend: 'improving' },
        { agent: 'research', dimension: 'research_quality', average: 0.78, trend: 'stable' },
        { agent: 'content', dimension: 'content_effectiveness', average: 0.72, trend: 'improving' },
        { agent: 'scheduling', dimension: 'scheduling_efficiency', average: 0.65, trend: 'declining' },
        { agent: 'analysis', dimension: 'analysis_accuracy', average: 0.82, trend: 'stable' },
        { agent: 'coordination', dimension: 'coordination_success', average: 0.68, trend: 'declining' },
      ]);

      setSuggestions([
        {
          agent: 'scheduling',
          area: 'performance',
          suggestion: 'Latency high (1450ms). Reduce concurrency or batch size.',
          expectedImpact: 'medium',
          confidence: 0.8,
          requiresApproval: false,
        },
        {
          agent: 'coordination',
          area: 'reward',
          suggestion: 'Reward signal declining. Review task dependencies and optimize critical path.',
          expectedImpact: 'high',
          confidence: 0.85,
          requiresApproval: true,
        },
        {
          agent: 'content',
          area: 'reward',
          suggestion: 'Leverage improving trend: expand volume and increase cadence.',
          expectedImpact: 'medium',
          confidence: 0.75,
          requiresApproval: false,
        },
      ]);

      setStrategies([
        {
          id: '1',
          name: 'Email Excellence Campaign',
          theme: 'email_engagement',
          priority: 'high',
          agents: ['email', 'analysis'],
        },
        {
          id: '2',
          name: 'Opportunity Acceleration',
          theme: 'opportunity',
          priority: 'high',
          agents: ['research', 'content', 'email', 'scheduling'],
        },
        {
          id: '3',
          name: 'Scheduling Optimization',
          theme: 'scheduling_efficiency',
          priority: 'medium',
          agents: ['scheduling', 'email'],
        },
      ]);

      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getRewardColor = (value: number) => {
    if (value >= 0.8) {
return 'bg-success-100 text-success-800';
}
    if (value >= 0.6) {
return 'bg-warning-100 text-warning-800';
}
    return 'bg-error-100 text-error-800';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
return <TrendingUp className="w-4 h-4 text-success-600" />;
}
    if (trend === 'declining') {
return <AlertTriangle className="w-4 h-4 text-error-600" />;
}
    return <Gauge className="w-4 h-4 text-text-muted" />;
  };

  if (loading) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-3xl font-bold">Optimisation Hub</h1>
        <p className="text-text-tertiary">Loading optimization dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Founder Optimisation Hub</h1>
        <p className="text-text-secondary mt-2">
          Reward-driven, safety-constrained optimization layer. Review agent rewards, optimization suggestions, and approved strategy playbooks.
        </p>
      </div>

      {/* Alert for declining agents */}
      <Alert className="border-warning-200 bg-warning-50 dark:bg-warning-950/30">
        <AlertTriangle className="h-4 w-4 text-warning-600" />
        <AlertTitle>Optimization Opportunities</AlertTitle>
        <AlertDescription>
          Scheduling agent latency and coordination reward both declining. Review optimization suggestions below.
        </AlertDescription>
      </Alert>

      {/* Tabbed Interface */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rewards">Agent Rewards</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        {/* Agent Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Agent Reward Signals
              </CardTitle>
              <CardDescription>
                Normalized performance metrics (0–1) indicating agent effectiveness in primary dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map(reward => (
                  <Card key={`${reward.agent}_${reward.dimension}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold capitalize">{reward.agent}</p>
                            <p className="text-xs text-text-tertiary capitalize">{reward.dimension.replace(/_/g, ' ')}</p>
                          </div>
                          {getTrendIcon(reward.trend)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-muted">Reward</span>
                            <Badge className={`capitalize ${getRewardColor(reward.average)}`}>
                              {(reward.average * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="w-full h-2 bg-bg-hover rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                reward.average >= 0.8
                                  ? 'bg-success-600'
                                  : reward.average >= 0.6
                                  ? 'bg-warning-600'
                                  : 'bg-error-600'
                              }`}
                              style={{ width: `${reward.average * 100}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-text-tertiary capitalize">Trend: {reward.trend}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Optimization Suggestions
              </CardTitle>
              <CardDescription>Auto-tuner recommendations based on rewards, metrics, and global insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map((s, idx) => (
                <Card key={idx} className="bg-bg-raised">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="capitalize">{s.agent}</Badge>
                            <Badge variant="outline" className="capitalize">
                              {s.area}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{s.suggestion}</p>
                        </div>
                        {s.requiresApproval && <AlertTriangle className="w-5 h-5 text-accent-600 flex-shrink-0" />}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-text-muted">Impact</p>
                          <p className="font-semibold capitalize">{s.expectedImpact}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Confidence</p>
                          <p className="font-semibold">{(s.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {s.requiresApproval ? (
                          <>
                            <Button size="sm" variant="default">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Badge className="bg-success-600">Auto-Applied</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Strategy Playbooks
              </CardTitle>
              <CardDescription>High-level coordinated workflows synthesized from global insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strategies.map(strategy => (
                <Card key={strategy.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{strategy.name}</p>
                            <Badge className={strategy.priority === 'high' ? 'bg-error-600' : 'bg-warning-600'}>
                              {strategy.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-tertiary capitalize">{strategy.theme.replace(/_/g, ' ')}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-text-muted mb-2">Agents Involved</p>
                        <div className="flex flex-wrap gap-1">
                          {strategy.agents.map(agent => (
                            <Badge key={agent} variant="outline" className="capitalize">
                              {agent}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          Launch
                        </Button>
                        <Button size="sm" variant="outline">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Optimization Controls
              </CardTitle>
              <CardDescription>Manual controls and configuration for the optimization layer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Run Auto-Tuner</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Execute optimization suggestions within safety envelope (auto-apply low-risk changes, flag high-risk for approval)
                    </p>
                  </div>
                  <Button className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Run Auto-Tuner Now
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Consolidate Memory</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Move high-importance working memory to long-term storage and archive expiring short-term items
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Consolidate Now
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Review Workflow Queue</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Check pending and active workflows from strategy playbooks. Estimated execution time: 2h 15m
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Workflow Status
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Risk Safety Profile</h4>
                    <p className="text-xs text-text-muted mb-3">
                      Current Profile: <span className="font-semibold">Default (Conservative)</span>
                    </p>
                    <p className="text-xs text-text-muted">Max Risk Level: HIGH | Approval Required For: MEDIUM+</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Adjust Safety Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-info-50 dark:bg-info-950/20 border-info-200">
        <CardContent className="pt-6 text-sm text-text-secondary">
          <p>
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </p>
          <p className="mt-2">
            Phase 7 – Advanced Coordination & Optimization: Reward engine, optimization engine, safety-constrained auto-tuner, strategy synthesiser,
            memory consolidator, unified workflow router, and founder oversight dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
