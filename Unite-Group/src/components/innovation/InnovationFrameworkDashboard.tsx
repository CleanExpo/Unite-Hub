'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Users, 
  Zap, 
  BarChart3, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Rocket,
  Brain,
  Eye
} from 'lucide-react';

interface MarketTrend {
  id: string;
  name: string;
  category: string;
  relevanceScore: number;
  impactPotential: number;
  timeHorizon: string;
}

interface InnovationOpportunity {
  id: string;
  title: string;
  category: string;
  businessValue: number;
  technicalFeasibility: number;
  priority: string;
  expectedROI: number;
  timeToMarket: number;
}

interface ProductMarketFit {
  productId: string;
  productName: string;
  fitScore: number;
  userAdoption: number;
  customerSatisfaction: number;
  marketReadiness: number;
  recommendations: string[];
}

interface ABTest {
  id: string;
  name: string;
  status: string;
  primaryMetric: string;
  variants: {
    name: string;
    conversionRate: number;
    visitors: number;
  }[];
  results?: {
    winningVariant: string;
    improvementPercent: number;
    recommendation: string;
  };
}

interface InnovationMetrics {
  totalOpportunities: number;
  averageROI: number;
  trendAccuracy: number;
  validationAccuracy: number;
  activeFeatures: number;
  marketTimingAccuracy: number;
}

