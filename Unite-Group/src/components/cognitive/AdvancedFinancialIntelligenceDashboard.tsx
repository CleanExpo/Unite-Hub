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
  Wallet,
  Building,
  Lightbulb,
  Shield,
  ArrowUp,
  ArrowDown,
  Calendar,
  Activity,
  Award,
  Zap
} from 'lucide-react';

interface FinancialHealth {
  score: number;
  grade: string;
  metrics: {
    liquidity: number;
    profitability: number;
    efficiency: number;
    leverage: number;
    growth: number;
  };
  trends: {
    revenue: string;
    expenses: string;
    cashFlow: string;
    profitability: string;
  };
  recommendations: string[];
  alertLevel: string;
}

interface BudgetPlan {
  id: string;
  period: string;
  totalBudget: number;
  confidence: number;
  status: string;
  categories: BudgetCategory[];
  startDate: string;
  endDate: string;
}

interface BudgetCategory {
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  forecastAmount: number;
  variance: number;
  optimizationSuggestions: string[];
}

interface CashFlowPrediction {
  date: string;
  predictedInflow: number;
  predictedOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  confidence: number;
  riskFactors: string[];
  opportunities: string[];
}

interface CostOptimization {
  id: string;
  category: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  implementation: string[];
  riskLevel: string;
  timeframe: string;
  confidence: number;
}

interface InvestmentRecommendation {
  id: string;
  type: string;
  description: string;
  requiredCapital: number;
  expectedReturn: number;
  roi: number;
  paybackPeriod: number;
  riskLevel: string;
  priority: string;
  timeframe: string;
  confidence: number;
  considerations: string[];
}

interface FinancialAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  estimatedImpact: number;
  timeframe: string;
  resolved: boolean;
}

interface DashboardData {
  financialHealth: FinancialHealth;
  budgetPlans: BudgetPlan[];
  cashFlowPredictions: CashFlowPrediction[];
  costOptimizations: CostOptimization[];
  investmentRecommendations: InvestmentRecommendation[];
  financialAlerts: FinancialAlert[];
  summary: {
    totalCostSavings: number;
    totalInvestmentROI: number;
    activeBudgets: number;
    criticalAlerts: number;
    averageConfidence: number;
  };
}

