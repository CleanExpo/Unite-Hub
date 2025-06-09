"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target,
  Zap,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';

interface LearningModel {
  id: string;
  name: string;
  category: 'user-behavior' | 'business-pattern' | 'performance' | 'prediction';
  accuracy: number;
  improvements: number;
  learningRate: number;
  dataPoints: number;
  lastUpdate: Date;
  insights: string[];
}

interface UserInteraction {
  id: string;
  action: string;
  outcome: 'successful' | 'failed' | 'neutral';
  context: string;
  improvementScore: number;
  timestamp: Date;
}

interface ModelAdaptation {
  modelId: string;
  adaptationType: 'accuracy' | 'efficiency' | 'personalization' | 'prediction';
  beforeScore: number;
  afterScore: number;
  improvement: number;
  confidence: number;
}

// Adaptive Learning Engine - Continuous Model Improvement
export default function AdaptiveLearningEngine() {
  const [learningModels] = useState<LearningModel[]>([
    {
      id: 'model-1',
      name: 'User Behavior Prediction',
      category: 'user-behavior',
      accuracy: 0.89,
      improvements: 23,
      learningRate: 0.15,
      dataPoints: 5847,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      insights: [
        'Users prefer visual data over text by 67%',
        'Dashboard customization increases engagement by 34%',
        'Mobile usage peaks at 2-4 PM daily'
      ]
    },
    {
      id: 'model-2', 
      name: 'Deal Success Pattern Recognition',
      category: 'business-pattern',
      accuracy: 0.94,
      improvements: 18,
      learningRate: 0.12,
      dataPoints: 3421,
      lastUpdate: new Date(Date.now() - 8 * 60 * 1000),
      insights: [
        'Follow-up timing is crucial - 24h window optimal',
        'Decision makers prefer phone over email 3:1',
        'Proposals under 5 pages have 2x success rate'
      ]
    },
    {
      id: 'model-3',
      name: 'System Performance Optimization',
      category: 'performance',
      accuracy: 0.92,
      improvements: 31,
      learningRate: 0.18,
      dataPoints: 7234,
      lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
      insights: [
        'Peak usage optimization reduces load time by 23%',
        'Caching strategy adaptation improves response 45%',
        'User workflow patterns enable predictive loading'
      ]
    },
    {
      id: 'model-4',
      name: 'Revenue Prediction Enhancement',
      category: 'prediction',
      accuracy: 0.87,
      improvements: 26,
      learningRate: 0.14,
      dataPoints: 2156,
      lastUpdate: new Date(Date.now() - 12 * 60 * 1000),
      insights: [
        'Seasonal patterns affect accuracy by +/- 8%',
        'Client size correlation strengthens over time',
        'Economic indicators improve long-term forecasting'
      ]
    }
  ]);

  const [userInteractions] = useState<UserInteraction[]>([
    {
      id: 'int-1',
      action: 'Dashboard Layout Change',
      outcome: 'successful',
      context: 'User moved analytics widget to top position',
      improvementScore: 0.15,
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 'int-2',
      action: 'Filter Preference Update',
      outcome: 'successful',
      context: 'User consistently uses date range filter',
      improvementScore: 0.22,
      timestamp: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      id: 'int-3',
      action: 'Report Generation Pattern',
      outcome: 'successful',
      context: 'Weekly reports generated every Monday 9 AM',
      improvementScore: 0.18,
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    }
  ]);

  const [modelAdaptations] = useState<ModelAdaptation[]>([
    {
      modelId: 'model-1',
      adaptationType: 'personalization',
      beforeScore: 0.82,
      afterScore: 0.89,
      improvement: 0.07,
      confidence: 0.94
    },
    {
      modelId: 'model-2',
      adaptationType: 'accuracy',
      beforeScore: 0.87,
      afterScore: 0.94,
      improvement: 0.07,
      confidence: 0.91
    },
    {
      modelId: 'model-3',
      adaptationType: 'efficiency',
      beforeScore: 0.76,
      afterScore: 0.92,
      improvement: 0.16,
      confidence: 0.96
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user-behavior': return 'bg-blue-100 text-blue-800';
      case 'business-pattern': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'prediction': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'successful': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getAdaptationColor = (adaptationType: string) => {
    switch (adaptationType) {
      case 'accuracy': return 'bg-green-100 text-green-800';
      case 'efficiency': return 'bg-blue-100 text-blue-800';
      case 'personalization': return 'bg-purple-100 text-purple-800';
      case 'prediction': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const averageAccuracy = learningModels.reduce((sum, model) => sum + model.accuracy, 0) / learningModels.length;
  const totalImprovements = learningModels.reduce((sum, model) => sum + model.improvements, 0);
  const averageLearningRate = learningModels.reduce((sum, model) => sum + model.learningRate, 0) / learningModels.length;

  return (
    <div className="space-y-6">
      {/* Adaptive Learning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(averageAccuracy * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Continuous improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Improvements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImprovements}</div>
            <p className="text-xs text-muted-foreground">Model adaptations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageLearningRate * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Adaptation speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningModels.length}</div>
            <p className="text-xs text-muted-foreground">Learning systems</p>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Learning Tabs */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">
            <Brain className="w-4 h-4 mr-2" />
            Learning Models
          </TabsTrigger>
          <TabsTrigger value="interactions">
            <Users className="w-4 h-4 mr-2" />
            User Interactions
          </TabsTrigger>
          <TabsTrigger value="adaptations">
            <Activity className="w-4 h-4 mr-2" />
            Model Adaptations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Self-Improving AI Models</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI models that learn from user interactions and continuously improve performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {learningModels.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-lg mb-1">{model.name}</h4>
                        <Badge className={getCategoryColor(model.category)}>
                          {model.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{(model.accuracy * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Improvements</div>
                        <div className="font-medium">{model.improvements}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Learning Rate</div>
                        <Progress value={model.learningRate * 100} className="h-2" />
                        <div className="text-xs">{(model.learningRate * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Data Points</div>
                        <div className="font-medium">{model.dataPoints.toLocaleString()}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Last Update</div>
                        <div className="font-medium">{formatTimeAgo(model.lastUpdate)}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                      <h6 className="font-medium mb-2">Learning Insights</h6>
                      <ul className="text-sm space-y-1">
                        {model.insights.map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {insight}
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

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Interaction Learning</CardTitle>
              <p className="text-sm text-muted-foreground">
                System learns from user behavior patterns and preferences to optimize experiences
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userInteractions.map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{interaction.action}</h4>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${getOutcomeColor(interaction.outcome)}`} />
                        <span className="text-sm capitalize">{interaction.outcome}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{interaction.context}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Improvement Score</div>
                        <Progress value={interaction.improvementScore * 100} className="h-2" />
                        <div className="text-sm font-medium">+{(interaction.improvementScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Recorded</div>
                        <div className="text-sm font-medium">{formatTimeAgo(interaction.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Model Adaptations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live tracking of AI model improvements and performance enhancements
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelAdaptations.map((adaptation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Model {adaptation.modelId.split('-')[1]} Adaptation</h4>
                      <Badge className={getAdaptationColor(adaptation.adaptationType)}>
                        {adaptation.adaptationType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Before</div>
                        <div className="font-medium">{(adaptation.beforeScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">After</div>
                        <div className="font-medium text-green-600">{(adaptation.afterScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Improvement</div>
                        <div className="font-medium text-blue-600">+{(adaptation.improvement * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className="font-medium">{(adaptation.confidence * 100).toFixed(0)}%</div>
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
