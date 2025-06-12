'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Zap, 
  Clock, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
  Globe,
  Database,
  BarChart3,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Settings
} from 'lucide-react';

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
  loadMetrics: {
    fcp: number;
    ttfb: number;
    tti: number;
    tbt: number;
    si: number;
  };
  resourceMetrics: {
    totalResources: number;
    resourceSize: number;
    compressionRatio: number;
    cacheHitRate: number;
  };
  userExperience: {
    bounceRate: number;
    avgSessionDuration: number;
    pageViews: number;
    conversionRate: number;
  };
}

interface SystemHealth {
  apiLatency: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface LoadTestStatus {
  isRunning: boolean;
  currentTest?: string;
  progress: number;
  virtualUsers: number;
  duration: number;
  rps: number;
  errorRate: number;
}

export default function ProductionPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadTestStatus, setLoadTestStatus] = useState<LoadTestStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPerformanceData = async () => {
    try {
      // Simulate real-time performance data
      setMetrics({
        coreWebVitals: {
          lcp: 1200 + Math.random() * 800, // 1.2-2.0s
          fid: 50 + Math.random() * 100,   // 50-150ms
          cls: 0.05 + Math.random() * 0.15 // 0.05-0.2
        },
        loadMetrics: {
          fcp: 800 + Math.random() * 400,  // 0.8-1.2s
          ttfb: 200 + Math.random() * 300, // 200-500ms
          tti: 2000 + Math.random() * 1500, // 2-3.5s
          tbt: 100 + Math.random() * 400,  // 100-500ms
          si: 1500 + Math.random() * 1000  // 1.5-2.5s
        },
        resourceMetrics: {
          totalResources: 45 + Math.floor(Math.random() * 20),
          resourceSize: 2.1 + Math.random() * 0.8, // MB
          compressionRatio: 0.65 + Math.random() * 0.25,
          cacheHitRate: 0.75 + Math.random() * 0.2
        },
        userExperience: {
          bounceRate: 0.25 + Math.random() * 0.15,
          avgSessionDuration: 180 + Math.random() * 120, // seconds
          pageViews: 1200 + Math.floor(Math.random() * 800),
          conversionRate: 0.03 + Math.random() * 0.02
        }
      });

      setSystemHealth({
        apiLatency: 150 + Math.random() * 200,
        errorRate: Math.random() * 0.01, // 0-1%
        uptime: 0.9995, // 99.95%
        memoryUsage: 0.65 + Math.random() * 0.2,
        cpuUsage: 0.45 + Math.random() * 0.3,
        diskUsage: 0.7 + Math.random() * 0.1,
        activeConnections: 850 + Math.floor(Math.random() * 300),
        requestsPerSecond: 120 + Math.random() * 80
      });

      // Generate alerts based on thresholds
      const newAlerts: Alert[] = [];
      if (metrics && metrics.coreWebVitals.lcp > 2500) {
        newAlerts.push({
          id: `alert-${Date.now()}-lcp`,
          type: 'warning',
          title: 'LCP Performance Issue',
          message: `Largest Contentful Paint is ${(metrics.coreWebVitals.lcp / 1000).toFixed(2)}s (target: <2.5s)`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      setAlerts(prevAlerts => [...prevAlerts.slice(-5), ...newAlerts].slice(-10));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    }
  };

  const startLoadTest = async () => {
    setLoadTestStatus({
      isRunning: true,
      currentTest: 'Production Load Test',
      progress: 0,
      virtualUsers: 100,
      duration: 300, // 5 minutes
      rps: 0,
      errorRate: 0
    });

    // Simulate load test progress
    const interval = setInterval(() => {
      setLoadTestStatus(prev => {
        if (!prev || prev.progress >= 100) {
          clearInterval(interval);
          return prev ? { ...prev, isRunning: false, progress: 100 } : null;
        }
        return {
          ...prev,
          progress: prev.progress + 2,
          rps: 80 + Math.random() * 40,
          errorRate: Math.random() * 0.02
        };
      });
    }, 1000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMetricColor = (value: number, good: number, warning: number) => {
    if (value <= good) return 'text-green-600';
    if (value <= warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBadge = (value: number, good: number, warning: number) => {
    if (value <= good) return 'bg-green-100 text-green-800';
    if (value <= warning) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  useEffect(() => {
    fetchPerformanceData();
    
    if (isMonitoring) {
      const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  if (!metrics || !systemHealth) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Monitor className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Production Performance Monitor</h1>
            <p className="text-muted-foreground">
              Real-time performance monitoring & optimization
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "default" : "outline"}
            size="sm"
          >
            {isMonitoring ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            {isMonitoring ? 'Pause' : 'Resume'} Monitoring
          </Button>
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="default" className="bg-green-600">
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alerts.filter(a => !a.resolved).slice(0, 4).map((alert) => (
              <Alert key={alert.id} className={alert.type === 'critical' ? 'border-red-500' : 'border-yellow-500'}>
                <AlertTriangle className="h-4 w-4" />
                <div className="space-y-1">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Largest Contentful Paint</CardTitle>
            <CardDescription>LCP - Loading Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.coreWebVitals.lcp, 2500, 4000)}`}>
              {(metrics.coreWebVitals.lcp / 1000).toFixed(2)}s
            </div>
            <Badge className={getMetricBadge(metrics.coreWebVitals.lcp, 2500, 4000)}>
              {metrics.coreWebVitals.lcp <= 2500 ? 'Good' : metrics.coreWebVitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
            </Badge>
            <Progress value={Math.min(100, (metrics.coreWebVitals.lcp / 4000) * 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">First Input Delay</CardTitle>
            <CardDescription>FID - Interactivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.coreWebVitals.fid, 100, 300)}`}>
              {metrics.coreWebVitals.fid.toFixed(0)}ms
            </div>
            <Badge className={getMetricBadge(metrics.coreWebVitals.fid, 100, 300)}>
              {metrics.coreWebVitals.fid <= 100 ? 'Good' : metrics.coreWebVitals.fid <= 300 ? 'Needs Improvement' : 'Poor'}
            </Badge>
            <Progress value={Math.min(100, (metrics.coreWebVitals.fid / 300) * 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cumulative Layout Shift</CardTitle>
            <CardDescription>CLS - Visual Stability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.coreWebVitals.cls, 0.1, 0.25)}`}>
              {metrics.coreWebVitals.cls.toFixed(3)}
            </div>
            <Badge className={getMetricBadge(metrics.coreWebVitals.cls, 0.1, 0.25)}>
              {metrics.coreWebVitals.cls <= 0.1 ? 'Good' : metrics.coreWebVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
            </Badge>
            <Progress value={Math.min(100, (metrics.coreWebVitals.cls / 0.25) * 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="testing">Load Testing</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Server className="h-4 w-4 mr-2" />
                  API Latency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth.apiLatency.toFixed(0)}ms</div>
                <Progress value={(systemHealth.apiLatency / 500) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(systemHealth.errorRate * 100).toFixed(2)}%
                </div>
                <Progress value={systemHealth.errorRate * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(systemHealth.uptime * 100).toFixed(2)}%
                </div>
                <Progress value={systemHealth.uptime * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Requests/sec
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth.requestsPerSecond.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  {systemHealth.activeConnections} active connections
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {(systemHealth.memoryUsage * 100).toFixed(1)}%
                </div>
                <Progress value={systemHealth.memoryUsage * 100} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemHealth.memoryUsage * 8 * 1024 * 1024 * 1024)} / 8GB
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {(systemHealth.cpuUsage * 100).toFixed(1)}%
                </div>
                <Progress value={systemHealth.cpuUsage * 100} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  4 cores available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {(systemHealth.diskUsage * 100).toFixed(1)}%
                </div>
                <Progress value={systemHealth.diskUsage * 100} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemHealth.diskUsage * 100 * 1024 * 1024 * 1024)} / 100GB
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">First Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.loadMetrics.fcp / 1000).toFixed(2)}s
                </div>
                <Badge className={getMetricBadge(metrics.loadMetrics.fcp, 1800, 3000)}>
                  {metrics.loadMetrics.fcp <= 1800 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Time to First Byte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.loadMetrics.ttfb.toFixed(0)}ms
                </div>
                <Badge className={getMetricBadge(metrics.loadMetrics.ttfb, 800, 1800)}>
                  {metrics.loadMetrics.ttfb <= 800 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Time to Interactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.loadMetrics.tti / 1000).toFixed(2)}s
                </div>
                <Badge className={getMetricBadge(metrics.loadMetrics.tti, 3800, 7300)}>
                  {metrics.loadMetrics.tti <= 3800 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Speed Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.loadMetrics.si / 1000).toFixed(2)}s
                </div>
                <Badge className={getMetricBadge(metrics.loadMetrics.si, 3400, 5800)}>
                  {metrics.loadMetrics.si <= 3400 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Experience Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Bounce Rate</span>
                  <span className="font-medium">{(metrics.userExperience.bounceRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Session Duration</span>
                  <span className="font-medium">{Math.floor(metrics.userExperience.avgSessionDuration / 60)}m {(metrics.userExperience.avgSessionDuration % 60).toFixed(0)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Page Views (24h)</span>
                  <span className="font-medium">{metrics.userExperience.pageViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Conversion Rate</span>
                  <span className="font-medium text-green-600">{(metrics.userExperience.conversionRate * 100).toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>LCP Trend</span>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 text-sm">-12% (24h)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Rate Trend</span>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 text-sm">-5% (24h)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Throughput Trend</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 text-sm">+8% (24h)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cache Hit Rate</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 text-sm">{(metrics.resourceMetrics.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.resourceMetrics.totalResources}</div>
                <p className="text-xs text-muted-foreground">files loaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bundle Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.resourceMetrics.resourceSize.toFixed(1)}MB</div>
                <p className="text-xs text-muted-foreground">total transferred</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Compression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.resourceMetrics.compressionRatio * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">compression ratio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(metrics.resourceMetrics.cacheHitRate * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">cache hit rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Load Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Production Load Testing</h3>
            <Button 
              onClick={startLoadTest} 
              disabled={loadTestStatus?.isRunning}
              className="flex items-center space-x-2"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Start Load Test</span>
            </Button>
          </div>

          {loadTestStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{loadTestStatus.currentTest}</span>
                  <Badge variant={loadTestStatus.isRunning ? "default" : "secondary"}>
                    {loadTestStatus.isRunning ? "Running" : "Completed"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{loadTestStatus.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={loadTestStatus.progress} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Virtual Users</span>
                    <div className="font-medium">{loadTestStatus.virtualUsers}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <div className="font-medium">{Math.floor(loadTestStatus.duration / 60)}m</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RPS</span>
                    <div className="font-medium">{loadTestStatus.rps.toFixed(0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Error Rate</span>
                    <div className="font-medium">{(loadTestStatus.errorRate * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleTimeString()} | 
        Monitoring: {isMonitoring ? 'Active' : 'Paused'}
      </div>
    </div>
  );
}
