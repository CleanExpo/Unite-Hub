'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Cpu, 
  Database, 
  Network, 
  Shield, 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Globe
} from 'lucide-react';

interface InfrastructureNode {
  id: string;
  name: string;
  type: 'server' | 'database' | 'network' | 'security';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  location: string;
  lastCheck: string;
}

interface SystemMetrics {
  totalNodes: number;
  healthyNodes: number;
  warningNodes: number;
  criticalNodes: number;
  averageCpu: number;
  averageMemory: number;
  totalUptime: number;
  responseTime: number;
  error?: string;
  timestamp: string;
  metrics?: Record<string, any>;
}

export default function AutonomousInfrastructureDashboard() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Mock data loading
    const loadInfrastructureData = async () => {
      try {
        setLoading(true);
        
        // Mock infrastructure nodes data
        const mockNodes: InfrastructureNode[] = [
          {
            id: '1',
            name: 'Web Server 01',
            type: 'server',
            status: 'healthy',
            cpu: 45,
            memory: 68,
            disk: 32,
            network: 78,
            uptime: 99.8,
            location: 'US-East-1',
            lastCheck: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            name: 'Database Primary',
            type: 'database',
            status: 'healthy',
            cpu: 72,
            memory: 85,
            disk: 56,
            network: 45,
            uptime: 99.9,
            location: 'US-East-1',
            lastCheck: '2024-01-15T10:29:45Z'
          },
          {
            id: '3',
            name: 'Load Balancer',
            type: 'network',
            status: 'warning',
            cpu: 89,
            memory: 76,
            disk: 23,
            network: 92,
            uptime: 98.5,
            location: 'US-West-2',
            lastCheck: '2024-01-15T10:29:30Z'
          },
          {
            id: '4',
            name: 'Security Gateway',
            type: 'security',
            status: 'healthy',
            cpu: 34,
            memory: 42,
            disk: 18,
            network: 67,
            uptime: 99.7,
            location: 'EU-West-1',
            lastCheck: '2024-01-15T10:29:15Z'
          },
          {
            id: '5',
            name: 'API Server 02',
            type: 'server',
            status: 'critical',
            cpu: 95,
            memory: 98,
            disk: 87,
            network: 23,
            uptime: 87.2,
            location: 'Asia-Pacific',
            lastCheck: '2024-01-15T10:28:00Z'
          }
        ];

        // Mock system metrics
        const mockMetrics: SystemMetrics = {
          totalNodes: mockNodes.length,
          healthyNodes: mockNodes.filter(n => n.status === 'healthy').length,
          warningNodes: mockNodes.filter(n => n.status === 'warning').length,
          criticalNodes: mockNodes.filter(n => n.status === 'critical').length,
          averageCpu: mockNodes.reduce((sum, n) => sum + n.cpu, 0) / mockNodes.length,
          averageMemory: mockNodes.reduce((sum, n) => sum + n.memory, 0) / mockNodes.length,
          totalUptime: mockNodes.reduce((sum, n) => sum + n.uptime, 0) / mockNodes.length,
          responseTime: 145,
          timestamp: new Date().toISOString()
        };

        setNodes(mockNodes);
        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to load infrastructure data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInfrastructureData();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadInfrastructureData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Server className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'network':
        return <Network className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 75) return 'text-yellow-600';
    if (usage >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    if (usage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading Infrastructure Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Autonomous Infrastructure
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time monitoring and management of your infrastructure
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalNodes}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.healthyNodes} healthy, {metrics.warningNodes} warning, {metrics.criticalNodes} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((metrics.healthyNodes / metrics.totalNodes) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Overall health score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUsageColor(metrics.averageCpu)}`}>
                {metrics.averageCpu.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Across all nodes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Critical Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Nodes requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {nodes.filter(n => n.status === 'critical' || n.status === 'warning').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">All systems are running normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nodes.filter(n => n.status === 'critical' || n.status === 'warning').map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                          {getTypeIcon(node.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{node.name}</h3>
                          <p className="text-sm text-gray-500">{node.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getUsageColor(node.cpu)}`}>
                            CPU: {node.cpu}%
                          </div>
                          <div className={`text-sm font-medium ${getUsageColor(node.memory)}`}>
                            Memory: {node.memory}%
                          </div>
                        </div>
                        {getStatusBadge(node.status)}
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resource Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Overview</CardTitle>
              <CardDescription>Current resource utilization across all nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Cpu className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className={`text-2xl font-bold ${getUsageColor(metrics?.averageCpu || 0)}`}>
                    {metrics?.averageCpu.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">CPU Usage</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                  <div className={`text-2xl font-bold ${getUsageColor(metrics?.averageMemory || 0)}`}>
                    {metrics?.averageMemory.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Memory Usage</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Network className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {nodes.reduce((sum, n) => sum + n.network, 0) / nodes.length}%
                  </div>
                  <div className="text-sm text-gray-500">Network Usage</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {metrics?.totalUptime.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Nodes</CardTitle>
              <CardDescription>Detailed view of all infrastructure components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nodes.map((node) => (
                  <Card key={node.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getTypeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {node.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {node.type} • {node.location} • Last check: {new Date(node.lastCheck).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(node.status)}
                          {getStatusBadge(node.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU</span>
                            <span className={getUsageColor(node.cpu)}>{node.cpu}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageBarColor(node.cpu)}`}
                              style={{ width: `${node.cpu}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memory</span>
                            <span className={getUsageColor(node.memory)}>{node.memory}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageBarColor(node.memory)}`}
                              style={{ width: `${node.memory}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Disk</span>
                            <span className={getUsageColor(node.disk)}>{node.disk}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageBarColor(node.disk)}`}
                              style={{ width: `${node.disk}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Network</span>
                            <span className={getUsageColor(node.network)}>{node.network}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageBarColor(node.network)}`}
                              style={{ width: `${node.network}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                          Uptime: {node.uptime}%
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Restart
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

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>Live performance metrics and system monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Monitoring Dashboard
                </h3>
                <p className="text-gray-500 mb-4">
                  Real-time charts and monitoring data will be displayed here
                </p>
                <Button variant="outline">
                  View Full Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
