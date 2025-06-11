'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Database,
  Globe,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  type: 'nlp' | 'vision' | 'prediction' | 'recommendation';
  status: 'active' | 'training' | 'idle' | 'error';
  accuracy: number;
  lastTrained: string;
  requests: number;
  responseTime: number;
}

interface AIMetrics {
  totalModels: number;
  activeModels: number;
  totalRequests: number;
  averageResponseTime: number;
  accuracy: number;
  uptime: number;
}

export default function AIDashboard() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Mock data loading
    const loadAIData = async () => {
      try {
        setLoading(true);
        
        // Mock AI models data
        const mockModels: AIModel[] = [
          {
            id: '1',
            name: 'Customer Sentiment Analysis',
            type: 'nlp',
            status: 'active',
            accuracy: 94.5,
            lastTrained: '2024-01-15',
            requests: 15420,
            responseTime: 120
          },
          {
            id: '2',
            name: 'Product Recommendation Engine',
            type: 'recommendation',
            status: 'active',
            accuracy: 87.2,
            lastTrained: '2024-01-14',
            requests: 8930,
            responseTime: 85
          },
          {
            id: '3',
            name: 'Sales Forecasting Model',
            type: 'prediction',
            status: 'training',
            accuracy: 91.8,
            lastTrained: '2024-01-13',
            requests: 2340,
            responseTime: 200
          },
          {
            id: '4',
            name: 'Image Classification',
            type: 'vision',
            status: 'active',
            accuracy: 96.1,
            lastTrained: '2024-01-12',
            requests: 5670,
            responseTime: 150
          },
          {
            id: '5',
            name: 'Fraud Detection System',
            type: 'prediction',
            status: 'idle',
            accuracy: 98.3,
            lastTrained: '2024-01-11',
            requests: 1250,
            responseTime: 95
          }
        ];

        // Mock metrics data
        const mockMetrics: AIMetrics = {
          totalModels: mockModels.length,
          activeModels: mockModels.filter(m => m.status === 'active').length,
          totalRequests: mockModels.reduce((sum, m) => sum + m.requests, 0),
          averageResponseTime: mockModels.reduce((sum, m) => sum + m.responseTime, 0) / mockModels.length,
          accuracy: mockModels.reduce((sum, m) => sum + m.accuracy, 0) / mockModels.length,
          uptime: 99.7
        };

        setModels(mockModels);
        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to load AI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAIData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'training':
        return <Badge className="bg-blue-100 text-blue-800">Training</Badge>;
      case 'idle':
        return <Badge className="bg-gray-100 text-gray-800">Idle</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'idle':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nlp':
        return <Brain className="h-5 w-5" />;
      case 'vision':
        return <Globe className="h-5 w-5" />;
      case 'prediction':
        return <TrendingUp className="h-5 w-5" />;
      case 'recommendation':
        return <Users className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 90) return 'text-yellow-600';
    if (accuracy >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor and manage your AI models and services</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Deploy Model
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Models</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalModels}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeModels} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">Across all models</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uptime}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Models */}
          <Card>
            <CardHeader>
              <CardTitle>Active AI Models</CardTitle>
              <CardDescription>Currently running AI models and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.filter(m => m.status === 'active').map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {getTypeIcon(model.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{model.type} Model</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getAccuracyColor(model.accuracy)}`}>
                          {model.accuracy}%
                        </div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {model.responseTime}ms
                        </div>
                        <div className="text-xs text-gray-500">Response</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {model.requests.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Requests</div>
                      </div>
                      
                      {getStatusBadge(model.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Cpu className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-gray-500">CPU Usage</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">72%</div>
                  <div className="text-sm text-gray-500">Memory Usage</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">1.2TB</div>
                  <div className="text-sm text-gray-500">Data Processed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All AI Models</CardTitle>
              <CardDescription>Complete list of AI models and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <Card key={model.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getTypeIcon(model.type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {model.type} Model • Last trained: {new Date(model.lastTrained).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(model.status)}
                          {getStatusBadge(model.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Accuracy</div>
                          <div className={`text-xl font-bold ${getAccuracyColor(model.accuracy)}`}>
                            {model.accuracy}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-500">Response Time</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {model.responseTime}ms
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-500">Total Requests</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {model.requests.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            Retrain
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed analytics and insights for your AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-500 mb-4">
                  Detailed performance charts and analytics will be displayed here
                </p>
                <Button variant="outline">
                  View Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
