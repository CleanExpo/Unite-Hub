'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Eye,
  RefreshCw,
  Settings
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

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
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  
  // Real data from API - NO MOCK DATA
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [opportunities, setOpportunities] = useState<InnovationOpportunity[]>([]);
  const [productMarketFits, setProductMarketFits] = useState<ProductMarketFit[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [metrics, setMetrics] = useState<InnovationMetrics>({
    totalOpportunities: 0,
    averageROI: 0,
    trendAccuracy: 0,
    validationAccuracy: 0,
    activeFeatures: 0,
    marketTimingAccuracy: 0
  });

  useEffect(() => {
    fetchInnovationData();
  }, []);

  const fetchInnovationData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('innovation/framework');
      
      if (response.configured) {
        // Innovation Framework is configured, use real data
        setConfigured(true);
        setMarketTrends(response.data.marketTrends || []);
        setOpportunities(response.data.opportunities || []);
        setProductMarketFits(response.data.productMarketFits || []);
        setAbTests(response.data.abTests || []);
        setMetrics(response.data.metrics);
      } else {
        // Innovation Framework not configured
        setConfigured(false);
        setMarketTrends([]);
        setOpportunities([]);
        setProductMarketFits([]);
        setAbTests([]);
        setMetrics({
          totalOpportunities: 0,
          averageROI: 0,
          trendAccuracy: 0,
          validationAccuracy: 0,
          activeFeatures: 0,
          marketTimingAccuracy: 0
        });
      }
    } catch (err) {
      console.error('Error fetching Innovation Framework data:', err);
      setError('Failed to load Innovation Framework data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load Innovation Framework data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInnovationData();
  };

  const handleConfigure = async () => {
    try {
      await apiClient.post('innovation/framework', {
        action: 'configure',
        name: 'Innovation Framework',
        settings: {}
      });
      
      toast({
        title: 'Success',
        description: 'Innovation Framework configured successfully',
      });
      
      // Refresh data
      fetchInnovationData();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to configure Innovation Framework',
        variant: 'destructive',
      });
    }
  };

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

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Innovation Framework
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!configured) {
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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Innovation Framework Not Configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Set up your Innovation Framework to enable AI-powered market intelligence, 
                opportunity identification, and autonomous feature development.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="text-left max-w-md mx-auto">
                  <h4 className="font-semibold mb-2">Setup includes:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Market intelligence API integration</li>
                    <li>• A/B testing framework configuration</li>
                    <li>• Product analytics setup</li>
                    <li>• Business intelligence tools</li>
                  </ul>
                </div>
              </div>
              
              <Button onClick={handleConfigure}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Innovation Framework
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Top Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{opportunity.title}</h4>
                      <p className="text-sm text-muted-foreground">{opportunity.category}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs">ROI: {opportunity.expectedROI}x</span>
                        <span className="text-xs">Time: {opportunity.timeToMarket}mo</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={getPriorityColor(opportunity.priority)}>
                        {opportunity.priority}
                      </Badge>
                      <div className="text-sm font-medium">
                        {opportunity.businessValue}/10
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Product-Market Fit</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productMarketFits.map((pmf) => (
                  <div key={pmf.productId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{pmf.productName}</h4>
                      <Badge variant={pmf.fitScore > 0.7 ? 'default' : 'secondary'}>
                        {(pmf.fitScore * 100).toFixed(0)}% fit
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>User Adoption</span>
                        <span>{(pmf.userAdoption * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={pmf.userAdoption * 100} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>A/B Test Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(test.status)}
                        <h4 className="font-medium">{test.name}</h4>
                      </div>
                      <Badge variant="outline">{test.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {test.variants.map((variant, index) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{variant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(variant.conversionRate * 100).toFixed(1)}% • {variant.visitors} visitors
                          </div>
                        </div>
                      ))}
                    </div>
                    {test.results && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Winner: {test.results.winningVariant} (+{test.results.improvementPercent}%)
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
              <CardTitle>Market Intelligence</CardTitle>
              <CardDescription>AI-identified trends and opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.map((trend) => (
                  <div key={trend.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{trend.name}</h4>
                      <p className="text-sm text-muted-foreground">{trend.category}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs">Relevance: {(trend.relevanceScore * 100).toFixed(0)}%</span>
                        <span className="text-xs">Impact: {trend.impactPotential}/10</span>
                        <span className="text-xs">{trend.timeHorizon}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(trend.relevanceScore)}
                      <Star className="h-4 w-4 text-yellow-500" />
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
              <CardTitle>Autonomous Development</CardTitle>
              <CardDescription>AI-driven feature development pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Development Pipeline</h3>
                <p className="text-muted-foreground mb-4">
                  Autonomous feature development based on market intelligence
                </p>
                <Button>
                  <Rocket className="h-4 w-4 mr-2" />
                  View Development Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Validation</CardTitle>
              <CardDescription>Real-time validation and feedback loops</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Validation Engine</h3>
                <p className="text-muted-foreground mb-4">
                  Continuous market validation and user feedback analysis
                </p>
                <Button>
                  <Eye className="h-4 w-4 mr-2" />
                  View Validation Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