export default function InnovationFrameworkDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock data - in production, this would come from the actual services
  const [marketTrends] = useState<MarketTrend[]>([
    {
      id: '1',
      name: 'AI-Powered Autonomous Business Operations',
      category: 'technology',
      relevanceScore: 0.94,
      impactPotential: 0.91,
      timeHorizon: 'short_term'
    },
    {
      id: '2',
      name: 'Quantum-Ready Security Frameworks',
      category: 'technology',
      relevanceScore: 0.86,
      impactPotential: 0.93,
      timeHorizon: 'medium_term'
    },
    {
      id: '3',
      name: 'Edge AI and Distributed Intelligence',
      category: 'technology',
      relevanceScore: 0.91,
      impactPotential: 0.88,
      timeHorizon: 'short_term'
    }
  ]);

  const [opportunities] = useState<InnovationOpportunity[]>([
    {
      id: '1',
      title: 'Leverage AI-Powered Operations for Business Advantage',
      category: 'feature',
      businessValue: 0.91,
      technicalFeasibility: 0.87,
      priority: 'critical',
      expectedROI: 2.4,
      timeToMarket: 6
    },
    {
      id: '2',
      title: 'Implement Quantum Security Framework',
      category: 'technology',
      businessValue: 0.93,
      technicalFeasibility: 0.72,
      priority: 'high',
      expectedROI: 1.8,
      timeToMarket: 12
    }
  ]);

  const [productMarketFits] = useState<ProductMarketFit[]>([
    {
      productId: 'unite-ai-platform',
      productName: 'Unite AI Platform',
      fitScore: 0.82,
      userAdoption: 0.78,
      customerSatisfaction: 0.85,
      marketReadiness: 0.82,
      recommendations: ['Excellent PMF - Scale marketing and sales efforts', 'Focus on market expansion']
    },
    {
      productId: 'cognitive-analytics',
      productName: 'Cognitive Analytics Suite',
      fitScore: 0.88,
      userAdoption: 0.84,
      customerSatisfaction: 0.88,
      marketReadiness: 0.79,
      recommendations: ['Outstanding PMF - Consider new market segments', 'Enhance competitive positioning']
    }
  ]);

  const [abTests] = useState<ABTest[]>([
    {
      id: '1',
      name: 'AI Dashboard Layout Optimization',
      status: 'running',
      primaryMetric: 'engagement_time',
      variants: [
        { name: 'Control', conversionRate: 0.597, visitors: 1420 },
        { name: 'Simplified Layout', conversionRate: 0.669, visitors: 1380 }
      ]
    },
    {
      id: '2',
      name: 'Onboarding Flow Enhancement',
      status: 'completed',
      primaryMetric: 'time_to_first_value',
      variants: [
        { name: 'Standard Onboarding', conversionRate: 0.513, visitors: 456 },
        { name: 'Interactive Onboarding', conversionRate: 0.671, visitors: 444 }
      ],
      results: {
        winningVariant: 'Interactive Onboarding',
        improvementPercent: 30.8,
        recommendation: 'implement'
      }
    }
  ]);

  const [metrics] = useState<InnovationMetrics>({
    totalOpportunities: 12,
    averageROI: 2.1,
    trendAccuracy: 0.87,
    validationAccuracy: 0.91,
    activeFeatures: 8,
    marketTimingAccuracy: 0.84
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend < -0.1) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'paused': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Innovation Framework</h1>
          <p className="text-muted-foreground">
            AI-powered innovation management and market validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Live Monitoring</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Rocket className="h-4 w-4 mr-2" />
            Deploy Features
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Innovation Opportunities</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              +2 new this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageROI.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">
              +0.3x from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.validationAccuracy * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Market prediction success
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeFeatures}</div>
            <p className="text-xs text-muted-foreground">
              Autonomous development
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Market Trends</span>
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Development</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Validation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Innovation Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Top Innovation Opportunities</span>
                </CardTitle>
                <CardDescription>
                  AI-identified opportunities ranked by business value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(opportunity.priority)}>
                          {opportunity.priority}
                        </Badge>
                        <span className="font-medium text-sm">{opportunity.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.expectedROI.toFixed(1)}x ROI
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Business Value</div>
                        <Progress value={opportunity.businessValue * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Technical Feasibility</div>
                        <Progress value={opportunity.technicalFeasibility * 100} className="h-2" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time to Market: {opportunity.timeToMarket} months
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Product Market Fit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Product Market Fit</span>
                </CardTitle>
                <CardDescription>
                  Real-time PMF analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {productMarketFits.map((pmf) => (
                  <div key={pmf.productId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pmf.productName}</span>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{(pmf.fitScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Adoption</div>
                        <Progress value={pmf.userAdoption * 100} className="h-1" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Satisfaction</div>
                        <Progress value={pmf.customerSatisfaction * 100} className="h-1" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Market Ready</div>
                        <Progress value={pmf.marketReadiness * 100} className="h-1" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pmf.recommendations[0]}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Active A/B Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Active Experiments</span>
              </CardTitle>
              <CardDescription>
                A/B tests and market validation experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.name}</span>
                        <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Primary: {test.primaryMetric}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {test.variants.map((variant, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{variant.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {(variant.conversionRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={variant.conversionRate * 100} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {variant.visitors} visitors
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {test.results && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          {test.results.winningVariant} showed {test.results.improvementPercent.toFixed(1)}% improvement. 
                          Recommendation: {test.results.recommendation}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends Analysis</CardTitle>
              <CardDescription>
                AI-powered market intelligence and trend monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.map((trend) => (
                  <div key={trend.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{trend.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{trend.category}</Badge>
                          <Badge variant="secondary">{trend.timeHorizon}</Badge>
                        </div>
                      </div>
                      {getTrendIcon(0.15)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Relevance Score</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={trend.relevanceScore * 100} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{(trend.relevanceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Impact Potential</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={trend.impactPotential * 100} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{(trend.impactPotential * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autonomous Feature Development</CardTitle>
              <CardDescription>
                AI-powered feature generation and deployment pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Development Pipeline Active</h3>
                <p className="text-muted-foreground mb-4">
                  AI agents are continuously developing and testing new features
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Features in Development</div>
                    <div className="text-2xl font-bold text-blue-600">5</div>
                  </div>
                  <div>
                    <div className="font-medium">Features in Testing</div>
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                  </div>
                  <div>
                    <div className="font-medium">Features Deployed</div>
                    <div className="text-2xl font-bold text-green-600">8</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Validation Results</CardTitle>
              <CardDescription>
                Comprehensive validation metrics and user feedback analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Validation Metrics</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Validation Accuracy</span>
                        <span>{(metrics.validationAccuracy * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={metrics.validationAccuracy * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Market Timing Accuracy</span>
                        <span>{(metrics.marketTimingAccuracy * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={metrics.marketTimingAccuracy * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Trend Prediction Accuracy</span>
                        <span>{(metrics.trendAccuracy * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={metrics.trendAccuracy * 100} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Validations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>AI Dashboard optimization validated</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Onboarding flow improvements confirmed</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span>Pricing strategy A/B test running</span>
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
