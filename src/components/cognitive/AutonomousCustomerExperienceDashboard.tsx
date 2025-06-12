'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Target,
  DollarSign,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  Brain,
  Star
} from 'lucide-react';

interface CustomerMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
}

interface ExperienceInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'satisfaction' | 'retention' | 'engagement' | 'support';
  score: number;
  recommendations: string[];
}

interface CustomerJourneyStage {
  id: string;
  name: string;
  satisfaction: number;
  dropoffRate: number;
  conversionRate: number;
  issues: string[];
}

interface DashboardData {
  metrics: CustomerMetric[];
  insights: ExperienceInsight[];
  journeyStages: CustomerJourneyStage[];
  overallSatisfaction: number;
  nps: number;
  churnRisk: number;
  engagementScore: number;
}

export default function AutonomousCustomerExperienceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch(`/api/customer-experience?period=${selectedPeriod}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load customer experience data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>;
      case 'low': return <Badge variant="default" className="bg-green-100 text-green-800">Low Impact</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'satisfaction': return <Heart className="h-4 w-4" />;
      case 'retention': return <Users className="h-4 w-4" />;
      case 'engagement': return <Zap className="h-4 w-4" />;
      case 'support': return <CheckCircle className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading customer experience data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load customer experience data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Experience Intelligence</h1>
          <p className="text-muted-foreground">
            Autonomous customer experience optimization and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate?.toLocaleString()}
          </div>
          <Button onClick={loadDashboardData} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Satisfaction</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(data.overallSatisfaction)}`}>
              {formatPercentage(data.overallSatisfaction)}
            </div>
            <Progress value={data.overallSatisfaction} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Promoter Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(data.nps + 50)}`}>
              {data.nps}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer loyalty metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(100 - data.churnRisk)}`}>
              {formatPercentage(data.churnRisk)}
            </div>
            <Progress value={data.churnRisk} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(data.engagementScore)}`}>
              {formatPercentage(data.engagementScore)}
            </div>
            <Progress value={data.engagementScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="insights">Experience Insights</TabsTrigger>
          <TabsTrigger value="journey">Customer Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Experience Metrics</CardTitle>
              <CardDescription>
                Real-time customer experience performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.metrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {formatPercentage(metric.value)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">
                        Target: {formatPercentage(metric.target)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experience Insights</CardTitle>
              <CardDescription>
                AI-powered insights for customer experience optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(insight.category)}
                        <h3 className="font-semibold">{insight.title}</h3>
                      </div>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Experience Score</span>
                        <span className={getScoreColor(insight.score)}>{insight.score}/100</span>
                      </div>
                      <Progress value={insight.score} className="h-2" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey Analysis</CardTitle>
              <CardDescription>
                Stage-by-stage customer experience analysis and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.journeyStages.map((stage, index) => (
                  <div key={stage.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold">{stage.name}</h3>
                      </div>
                      <div className={`text-sm font-medium ${getScoreColor(stage.satisfaction)}`}>
                        {formatPercentage(stage.satisfaction)} satisfaction
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Satisfaction</p>
                        <Progress value={stage.satisfaction} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Drop-off Rate</p>
                        <p className="text-sm font-medium text-red-600">{formatPercentage(stage.dropoffRate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversion Rate</p>
                        <p className="text-sm font-medium text-green-600">{formatPercentage(stage.conversionRate)}</p>
                      </div>
                    </div>
                    {stage.issues.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Key Issues:</p>
                        <div className="flex flex-wrap gap-2">
                          {stage.issues.map((issue, issueIndex) => (
                            <Badge key={issueIndex} variant="outline" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
