'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  Brain,
  Zap
} from 'lucide-react';

interface FinancialMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  probability: number;
  timeframe: string;
  value: number;
  confidence: number;
  recommendations: string[];
}

interface DashboardData {
  metrics: FinancialMetric[];
  insights: PredictiveInsight[];
  totalRevenue: number;
  projectedRevenue: number;
  riskScore: number;
  opportunityScore: number;
}

export default function AdvancedFinancialIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch(`/api/financial-intelligence?timeframe=${selectedTimeframe}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load financial intelligence data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>;
      case 'low': return <Badge variant="default" className="bg-green-100 text-green-800">Low Impact</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading financial intelligence...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load financial intelligence data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered financial insights and predictive analytics
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.projectedRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Next period forecast
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.riskScore}/100</div>
            <Progress value={data.riskScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunity Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.opportunityScore}/100</div>
            <Progress value={data.opportunityScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Metrics</CardTitle>
              <CardDescription>
                Real-time financial performance indicators with AI-powered analysis
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
                      {formatCurrency(metric.value)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(metric.change)}
                      </span>
                      <span className="text-muted-foreground">
                        {metric.confidence}% confidence
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
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>
                AI-generated insights and recommendations for financial optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Probability</p>
                        <p className="font-medium">{insight.probability}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Timeframe</p>
                        <p className="font-medium">{insight.timeframe}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Potential Value</p>
                        <p className="font-medium">{formatCurrency(insight.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="font-medium">{insight.confidence}%</p>
                      </div>
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

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Financial Analysis</CardTitle>
              <CardDescription>
                Advanced AI-powered financial analysis and market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI Analysis Engine</h3>
                  <p className="text-muted-foreground">
                    Advanced financial analysis features coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
