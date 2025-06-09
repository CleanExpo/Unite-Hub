"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Target, Brain, Network } from 'lucide-react';

interface ClientAnalyticsProps {
  clientId?: string;
}

interface ClientSegment {
  id: string;
  name: string;
  criteria: string;
  count: number;
  color: string;
}

interface LeadScore {
  score: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendation: string;
}

interface RelationshipMap {
  primaryContact: string;
  secondaryContacts: string[];
  decisionMakers: string[];
  influencers: string[];
  connectionStrength: number;
}

// AI-Powered Client Analytics Component (Based on Agent Recommendations)
export default function ClientAnalytics({ clientId }: ClientAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    activeClients: 0,
    conversionRate: 0,
    averageValue: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high',
    growthTrend: 0
  });

  const [segments, setSegments] = useState<ClientSegment[]>([
    {
      id: 'high-value',
      name: 'High Value Clients',
      criteria: 'Revenue > $10k/month',
      count: 24,
      color: 'bg-green-500'
    },
    {
      id: 'growing',
      name: 'Growing Accounts',
      criteria: 'Growth > 20% YoY',
      count: 18,
      color: 'bg-blue-500'
    },
    {
      id: 'at-risk',
      name: 'At Risk',
      criteria: 'No activity > 30 days',
      count: 7,
      color: 'bg-red-500'
    },
    {
      id: 'new',
      name: 'New Prospects',
      criteria: 'Added < 90 days',
      count: 15,
      color: 'bg-purple-500'
    }
  ]);

  const [leadScore, setLeadScore] = useState<LeadScore>({
    score: 85,
    factors: [
      { factor: 'Company Size', impact: 20, description: 'Enterprise level (500+ employees)' },
      { factor: 'Budget Authority', impact: 25, description: 'Direct budget control confirmed' },
      { factor: 'Engagement Level', impact: 15, description: 'High email/call response rate' },
      { factor: 'Timeline', impact: 10, description: 'Decision timeline: Q1 2025' },
      { factor: 'Pain Points', impact: 15, description: 'Multiple pain points identified' }
    ],
    recommendation: 'High-priority prospect. Schedule executive meeting within 7 days.'
  });

  const [relationshipMap, setRelationshipMap] = useState<RelationshipMap>({
    primaryContact: 'John Smith - VP Sales',
    secondaryContacts: ['Mary Johnson - Director', 'David Wilson - Manager'],
    decisionMakers: ['John Smith', 'CEO Sarah Adams'],
    influencers: ['IT Director Mike Brown', 'CFO Lisa Green'],
    connectionStrength: 78
  });

  useEffect(() => {
    // Simulate AI-powered analytics calculation
    const calculateAnalytics = () => {
      setAnalytics({
        totalClients: 156,
        activeClients: 142,
        conversionRate: 24.8,
        averageValue: 8750,
        riskLevel: 'low',
        growthTrend: 12.5
      });
    };

    calculateAnalytics();
  }, [clientId]);

  return (
    <div className="space-y-6">
      {/* AI-Powered Client Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeClients} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per client monthly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{analytics.growthTrend}%</div>
            <p className="text-xs text-muted-foreground">
              Year over year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI-Enhanced Analytics Tabs */}
      <Tabs defaultValue="segmentation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmentation">
            <Users className="w-4 h-4 mr-2" />
            Client Segmentation
          </TabsTrigger>
          <TabsTrigger value="lead-scoring">
            <Brain className="w-4 h-4 mr-2" />
            AI Lead Scoring
          </TabsTrigger>
          <TabsTrigger value="relationship-map">
            <Network className="w-4 h-4 mr-2" />
            Relationship Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segmentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Client Segmentation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent client categorization based on behavior and value patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {segments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-sm text-muted-foreground">{segment.criteria}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{segment.count} clients</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead-scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Lead Scoring Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Machine learning-powered lead qualification and prioritization
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{leadScore.score}/100</div>
                <p className="text-lg font-medium">Lead Score</p>
                <Badge variant="secondary" className="mt-2">High Priority</Badge>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Scoring Factors</h4>
                {leadScore.factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{factor.factor}</span>
                      <span>{factor.impact} points</span>
                    </div>
                    <Progress value={factor.impact} className="h-2" />
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">AI Recommendation</h4>
                <p className="text-sm text-blue-800">{leadScore.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationship-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Network Mapping</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visual representation of client relationships and influence patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{relationshipMap.connectionStrength}%</div>
                <p className="text-lg font-medium">Connection Strength</p>
                <Progress value={relationshipMap.connectionStrength} className="mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Key Contacts</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-900">Primary Contact</div>
                      <div className="text-sm text-green-800">{relationshipMap.primaryContact}</div>
                    </div>
                    {relationshipMap.secondaryContacts.map((contact, index) => (
                      <div key={index} className="p-2 bg-gray-50 border rounded-lg">
                        <div className="text-sm">{contact}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Decision Network</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-1">Decision Makers</div>
                      {relationshipMap.decisionMakers.map((dm, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          {dm}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 mb-1">Influencers</div>
                      {relationshipMap.influencers.map((inf, index) => (
                        <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          {inf}
                        </div>
                      ))}
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
