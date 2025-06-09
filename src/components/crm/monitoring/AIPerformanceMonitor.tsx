"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Clock
} from 'lucide-react';

interface AISystemMetric {
  id: string;
  name: string;
  category: 'performance' | 'accuracy' | 'reliability' | 'efficiency';
  currentValue: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface SystemHealth {
  component: string;
  health: number;
  issues: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

// AI Performance Monitoring System - Real-time AI Health Dashboard
export default function AIPerformanceMonitor() {
  const [aiMetrics] = useState<AISystemMetric[]>([
    {
      id: 'metric-1',
      name: 'Pattern Recognition Accuracy',
      category: 'accuracy',
      currentValue: 0.967,
      target: 0.950,
      trend: 'up',
      status: 'healthy',
      lastUpdated: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: 'metric-2',
      name: 'Deal Prediction Confidence',
      category: 'accuracy',
      currentValue: 0.943,
      target: 0.950,
      trend: 'down',
      status: 'warning',
      lastUpdated: new Date(Date.now() - 1 * 60 * 1000)
    },
    {
      id: 'metric-3',
      name: 'Response Time Performance',
      category: 'performance',
      currentValue: 0.847,
      target: 0.900,
      trend: 'up',
      status: 'warning',
      lastUpdated: new Date(Date.now() - 3 * 60 * 1000)
    },
    {
      id: 'metric-4',
      name: 'Model Reliability Score',
      category: 'reliability',
      currentValue: 0.991,
      target: 0.990,
      trend: 'stable',
      status: 'healthy',
      lastUpdated: new Date(Date.now() - 1 * 60 * 1000)
    },
    {
      id: 'metric-5',
      name: 'Resource Efficiency',
      category: 'efficiency',
      currentValue: 0.923,
      target: 0.850,
      trend: 'up',
      status: 'healthy',
      lastUpdated: new Date(Date.now() - 4 * 60 * 1000)
    },
    {
      id: 'metric-6',
      name: 'Anomaly Detection Rate',
      category: 'accuracy',
      currentValue: 0.956,
      target: 0.950,
      trend: 'stable',
      status: 'healthy',
      lastUpdated: new Date(Date.now() - 2 * 60 * 1000)
    }
  ]);

  const [systemHealth] = useState<SystemHealth[]>([
    {
      component: 'Advanced Pattern Engine',
      health: 0.97,
      issues: 0,
      uptime: 0.999,
      responseTime: 145,
      errorRate: 0.002,
      throughput: 2847
    },
    {
      component: 'Predictive Outcome Engine',
      health: 0.94,
      issues: 1,
      uptime: 0.997,
      responseTime: 178,
      errorRate: 0.003,
      throughput: 1654
    },
    {
      component: 'Anomaly Detection Engine',
      health: 0.96,
      issues: 0,
      uptime: 0.998,
      responseTime: 123,
      errorRate: 0.001,
      throughput: 934
    },
    {
      component: 'Cross-Component Predictor',
      health: 0.95,
      issues: 0,
      uptime: 0.999,
      responseTime: 234,
      errorRate: 0.002,
      throughput: 4521
    },
    {
      component: 'Adaptive Learning Engine',
      health: 0.92,
      issues: 2,
      uptime: 0.995,
      responseTime: 289,
      errorRate: 0.005,
      throughput: 1876
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'accuracy': return <CheckCircle className="h-4 w-4" />;
      case 'reliability': return <Activity className="h-4 w-4" />;
      case 'efficiency': return <Cpu className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 0.95) return 'text-green-600';
    if (health >= 0.90) return 'text-blue-600';
    if (health >= 0.85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const overallHealth = systemHealth.reduce((sum, s) => sum + s.health, 0) / systemHealth.length;
  const totalIssues = systemHealth.reduce((sum, s) => sum + s.issues, 0);
  const averageUptime = systemHealth.reduce((sum, s) => sum + s.uptime, 0) / systemHealth.length;

  return (
    <div className="space-y-6">
      {/* AI Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall AI Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(overallHealth * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Real-time monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">Across all systems</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageUptime * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">High availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Components</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.length}</div>
            <p className="text-xs text-muted-foreground">AI systems active</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Monitoring Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="w-4 h-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Active Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Metrics Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time monitoring of AI model performance, accuracy, and efficiency metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiMetrics.map((metric) => (
                  <div key={metric.id} className={`border rounded-lg p-4 ${getStatusColor(metric.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(metric.category)}
                        <h4 className="font-medium">{metric.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        <span className="text-xs">{formatTimeAgo(metric.lastUpdated)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Current Performance</span>
                          <span className="text-sm font-medium">{(metric.currentValue * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={metric.currentValue * 100} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-medium ml-1">{(metric.target * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium ml-1 capitalize">{metric.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI System Health Monitor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive health monitoring for all AI components with performance analytics
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((system, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{system.component}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getHealthColor(system.health)} bg-opacity-10`}>
                          {(system.health * 100).toFixed(1)}% Health
                        </Badge>
                        {system.issues > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {system.issues} Issue{system.issues !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Uptime</div>
                        <div className="font-medium">{(system.uptime * 100).toFixed(2)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Response Time</div>
                        <div className="font-medium">{system.responseTime}ms</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Error Rate</div>
                        <div className="font-medium">{(system.errorRate * 100).toFixed(3)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Throughput</div>
                        <div className="font-medium">{system.throughput}/h</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Health Score</div>
                        <Progress value={system.health * 100} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className={`text-xs font-medium ${getHealthColor(system.health)}`}>
                          {system.health >= 0.95 ? 'Excellent' : 
                           system.health >= 0.90 ? 'Good' : 
                           system.health >= 0.85 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Performance Alerts</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time alerts and notifications for AI system performance issues
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium">Performance Warning</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Low Priority</Badge>
                  </div>
                  <p className="text-sm mb-2">Deal Prediction Confidence below target (94.3% vs 95.0%)</p>
                  <div className="text-xs text-muted-foreground">Component: Predictive Outcome Engine • 1m ago</div>
                </div>

                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium">Response Time Alert</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
                  </div>
                  <p className="text-sm mb-2">Response time performance below target (84.7% vs 90.0%)</p>
                  <div className="text-xs text-muted-foreground">System-wide • 3m ago</div>
                </div>

                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">Performance Optimization</h4>
                    <Badge className="bg-blue-100 text-blue-800">Info</Badge>
                  </div>
                  <p className="text-sm mb-2">Adaptive Learning Engine showing improved efficiency (+8%)</p>
                  <div className="text-xs text-muted-foreground">Component: Adaptive Learning Engine • 5m ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
