/**
 * AI Personalization Dashboard Component
 * 
 * This component provides a comprehensive dashboard for AI-powered features including:
 * - Personalization insights
 * - Content recommendations
 * - User behavior analytics
 * - AI model performance
 * - Automation workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Zap, 
  Eye,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb
} from 'lucide-react';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  status: 'active' | 'implemented' | 'dismissed';
  recommendations: string[];
  created_at: string;
}

interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  relevance_score: number;
  confidence: number;
  reasoning: string[];
  recommendation_type: string;
}

interface PersonalizationMetrics {
  total_users: number;
  personalized_sessions: number;
  improvement_rate: number;
  conversion_lift: number;
  engagement_increase: number;
  content_recommendations: number;
}

interface AIModelStatus {
  id: string;
  name: string;
  status: 'training' | 'deployed' | 'testing';
  accuracy: number;
  last_updated: string;
  version: string;
}

const AIPersonalizationDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [metrics, setMetrics] = useState<PersonalizationMetrics>({
    total_users: 0,
    personalized_sessions: 0,
    improvement_rate: 0,
    conversion_lift: 0,
    engagement_increase: 0,
    content_recommendations: 0
  });
  const [modelStatus, setModelStatus] = useState<AIModelStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - in production, these would be real API endpoints
      const [insightsData, recommendationsData, metricsData, modelsData] = await Promise.all([
        fetchInsights(),
        fetchRecommendations(),
        fetchMetrics(),
        fetchModelStatus()
      ]);

      setInsights(insightsData);
      setRecommendations(recommendationsData);
      setMetrics(metricsData);
      setModelStatus(modelsData);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data functions - in production, these would be real API calls
  const fetchInsights = async (): Promise<AIInsight[]> => {
    return [
      {
        id: '1',
        title: 'High-Value User Segment Identified',
        description: 'Users from technology sector show 3x higher consultation conversion rate',
        impact_score: 9,
        confidence: 0.92,
        status: 'active',
        recommendations: [
          'Create technology-specific landing pages',
          'Increase targeted content for tech industry',
          'Implement personalized pricing for enterprise clients'
        ],
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Optimal Engagement Time Window',
        description: 'Peak user engagement occurs between 2-4 PM on weekdays',
        impact_score: 7,
        confidence: 0.85,
        status: 'active',
        recommendations: [
          'Schedule email campaigns for 2-4 PM',
          'Increase live chat availability during peak hours',
          'Launch time-sensitive offers during optimal windows'
        ],
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Content Personalization Opportunity',
        description: 'Users prefer case studies over blog posts by 2:1 ratio',
        impact_score: 6,
        confidence: 0.78,
        status: 'implemented',
        recommendations: [
          'Prioritize case study content creation',
          'Convert top blog posts to case study format',
          'Recommend case studies to new visitors'
        ],
        created_at: new Date().toISOString()
      }
    ];
  };

  const fetchRecommendations = async (): Promise<ContentRecommendation[]> => {
    return [
      {
        id: '1',
        title: 'Enterprise Digital Transformation Case Study',
        description: 'How we helped a Fortune 500 company modernize their digital infrastructure',
        relevance_score: 0.94,
        confidence: 0.89,
        reasoning: ['User viewed enterprise content 3x', 'Similar users converted at 40% rate'],
        recommendation_type: 'behavioral'
      },
      {
        id: '2',
        title: 'Cloud Migration Best Practices Guide',
        description: 'Comprehensive guide for planning and executing cloud migrations',
        relevance_score: 0.87,
        confidence: 0.82,
        reasoning: ['Strong correlation with user industry', 'High engagement on related topics'],
        recommendation_type: 'content_based'
      },
      {
        id: '3',
        title: '$550 Technology Consultation Booking',
        description: 'Book a consultation to discuss your technology needs',
        relevance_score: 0.91,
        confidence: 0.95,
        reasoning: ['User in target segment', 'Viewed pricing page multiple times'],
        recommendation_type: 'contextual'
      }
    ];
  };

  const fetchMetrics = async (): Promise<PersonalizationMetrics> => {
    return {
      total_users: 2847,
      personalized_sessions: 1892,
      improvement_rate: 34.5,
      conversion_lift: 28.3,
      engagement_increase: 42.1,
      content_recommendations: 15623
    };
  };

  const fetchModelStatus = async (): Promise<AIModelStatus[]> => {
    return [
      {
        id: '1',
        name: 'Content Recommendation Engine',
        status: 'deployed',
        accuracy: 0.94,
        last_updated: '2 hours ago',
        version: 'v2.1.3'
      },
      {
        id: '2',
        name: 'User Segmentation Model',
        status: 'deployed',
        accuracy: 0.87,
        last_updated: '1 day ago',
        version: 'v1.8.2'
      },
      {
        id: '3',
        name: 'Churn Prediction Model',
        status: 'training',
        accuracy: 0.82,
        last_updated: '5 hours ago',
        version: 'v1.5.1'
      },
      {
        id: '4',
        name: 'Lead Quality Scorer',
        status: 'testing',
        accuracy: 0.91,
        last_updated: '3 hours ago',
        version: 'v2.0.0-beta'
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'testing': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-yellow-100 text-yellow-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-teal-600" />
            AI Personalization Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor AI-powered personalization performance and insights
          </p>
        </div>
        <Button onClick={fetchAIData} className="bg-teal-600 hover:bg-teal-700">
          <Settings className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_users.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.personalized_sessions.toLocaleString()} personalized sessions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Lift</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{metrics.conversion_lift}%</div>
            <div className="text-xs text-muted-foreground">
              vs non-personalized experiences
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Increase</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+{metrics.engagement_increase}%</div>
            <div className="text-xs text-muted-foreground">
              average session duration improvement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Model Status
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription>{insight.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getInsightStatusColor(insight.status)}>
                        {insight.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">Impact: {insight.impact_score}/10</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(insight.confidence * 100)}% confident
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Recommendations:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <CardDescription>{rec.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Score: {Math.round(rec.relevance_score * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(rec.confidence * 100)}% confident
                      </div>
                      <Badge className="mt-1">
                        {rec.recommendation_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Why recommended:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      {rec.reasoning.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Model Status Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {modelStatus.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(model.status)}
                        {model.name}
                      </CardTitle>
                      <CardDescription>Version {model.version}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span>{Math.round(model.accuracy * 100)}%</span>
                      </div>
                      <Progress value={model.accuracy * 100} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last updated: {model.last_updated}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalization Performance</CardTitle>
                <CardDescription>
                  Overall improvement metrics from AI personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Conversion Rate Improvement</span>
                    <span>+{metrics.conversion_lift}%</span>
                  </div>
                  <Progress value={metrics.conversion_lift} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement Increase</span>
                    <span>+{metrics.engagement_increase}%</span>
                  </div>
                  <Progress value={metrics.engagement_increase} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Improvement Rate</span>
                    <span>+{metrics.improvement_rate}%</span>
                  </div>
                  <Progress value={metrics.improvement_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Recommendations</CardTitle>
                <CardDescription>
                  AI-powered content recommendation statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600 mb-2">
                    {metrics.content_recommendations.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total recommendations delivered
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Averaging {Math.round(metrics.content_recommendations / metrics.total_users)} 
                    recommendations per user
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPersonalizationDashboard;
