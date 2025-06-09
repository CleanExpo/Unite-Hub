"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertTriangle, Zap, Calendar, BarChart3 } from 'lucide-react';

interface FinancialAnalyticsProps {
  clientId?: string;
}

interface RevenueForecasting {
  period: string;
  predicted: number;
  actual?: number;
  confidence: number;
  variance?: number;
}

interface PaymentPrediction {
  invoiceId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  predictedPaymentDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
}

interface FinancialHealthScore {
  clientId: string;
  clientName: string;
  score: number;
  cashFlowHealth: number;
  paymentHistory: number;
  creditRisk: number;
  engagement: number;
  recommendation: string;
}

interface AutomatedWorkflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  executionCount: number;
  successRate: number;
}

interface CashFlowAnalysis {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  runway: number;
}

// AI-Powered Financial Intelligence (Based on Agent Recommendations)
export default function FinancialAnalytics({ clientId }: FinancialAnalyticsProps) {
  const [overallHealth, setOverallHealth] = useState({
    score: 87,
    trend: 'positive',
    revenue: 2850000,
    growthRate: 15.4,
    cashFlow: 485000,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });

  const [revenueForecasting, setRevenueForecasting] = useState<RevenueForecasting[]>([
    { period: 'Dec 2024', predicted: 485000, actual: 492000, confidence: 92, variance: 1.4 },
    { period: 'Jan 2025', predicted: 520000, actual: 518000, confidence: 90, variance: -0.4 },
    { period: 'Feb 2025', predicted: 575000, confidence: 88 },
    { period: 'Mar 2025', predicted: 620000, confidence: 85 },
    { period: 'Apr 2025', predicted: 680000, confidence: 82 },
    { period: 'May 2025', predicted: 720000, confidence: 78 }
  ]);

  const [paymentPredictions, setPaymentPredictions] = useState<PaymentPrediction[]>([
    {
      invoiceId: 'INV-2024-001',
      clientName: 'TechCorp Solutions',
      amount: 25000,
      dueDate: '2024-12-15',
      predictedPaymentDate: '2024-12-18',
      riskLevel: 'low',
      probability: 94
    },
    {
      invoiceId: 'INV-2024-002',
      clientName: 'Global Industries',
      amount: 45000,
      dueDate: '2024-12-20',
      predictedPaymentDate: '2024-12-28',
      riskLevel: 'medium',
      probability: 76
    },
    {
      invoiceId: 'INV-2024-003',
      clientName: 'StartupXYZ',
      amount: 12000,
      dueDate: '2024-12-10',
      predictedPaymentDate: '2025-01-15',
      riskLevel: 'high',
      probability: 45
    }
  ]);

  const [healthScores, setHealthScores] = useState<FinancialHealthScore[]>([
    {
      clientId: 'client-1',
      clientName: 'Enterprise Corp',
      score: 95,
      cashFlowHealth: 98,
      paymentHistory: 95,
      creditRisk: 92,
      engagement: 96,
      recommendation: 'Excellent financial health. Consider upselling opportunities.'
    },
    {
      clientId: 'client-2',
      clientName: 'Growth Startup',
      score: 68,
      cashFlowHealth: 65,
      paymentHistory: 78,
      creditRisk: 60,
      engagement: 70,
      recommendation: 'Monitor cash flow closely. Consider payment terms adjustment.'
    },
    {
      clientId: 'client-3',
      clientName: 'Stable SMB',
      score: 82,
      cashFlowHealth: 85,
      paymentHistory: 88,
      creditRisk: 75,
      engagement: 80,
      recommendation: 'Solid financial partner. Maintain current terms.'
    }
  ]);

  const [automatedWorkflows, setAutomatedWorkflows] = useState<AutomatedWorkflow[]>([
    {
      id: 'auto-invoice',
      name: 'Automated Invoice Generation',
      trigger: 'Monthly recurring billing date',
      action: 'Generate and send invoice automatically',
      status: 'active',
      executionCount: 156,
      successRate: 98.7
    },
    {
      id: 'payment-reminder',
      name: 'Smart Payment Reminders',
      trigger: 'Payment overdue by 3 days',
      action: 'Send personalized reminder email',
      status: 'active',
      executionCount: 89,
      successRate: 87.6
    },
    {
      id: 'risk-alert',
      name: 'Financial Risk Alerts',
      trigger: 'Client health score drops below 60',
      action: 'Alert account manager and finance team',
      status: 'active',
      executionCount: 12,
      successRate: 100
    },
    {
      id: 'forecast-update',
      name: 'Revenue Forecast Updates',
      trigger: 'Weekly on Mondays',
      action: 'Recalculate revenue forecasts with latest data',
      status: 'active',
      executionCount: 48,
      successRate: 95.8
    }
  ]);

  const [cashFlowAnalysis, setCashFlowAnalysis] = useState<CashFlowAnalysis[]>([
    { month: 'Oct 2024', inflow: 520000, outflow: 380000, netFlow: 140000, runway: 12.5 },
    { month: 'Nov 2024', inflow: 485000, outflow: 420000, netFlow: 65000, runway: 11.8 },
    { month: 'Dec 2024', inflow: 580000, outflow: 450000, netFlow: 130000, runway: 12.2 },
    { month: 'Jan 2025', inflow: 620000, outflow: 480000, netFlow: 140000, runway: 12.7 },
    { month: 'Feb 2025', inflow: 675000, outflow: 520000, netFlow: 155000, runway: 13.1 },
    { month: 'Mar 2025', inflow: 720000, outflow: 560000, netFlow: 160000, runway: 13.5 }
  ]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">At Risk</Badge>;
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[risk]}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth.score)}`}>
              {overallHealth.score}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {getHealthBadge(overallHealth.score)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overallHealth.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{overallHealth.growthRate}% YoY growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${overallHealth.cashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly net flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRiskBadge(overallHealth.riskLevel)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall portfolio risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Financial Intelligence Tabs */}
      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecasting">
            <TrendingUp className="w-4 h-4 mr-2" />
            Revenue Forecasting
          </TabsTrigger>
          <TabsTrigger value="payment-predictions">
            <Calendar className="w-4 h-4 mr-2" />
            Payment Predictions
          </TabsTrigger>
          <TabsTrigger value="health-scoring">
            <BarChart3 className="w-4 h-4 mr-2" />
            Health Scoring
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="w-4 h-4 mr-2" />
            Automated Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Revenue Forecasting & Trend Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Machine learning-powered revenue predictions with confidence intervals
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueForecasting.map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{forecast.period}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-600">
                          Predicted: ${forecast.predicted.toLocaleString()}
                        </span>
                        {forecast.actual && (
                          <span className="text-green-600">
                            Actual: ${forecast.actual.toLocaleString()}
                          </span>
                        )}
                        {forecast.variance && (
                          <span className={forecast.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                            {forecast.variance > 0 ? '+' : ''}{forecast.variance}% variance
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{forecast.confidence}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <Progress value={forecast.confidence} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Payment Prediction Models</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent payment timing and risk assessment algorithms
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentPredictions.map((payment, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{payment.clientName}</h4>
                        <p className="text-sm text-muted-foreground">{payment.invoiceId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${payment.amount.toLocaleString()}</div>
                        {getRiskBadge(payment.riskLevel)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Due Date: </span>
                        <span className="font-medium">{payment.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Predicted Payment: </span>
                        <span className="font-medium">{payment.predictedPaymentDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Probability: </span>
                        <span className="font-medium">{payment.probability}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress value={payment.probability} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Financial Health Scoring</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered financial health assessment and risk analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {healthScores.map((client, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-lg">{client.clientName}</h4>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getHealthColor(client.score)}`}>
                          {client.score}/100
                        </div>
                        {getHealthBadge(client.score)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Cash Flow Health</div>
                        <Progress value={client.cashFlowHealth} className="h-2" />
                        <div className="text-sm font-medium">{client.cashFlowHealth}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Payment History</div>
                        <Progress value={client.paymentHistory} className="h-2" />
                        <div className="text-sm font-medium">{client.paymentHistory}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Credit Risk</div>
                        <Progress value={client.creditRisk} className="h-2" />
                        <div className="text-sm font-medium">{client.creditRisk}%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Engagement</div>
                        <Progress value={client.engagement} className="h-2" />
                        <div className="text-sm font-medium">{client.engagement}%</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-1">AI Recommendation</h5>
                      <p className="text-sm text-blue-800">{client.recommendation}</p>
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
              <CardTitle>Automated Financial Workflows</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent automation for financial processes and optimization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automatedWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{workflow.name}</h4>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>When:</strong> {workflow.trigger}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Then:</strong> {workflow.action}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold text-green-600">{workflow.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                      <div className="text-sm text-muted-foreground">{workflow.executionCount} executions</div>
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
