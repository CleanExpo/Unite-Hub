"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Brain, Zap, Calendar, DollarSign } from 'lucide-react';

interface DealProbabilityEngineProps {
  dealId?: string;
}

interface ProbabilityFactors {
  clientEngagement: number;
  budgetConfirmed: number;
  timelineAlignment: number;
  competitivePosition: number;
  stakeholderBuyIn: number;
  technicalFit: number;
}

interface ForecastData {
  period: string;
  revenue: number;
  confidence: number;
  deals: number;
}

interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive';
  successRate: number;
}

interface CompetitiveAnalysis {
  competitor: string;
  winRate: number;
  averageDealSize: number;
  keyStrengths: string[];
  vulnerabilities: string[];
}

// AI-Powered Deal Pipeline Optimization (Based on Agent Recommendations)
export default function DealProbabilityEngine({ dealId }: DealProbabilityEngineProps) {
  const [probability, setProbability] = useState(0);
  const [probabilityFactors, setProbabilityFactors] = useState<ProbabilityFactors>({
    clientEngagement: 85,
    budgetConfirmed: 70,
    timelineAlignment: 90,
    competitivePosition: 75,
    stakeholderBuyIn: 80,
    technicalFit: 95
  });

  const [forecast, setForecast] = useState<ForecastData[]>([
    { period: 'This Month', revenue: 485000, confidence: 85, deals: 12 },
    { period: 'Next Month', revenue: 620000, confidence: 78, deals: 15 },
    { period: 'Q1 2025', revenue: 1850000, confidence: 65, deals: 45 },
    { period: 'Q2 2025', revenue: 2100000, confidence: 55, deals: 52 }
  ]);

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'follow-up',
      trigger: 'No activity for 3 days',
      action: 'Send automated follow-up email',
      status: 'active',
      successRate: 68
    },
    {
      id: 'stage-progression',
      trigger: 'Meeting scheduled',
      action: 'Auto-advance to next stage',
      status: 'active',
      successRate: 92
    },
    {
      id: 'risk-alert',
      trigger: 'Deal probability drops below 50%',
      action: 'Alert sales manager',
      status: 'active',
      successRate: 78
    },
    {
      id: 'proposal-reminder',
      trigger: 'Proposal pending for 5 days',
      action: 'Reminder to sales rep',
      status: 'active',
      successRate: 55
    }
  ]);

  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysis[]>([
    {
      competitor: 'CompetitorA',
      winRate: 35,
      averageDealSize: 45000,
      keyStrengths: ['Lower price', 'Faster implementation'],
      vulnerabilities: ['Limited features', 'Poor support']
    },
    {
      competitor: 'CompetitorB',
      winRate: 28,
      averageDealSize: 75000,
      keyStrengths: ['Market leader', 'Brand recognition'],
      vulnerabilities: ['High cost', 'Complex setup']
    },
    {
      competitor: 'CompetitorC',
      winRate: 22,
      averageDealSize: 35000,
      keyStrengths: ['Good UI/UX', 'Modern tech stack'],
      vulnerabilities: ['New player', 'Limited track record']
    }
  ]);

  useEffect(() => {
    // Calculate AI-powered deal probability
    const calculateProbability = () => {
      const factors = Object.values(probabilityFactors);
      const weightedAverage = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
      setProbability(Math.round(weightedAverage));
    };

    calculateProbability();
  }, [probabilityFactors, dealId]);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-green-600';
    if (prob >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBadge = (prob: number) => {
    if (prob >= 80) return <Badge className="bg-green-100 text-green-800">High Probability</Badge>;
    if (prob >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Probability</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Probability</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* AI Deal Probability Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Deal Probability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${getProbabilityColor(probability)} mb-2`}>
              {probability}%
            </div>
            <p className="text-lg text-muted-foreground mb-2">Win Probability</p>
            {getProbabilityBadge(probability)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(probabilityFactors).map(([factor, value]) => (
              <div key={factor} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI-Enhanced Pipeline Tabs */}
      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecasting">
            <TrendingUp className="w-4 h-4 mr-2" />
            AI Forecasting
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation Rules
          </TabsTrigger>
          <TabsTrigger value="competitive">
            <Target className="w-4 h-4 mr-2" />
            Competitive Analysis
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting & Pipeline Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered revenue predictions with confidence intervals
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecast.map((period, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{period.period}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${period.revenue.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {period.deals} deals
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{period.confidence}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <Progress value={period.confidence} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Automation Rules</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent automation workflows with performance tracking
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">When: {rule.trigger}</h4>
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                          {rule.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Then: {rule.action}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold text-green-600">{rule.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Intelligence Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered competitive positioning and win/loss analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {competitiveAnalysis.map((comp, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-lg">{comp.competitor}</h4>
                      <div className="text-right">
                        <div className="text-lg font-bold">{comp.winRate}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-600 mb-2">Their Strengths</h5>
                        <ul className="space-y-1">
                          {comp.keyStrengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-600 mb-2">Their Vulnerabilities</h5>
                        <ul className="space-y-1">
                          {comp.vulnerabilities.map((vuln, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">• {vuln}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Avg Deal Size: </span>
                        <span className="font-medium">${comp.averageDealSize.toLocaleString()}</span>
                      </div>
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
              <CardTitle>AI-Generated Pipeline Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Machine learning recommendations for pipeline optimization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🎯 Priority Recommendation</h4>
                  <p className="text-sm text-blue-800">
                    Focus on deals with {'>'}80% technical fit and confirmed budget. These have 67% higher close rates.
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">📈 Opportunity Identified</h4>
                  <p className="text-sm text-green-800">
                    Deals with stakeholder buy-in {'>'}75% close 3.2x faster. Consider stakeholder mapping workshops.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Risk Alert</h4>
                  <p className="text-sm text-yellow-800">
                    7 deals show declining engagement scores. Immediate intervention recommended within 48 hours.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">🚀 Growth Opportunity</h4>
                  <p className="text-sm text-purple-800">
                    Competitive analysis suggests focusing on technical differentiation increases win rate by 24%.
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
