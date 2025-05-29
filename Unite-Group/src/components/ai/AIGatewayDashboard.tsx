/**
 * AI Gateway Dashboard Component
 * Unite Group AI Gateway - Frontend Management Interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  requestCount: number;
  cost: number;
}

interface AIMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalCost: number;
  cacheHitRate: number;
  activeProviders: number;
}

interface AIAlert {
  id: string;
  type: 'error_rate' | 'response_time' | 'cost' | 'provider_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  provider?: string;
  timestamp: string;
}

const AIGatewayDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalRequests: 0,
    successRate: 0,
    averageResponseTime: 0,
    totalCost: 0,
    cacheHitRate: 0,
    activeProviders: 0
  });

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Mock data - In production, this would fetch from the AI Gateway API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalRequests: 15420,
        successRate: 98.7,
        averageResponseTime: 1250,
        totalCost: 45.82,
        cacheHitRate: 76.3,
        activeProviders: 4
      });

      setProviders([
        {
          id: 'openai',
          name: 'OpenAI GPT-4',
          status: 'healthy',
          responseTime: 1100,
          errorRate: 1.2,
          requestCount: 8420,
          cost: 28.45
        },
        {
          id: 'claude',
          name: 'Anthropic Claude',
          status: 'healthy',
          responseTime: 1350,
          errorRate: 0.8,
          requestCount: 4200,
          cost: 12.20
        },
        {
          id: 'google',
          name: 'Google Gemini',
          status: 'degraded',
          responseTime: 2100,
          errorRate: 3.4,
          requestCount: 2100,
          cost: 3.89
        },
        {
          id: 'azure',
          name: 'Azure OpenAI',
          status: 'healthy',
          responseTime: 980,
          errorRate: 0.6,
          requestCount: 700,
          cost: 1.28
        }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'response_time',
          severity: 'medium',
          message: 'Google Gemini showing elevated response times (2.1s avg)',
          provider: 'google',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'cost',
          severity: 'low',
          message: 'Daily AI costs approaching budget threshold',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      ]);

      setLoading(false);
    };

    fetchData();
  }, [selectedTimeRange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      down: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Gateway Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your AI provider infrastructure
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
            aria-label="Select time range for metrics"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-l-4 border-l-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <Badge className={getSeverityBadge(alert.severity)}>
                  {alert.severity}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;2000ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost}</div>
            <p className="text-xs text-muted-foreground">
              Budget: $100/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(provider.status)}
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <Badge className={getStatusBadge(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-2xl font-bold">{provider.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Error Rate</p>
                      <p className="text-2xl font-bold">{provider.errorRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Requests</p>
                      <p className="text-2xl font-bold">{provider.requestCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cost</p>
                      <p className="text-2xl font-bold">${provider.cost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Request Volume
                </CardTitle>
                <CardDescription>
                  AI requests over time by provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - integrate with your preferred charting library
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Cache Performance
                </CardTitle>
                <CardDescription>
                  Cache hit rate: {metrics.cacheHitRate}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.cacheHitRate} className="mb-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cache Hits</span>
                    <span className="font-medium">11,756</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Misses</span>
                    <span className="font-medium">3,664</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response Time (Cached)</span>
                    <span className="font-medium">45ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routing Rules</CardTitle>
              <CardDescription>
                Configure intelligent request routing between AI providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Code Generation → OpenAI</h4>
                    <p className="text-sm text-muted-foreground">
                      Route all code generation requests to OpenAI GPT-4
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Long Content → Claude</h4>
                    <p className="text-sm text-muted-foreground">
                      Route content over 5000 chars to Claude for better handling
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Low Cost → Azure</h4>
                    <p className="text-sm text-muted-foreground">
                      Route low-cost requests to Azure OpenAI
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Content Moderation
                </CardTitle>
                <CardDescription>
                  AI content safety and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Content Filtering</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>PII Detection</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Audit Logging</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compliance Mode</span>
                    <Badge className="bg-blue-100 text-blue-800">GDPR</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Metrics</CardTitle>
                <CardDescription>
                  Last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Requests Blocked</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">PII Detected</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Content Flagged</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Score</span>
                    <span className="font-medium">98.7%</span>
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

export default AIGatewayDashboard;
