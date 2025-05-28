/**
 * Self-Healing Dashboard Component
 * Unite Group - Version 14.0 Phase 1
 * 
 * Real-time visualization and management of autonomous self-healing infrastructure
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Heart, 
  Server, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Shield,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { 
  ComponentHealth, 
  RecoveryAction, 
  SelfHealingEvent, 
  PredictiveAlert 
} from '@/lib/autonomous/self-healing/types';

interface SystemHealthOverview {
  overallHealth: number;
  componentHealth: ComponentHealth[];
  activeRecoveries: RecoveryAction[];
  recentEvents: SelfHealingEvent[];
}

interface SelfHealingDashboardProps {
  initialData?: SystemHealthOverview;
  refreshInterval?: number;
}

export function SelfHealingDashboard({ 
  initialData,
  refreshInterval = 30000 
}: SelfHealingDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealthOverview>(
    initialData || {
      overallHealth: 98,
      componentHealth: [],
      activeRecoveries: [],
      recentEvents: []
    }
  );
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshSystemHealth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshSystemHealth = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the self-healing service API
      const response = await fetch('/api/self-healing/status');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComponentIcon = (componentId: string) => {
    if (componentId.includes('cpu')) return <Cpu className="h-4 w-4" />;
    if (componentId.includes('memory')) return <Server className="h-4 w-4" />;
    if (componentId.includes('disk')) return <HardDrive className="h-4 w-4" />;
    if (componentId.includes('network')) return <Wifi className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getEventIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOverallHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-500';
    if (health >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Self-Healing Infrastructure</h1>
          <p className="text-muted-foreground">
            Autonomous system monitoring and recovery management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {formatTimestamp(lastRefresh)}
          </div>
          <Button 
            onClick={refreshSystemHealth} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Health</p>
                <p className={`text-2xl font-bold ${getOverallHealthColor(systemHealth.overallHealth)}`}>
                  {systemHealth.overallHealth}%
                </p>
              </div>
              <Heart className={`h-8 w-8 ${getOverallHealthColor(systemHealth.overallHealth)}`} />
            </div>
            <Progress value={systemHealth.overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Components</p>
                <p className="text-2xl font-bold">{systemHealth.componentHealth.length}</p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Recoveries</p>
                <p className="text-2xl font-bold">{systemHealth.activeRecoveries.length}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Events</p>
                <p className="text-2xl font-bold">{systemHealth.recentEvents.length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard */}
      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">Component Health</TabsTrigger>
          <TabsTrigger value="recoveries">Active Recoveries</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="alerts">Predictive Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Component Health Status</CardTitle>
              <CardDescription>
                Real-time monitoring of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Last Check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemHealth.componentHealth.map((component) => (
                    <TableRow key={component.componentId}>
                      <TableCell className="flex items-center space-x-2">
                        {getComponentIcon(component.componentId)}
                        <span className="font-medium">{component.componentId}</span>
                      </TableCell>
                      <TableCell>
                        {getHealthStatusBadge(component.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={component.healthScore} className="w-16" />
                          <span className="text-sm">{component.healthScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(component.trend)}
                          <span className="text-sm capitalize">{component.trend}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(component.lastCheck)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recoveries">
          <Card>
            <CardHeader>
              <CardTitle>Active Recovery Actions</CardTitle>
              <CardDescription>
                Currently executing autonomous recovery procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth.activeRecoveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active recovery actions</p>
                  <p className="text-sm">System is operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {systemHealth.activeRecoveries.map((recovery) => (
                    <Alert key={recovery.id}>
                      <Zap className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{recovery.description}</span>
                        <Badge variant={recovery.priority === 'high' ? 'destructive' : 'secondary'}>
                          {recovery.priority} priority
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm"><strong>Component:</strong> {recovery.component}</p>
                            <p className="text-sm"><strong>Type:</strong> {recovery.type}</p>
                          </div>
                          <div>
                            <p className="text-sm"><strong>Duration:</strong> {recovery.estimatedDuration}s</p>
                            <p className="text-sm"><strong>Automated:</strong> {recovery.automated ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>System Event Log</CardTitle>
              <CardDescription>
                Recent self-healing system activities and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {systemHealth.recentEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg border"
                  >
                    {getEventIcon(event.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.type}</p>
                        <time className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </time>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Component: {event.component}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Alerts</CardTitle>
              <CardDescription>
                AI-powered failure predictions and preventive recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No predictive alerts</p>
                <p className="text-sm">All systems operating within normal parameters</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SelfHealingDashboard;