export default function AdvancedFinancialIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/advanced-financial-intelligence?action=dashboard');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch advanced financial intelligence data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceAnalysis = async () => {
    try {
      await fetch('/api/advanced-financial-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-analysis' })
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to force financial analysis:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4 * 60 * 60 * 1000); // Update every 4 hours
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getHealthGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D':
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
      case 'declining':
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading advanced financial intelligence...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load advanced financial intelligence data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wallet className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Advanced Financial Intelligence</h1>
            <p className="text-muted-foreground">
              AI-Powered Budget Planning, Cash Flow Prediction & Investment Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={forceAnalysis} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Analyze Now
          </Button>
          <Badge variant="default" className={`${getHealthGradeColor(data.financialHealth.grade)} border-0`}>
            Health: {data.financialHealth.grade}
          </Badge>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.financialHealth.score}/100</div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getHealthGradeColor(data.financialHealth.grade)}>
                Grade: {data.financialHealth.grade}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalCostSavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Identified optimizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.totalInvestmentROI.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">
              Average return multiple
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeBudgets}</div>
            <p className="text-xs text-muted-foreground">
              Live budget plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {data.financialAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Financial Alerts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.financialAlerts.slice(0, 4).map((alert) => (
              <Alert key={alert.id} className={alert.severity === 'critical' ? 'border-red-500' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <div className="space-y-1">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.description}</div>
                  <div className="text-sm font-medium text-blue-600">{alert.recommendation}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Impact: {formatCurrency(alert.estimatedImpact)}</span>
                    <span>•</span>
                    <span>Timeframe: {alert.timeframe}</span>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="budget">Budget Planning</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="health">Financial Health</TabsTrigger>
        </TabsList>

        {/* Budget Planning Tab */}
        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.budgetPlans.map((budget) => (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{budget.period} Budget</CardTitle>
                    <Badge variant="outline" className={budget.status === 'active' ? 'border-green-500 text-green-700' : ''}>
                      {budget.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Budget:</span>
                    <span className="text-lg font-bold">{formatCurrency(budget.totalBudget)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {budget.categories.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{category.category}</span>
                          <span>{formatCurrency(category.allocatedAmount)}</span>
                        </div>
                        <Progress 
                          value={(category.spentAmount / category.allocatedAmount) * 100} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Spent: {formatCurrency(category.spentAmount)}</span>
                          <span>Forecast: {formatCurrency(category.forecastAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Confidence:</span>
                      <span>{formatPercentage(budget.confidence)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={selectedTimeframe === '30' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe('30')}
              >
                30 Days
              </Button>
              <Button
                variant={selectedTimeframe === '60' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe('60')}
              >
                60 Days
              </Button>
              <Button
                variant={selectedTimeframe === '90' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe('90')}
              >
                90 Days
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {data.cashFlowPredictions.slice(0, parseInt(selectedTimeframe)).filter((_, index) => index % Math.ceil(parseInt(selectedTimeframe) / 12) === 0).map((prediction, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {new Date(prediction.date).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Inflow: </span>
                        <span className="text-green-600">{formatCurrency(prediction.predictedInflow)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Outflow: </span>
                        <span className="text-red-600">{formatCurrency(prediction.predictedOutflow)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Net Cash Flow</span>
                        <span className={prediction.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(prediction.netCashFlow)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cumulative</span>
                        <span className={prediction.cumulativeCashFlow > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(prediction.cumulativeCashFlow)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{formatPercentage(prediction.confidence)}</span>
                      </div>
                    </div>

                    {prediction.riskFactors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Risk Factors:</h4>
                        <ul className="text-xs text-muted-foreground">
                          {prediction.riskFactors.slice(0, 2).map((risk, idx) => (
                            <li key={idx}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Cost Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.costOptimizations.map((optimization) => (
              <Card key={optimization.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {optimization.category} Optimization
                    </CardTitle>
                    <Badge className={getRiskLevelColor(optimization.riskLevel)}>
                      {optimization.riskLevel} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Current Cost</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(optimization.currentCost)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Optimized Cost</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(optimization.optimizedCost)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Potential Savings</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(optimization.savings)} ({formatPercentage(optimization.savingsPercentage)})
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Implementation Time</span>
                      <span>{optimization.timeframe}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{formatPercentage(optimization.confidence)}</span>
                    </div>
                  </div>

                  {optimization.implementation.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Implementation Steps:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {optimization.implementation.slice(0, 3).map((step, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.investmentRecommendations.map((investment) => (
              <Card key={investment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {investment.type} Investment
                    </CardTitle>
                    <Badge className={getPriorityColor(investment.priority)}>
                      {investment.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {investment.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Required Capital: </span>
                      <span>{formatCurrency(investment.requiredCapital)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Expected Return: </span>
                      <span className="text-green-600">{formatCurrency(investment.expectedReturn)}</span>
                    </div>
                    <div>
                      <span className="font-medium">ROI: </span>
                      <span className="font-bold">{investment.roi.toFixed(2)}x</span>
                    </div>
                    <div>
                      <span className="font-medium">Payback: </span>
                      <span>{investment.paybackPeriod.toFixed(1)} months</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge className={getRiskLevelColor(investment.riskLevel)}>
                      {investment.riskLevel} risk
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {formatPercentage(investment.confidence)}
                    </span>
                  </div>

                  {investment.considerations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Considerations:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {investment.considerations.slice(0, 3).map((consideration, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Lightbulb className="h-3 w-3 mt-1 text-yellow-600 flex-shrink-0" />
                            <span>{consideration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Liquidity</span>
                      <span>{formatPercentage(data.financialHealth.metrics.liquidity)}</span>
                    </div>
                    <Progress value={data.financialHealth.metrics.liquidity * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profitability</span>
                      <span>{formatPercentage(data.financialHealth.metrics.profitability)}</span>
                    </div>
                    <Progress value={data.financialHealth.metrics.profitability * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Efficiency</span>
                      <span>{formatPercentage(data.financialHealth.metrics.efficiency)}</span>
                    </div>
                    <Progress value={data.financialHealth.metrics.efficiency * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Growth</span>
                      <span>{formatPercentage(data.financialHealth.metrics.growth)}</span>
                    </div>
                    <Progress value={data.financialHealth.metrics.growth * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.financialHealth.trends.revenue)}
                      <span className="text-sm capitalize">{data.financialHealth.trends.revenue}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expenses</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.financialHealth.trends.expenses)}
                      <span className="text-sm capitalize">{data.financialHealth.trends.expenses}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cash Flow</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.financialHealth.trends.cashFlow)}
                      <span className="text-sm capitalize">{data.financialHealth.trends.cashFlow}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profitability</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.financialHealth.trends.profitability)}
                      <span className="text-sm capitalize">{data.financialHealth.trends.profitability}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {data.financialHealth.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Zap className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center space-x-4">
          <span>Last updated: {lastUpdate?.toLocaleString()}</span>
          <span>•</span>
          <span>Financial Intelligence: Active</span>
          <span>•</span>
          <span>Confidence: {formatPercentage(data.summary.averageConfidence)}</span>
        </div>
      </div>
    </div>
  );
}
