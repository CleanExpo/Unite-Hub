/**
 * AI Dashboard Component
 * Real-time monitoring and control center for AI systems
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  Brain, 
  Shield, 
  Rocket, 
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISystemStatus {
  monitoring: {
    status: 'active' | 'inactive' | 'error';
    metrics: Record<string, unknown>;
    alerts: number;
  };
  predictions: {
    active: number;
    critical: number;
    accuracy: number;
  };
  security: {
    threats: number;
    activeResponses: number;
    lastScan: Date;
  };
  performance: {
    optimizations: number;
    resourceUtilization: Record<string, unknown>;
    improvements: number;
  };
  deployment: {
    active: number;
    pending: number;
    lastDeployment?: Date;
  };
}

export function AIDashboard() {
  const [status, setStatus] = useState<AISystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch AI system status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/monitor');
      if (!response.ok) throw new Error('Failed to fetch AI status');
      
      const data = await response.json();
      setStatus(data.status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI System Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and control of AI components
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'default' : 'outline'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={status.monitoring.status === 'active' ? 'default' : 'destructive'}
                className={cn(
                  'text-sm',
                  status.monitoring.status === 'active' && 'bg-green-500'
                )}
              >
                {status.monitoring.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {status.monitoring.alerts} active alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.predictions.active}</div>
            <p className="text-xs text-muted-foreground">
              {status.predictions.critical} critical • {(status.predictions.accuracy * 100).toFixed(0)}% accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.security.threats}</div>
            <p className="text-xs text-muted-foreground">
              {status.security.activeResponses} active mitigations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.deployment.active}</div>
            <p className="text-xs text-muted-foreground">
              {status.deployment.pending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>
                Real-time system performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsDisplay metrics={status.monitoring.metrics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Predictions</CardTitle>
              <CardDescription>
                AI-generated failure predictions and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictionsDisplay />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection</CardTitle>
              <CardDescription>
                Active security threats and mitigation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThreatsDisplay />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
              <CardDescription>
                Resource utilization and optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceDisplay 
                utilization={status.performance.resourceUtilization}
                optimizations={status.performance.optimizations}
                improvements={status.performance.improvements}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>
                Active and recent deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeploymentsDisplay />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each tab
function MetricsDisplay({ metrics }: { metrics: Record<string, unknown> }) {
  const cpuData = metrics.cpu as { usage?: number } | undefined;
  const memoryData = metrics.memory as { percentage?: number } | undefined;
  const diskData = metrics.disk as { percentage?: number } | undefined;
  const networkData = metrics.network as { bytesPerSecond?: number } | undefined;
  
  const cpu = cpuData?.usage || 0;
  const memory = memoryData?.percentage || 0;
  const disk = diskData?.percentage || 0;
  const network = networkData?.bytesPerSecond || 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">CPU Usage</span>
          <span className="text-sm text-muted-foreground">{cpu}%</span>
        </div>
        <Progress value={cpu} className="h-2" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Memory Usage</span>
          <span className="text-sm text-muted-foreground">{memory}%</span>
        </div>
        <Progress value={memory} className="h-2" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Disk Usage</span>
          <span className="text-sm text-muted-foreground">{disk}%</span>
        </div>
        <Progress value={disk} className="h-2" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network I/O</span>
          <span className="text-sm text-muted-foreground">
            {(network / 1024 / 1024).toFixed(2)} MB/s
          </span>
        </div>
      </div>
    </div>
  );
}

interface Prediction {
  component: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  timeToFailure: number;
}

function PredictionsDisplay() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/predictions')
      .then((res: Response) => res.json())
      .then((data: { activePredictions?: Prediction[] }) => {
        setPredictions(data.activePredictions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading predictions...</div>;

  return (
    <div className="space-y-3">
      {predictions.length === 0 ? (
        <p className="text-muted-foreground">No active predictions</p>
      ) : (
        predictions.map((pred, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border">
            <AlertTriangle className={cn(
              'h-5 w-5 mt-0.5',
              pred.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
            )} />
            <div className="flex-1">
              <p className="font-medium">{pred.component}</p>
              <p className="text-sm text-muted-foreground">{pred.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {(pred.probability * 100).toFixed(0)}% probability
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {pred.timeToFailure}h to failure
                </Badge>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface Threat {
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigation_status: string;
}

function ThreatsDisplay() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/threats')
      .then((res: Response) => res.json())
      .then((data: { activeThreats?: Threat[] }) => {
        setThreats(data.activeThreats || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading threats...</div>;

  return (
    <div className="space-y-3">
      {threats.length === 0 ? (
        <p className="text-muted-foreground">No active threats detected</p>
      ) : (
        threats.map((threat, i) => (
          <Alert key={i} variant={threat.severity === 'critical' ? 'destructive' : 'default'}>
            <Shield className="h-4 w-4" />
            <AlertTitle>{threat.type}</AlertTitle>
            <AlertDescription>
              {threat.description}
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {threat.mitigation_status}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        ))
      )}
    </div>
  );
}

function PerformanceDisplay({ 
  utilization, 
  optimizations, 
  improvements 
}: { 
  utilization: Record<string, unknown>;
  optimizations: number;
  improvements: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Optimizations Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optimizations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <TrendingUp className="h-5 w-5 mr-1 text-green-500" />
              {improvements}%
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Resource Allocation</h4>
        <div className="text-xs text-muted-foreground">
          <pre>{JSON.stringify(utilization, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

interface Deployment {
  name: string;
  version: string;
  strategy: string;
  status: 'completed' | 'failed' | 'pending' | 'deploying';
  progress?: number;
  currentPhase?: string;
}

function DeploymentsDisplay() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/deployments')
      .then((res: Response) => res.json())
      .then((data: { activeDeployments?: Deployment[] }) => {
        setDeployments(data.activeDeployments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading deployments...</div>;

  return (
    <div className="space-y-3">
      {deployments.length === 0 ? (
        <p className="text-muted-foreground">No active deployments</p>
      ) : (
        deployments.map((deployment, i) => (
          <div key={i} className="p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{deployment.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Version {deployment.version} • {deployment.strategy}
                </p>
              </div>
              <Badge variant={
                deployment.status === 'completed' ? 'default' :
                deployment.status === 'failed' ? 'destructive' : 'outline'
              }>
                {deployment.status}
              </Badge>
            </div>
            {deployment.progress !== undefined && deployment.progress < 100 && (
              <div className="mt-3">
                <Progress value={deployment.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {deployment.currentPhase}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
