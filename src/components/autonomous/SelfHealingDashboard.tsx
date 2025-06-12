'use client';

/**
 * Self-Healing Dashboard Component
 * Unite Group - Version 14.0 Phase 1
 * 
 * Real-time visualization and management of autonomous self-healing infrastructure
 */

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

// Mock types for demonstration
interface ComponentHealth {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  health: number;
  trend: 'improving' | 'declining' | 'stable';
  lastCheck: Date;
}

interface RecoveryAction {
  id: string;
  component: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  automated: boolean;
}

interface SelfHealingEvent {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  component: string;
  message: string;
  action?: string;
}

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

  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshSystemHealth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshSystemHealth = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch('/api/self-healing/status');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
        setLastRefresh(new Date());
      }
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
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComponentIcon = (componentId: string) => {
    if (componentId.includes('cpu')) return <Cpu className="h-4 w-4" />;
    if (componentId.includes('server')) return <Server className="h-4 w-4" />;
    if (componentId.includes('storage')) return <HardDrive className="h-4 w-4" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Self-Healing Infrastructure</h1>
          <p className="text-muted-foreground">
            Monitor and manage autonomous system recovery
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {formatTimestamp(lastRefresh)}
          </div>
          <Button 
            onClick={refreshSystemHealth}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getOverallHealthColor(systemHealth.overallHealth)}>
                {systemHealth.overallHealth}%
              </span>
            </div>
            <Progress value={systemHealth.overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Components</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{systemHealth.componentHealth.length}</div>
            <p className="text-xs text-muted-foreground">
              Monitored systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recoveries</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{systemHealth.activeRecoveries.length}</div>
            <p className="text-xs text-muted-foreground">
              Self-healing actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{systemHealth.recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">Component Health</TabsTrigger>
          <TabsTrigger value="recoveries">Active Recoveries</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Health Status</CardTitle>
              <CardDescription>
                Real-time health monitoring of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Last Check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemHealth.componentHealth.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getComponentIcon(component.id)}
                          <span>{component.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getHealthStatusBadge(component.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={component.health} className="w-16" />
                          <span className="text-sm">{component.health}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTrendIcon(component.trend)}
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

        <TabsContent value="recoveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Recovery Actions</CardTitle>
              <CardDescription>
                Ongoing autonomous healing processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.activeRecoveries.map((recovery) => (
                  <div key={recovery.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{recovery.component}</span>
                      </div>
                      <Badge variant={recovery.status === 'running' ? 'default' : 'secondary'}>
                        {recovery.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {recovery.action}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm"><strong>Started:</strong> {formatTimestamp(recovery.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm"><strong>Automated:</strong> {recovery.automated ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Event Log</CardTitle>
              <CardDescription>
                Recent system events and healing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 border-b pb-3">
                    <div className="mt-1">
                      {getEventIcon(event.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Component: {event.component}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.message}
                      </p>
                      {event.action && (
                        <p className="text-xs text-blue-600 mt-1">
                          Action: {event.action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SelfHealingDashboard;
