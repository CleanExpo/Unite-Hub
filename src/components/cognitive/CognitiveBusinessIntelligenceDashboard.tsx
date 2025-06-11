'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  Lightbulb,
  Eye
} from 'lucide-react';

interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'operations' | 'customer' | 'market';
  confidence: number;
}

interface CognitiveInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  priority: 'high' | 'medium' | 'low';
  impact: number;
  confidence: number;
  recommendations: string[];
  dataPoints: string[];
}

interface PredictiveModel {
  id: string;
  name: string;
  accuracy: number;
  lastTrained: Date;
  predictions: {
    metric: string;
    value: number;
    confidence: number;
    timeframe: string;
  }[];
}

interface DashboardData {
  metrics: BusinessMetric[];
  insights: CognitiveInsight[];
  models: PredictiveModel[];
  overallIntelligenceScore: number;
  dataQualityScore: number;
  predictionAccuracy: number;
  anomaliesDetected: number;
}

export default function CognitiveBusinessIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, [selectedCategory]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch(`/api/business-intelligence?category=${selectedCategory}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load business intelligence data:', error);
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

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'anomaly': return <Eye className="h-4 w-4 text-purple-600" />;
      default: return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low': return <Badge variant="default" className="bg-green-100 text-green-800">Low Priority</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'operations': return <Zap className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'market': return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number, category: string) => {
    if (category === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading business intelligence...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load business intelligence data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cognitive Business Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered business insights and predictive analytics
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
            <CardTitle className="text-sm font-medium">Intelligence Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallIntelligenceScore}/100</div>
            <Progress value={data.overallIntelligenceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.dataQualityScore)}</div>
            <Progress value={data.dataQualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.predictionAccuracy)}</div>
            <p className="text-xs text-muted-foreground">
              Model performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.anomaliesDetected}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Cognitive Insights</TabsTrigger>
          <TabsTrigger value="metrics">Business Metrics</TabsTrigger>
          <TabsTrigger value="models">Predictive Models</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cognitive Insights</CardTitle>
              <CardDescription>
                AI-generated business insights and strategic recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getInsightTypeIcon(insight.type)}
                        <h3 className="font-semibold">{insight.title}</h3>
                      </div>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Impact Score</p>
                        <p className="font-medium">{insight.impact}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="font-medium">{formatPercentage(insight.confidence)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{insight.type}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Data Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.dataPoints.map((point, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {point}
                          </Badge>
                        ))}
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

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>
                Key business performance indicators with AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.metrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(metric.category)}
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {formatValue(metric.value, metric.category)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">
                        {formatPercentage(metric.confidence)} confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Models</CardTitle>
              <CardDescription>
                AI models performance and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{model.name}</h3>
                      <Badge variant={model.accuracy >= 80 ? 'default' : 'secondary'}>
                        {formatPercentage(model.accuracy)} accuracy
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Model Accuracy</p>
                      <Progress value={model.accuracy} className="h-2" />
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">
                        Last trained: {model.lastTrained.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Current Predictions:</p>
                      <div className="space-y-2">
                        {model.predictions.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{prediction.metric}</span>
                            <div className="text-right">
                              <div className="font-medium">{prediction.value.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatPercentage(prediction.confidence)} confidence
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
