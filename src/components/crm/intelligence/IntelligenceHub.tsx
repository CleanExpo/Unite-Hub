"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Target, 
  DollarSign, 
  Zap,
  BarChart3,
  Clock,
  Lightbulb,
  Activity
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'opportunity' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  source: 'clients' | 'deals' | 'financial' | 'tasks';
  actionable: boolean;
  timestamp: Date;
}

interface AIPerformanceMetric {
  component: string;
  accuracy: number;
  predictions: number;
  recommendations: number;
  automations: number;
  status: 'healthy' | 'warning' | 'error';
}

interface CrossComponentIntelligence {
  clientHealthImpact: number;
  dealProbabilityBoost: number;
  revenueOptimization: number;
  taskEfficiency: number;
  overallIntelligence: number;
}

// AI Intelligence Hub - Unified Overview Dashboard
export default function IntelligenceHub() {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: 'insight-1',
      type: 'recommendation',
      title: 'High-Priority Client Opportunity',
      description: 'Enterprise Corp shows 95% financial health score and high engagement. Recommend upselling premium services.',
      confidence: 94,
      impact: 'high',
      source: 'clients',
      actionable: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'insight-2',
      type: 'alert',
      title: 'Deal Pipeline Risk Detected',
      description: 'Client onboarding automation deal has 87% delay probability. Immediate intervention recommended.',
      confidence: 87,
      impact: 'critical',
      source: 'deals',
      actionable: true,
      timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: 'insight-3',
      type: 'prediction',
      title: 'Revenue Forecast Update',
      description: 'Q1 2025 revenue prediction increased to $1.85M (65% confidence) based on current pipeline trends.',
      confidence: 65,
      impact: 'high',
      source: 'financial',
      actionable: false,
      timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      id: 'insight-4',
      type: 'opportunity',
      title: 'Task Optimization Opportunity',
      description: 'Code review bottleneck affecting 12 tasks. Adding senior reviewers could improve velocity by 25%.',
      confidence: 78,
      impact: 'medium',
      source: 'tasks',
      actionable: true,
      timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
    },
    {
      id: 'insight-5',
      type: 'recommendation',
      title: 'Cross-Component Intelligence',
      description: 'Clients with >80% technical fit and confirmed budget have 67% higher close rates across all deals.',
      confidence: 91,
      impact: 'high',
      source: 'deals',
      actionable: true,
      timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    }
  ]);

  const [aiMetrics, setAiMetrics] = useState<AIPerformanceMetric[]>([
    {
      component: 'Client Intelligence',
      accuracy: 92,
      predictions: 156,
      recommendations: 24,
      automations: 8,
      status: 'healthy'
    },
    {
      component: 'Deal Analytics',
      accuracy: 88,
      predictions: 89,
      recommendations: 18,
      automations: 12,
      status: 'healthy'
    },
    {
      component: 'Financial Intelligence',
      accuracy: 95,
      predictions: 204,
      recommendations: 31,
      automations: 15,
      status: 'healthy'
    },
    {
      component: 'Task Intelligence',
      accuracy: 87,
      predictions: 147,
      recommendations: 22,
      automations: 9,
      status: 'warning'
    }
  ]);

  const [crossComponentIntelligence, setCrossComponentIntelligence] = useState<CrossComponentIntelligence>({
    clientHealthImpact: 85,
    dealProbabilityBoost: 67,
    revenueOptimization: 23,
    taskEfficiency: 34,
    overallIntelligence: 78
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string, impact: string) => {
    if (type === 'alert') return 'bg-red-50 border-red-200 text-red-800';
    if (impact === 'critical') return 'bg-red-50 border-red-200 text-red-800';
    if (impact === 'high') return 'bg-blue-50 border-blue-200 text-blue-800';
    if (impact === 'medium') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'clients': return <Users className="h-4 w-4" />;
      case 'deals': return <Target className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'tasks': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* AI Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall AI Intelligence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{crossComponentIntelligence.overallIntelligence}%</div>
            <p className="text-xs text-muted-foreground">
              Cross-component synergy active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              {aiInsights.filter(i => i.actionable).length} actionable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiMetrics.reduce((sum, metric) => sum + metric.predictions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiMetrics.reduce((sum, metric) => sum + metric.automations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active workflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            AI Performance
          </TabsTrigger>
          <TabsTrigger value="cross-component">
            <Brain className="w-4 h-4 mr-2" />
            Cross-Component Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time AI Insights & Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live intelligence feed from all AI components with actionable recommendations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.id} className={`border rounded-lg p-4 ${getInsightColor(insight.type, insight.impact)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getSourceIcon(insight.source)}
                        <span>{formatTimeAgo(insight.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{insight.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={insight.impact === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.impact.toUpperCase()} IMPACT
                        </Badge>
                        <Badge 
                          variant={insight.type === 'alert' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {insight.type.toUpperCase()}
                        </Badge>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Component Performance Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time performance monitoring and health status of all AI components
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {aiMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-lg">{metric.component}</h4>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                          {metric.status.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">Status</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                        <Progress value={metric.accuracy} className="h-2" />
                        <div className="text-sm font-medium">{metric.accuracy}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Predictions</div>
                        <div className="text-lg font-bold">{metric.predictions}</div>
                        <div className="text-xs text-muted-foreground">This week</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Recommendations</div>
                        <div className="text-lg font-bold">{metric.recommendations}</div>
                        <div className="text-xs text-muted-foreground">Generated</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Automations</div>
                        <div className="text-lg font-bold">{metric.automations}</div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-component" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Component AI Intelligence</CardTitle>
              <p className="text-sm text-muted-foreground">
                Unified intelligence showing how AI components work together to optimize business outcomes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {crossComponentIntelligence.overallIntelligence}%
                  </div>
                  <p className="text-lg font-medium">Overall Intelligence Score</p>
                  <p className="text-sm text-muted-foreground">
                    Based on cross-component analysis and synergy
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Intelligence Impact Areas</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Client Health Optimization</span>
                          <span>{crossComponentIntelligence.clientHealthImpact}%</span>
                        </div>
                        <Progress value={crossComponentIntelligence.clientHealthImpact} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Deal Probability Enhancement</span>
                          <span>{crossComponentIntelligence.dealProbabilityBoost}%</span>
                        </div>
                        <Progress value={crossComponentIntelligence.dealProbabilityBoost} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Revenue Optimization</span>
                          <span>{crossComponentIntelligence.revenueOptimization}%</span>
                        </div>
                        <Progress value={crossComponentIntelligence.revenueOptimization} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Task Efficiency Improvement</span>
                          <span>{crossComponentIntelligence.taskEfficiency}%</span>
                        </div>
                        <Progress value={crossComponentIntelligence.taskEfficiency} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">AI Synergy Examples</h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-1">Client-Deal Synergy</h5>
                        <p className="text-sm text-blue-800">
                          High client health scores boost deal probability by an average of 23%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-1">Financial-Task Intelligence</h5>
                        <p className="text-sm text-green-800">
                          Revenue forecasting accuracy improves 15% when task completion data is included
                        </p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-1">Predictive Automation</h5>
                        <p className="text-sm text-purple-800">
                          Cross-component predictions enable 34% faster decision making
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
