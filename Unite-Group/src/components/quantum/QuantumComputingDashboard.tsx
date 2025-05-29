/**
 * Quantum Computing Dashboard
 * Advanced quantum computing interface for business optimization
 * 
 * This component provides a comprehensive interface for quantum computing operations,
 * optimization problems, machine learning, and quantum security features.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Atom, 
  Zap, 
  Shield, 
  Brain, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Cpu,
  Clock,
  BarChart3,
  Lightbulb,
  Gauge,
  Sparkles,
  Rocket
} from 'lucide-react';

// Types for quantum dashboard data
interface QuantumStatus {
  available: boolean;
  backend: string;
  qubits: number;
  coherence: number;
  errorRate: number;
  connectivity: string;
}

interface OptimizationMetrics {
  initialized: boolean;
  optimizationsCompleted: number;
  averageSpeedup: number;
  successRate: number;
  cacheHitRate: number;
}

interface PerformanceData {
  maxSpeedupAchieved: number;
  quantumAdvantageProblems: string[];
  supportedAlgorithms: string[];
}

interface OptimizationJob {
  id: string;
  type: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  quantumAdvantage: number;
  startTime: Date;
  duration?: number;
  accuracy?: number;
}

interface QuantumMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export function QuantumComputingDashboard() {
  const [quantumStatus, setQuantumStatus] = useState<QuantumStatus | null>(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState<OptimizationMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [activeJobs, setActiveJobs] = useState<OptimizationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch quantum system status
  useEffect(() => {
    fetchQuantumStatus();
    const interval = setInterval(fetchQuantumStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQuantumStatus = async () => {
    try {
      const response = await fetch('/api/quantum-enhanced');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuantumStatus(data.data.quantum);
          setOptimizationMetrics(data.data.optimization);
          setPerformance(data.data.performance);
          
          // Generate some active jobs for demonstration
          setActiveJobs(generateActiveJobs());
        }
      }
    } catch (error) {
      console.error('Failed to fetch quantum status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateActiveJobs = (): OptimizationJob[] => {
    return [
      {
        id: 'opt_001',
        type: 'PORTFOLIO_OPTIMIZATION',
        status: 'RUNNING',
        quantumAdvantage: 5.2,
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        accuracy: 0.96
      },
      {
        id: 'opt_002',
        type: 'SUPPLY_CHAIN',
        status: 'COMPLETED',
        quantumAdvantage: 8.7,
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
        duration: 280,
        accuracy: 0.98
      },
      {
        id: 'opt_003',
        type: 'RESOURCE_ALLOCATION',
        status: 'QUEUED',
        quantumAdvantage: 3.4,
        startTime: new Date(),
        accuracy: 0.94
      }
    ];
  };

  const executeQuantumOperation = async (operation: string) => {
    try {
      setIsLoading(true);
      
      let requestBody;
      switch (operation) {
        case 'portfolio':
          requestBody = {
            operation: 'portfolio',
            assets: [
              { id: 'AAPL', name: 'Apple Inc.', expectedReturn: 0.12, risk: 0.18 },
              { id: 'GOOGL', name: 'Alphabet Inc.', expectedReturn: 0.15, risk: 0.22 },
              { id: 'MSFT', name: 'Microsoft Corp.', expectedReturn: 0.13, risk: 0.19 },
              { id: 'TSLA', name: 'Tesla Inc.', expectedReturn: 0.25, risk: 0.35 }
            ],
            constraints: [{ type: 'max_risk', value: 0.25 }],
            objectives: [
              { type: 'MAXIMIZE', weight: 0.7 },
              { type: 'MINIMIZE', weight: 0.3 }
            ]
          };
          break;
        case 'quantum-ml':
          requestBody = {
            operation: 'quantum-ml',
            modelType: 'QNN',
            dataset: {
              features: Array.from({ length: 100 }, () => Array.from({ length: 4 }, () => Math.random())),
              labels: Array.from({ length: 100 }, () => Math.round(Math.random())),
              encoding: 'amplitude'
            }
          };
          break;
        case 'quantum-security':
          requestBody = {
            operation: 'quantum-security',
            protocol: 'QKD',
            keyLength: 256,
            securityLevel: 'ENTERPRISE'
          };
          break;
        case 'benchmark':
          requestBody = {
            operation: 'benchmark',
            problemSize: 16,
            algorithm: 'QAOA',
            iterations: 100
          };
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const response = await fetch('/api/quantum-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Quantum operation result:', result);
        
        // Update active jobs
        const newJob: OptimizationJob = {
          id: `opt_${Date.now()}`,
          type: operation.toUpperCase(),
          status: 'COMPLETED',
          quantumAdvantage: result.quantumAdvantage || 1.0,
          startTime: new Date(Date.now() - 1000),
          duration: 150,
          accuracy: 0.95
        };
        
        setActiveJobs(prev => [newJob, ...prev.slice(0, 4)]);
        
        // Refresh status
        await fetchQuantumStatus();
      }
    } catch (error) {
      console.error('Quantum operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'QUEUED': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Activity className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'FAILED': return <AlertTriangle className="h-4 w-4" />;
      case 'QUEUED': return <Clock className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  const quantumMetrics: QuantumMetric[] = [
    {
      name: 'Quantum Coherence',
      value: quantumStatus?.coherence ? quantumStatus.coherence * 100 : 0,
      unit: '%',
      trend: 'up',
      description: 'Quantum state coherence time'
    },
    {
      name: 'Error Rate',
      value: quantumStatus?.errorRate ? quantumStatus.errorRate * 100 : 0,
      unit: '%',
      trend: 'down',
      description: 'Quantum gate error rate'
    },
    {
      name: 'Success Rate',
      value: optimizationMetrics?.successRate ? optimizationMetrics.successRate * 100 : 0,
      unit: '%',
      trend: 'up',
      description: 'Optimization success rate'
    },
    {
      name: 'Average Speedup',
      value: optimizationMetrics?.averageSpeedup || 0,
      unit: 'x',
      trend: 'up',
      description: 'Quantum vs classical speedup'
    }
  ];

  if (isLoading && !quantumStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Atom className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <p className="text-lg font-medium">Initializing Quantum Computing Interface...</p>
          <p className="text-sm text-muted-foreground">Connecting to quantum processors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Atom className="h-8 w-8 text-blue-500" />
            Quantum Computing Center
          </h1>
          <p className="text-muted-foreground">
            Advanced quantum-enhanced business optimization and AI computing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={quantumStatus?.available ? 'default' : 'destructive'} className="gap-1">
            <Sparkles className="h-3 w-3" />
            {quantumStatus?.available ? 'Quantum Online' : 'Quantum Offline'}
          </Badge>
        </div>
      </div>

      {/* System Status Alert */}
      {quantumStatus && (
        <Alert className={quantumStatus.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            Quantum Backend: <strong>{quantumStatus.backend}</strong> | 
            Qubits: <strong>{quantumStatus.qubits}</strong> | 
            Connectivity: <strong>{quantumStatus.connectivity}</strong> | 
            Optimizations Completed: <strong>{optimizationMetrics?.optimizationsCompleted || 0}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quantumMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value.toFixed(1)}{metric.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              <div className="mt-2">
                <Progress 
                  value={Math.min(metric.value, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations">Quantum Operations</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Engine</TabsTrigger>
          <TabsTrigger value="security">Quantum Security</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Quantum Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Operation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quantum Operations
                </CardTitle>
                <CardDescription>
                  Execute quantum-enhanced business optimization problems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Button 
                    onClick={() => executeQuantumOperation('portfolio')}
                    disabled={isLoading}
                    className="justify-start gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Portfolio Optimization
                  </Button>
                  <Button 
                    onClick={() => executeQuantumOperation('quantum-ml')}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Quantum Machine Learning
                  </Button>
                  <Button 
                    onClick={() => executeQuantumOperation('quantum-security')}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Quantum Security Keys
                  </Button>
                  <Button 
                    onClick={() => executeQuantumOperation('benchmark')}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Performance Benchmark
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Quantum Jobs
                </CardTitle>
                <CardDescription>
                  Current and recent quantum optimization jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{job.type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.quantumAdvantage.toFixed(1)}x speedup • {job.accuracy && `${(job.accuracy * 100).toFixed(1)}% accuracy`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Engine Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Algorithms</CardTitle>
                <CardDescription>Supported quantum optimization algorithms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performance?.supportedAlgorithms.map((algorithm) => (
                    <div key={algorithm} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{algorithm}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problem Types</CardTitle>
                <CardDescription>Business problems with quantum advantage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performance?.quantumAdvantageProblems.map((problem) => (
                    <div key={problem} className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{problem.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engine Statistics</CardTitle>
                <CardDescription>Optimization engine performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimizations</span>
                    <span className="font-medium">{optimizationMetrics?.optimizationsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="font-medium">{((optimizationMetrics?.cacheHitRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Max Speedup</span>
                    <span className="font-medium">{performance?.maxSpeedupAchieved.toFixed(1)}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quantum Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quantum Security Protocols
                </CardTitle>
                <CardDescription>
                  Quantum-safe cryptography and security features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quantum Key Distribution (QKD)</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quantum Random Number Generation</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Post-Quantum Cryptography</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quantum Digital Signatures</span>
                      <Badge className="bg-blue-500">Ready</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Metrics</CardTitle>
                <CardDescription>Quantum security system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Level</span>
                    <Badge className="bg-green-500">ENTERPRISE</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Key Length</span>
                    <span className="font-medium">256 bits</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quantum Resistant</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Strength</span>
                    <span className="font-medium">512 bits</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quantum Performance Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive performance metrics and quantum advantage analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Quantum Advantage</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {performance?.maxSpeedupAchieved.toFixed(1)}x
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum speedup achieved over classical computing
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Success Rate</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {((optimizationMetrics?.successRate || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Successful quantum optimization rate
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Quantum Coherence</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      {((quantumStatus?.coherence || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current quantum state coherence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
