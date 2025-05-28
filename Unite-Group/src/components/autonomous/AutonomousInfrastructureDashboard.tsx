'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Zap, 
  Bot,
  Server,
  Cpu,
  HardDrive,
  Network,
  Clock
} from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: string;
  metrics?: Record<string, any>;
}

interface AutoRepairAction {
  id: string;
  service: string;
  issue: string;
  action: 'restart' | 'scale' | 'optimize' | 'failover';
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
}

interface InfrastructureData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: SystemMetrics | null;
  healthChecks: Record<string, HealthCheckResult>;
  repairActions: AutoRepairAction[];
  timestamp: string;
}

export default function AutonomousInfrastructureDashboard() {
  const [data, setData] = useState<InfrastructureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/autonomous-infrastructure');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch infrastructure data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceHealthCheck = async () => {
    try {
      await fetch('/api/autonomous-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-health-check' })
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to force health check:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading autonomous infrastructure data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load infrastructure data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Autonomous Infrastructure</h1>
            <p className="text-muted-foreground">
              Version 14.0 - AI-Powered Self-Healing System
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={forceHealthCheck} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Check
          </Button>
          <Badge variant={data.status === 'healthy' ? 'default' : 'destructive'}>
            {data.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className={getStatusColor(data.status)}>
              {getStatusIcon(data.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{data.status}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(data.healthChecks).length} services monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics?.uptime.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.metrics?.responseTime.toFixed(0)}ms avg response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Repairs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.repairActions.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.repairActions.filter(a => a.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics?.throughput.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              requests/min, {data.metrics?.errorRate.toFixed(1)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      {data.metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5" />
              <span>System Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>{data.metrics.cpu.toFixed(1)}%</span>
                </div>
                <Progress value={data.metrics.cpu} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory</span>
                  <span>{data.metrics.memory.toFixed(1)}%</span>
                </div>
                <Progress value={data.metrics.memory} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disk Usage</span>
                  <span>{data.metrics.disk.toFixed(1)}%</span>
                </div>
                <Progress value={data.metrics.disk} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Network</span>
                  <span>{data.metrics.network.toFixed(1)}%</span>
                </div>
                <Progress value={data.metrics.network} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Service Health Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.healthChecks).map(([service, health]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={getStatusColor(health.status)}>
                    {getStatusIcon(health.status)}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{service.replace('-', ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {health.responseTime}ms
                    </div>
                  </div>
                </div>
                <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                  {health.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Auto-Repair Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Autonomous Repair Actions</span>
          </CardTitle>
          <CardDescription>
            Real-time self-healing operations performed by the AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.repairActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p>No repair actions needed - system running optimally!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.repairActions.slice(0, 5).map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getSeverityColor(action.severity)}>
                        {action.severity}
                      </Badge>
                      <span className="font-medium">{action.service}</span>
                      <span className="text-sm text-muted-foreground">
                        • {action.action}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.issue}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        {new Date(action.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                    {action.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdate?.toLocaleString()} • Auto-refresh every 30 seconds
      </div>
    </div>
  );
}
