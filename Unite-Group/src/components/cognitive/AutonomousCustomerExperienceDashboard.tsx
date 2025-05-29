'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Target,
  DollarSign,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  RefreshCw,
  UserCheck,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface CustomerProfile {
  id: string;
  segment: 'enterprise' | 'mid-market' | 'small-business' | 'individual';
  region: string;
  lifetimeValue: number;
  acquisitionCost: number;
  engagementScore: number;
  satisfactionScore: number;
  riskScore: number;
  preferences: {
    communicationChannel: string;
    contactFrequency: string;
    serviceType: string;
    priceRange: string;
  };
  predictedOutcomes: Array<{
    type: string;
    probability: number;
    timeframe: string;
    value: number;
    confidence: number;
    recommendations: string[];
  }>;
}

interface JourneyOptimization {
  id: string;
  customerId: string;
  optimizationType: string;
  recommendation: string;
  expectedImpact: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation: string[];
  measurableOutcomes: string[];
  generatedAt: string;
}

interface SupportPrediction {
  customerId: string;
  issueType: string;
  probability: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expectedResolution: string;
  suggestedApproach: string[];
  estimatedCost: number;
  predictedAt: string;
}

interface DynamicPricing {
  serviceId: string;
  basePrice: number;
  dynamicPrice: number;
  adjustmentFactor: number;
  priceStrategy: string;
  confidence: number;
  expectedConversion: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}

interface DashboardData {
  profiles: CustomerProfile[];
  optimizations: JourneyOptimization[];
  supportPredictions: SupportPrediction[];
  dynamicPricing: Record<string, DynamicPricing>;
  summary: {
    totalCustomers: number;
    activeOptimizations: number;
    predictedSupportCases: number;
    pricingStrategies: number;
    averageEngagement: number;
    averageSatisfaction: number;
    totalLifetimeValue: number;
  };
  timestamp: string;
}

export default function AutonomousCustomerExperienceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/autonomous-customer-experience?action=dashboard');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch autonomous customer experience data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceOptimization = async () => {
    try {
      await fetch('/api/autonomous-customer-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-optimization' })
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to force optimization:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
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

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'mid-market': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'small-business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'individual': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading autonomous customer experience...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load autonomous customer experience data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredProfiles = selectedSegment === 'all' 
    ? data.profiles 
    : data.profiles.filter(p => p.segment === selectedSegment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Autonomous Customer Experience</h1>
            <p className="text-muted-foreground">
              AI-Powered Journey Optimization & Predictive Support
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={forceOptimization} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Optimize Now
          </Button>
          <Badge variant="default" className="bg-blue-600">
            {data.summary.totalCustomers} Customers
          </Badge>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalLifetimeValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.summary.totalCustomers} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(data.summary.averageEngagement)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer engagement score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(data.summary.averageSatisfaction)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.activeOptimizations}
            </div>
            <p className="text-xs text-muted-foreground">
              Live journey optimizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">Customer Profiles</TabsTrigger>
          <TabsTrigger value="optimizations">Journey Optimization</TabsTrigger>
          <TabsTrigger value="support">Predictive Support</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
        </TabsList>

        {/* Customer Profiles Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <Button
              variant={selectedSegment === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSegment('all')}
            >
              All Segments
            </Button>
            {['enterprise', 'mid-market', 'small-business', 'individual'].map((segment) => (
              <Button
                key={segment}
                variant={selectedSegment === segment ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSegment(segment)}
              >
                {segment.replace('-', ' ')}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProfiles.slice(0, 12).map((profile) => (
              <Card key={profile.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.id}</CardTitle>
                    <Badge className={getSegmentColor(profile.segment)}>
                      {profile.segment}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">LTV: </span>
                      <span>{formatCurrency(profile.lifetimeValue)}</span>
                    </div>
                    <div>
                      <span className="font-medium">CAC: </span>
                      <span>{formatCurrency(profile.acquisitionCost)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement</span>
                      <span>{formatPercentage(profile.engagementScore)}</span>
                    </div>
                    <Progress value={profile.engagementScore * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Satisfaction</span>
                      <span>{formatPercentage(profile.satisfactionScore)}</span>
                    </div>
                    <Progress value={profile.satisfactionScore * 100} className="h-2" />
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    {getChannelIcon(profile.preferences.communicationChannel)}
                    <span className="capitalize">{profile.preferences.communicationChannel}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize">{profile.preferences.serviceType}</span>
                  </div>

                  {profile.predictedOutcomes.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium mb-1">Predicted Outcomes:</div>
                      {profile.predictedOutcomes.slice(0, 2).map((outcome, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {outcome.type}: {formatPercentage(outcome.probability)} chance
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Journey Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.optimizations.map((optimization) => (
              <Card key={optimization.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {optimization.optimizationType.replace(/([A-Z])/g, ' $1')}
                    </CardTitle>
                    <Badge className={getPriorityColor(optimization.priority)}>
                      {optimization.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {optimization.recommendation}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Impact: </span>
                      <span className="text-green-600">
                        +{formatPercentage(optimization.expectedImpact)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence: </span>
                      <span>{formatPercentage(optimization.confidence)}</span>
                    </div>
                  </div>

                  {optimization.implementation.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Implementation:</h4>
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

                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Customer: {optimization.customerId} • 
                    Generated: {new Date(optimization.generatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictive Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.supportPredictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {prediction.issueType.replace(/([A-Z])/g, ' $1')}
                    </CardTitle>
                    <Badge className={getPriorityColor(prediction.urgency)}>
                      {prediction.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Probability: </span>
                      <span>{formatPercentage(prediction.probability)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Cost: </span>
                      <span>{formatCurrency(prediction.estimatedCost)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Expected Resolution:</h4>
                    <p className="text-sm text-muted-foreground">
                      {prediction.expectedResolution}
                    </p>
                  </div>

                  {prediction.suggestedApproach.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Suggested Approach:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {prediction.suggestedApproach.slice(0, 2).map((approach, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Target className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                            <span>{approach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Customer: {prediction.customerId} • 
                    Predicted: {new Date(prediction.predictedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dynamic Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(data.dynamicPricing).map(([serviceId, pricing]) => (
              <Card key={serviceId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {serviceId.replace(/-/g, ' ')}
                    </CardTitle>
                    <Badge variant="outline">
                      {pricing.priceStrategy}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Base Price</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(pricing.basePrice)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Dynamic Price</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(pricing.dynamicPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Adjustment Factor</span>
                      <span className={pricing.adjustmentFactor > 0 ? 'text-green-600' : 'text-red-600'}>
                        {pricing.adjustmentFactor > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                        {formatPercentage(Math.abs(pricing.adjustmentFactor))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expected Conversion</span>
                      <span>{formatPercentage(pricing.expectedConversion)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{formatPercentage(pricing.confidence)}</span>
                    </div>
                  </div>

                  {pricing.factors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Pricing Factors:</h4>
                      <div className="space-y-1">
                        {pricing.factors.map((factor, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="capitalize">{factor.factor}</span>
                            <span className={factor.impact > 0 ? 'text-green-600' : 'text-red-600'}>
                              {factor.impact > 0 ? '+' : ''}{formatPercentage(factor.impact)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center space-x-4">
          <span>Last updated: {lastUpdate?.toLocaleString()}</span>
          <span>•</span>
          <span>Customer Experience Engine: Active</span>
          <span>•</span>
          <span>Optimizations: {data.summary.activeOptimizations} live</span>
        </div>
      </div>
    </div>
  );
}
